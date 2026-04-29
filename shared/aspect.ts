import { useEffect, useState } from "react"

export function useAspectRatio() {
    const [aspectRatio, setAspectRatio] = useState(1)

    useEffect(() => {
        function getAspect() {
            const { scrollWidth, scrollHeight } = document.documentElement
            return scrollWidth / scrollHeight
        }
        setAspectRatio(getAspect())
        function handleResize() {
            setAspectRatio(getAspect())
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return aspectRatio
}

export function useWindowDimensions() {
    const [dimensions, setDimensions] = useState({ width: 1, height: 1 })

    useEffect(() => {
        function getDimensions() {
            const { scrollWidth, scrollHeight } = document.documentElement
            return { width: scrollWidth, height: scrollHeight }
        }
        setDimensions(getDimensions())
        function handleResize() {
            setDimensions(getDimensions())
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return dimensions
}