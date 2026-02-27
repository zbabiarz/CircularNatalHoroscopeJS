let swissEph = null
let initAttempted = false
let initSucceeded = false
let epheFilesLoaded = false
let loadingPromise = null

const EPHE_BASE_URL = 'https://cdn.jsdelivr.net/gh/aloistr/swisseph@master/ephe'
const EPHE_FILES = ['seas_18.se1', 'sepl_18.se1']
const EPHE_DIR = '/ephe'

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
  if (loadingPromise) return loadingPromise

  loadingPromise = doLoadEphemerisFiles()
  return loadingPromise
}

async function doLoadEphemerisFiles() {
  try {
    const wasm = swissEph.wasm
    const FS = wasm.FS

    if (!FS.analyzePath(EPHE_DIR, true).exists) {
      FS.mkdir(EPHE_DIR)
    }

    let loaded = 0
    for (const name of EPHE_FILES) {
      const url = `${EPHE_BASE_URL}/${name}`
      const response = await fetch(url)
      if (!response.ok) {
        console.log(`Failed to fetch ${name}: HTTP ${response.status}`)
        continue
      }

      const buffer = await response.arrayBuffer()
      const data = new Uint8Array(buffer)
      const filePath = `${EPHE_DIR}/${name}`

      if (FS.analyzePath(filePath).exists) {
        FS.unlink(filePath)
      }

      FS.createDataFile(EPHE_DIR, name, data, true, true, true)
      console.log(`Loaded ephemeris file: ${name} (${data.byteLength} bytes)`)
      loaded++
    }

    if (loaded === 0) {
      console.log('No ephemeris files could be downloaded')
      return
    }

    const pathPtr = wasm._malloc(EPHE_DIR.length + 1)
    wasm.stringToUTF8(EPHE_DIR, pathPtr, EPHE_DIR.length + 1)
    wasm._swe_set_ephe_path(pathPtr)
    wasm._free(pathPtr)

    epheFilesLoaded = true
    console.log(`Swiss Ephemeris data files loaded (${loaded} files, Chiron support enabled)`)
  } catch (error) {
    console.error('CRITICAL: Could not load ephemeris data files:', error.message || error)
    throw new Error('Failed to load Swiss Ephemeris data files. Chiron calculations require these files.')
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
