import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// POST: save a cafe (or return the existing one if it is already saved)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 })
  }

  try {
    const { placeId, name, address, latitude, longitude, hasWifi } = await req.json()

    if (
      !placeId ||
      !name ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "placeId, name, latitude and longitude are required." },
        { status: 400 }
      )
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

    return NextResponse.json(cafe)
  } catch (err) {
    console.error("POST /api/cafes error:", err)
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}

// GET: list all saved cafes (will be used for filters later)
export async function GET() {
  try {
    const cafes = await prisma.cafe.findMany({
      include: { reviews: true },
    })
    return NextResponse.json(cafes)
  } catch (err) {
    console.error("GET /api/cafes error:", err)
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}