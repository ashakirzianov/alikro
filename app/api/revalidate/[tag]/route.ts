import { revalidateTag } from "next/cache"
import { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> },
) {
  const auth = request.headers.get("Authorization")
  const secret = process.env.CROW_CMS_SECRET_KEY
  if (!secret || auth !== `Bearer ${secret}`) {
    console.warn("Unauthorized revalidation attempt", { auth })
    return new Response("Unauthorized", { status: 401 })
  }

  const { tag } = await params
  revalidateTag(tag, 'max')
  return new Response(`Revalidated tag: ${tag}`, { status: 200 })
}
