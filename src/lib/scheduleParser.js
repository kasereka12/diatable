// Parses French restaurant hour strings to determine if currently open.
// Supported formats:
//   "Lun–Sam : 11h30 – 22h00"
//   "Tous les jours : 10h00 – 23h00"
//   "Lun–Ven : 12h – 22h / Sam–Dim : 10h – 23h"
//   "Lundi au Vendredi : 11h30–22h"
//   "11h – 22h" (no day → all days)

const DAY_MAP = {
  lun: 1, lundi: 1,
  mar: 2, mardi: 2,
  mer: 3, mercredi: 3,
  jeu: 4, jeudi: 4,
  ven: 5, vendredi: 5,
  sam: 6, samedi: 6,
  dim: 0, dimanche: 0,
}

function parseMinutes(str) {
  const m = str.trim().match(/^(\d{1,2})h(\d{0,2})$/i)
  if (!m) return null
  return parseInt(m[1]) * 60 + (m[2] ? parseInt(m[2]) : 0)
}

function parseDays(str) {
  str = str.trim().toLowerCase()
  if (/tous\s*(les)?\s*jours/.test(str)) return [0, 1, 2, 3, 4, 5, 6]
  // Range: "lun–sam", "lun-sam", "lundi au samedi"
  const rangeMatch = str.match(/^([a-z]+)\s*(?:[–\-]|au)\s*([a-z]+)$/)
  if (rangeMatch) {
    const s = DAY_MAP[rangeMatch[1]]
    const e = DAY_MAP[rangeMatch[2]]
    if (s === undefined || e === undefined) return null
    const days = []
    let d = s
    for (let i = 0; i <= 6; i++) {
      days.push(d)
      if (d === e) break
      d = (d + 1) % 7
    }
    return days
  }
  const single = DAY_MAP[str]
  if (single !== undefined) return [single]
  return null
}

/**
 * Returns true (open), false (closed by schedule), or null (cannot parse — no assumption).
 */
export function parseSchedule(hoursStr) {
  if (!hoursStr || !hoursStr.trim()) return null

  const now = new Date()
  const todayJS = now.getDay()
  const nowMins = now.getHours() * 60 + now.getMinutes()

  const segments = hoursStr.split(/[\/\n;]+/)
  let parsedAny = false

  for (const seg of segments) {
    const timeMatch = seg.match(/(\d{1,2}h\d{0,2})\s*[–\-]\s*(\d{1,2}h\d{0,2})/i)
    if (!timeMatch) continue

    const openMins = parseMinutes(timeMatch[1])
    const closeMins = parseMinutes(timeMatch[2])
    if (openMins === null || closeMins === null) continue

    parsedAny = true

    const dayPart = seg.slice(0, timeMatch.index).replace(/:/g, '').trim()
    let days = dayPart ? parseDays(dayPart) : null
    if (!days) days = [0, 1, 2, 3, 4, 5, 6]

    if (!days.includes(todayJS)) continue

    if (closeMins <= openMins) {
      // Overnight slot (e.g. 22h–2h)
      if (nowMins >= openMins || nowMins < closeMins) return true
    } else {
      if (nowMins >= openMins && nowMins < closeMins) return true
    }
  }

  return parsedAny ? false : null
}

/**
 * Returns true if the restaurant is effectively open to customers.
 *
 * Priority:
 *   1. is_open === false → always closed (manual override)
 *   2. schedule says false → closed (outside hours)
 *   3. otherwise → open
 */
export function getEffectivelyOpen(restaurant) {
  if (!restaurant) return null
  if (restaurant.is_open === false) return false
  const schedule = parseSchedule(restaurant.hours)
  if (schedule === false) return false
  return true
}

/**
 * Returns why the restaurant is closed, or null if it's open.
 * Useful for showing a human-readable reason.
 */
export function getClosedReason(restaurant) {
  if (!restaurant) return null
  if (restaurant.is_open === false) return 'manuel'
  const schedule = parseSchedule(restaurant.hours)
  if (schedule === false) return 'horaires'
  return null
}
