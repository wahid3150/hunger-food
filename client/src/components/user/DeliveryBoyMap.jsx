import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";
import { HiLocationMarker, HiRefresh, HiClock } from "react-icons/hi";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 30.3753, lng: 69.3451 };
const AVG_SPEED_KMH = 25; // city delivery average

// ── Haversine distance in km
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const etaMinutes = (riderPos, destPos) => {
  if (!riderPos || !destPos) return null;
  const dist = haversineKm(
    riderPos.lat,
    riderPos.lng,
    destPos.lat,
    destPos.lng,
  );
  return Math.max(1, Math.round((dist / AVG_SPEED_KMH) * 60));
};

// Delivery scooter icon for the rider (orange)
const RIDER_ICON = {
  path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  fillColor: "#ff5a36",
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 1.5,
  scale: 1.4,
  anchor: { x: 12, y: 12 },
};

// House/destination pin for the customer (green)
const DEST_ICON = {
  path: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  fillColor: "#22c55e",
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 1.5,
  scale: 1.6,
  anchor: { x: 12, y: 22 },
};

const DeliveryBoyMap = ({ destLat, destLng, address }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_KEY || "",
  });

  const [riderPos, setRiderPos] = useState(null);
  const [showRiderInfo, setShowRiderInfo] = useState(false);
  const [showDestInfo, setShowDestInfo] = useState(false);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const animFrameRef = useRef(null);
  const currentPosRef = useRef(null);

  const destPos =
    destLat && destLng ? { lat: Number(destLat), lng: Number(destLng) } : null;

  // Smooth interpolation toward new GPS fix
  const animateTo = useCallback((from, to) => {
    if (!from) {
      setRiderPos(to);
      currentPosRef.current = to;
      return;
    }
    const DURATION = 1200;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const pos = {
        lat: from.lat + (to.lat - from.lat) * eased,
        lng: from.lng + (to.lng - from.lng) * eased,
      };
      setRiderPos(pos);
      currentPosRef.current = pos;
      if (t < 1) animFrameRef.current = requestAnimationFrame(step);
    };
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Watch own GPS position
  useEffect(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) => {
        const to = { lat: latitude, lng: longitude };
        animateTo(currentPosRef.current, to);

        // Pan map to keep rider in view
        if (mapRef.current) mapRef.current.panTo(to);

        // Recalculate ETA
        setEta(etaMinutes(to, destPos));
      },
      (err) => console.warn("DeliveryBoyMap GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateTo, destLat, destLng]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-slate-100 p-6 text-center">
        <div>
          <HiLocationMarker className="mx-auto text-4xl text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Map unavailable
          </p>
          <p className="mt-1 text-xs text-slate-400">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl bg-slate-100">
        <div className="text-center">
          <HiRefresh className="mx-auto animate-spin text-3xl text-[#ff5a36]" />
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Loading map…
          </p>
        </div>
      </div>
    );
  }

  const center = riderPos || destPos || DEFAULT_CENTER;
  const zoom = riderPos ? 15 : destPos ? 14 : 5;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        }}
      >
        {/* 🛵 Rider — own moving position */}
        {riderPos && (
          <Marker
            position={riderPos}
            icon={RIDER_ICON}
            onClick={() => setShowRiderInfo((v) => !v)}
          >
            {showRiderInfo && (
              <InfoWindow onCloseClick={() => setShowRiderInfo(false)}>
                <div className="text-xs font-semibold text-slate-700">
                  📍 Your location
                  {eta && (
                    <p className="mt-0.5 text-[#ff5a36]">
                      ~{eta} min to customer
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* 🏠 Customer destination — fixed house icon */}
        {destPos && (
          <Marker
            position={destPos}
            icon={DEST_ICON}
            onClick={() => setShowDestInfo((v) => !v)}
          >
            {showDestInfo && (
              <InfoWindow onCloseClick={() => setShowDestInfo(false)}>
                <div className="text-xs font-semibold text-slate-700">
                  🏠 Deliver here
                  {address && (
                    <p className="mt-0.5 text-slate-500">{address}</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* Route line between rider and destination */}
        {riderPos && destPos && (
          <Polyline
            path={[riderPos, destPos]}
            options={{
              strokeColor: "#ff5a36",
              strokeOpacity: 0.65,
              strokeWeight: 4,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>

      {/* Waiting for GPS overlay */}
      {!riderPos && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center shadow-lg">
            <HiRefresh className="mx-auto animate-spin text-2xl text-[#ff5a36]" />
            <p className="mt-2 text-sm font-bold text-slate-700">
              Getting your location…
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Enable GPS to see yourself on the map
            </p>
          </div>
        </div>
      )}

      {/* ETA badge */}
      {eta !== null && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-black text-slate-800 shadow backdrop-blur">
          <HiClock className="text-[#ff5a36]" />~{eta} min to customer
        </div>
      )}

      {/* Legend */}
      <div className="absolute left-3 top-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold shadow backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[#ff5a36]" /> You
        </div>
        {destPos && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold shadow backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Customer
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryBoyMap;
