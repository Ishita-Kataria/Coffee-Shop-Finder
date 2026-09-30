"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import CafeReviews from "@/components/CafeReviews"

// Leaflet's default marker icons break in Next.js, so we point them to a CDN
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

type Cafe = {
  id: string // e.g. "node/123456" or "way/123456"
  name: string
  lat: number
  lon: number
  address: string
  hasWifi: boolean | null
}

// Fallback location (New Delhi) if the user denies location access
const FALLBACK_POSITION = { lat: 28.6139, lon: 77.209 }

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], 15)
  }, [lat, lon, map])
  return null
}

function cafePayload(cafe: Cafe) {
  return {
    placeId: cafe.id,
    name: cafe.name,
    address: cafe.address,
    latitude: cafe.lat,
    longitude: cafe.lon,
    hasWifi: cafe.hasWifi,
  }
}

export default function CafeMap() {
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null)
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  // Step A: get the user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(FALLBACK_POSITION)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        console.error("Location error:", err)
        setPosition(FALLBACK_POSITION)
      }
    )
  }, [])

  // Step B: once we have a location, find nearby cafes using the Overpass API
  useEffect(() => {
    if (!position) return

    setLoading(true)
    setError(null)
    const { lat, lon } = position
    const radius = 2000

    const query = `
      [out:json][timeout:25];
      nwr["amenity"="cafe"](around:${radius},${lat},${lon});
      out center tags;
    `

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Overpass responded with ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const results: Cafe[] = data.elements
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((el: any) => ({
            id: `${el.type}/${el.id}`,
            name: el.tags?.name || "Unnamed cafe",
            lat: el.lat ?? el.center?.lat,
            lon: el.lon ?? el.center?.lon,
            address:
              [
                el.tags?.["addr:housenumber"],
                el.tags?.["addr:street"],
                el.tags?.["addr:city"],
              ]
                .filter(Boolean)
                .join(", ") || "Address not available",
            hasWifi: el.tags?.internet_access
              ? el.tags.internet_access !== "no"
              : null,
          }))
          .filter((c: Cafe) => c.lat != null && c.lon != null)
        setCafes(results)
      })
      .catch((err) => {
        console.error("Overpass API error:", err)
        setError("Could not load nearby cafes. Please try again in a moment.")
      })
      .finally(() => setLoading(false))
  }, [position])

  // Load the signed-in user's favorites (silently ignored if signed out)
  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : []))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((favs: any[]) =>
        setFavoriteIds(new Set(favs.map((f) => f.cafe.placeId as string)))
      )
      .catch(() => {})
  }, [])

  // Save a cafe to the database
  async function handleSaveCafe(cafe: Cafe) {
    try {
      const res = await fetch("/api/cafes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cafePayload(cafe)),
      })
      if (res.status === 401) {
        alert("Please sign in to save cafes.")
        return
      }
      if (!res.ok) {
        alert("Could not save this cafe. Please try again.")
        return
      }
      const saved = await res.json()
      alert(`${saved.name} was saved.`)
    } catch {
      alert("Could not save this cafe. Please check your connection.")
    }
  }

  // Add or remove a cafe from the user's favorites
  async function handleToggleFavorite(cafe: Cafe) {
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cafePayload(cafe)),
      })
      if (res.status === 401) {
        alert("Please sign in to add favorites.")
        return
      }
      if (!res.ok) {
        alert("Something went wrong. Please try again.")
        return
      }
      const { favorited } = await res.json()
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (favorited) next.add(cafe.id)
        else next.delete(cafe.id)
        return next
      })
    } catch {
      alert("Something went wrong. Please check your connection.")
    }
  }

  if (!position) return <p>Getting your location...</p>

  return (
    <div>
      {loading && <p>Searching for cafes...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && <p>{cafes.length} cafes found nearby</p>}
      <MapContainer
        center={[position.lat, position.lon]}
        zoom={15}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <RecenterMap lat={position.lat} lon={position.lon} />

        <Marker position={[position.lat, position.lon]}>
          <Popup>You are here</Popup>
        </Marker>

        {cafes.map((cafe) => (
          <Marker key={cafe.id} position={[cafe.lat, cafe.lon]}>
            <Popup minWidth={260}>
              <div>
                <b>{cafe.name}</b>
                <br />
                <span>{cafe.address}</span>
                <br />
                {cafe.hasWifi !== null && (
                  <span>{cafe.hasWifi ? "Wi-Fi available" : "No Wi-Fi"}</span>
                )}
                <br />
                <button onClick={() => handleSaveCafe(cafe)}>Save cafe</button>{" "}
                <button onClick={() => handleToggleFavorite(cafe)}>
                  {favoriteIds.has(cafe.id) ? "★ Favorited" : "☆ Favorite"}
                </button>
                <CafeReviews cafe={cafePayload(cafe)} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}