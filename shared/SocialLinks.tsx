import Image from "next/image"
import Link from "next/link"

export function SocialLinks() {
    return <>
        <IconLink href="https://www.instagram.com/alikro/" src="/icons/instagram.png" alt="Instagram" />
        <IconLink href="https://www.behance.net/AlinaKro" src="/icons/behance.png" alt="Behance" />
        <IconLink href="mailto:alinkakro@gmail.com" src="/icons/mail.png" alt="Mail" />
    </>
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