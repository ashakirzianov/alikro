// Does the MCP plugin's per-key capability toggle actually fire?
//
//   PROBE_MCP_KEY=<full> PROBE_MCP_KEY_RO=<find-only> npx tsx payload/probe/mcp-capability-gate.ts
//
// The plugin's pitch is that an admin can hand an agent a key that reads but
// cannot write, per collection, and revoke it live. That is the whole reason the
// plugin ships its own key collection instead of reusing `users.apiKey`. This
// asserts the claim from both ends: the full key must expose write tools, and
// the read-only key must not — otherwise the toggle is decoration.
//
// A key that simply "did not write anything" is not evidence. The check is that
// the write tools are ABSENT from the read-only key's registry, and that calling
// one anyway is refused.

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const BASE = process.env.PROBE_BASE ?? 'http://localhost:5733'

async function toolsFor(key: string) {
    const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/api/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${key}` } },
    })
    const client = new Client({ name: 'criterion-4-capability-gate', version: '1.0.0' })
    await client.connect(transport)
    const { tools } = await client.listTools()
    return { client, names: tools.map(tool => tool.name) }
}

async function main() {
    const full = process.env.PROBE_MCP_KEY
    const readOnly = process.env.PROBE_MCP_KEY_RO
    if (!full || !readOnly) {
        throw new Error('both PROBE_MCP_KEY and PROBE_MCP_KEY_RO are required')
    }

    const fullSurface = await toolsFor(full)
    const roSurface = await toolsFor(readOnly)

    console.log(`full key      (${fullSurface.names.length} tools): ${fullSurface.names.join(', ')}`)
    console.log(`read-only key (${roSurface.names.length} tools): ${roSurface.names.join(', ')}`)

    const fullWrites = fullSurface.names.filter(isWrite)
    const roWrites = roSurface.names.filter(isWrite)

    if (fullWrites.length === 0) {
        throw new Error('the full key exposes no write tools — the control test failed, so the read-only result would prove nothing')
    }
    console.log(`\nPASS  control: full key exposes ${fullWrites.length} write tool(s) — ${fullWrites.join(', ')}`)

    if (roWrites.length > 0) {
        console.error(`FAIL  the read-only key still exposes: ${roWrites.join(', ')}`)
        process.exit(1)
    }
    console.log(`PASS  read-only key exposes 0 write tools — the toggle removes them from the registry, it does not merely refuse them`)

    // Call one anyway. A model that has cached the tool list, or one talking to
    // the endpoint by hand, should not get through.
    const TARGET_ID = '636'
    const titleBefore = await readTitle(fullSurface.client, TARGET_ID)
    const POISON = 'capability-gate probe should never land this'

    let refusal = 'ACCEPTED — the call went through'
    try {
        const result = await roSurface.client.callTool({
            name: 'updateArtworks',
            arguments: { id: TARGET_ID, title: POISON },
        })
        const text = ((result.content ?? []) as Array<{ text?: string }>).map(part => part.text ?? '').join(' ')
        // Deliberately narrow: an earlier version matched /error/i, which would
        // have read a *successful* response mentioning the word "error" as a
        // refusal. Only the MCP transport's own unknown-tool signals count.
        refusal = /not found|unknown tool|not registered|-32601|-32602/i.test(text)
            ? `refused: ${text.slice(0, 120)}`
            : `ACCEPTED: ${text.slice(0, 200)}`
    } catch (error) {
        refusal = `refused: ${(error as Error).message}`
    }

    const gated = refusal.startsWith('refused')
    console.log(`${gated ? 'PASS' : 'FAIL'}  calling updateArtworks with the read-only key anyway — ${refusal}`)

    // A refusal message is what the SERVER said. Whether the write landed is a
    // separate question, and it is the one that matters — so read the record
    // back through the full key rather than trusting the refusal.
    const titleAfter = await readTitle(fullSurface.client, TARGET_ID)
    const unchanged = titleAfter === titleBefore && titleAfter !== POISON
    console.log(`${unchanged ? 'PASS' : 'FAIL'}  record ${TARGET_ID} re-read through the full key — title ${unchanged ? `unchanged (${titleAfter})` : `CHANGED to "${titleAfter}"`}`)

    await fullSurface.client.close()
    await roSurface.client.close()

    if (!gated || !unchanged) {
        process.exit(1)
    }
}

async function readTitle(client: Client, id: string) {
    const result = await client.callTool({
        name: 'findArtworks',
        arguments: { id, draft: true, depth: 0, select: JSON.stringify({ id: true, title: true }) },
    })
    const text = ((result.content ?? []) as Array<{ text?: string }>).map(part => part.text ?? '').join('\n')
    const braceAt = text.indexOf('{')
    if (braceAt === -1) {
        return undefined
    }
    try {
        return (JSON.parse(text.slice(braceAt)) as { title?: string }).title
    } catch {
        return undefined
    }
}

function isWrite(name: string) {
    return name.startsWith('create') || name.startsWith('update') || name.startsWith('delete')
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
