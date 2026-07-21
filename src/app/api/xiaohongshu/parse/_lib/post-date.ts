const getTimezoneByText = (text: string) => {
  if (/(新西兰|奥克兰)/.test(text)) return 'Pacific/Auckland'
  return 'Asia/Shanghai'
}

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

const getZonedParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value || '0')
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
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

  const timeZone = getTimezoneByText(text)
  const nowParts = getZonedParts(now, timeZone)

  const yesterdayMatch = text.match(/昨天\s*(\d{1,2})[:：](\d{2})/)
  if (yesterdayMatch) {
    const dayAnchor = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 0, 0, 0, 0))
    dayAnchor.setUTCDate(dayAnchor.getUTCDate() - 1)
    const hour = Number(yesterdayMatch[1] || '0')
    const minute = Number(yesterdayMatch[2] || '0')
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
      const dayAnchor = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day, 0, 0, 0, 0))
      dayAnchor.setUTCDate(dayAnchor.getUTCDate() - days)
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

  const monthDayMatch = text.match(/(\d{1,2})[-/.月](\d{1,2})/)
  if (monthDayMatch) {
    const month = Number(monthDayMatch[1] || '0')
    const day = Number(monthDayMatch[2] || '0')
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let year = nowParts.year
      let date = zonedDateTimeToUtc(year, month, day, 0, 0, timeZone)
      // 处理跨年：如当前年该日期在未来太多，回退一年
      if (date.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
        year -= 1
        date = zonedDateTimeToUtc(year, month, day, 0, 0, timeZone)
      }
      return date.toISOString()
    }
  }

  return null
}
