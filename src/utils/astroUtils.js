import { Origin, Horoscope } from 'circular-natal-horoscope-js'
import chironSigns from '../data/chiron-signs.json'
import chironDegrees from '../data/chiron-degrees.json'
import { shadowMap } from '../data/shadowMap'

function parseCoordinates(locationString) {
  const coordPattern = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/
  const match = locationString.match(coordPattern)
  
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2])
    }
  }
  
  return { latitude: 0, longitude: 0 }
}

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

function getHouseForDegree(chironDegree, houseCusps) {
  const cusps = [...houseCusps, houseCusps[0] + 360]
  
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]
    const end = cusps[i + 1]
    
    if (
      (start <= chironDegree && chironDegree < end) ||
      (end < start && (chironDegree >= start || chironDegree < end))
    ) {
      return i + 1
    }
  }
  
  return null
}

export async function calculateChironData(formData) {
  const { name, email, birthDate, birthTime, birthLocation } = formData
  
  const chironSign = getChironSign(birthDate)
  const chironDegree = getChironDegree(birthDate)
  
  let chironHouse = null
  let shadowId = `chiron_${chironSign.toLowerCase()}`
  
  if (birthTime && birthLocation) {
    try {
      const coords = parseCoordinates(birthLocation)
      const date = new Date(birthDate)
      const [hours, minutes] = birthTime.split(':').map(Number)
      
      const origin = new Origin({
        year: date.getFullYear(),
        month: date.getMonth(),
        date: date.getDate(),
        hour: hours,
        minute: minutes,
        latitude: coords.latitude,
        longitude: coords.longitude
      })
      
      const chart = new Horoscope({ origin })
      const houseCusps = chart.Houses.getHouseCusps()
      
      chironHouse = getHouseForDegree(chironDegree, houseCusps)
      
      if (chironHouse) {
        shadowId = `chiron_${chironSign.toLowerCase()}_${chironHouse}`
      }
    } catch (error) {
      console.error('Error calculating house:', error)
    }
  }
  
  const shadowText = shadowMap[shadowId]?.description || 'Shadow description not found.'
  
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