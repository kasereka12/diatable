const MOBILE_REGEX = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i

export function isMobileDevice(): boolean {
  return MOBILE_REGEX.test(navigator.userAgent)
}

/**
 * Opens a YouCan Pay Standalone payment URL.
 *
 * Desktop: a small popup window (window.open with fixed dimensions).
 * Mobile: mobile browsers ignore window.open's width/height and just open
 * a new tab instead — leaving two tabs the customer has to switch between
 * manually. A full-page redirect in the same tab is the more familiar
 * mobile payment pattern, and the success/error return URL already brings
 * the customer right back into the app afterwards.
 *
 * Returns the popup Window reference on desktop (for close()/`.closed`
 * polling), or null on mobile (there's no window to track — the page is
 * navigating away).
 */
export function openPaymentWindow(url: string, popupName: string): Window | null {
  if (isMobileDevice()) {
    window.location.href = url
    return null
  }

  const width = 480
  const height = 720
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  return window.open(
    url, popupName,
    `width=${width},height=${height},left=${left},top=${top}`,
  )
}
