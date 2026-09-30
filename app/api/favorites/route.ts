import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// GET: list the signed-in user's favorite cafes
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 })
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { cafe: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(favorites)
  } catch (err) {
    console.error("GET /api/favorites error:", err)
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}

// POST: toggle a favorite. Removes it if it exists, adds it otherwise.
// The cafe is saved to the database automatically if it isn't there yet.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const { placeId, name, address, latitude, longitude, hasWifi } = await req.json()

    if (
      !placeId ||
      !name ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json({ error: "Cafe data is incomplete." }, { status: 400 })
    }

    const cafe = await prisma.cafe.upsert({
      where: { placeId: String(placeId) },
      update: {},
      create: {
        placeId: String(placeId),
        name,
        address: address || "Address not available",
        latitude,
        longitude,
        hasWifi: typeof hasWifi === "boolean" ? hasWifi : null,
      },
    })

    const existing = await prisma.favorite.findUnique({
      where: { userId_cafeId: { userId, cafeId: cafe.id } },
    })

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } })
      return NextResponse.json({ favorited: false })
    }

    await prisma.favorite.create({ data: { userId, cafeId: cafe.id } })
    return NextResponse.json({ favorited: true })
  } catch (err) {
    console.error("POST /api/favorites error:", err)
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}