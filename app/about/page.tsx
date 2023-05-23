import Link from "next/link"

export default function About() {
    return <div className="max-w-md p-4">
        Hi! I am Alikro, an artist living in Los Angeles. I do tattoos, illustrations, paintings, and drawings. I am available for commissions.
        You can follow me on <Link className="text-accent" href="https://www.instagram.com/alikro/">Instagram</Link>.
    </div>
}