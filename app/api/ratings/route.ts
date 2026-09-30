import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/ratings : average rating and review count for every reviewed cafe,
// keyed by placeId. Used by the map's minimum-rating filter.
export async function GET() {
  try {
    const cafes = await prisma.cafe.findMany({
      where: { reviews: { some: {} } },
      select: { placeId: true, reviews: { select: { rating: true } } },
    })

    const result: Record<string, { average: number; count: number }> = {}
    for (const cafe of cafes) {
      const count = cafe.reviews.length
      const sum = cafe.reviews.reduce((total, r) => total + r.rating, 0)
      result[cafe.placeId] = { average: sum / count, count }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error("GET /api/ratings error:", err)
    return NextResponse.json({ error: "Something went wrong on the server." }, { status: 500 })
  }
}
