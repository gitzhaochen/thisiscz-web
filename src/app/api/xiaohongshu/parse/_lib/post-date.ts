const NZ_TIMEZONE = 'Pacific/Auckland'

const getTimezoneOffsetMs = (date: Date, timeZone: string) => {
  const timeZoneName =
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value || 'GMT+0'
  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/)
  if (!match) return 0

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2] || '0')
  const minutes = Number(match[3] || '0')
  return sign * (hours * 60 + minutes) * 60 * 1000
}

const getZonedDateParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value || '0')
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
  }
}

const zonedDateTimeToUtc = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) => {
  const guessUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))
  const offsetMs = getTimezoneOffsetMs(guessUtc, timeZone)
  return new Date(guessUtc.getTime() - offsetMs)
}

const getDayAnchorUtc = (now: Date, timeZone: string, minusDays: number) => {
  const parts = getZonedDateParts(now, timeZone)
  const dayAnchor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0))
  dayAnchor.setUTCDate(dayAnchor.getUTCDate() - minusDays)
  return dayAnchor
}

const normalizeHour24 = (rawHour: number, meridiem?: string) => {
  let hour = rawHour
  if (/下午|晚上|pm/i.test(meridiem || '')) {
    if (hour < 12) hour += 12
  } else if (/凌晨|上午|am/i.test(meridiem || '')) {
    if (hour === 12) hour = 0
  } else if (/中午/.test(meridiem || '')) {
    if (hour < 11) hour += 12
  }
  return Math.max(0, Math.min(23, hour))
}

export const parseOriginalPostPublishedAt = (rawText: string, now = new Date()) => {
  const text = (rawText || '').replace(/\s+/g, ' ').trim()
  if (!text) return null

  const hoursAgoMatch = text.match(/(\d+)\s*小时[前內内]?/)
  if (hoursAgoMatch) {
    const hours = Number(hoursAgoMatch[1] || '0')
    if (Number.isFinite(hours) && hours >= 0) {
      return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()
    }
  }

  const minutesAgoMatch = text.match(/(\d+)\s*分钟[前內内]?/)
  if (minutesAgoMatch) {
    const minutes = Number(minutesAgoMatch[1] || '0')
    if (Number.isFinite(minutes) && minutes >= 0) {
      return new Date(now.getTime() - minutes * 60 * 1000).toISOString()
    }
  }

  const timeZone = NZ_TIMEZONE
  const nowDateParts = getZonedDateParts(now, timeZone)

  const yesterdayMatch = text.match(/昨天\s*(凌晨|上午|中午|下午|晚上|am|pm)?\s*(\d{1,2})[:：](\d{2})/i)
  if (yesterdayMatch) {
    const dayAnchor = getDayAnchorUtc(now, timeZone, 1)
    const hour = normalizeHour24(Number(yesterdayMatch[2] || '0'), yesterdayMatch[1])
    const minute = Number(yesterdayMatch[3] || '0')
    const date = zonedDateTimeToUtc(
      dayAnchor.getUTCFullYear(),
      dayAnchor.getUTCMonth() + 1,
      dayAnchor.getUTCDate(),
      hour,
      minute,
      timeZone,
    )
    return date.toISOString()
  }

  const daysAgoMatch = text.match(/(\d+)\s*天前/)
  if (daysAgoMatch) {
    const days = Number(daysAgoMatch[1] || '0')
    if (Number.isFinite(days) && days >= 0) {
      const dayAnchor = getDayAnchorUtc(now, timeZone, days)
      const date = zonedDateTimeToUtc(
        dayAnchor.getUTCFullYear(),
        dayAnchor.getUTCMonth() + 1,
        dayAnchor.getUTCDate(),
        0,
        0,
        timeZone,
      )
      return date.toISOString()
    }
  }

  const monthDayMatch = text.match(
    /(\d{1,2})[-/.月](\d{1,2})(?:日)?(?:\s*(凌晨|上午|中午|下午|晚上|am|pm)?\s*(\d{1,2})[:：](\d{2}))?/i,
  )
  if (monthDayMatch) {
    const month = Number(monthDayMatch[1] || '0')
    const day = Number(monthDayMatch[2] || '0')
    const hour = monthDayMatch[4] ? normalizeHour24(Number(monthDayMatch[4]), monthDayMatch[3]) : 0
    const minute = monthDayMatch[5] ? Number(monthDayMatch[5]) : 0
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let year = nowDateParts.year
      let date = zonedDateTimeToUtc(year, month, day, hour, minute, timeZone)
      // 处理跨年：如当前年该日期在未来太多，回退一年
      if (date.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
        year -= 1
        date = zonedDateTimeToUtc(year, month, day, hour, minute, timeZone)
      }
      return date.toISOString()
    }
  }

  return null
}
