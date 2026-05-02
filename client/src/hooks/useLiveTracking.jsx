import { useEffect, useRef, useCallback } from "react";
import socket from "../lib/socket";

const useLiveTracking = (orderId, active = true) => {
  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);
  const THROTTLE_MS = 2500;

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active || !orderId) return;

    if (!navigator.geolocation) {
      console.warn("useLiveTracking: Geolocation not supported");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastEmitRef.current < THROTTLE_MS) return;
        lastEmitRef.current = now;

        const { latitude, longitude } = position.coords;

        if (socket.connected) {
          socket.emit("send-location", {
            orderId,
            latitude,
            longitude,
          });
        }
      },
      (error) => {
        console.error("useLiveTracking geolocation error:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      },
    );

    return () => stopTracking();
  }, [active, orderId, stopTracking]);

  return { stopTracking };
};

export default useLiveTracking;
