'use client'
import { useEffect, useState } from "react"
import { assets, assetsForTags } from "@/shared/assets"
import { Slider } from "./Slider"
import { ClientsideDynamicLayout } from "./DynamicLayout"
import Link from "next/link"

export default function DynamicPage() {
    let [scroll, setScroll] = useState(0)
    let aspect = useAspectRatio()
    return <div>
        <div className="flex flex-col" style={{
            position: 'fixed',
            width: '100svw',
            height: '100svh',
            zIndex: -1,
        }}>
            <ClientsideDynamicLayout
                slides={[
                    assetsForTags(assets, 'selfportrait'),
                    assetsForTags(assets, 'drawing'),
                    assetsForTags(assets, 'illustration'),
                    assetsForTags(assets, 'painting'),
                    assetsForTags(assets, 'poster'),
                    assetsForTags(assets, 'collage'),
                    assetsForTags(assets, 'tattoo'),
                ]}
                aspect={aspect}
                // fractions={[30, 40, 30]}
                // fractions={[25, 50, 25]}
                fractions={[30, 50, 20]}
                scroll={scroll * aspect}
            />
        </div>
        <Slider onScroll={setScroll}>
            <TextSlide text="Alikro, an artist." href='/about' />
            <TextSlide text="Drawings." href='/drawings' />
            <TextSlide text="Illustrations." href='/illustrations' />
            <TextSlide text="Paintings." href='/paintings' />
            <TextSlide text="Posters." href='/posters' />
            <TextSlide text="Collages." href='/collages' />
            <TextSlide text="Tattoos." href='/tattoos' />
        </Slider>
    </div>
}

function TextSlide({
    text, href,
}: {
    text: string,
    href: string,
}) {
    return <div className="py-[10svh]">
        <Link href={href} className="inline text-9xl"
            style={{
                display: 'inline',
                fontSize: '10svh',
                background: `hsl(0, 100%, 50%, 1)`,
                color: 'white',
                alignSelf: 'flex-start',
                width: 'auto',
                marginTop: '30svh',
            }}>{text}</Link>
    </div>
}

// function useAspectRatio() {
//     function windowAspect() {
//         return global.window ? window.innerWidth / window.innerHeight : 1
//     }
//     const [aspectRatio, setAspectRatio] = useState(windowAspect())

//     useEffect(() => {
//         function handleResize() {
//             setAspectRatio(windowAspect())
//         };

//         window?.addEventListener('resize', handleResize)

//         return () => {
//             window?.removeEventListener('resize', handleResize)
//         }
//     }, [])

//     return aspectRatio
// }

function useAspectRatio() {
    function windowAspect() {
        if (!document?.documentElement)
            return 1
        let { scrollWidth, scrollHeight } = document.documentElement
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
