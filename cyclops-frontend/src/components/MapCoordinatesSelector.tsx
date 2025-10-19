// components/admin/MapSelector.tsx
import { useEffect, useRef } from "react";

interface MapCoordinatesSelectorProps {
    value: [number, number] | null;
    onChange: (coords: [number, number]) => void;
}

export default function MapCoordinatesSelector({ value, onChange }: MapCoordinatesSelectorProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!, // or process.env
        libraries,
    });

    const [mapCenter, setMapCenter] = useState(() =>
        value ? { lat: value[0], lng: value[1] } : centerDefault
    );

    const handleClick = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            onChange([lat, lng]);
        },
        [onChange]
    );

    if (loadError) return <p className="text-red-500">Error loading map</p>;
    if (!isLoaded) return <p>Loading map...</p>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={value ? { lat: value[0], lng: value[1] } : mapCenter}
            zoom={value ? 13 : 6}
            onClick={handleClick}
        >
            {value && <MarkerF position={{ lat: value[0], lng: value[1] }} />}
        </GoogleMap>
    );
}