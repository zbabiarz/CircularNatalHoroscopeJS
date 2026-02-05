let swissEph = null
let initAttempted = false
let initSucceeded = false
let epheFilesLoaded = false

export async function initSwissEph() {
  if (initAttempted) {
    if (initSucceeded) return swissEph
    throw new Error('Swiss Ephemeris not available')
  }

  initAttempted = true

  try {
    const SwissEPH = (await import('sweph-wasm')).default
    swissEph = await SwissEPH.init()

    initSucceeded = true
    console.log('Swiss Ephemeris initialized successfully (using Moshier ephemeris)')

    loadEphemerisFiles()

    return swissEph
  } catch (error) {
    console.log('Swiss Ephemeris init error:', error.message || error)
    initSucceeded = false
    swissEph = null
    throw new Error('Swiss Ephemeris WASM not available in this environment')
  }
}

async function loadEphemerisFiles() {
  if (epheFilesLoaded || !swissEph) return

  try {
    await swissEph.swe_set_ephe_path(
      'https://github.com/aloistr/swisseph/raw/refs/heads/master/ephe/',
      ['seas_18.se1', 'sepl_18.se1']
    )
    epheFilesLoaded = true
    console.log('Swiss Ephemeris data files loaded (Chiron support enabled)')
  } catch (error) {
    console.log('Could not load ephemeris data files, Chiron will use lookup table fallback:', error.message || error)
  }
}

export async function waitForEphemerisFiles() {
  if (epheFilesLoaded) return true
  if (!swissEph) return false

  try {
    await loadEphemerisFiles()
    return epheFilesLoaded
  } catch {
    return false
  }
}

export function isSwissEphAvailable() {
  return initSucceeded && swissEph !== null
}

export function isEpheFilesLoaded() {
  return epheFilesLoaded
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

  const result = swissEph.swe_houses(
    julianDay,
    latitude,
    longitude,
    'P'
  )

  if (!result || !result.cusps) {
    throw new Error('Failed to calculate houses')
  }

  return {
    houses: result.cusps,
    ascendant: result.ascmc[0],
    mc: result.ascmc[1],
    armc: result.ascmc[2],
    vertex: result.ascmc[3],
    equatorialAscendant: result.ascmc[4]
  }
}

export function calculateChironPosition(julianDay) {
  if (!swissEph) {
    throw new Error('Swiss Ephemeris not initialized')
  }

  const flags = epheFilesLoaded
    ? swissEph.SEFLG_SWIEPH | swissEph.SEFLG_SPEED
    : swissEph.SEFLG_MOSEPH | swissEph.SEFLG_SPEED

  const result = swissEph.swe_calc_ut(
    julianDay,
    swissEph.SE_CHIRON,
    flags
  )

  if (!result || (Array.isArray(result) && result.length === 0)) {
    throw new Error('Chiron calculation returned no data')
  }

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
  planetLongitude = ((planetLongitude % 360) + 360) % 360

  for (let i = 1; i <= 12; i++) {
    const currentCusp = houseCusps[i]
    const nextIndex = i === 12 ? 1 : i + 1
    const nextCusp = houseCusps[nextIndex]

    if (currentCusp === undefined || nextCusp === undefined) {
      continue
    }

    let isInHouse = false

    if (nextCusp > currentCusp) {
      isInHouse = planetLongitude >= currentCusp && planetLongitude < nextCusp
    } else {
      isInHouse = planetLongitude >= currentCusp || planetLongitude < nextCusp
    }

    if (isInHouse) {
      return i
    }
  }

  return null
}
