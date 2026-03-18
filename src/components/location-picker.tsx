import {
  GOOGLE_MAPS_DEFAULT_CENTER,
  GOOGLE_MAPS_DEFAULT_ZOOM,
  GOOGLE_MAPS_LIBRARIES,
} from "@/integrations/google-maps"
import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api"
import type React from "react"
import { useCallback, useRef, useState } from "react"

export interface PickedLocation {
  lat: number
  lng: number
  label: string
  address?: string
  name?: string
}

interface LocationPickerProps {
  value?: PickedLocation | null
  onChange?: (location: PickedLocation) => void
  className?: string
  googleMapsApiKey: string
  googleMapsMapId: string
}

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  height: "100%",
}

// Map style is now controlled via Cloud Console using the Map ID

export function LocationPicker({
  value,
  onChange,
  className,
  googleMapsApiKey,
  googleMapsMapId,
}: LocationPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  )
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(
    value ? { lat: value.lat, lng: value.lng } : GOOGLE_MAPS_DEFAULT_CENTER
  )
  const [searchValue, setSearchValue] = useState(value?.label ?? "")

  const emitChange = useCallback(
    (
      pos: google.maps.LatLngLiteral,
      label: string,
      name?: string,
      address?: string
    ) => {
      setMarkerPos(pos)
      setMapCenter(pos)
      setSearchValue(label)

      onChange?.({ lat: pos.lat, lng: pos.lng, label, name, address })
    },
    [onChange]
  )

  /** Reverse geocode a lat/lng to a human-readable address then emit */
  const reverseGeocode = useCallback(
    (pos: google.maps.LatLngLiteral) => {
      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: pos }, (results, status) => {
        const address =
          status === "OK" && results?.[0] ? results[0].formatted_address : ""
        emitChange(pos, address, "", address)
      })
    },
    [emitChange]
  )

  const handleAutocompleteLoad = useCallback(
    (ref: google.maps.places.Autocomplete) => {
      autocompleteRef.current = ref
    },
    []
  )

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const pos = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    }
    const name = place.name
    const address = place.formatted_address
    const label = address ?? name ?? ""
    emitChange(pos, label, name, address)
  }, [emitChange])

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      reverseGeocode({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    },
    [reverseGeocode]
  )

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      reverseGeocode({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    },
    [reverseGeocode]
  )

  const handleClearSearch = useCallback(() => {
    setSearchValue("")
    setMarkerPos(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  if (loadError) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 text-xs text-destructive">
        Failed to load Google Maps. Check your API key.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div
        className="h-[360px] animate-pulse rounded-xl bg-muted/20"
        aria-label="Loading map…"
      />
    )
  }

  return (
    <div className={className}>
      {/* Map container with search bar floating inside like Google Maps */}
      <div
        className="relative overflow-hidden rounded-xl border border-border/30 shadow-inner"
        style={{ height: 360 }}
      >
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={mapCenter}
          zoom={GOOGLE_MAPS_DEFAULT_ZOOM}
          onClick={handleMapClick}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            mapId: googleMapsMapId,
            gestureHandling: "cooperative",
          }}
        >
          {markerPos && (
            <Marker
              position={markerPos}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          )}
        </GoogleMap>

        {/* Floating search bar – overlaid on top of the map, like Google Maps */}
        <div className="absolute top-3 right-3 left-3 z-10">
          <Autocomplete
            onLoad={handleAutocompleteLoad}
            onPlaceChanged={handlePlaceChanged}
            options={{
              types: ["establishment", "geocode"],
              componentRestrictions: { country: "lk" },
            }}
          >
            <div className="relative flex items-center">
              <HugeiconsIcon
                icon={Search01Icon}
                className="pointer-events-none absolute left-3 size-4 text-muted-foreground/70"
                strokeWidth={1.5}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for a name or place…"
                defaultValue={searchValue}
                className="h-10 w-full rounded-lg border border-border/40 bg-foreground px-9 text-sm text-background/70 shadow-sm outline-0 transition-colors"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                  aria-label="Clear search"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    className="size-4"
                    strokeWidth={1.5}
                  />
                </button>
              )}
            </div>
          </Autocomplete>
        </div>

        {/* Hint overlay — only shown when no pin is placed */}
        {!markerPos && (
          <div className="pointer-events-none absolute right-0 bottom-4 left-0 flex justify-center">
            <div className="rounded-lg bg-card/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm">
              Search above or click on the map to pin your name
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
