import { useRef, useEffect } from 'react'
import { Navigation } from 'lucide-react'

export default function AddressAutocomplete({ value, onChange, onPlaceSelect }) {
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)
  // Always keep a ref to the latest callbacks so the listener never captures stale closures
  const onPlaceSelectRef = useRef(onPlaceSelect)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onPlaceSelectRef.current = onPlaceSelect }, [onPlaceSelect])
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  function initAutocomplete() {
    if (autocompleteRef.current || !inputRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ma' },
      fields: ['formatted_address', 'geometry', 'address_components'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (!place?.geometry) return

      const address = place.formatted_address || inputRef.current.value
      onChangeRef.current(address)

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()

      function extractQuartier(components) {
        if (!components) return ''
        for (const type of ['sublocality_level_1', 'sublocality', 'neighborhood', 'administrative_area_level_3']) {
          const comp = components.find(c => c.types.includes(type))
          if (comp) return comp.long_name
        }
        return ''
      }

      let quartier = extractQuartier(place.address_components)

      if (quartier) {
        onPlaceSelectRef.current?.({ address, lat, lng, quartier })
      } else {
        const geocoder = new window.google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results.length > 0) {
            for (const result of results) {
              const q = extractQuartier(result.address_components)
              if (q) { quartier = q; break }
            }
          }
          onPlaceSelectRef.current?.({ address, lat, lng, quartier })
        })
      }
    })
  }

  useEffect(() => {
    // If already loaded, init immediately
    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }

    // Poll until Google Maps script is ready
    const interval = setInterval(() => {
      if (window.google?.maps?.places) {
        clearInterval(interval)
        initAutocomplete()
      }
    }, 200)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold pointer-events-none">
        <Navigation size={16} />
      </span>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Ex: 12 Rue Mohammed V, Casablanca..."
        required
        autoComplete="off"
        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50"
      />
    </div>
  )
}
