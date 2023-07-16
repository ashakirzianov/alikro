import Image from "next/image"
import Link from "next/link"

export function SocialLinks({ size = 32 }: {
    size?: number,
}) {
    return <>
        <IconLink href="https://www.instagram.com/alikro/" src="/icons/instagram.png" alt="Instagram" size={size} />
        <IconLink href="https://www.behance.net/AlinaKro" src="/icons/behance.png" alt="Behance" size={size} />
        <IconLink href="mailto:alinkakro@gmail.com" src="/icons/mail.png" alt="Mail" size={size} />
    </>
}

function IconLink({ href, src, alt, size }: {
    href: string,
    src: string,
    alt: string,
    size: number,
}) {
    return <Link href={href}>
        <Image src={src} width={size} height={size} alt={alt} />
    </Link>
}