/*
  Google Maps Loader
  ------------------
  Provides a singleton `loadGoogleMapsApi` function that injects the Google Maps JavaScript
  SDK tag into <head> and resolves once the `google.maps` object is ready.  Subsequent calls
  return the same promise so the script is only loaded a single time.
*/

let loadingPromise = null;

/**
 * Dynamically load the Google Maps JavaScript SDK.
 *
 * The API key must be provided in the Vite env variable `VITE_GOOGLE_MAPS_API_KEY`.
 * Additional libraries (`places`, `geometry`, `visualization`) are requested because
 * the application commonly uses them (autocomplete, distance matrix, heatmap, …).
 *
 * @returns {Promise<typeof google>} A promise that resolves with the global `google` object.
 */
export function loadGoogleMapsApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser'));
  }

  // Return existing promise if the loader has already been triggered.
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    // If already available just resolve immediately.
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not defined'));
      return;
    }

    // Unique callback name to avoid clashing with any other loader on the page.
    const callbackName = `__gmapsInit_${Date.now()}_${Math.round(Math.random() * 1e5)}`;

    // Define the global callback expected by the SDK.
    window[callbackName] = () => {
      resolve(window.google);
      delete window[callbackName];
    };

    // Build the script URL.
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,visualization&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = (err) => {
      reject(new Error('Failed to load Google Maps script'));
      delete window[callbackName];
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}