import { Horoscope } from '../Horoscope'
import { Origin } from '../Origin'
import chironSigns from '../data/chiron-signs.json'
import chironDegrees from '../data/chiron-degrees.json'
import { shadowMap } from '../data/shadowMap'
import {
  initSwissEph,
  isSwissEphAvailable,
  calculateJulianDay,
  calculateChironPosition,
  calculateHouses,
  getZodiacSign,
  findHouseForPlanet
} from './swissEph'

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

function getEphemerisConstructor() {
  const ephemeris = window.Ephemeris
  if (!ephemeris) return null

  if (typeof ephemeris === 'function') {
    return ephemeris
  }

  if (typeof ephemeris.default === 'function') {
    return ephemeris.default
  }

  for (const key in ephemeris) {
    if (typeof ephemeris[key] === 'function' && key !== '__esModule') {
      return ephemeris[key]
    }
  }

  return null
}

function loadEphemerisScript() {
  return new Promise((resolve) => {
    if (getEphemerisConstructor()) {
      resolve()
      return
    }

    const existingScript = document.querySelector('script[src*="ephemeris"]')
    if (existingScript) {
      existingScript.remove()
    }

    const script = document.createElement('script')
    script.src = '/ephemeris-1.2.1.bundle.js'
    script.async = false

    script.onload = () => {
      setTimeout(resolve, 100)
    }

    script.onerror = () => {
      resolve()
    }

    document.head.appendChild(script)
  })
}

function waitForEphemeris() {
  return new Promise(async (resolve) => {
    if (getEphemerisConstructor()) {
      resolve()
      return
    }

    await loadEphemerisScript()

    const checkInterval = setInterval(() => {
      if (getEphemerisConstructor()) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)

    setTimeout(() => {
      clearInterval(checkInterval)
      resolve()
    }, 5000)
  })
}

function getChironSignFromDate(birthDateStr) {
  const birthDate = new Date(birthDateStr + 'T00:00:00Z')
  const birthTime = birthDate.getTime()

  for (const period of chironSigns) {
    const startDate = new Date(period.start + 'T00:00:00Z')
    const endDate = new Date(period.end + 'T23:59:59Z')

    if (birthTime >= startDate.getTime() && birthTime <= endDate.getTime()) {
      return period.sign
    }
  }

  if (birthTime < new Date(chironSigns[0].start + 'T00:00:00Z').getTime()) {
    return chironSigns[0].sign
  }

  return chironSigns[chironSigns.length - 1].sign
}

function getChironSign(degree) {
  const zodiacSigns = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ]

  const normalizedDegree = ((degree % 360) + 360) % 360
  const signIndex = Math.floor(normalizedDegree / 30)

  return zodiacSigns[signIndex]
}

function getChironDegree(birthDate) {
  const date = new Date(birthDate)
  const sortedDegrees = [...chironDegrees].sort((a, b) => new Date(a.date) - new Date(b.date))

  let beforeEntry = null
  let afterEntry = null

  for (let i = 0; i < sortedDegrees.length; i++) {
    const entryDate = new Date(sortedDegrees[i].date)
    if (entryDate <= date) {
      beforeEntry = sortedDegrees[i]
    }
    if (entryDate > date && !afterEntry) {
      afterEntry = sortedDegrees[i]
      break
    }
  }

  if (!beforeEntry && afterEntry) {
    return afterEntry.degree
  }
  if (beforeEntry && !afterEntry) {
    return beforeEntry.degree
  }
  if (!beforeEntry && !afterEntry) {
    return chironDegrees[0].degree
  }

  const beforeDate = new Date(beforeEntry.date)
  const afterDate = new Date(afterEntry.date)
  const totalDays = (afterDate - beforeDate) / (1000 * 60 * 60 * 24)
  const daysSinceBefore = (date - beforeDate) / (1000 * 60 * 60 * 24)
  const fraction = daysSinceBefore / totalDays

  let degreeDiff = afterEntry.degree - beforeEntry.degree
  if (Math.abs(degreeDiff) > 180) {
    if (degreeDiff > 0) {
      degreeDiff = degreeDiff - 360
    } else {
      degreeDiff = degreeDiff + 360
    }
  }

  let interpolatedDegree = beforeEntry.degree + (degreeDiff * fraction)
  interpolatedDegree = ((interpolatedDegree % 360) + 360) % 360

  return Math.round(interpolatedDegree * 100) / 100
}

