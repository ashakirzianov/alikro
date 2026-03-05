const SPECIAL_SUFFIXES = ['clay', 'glaze']

export type MaterialElement = {
    content: string,
    passive?: boolean,
    on?: boolean,
}

export function parseMaterialString(material: string): MaterialElement[] {
    return specialCasesForMaterialElements(parseMaterialStringImpl(material))
}

export function matchMaterial(assetMaterial: string | undefined, materialMatcher: string): boolean {
    if (assetMaterial === undefined) {
        return materialMatcher === undefined
    } else if (!assetMaterial.includes(materialMatcher)) {
        return false
    }

    const isOnMatcher = materialMatcher.startsWith('on ')
    const actualMatcher = isOnMatcher
        ? materialMatcher.substring('on '.length)
        : materialMatcher
    const shouldMatchPartially = SPECIAL_SUFFIXES.includes(actualMatcher)
    if (shouldMatchPartially) {
        return true
    }
    const assetMaterialElements = parseMaterialString(assetMaterial)
    for (const element of assetMaterialElements) {
        if (element.content === actualMatcher) {
            return true
        }
    }
    return false
}

function parseMaterialStringImpl(material: string): MaterialElement[] {
    const plusResult = breakOnLastSeparator(material, ' + ')
    if (plusResult) {
        const [before, plus, after] = plusResult
        const beforeElements = parseMaterialStringImpl(before)
        const plusElement = {
            content: plus,
            passive: true,
        }
        const afterElements = parseMaterialStringImpl(after)
        return [...beforeElements, plusElement, ...afterElements]
    }
    const onResult = breakOnLastSeparator(material, ' on ')
    if (onResult) {
        const [before, on, after] = onResult
        const beforeElements = parseMaterialStringImpl(before)
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
        const beforeElements = parseMaterialStringImpl(before)
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

function specialCasesForMaterialElements(elements: MaterialElement[]): MaterialElement[] {
    return elements.flatMap(element => {
        for (const suffix of SPECIAL_SUFFIXES) {
            if (element.content.endsWith(suffix) && element.content !== suffix) {
                const preElement: MaterialElement = {
                    content: element.content.substring(0, element.content.length - suffix.length),
                    passive: true,
                }
                const clayElement: MaterialElement = {
                    ...element,
                    content: suffix,
                }
                return [preElement, clayElement]
            }
        }
        return element
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