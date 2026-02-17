export async function requestVariant(assetId: string, variant: string): Promise<string | undefined> {
    const response = await fetch('/api/variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, variant }),
    })
    const result = await response.json()
    return result.success ? (result.src as string) : undefined
}
