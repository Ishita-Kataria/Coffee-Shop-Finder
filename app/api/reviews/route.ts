import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// GET /api/reviews?placeId=... : reviews and average rating for one cafe
export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get("placeId")
  if (!placeId) {
    return NextResponse.json({ error: "placeId is required." }, { status: 400 })
  }

  try {
    const cafe = await prisma.cafe.findUnique({
      where: { placeId },
      select: { id: true },
    })

    if (!cafe) {
      return NextResponse.json({ reviews: [], average: null, count: 0 })
    }

    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: { cafeId: cafe.id },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.review.aggregate({
        where: { cafeId: cafe.id },
        _avg: { rating: true },
        _count: true,
      }),
    ])

    return NextResponse.json({
      reviews,
      average: stats._avg.rating,
      count: stats._count,
    })
  } catch (err) {
    console.error("GET /api/reviews error:", err)
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}

// POST: create or update the signed-in user's review for a cafe
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 })
  }
  const userId = session.user.id

  try {
    const { placeId, name, address, latitude, longitude, hasWifi, rating, comment } =
      await req.json()

    if (
      !placeId ||
      !name ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return NextResponse.json({ error: "Cafe data is incomplete." }, { status: 400 })
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a whole number from 1 to 5." },
        { status: 400 }
      )
    }

    const cleanComment =
      typeof comment === "string" && comment.trim()
        ? comment.trim().slice(0, 500)
        : null

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

    const review = await prisma.review.upsert({
      where: { userId_cafeId: { userId, cafeId: cafe.id } },
      update: { rating, comment: cleanComment },
      create: { userId, cafeId: cafe.id, rating, comment: cleanComment },
    })

    return NextResponse.json(review)
  } catch (err) {
    console.error("POST /api/reviews error:", err)
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}
