import { Horoscope } from '../Horoscope'
import { Origin } from '../Origin'
import chironSigns from '../data/chiron-signs.json'
import chironDegrees from '../data/chiron-degrees.json'
import { shadowMap } from '../data/shadowMap'

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

  let closestEntry = chironDegrees[0]
  let minDiff = Math.abs(new Date(closestEntry.date) - date)

  for (const entry of chironDegrees) {
    const entryDate = new Date(entry.date)
    const diff = Math.abs(entryDate - date)

    if (diff < minDiff) {
      minDiff = diff
      closestEntry = entry
    }
  }

  return closestEntry.degree
}

export async function calculateChironData(formData) {
  const { name, email, birthDate, birthTime, birthLocation, birthCoordinates } = formData

  const chironDegree = getChironDegree(birthDate)
  const chironSign = getChironSign(chironDegree)

  let chironHouse = 'Unknown'
  let shadowId = `chiron_${chironSign.toLowerCase()}`

  if (birthTime && birthCoordinates) {
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

      console.log('Horoscope object:', horoscope)
      console.log('CelestialPoints:', horoscope.CelestialPoints)
      const chironPoint = horoscope.CelestialPoints.chiron
      console.log('Chiron point:', chironPoint)
      console.log('Chiron House:', chironPoint?.House)

      if (chironPoint && chironPoint.House) {
        const houseNum = chironPoint.House.id || chironPoint.House
        console.log('House number:', houseNum)
        chironHouse = `${houseNum}${getOrdinalSuffix(houseNum)} House`
        shadowId = `chiron_${chironSign.toLowerCase()}_${houseNum}`
      } else if (chironPoint) {
        const houses = horoscope.Houses
        console.log('All houses:', houses)

        const chironLongitude = chironPoint.ChartPosition?.Ecliptic?.DecimalDegrees ||
                                chironPoint.longitude ||
                                chironDegree
        console.log('Chiron longitude:', chironLongitude)

        if (houses && houses.length > 0) {
          for (let i = 0; i < 12; i++) {
            const currentHouse = houses[i]
            const nextHouse = houses[(i + 1) % 12]

            const currentDegree = currentHouse.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees
            const nextDegree = nextHouse.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees

            console.log(`House ${i + 1}: ${currentDegree} - ${nextDegree}`)

            if (currentDegree !== undefined && nextDegree !== undefined) {
              if (nextDegree > currentDegree) {
                if (chironLongitude >= currentDegree && chironLongitude < nextDegree) {
                  const houseNum = i + 1
                  chironHouse = `${houseNum}${getOrdinalSuffix(houseNum)} House`
                  shadowId = `chiron_${chironSign.toLowerCase()}_${houseNum}`
                  console.log('Found house (normal):', houseNum)
                  break
                }
              } else {
                if (chironLongitude >= currentDegree || chironLongitude < nextDegree) {
                  const houseNum = i + 1
                  chironHouse = `${houseNum}${getOrdinalSuffix(houseNum)} House`
                  shadowId = `chiron_${chironSign.toLowerCase()}_${houseNum}`
                  console.log('Found house (wrap):', houseNum)
                  break
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calculating house:', error)
    }
  }

  const shadowText = shadowMap[shadowId]?.description ||
    shadowMap[`chiron_${chironSign.toLowerCase()}`]?.description ||
    'Shadow description not found.'

  return {
    name,
    email,
    chironSign,
    chironDegree,
    chironHouse,
    shadowId,
    shadowText
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
