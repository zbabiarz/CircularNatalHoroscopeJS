import { Horoscope } from '../Horoscope'
import { Origin } from '../Origin'
import chironSigns from '../data/chiron-signs.json'
import chironDegrees from '../data/chiron-degrees.json'
import { shadowMap } from '../data/shadowMap'

function getEphemerisConstructor() {
  const ephemeris = window.Ephemeris;
  if (!ephemeris) return null;

  if (typeof ephemeris === 'function') {
    return ephemeris;
  }

  if (typeof ephemeris.default === 'function') {
    return ephemeris.default;
  }

  for (const key in ephemeris) {
    if (typeof ephemeris[key] === 'function' && key !== '__esModule') {
      return ephemeris[key];
    }
  }

  return null;
}

function loadEphemerisScript() {
  return new Promise((resolve) => {
    if (getEphemerisConstructor()) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="ephemeris"]');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = '/ephemeris-1.2.1.bundle.js';
    script.async = false;

    script.onload = () => {
      setTimeout(resolve, 100);
    };

    script.onerror = () => {
      console.error('Failed to load ephemeris script');
      resolve();
    };

    document.head.appendChild(script);
  });
}

function waitForEphemeris() {
  return new Promise(async (resolve) => {
    if (getEphemerisConstructor()) {
      resolve();
      return;
    }

    await loadEphemerisScript();

    const checkInterval = setInterval(() => {
      if (getEphemerisConstructor()) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (!getEphemerisConstructor()) {
        console.error('Ephemeris library failed to load properly', {
          exists: !!window.Ephemeris,
          type: typeof window.Ephemeris,
          keys: window.Ephemeris ? Object.keys(window.Ephemeris) : []
        });
      }
      resolve();
    }, 5000);
  });
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
    await waitForEphemeris()

    if (!getEphemerisConstructor()) {
      console.error('Ephemeris library not loaded or not a constructor', {
        exists: !!window.Ephemeris,
        type: typeof window.Ephemeris,
        keys: window.Ephemeris ? Object.keys(window.Ephemeris) : []
      });
      return {
        name,
        email,
        chironSign,
        chironDegree,
        chironHouse,
        shadowId,
        shadowText: shadowMap[shadowId]?.description || 'Shadow description not found.'
      }
    }

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
      const chironLongitude = chironDegree

      console.log('=== CHIRON HOUSE CALCULATION DEBUG ===')
      console.log(`Birth: ${birthDate} ${birthTime} at ${birthLocation}`)
      console.log(`Chiron: ${chironSign} at ${chironLongitude}°`)
      console.log(`Ascendant: ${horoscope.Ascendant?.ChartPosition?.Ecliptic?.DecimalDegrees?.toFixed(2)}°`)
      console.log(`Midheaven: ${horoscope.Midheaven?.ChartPosition?.Ecliptic?.DecimalDegrees?.toFixed(2)}°`)
      console.log('\nHouse Cusps:')

      if (houses && houses.length > 0) {
        for (let i = 0; i < 12; i++) {
          const house = houses[i]
          const startDegree = house.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees
          const endDegree = house.ChartPosition?.EndPosition?.Ecliptic?.DecimalDegrees

          if (startDegree !== undefined && endDegree !== undefined) {
            let isInHouse = false

            if (endDegree > startDegree) {
              isInHouse = chironLongitude >= startDegree && chironLongitude < endDegree
            } else {
              isInHouse = chironLongitude >= startDegree || chironLongitude < endDegree
            }

            console.log(`  House ${i + 1}: ${startDegree.toFixed(2)}° - ${endDegree.toFixed(2)}° | Contains ${chironLongitude}°? ${isInHouse}`)

            if (isInHouse) {
              const houseNum = i + 1
              chironHouse = `${houseNum}${getOrdinalSuffix(houseNum)} House`
              shadowId = `chiron_${chironSign.toLowerCase()}_${houseNum}`
              console.log(`\n✓ RESULT: Chiron in House ${houseNum}`)
            }
          }
        }
      }
      console.log('=== END DEBUG ===\n')
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
