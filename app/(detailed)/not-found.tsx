import Link from "next/link"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center text-accent text-2xl sm:text-5xl mt-4">
            <div className="flex flex-row flex-wrap whitespace-nowrap pb-2">
                <span><Link href="/" className="text-accent hover:bg-accent hover:text-secondary">Alikro</Link>&nbsp;//&nbsp;</span>
                <span><span className="bg-accent text-secondary">404</span>&nbsp;</span>
            </div>
            <div className="max-w-prose p-4 text-2xl">
                This page does not exist.
                <br /><br />
                <Link href="/all" className="hover:bg-accent hover:text-secondary underline decoration-dotted">
                    Go back to the gallery
                </Link>
            </div>
        </div>
    )
}
