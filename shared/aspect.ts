import { useEffect, useState } from "react"

export function useAspectRatio() {
    function windowAspect() {
        if (!global?.document?.documentElement)
            return 1
        const { scrollWidth, scrollHeight } = document.documentElement
        return (scrollWidth) / (scrollHeight)
    }
    const [aspectRatio, setAspectRatio] = useState(windowAspect())

    useEffect(() => {
        function handleResize() {
            setAspectRatio(windowAspect())
        };

        window?.addEventListener('resize', handleResize)

        return () => {
            window?.removeEventListener('resize', handleResize)
        }
    }, [])

    return aspectRatio
}

export function useWindowDimensions() {
    function windowDimensions() {
        if (!global?.document?.documentElement)
            return { width: 1, height: 1 }
        const { scrollWidth, scrollHeight } = document.documentElement
        return { width: scrollWidth, height: scrollHeight }
    }
    const [dimensions, setDimensions] = useState(windowDimensions())

    useEffect(() => {
        function handleResize() {
            setDimensions(windowDimensions())
        };

        window?.addEventListener('resize', handleResize)

        return () => {
            window?.removeEventListener('resize', handleResize)
        }
    }, [])

    return dimensions
}