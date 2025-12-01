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

function calculateSimpleHouse(chironDegree) {
  const houseSize = 30
  const house = Math.floor(chironDegree / houseSize) + 1
  return house > 12 ? house - 12 : house
}

export async function calculateChironData(formData) {
  const { name, email, birthDate, birthTime, birthLocation } = formData

  const chironSign = getChironSign(birthDate)
  const chironDegree = getChironDegree(birthDate)

  let chironHouse = null
  let shadowId = `chiron_${chironSign.toLowerCase()}`

  if (birthTime && birthLocation) {
    chironHouse = calculateSimpleHouse(chironDegree)
    shadowId = `chiron_${chironSign.toLowerCase()}_${chironHouse}`
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