/**
 * Validates that an AI-generated report contains all required sections
 * and meets minimum quality standards
 */

const REQUIRED_SECTIONS = [
  '**Archetype:**',
  '**Theme:**',
  '**Chiron\'s Story**',
  '**Core Wound**',
  '**How It Feels**',
  '**Shadow Patterns**',
  '**Your Medicine**',
  '**Your Invitation**',
  '**Journal / Reflection Prompts**'
]

const MIN_REPORT_LENGTH = 3000 // Characters
const MIN_COMPLETE_REPORT_LENGTH = 4000 // For truly complete reports

/**
 * Validates a report and returns validation status
 * @param {string} report - The AI-generated report text
 * @returns {object} - { isValid: boolean, status: string, missingSections: array, length: number }
 */
export function validateReport(report) {
  if (!report || typeof report !== 'string') {
    return {
      isValid: false,
      status: 'failed',
      missingSections: REQUIRED_SECTIONS,
      length: 0,
      error: 'Report is empty or invalid'
    }
  }

  const reportLength = report.trim().length
  const missingSections = []

  // Check for all required sections
  for (const section of REQUIRED_SECTIONS) {
    if (!report.includes(section)) {
      missingSections.push(section)
    }
  }

  // Determine status based on validation
  let status = 'completed'
  let isValid = true

  if (missingSections.length > 0) {
    status = 'partial'
    isValid = false
  } else if (reportLength < MIN_REPORT_LENGTH) {
    status = 'partial'
    isValid = false
    missingSections.push('Report is too short')
  } else if (reportLength < MIN_COMPLETE_REPORT_LENGTH) {
    // Report has all sections but might be incomplete
    status = 'partial'
    isValid = false
  }

  return {
    isValid,
    status,
    missingSections,
    length: reportLength,
    error: missingSections.length > 0 ? `Missing sections: ${missingSections.join(', ')}` : null
  }
}

/**
 * Checks if a report appears to be truncated
 * @param {string} report - The AI-generated report text
 * @returns {boolean} - True if report appears truncated
 */
export function isReportTruncated(report) {
  if (!report) return true

  // Check if report ends with reflection prompts (should be at the end)
  const hasReflectionPrompts = report.includes('**Journal / Reflection Prompts**')

  // Check if there's content after the reflection prompts section
  const reflectionIndex = report.indexOf('**Journal / Reflection Prompts**')
  if (reflectionIndex === -1) return true

  const contentAfterReflection = report.substring(reflectionIndex).trim()

  // Should have at least 100 characters after the reflection prompts header (the actual prompts)
  return contentAfterReflection.length < 100
}
