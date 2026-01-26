import SwissEph from 'sweph-wasm'

let swissEph = null
let initPromise = null

export async function initSwissEph() {
  if (swissEph) return swissEph

  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      console.log('Initializing Swiss Ephemeris...')
      swissEph = await SwissEph()
      console.log('Swiss Ephemeris initialized successfully')
      return swissEph
    } catch (error) {
      console.error('Swiss Ephemeris initialization failed:', error)
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

export function calculateJulianDay(date, time) {
  const { year, month, day } = date
  const { hours, minutes } = time

  const decimalHours = hours + (minutes / 60)

  if (!swissEph) {
    throw new Error('Swiss Ephemeris not initialized')
  }

  const SE_GREG_CAL = 1

  const julianDay = swissEph.swe_julday(
    year,
    month,
    day,
    decimalHours,
    SE_GREG_CAL
  )

  return julianDay
}

export function calculateHouses(julianDay, latitude, longitude) {
  if (!swissEph) {
    throw new Error('Swiss Ephemeris not initialized')
  }

  const result = swissEph.swe_houses(
    julianDay,
    latitude,
    longitude,
    'P'
  )

  if (!result || result.error) {
    throw new Error(`Failed to calculate houses: ${result?.error || 'Unknown error'}`)
  }

  return {
    houses: result.data.house || result.house,
    ascendant: result.data.ascendant || result.ascendant,
    mc: result.data.mc || result.mc,
    armc: result.data.armc || result.armc,
    vertex: result.data.vertex || result.vertex,
    equatorialAscendant: result.data.equatorialAscendant || result.equatorialAscendant
  }
}

export function calculateChironPosition(julianDay) {
  if (!swissEph) {
    throw new Error('Swiss Ephemeris not initialized')
  }

  const SE_CHIRON = 15
  const SEFLG_SWIEPH = 2
  const SEFLG_SPEED = 256

  const result = swissEph.swe_calc_ut(
    julianDay,
    SE_CHIRON,
    SEFLG_SWIEPH | SEFLG_SPEED
  )

  if (!result || result.error) {
    throw new Error(`Failed to calculate Chiron position: ${result?.error || 'Unknown error'}`)
  }

  return {
    longitude: result.data[0],
    latitude: result.data[1],
    distance: result.data[2],
    speed: result.data[3]
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
