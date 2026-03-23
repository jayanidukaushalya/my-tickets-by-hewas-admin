import { GOOGLE_MAPS_API_KEY } from "@/configs/env.config"
import { GOOGLE_MAPS_LIBRARIES } from "@/integrations/google-maps"
import { useJsApiLoader } from "@react-google-maps/api"
import type React from "react"

export function GoogleMapsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  // Prevent children rendering until Google Maps script lands in DOM
  if (loadError) {
    return (
      <div className="flex p-6 text-sm font-medium text-destructive">
        Failed to initialize Google Maps backend
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex animate-pulse p-6 text-sm font-medium text-muted-foreground">
        Loading mapping dependencies...
      </div>
    )
  }

  return <>{children}</>
}
