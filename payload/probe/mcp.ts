// Criterion-4 probe — the **MCP** surface.
//
//   PROBE_MCP_KEY=... npx tsx payload/probe/mcp.ts
//
// Payload ships a first-party MCP server, `@payloadcms/plugin-mcp`, mounted at
// `/api/mcp` by `agentSurface()` in payload.config.ts when `PAYLOAD_MCP` is set.
// This drives it with a real MCP client over streamable HTTP — the same
// transport an assistant would use — and runs the same three editorial tasks as
// `local-api.ts` and `rest.ts`.
//
// Everything here goes through `client.callTool`. Nothing reaches into Payload
// directly, because the question is what an agent holding only the MCP endpoint
// and a key can actually accomplish.

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { RETAG_SERIES_IDS, readOrderBaseline, restorePlan, reversedOrderPlan, verifyRestored } from './shared'

const BASE = process.env.PROBE_BASE ?? 'http://localhost:5733'
const KEY = process.env.PROBE_MCP_KEY ?? ''
const FIXTURE = '/tmp/mcpprobe/fixtures/c4-probe-mcp.png'

const results: string[] = []

function record(step: string, ok: boolean, detail: string) {
    results.push(`${ok ? 'PASS' : 'FAIL'}  ${step} — ${detail}`)
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${step} — ${detail}`)
}

async function main() {
    if (!KEY) {
        throw new Error('PROBE_MCP_KEY is required')
    }

    const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/api/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${KEY}` } },
    })
    const client = new Client({ name: 'crow-payload-trial-criterion-4', version: '1.0.0' })
    await client.connect(transport)

    // ---- What does the surface actually offer? -----------------------------
    const { tools } = await client.listTools()
    console.log(`\n${tools.length} tool(s) advertised:`)
    for (const tool of tools) {
        const keys = Object.keys((tool.inputSchema as { properties?: Record<string, unknown> })?.properties ?? {})
        console.log(`  ${tool.name}  (${keys.length} params)`)
        console.log(`      params: ${keys.join(', ')}`)
    }
    console.log()

    const names = tools.map(tool => tool.name)
    const createTool = tools.find(tool => tool.name === 'createArtworks')
    const updateTool = tools.find(tool => tool.name === 'updateArtworks')
    const createParams = Object.keys((createTool?.inputSchema as { properties?: Record<string, unknown> })?.properties ?? {})
    const updateParams = Object.keys((updateTool?.inputSchema as { properties?: Record<string, unknown> })?.properties ?? {})

    record(
        'T0 tool discovery',
        names.includes('createArtworks') && names.includes('updateArtworks') && names.includes('findArtworks'),
        `${tools.length} tools: ${names.join(', ')}`,
    )
    // Absence alone would also "pass" on an empty tool list, so call it anyway.
    // This is the branch's rule applied to the rule itself: the guard that
    // enforces DELETE NOTHING is made to fire.
    // The SDK does NOT throw for an unknown tool — it answers with
    // `{isError: true, content: [...]}`. A bare try/catch here reported
    // "accepted" for a call that was in fact refused, which is the same
    // false-signal shape these probes are meant to catch.
    let deleteRefusal = 'ACCEPTED — a delete tool answered'
    try {
        const result = await client.callTool({ name: 'deleteArtworks', arguments: { id: '999999999' } })
        const text = ((result.content ?? []) as Array<{ text?: string }>).map(part => part.text ?? '').join(' ')
        deleteRefusal = result.isError ? text : `ACCEPTED: ${text.slice(0, 160)}`
    } catch (error) {
        deleteRefusal = (error as Error).message
    }
    record(
        'T0b no delete tool',
        !names.some(name => name.startsWith('delete')) && /not found|unknown tool|not registered/i.test(deleteRefusal),
        `absent from the registry AND refused when called anyway — ${deleteRefusal}`,
    )
    // The asymmetry that decides T1: `updateArtworks` takes a `filePath`,
    // `createArtworks` does not.
    record(
        'T0c filePath asymmetry',
        updateParams.includes('filePath') && !createParams.includes('filePath'),
        `updateArtworks has filePath: ${updateParams.includes('filePath')}; createArtworks has it: ${createParams.includes('filePath')} — the asymmetry T1/T1b turn on`,
    )

    // ---- T1: upload + catalogue -------------------------------------------
    // Resumable, like the other probes: deletion is forbidden on this branch, so
    // a re-run must not add another record.
    const existing = extractDocs(await call(client, 'findArtworks', {
        where: JSON.stringify({ slug: { equals: 'c4-probe-mcp' } }),
        draft: true,
        limit: 1,
        depth: 0,
    }))[0]

    // Attempt 1 — the obvious move: create the artwork with its catalogue data.
    const createResult = existing ? '' : await call(client, 'createArtworks', {
        title: 'C4 probe — MCP upload',
        year: 2026,
        material: 'gouache on paper',
        medium: 'drawing',
        showOnSite: false,
        draft: true,
    })
    const createdId = existing?.id as number | undefined ?? extractId(createResult)
    // On a resumed run the create call did not happen, so this step must not
    // report what a create *would* have done. The spot-check's NOT EXERCISED
    // convention: a step that quietly passes on last run's state is the failure
    // mode these probes exist to avoid.
    record(
        'T1 upload+catalogue (create)',
        createdId !== undefined,
        existing
            ? `NOT EXERCISED this run — reusing id=${createdId} from a previous run (create is skipped so re-runs cannot accumulate records)`
            : createdId !== undefined
                ? `created id=${createdId} — as a DRAFT, with no image. See T1e: the same call as a publish is refused.`
                : `refused: ${firstLine(createResult)}`,
    )

    // Attempt 2 — the workaround the tool surface does allow: attach the bytes
    // afterwards, by a path on the machine running Payload.
    if (createdId !== undefined) {
        const before = await readBack(client, createdId)
        const attach = before?.filename
            ? `(already attached on a previous run: ${before.filename})`
            : await call(client, 'updateArtworks', {
                id: String(createdId),
                filePath: FIXTURE,
                draft: true,
            })
        const doc = await readBack(client, createdId)
        const variants = Object.keys(doc?.sizes ?? {}).filter(name => (doc!.sizes as Record<string, { url?: string }>)[name]?.url)
        record(
            'T1b attach bytes via updateArtworks(filePath)',
            variants.length === 8,
            before?.filename
                ? `NOT EXERCISED this run — bytes already attached (${before.filename}); asserting only that 8/8 variants are still present`
                : variants.length === 8
                    ? `filename=${doc?.filename} variants=8/8 — but filePath is a path on the Payload HOST, so this route needs co-location`
                    : `no usable file on the record: ${firstLine(attach)}`,
        )

        // The catalogue half. Without this, "upload + catalogue" on the MCP row
        // of the results table rests on an id coming back and nothing else.
        const catalogued = doc?.title === 'C4 probe — MCP upload'
            && doc?.year === 2026
            && doc?.medium === 'drawing'
            && doc?.material === 'gouache on paper'
            && doc?.showOnSite === false
            && doc?._status === 'draft'
        record(
            'T1d catalogue fields landed',
            catalogued,
            `title=${doc?.title} year=${doc?.year} medium=${doc?.medium} material=${doc?.material} showOnSite=${doc?.showOnSite} status=${doc?._status}`,
        )

        // Is MCP actually immune to the silent-drop class, as first claimed?
        // The tool schema is typed, but the SERVER does not enforce it: the
        // plugin builds a plain `z.object` and never calls `.strict()`, so a
        // key the schema does not declare is stripped rather than refused. The
        // typing protects a client that validates before sending; it is not a
        // property of the endpoint. Asserted here because the first version of
        // the write-up got this wrong.
        await call(client, 'updateArtworks', { id: String(createdId), tittle: 'typo-must-not-land', yeear: 1999 })
        const afterTypo = await readBack(client, createdId)
        record(
            'T1g unknown field over MCP',
            afterTypo?.title === 'C4 probe — MCP upload',
            `accepted with no error and silently dropped — same as REST; the record is unchanged (title=${afterTypo?.title})`,
        )
    }

    // T1e — the two things the create path actually does, both found only by
    // trying them; neither is visible in the tool schema.
    //
    // (a) The imageless create above succeeded *because it was a draft*. Payload
    //     skips upload validation for drafts, so on an upload collection the
    //     draft path will happily mint a record that can never render. The same
    //     call as a publish is refused, correctly and loudly.
    const publishNoFile = await call(client, 'createArtworks', {
        title: 'C4 probe — publish with no file (must be refused)',
        _status: 'published',
    })
    const publishRefused = extractId(publishNoFile) === undefined
    record(
        'T1e publish-with-no-file is refused',
        publishRefused,
        publishRefused
            ? `refused: ${firstLine(publishNoFile)} — so the draft acceptance above is a draft-validation gap, not a missing check`
            : `ACCEPTED — an imageless artwork was published (id ${extractId(publishNoFile)})`,
    )

    // (b) `url` is documented as a storage *output* (the generated public URL),
    //     but on create it doubles as an *ingest source*: paired with
    //     `filename`, Payload fetches those bytes over the network and runs the
    //     whole sharp pipeline. This is the remote upload route the schema does
    //     not advertise — and it is why "MCP uploads require co-location" is
    //     wrong. Re-ingests a file already in the bucket, so the probe needs no
    //     public host of its own.
    const REMOTE_SLUG = 'c4-probe-remote'
    const alreadyRemote = extractDocs(await call(client, 'findArtworks', {
        where: JSON.stringify({ slug: { equals: REMOTE_SLUG } }), draft: true, limit: 1, depth: 0,
    }))[0]
    const remoteDoc = alreadyRemote ?? await (async () => {
        const source = (await readBack(client, createdId!))?.url as string | undefined
        if (!source) {
            return undefined
        }
        await call(client, 'createArtworks', {
            title: 'C4 probe — MCP remote-url ingest',
            year: 2026,
            medium: 'drawing',
            material: 'gouache on paper',
            materials: [12],
            support: [18],
            showOnSite: false,
            draft: true,
            url: source,
            filename: 'c4-probe-remote.png',
        })
        return extractDocs(await call(client, 'findArtworks', {
            where: JSON.stringify({ slug: { equals: REMOTE_SLUG } }), draft: true, limit: 1, depth: 0,
        }))[0]
    })()
    const remoteVariants = Object.keys(remoteDoc?.sizes ?? {}).filter(
        name => (remoteDoc!.sizes as Record<string, { url?: string }>)[name]?.url,
    )
    record(
        'T1f remote-url ingest over MCP',
        remoteVariants.length === 8,
        remoteVariants.length === 8
            ? `${alreadyRemote ? 'existing' : 'created'} ${remoteDoc?.filename} with 8/8 variants from a URL alone — bytes crossed the network, no host path`
            : `no usable file: ${remoteVariants.length} variant(s)`,
    )

    // ---- T2: retag ---------------------------------------------------------
    // Confined to a record this probe run owns.
    if (createdId !== undefined) {
        await call(client, 'updateArtworks', {
            id: String(createdId),
            series: RETAG_SERIES_IDS,
            materials: [10, 1],
            favorite: false,
            draft: true,
        })
        const doc = await readBack(client, createdId)
        const seriesIds = ((doc?.series ?? []) as Array<number | { id: number }>).map(v => typeof v === 'object' ? v.id : v)
        const materialIds = ((doc?.materials ?? []) as Array<number | { id: number }>).map(v => typeof v === 'object' ? v.id : v)
        record(
            'T2 retag',
            seriesIds.length === RETAG_SERIES_IDS.length && RETAG_SERIES_IDS.every(id => seriesIds.includes(id)) && materialIds.length === 2,
            `series=[${seriesIds}] materials=[${materialIds}]`,
        )
    }

    // ---- T3: reorder a gallery --------------------------------------------
    const baseline = readOrderBaseline()
    const plan = reversedOrderPlan(baseline)

    for (const step of plan) {
        const response = await call(client, 'updateArtworks', { id: String(step.id), order: step.to })
        if (extractId(response) === undefined) {
            throw new Error(`reorder of ${step.slug} failed: ${firstLine(response)}`)
        }
    }

    const listed = await call(client, 'findArtworks', {
        where: JSON.stringify({ id: { in: baseline.map(row => row.id) } }),
        sort: 'order',
        limit: 50,
        depth: 0,
    })
    const docs = extractDocs(listed)
    const gotSequence = docs.map(doc => doc.id)
    const wantSequence = [...baseline].reverse().map(row => row.id)
    record(
        'T3 reorder gallery',
        JSON.stringify(gotSequence) === JSON.stringify(wantSequence),
        `${plan.length} tool calls; sequence by order: [${gotSequence}] (wanted [${wantSequence}])`,
    )

    // The multiset of the gallery's own order values — see local-api.ts.
    const orderValues = docs.map(doc => doc.order).sort((a, b) => (a ?? 0) - (b ?? 0))
    const baselineValues = baseline.map(row => row.order).sort((a, b) => (a ?? 0) - (b ?? 0))
    record(
        'T3b order values conserved',
        JSON.stringify(orderValues) === JSON.stringify(baselineValues),
        `still [${baselineValues}]`,
    )

    // ---- Put the gallery back, over MCP ------------------------------------
    for (const step of restorePlan(baseline)) {
        const response = await call(client, 'updateArtworks', { id: String(step.id), order: step.to })
        if (extractId(response) === undefined) {
            throw new Error(`restore of ${step.slug} failed: ${firstLine(response)}`)
        }
    }
    const reread = extractDocs(await call(client, 'findArtworks', {
        where: JSON.stringify({ id: { in: baseline.map(row => row.id) } }),
        sort: 'order',
        limit: 50,
        depth: 0,
    })).map(doc => ({ id: doc.id as number, order: (doc.order ?? null) as number | null }))
    const verdict = verifyRestored(baseline, reread)
    record('T4 gallery restored', verdict.ok, verdict.detail)

    await client.close()
}

function isFileish(name: string) {
    return /file|upload|data|media|attach/i.test(name)
}

// The tools answer in prose with a fenced JSON blob, not as structured content —
// so reading a result means parsing the model-facing text back out.
async function call(client: Client, name: string, args: Record<string, unknown>) {
    const result = await client.callTool({ name, arguments: args })
    return (result.content as Array<{ type: string, text?: string }> | undefined)
        ?.filter(part => part.type === 'text')
        .map(part => part.text ?? '')
        .join('\n') ?? ''
}

// Reading a result means scraping the model-facing prose. There is no single
// envelope to parse: a list answer is a header line followed by ONE fenced
// ```json block PER DOCUMENT (no array, no `docs` wrapper, no pagination
// object), while fetching by id answers `Resource from collection "artworks":`
// with bare JSON and no fence at all. `structuredContent` is never set. Both
// helpers below exist only because of that.
function parseJsonBlocks(text: string): Array<Record<string, any>> {
    const blocks: Array<Record<string, any>> = []
    for (const match of text.matchAll(/```json\n([\s\S]*?)\n```/g)) {
        try {
            blocks.push(JSON.parse(match[1]!))
        } catch {
            // A block that does not parse is a finding, not something to hide.
            blocks.push({ __unparseable: match[1] })
        }
    }
    return blocks
}

function parseSingleResource(text: string): Record<string, any> | undefined {
    const fenced = parseJsonBlocks(text)
    if (fenced.length > 0) {
        return fenced[0]
    }
    const braceAt = text.indexOf('{')
    if (braceAt === -1) {
        return undefined
    }
    try {
        return JSON.parse(text.slice(braceAt))
    } catch {
        return undefined
    }
}

function extractId(text: string): number | undefined {
    const parsed = parseSingleResource(text)
    return parsed?.id ?? parsed?.doc?.id ?? parsed?.docs?.[0]?.id
}

function extractDocs(text: string): Array<Record<string, any>> {
    return parseJsonBlocks(text)
}

function firstLine(text: string) {
    return text.split('\n')[0]
}

async function readBack(client: Client, id: number) {
    const text = await call(client, 'findArtworks', { id: String(id), draft: true, depth: 0 })
    return parseSingleResource(text)
}

main()
    .then(() => {
        console.log('\n--- summary ---')
        results.forEach(line => console.log(line))
        if (results.some(line => line.startsWith('FAIL'))) {
            process.exit(1)
        }
    })
    .catch(error => {
        console.error(error)
        console.error('\nThe probe threw, so the gallery may be left permuted — run `npm run probe:restore`.')
        process.exit(1)
    })
