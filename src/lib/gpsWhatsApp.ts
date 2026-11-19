// Cross-platform One-Time GPS Detection & WhatsApp Universal Dispatcher
// Compatible with iOS (Safari, Chrome iOS, WKWebView) and Android (Chrome, Samsung Internet, WebView)

export interface OneTimeGpsResult {
  success: boolean;
  locationText: string;
  reason?: 'unsupported' | 'insecure_context' | 'permission_denied' | 'unavailable' | 'timeout';
}

const MAX_TOTAL_TIMEOUT_MS = 10000;
const HIGH_ACCURACY_TIMEOUT_MS = 5500;
const LOW_ACCURACY_TIMEOUT_MS = 4000;

/**
 * Performs a One-Time GPS Detection compatible across all iOS and Android versions.
 * CRITICAL: Must be called synchronously inside a user click event (no `await` before calling)
 * so iOS Safari and Android browsers preserve the user-gesture permission context.
 */
export function detectOneTimeGps(
  onComplete: (result: OneTimeGpsResult) => void
): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    onComplete({ success: false, locationText: '', reason: 'unsupported' });
    return;
  }

  // Geolocation API requires HTTPS (except localhost / 127.0.0.1)
  if (window.isSecureContext === false) {
    onComplete({ success: false, locationText: '', reason: 'insecure_context' });
    return;
  }

  if (!('geolocation' in navigator) || typeof navigator.geolocation.getCurrentPosition !== 'function') {
    onComplete({ success: false, locationText: '', reason: 'unsupported' });
    return;
  }

  let settled = false;
  let masterTimer: ReturnType<typeof setTimeout> | null = null;

  const finish = (result: OneTimeGpsResult) => {
    if (settled) return;
    settled = true;
    if (masterTimer) {
      clearTimeout(masterTimer);
      masterTimer = null;
    }
    onComplete(result);
  };

  // Master 10-second timeout protection so user is never stuck on iOS or Android
  masterTimer = setTimeout(() => {
    finish({ success: false, locationText: '', reason: 'timeout' });
  }, MAX_TOTAL_TIMEOUT_MS);

  const handleSuccess = (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude.toFixed(5);
    const lng = pos.coords.longitude.toFixed(5);
    const locText = `https://www.google.com/maps?q=${lat},${lng} (Lat: ${lat}, Lng: ${lng})`;
    finish({ success: true, locationText: locText });
  };

  // Stage 2: Fast Wi-Fi / Cell-tower fallback (essential for indoor iOS & older Android devices)
  const tryLowAccuracyFallback = () => {
    if (settled) return;
    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (err) => {
          const reason =
            err.code === 1
              ? 'permission_denied'
              : err.code === 3
              ? 'timeout'
              : 'unavailable';
          finish({ success: false, locationText: '', reason });
        },
        {
          enableHighAccuracy: false,
          timeout: LOW_ACCURACY_TIMEOUT_MS,
          maximumAge: 300000, // Allow up to 5-minute cached network fix
        }
      );
    } catch {
      finish({ success: false, locationText: '', reason: 'unavailable' });
    }
  };

  // Stage 1: High-accuracy GPS request (synchronously triggered inside user click)
  try {
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => {
        if (settled) return;
        // Code 1 = PERMISSION_DENIED -> do not retry
        if (err.code === 1) {
          finish({ success: false, locationText: '', reason: 'permission_denied' });
          return;
        }
        // Code 2 (POSITION_UNAVAILABLE) or Code 3 (TIMEOUT) -> fallback to Wi-Fi/Cell positioning
        tryLowAccuracyFallback();
      },
      {
        enableHighAccuracy: true,
        timeout: HIGH_ACCURACY_TIMEOUT_MS,
        maximumAge: 60000,
      }
    );
  } catch {
    finish({ success: false, locationText: '', reason: 'unavailable' });
  }
}

/**
 * Opens a WhatsApp URL reliably across iOS Safari, Android Chrome, and embedded preview iframes.
 * Returns true if navigation/popup succeeded immediately, false if browser popup blocker intercepted it.
 */
export function dispatchWhatsAppUrl(targetUrl: string): boolean {
  if (typeof window === 'undefined') return false;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  // Try opening in a new tab/app window
  try {
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (win && !win.closed) {
      return true;
    }
  } catch {
    // Ignore popup error and try fallback below
  }

  // On real mobile browsers (not inside an iframe), top-level navigation to wa.me
  // triggers the native WhatsApp Universal Link / Intent on both iOS and Android
  // even when called inside an async geolocation callback!
  if (!isInIframe) {
    try {
      window.location.href = targetUrl;
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
