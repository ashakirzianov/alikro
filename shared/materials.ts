export type MaterialElement = {
    content: string,
    start: number,
    end: number,
    passive?: boolean,
    on?: boolean,
}
export function parseMaterialString(material: string): MaterialElement[] {
    const plusResult = breakOnLastSeparator(material, ' + ')
    if (plusResult) {
        const [before, plus, after] = plusResult
        const beforeElements = parseMaterialString(before.content)
        const plusElement = {
            ...plus,
            passive: true,
        }
        const afterElement = {
            ...after,
            end: after.end,
            passive: false,
        }
        return [...beforeElements, plusElement, afterElement]
    }
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

export function specialCasesForMaterialElements(elements: MaterialElement[]): MaterialElement[] {
    return elements.flatMap(element => {
        if (element.content.endsWith('clay') && element.content !== 'clay') {
            const preElement: MaterialElement = {
                content: element.content.substring(0, element.content.length - 'clay'.length).trimEnd(),
                start: element.start,
                end: element.end - 'clay'.length,
                passive: true,
            }
            const clayElement: MaterialElement = {
                ...element,
                content: 'clay',
                start: element.end - 'clay'.length,
                end: element.end,
            }
            return [preElement, clayElement]
        } else {
            return element
        }
    })
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