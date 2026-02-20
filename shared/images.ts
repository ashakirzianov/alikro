export function imageSrc({
    fileName, width, quality,
}: {
    fileName: string,
    width?: number,
    quality?: number,
}) {
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