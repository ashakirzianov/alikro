'use client'
import dynamic from 'next/dynamic'
import { ReactNode, useEffect, useState } from "react"
import { BehanceLink, InstagramLink, MailLink } from "@/shared/SocialLinks"
import { Slider } from "./Slider"
import { AssetMetadata } from "@/shared/assets"
import { DynamicLayout } from './DynamicLayout'

export const ClientsideSlideshow = dynamic(() => Promise.resolve(Slideshow), {
    ssr: false,
})

export type SlideData = {
    assets: AssetMetadata[],
    title: string,
    href: string,
    includeLinks?: boolean,
}
function Slideshow({ slides }: {
    slides: SlideData[],
}) {
    const [scroll, setScroll] = useState(0)
    const aspect = useAspectRatio()
    let ticking = false
    function handleScroll(value: number) {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                setScroll(value)
                ticking = false
            })
            ticking = true
        }
    }
    const corner = <div className="flex flex-row">
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
            <DynamicLayout
                slides={slides.map(s => s.assets)}
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
            <Slider onScroll={handleScroll}>
                {
                    slides.map((slide, idx) => {
                        const { title, href, includeLinks } = slide
                        return <TextSlide key={idx} text={title} href={href} corner={includeLinks ? corner : null} />
                    })
                }
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
    return <div className="flex flex-col py-[8svh] justify-between h-full cursor-pointer" onClick={() => {
        window.location.href = href
    }}>
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