// Split out of Artworks.ts so the admin's client-side grid can read the same
// vocabulary the collection validates against. Importing Artworks.ts from a
// `'use client'` component would pull Payload's server config into the browser
// bundle; this module is a bare array and imports nothing.
//
// Crow's `kind` carried three unrelated things at once: medium, publication
// state (`unpublished`, `hidden`), and a category the site filtered out in code
// (`tattoo`). Split per Anton: this is medium only.
export const MEDIUMS = [
    'painting',
    'drawing',
    'ceramic',
    'illustration',
    'poster',
    'collage',
    'tattoo',
]
