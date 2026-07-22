// Parses French restaurant hour strings to determine if currently open.
// Supported formats:
//   "Lun–Sam : 11h30 – 22h00"
//   "Tous les jours : 10h00 – 23h00"
//   "Lun–Ven : 12h – 22h / Sam–Dim : 10h – 23h"
//   "Lundi au Vendredi : 11h30–22h"
//   "Lundi – Vendredi · 11h00–22h00" (vendor onboarding format)
//   "Weekends uniquement · 11h00–22h00"
//   "11h – 22h" (no day → all days)

const DAY_MAP: Record<string, number> = {
  lun: 1, lundi: 1,
  mar: 2, mardi: 2,
  mer: 3, mercredi: 3,
  jeu: 4, jeudi: 4,
  ven: 5, vendredi: 5,
  sam: 6, samedi: 6,
  dim: 0, dimanche: 0,
}

function parseMinutes(str: string): number | null {
  const m = str.trim().match(/^(\d{1,2})h(\d{0,2})$/i)
  if (!m) return null
  return parseInt(m[1]) * 60 + (m[2] ? parseInt(m[2]) : 0)
}

function parseDays(str: string): number[] | null {
  const s = str.trim().toLowerCase()
  if (/tous\s*(les)?\s*jours/.test(s)) return [0, 1, 2, 3, 4, 5, 6]
  if (/week[ -]?ends?\s*(uniquement)?/.test(s)) return [6, 0]
  const rangeMatch = s.match(/^([a-z]+)\s*(?:[–\-]|au)\s*([a-z]+)$/)
  if (rangeMatch) {
    const start = DAY_MAP[rangeMatch[1]]
    const end   = DAY_MAP[rangeMatch[2]]
    if (start === undefined || end === undefined) return null
    const days: number[] = []
    let d = start
    for (let i = 0; i <= 6; i++) {
      days.push(d)
      if (d === end) break
      d = (d + 1) % 7
    }
    return days
  }
  const single = DAY_MAP[s]
  if (single !== undefined) return [single]
  return null
}

/**
 * Returns true (open), false (closed by schedule), or null (cannot parse — no assumption).
 */
export function parseSchedule(hoursStr: string | null | undefined): boolean | null {
  if (!hoursStr || !hoursStr.trim()) return null

  const now      = new Date()
  const todayJS  = now.getDay()
  const nowMins  = now.getHours() * 60 + now.getMinutes()
  const segments = hoursStr.split(/[\/\n;]+/)
  let parsedAny  = false

  for (const seg of segments) {
    const timeMatch = seg.match(/(\d{1,2}h\d{0,2})\s*[–\-]\s*(\d{1,2}h\d{0,2})/i)
    if (!timeMatch) continue

    const openMins  = parseMinutes(timeMatch[1])
    const closeMins = parseMinutes(timeMatch[2])
    if (openMins === null || closeMins === null) continue

    parsedAny = true

    const dayPart = seg.slice(0, timeMatch.index).replace(/[:·]/g, '').trim()
    let days = dayPart ? parseDays(dayPart) : null
    if (!days) days = [0, 1, 2, 3, 4, 5, 6]

    if (!days.includes(todayJS)) continue

    if (closeMins <= openMins) {
      if (nowMins >= openMins || nowMins < closeMins) return true
    } else {
      if (nowMins >= openMins && nowMins < closeMins) return true
    }
  }

  return parsedAny ? false : null
}

interface HasSchedule {
  is_open?: boolean | null
  hours?: string | null
}

export function getEffectivelyOpen(restaurant: HasSchedule | null | undefined): boolean | null {
  if (!restaurant) return null
  if (restaurant.is_open === false) return false
  const schedule = parseSchedule(restaurant.hours)
  if (schedule === false) return false
  return true
}

export function getClosedReason(restaurant: HasSchedule | null | undefined): 'manuel' | 'horaires' | null {
  if (!restaurant) return null
  if (restaurant.is_open === false) return 'manuel'
  const schedule = parseSchedule(restaurant.hours)
  if (schedule === false) return 'horaires'
  return null
}
