import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";
import socket from "../../lib/socket";
import { HiLocationMarker, HiRefresh } from "react-icons/hi";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 30.3753, lng: 69.3451 };

const RIDER_ICON = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#ff5a36",
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 2,
  scale: 1.6,
  anchor: { x: 12, y: 24 },
};

const DEST_ICON = {
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#22c55e",
  fillOpacity: 1,
  strokeColor: "#fff",
  strokeWeight: 2,
  scale: 1.8,
  anchor: { x: 12, y: 24 },
};

const LiveTracking = ({ orderId, destLat, destLng }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_APP_GOOGLE_MAPS_KEY || "",
  });

  const [riderPos, setRiderPos] = useState(null);
  const [showRiderInfo, setShowRiderInfo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mapRef = useRef(null);
  const animFrameRef = useRef(null);
  const currentPosRef = useRef(null);

  const destPos =
    destLat && destLng ? { lat: Number(destLat), lng: Number(destLng) } : null;

  // Smooth interpolation
  const animateMarker = useCallback((from, to) => {
    if (!from) {
      setRiderPos(to);
      currentPosRef.current = to;
      return;
    }
    const DURATION = 1500;
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

  useEffect(() => {
    if (!orderId) return;
    const handle = ({ orderId: id, latitude, longitude }) => {
      if (id !== orderId) return;
      const to = { lat: latitude, lng: longitude };
      setLastUpdated(new Date());
      animateMarker(currentPosRef.current, to);
      if (mapRef.current) mapRef.current.panTo(to);
    };
    socket.on("receive-location", handle);
    return () => {
      socket.off("receive-location", handle);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [orderId, animateMarker]);

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

  // Center: prefer rider position, then destination, then default
  const center = riderPos || destPos || DEFAULT_CENTER;
  const zoom = riderPos || destPos ? 15 : 5;

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
        {/* 🛵 Rider marker — moving */}
        {riderPos && (
          <Marker
            position={riderPos}
            icon={RIDER_ICON}
            onClick={() => setShowRiderInfo((v) => !v)}
          >
            {showRiderInfo && (
              <InfoWindow onCloseClick={() => setShowRiderInfo(false)}>
                <div className="text-xs font-semibold text-slate-700">
                  🛵 Rider en route
                  {lastUpdated && (
                    <p className="mt-0.5 text-slate-400">
                      {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}

        {/* 📍 Destination marker — fixed green pin */}
        {destPos && <Marker position={destPos} icon={DEST_ICON}></Marker>}

        {/* Route line between rider and destination */}
        {riderPos && destPos && (
          <Polyline
            path={[riderPos, destPos]}
            options={{
              strokeColor: "#ff5a36",
              strokeOpacity: 0.5,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        )}
      </GoogleMap>

      {/* Waiting overlay */}
      {!riderPos && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center shadow-lg">
            <HiLocationMarker className="mx-auto animate-bounce text-3xl text-[#ff5a36]" />
            <p className="mt-2 text-sm font-bold text-slate-700">
              Waiting for rider location…
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Map updates once the rider starts moving.
            </p>
          </div>
        </div>
      )}

      {/* Last updated badge */}
      {lastUpdated && (
        <div className="absolute bottom-3 right-3 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow backdrop-blur">
          📍 {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Legend */}
      <div className="absolute left-3 top-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold shadow backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[#ff5a36]" /> Rider
        </div>
        {destPos && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold shadow backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Your location
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTracking;
