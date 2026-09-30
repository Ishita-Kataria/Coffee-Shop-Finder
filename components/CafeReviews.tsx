"use client"

import { useCallback, useEffect, useState } from "react"

type CafeData = {
  placeId: string
  name: string
  address: string
  latitude: number
  longitude: number
  hasWifi: boolean | null
}

type ReviewItem = {
  id: string
  rating: number
  comment: string | null
  user: { name: string | null }
}

function stars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating)
}

export default function CafeReviews({ cafe }: { cafe: CafeData }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?placeId=${encodeURIComponent(cafe.placeId)}`)
      if (!res.ok) return
      const data = await res.json()
      setReviews(data.reviews)
      setAverage(data.average)
      setCount(data.count)
    } catch {
      // ignore: reviews just won't show
    }
  }, [cafe.placeId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  async function handleSubmit() {
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cafe, rating, comment }),
      })
      if (res.status === 401) {
        setMessage("Please sign in to write a review.")
        return
      }
      if (!res.ok) {
        setMessage("Could not save your review. Please try again.")
        return
      }
      setComment("")
      setMessage("Your review was saved.")
      await loadReviews()
    } catch {
      setMessage("Could not save your review. Please check your connection.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: "8px", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
      <b>
        {count > 0 && average !== null
          ? `${average.toFixed(1)} / 5 (${count} review${count === 1 ? "" : "s"})`
          : "No reviews yet"}
      </b>

      {reviews.length > 0 && (
        <div style={{ maxHeight: "120px", overflowY: "auto", margin: "6px 0" }}>
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id} style={{ marginBottom: "6px" }}>
              <div>
                {stars(r.rating)} {r.user.name ?? "Anonymous"}
              </div>
              {r.comment && <div>{r.comment}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "6px" }}>
        <label>
          Your rating:{" "}
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            <option value={5}>5 - Excellent</option>
            <option value={4}>4 - Good</option>
            <option value={3}>3 - Okay</option>
            <option value={2}>2 - Poor</option>
            <option value={1}>1 - Bad</option>
          </select>
        </label>
        <br />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a short review (optional)"
          maxLength={500}
          rows={2}
          style={{ width: "100%", marginTop: "4px" }}
        />
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Submit review"}
        </button>
        {message && <div>{message}</div>}
      </div>
    </div>
  )
}
