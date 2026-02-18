export function imageSrc({
    fileName, width, quality,
}: {
    fileName: string,
    width?: number,
    quality?: number,
}) {
    return `https://${process.env.NEXT_PUBLIC_CROW_ASSETS_DOMAIN}/alikro/variants/${variantFileName({
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