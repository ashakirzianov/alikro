import { NextRequest, NextResponse } from 'next/server'
import { getAssetMetadata } from '@/shared/metadataStore'
import { requestImageVariant } from '@/shared/fileStore'

export async function POST(request: NextRequest) {
    const { assetId, variant } = await request.json()

    if (!assetId || !variant) {
        return NextResponse.json(
            { success: false, message: 'assetId and variant are required' },
            { status: 400 },
        )
    }

    const asset = await getAssetMetadata(assetId)
    if (!asset) {
        return NextResponse.json(
            { success: false, message: `Asset not found: ${assetId}` },
            { status: 404 },
        )
    }

    const result = await requestImageVariant(asset, variant)
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
