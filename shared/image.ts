import { AssetVariant } from "./asset"

export function imageSrc({
    fileName, width, quality, variants,
}: {
    fileName: string,
    width?: number,
    quality?: number,
    variants?: AssetVariant[],
}) {
    // When the CMS reports its renditions, pick from them. Composing a name from
    // a requested width is a Crow-ism: it works because Crow writes one file per
    // requested width and generates on demand for anything else.
    if (variants && variants.length > 0) {
        return pickVariant(variants, width).url
    }
    return `${process.env.NEXT_PUBLIC_IMG_BASE}/${variantFileName({
        originalName: fileName,
        width,
        quality,
        format: 'webp',
    })}`
}

export function variantFileName({
    originalName, width, quality, format,
}: {
    originalName: string, format: string,
    width?: number, quality?: number,
}): string {
    return `${originalName}@${width !== undefined ? `w${width}` : ''}${quality !== undefined ? `q${quality}` : ''}.${format}`
}

// Smallest rendition at least as wide as asked for; the widest available when
// nothing is big enough.
function pickVariant(variants: AssetVariant[], width?: number): AssetVariant {
    if (width === undefined) {
        return variants[variants.length - 1]
    }
    return variants.find(variant => variant.width >= width) ?? variants[variants.length - 1]
}
