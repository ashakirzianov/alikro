'use client'
import { ReactNode, useEffect, useState } from "react"
import { forQueries, not } from "@/shared/assets"
import { Slider } from "./Slider"
import { ClientsideDynamicLayout } from "./DynamicLayout"
import { BehanceLink, InstagramLink, MailLink, SocialLinks } from "@/shared/SocialLinks"

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
    let corner = <div className="flex flex-row">
        <div className="bg-accent hover:bg-white">
            <div className="p-4 invert brightness-0 hover:invert-0 hover:brightness-0">
                <InstagramLink />
            </div>
        </div>
        <div className="bg-accent hover:bg-white">
            <div className="p-4 invert brightness-0 hover:invert-0 hover:brightness-0">
                <BehanceLink />
            </div>
        </div>
        <div className="bg-accent hover:bg-white">
            <div className="p-4 invert brightness-0 hover:invert-0 hover:brightness-0">
                <MailLink />
            </div>
        </div>
    </div>
    return <div style={{
        display: 'grid',
        gridTemplateAreas: 'center',
    }}>
        <div className="flex flex-col" style={{
            width: '100svw',
            height: '100svh',
            gridArea: 'center',
            zIndex: 1,
        }}>
            <ClientsideDynamicLayout
                slides={[
                    selfportraits,
                    drawings,
                    illustrations,
                    paintings,
                    posters,
                    collages,
                    // tattoos,
                ]}
                aspect={aspect}
                // fractions={[30, 40, 30]}
                // fractions={[25, 50, 25]}
                fractions={[50, 30, 20]}
                scroll={scroll}
            />
        </div>
        <div style={{
            gridArea: 'center',
            zIndex: 2,
        }}>
            <Slider onScroll={setScroll}>
                <TextSlide text="Alikro, an artist." href='/about' corner={corner} />
                <TextSlide text="Drawings." href='/drawings' />
                <TextSlide text="Illustrations." href='/illustrations' />
                <TextSlide text="Paintings." href='/paintings' />
                <TextSlide text="Posters." href='/posters' />
                <TextSlide text="Collages." href='/collages' />
                {/* <TextSlide text="Tattoos." href='/tattoos' /> */}
            </Slider>
        </div>
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
            {/* TODO: make this a Link (once I figure out how to make it work with the slider) */}
            <a href={href} className="inline text-9xl bg-accent text-white mt-[30svh] self-start text-[min(12svw,10svh)] hover:bg-white hover:text-black">{text}</a>
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
