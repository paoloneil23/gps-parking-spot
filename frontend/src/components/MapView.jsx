import "leaflet/dist/leaflet.css";
import "./MapView.css";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  LayersControl,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { getApiBase, parseResponseSafely } from "../utils/api";

const API_BASE = getApiBase();

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
const yellowIcon = createParkingIcon("#d8a11d", "#9f6f0b");
const redIcon = createParkingIcon("#d64f4f", "#8f2e2e");
const blueIcon = createParkingIcon("#2f67d7", "#1f4593");
const DEFAULT_ZOOM = 20;
const MAX_MAP_ZOOM = 22;
const SATELLITE_MAX_ZOOM = 20;

// --- Helper functions ---
function getSpotCoordinates(spot) {
  if (!spot) return null;
  if (spot.latitude && spot.longitude) return [Number(spot.latitude), Number(spot.longitude)];
  if (spot.location?.coordinates?.length >= 2)
    return [Number(spot.location.coordinates[1]), Number(spot.location.coordinates[0])];
  return null;
}

function RecenterMap({ center, recenterSignal }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, DEFAULT_ZOOM);
  }, [map, recenterSignal]);
  return null;
}

function LocateMeControl({ targetCoords }) {
  const map = useMap();

  if (!targetCoords) {
    return null;
  }

  return (
    <div className="leaflet-bottom leaflet-right map-locate-wrap">
      <button
        type="button"
        className="leaflet-control map-locate-btn"
        title="Go to my location"
        aria-label="Go to my location"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          map.flyTo(targetCoords, DEFAULT_ZOOM, { duration: 0.6 });
        }}
      >
        ⌖
      </button>
    </div>
  );
}

