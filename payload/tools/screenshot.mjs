// Offscreen page capture via CDP. Headless only — it renders the page in its own
// process and never reads the desktop, so nothing else on screen can be captured.
import { writeFileSync } from 'fs'

const [, , url, out, token, widthArg, heightArg] = process.argv
const width = Number(widthArg || 1400)
const height = Number(heightArg || 1000)

const base = 'http://127.0.0.1:9222'
const version = await (await fetch(`${base}/json/version`)).json()
const ws = new WebSocket(version.webSocketDebuggerUrl)

let id = 0
const pending = new Map()
const events = []

ws.onmessage = (m) => {
    const msg = JSON.parse(m.data)
    if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id)
        pending.delete(msg.id)
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    } else if (msg.method) {
        events.push(msg.method)
    }
}

function send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
        const msgId = ++id
        pending.set(msgId, { resolve, reject })
        ws.send(JSON.stringify({ id: msgId, method, params, sessionId }))
    })
}

await new Promise(r => { ws.onopen = r })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })

await send('Page.enable', {}, sessionId)
await send('Network.enable', {}, sessionId)
await send('Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 2, mobile: false }, sessionId)

if (token) {
    const { host } = new URL(url)
    await send('Network.setCookie', {
        name: 'payload-token',
        value: token,
        domain: host.split(':')[0],
        path: '/',
        httpOnly: true,
    }, sessionId)
}

await send('Page.navigate', { url }, sessionId)

// Payload's admin hydrates and then fetches; poll for the real content rather
// than guessing at a fixed delay.
const deadline = Date.now() + 60000
let ready = false
while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 1000))
    const { result } = await send('Runtime.evaluate', {
        expression: `(() => {
            const imgs = [...document.querySelectorAll('.artwork-grid img')];
            return JSON.stringify({
                cards: document.querySelectorAll('.artwork-grid__card').length,
                loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
                total: imgs.length,
            })
        })()`,
        returnByValue: true,
    }, sessionId)
    const s = JSON.parse(result.value)
    if (s.total > 0 && s.loaded === s.total) { ready = true; console.log('render:', result.value); break }
}
if (!ready) console.log('WARNING: images did not all finish loading before capture')

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId)
writeFileSync(out, Buffer.from(shot.data, 'base64'))
console.log('wrote', out)
ws.close()
process.exit(0)
