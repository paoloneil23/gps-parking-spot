import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// --- Icons ---
function createParkingIcon(backgroundColor, borderColor) {
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${backgroundColor};border:2px solid ${borderColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;box-shadow:0 4px 10px rgba(0,0,0,0.28);">P</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

const greenIcon = createParkingIcon("#189a56", "#0f6b3b");
const redIcon = createParkingIcon("#d64f4f", "#8f2e2e");
const blueIcon = createParkingIcon("#2f67d7", "#1f4593");
const DEFAULT_ZOOM = 18;

// --- Helper functions ---
function getSpotCoordinates(spot) {
  if (!spot) return null;
  if (spot.latitude && spot.longitude) return [Number(spot.latitude), Number(spot.longitude)];
  if (spot.location?.coordinates?.length >= 2)
    return [Number(spot.location.coordinates[1]), Number(spot.location.coordinates[0])];
  return null;
}

function RecenterMap({ center }) {
  const map = useMap();
  map.setView(center, DEFAULT_ZOOM);
  return null;
}

function haversineDistanceMeters([lat1, lng1], [lat2, lng2]) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Main Component ---
function MapView({ spot: selectedSpot, spots: providedSpots = [], onSelectSpot }) {
  const [userCoords, setUserCoords] = useState(null);
  const [locationPermissionState, setLocationPermissionState] = useState("pending");
  const [nearbySpots, setNearbySpots] = useState([]); // fallback spots fetched by user location
  const [routePath, setRoutePath] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);

  // --- Track user location ---
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermissionState("unsupported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserCoords([position.coords.latitude, position.coords.longitude]);
        setLocationPermissionState("granted");
      },
      () => setLocationPermissionState("denied"),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // --- Fetch nearby parking spots when user location changes ---
  useEffect(() => {
    if (providedSpots.length > 0) return;
    if (!userCoords) return;
    const [lat, lng] = userCoords;

    fetch(`http://localhost:5000/api/parking/search?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((data) => setNearbySpots(data))
      .catch((err) => console.error("Error fetching parking spots:", err));
  }, [providedSpots.length, userCoords]);

  const displaySpots = useMemo(
    () => (providedSpots.length > 0 ? providedSpots : nearbySpots),
    [providedSpots, nearbySpots]
  );

  // --- Map markers ---
  const markerSpots = useMemo(
    () => displaySpots.map((s) => ({ ...s, coords: getSpotCoordinates(s) })).filter((s) => s.coords),
    [displaySpots]
  );

  const selectedCoords = useMemo(() => getSpotCoordinates(selectedSpot) || [43.6532, -79.3832], [selectedSpot]);

  return (
    <MapContainer className="parking-map" center={selectedCoords} zoom={DEFAULT_ZOOM} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <RecenterMap center={selectedCoords} />

      {userCoords && (
        <CircleMarker
          center={userCoords}
          radius={8}
          pathOptions={{ color: "#1976d2", fillColor: "#42a5f5", fillOpacity: 0.9 }}
        >
          <Popup>Your Location</Popup>
        </CircleMarker>
      )}

      {markerSpots.map((item) => {
        const available = item.availableSpots > 0 || item.isAvailable;
        const icon = selectedSpot?._id === item._id ? blueIcon : available ? greenIcon : redIcon;
        return (
          <Marker
            key={item._id}
            position={item.coords}
            icon={icon}
            eventHandlers={{ click: () => onSelectSpot && onSelectSpot(item) }}
          >
            <Popup>
              {item.lotName || "Parking Lot"} <br /> Available: {item.availableSpots} | Reserved: {item.reservedSpots}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapView;