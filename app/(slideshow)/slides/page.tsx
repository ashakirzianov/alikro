'use client'
import { ReactNode, useEffect, useState } from "react"
import { forTags } from "@/shared/assets"
import { Slider } from "./Slider"
import { ClientsideDynamicLayout } from "./DynamicLayout"
import Link from "next/link"
import { SocialLinks } from "@/shared/SocialLinks"

export default function DynamicPage() {
    let [scroll, setScroll] = useState(0)
    let aspect = useAspectRatio()
    let corner = <div className="bg-[red] p-4">
        <div className="flex flex-row gap-4" style={{
            filter: 'brightness(0) invert(1)',
        }}>
            <SocialLinks size={48} />
        </div>
    </div>
    return <div>
        <div className="flex flex-col" style={{
            position: 'fixed',
            width: '100svw',
            height: '100svh',
            zIndex: -1,
        }}>
            <ClientsideDynamicLayout
                slides={[
                    forTags('selfportrait'),
                    forTags('drawing'),
                    forTags('illustration'),
                    forTags('painting'),
                    forTags('poster'),
                    forTags('collage'),
                    forTags('tattoo'),
                ]}
                aspect={aspect}
                // fractions={[30, 40, 30]}
                // fractions={[25, 50, 25]}
                fractions={[30, 50, 20]}
                scroll={scroll * aspect}
            />
        </div>
        <Slider onScroll={setScroll}>
            <TextSlide text="Alikro, an artist." href='/about' corner={corner} />
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
    text, href, corner
}: {
    text: string,
    href: string,
    corner?: ReactNode,
}) {
    return <div className="flex flex-col py-[10svh] justify-between h-full">
        <div>
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
        {corner ? <div className="self-end">{corner}</div> : null}
    </div>
}

function useAspectRatio() {
    function windowAspect() {
        if (!global?.document?.documentElement)
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
