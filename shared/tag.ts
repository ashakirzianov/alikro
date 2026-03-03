export type TagMetadata = {
    tag: string,
    title: string,
}

const tags: TagMetadata[] = [
    { tag: 'self-portrait', title: 'self portraits' },
    { tag: 'friend portrait', title: 'friends' },
    { tag: 'The Black List', title: 'black list' },
    { tag: 'NAI', title: 'nai' },
    { tag: 'sketch from museum', title: 'sketches from museums' },
]

export function getAllTagsMetadata(): TagMetadata[] {
    return tags
}

export function getTagMetadata(tag: string): TagMetadata | undefined {
    return tags.find(t => t.tag === tag)
}