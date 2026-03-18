import { GOOGLE_MAPS_LIBRARIES } from "@/integrations/google-maps"
import { cn } from "@/lib/utils"
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api"

export interface LocationMapProps {
  lat: number
  lng: number
  googleMapsApiKey: string
  googleMapsMapId: string
  className?: string
}

export function LocationMap({
  lat,
  lng,
  googleMapsApiKey,
  googleMapsMapId,
  className,
}: LocationMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  if (!isLoaded || typeof lat !== "number" || typeof lng !== "number") {
    // Optionally return a skeleton/placeholder here
    return (
      <div 
        className={cn(
          "w-full h-[200px] rounded-xl bg-muted/20 animate-pulse border border-border/20",
          className
        )} 
      />
    )
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/20 shadow-sm",
        className
      )}
    >
      {/* Invisible overlay to intercept all pointer events so the map is completely read-only */}
      <div className="pointer-events-auto absolute inset-0 z-10 block" />
      <GoogleMap
        mapContainerStyle={{ width: "100%", minHeight: "200px", height: "100%" }}
        center={{ lat, lng }}
        zoom={14}
        options={{
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          mapId: googleMapsMapId,
          draggable: false,
          keyboardShortcuts: false,
          disableDefaultUI: true,
        }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </div>
  )
}
