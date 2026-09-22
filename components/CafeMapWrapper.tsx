"use client"

import dynamic from "next/dynamic"

const CafeMap = dynamic(() => import("@/components/CafeMap"), { ssr: false })

export default function CafeMapWrapper() {
  return <CafeMap />
}