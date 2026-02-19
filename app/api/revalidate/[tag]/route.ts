import { revalidateTag } from "next/cache"
import { NextRequest } from "next/server"

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_CROW_CMS,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean)

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : null
  return {
    "Access-Control-Allow-Origin": allowed ?? "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> },
) {
  const origin = request.headers.get("origin")
  const auth = request.headers.get("authorization")
  const secret = process.env.CROW_CMS_SECRET_KEY
  if (!secret || auth !== `Bearer ${secret}`) {
    console.warn("Unauthorized revalidation attempt", { auth })
    return new Response("Unauthorized", { status: 401, headers: corsHeaders(origin) })
  }

  const { tag } = await params
  revalidateTag(tag, 'max')
  return new Response(`Revalidated tag: ${tag}`, { status: 200, headers: corsHeaders(origin) })
}
