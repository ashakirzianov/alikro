export type MaterialElement = {
    content: string,
    start: number,
    end: number,
    passive?: boolean,
    on?: boolean,
}
export function parseMaterialString(material: string): MaterialElement[] {
    const onResult = breakOnLastSeparator(material, ' on ')
    if (onResult) {
        const [before, on, after] = onResult
        const beforeElements = parseMaterialString(before.content)
        const onElement = {
            ...on,
            passive: true,
        }
        const afterElement = {
            ...after,
            end: after.end,
            on: true,
        }
        return [...beforeElements, onElement, afterElement]
    }
    const commaResult = breakOnLastSeparator(material, ', ')
    if (commaResult) {
        const [before, comma, after] = commaResult
        const beforeElements = parseMaterialString(before.content)
        const commaElement = {
            ...comma,
            passive: true,
        }
        const afterElement = {
            ...after,
            end: after.end,
            passive: true,
        }
        return [...beforeElements, commaElement, afterElement]
    }
    return [{
        content: material,
        start: 0,
        end: material.length,
    }]
}

type Part = {
    content: string,
    start: number,
    end: number,
}
function breakOnLastSeparator(str: string, separator: string): [Part, Part, Part] | null {
    const index = str.lastIndexOf(separator)
    if (index === -1) {
        return null
    }
    const before: Part = {
        content: str.substring(0, index),
        start: 0,
        end: index,
    }
    const sep: Part = {
        content: separator,
        start: index,
        end: index + separator.length,
    }
    const after: Part = {
        content: str.substring(index + separator.length),
        start: index + separator.length,
        end: str.length,
    }
    return [before, sep, after]
}