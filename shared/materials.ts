export type MaterialElement = {
    content: string,
    passive?: boolean,
    on?: boolean,
}
export function parseMaterialString(material: string): MaterialElement[] {
    const plusResult = breakOnLastSeparator(material, ' + ')
    if (plusResult) {
        const [before, plus, after] = plusResult
        const beforeElements = parseMaterialString(before)
        const plusElement = {
            content: plus,
            passive: true,
        }
        const afterElements = parseMaterialString(after)
        return [...beforeElements, plusElement, ...afterElements]
    }
    const onResult = breakOnLastSeparator(material, ' on ')
    if (onResult) {
        const [before, on, after] = onResult
        const beforeElements = parseMaterialString(before)
        const onElement = {
            content: on,
            passive: true,
        }
        const afterElement = {
            content: after,
            on: true,
        }
        return [...beforeElements, onElement, afterElement]
    }
    const commaResult = breakOnLastSeparator(material, ', ')
    if (commaResult) {
        const [before, comma, after] = commaResult
        const beforeElements = parseMaterialString(before)
        const commaElement = {
            content: comma,
            passive: true,
        }
        const afterElement = {
            content: after,
        }
        return [...beforeElements, commaElement, afterElement]
    }
    return [{
        content: material,
    }]
}

export function specialCasesForMaterialElements(elements: MaterialElement[]): MaterialElement[] {
    return elements.flatMap(element => {
        if (element.content.endsWith('clay') && element.content !== 'clay') {
            const preElement: MaterialElement = {
                content: element.content.substring(0, element.content.length - 'clay'.length).trimEnd(),
                passive: true,
            }
            const clayElement: MaterialElement = {
                ...element,
                content: 'clay',
            }
            return [preElement, clayElement]
        } else {
            return element
        }
    })
}

type Part = string
function breakOnLastSeparator(str: string, separator: string): [Part, Part, Part] | null {
    const index = str.lastIndexOf(separator)
    if (index === -1) {
        return null
    }
    const before: Part = str.substring(0, index)
    const sep: Part = separator
    const after: Part = str.substring(index + separator.length)
    return [before, sep, after]
}