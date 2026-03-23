import { GOOGLE_MAPS_MAP_ID } from "@/configs/env.config"
import { cn } from "@/lib/utils"
import { GoogleMap, Marker } from "@react-google-maps/api"

export interface LocationMapProps {
  lat: number
  lng: number
  className?: string
}

export function LocationMap({
  lat,
  lng,
  className,
}: LocationMapProps) {
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
        mapContainerStyle={{
          width: "100%",
          minHeight: "200px",
          height: "100%",
        }}
        center={{ lat, lng }}
        zoom={14}
        options={{
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          mapId: GOOGLE_MAPS_MAP_ID,
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
