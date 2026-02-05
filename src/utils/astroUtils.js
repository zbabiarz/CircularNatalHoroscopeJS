import moment from 'moment-timezone'
import tzlookup from 'tz-lookup'
import { shadowMap } from '../data/shadowMap'
import {
  initSwissEph,
  isEpheFilesLoaded,
  waitForEphemerisFiles,
  calculateJulianDay,
  calculateChironPosition,
  calculateHouses,
  getZodiacSign,
  findHouseForPlanet
} from './swissEph'

function convertLocalToUTC(year, month, day, hours, minutes, latitude, longitude) {
  const timezone = tzlookup(latitude, longitude)
  const tzInfo = moment.tz.zone(timezone)

  const localMoment = moment.tz({
    year,
    month: month - 1,
    date: day,
    hour: hours,
    minute: minutes,
    second: 0
  }, timezone)

  const utcMoment = localMoment.clone().utc()

  const offsetMinutes = tzInfo.utcOffset(localMoment.valueOf())
  const offsetHours = -offsetMinutes / 60
  const isDST = localMoment.isDST()

  console.log('=== TIMEZONE CONVERSION ===')
  console.log(`Local Input: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  console.log(`Timezone: ${timezone}`)
  console.log(`UTC Offset: ${offsetHours >= 0 ? '+' : ''}${offsetHours} hours`)
  console.log(`DST Active: ${isDST ? 'Yes' : 'No'}`)
  console.log(`UTC Output: ${utcMoment.format('YYYY-MM-DD HH:mm')}`)
  console.log('===========================')

  return {
    year: utcMoment.year(),
    month: utcMoment.month() + 1,
    day: utcMoment.date(),
    hours: utcMoment.hours(),
    minutes: utcMoment.minutes(),
    timezone,
    offsetHours,
    isDST
  }
}

let swissEphChecked = false
let swissEphWorks = false

async function tryInitSwissEph() {
  if (swissEphChecked) return swissEphWorks
  swissEphChecked = true

  try {
    await initSwissEph()
    swissEphWorks = true
    return true
  } catch {
    swissEphWorks = false
    return false
  }
}

export async function calculateChironData(formData) {
  const { name, email, birthDate, birthTime, birthLocation, birthCoordinates } = formData

  try {
    await tryInitSwissEph()
    await waitForEphemerisFiles()

    let localHours = 12, localMinutes = 0

    if (birthTime) {
      if (birthTime.includes(' ')) {
        const [time, period] = birthTime.split(' ')
        ;[localHours, localMinutes] = time.split(':').map(Number)

        if (period === 'PM' && localHours !== 12) {
          localHours += 12
        } else if (period === 'AM' && localHours === 12) {
          localHours = 0
        }
      } else {
        ;[localHours, localMinutes] = birthTime.split(':').map(Number)
      }
    }

    const [localYear, localMonth, localDay] = birthDate.split('-').map(Number)

    let utcYear = localYear, utcMonth = localMonth, utcDay = localDay
    let utcHours = localHours, utcMinutes = localMinutes

    if (birthCoordinates && birthCoordinates[0] && birthCoordinates[1]) {
      const utcData = convertLocalToUTC(
        localYear, localMonth, localDay,
        localHours, localMinutes,
        birthCoordinates[0], birthCoordinates[1]
      )
      utcYear = utcData.year
      utcMonth = utcData.month
      utcDay = utcData.day
      utcHours = utcData.hours
      utcMinutes = utcData.minutes
    } else {
      console.log('=== TIMEZONE CONVERSION ===')
      console.log('No coordinates available - using local time as UTC (may be inaccurate)')
      console.log('===========================')
    }

    const julianDay = calculateJulianDay(
      { year: utcYear, month: utcMonth, day: utcDay },
      { hours: utcHours, minutes: utcMinutes }
    )

    const ephSource = isEpheFilesLoaded() ? 'Swiss Ephemeris (Full)' : 'Swiss Ephemeris (Moshier)'
    const chironPosition = calculateChironPosition(julianDay)

    const chironDegree = chironPosition.longitude
    const zodiacInfo = getZodiacSign(chironDegree)
    const chironSign = zodiacInfo.sign

    console.log(`=== CHIRON CALCULATION (${ephSource}) ===`)
    console.log(`Birth: ${birthDate} ${birthTime || '(no time)'} at ${birthLocation}`)
    console.log(`Julian Day: ${julianDay.toFixed(6)}`)
    console.log(`Chiron: ${chironSign} ${zodiacInfo.degree.toFixed(2)}° (${chironDegree.toFixed(2)}° absolute)`)
    console.log(`Retrograde: ${chironPosition.speed < 0 ? 'Yes' : 'No'} (speed: ${chironPosition.speed?.toFixed(4)}°/day)`)

    let chironHouse = 'Unknown'

    if (birthTime && birthCoordinates) {
      const houseData = calculateHouses(
        julianDay,
        birthCoordinates[0],
        birthCoordinates[1]
      )

      console.log('=== HOUSE CUSPS (Swiss Ephemeris) ===')
      console.log(`House 1: ${houseData.houses[1]?.toFixed(2)}° | House 2: ${houseData.houses[2]?.toFixed(2)}° | House 3: ${houseData.houses[3]?.toFixed(2)}°`)
      console.log(`House 4: ${houseData.houses[4]?.toFixed(2)}° | House 5: ${houseData.houses[5]?.toFixed(2)}° | House 6: ${houseData.houses[6]?.toFixed(2)}°`)
      console.log(`House 7: ${houseData.houses[7]?.toFixed(2)}° | House 8: ${houseData.houses[8]?.toFixed(2)}° | House 9: ${houseData.houses[9]?.toFixed(2)}°`)
      console.log(`House 10: ${houseData.houses[10]?.toFixed(2)}° | House 11: ${houseData.houses[11]?.toFixed(2)}° | House 12: ${houseData.houses[12]?.toFixed(2)}°`)
      console.log(`Ascendant: ${houseData.ascendant?.toFixed(2)}° | MC: ${houseData.mc?.toFixed(2)}°`)
      console.log(`Checking Chiron at ${chironDegree.toFixed(2)}°...`)

      const houseNum = findHouseForPlanet(houseData.houses, chironDegree)

      if (houseNum) {
        const cuspStart = houseData.houses[houseNum]
        const cuspEnd = houseData.houses[houseNum === 12 ? 1 : houseNum + 1]
        console.log(`Chiron (${chironDegree.toFixed(2)}°) falls in House ${houseNum} (between ${cuspStart?.toFixed(2)}° and ${cuspEnd?.toFixed(2)}°)`)
        chironHouse = `${houseNum}${getOrdinalSuffix(houseNum)} House`
      }
      console.log('=====================================')
    }

    console.log('==========================================')

    return buildResult(name, email, chironSign, chironDegree, chironHouse)
  } catch (err) {
    console.error('CRITICAL ERROR: Chiron calculation failed:', err.message)
    throw new Error(`Unable to calculate Chiron position. The Swiss Ephemeris calculation system is currently unavailable. Please try again later. Error: ${err.message}`)
  }
}

function getOrdinalSuffix(num) {
  const j = num % 10
  const k = num % 100

  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

function buildResult(name, email, chironSign, chironDegree, chironHouse) {
  const shadowId = chironHouse !== 'Unknown'
    ? `chiron_${chironSign.toLowerCase()}_${chironHouse.match(/\d+/)[0]}`
    : `chiron_${chironSign.toLowerCase()}`

  const shadowText = shadowMap[shadowId]?.description ||
    shadowMap[`chiron_${chironSign.toLowerCase()}`]?.description ||
    'Shadow description not found.'

  return {
    name,
    email,
    chironSign,
    chironDegree: Math.round(chironDegree * 100) / 100,
    chironHouse,
    shadowId,
    shadowText
  }
}