function MapSearchControl({ onSelectCoordinates }) {
  const map = useMap();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    setError("");
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
          trimmedQuery
        )}`
      );

      if (!response.ok) {
        throw new Error("Location lookup failed.");
      }

      const data = await response.json();
      const firstResult = Array.isArray(data) ? data[0] : null;

      if (!firstResult) {
        setError("No matching location found.");
        return;
      }

      const lat = Number(firstResult.lat);
      const lng = Number(firstResult.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError("Location result was invalid.");
        return;
      }

      map.flyTo([lat, lng], 18, { duration: 0.8 });
      if (typeof onSelectCoordinates === "function") {
        onSelectCoordinates({
          coords: [lat, lng],
          label: firstResult.display_name || trimmedQuery,
        });
      }
    } catch (searchError) {
      setError(searchError.message || "Unable to search this location right now.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="leaflet-top leaflet-left map-search-wrap">
      <form
        onSubmit={handleSearch}
        className="leaflet-control map-search-form"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search location"
          className="map-search-input"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="map-search-btn"
        >
          {isSearching ? "..." : "Go"}
        </button>
      </form>
      {error ? (
        <div className="leaflet-control map-search-error">
          {error}
        </div>
      ) : null}
    </div>
  );
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

function getAvailabilityState(spot) {
  const totalSpaces = Number(spot?.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
  const availableSpots =
    typeof spot?.availableSpots === "number"
      ? Math.max(spot.availableSpots, 0)
      : typeof spot?.isAvailable === "boolean"
        ? spot.isAvailable
          ? totalSpaces
          : 0
        : spot?.available === false
          ? 0
          : totalSpaces;

  if (availableSpots <= 0) {
    return "full";
  }

  if (availableSpots <= Math.max(1, Math.ceil(totalSpaces * 0.25))) {
    return "limited";
  }

  return "available";
}

function getAvailabilityLabel(state) {
  if (state === "full") {
    return "Occupied";
  }

  if (state === "limited") {
    return "Limited";
  }

  return "Available";
}

// --- Main Component ---
function MapView({
  spot: selectedSpot,
  spots: providedSpots = [],
  onSelectSpot,
  userCoords,
  recenterSignal = 0,
}) {
  const [trackedUserCoords, setTrackedUserCoords] = useState(null);
  const [locationPermissionState, setLocationPermissionState] = useState("pending");
  const [nearbySpots, setNearbySpots] = useState([]); // fallback spots fetched by user location
  const [routePath, setRoutePath] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeDuration, setRouteDuration] = useState(null);
  const [searchedLocation, setSearchedLocation] = useState(null);
  const activeUserCoords = userCoords || trackedUserCoords;

  // --- Track user location ---
  useEffect(() => {
    if (userCoords) {
      setLocationPermissionState("granted");
      return;
    }

    if (!navigator.geolocation) {
      setLocationPermissionState("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTrackedUserCoords([position.coords.latitude, position.coords.longitude]);
        setLocationPermissionState("granted");
      },
      () => setLocationPermissionState("denied"),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, [userCoords]);

  // --- Fetch nearby parking spots when user location changes ---
  useEffect(() => {
    if (providedSpots.length > 0) return;
    if (!activeUserCoords) return;
    const [lat, lng] = activeUserCoords;

    fetch(`${API_BASE}/api/parking/search?lat=${lat}&lng=${lng}`)
      .then(async (res) => {
        const data = await parseResponseSafely(res);
        if (!res.ok) {
          throw new Error(data.message || "Failed to load nearby parking spots.");
        }
        return data;
      })
      .then((data) => setNearbySpots(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching parking spots:", err));
  }, [providedSpots.length, activeUserCoords]);

  const displaySpots = useMemo(
    () => (providedSpots.length > 0 ? providedSpots : nearbySpots),
    [providedSpots, nearbySpots]
  );

  // --- Map markers ---
  const markerSpots = useMemo(
    () => displaySpots.map((s) => ({ ...s, coords: getSpotCoordinates(s) })).filter((s) => s.coords),
    [displaySpots]
  );

  const selectedCoords = useMemo(() => {
    if (activeUserCoords) return activeUserCoords;
    return getSpotCoordinates(selectedSpot) || [43.6532, -79.3832];
  }, [selectedSpot, activeUserCoords]);

  const markerLegend = {
    available: greenIcon,
    limited: yellowIcon,
    full: redIcon,
  };

  return (
    <MapContainer
      className="parking-map"
      center={selectedCoords}
      zoom={DEFAULT_ZOOM}
      maxZoom={MAX_MAP_ZOOM}
      zoomSnap={0.5}
      scrollWheelZoom
      style={{ width: "100%", height: "100%", minHeight: "clamp(520px, 74vh, 920px)" }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="Street View">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={MAX_MAP_ZOOM}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked name="Satellite View">
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={SATELLITE_MAX_ZOOM}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <RecenterMap center={selectedCoords} recenterSignal={recenterSignal} />
      <LocateMeControl targetCoords={activeUserCoords} />
      <MapSearchControl onSelectCoordinates={setSearchedLocation} />

      {activeUserCoords && (
        <CircleMarker
          center={activeUserCoords}
          radius={8}
          pathOptions={{ color: "#1976d2", fillColor: "#42a5f5", fillOpacity: 0.9 }}
        >
          <Popup>Your Location</Popup>
        </CircleMarker>
      )}

      {searchedLocation?.coords && (
        <CircleMarker
          center={searchedLocation.coords}
          radius={7}
          pathOptions={{ color: "#0f4fa8", fillColor: "#2a7de1", fillOpacity: 0.88 }}
        >
          <Popup>{searchedLocation.label || "Searched Location"}</Popup>
        </CircleMarker>
      )}

      {markerSpots.map((item) => {
        const availabilityState = getAvailabilityState(item);
        const availabilityLabel = getAvailabilityLabel(availabilityState);
        const icon = selectedSpot?._id === item._id ? blueIcon : markerLegend[availabilityState] || redIcon;
        return (
          <Marker
            key={item._id}
            position={item.coords}
            icon={icon}
            eventHandlers={{ click: () => onSelectSpot && onSelectSpot(item) }}
          >
            <Popup>
              {item.lotName || "Parking Lot"} <br />
              Status: {availabilityLabel} <br />
              Available: {item.availableSpots} | Reserved: {item.reservedSpots} | Occupied: {item.occupiedSpots || 0}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapView;