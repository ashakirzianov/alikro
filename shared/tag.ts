export type TagMetadata = {
    tag: string,
    title: string,
}

const tags: TagMetadata[] = [
    { tag: 'selfportrait', title: 'self portraits' },
    { tag: 'friend portrait', title: 'friends' },
    { tag: 'The Black List', title: 'black list' },
    { tag: 'NAI', title: 'nai' },
    { tag: 'sketch from museum', title: 'sketches from museums' },
]

export function getAllTagsMetadata(): TagMetadata[] {
    return tags
}