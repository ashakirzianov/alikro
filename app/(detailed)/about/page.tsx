import { SocialLinks } from "@/shared/SocialLinks"

export default function About() {
    return <div className="flex flex-col items-start">
        <div className="max-w-prose p-4 text-2xl">
            I am an artist from Ukraine, currently living in LA.
            This page is like my artistic diary (well, almost). You can find my works here, from commercial to very personal. I like to combine and use different techniques and materials. I am driven by both the search for metaphor and direct observation.
            <br /><br />
            If you resonate with a particular piece or would like to add my artwork to your collection, please don&apos;t hesitate to reach out. I offer a selection of original artworks and limited-edition prints for art enthusiasts and collectors. Owning a piece of art is not only a visual delight but also a way to support and encourage artists on their creative journey.
            <br /><br />
            Feel free to contact me if you have any questions, feedback, or if you&apos;d like to discuss collaborations.
            <div className="py-4 flex flex-col items-end grow">
                <div className="bg-accent p-4">
                    <div className="flex flex-row gap-4" style={{
                        filter: 'brightness(0) invert(1)',
                    }}>
                        <SocialLinks size={32} />
                    </div>
                </div>
            </div>
        </div>
    </div>
}


