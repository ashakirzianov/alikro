// A thin MCP client on the command line, so something without an MCP-capable
// harness can still reach `/api/mcp`.
//
//   PROBE_MCP_KEY=… npx tsx payload/probe/mcp-cli.mts list
//   PROBE_MCP_KEY=… npx tsx payload/probe/mcp-cli.mts schema <toolName>
//   PROBE_MCP_KEY=… npx tsx payload/probe/mcp-cli.mts call <toolName> '<json args>'
//
// Written for the blind-driver run in PROBE-agent-operability.md: it hands over
// the MCP surface and nothing else — no repo, no docs, no Payload import. It
// deliberately does not pretty-print or reshape tool output, because how that
// output reads is part of what is being measured.

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const BASE = process.env.PROBE_BASE ?? 'http://localhost:5733'
const KEY = process.env.PROBE_MCP_KEY

if (!KEY) {
    console.error('PROBE_MCP_KEY is not set')
    process.exit(2)
}

const [command, toolName, rawArgs] = process.argv.slice(2)

const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/api/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${KEY}` } },
})
const client = new Client({ name: 'mcp-cli', version: '1.0.0' })
await client.connect(transport)

if (command === 'list') {
    const { tools } = await client.listTools()
    for (const tool of tools) {
        console.log(`${tool.name}: ${tool.description ?? ''}`)
    }
} else if (command === 'schema') {
    const { tools } = await client.listTools()
    const tool = tools.find(candidate => candidate.name === toolName)
    console.log(tool ? JSON.stringify(tool.inputSchema, null, 2) : `no such tool: ${toolName}`)
} else if (command === 'call') {
    const result = await client.callTool({ name: toolName!, arguments: JSON.parse(rawArgs ?? '{}') })
    for (const part of (result.content ?? []) as Array<{ text?: string, type: string }>) {
        console.log(part.text ?? `[${part.type}]`)
    }
} else {
    console.error('usage: list | schema <tool> | call <tool> <json>')
    process.exit(2)
}

await client.close()
