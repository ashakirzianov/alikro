'use client'
import { ReactNode, useEffect, useState } from "react"
import { forQueries, not } from "@/shared/assets"
import { Slider } from "./Slider"
import { ClientsideDynamicLayout } from "./DynamicLayout"
import Link from "next/link"
import { SocialLinks } from "@/shared/SocialLinks"

const selfportraits = forQueries('selfportrait')
const drawings = [...forQueries('drawing', 'favorite', not('selfportrait')), ...forQueries('drawing', not('favorite'), not('selfportrait'))]
const illustrations = [...forQueries('illustration', 'favorite', not('selfportrait')), ...forQueries('illustration', not('favorite'), not('selfportrait'))]
const paintings = [...forQueries('painting', 'favorite', not('selfportrait')), ...forQueries('painting', not('favorite'), not('selfportrait'))]
const posters = [...forQueries('poster', not('secondary')), ...forQueries('painting', 'secondary')]
const collages = [...forQueries('collage', 'favorite'), ...forQueries('collage', not('favorite'))]
const tattoos = forQueries('tattoo')

export default function DynamicPage() {
    let [scroll, setScroll] = useState(0)
    let aspect = useAspectRatio()
    let corner = <div className="bg-accent p-4">
        <div className="flex flex-row gap-4" style={{
            filter: 'brightness(0) invert(1)',
        }}>
            <SocialLinks size={32} />
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
                    selfportraits,
                    drawings,
                    illustrations,
                    paintings,
                    posters,
                    collages,
                    tattoos,
                ]}
                aspect={aspect}
                // fractions={[30, 40, 30]}
                // fractions={[25, 50, 25]}
                fractions={[50, 30, 20]}
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
    return <div className="flex flex-col py-[8svh] justify-between h-full">
        <div>
            <Link href={href} className="inline text-9xl bg-accent"
                style={{
                    display: 'inline',
                    fontSize: 'min(12svw, 10svh)',
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
