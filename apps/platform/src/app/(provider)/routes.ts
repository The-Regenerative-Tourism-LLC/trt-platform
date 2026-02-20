import { createProvider, getProviders } from "@/lib/db/provider.repo"

export async function POST(req: Request) {
  const { name, email } = await req.json()

  if (!name || !email) {
    return Response.json({ error: "Missing fields" }, { status: 400 })
  }

  const provider = await createProvider(name, email)

  return Response.json(provider)
}

export async function GET() {
  const providers = await getProviders()

  return Response.json(providers)
}