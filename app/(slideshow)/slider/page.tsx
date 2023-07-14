'use client'
import { useEffect, useState } from "react"
import { assets, assetsForTags } from "@/shared/assets"
import { Slider } from "./Slider"
import { ClientsideDynamicLayout } from "./DynamicLayout"

export default function DynamicPage() {
    let [scroll, setScroll] = useState(0)
    let aspect = useAspectRatio()
    return <div>
        <div className="flex flex-col" style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
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
                fractions={[30, 50, 20]}
                scroll={scroll * aspect}
            />
        </div>
        <Slider onScroll={setScroll}>
            <TextSlide text="Alikro, an artist." hue={0} />
            <TextSlide text="Drawings." hue={0} />
            <TextSlide text="Illustrations." hue={60} />
            <TextSlide text="Paintings." hue={120} />
            <TextSlide text="Posters." hue={240} />
            <TextSlide text="Collages." hue={180} />
            <TextSlide text="Tattoos." hue={300} />
        </Slider>
    </div>
}

function TextSlide({
    text, hue,
}: {
    text: string,
    hue: number,
}) {
    return <div className="py-[10vh]">
        <div className="inline text-9xl"
            style={{
                display: 'inline',
                fontSize: '10dvh',
                background: `hsl(0, 100%, 50%, 1)`,
                color: 'white',
                alignSelf: 'flex-start',
                width: 'auto',
                marginTop: '30dvh',
            }}>{text}</div>
    </div>
}

function useAspectRatio() {
    function windowAspect() {
        return global.window ? window.innerWidth / window.innerHeight : 1
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
