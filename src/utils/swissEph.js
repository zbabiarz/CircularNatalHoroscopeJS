import SwissEph from 'sweph-wasm'

let swissEph = null

export async function initSwissEph() {
  if (swissEph) return swissEph

  try {
    swissEph = new SwissEph()
    return swissEph
  } catch (error) {
    console.error('Swiss Ephemeris initialization failed:', error)
    throw error
  }
}

export function calculateJulianDay(date, time) {
  const { year, month, day } = date
  const { hours, minutes } = time

  const decimalHours = hours + (minutes / 60)

  if (!swissEph) {
    throw new Error('Swiss Ephemeris not initialized')
  }

  const julianDay = swissEph.swe_julday(
    year,
    month,
    day,
    decimalHours,
    swissEph.SE_GREG_CAL
  )

  return julianDay
}

export function calculateHouses(julianDay, latitude, longitude) {
  if (!swissEph) {
    throw new Error('Swiss Ephemeris not initialized')
  }

  const houses = swissEph.swe_houses(
    julianDay,
    latitude,
    longitude,
    'P'
  )

  return {
    houses: houses.house,
    ascendant: houses.ascendant,
    mc: houses.mc,
    armc: houses.armc,
    vertex: houses.vertex,
    equatorialAscendant: houses.equatorialAscendant
  }
}

export function calculateChironPosition(julianDay) {
  if (!swissEph) {
    throw new Error('Swiss Ephemeris not initialized')
  }

  const CHIRON_ID = swissEph.SE_CHIRON

  const result = swissEph.swe_calc_ut(
    julianDay,
    CHIRON_ID,
    swissEph.SEFLG_SWIEPH | swissEph.SEFLG_SPEED
  )

  return {
    longitude: result[0],
    latitude: result[1],
    distance: result[2],
    speed: result[3]
  }
}

export function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ]

  const signIndex = Math.floor(longitude / 30)
  const degreeInSign = longitude % 30

  return {
    sign: signs[signIndex],
    degree: degreeInSign,
    absoluteDegree: longitude
  }
}

export function findHouseForPlanet(houseCusps, planetLongitude) {
  planetLongitude = planetLongitude % 360

  for (let i = 0; i < 12; i++) {
    const currentCusp = houseCusps[i]
    const nextCusp = houseCusps[(i + 1) % 12]

    let isInHouse = false

    if (nextCusp > currentCusp) {
      isInHouse = planetLongitude >= currentCusp && planetLongitude < nextCusp
    } else {
      isInHouse = planetLongitude >= currentCusp || planetLongitude < nextCusp
    }

    if (isInHouse) {
      return i + 1
    }
  }

  return null
}
