import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST: naya café save karo (ya agar already hai, wahi return karo)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { placeId, name, address, latitude, longitude } = body

  if (!placeId || !name) {
    return NextResponse.json({ error: "placeId aur name zaroori hai" }, { status: 400 })
  }

  const cafe = await prisma.cafe.upsert({
    where: { placeId: String(placeId) },
    update: {}, // agar already exist karta hai, kuch update nahi karna abhi
    create: {
      placeId: String(placeId),
      name,
      address: address || "Address not available",
      latitude,
      longitude,
    },
  })

  return NextResponse.json(cafe)
}

// GET: sab saved cafés dikhao (baad mein filters ke liye use hoga)
export async function GET() {
  const cafes = await prisma.cafe.findMany({
    include: { reviews: true },
  })
  return NextResponse.json(cafes)
}