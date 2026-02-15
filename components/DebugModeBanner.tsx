"use client";

import { useEffect } from "react";
import { getDebugLocation } from "@/lib/debug-location-cookie";

const DEBUG_CLASS = "sas-debug-mode";

function applyDebugMode(on: boolean) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;
  if (on) {
    html.classList.add(DEBUG_CLASS);
    body.classList.add(DEBUG_CLASS);
  } else {
    html.classList.remove(DEBUG_CLASS);
    body.classList.remove(DEBUG_CLASS);
  }
}

export function DebugModeBanner() {
  useEffect(() => {
    applyDebugMode(getDebugLocation() !== null);
    const onVisibility = () => applyDebugMode(getDebugLocation() !== null);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      applyDebugMode(false);
    };
  }, []);
  return null;
}
