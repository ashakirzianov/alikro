import Link from "next/link"
import Image from "next/image"

export default function About() {
    return <div className="flex flex-col items-start">
        <div className="max-w-prose p-4 text-2xl">
            I am an artist from Ukraine, currently living in LA.
            This page is like my artistic diary (well, almost). You can find my works here, from commercial to very personal. I like to combine and use different techniques and materials. I am driven by both the search for metaphor and direct observation.
            <br /><br />
            If you resonate with a particular piece or would like to add my artwork to your collection, please don&apos;t hesitate to reach out. I offer a selection of original artworks and limited-edition prints for art enthusiasts and collectors. Owning a piece of art is not only a visual delight but also a way to support and encourage artists on their creative journey.
            <br /><br />
            Feel free to contact me if you have any questions, feedback, or if you&apos;d like to discuss collaborations.
            <div className="py-4 flex flex-col items-start grow">
                <SocialLinks />
            </div>
        </div>
    </div>
}

function SocialLinks() {
    return <div className="flex flex-row space-x-4">
        <IconLink href="https://www.instagram.com/alikro/" src="/icons/instagram.png" alt="Instagram" />
        <IconLink href="https://www.behance.net/AlinaKro" src="/icons/behance.png" alt="Behance" />
        <IconLink href="mailto:alinkakro@gmail.com" src="/icons/mail.png" alt="Mail" />
    </div>
}

function IconLink({ href, src, alt }: {
    href: string,
    src: string,
    alt: string,
}) {
    return <Link href={href}>
        <Image src={src} width={32} height={32} alt={alt} />
    </Link>
}
