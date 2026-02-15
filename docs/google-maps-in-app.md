# Embedding Google Maps on the Location Test Page

This guide explains how to show a Google Map **inside the app** on the location test page instead of linking out to Google Maps. The map will display the user’s current location (from the browser Geolocation API) and stay mobile-friendly. Everything described here can stay within Google’s free usage for a hackathon.

---

## 1. Cost: staying free for the hackathon

- **Google Maps Platform** is pay-as-you-go, but Google gives **free monthly usage** so many apps never pay.
- As of **March 2025**, the old “$200/month credit” was replaced by **free monthly usage thresholds** per product (e.g. Dynamic Maps). You get a set number of free map loads per month; beyond that you’re charged.
- For the **Maps JavaScript API** (the one we use to show a map in the page), you only need the **Dynamic Maps** SKU. Typical hackathon usage (dozens or hundreds of map loads) stays within the free tier.
- You must **enable billing** on the Google Cloud project and add a payment method, but you won’t be charged as long as you stay under the free thresholds. You can set **budget alerts** (e.g. $1) in Google Cloud Console to get notified if usage spikes.

**What counts toward cost?**

- **Map load:** You are billed once per **map load** i.e. when the map is first shown on the page. Refreshing the page or opening the location test page again = one more map load. The map does **not** reload when you poll location or add pins; we keep the same map instance and only add/update markers in the browser. So polling every 10 seconds and drawing a history of pins does **not** add any Google Maps API cost.
- **Location polling:** The browser’s Geolocation API (`navigator.geolocation`) is free; it does not use Google’s servers.
- **How to see your usage:** In [Google Cloud Console](https://console.cloud.google.com/) go to **APIs & Services → Dashboard** (or **Billing → Reports**) to see usage and cost. Set a small budget (e.g. $1) with email alerts so you know if you ever exceed free usage.

**References:**

- [Maps JavaScript API – Usage and Billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing)
- [Pricing and free usage (March 2025)](https://developers.google.com/maps/billing-and-pricing/march-2025)
- [Pricing overview](https://developers.google.com/maps/billing-and-pricing/overview)

---

## 2. Google Cloud setup

### 2.1 Create a project and enable the Maps JavaScript API

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. “Snap and Seek”) or select an existing one.
3. Open **APIs & Services → Library**.
4. Search for **“Maps JavaScript API”** and open it.
5. Click **Enable**.

You only need this one API for displaying a map and a marker; no Geocoding or Places API is required for “show my location on a map.”

### 2.2 Create an API key

1. Go to **APIs & Services → Credentials**.
2. Click **Create credentials → API key**.
3. Copy the key. You’ll use it in the app as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

**Optional but recommended:** restrict the key so it can’t be abused if leaked:

- **Application restrictions:** “HTTP referrers” and add your origins, e.g.  
  `http://localhost:3000/*`, `https://yourdomain.com/*`
- **API restrictions:** restrict to “Maps JavaScript API” only.

### 2.3 Billing

- Go to **Billing** and link a billing account (required to use the API).
- Set a **budget** (e.g. $1) with email alerts so you know if you ever exceed free usage.

---

## 3. Add the API key to the app

In the project root, add to `.env.local` (and to `.env.example` as a placeholder):

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Use the `NEXT_PUBLIC_` prefix so the key is available in the browser. Restart the dev server after changing env vars.

**Security:** The key will be visible in client-side code. That’s normal for Maps JavaScript API. Restricting the key by HTTP referrer (and optionally by API) in Google Cloud is what keeps it safe.

---

## 4. Install a React wrapper for Google Maps

The Maps JavaScript API is loaded via a script and used with a global `google` object. Using a React wrapper avoids script/state bugs and keeps the code clean. A common choice is `@react-google-maps/api`:

```bash
npm install @react-google-maps/api
```

It loads the Google script for you and exposes React components (`GoogleMap`, `Marker`, etc.) that work well with Next.js when used **only in client components**.

---

## 5. Load the map only on the client (Next.js)

The Google Maps script and `window.google` are browser-only. So:

- **Do not** import or render the map in a Server Component.
- Use a **Client Component** (`"use client"`) that either:
  - Renders the map only when the component is mounted (e.g. after getting the user’s location), or
  - Uses **dynamic import with `ssr: false`** for the component that actually renders the map, so it never runs on the server.

Example pattern:

- The existing **Location test** page gets the user’s position with `navigator.geolocation.getCurrentPosition`.
- Once you have `{ lat, lng }`, you render a **map component** that receives `lat` and `lng` as props.
- The map component is loaded with `next/dynamic` and `ssr: false`, and inside it you use `@react-google-maps/api` to show the map and a marker at `(lat, lng)`.

This keeps the map and the Google script out of the server bundle and avoids “window is not defined” errors.

---

## 6. Map component structure (conceptual)

- **Container:** A `<div>` that wraps the map. Give it a fixed height (e.g. `min-height: 300px` or `50vh`) and `width: 100%` so the map is visible and usable on mobile.
- **GoogleMap (from @react-google-maps/api):**
  - `center={{ lat, lng }}`
  - `zoom={15}` or so
  - `options` can disable unnecessary UI (e.g. fullscreen, street view) if you want a minimal in-app map.
- **Marker:** One `<Marker>` at `position={{ lat, lng }}` for “you are here.”

The wrapper from `@react-google-maps/api` (e.g. `LoadScript` or `useJsApiLoader`) needs your `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and loads the script once. Wrap only the part of the tree that actually renders the map so you don’t load the script on every page.

---

## 7. Mobile-friendly behavior

- **Viewport:** Next.js default layout usually includes a proper viewport meta tag; if not, ensure `<meta name="viewport" content="width=device-width, initial-scale=1">` so the map isn’t zoomed wrong on phones.
- **Map container:** Use responsive width (`w-full` or `width: 100%`) and a minimum height (e.g. `min-h-[300px]` or `50vh`) so the map doesn’t collapse on small screens.
- **Touch:** The Maps JavaScript API supports touch (pan, zoom) by default; no extra code needed.
- **Above-the-fold:** Prefer placing the map below the “Get my location” button and the coordinates so the button is easy to tap first; then the map appears after permission is granted and position is received.

---

## 8. Suggested implementation steps

1. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local` and `.env.example`.
2. Create a small **client-only** map component (e.g. `app/location-test/MapDisplay.tsx`) that:
   - Takes `lat` and `lng` as props.
   - Uses `@react-google-maps/api` (`useJsApiLoader` + `GoogleMap` + `Marker`) to render one map and one marker.
   - Uses a container with `width: 100%` and a reasonable `min-height`.
3. Load this component with `next/dynamic(..., { ssr: false })` from `LocationDisplay.tsx`.
4. In `LocationDisplay.tsx`, when `location.status === "success"`, render the dynamic map component and pass `location.coords.latitude` and `location.coords.longitude`.
5. Optionally show a short “Loading map…” state while the Google script loads.

After this, the location test page will show the user’s position on a map in-app, work on mobile, and stay within normal free usage for a hackathon.
