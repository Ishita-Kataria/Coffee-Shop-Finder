"use client"

import { useCallback, useEffect, useState } from "react"

type FavoriteItem = {
  id: string
  cafe: {
    placeId: string
    name: string
    address: string
    latitude: number
    longitude: number
    hasWifi: boolean | null
  }
}

export default function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites")
      if (!res.ok) {
        setError("Could not load your favorites.")
        return
      }
      setFavorites(await res.json())
      setError(null)
    } catch {
      setError("Could not load your favorites. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFavorites()
    // The map dispatches this event whenever a favorite is added or removed
    window.addEventListener("favorites-changed", loadFavorites)
    return () => window.removeEventListener("favorites-changed", loadFavorites)
  }, [loadFavorites])

  async function handleRemove(cafe: FavoriteItem["cafe"]) {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cafe),
      })
      if (!res.ok) {
        alert("Could not remove this favorite. Please try again.")
        return
      }
      window.dispatchEvent(new Event("favorites-changed"))
    } catch {
      alert("Could not remove this favorite. Please check your connection.")
    }
  }

  return (
    <div>
      <h2>My favorites ({favorites.length})</h2>
      {loading && <p>Loading your favorites...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && favorites.length === 0 && (
        <p>You have no favorites yet. Click a cafe on the map and press Favorite.</p>
      )}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {favorites.map((fav) => (
          <li
            key={fav.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "6px",
              padding: "10px",
              marginBottom: "8px",
            }}
          >
            <b>{fav.cafe.name}</b>
            <div>{fav.cafe.address}</div>
            {fav.cafe.hasWifi !== null && (
              <div>{fav.cafe.hasWifi ? "Wi-Fi available" : "No Wi-Fi"}</div>
            )}
            <button onClick={() => handleRemove(fav.cafe)} style={{ marginTop: "6px" }}>
              Remove from favorites
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
