"use client";

import { useState, useCallback } from "react";

type GeolocationState = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          isLoading: false,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location access denied. Please select manually on the map.",
          2: "Location is currently unavailable.",
          3: "Location request timed out. Please try again.",
        };
        setState((s) => ({
          ...s,
          error: messages[err.code] ?? "Unknown geolocation error.",
          isLoading: false,
        }));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return { ...state, getLocation };
}
