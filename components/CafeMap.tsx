"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Leaflet ke default marker icons Next.js mein break ho jaate hain, isliye fix kar rahe hain
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

type Cafe = {
  id: number
  name: string
  lat: number
  lon: number
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lon], 15)
  }, [lat, lon, map])
  return null
}

export default function CafeMap() {
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null)
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [loading, setLoading] = useState(false)

  // Step A: User ki current location lo
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      (err) => {
        console.error("Location error:", err)
        // Fallback: Delhi ka location (agar permission na mile)
        setPosition({ lat: 28.6139, lon: 77.209 })
      }
    )
  }, [])

  // Step B: Location milne ke baad Overpass API se cafés dhoondo
  useEffect(() => {
    if (!position) return

    setLoading(true)
    const { lat, lon } = position
    const radius = 2000 // meters

    const query = `
      [out:json];
      node["amenity"="cafe"](around:${radius},${lat},${lon});
      out;
    `

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    })
      .then((res) => res.json())
      .then((data) => {
        const results: Cafe[] = data.elements.map((el: any) => ({
          id: el.id,
          name: el.tags?.name || "Unnamed Café",
          lat: el.lat,
          lon: el.lon,
        }))
        setCafes(results)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Overpass API error:", err)
        setLoading(false)
      })
  }, [position])

  if (!position) return <p>Location la rahe hain...</p>

  return (
    <div>
      {loading && <p>Cafés dhoond rahe hain...</p>}
      <p>{cafes.length} cafés mile</p>
      <MapContainer
        center={[position.lat, position.lon]}
        zoom={15}
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <RecenterMap lat={position.lat} lon={position.lon} />

        <Marker position={[position.lat, position.lon]}>
          <Popup>Tum yahan ho 📍</Popup>
        </Marker>

        {cafes.map((cafe) => (
          <Marker key={cafe.id} position={[cafe.lat, cafe.lon]}>
            <Popup>☕ {cafe.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}