export async function calculateChironData(formData) {
  const { name, email, birthDate, birthTime, birthLocation, birthCoordinates } = formData

  let chironDegree, chironSign, chironHouse = 'Unknown'

  const canUseSwissEph = await tryInitSwissEph()

  if (canUseSwissEph) {
    try {
      let hours = 12, minutes = 0

      if (birthTime) {
        if (birthTime.includes(' ')) {
          const [time, period] = birthTime.split(' ')
          ;[hours, minutes] = time.split(':').map(Number)

          if (period === 'PM' && hours !== 12) {
            hours += 12
          } else if (period === 'AM' && hours === 12) {
            hours = 0
          }
        } else {
          ;[hours, minutes] = birthTime.split(':').map(Number)
        }
      }

      const [year, month, day] = birthDate.split('-').map(Number)

      const julianDay = calculateJulianDay(
        { year, month, day },
        { hours, minutes }
      )

      const chironPosition = calculateChironPosition(julianDay)

      chironDegree = chironPosition.longitude
      const zodiacInfo = getZodiacSign(chironDegree)
      chironSign = zodiacInfo.sign

      console.log('=== CHIRON CALCULATION (Swiss Ephemeris) ===')
      console.log(`Birth: ${birthDate} ${birthTime || '(no time)'} at ${birthLocation}`)
      console.log(`Chiron: ${chironSign} ${zodiacInfo.degree.toFixed(2)}° (${chironDegree.toFixed(2)}° absolute)`)

      if (birthTime && birthCoordinates) {
        const houseData = calculateHouses(
          julianDay,
          birthCoordinates[0],
          birthCoordinates[1]
        )

        const houseNum = findHouseForPlanet(houseData.houses, chironDegree)

        if (houseNum) {
          chironHouse = `${houseNum}${getOrdinalSuffix(houseNum)} House`
          console.log(`House: ${chironHouse}`)
        }
      }

      console.log('==========================================')

      return buildResult(name, email, chironSign, chironDegree, chironHouse)
    } catch (err) {
      console.log('Using lookup table fallback (Chiron not in Moshier ephemeris)')
    }
  }

  chironDegree = getChironDegree(birthDate)
  chironSign = getChironSign(chironDegree)

  console.log('=== CHIRON CALCULATION (Lookup Table) ===')
  console.log(`Birth: ${birthDate} at ${birthLocation}`)
  console.log(`Chiron: ${chironSign} at ${chironDegree.toFixed(2)}°`)

  if (birthTime && birthCoordinates) {
    await waitForEphemeris()

    if (getEphemerisConstructor()) {
      try {
        let hours, minutes

        if (birthTime.includes(' ')) {
          const [time, period] = birthTime.split(' ')
          ;[hours, minutes] = time.split(':').map(Number)

          if (period === 'PM' && hours !== 12) {
            hours += 12
          } else if (period === 'AM' && hours === 12) {
            hours = 0
          }
        } else {
          ;[hours, minutes] = birthTime.split(':').map(Number)
        }

        const origin = new Origin({
          year: parseInt(birthDate.split('-')[0]),
          month: parseInt(birthDate.split('-')[1]) - 1,
          date: parseInt(birthDate.split('-')[2]),
          hour: hours,
          minute: minutes,
          latitude: birthCoordinates[0],
          longitude: birthCoordinates[1]
        })

        const horoscope = new Horoscope({
          origin,
          houseSystem: 'placidus',
          zodiac: 'tropical'
        })

        const houses = horoscope.Houses

        if (houses && houses.length > 0) {
          for (let i = 0; i < 12; i++) {
            const house = houses[i]
            const startDegree = house.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees
            const endDegree = house.ChartPosition?.EndPosition?.Ecliptic?.DecimalDegrees

            if (startDegree !== undefined && endDegree !== undefined) {
              let isInHouse = false

              if (endDegree > startDegree) {
                isInHouse = chironDegree >= startDegree && chironDegree < endDegree
              } else {
                isInHouse = chironDegree >= startDegree || chironDegree < endDegree
              }

              if (isInHouse) {
                const houseNum = i + 1
                chironHouse = `${houseNum}${getOrdinalSuffix(houseNum)} House`
                console.log(`House: ${chironHouse}`)
                break
              }
            }
          }
        }
      } catch (err) {
        console.log('House calculation fallback error')
      }
    }
  }

  console.log('===========================================')

  return buildResult(name, email, chironSign, chironDegree, chironHouse)
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
