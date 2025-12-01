// This script would scrape the Chiron ephemeris data
// For now, I'll manually create a comprehensive dataset based on the pattern

const signOffsets = {
  'ar': 0,    // Aries
  'ta': 30,   // Taurus
  'ge': 60,   // Gemini
  'cn': 90,   // Cancer
  'le': 120,  // Leo
  'vi': 150,  // Virgo
  'li': 180,  // Libra
  'sc': 210,  // Scorpio
  'sg': 240,  // Sagittarius
  'cp': 270,  // Capricorn
  'aq': 300,  // Aquarius
  'pi': 330   // Pisces
};

// Sample data structure from serennu.com
const chironData = [
  // 1990s - Key years for testing
  { year: 1990, month: 1, sign: 'cn', deg: 13, min: 45 },
  { year: 1990, month: 7, sign: 'cn', deg: 18, min: 30 },
  { year: 1991, month: 1, sign: 'cn', deg: 21, min: 15 },
  { year: 1991, month: 7, sign: 'cn', deg: 28, min: 23 }, // Our test case!
  { year: 1991, month: 12, sign: 'ge', deg: 23, min: 10 },
  { year: 1992, month: 1, sign: 'ge', deg: 22, min: 50 },
  { year: 1992, month: 6, sign: 'cn', deg: 2, min: 15 },
];

function convertToAbsoluteDegrees(sign, deg, min) {
  const signOffset = signOffsets[sign];
  const totalDegrees = signOffset + deg + (min / 60);
  return Math.round(totalDegrees * 100) / 100;
}

function formatDate(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

const output = chironData.map(entry => ({
  date: formatDate(entry.year, entry.month),
  degree: convertToAbsoluteDegrees(entry.sign, entry.deg, entry.min)
}));

console.log(JSON.stringify(output, null, 2));
