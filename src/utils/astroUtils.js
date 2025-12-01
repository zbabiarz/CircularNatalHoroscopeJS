import moment from 'moment-timezone'
import Origin from '../Origin'
import Horoscope from '../Horoscope'
import { shadowMap } from '../data/shadowMap'

export async function calculateChironData(formData) {
  const { name, email, birthDate, birthTime, birthLocation, birthCoordinates } = formData

  if (!birthDate) {
    throw new Error('Birth date is required')
  }

  if (!birthTime || !birthCoordinates) {
    throw new Error('Birth time and location are required for accurate Chiron calculations')
  }

  const [latitude, longitude] = birthCoordinates

  const [year, month, day] = birthDate.split('-').map(Number)
  const [hours, minutes] = birthTime.split(':').map(Number)

  const origin = new Origin({
    year,
    month: month - 1,
    date: day,
    hour: hours,
    minute: minutes,
    latitude,
    longitude
  })

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: ['bodies'],
    aspectWithPoints: ['bodies'],
    aspectTypes: ['major']
  })

  const chiron = horoscope.CelestialBodies.chiron

  if (!chiron) {
    throw new Error('Unable to calculate Chiron placement')
  }

  const chironSign = chiron.Sign.label
  const chironDegree = parseFloat(chiron.ChartPosition.Ecliptic.DecimalDegrees.toFixed(2))
  const chironDegreeInSign = parseFloat(chiron.ChartPosition.Ecliptic.Degrees.toFixed(2))
  const chironHouse = chiron.House ? chiron.House.id : null

  const shadowId = chironHouse
    ? `chiron_${chironSign.toLowerCase()}_${chironHouse}`
    : `chiron_${chironSign.toLowerCase()}`

  const shadowText = shadowMap[shadowId]?.description ||
    shadowMap[`chiron_${chironSign.toLowerCase()}`]?.description ||
    'Shadow description not found.'

  return {
    name,
    email,
    chironSign,
    chironDegree: chironDegreeInSign,
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
