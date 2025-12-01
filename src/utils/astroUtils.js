import { Horoscope } from '../Horoscope'
import { Origin } from '../Origin'
import chironSigns from '../data/chiron-signs.json'
import chironDegrees from '../data/chiron-degrees.json'
import { shadowMap } from '../data/shadowMap'

function getChironSign(birthDate) {
  const date = new Date(birthDate)

  for (const entry of chironSigns) {
    const start = new Date(entry.start)
    const end = new Date(entry.end)

    if (date >= start && date <= end) {
      return entry.sign
    }
  }

  return 'Unknown'
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

function calculateChironHouse(chironDegree, horoscope) {
  const houses = horoscope.Houses

  for (let i = 0; i < houses.length; i++) {
    const house = houses[i]
    const nextHouse = houses[(i + 1) % houses.length]

    const currentCusp = house.ChartPosition.Ecliptic.DecimalDegrees
    const nextCusp = nextHouse.ChartPosition.Ecliptic.DecimalDegrees

    if (nextCusp > currentCusp) {
      if (chironDegree >= currentCusp && chironDegree < nextCusp) {
        return house.id
      }
    } else {
      if (chironDegree >= currentCusp || chironDegree < nextCusp) {
        return house.id
      }
    }
  }

  return 1
}

export async function calculateChironData(formData) {
  const { name, email, birthDate, birthTime, birthLocation, birthCoordinates } = formData

  const chironSign = getChironSign(birthDate)
  const chironDegree = getChironDegree(birthDate)

  let chironHouse = null
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

      chironHouse = calculateChironHouse(chironDegree, horoscope)
      shadowId = `chiron_${chironSign.toLowerCase()}_${chironHouse}`
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
    chironHouse: chironHouse ? `${chironHouse}${getOrdinalSuffix(chironHouse)} House` : null,
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
