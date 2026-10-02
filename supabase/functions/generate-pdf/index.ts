import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { jsPDF } from "npm:jspdf@2.5.2";

// ---------------------------------------------------------------------------
// CORS headers — required on every response (OPTIONS, success, error)
// ---------------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ---------------------------------------------------------------------------
// Design-system colours
// ---------------------------------------------------------------------------
interface Color {
  r: number;
  g: number;
  b: number;
}

const CHARCOAL: Color = { r: 30, g: 34, b: 32 }; // #1E2220
const CREAM: Color = { r: 246, g: 241, b: 235 }; // #F6F1EB
const LIME: Color = { r: 195, g: 205, b: 66 }; // #C3CD42
const PINK_LINE: Color = { r: 233, g: 185, b: 196 }; // #E9B9C4
const SOFT_GREEN: Color = { r: 238, g: 241, b: 214 }; // #EEF1D6
const SOFT_PINK: Color = { r: 244, g: 228, b: 232 }; // #F4E4E8
const SOFT_STONE: Color = { r: 236, g: 233, b: 227 }; // #ECE9E3
const DARK_TEXT: Color = { r: 58, g: 58, b: 58 }; // #3A3A3A
const WHITE: Color = { r: 255, g: 255, b: 255 };
const LIGHT_GRAY_TEXT: Color = { r: 204, g: 204, b: 204 }; // #cccccc
const FOOTER_GRAY_CREAM: Color = { r: 120, g: 120, b: 120 }; // #787878
const FOOTER_GRAY_DARK: Color = { r: 150, g: 150, b: 150 }; // #969696
const FRAME_STROKE: Color = { r: 58, g: 62, b: 60 }; // #3A3E3C
const CIRCLE_GRAY: Color = { r: 85, g: 85, b: 85 }; // #555

// ---------------------------------------------------------------------------
// Page dimensions
// ---------------------------------------------------------------------------
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2; // 170mm

// ---------------------------------------------------------------------------
// Font-related types / state
// ---------------------------------------------------------------------------
interface Fonts {
  hasMontserrat: boolean;
  hasPlayfair: boolean;
}

type Doc = InstanceType<typeof jsPDF>;

// ---------------------------------------------------------------------------
// Font fetching + registration
// ---------------------------------------------------------------------------
async function fetchFontB64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(
        `Font fetch failed: ${resp.status} ${resp.statusText} for ${url}`
      );
      return null;
    }
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      console.error(`Font fetch returned HTML instead of font for ${url}`);
      return null;
    }
    const buf = await resp.arrayBuffer();
    if (buf.byteLength < 100) {
      console.error(
        `Font data too small (${buf.byteLength} bytes) for ${url}`
      );
      return null;
    }
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error(`Font fetch error for ${url}:`, e);
    return null;
  }
}

async function loadFonts(doc: Doc): Promise<Fonts> {
  let hasMontserrat = false;
  let hasPlayfair = false;

  const montBoldUrl =
    "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Hw5aXo.ttf";
  const montRegUrl =
    "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.ttf";
  const playfairUrl =
    "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2rA0s.ttf";

  const [montBoldB64, montRegB64, playfairB64] = await Promise.all([
    fetchFontB64(montBoldUrl),
    fetchFontB64(montRegUrl),
    fetchFontB64(playfairUrl),
  ]);

  try {
    if (montBoldB64 && montRegB64) {
      doc.addFileToVFS("Montserrat-Bold.ttf", montBoldB64);
      doc.addFont("Montserrat-Bold.ttf", "Montserrat", "bold");
      doc.addFileToVFS("Montserrat-Regular.ttf", montRegB64);
      doc.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");
      doc.setFont("Montserrat", "bold");
      doc.setFont("Montserrat", "normal");
      hasMontserrat = true;
      console.log("Montserrat fonts loaded successfully");
    } else {
      console.warn(
        "Montserrat fonts not available, using helvetica fallback"
      );
    }
  } catch (e) {
    console.error("Montserrat registration failed:", e);
    hasMontserrat = false;
  }

  try {
    if (playfairB64) {
      doc.addFileToVFS("PlayfairDisplay-Italic.ttf", playfairB64);
      doc.addFont("PlayfairDisplay-Italic.ttf", "Playfair", "italic");
      doc.setFont("Playfair", "italic");
      hasPlayfair = true;
      console.log("Playfair font loaded successfully");
    } else {
      console.warn("Playfair font not available, using times fallback");
    }
  } catch (e) {
    console.error("Playfair registration failed:", e);
    hasPlayfair = false;
  }

  doc.setFont("helvetica", "normal");
  return { hasMontserrat, hasPlayfair };
}

// ---------------------------------------------------------------------------
// Report parsing
// ---------------------------------------------------------------------------
function stripMarkdownEmphasis(text: string): string {
  if (!text) return text;
  let out = text.replace(/\*\*([^\n*][^\n*]*?)\*\*/g, "$1");
  out = out.replace(/(?<![*\w])\*(?!\s)([^\n*]+?)(?<!\s)\*(?!\w)/g, "$1");
  out = out.replace(/(?<![_\w])_(?!\s)([^\n_]+?)(?<!\s)_(?!\w)/g, "$1");
  return out;
}

function parseStructuredReport(report: string): Map<string, string> {
  const sections = new Map<string, string>();
  const parts = report.split(/===([A-Z0-9_]+)===/);
  for (let i = 1; i < parts.length; i += 2) {
    sections.set(parts[i], stripMarkdownEmphasis((parts[i + 1] || "").trim()));
  }
  return sections;
}

interface GridItem {
  title: string;
  body: string;
}

function parseGridItems(gridText: string): GridItem[] {
  if (!gridText) return [];
  return gridText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("|||"))
    .map((line) => {
      const [title, ...rest] = line.split("|||");
      return { title: title.trim(), body: rest.join("|||").trim() };
    });
}

// ---------------------------------------------------------------------------
// Low-level drawing helpers
// ---------------------------------------------------------------------------
function setColor(doc: Doc, c: Color) {
  doc.setTextColor(c.r, c.g, c.b);
}

function setFillColor(doc: Doc, c: Color) {
  doc.setFillColor(c.r, c.g, c.b);
}

function fillRect(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  h: number,
  c: Color
) {
  setFillColor(doc, c);
  doc.rect(x, y, w, h, "F");
}

function drawPinkLine(
  doc: Doc,
  x: number,
  y: number,
  w: number,
  lineWidth = 0.4
) {
  doc.setDrawColor(PINK_LINE.r, PINK_LINE.g, PINK_LINE.b);
  doc.setLineWidth(lineWidth);
  doc.line(x, y, x + w, y);
}

function setMontBold(doc: Doc, fonts: Fonts, size: number) {
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "bold");
  doc.setFontSize(size);
}

function setMontRegular(doc: Doc, fonts: Fonts, size: number) {
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "normal");
  doc.setFontSize(size);
}

function setPlayfairItalic(doc: Doc, fonts: Fonts, size: number) {
  doc.setFont(fonts.hasPlayfair ? "Playfair" : "times", "italic");
  doc.setFontSize(size);
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------
function addFooter(doc: Doc, pageNum: number, isDark: boolean, fonts: Fonts) {
  const y = 285;
  const prevFont = doc.getFont();
  const prevSize = doc.getFontSize();
  const prevColor = doc.getTextColor();
  const textColor = isDark ? FOOTER_GRAY_DARK : FOOTER_GRAY_CREAM;
  setColor(doc, textColor);
  setMontRegular(doc, fonts, 7);
  doc.text(
    "\u00A9 Love, Light, and Black Holes | Morgan Garza",
    MARGIN,
    y
  );
  doc.text(String(pageNum), PAGE_W - MARGIN, y, { align: "right" });
  doc.setFont(prevFont.fontName, prevFont.fontStyle);
  doc.setFontSize(prevSize);
  doc.setTextColor(prevColor);
}

// ---------------------------------------------------------------------------
// New-page helpers (cream background continuation pages)
// ---------------------------------------------------------------------------
function addCreamPage(doc: Doc): void {
  doc.addPage();
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CREAM);
}

function addCreamPageWithFooter(doc: Doc, fonts: Fonts): number {
  addCreamPage(doc);
  const pageNum = doc.getNumberOfPages();
  addFooter(doc, pageNum, false, fonts);
  return pageNum;
}

function addDarkPage(doc: Doc): void {
  doc.addPage();
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CHARCOAL);
}

/** Check if y is near the bottom of the page — if so, add a new cream page and return reset y. */
function ensureSpace(
  doc: Doc,
  y: number,
  needed: number,
  fonts: Fonts
): number {
  if (y + needed > 265) {
    addCreamPageWithFooter(doc, fonts);
    return 35;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Text-drawing helpers (paragraph flowing)
// ---------------------------------------------------------------------------
function drawWrappedText(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fonts: Fonts
): number {
  const lines: string[] = doc.splitTextToSize(text, maxWidth);
  if (lines.length >= 3) {
    const totalHeight = lines.length * lineHeight;
    const spaceLeft = 265 - y;
    const linesOnThisPage = Math.floor(spaceLeft / lineHeight);
    if (linesOnThisPage >= 1 && linesOnThisPage <= 2 && linesOnThisPage < lines.length) {
      y = ensureSpace(doc, y, totalHeight, fonts);
    }
  }
  for (const line of lines) {
    y = ensureSpace(doc, y, lineHeight + 2, fonts);
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

/** Draw multiple paragraphs (split by \n\n) with spacing. */
function drawParagraphs(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  paragraphGap: number,
  fonts: Fonts
): number {
  if (!text) return y;
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  for (const para of paragraphs) {
    y = drawWrappedText(doc, para.trim(), x, y, maxWidth, lineHeight, fonts);
    y += paragraphGap;
  }
  return y;
}

/** Draw a bullet list (lines starting with "•" or "- "). */
function drawBulletList(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  fonts: Fonts
): number {
  if (!text) return y;
  const items = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  for (const item of items) {
    const clean = item.replace(/^[\u2022\-]\s*/, "");
    const bulletStr = "\u2022 " + clean;
    y = drawWrappedText(
      doc,
      bulletStr,
      x,
      y,
      maxWidth,
      lineHeight,
      fonts
    );
    y += 1;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Callout box
// ---------------------------------------------------------------------------
function drawCalloutBox(
  doc: Doc,
  title: string,
  body: string,
  x: number,
  y: number,
  width: number,
  fonts: Fonts,
  bgColor: Color = SOFT_GREEN,
  showLeftBorder = true
): number {
  if (!title && !body) return y;

  // Measure height needed
  const paddingTop = 12;
  const paddingBottom = 12;
  const paddingLeft = 14;
  const paddingRight = 14;
  const innerWidth = width - paddingLeft - paddingRight;

  setMontBold(doc, fonts, 10);
  const titleLines: string[] = title
    ? doc.splitTextToSize(title, innerWidth)
    : [];
  const titleHeight = titleLines.length * 5;

  setMontRegular(doc, fonts, 9.5);
  const bodyLines: string[] = body
    ? doc.splitTextToSize(body, innerWidth)
    : [];
  const bodyHeight = bodyLines.length * 5;

  const totalHeight =
    paddingTop +
    titleHeight +
    (titleLines.length > 0 && bodyLines.length > 0 ? 4 : 0) +
    bodyHeight +
    paddingBottom;

  // Check if we need a new page
  y = ensureSpace(doc, y, totalHeight, fonts);

  // Draw background
  fillRect(doc, x, y, width, totalHeight, bgColor);

  // Left border
  if (showLeftBorder) {
    const borderColor: Color = { r: 190, g: 200, b: 140 }; // slightly darker green
    doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    doc.setLineWidth(2);
    doc.line(x, y, x, y + totalHeight);
  }

  let ty = y + paddingTop;

  // Title
  if (titleLines.length > 0) {
    setMontBold(doc, fonts, 10);
    setColor(doc, CHARCOAL);
    for (const line of titleLines) {
      doc.text(line, x + paddingLeft, ty);
      ty += 5;
    }
    if (bodyLines.length > 0) ty += 4;
  }

  // Body
  if (bodyLines.length > 0) {
    setMontRegular(doc, fonts, 9.5);
    setColor(doc, DARK_TEXT);
    for (const line of bodyLines) {
      doc.text(line, x + paddingLeft, ty);
      ty += 5;
    }
  }

  return y + totalHeight;
}

// ---------------------------------------------------------------------------
// Grid (2-column boxes)
// ---------------------------------------------------------------------------
const ROW_COLORS: Color[] = [SOFT_PINK, SOFT_GREEN, SOFT_STONE];

function getRowColor(rowIndex: number): Color {
  return ROW_COLORS[rowIndex % ROW_COLORS.length];
}

function measureGridCellHeight(
  doc: Doc,
  item: GridItem,
  cellWidth: number,
  fonts: Fonts
): number {
  const pad = 10;
  const innerW = cellWidth - pad * 2;

  setMontBold(doc, fonts, 9);
  const titleLines: string[] = doc.splitTextToSize(item.title, innerW);
  const titleH = titleLines.length * 4.5;

  setMontRegular(doc, fonts, 8.5);
  const bodyLines: string[] = doc.splitTextToSize(item.body, innerW);
  const bodyH = bodyLines.length * 4.2;

  return pad + titleH + 2 + bodyH + pad;
}

function drawGridCell(
  doc: Doc,
  item: GridItem,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number,
  bgColor: Color,
  fonts: Fonts
) {
  const pad = 10;
  const innerW = cellWidth - pad * 2;

  fillRect(doc, x, y, cellWidth, cellHeight, bgColor);

  let ty = y + pad;

  setMontBold(doc, fonts, 9);
  setColor(doc, CHARCOAL);
  const titleLines: string[] = doc.splitTextToSize(item.title, innerW);
  for (const line of titleLines) {
    doc.text(line, x + pad, ty);
    ty += 4.5;
  }
  ty += 2;

  setMontRegular(doc, fonts, 8.5);
  setColor(doc, DARK_TEXT);
  const bodyLines: string[] = doc.splitTextToSize(item.body, innerW);
  for (const line of bodyLines) {
    doc.text(line, x + pad, ty);
    ty += 4.2;
  }
}

function drawGrid(
  doc: Doc,
  gridText: string,
  x: number,
  y: number,
  totalWidth: number,
  fonts: Fonts,
  gap = 4
): number {
  const items = parseGridItems(gridText);
  if (items.length === 0) return y;

  const cellWidth = (totalWidth - gap) / 2;

  // Process items in rows of 2
  for (let i = 0; i < items.length; i += 2) {
    const rowIndex = Math.floor(i / 2);
    const bgColor = getRowColor(rowIndex);

    const left = items[i];
    const right = i + 1 < items.length ? items[i + 1] : null;

    const leftH = measureGridCellHeight(doc, left, cellWidth, fonts);
    const rightH = right
      ? measureGridCellHeight(doc, right, cellWidth, fonts)
      : 0;
    const rowH = Math.max(leftH, rightH);

    // Check page break
    y = ensureSpace(doc, y, rowH + gap, fonts);

    drawGridCell(doc, left, x, y, cellWidth, rowH, bgColor, fonts);
    if (right) {
      drawGridCell(
        doc,
        right,
        x + cellWidth + gap,
        y,
        cellWidth,
        rowH,
        bgColor,
        fonts
      );
    }

    y += rowH + gap;
  }

  return y;
}

// ---------------------------------------------------------------------------
// Table drawing (for cheat-sheet pages)
// ---------------------------------------------------------------------------
interface TableRow {
  cells: string[];
}

function parseTableRows(text: string): TableRow[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.includes("|||"))
    .map((l) => ({ cells: l.split("|||").map((c) => c.trim()) }));
}

function drawTableHeader(
  doc: Doc,
  headers: string[],
  x: number,
  y: number,
  totalWidth: number,
  cw: number[],
  fonts: Fonts
): number {
  const cellPad = 4;
  fillRect(doc, x, y, totalWidth, 10, CHARCOAL);
  setMontBold(doc, fonts, 8);
  setColor(doc, WHITE);
  let cx = x;
  for (let c = 0; c < headers.length; c++) {
    doc.text(headers[c], cx + cellPad, y + 7);
    cx += cw[c];
  }
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(x, y, x + totalWidth, y);
  return y;
}

function drawTable(
  doc: Doc,
  rows: TableRow[],
  headers: string[],
  x: number,
  y: number,
  totalWidth: number,
  fonts: Fonts,
  colWidths?: number[]
): number {
  if (rows.length === 0) return y;

  const numCols = headers.length;
  const cw =
    colWidths ||
    headers.map((_, i) => (i === 0 ? totalWidth * 0.25 : totalWidth * (0.75 / (numCols - 1))));
  const rowPad = 4;
  const cellPad = 4;

  y = ensureSpace(doc, y, 14, fonts);
  y = drawTableHeader(doc, headers, x, y, totalWidth, cw, fonts);

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    setMontRegular(doc, fonts, 8);
    let maxH = 10;
    const cellLines: string[][] = [];
    let cx = x;
    for (let c = 0; c < numCols; c++) {
      const cellText = row.cells[c] || "";
      const lines: string[] = doc.splitTextToSize(cellText, cw[c] - cellPad * 2);
      cellLines.push(lines);
      const h = lines.length * 4 + rowPad * 2;
      if (h > maxH) maxH = h;
      cx += cw[c];
    }

    const prevPage = doc.getNumberOfPages();
    y = ensureSpace(doc, y, maxH + 2, fonts);
    if (doc.getNumberOfPages() !== prevPage) {
      y = drawTableHeader(doc, headers, x, y, totalWidth, cw, fonts);
    }

    const bgColor = r % 2 === 0 ? WHITE : { r: 245, g: 248, b: 235 };
    fillRect(doc, x, y, totalWidth, maxH, bgColor);

    setMontRegular(doc, fonts, 8);
    setColor(doc, DARK_TEXT);
    cx = x;
    for (let c = 0; c < numCols; c++) {
      let ty = y + rowPad + 3;
      if (c === 0) {
        setMontBold(doc, fonts, 8);
        setColor(doc, CHARCOAL);
      } else {
        setMontRegular(doc, fonts, 8);
        setColor(doc, DARK_TEXT);
      }
      for (const line of cellLines[c]) {
        doc.text(line, cx + cellPad, ty);
        ty += 4;
      }
      cx += cw[c];
    }

    y += maxH;

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.15);
    doc.line(x, y, x + totalWidth, y);
  }

  return y;
}

// ---------------------------------------------------------------------------
// PAGE 1 — COVER
// ---------------------------------------------------------------------------
function buildCoverPage(
  doc: Doc,
  data: {
    name: string;
    chironSign: string;
    chironHouse: string;
    woundName: string;
  },
  fonts: Fonts
) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CHARCOAL);

  // Thin rounded frame inset 12mm
  const inset = 12;
  doc.setDrawColor(FRAME_STROKE.r, FRAME_STROKE.g, FRAME_STROKE.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(inset, inset, PAGE_W - inset * 2, PAGE_H - inset * 2, 4, 4);

  // Top-left short pink line
  doc.setDrawColor(PINK_LINE.r, PINK_LINE.g, PINK_LINE.b);
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 5, 35, MARGIN + 35, 35);

  // "PERSONALIZED CHIRON REPORT"
  setColor(doc, LIME);
  setMontBold(doc, fonts, 10);
  doc.text("PERSONALIZED CHIRON REPORT", MARGIN + 5, 45);

  // "THE SHADOW MAP"
  setColor(doc, CREAM);
  setMontBold(doc, fonts, 42);
  doc.text("THE SHADOW MAP", MARGIN + 5, 75);

  // "Your wound. Your patterns. Your power."
  setPlayfairItalic(doc, fonts, 16);
  setColor(doc, CREAM);
  doc.text("Your wound. Your patterns. Your power.", MARGIN + 5, 90);

  // Pink horizontal line
  drawPinkLine(doc, MARGIN + 5, 98, CONTENT_W * 0.6, 0.5);

  // Chiron placement
  setColor(doc, LIME);
  setMontBold(doc, fonts, 14);
  const hasHouse = data.chironHouse && data.chironHouse !== "Unknown";
  doc.text(`CHIRON IN ${data.chironSign.toUpperCase()}`, MARGIN + 5, 115);
  if (hasHouse) {
    doc.text(data.chironHouse.toUpperCase(), MARGIN + 5, 128);
  }

  // Wound name
  setPlayfairItalic(doc, fonts, 16);
  setColor(doc, CREAM);
  const woundY = hasHouse ? 142 : 132;
  const wrappedWound: string[] = doc.splitTextToSize(data.woundName, 130);
  doc.text(wrappedWound, MARGIN + 5, woundY);

  // Concentric circles right-center
  doc.setDrawColor(CIRCLE_GRAY.r, CIRCLE_GRAY.g, CIRCLE_GRAY.b);
  doc.setLineWidth(0.3);
  doc.circle(PAGE_W - MARGIN - 25, 140, 18);
  doc.circle(PAGE_W - MARGIN - 25, 140, 25);

  // Bottom-left: "by Morgan Garza" (h3 size)
  setColor(doc, CREAM);
  setMontBold(doc, fonts, 14);
  doc.text("by Morgan Garza", MARGIN + 5, PAGE_H - 58);

  // "Love, Light, and Black Holes"
  setPlayfairItalic(doc, fonts, 18);
  setColor(doc, CREAM);
  doc.text("Love, Light, and Black Holes", MARGIN + 5, PAGE_H - 42);

  // Short pink line bottom-right
  doc.setDrawColor(PINK_LINE.r, PINK_LINE.g, PINK_LINE.b);
  doc.setLineWidth(0.5);
  doc.line(
    PAGE_W - MARGIN - 35,
    PAGE_H - 35,
    PAGE_W - MARGIN - 5,
    PAGE_H - 35
  );
}

// ---------------------------------------------------------------------------
// PAGE 2 — OVERVIEW (dark background)
// ---------------------------------------------------------------------------
function buildOverviewPage(
  doc: Doc,
  sections: Map<string, string>,
  chironSign: string,
  chironHouse: string,
  fonts: Fonts
) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CHARCOAL);

  let y = 25;

  // Top line: "CHIRON IN [SIGN] · [HOUSE]"
  setMontBold(doc, fonts, 10);
  setColor(doc, LIME);
  const hasHouse = chironHouse && chironHouse !== "Unknown";
  const placementLabel = hasHouse
    ? `CHIRON IN ${chironSign.toUpperCase()} \u00B7 ${chironHouse.toUpperCase()}`
    : `CHIRON IN ${chironSign.toUpperCase()}`;
  doc.text(placementLabel, MARGIN, y);
  y += 12;

  // Wound name large
  const woundName = sections.get("WOUND_NAME") || "YOUR WOUND";
  setMontBold(doc, fonts, 36);
  setColor(doc, LIME);
  const woundLines: string[] = doc.splitTextToSize(
    woundName.toUpperCase(),
    CONTENT_W
  );
  for (const line of woundLines) {
    doc.text(line, MARGIN, y);
    y += 14;
  }
  y += 2;

  // Tagline
  const tagline = sections.get("TAGLINE") || "";
  if (tagline) {
    setPlayfairItalic(doc, fonts, 16);
    setColor(doc, CREAM);
    const tagLines: string[] = doc.splitTextToSize(tagline, CONTENT_W);
    for (const line of tagLines) {
      doc.text(line, MARGIN, y);
      y += 7;
    }
    y += 4;
  }

  // Intro paragraph
  const overviewIntro = sections.get("OVERVIEW_INTRO") || "";
  if (overviewIntro) {
    setMontRegular(doc, fonts, 9.5);
    setColor(doc, LIGHT_GRAY_TEXT);
    const introLines: string[] = doc.splitTextToSize(overviewIntro, CONTENT_W);
    for (const line of introLines) {
      doc.text(line, MARGIN, y);
      y += 4.8;
    }
    y += 6;
  }

  // 3x2 Grid
  const gridText = sections.get("OVERVIEW_GRID") || "";
  const gridItems = parseGridItems(gridText);
  if (gridItems.length > 0) {
    const gap = 4;
    const cellW = (CONTENT_W - gap) / 2;
    const overviewRowColors: Color[] = [SOFT_PINK, SOFT_GREEN, SOFT_STONE];

    for (let i = 0; i < gridItems.length; i += 2) {
      const rowIndex = Math.floor(i / 2);
      const bgColor =
        overviewRowColors[rowIndex % overviewRowColors.length];
      const left = gridItems[i];
      const right = i + 1 < gridItems.length ? gridItems[i + 1] : null;

      const leftH = measureGridCellHeight(doc, left, cellW, fonts);
      const rightH = right
        ? measureGridCellHeight(doc, right, cellW, fonts)
        : 0;
      const rowH = Math.max(leftH, rightH, 28);

      drawGridCell(doc, left, MARGIN, y, cellW, rowH, bgColor, fonts);
      if (right) {
        drawGridCell(
          doc,
          right,
          MARGIN + cellW + gap,
          y,
          cellW,
          rowH,
          bgColor,
          fonts
        );
      }

      y += rowH + gap;
    }
  }

  y += 4;

  // Bullet list
  const bullets = sections.get("OVERVIEW_BULLETS") || "";
  if (bullets) {
    setMontRegular(doc, fonts, 8.5);
    setColor(doc, LIGHT_GRAY_TEXT);
    const bulletItems = bullets
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    for (const item of bulletItems) {
      const clean = item.replace(/^[\u2022\-]\s*/, "");
      const bStr = "\u2022  " + clean;
      const bLines: string[] = doc.splitTextToSize(bStr, CONTENT_W);
      for (const line of bLines) {
        if (y > 270) break;
        doc.text(line, MARGIN, y);
        y += 4.2;
      }
      y += 1;
    }
  }

  y += 4;

  // Large closing italic
  const closingText = sections.get("OVERVIEW_CLOSING") || "";
  if (closingText) {
    setPlayfairItalic(doc, fonts, 15);
    setColor(doc, CREAM);
    const closingLines: string[] = doc.splitTextToSize(closingText, CONTENT_W);
    for (const line of closingLines) {
      if (y > 280) break;
      doc.text(line, MARGIN, y);
      y += 7;
    }
  }

  addFooter(doc, doc.getNumberOfPages(), true, fonts);
}

// ---------------------------------------------------------------------------
// SECTION DIVIDER PAGES
// ---------------------------------------------------------------------------
function buildSectionDivider(
  doc: Doc,
  sectionNumber: string,
  label: string,
  title: string,
  description: string,
  fonts: Fonts
) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CHARCOAL);

  // Small lime dot centered at y≈70
  setFillColor(doc, LIME);
  doc.circle(PAGE_W / 2, 70, 1.5, "F");

  let y = 82;

  // Section label
  if (label) {
    setMontBold(doc, fonts, 10);
    setColor(doc, LIME);
    doc.text(label.toUpperCase(), PAGE_W / 2, y, { align: "center" });
    y += 14;
  }

  // Section title — map to display titles
  const displayTitles: Record<string, string> = {
    "1": "THE WOUND",
    "2": "WHERE IT SHOWS UP",
    "3": "THE OTHER SIDE OF THE COIN",
    "4": "INTEGRATION",
    "5": "CHIRON CHEAT SHEETS",
  };
  const displayTitle = title || displayTitles[sectionNumber] || "";
  if (displayTitle) {
    setMontBold(doc, fonts, 36);
    setColor(doc, CREAM);
    const titleLines: string[] = doc.splitTextToSize(
      displayTitle.toUpperCase(),
      160
    );
    for (const line of titleLines) {
      doc.text(line, PAGE_W / 2, y, { align: "center" });
      y += 14;
    }
    y += 4;
  }

  // Pink line centered
  drawPinkLine(doc, PAGE_W / 2 - 40, y, 80, 0.5);
  y += 12;

  // Italic description
  if (description) {
    setPlayfairItalic(doc, fonts, 13);
    setColor(doc, CREAM);
    const descLines: string[] = doc.splitTextToSize(description, 160);
    for (const line of descLines) {
      doc.text(line, PAGE_W / 2, y, { align: "center" });
      y += 6.5;
    }
  }

  // Large section number bottom-right
  const numStr = sectionNumber.padStart(2, "0");
  setPlayfairItalic(doc, fonts, 60);
  setColor(doc, LIME);
  doc.text(numStr, 160, 230);
}

// ---------------------------------------------------------------------------
// Flowing content block — draws a sub-section at a given Y, returns final Y
// ---------------------------------------------------------------------------
function drawContentBlock(
  doc: Doc,
  sections: Map<string, string>,
  prefix: string,
  fonts: Fonts,
  startY: number,
  isContinuation: boolean
): number {
  const title = sections.get(`${prefix}_TITLE`) || "";
  const subtitle = sections.get(`${prefix}_SUBTITLE`) || "";
  const subheader = sections.get(`${prefix}_SUBHEADER`) || "";
  const body = sections.get(`${prefix}_BODY`) || "";
  const calloutTitle = sections.get(`${prefix}_CALLOUT_TITLE`) || "";
  const calloutBody = sections.get(`${prefix}_CALLOUT_BODY`) || "";
  const body2 = sections.get(`${prefix}_BODY2`) || "";
  const gridText = sections.get(`${prefix}_GRID`) || "";
  const callout2Title = sections.get(`${prefix}_CALLOUT2_TITLE`) || "";
  const callout2Body = sections.get(`${prefix}_CALLOUT2_BODY`) || "";

  if (!title && !body && !gridText && !calloutBody) return startY;

  if (prefix === "SECTION_1C") {
    addCreamPageWithFooter(doc, fonts);
    startY = 35;
    isContinuation = false;
  }

  let y = startY;

  if (isContinuation) {
    y += 14;
    if (y + 80 > 265) {
      addCreamPageWithFooter(doc, fonts);
      y = 35;
    }
  }

  const titleSize = isContinuation ? 22 : 28;
  const titleLineH = isContinuation ? 9 : 11;

  if (title) {
    setMontBold(doc, fonts, titleSize);
    setColor(doc, CHARCOAL);
    const titleLines: string[] = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
    for (const line of titleLines) {
      y = ensureSpace(doc, y, titleLineH + 2, fonts);
      doc.text(line, MARGIN, y);
      y += titleLineH;
    }
    y += 2;
  }

  if (subtitle) {
    setPlayfairItalic(doc, fonts, isContinuation ? 12 : 14);
    setColor(doc, CHARCOAL);
    const subLines: string[] = doc.splitTextToSize(subtitle, CONTENT_W);
    for (const line of subLines) {
      y = ensureSpace(doc, y, 7, fonts);
      doc.text(line, MARGIN, y);
      y += 6;
    }
    y += 4;
  }

  if (subheader) {
    setMontBold(doc, fonts, 9);
    setColor(doc, CHARCOAL);
    y = ensureSpace(doc, y, 8, fonts);
    doc.text(subheader.toUpperCase(), MARGIN, y);
    y += 6;
  }

  y = ensureSpace(doc, y, 6, fonts);
  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 10;

  if (body) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    y = drawParagraphs(doc, body, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 4;
  }

  if (calloutTitle || calloutBody) {
    y += 4;
    y = drawCalloutBox(doc, calloutTitle, calloutBody, MARGIN, y, CONTENT_W, fonts, SOFT_GREEN, true);
    y += 8;
  }

  if (body2) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    const body2Lines: string[] = doc.splitTextToSize(body2, CONTENT_W);
    const body2Height = body2Lines.length * 5.5 + 4;
    if (body2Height < 40) {
      y = ensureSpace(doc, y, body2Height, fonts);
    }
    y = drawParagraphs(doc, body2, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 4;
  }

  if (gridText) {
    if (prefix === "SECTION_3C") {
      addCreamPageWithFooter(doc, fonts);
      y = 35;
    } else {
      y += 4;
    }
    y = drawGrid(doc, gridText, MARGIN, y, CONTENT_W, fonts, 4);
    y += 4;
  }

  if (callout2Title || callout2Body) {
    y += 4;
    y = drawCalloutBox(doc, callout2Title, callout2Body, MARGIN, y, CONTENT_W, fonts, SOFT_GREEN, true);
    y += 8;
  }

  return y;
}

function drawJournalBlock(
  doc: Doc,
  sections: Map<string, string>,
  prefix: string,
  fonts: Fonts,
  startY: number
): number {
  const title = sections.get(`${prefix}_TITLE`) || "JOURNAL IT";
  const subtitle = sections.get(`${prefix}_SUBTITLE`) || "";

  let y = startY + 14;
  if (y + 100 > 265) {
    addCreamPageWithFooter(doc, fonts);
    y = 35;
  }

  setMontBold(doc, fonts, 22);
  setColor(doc, CHARCOAL);
  const titleLines: string[] = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
  for (const line of titleLines) {
    y = ensureSpace(doc, y, 10, fonts);
    doc.text(line, MARGIN, y);
    y += 9;
  }

  if (subtitle) {
    setPlayfairItalic(doc, fonts, 12);
    setColor(doc, CHARCOAL);
    y = ensureSpace(doc, y, 7, fonts);
    doc.text(subtitle, MARGIN, y);
    y += 6;
  }

  y = ensureSpace(doc, y, 6, fonts);
  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 8;

  for (let i = 1; i <= 3; i++) {
    const t = sections.get(`${prefix}_CALLOUT${i}_TITLE`) || sections.get(`${prefix}_CALLOUT_TITLE`) || "";
    const b = sections.get(`${prefix}_CALLOUT${i}_BODY`) || sections.get(`${prefix}_CALLOUT_BODY`) || "";
    if (t || b) {
      y = drawCalloutBox(doc, t, b, MARGIN, y, CONTENT_W, fonts, SOFT_GREEN, true);
      y += 6;
    }
  }

  return y;
}

function drawTableBlock(
  doc: Doc,
  title: string,
  subtitle: string,
  tableText: string,
  headers: string[],
  fonts: Fonts,
  startY: number,
  colWidths: number[]
): number {
  let y = startY + 14;
  if (y + 80 > 265) {
    addCreamPageWithFooter(doc, fonts);
    y = 35;
  }

  setMontBold(doc, fonts, 22);
  setColor(doc, CHARCOAL);
  const titleLines: string[] = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
  for (const line of titleLines) {
    y = ensureSpace(doc, y, 10, fonts);
    doc.text(line, MARGIN, y);
    y += 9;
  }

  if (subtitle) {
    setPlayfairItalic(doc, fonts, 12);
    setColor(doc, CHARCOAL);
    y = ensureSpace(doc, y, 7, fonts);
    doc.text(subtitle, MARGIN, y);
    y += 6;
  }

  y = ensureSpace(doc, y, 6, fonts);
  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 6;

  const rows = parseTableRows(tableText);
  y = drawTable(doc, rows, headers, MARGIN, y, CONTENT_W, fonts, colWidths);

  return y;
}

function drawHowToLoveBlock(
  doc: Doc,
  sections: Map<string, string>,
  fonts: Fonts,
  startY: number
): number {
  const title = sections.get("SECTION_5C_TITLE") || "HOW TO LOVE SOMEONE";
  const subtitle = sections.get("SECTION_5C_SUBTITLE") || "";
  const subheader = sections.get("SECTION_5C_SUBHEADER") || "";
  const body = sections.get("SECTION_5C_BODY") || "";
  const calloutTitle = sections.get("SECTION_5C_CALLOUT_TITLE") || "";
  const calloutBody = sections.get("SECTION_5C_CALLOUT_BODY") || "";
  const body2 = sections.get("SECTION_5C_BODY2") || "";
  const grid = sections.get("SECTION_5C_GRID") || sections.get("SECTION_5C_TABLE") || "";

  let y = startY + 14;
  if (y + 80 > 265) {
    addCreamPageWithFooter(doc, fonts);
    y = 35;
  }

  setMontBold(doc, fonts, 22);
  setColor(doc, CHARCOAL);
  const tLines: string[] = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
  for (const line of tLines) {
    y = ensureSpace(doc, y, 10, fonts);
    doc.text(line, MARGIN, y);
    y += 9;
  }

  if (subtitle) {
    setPlayfairItalic(doc, fonts, 12);
    setColor(doc, CHARCOAL);
    y = ensureSpace(doc, y, 7, fonts);
    doc.text(subtitle, MARGIN, y);
    y += 6;
  }

  if (subheader) {
    setMontBold(doc, fonts, 9);
    setColor(doc, CHARCOAL);
    y = ensureSpace(doc, y, 8, fonts);
    doc.text(subheader.toUpperCase(), MARGIN, y);
    y += 6;
  }

  y = ensureSpace(doc, y, 6, fonts);
  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 10;

  if (body) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    y = drawParagraphs(doc, body, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 4;
  }

  if (grid) {
    y += 4;
    y = drawGrid(doc, grid, MARGIN, y, CONTENT_W, fonts, 4);
    y += 4;
  }

  if (calloutTitle || calloutBody) {
    y += 4;
    y = drawCalloutBox(doc, calloutTitle, calloutBody, MARGIN, y, CONTENT_W, fonts, SOFT_GREEN, true);
    y += 8;
  }

  if (body2) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    const b2Lines: string[] = doc.splitTextToSize(body2, CONTENT_W);
    const b2H = b2Lines.length * 5.5 + 4;
    if (b2H < 40) y = ensureSpace(doc, y, b2H, fonts);
    y = drawParagraphs(doc, body2, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
  }

  return y;
}

function drawClosingBlock(
  doc: Doc,
  sections: Map<string, string>,
  fonts: Fonts,
  startY: number
): number {
  const title = sections.get("SECTION_5D_TITLE") || "YOUR MAP IS NOT THE DESTINATION";
  const subtitle = sections.get("SECTION_5D_SUBTITLE") || "";
  const subheader = sections.get("SECTION_5D_SUBHEADER") || "";
  const body = sections.get("SECTION_5D_BODY") || "";
  const calloutTitle = sections.get("SECTION_5D_CALLOUT_TITLE") || "";
  const calloutBody = sections.get("SECTION_5D_CALLOUT_BODY") || "";
  const body2 = sections.get("SECTION_5D_BODY2") || "";

  let y = startY + 14;
  if (y + 80 > 265) {
    addCreamPageWithFooter(doc, fonts);
    y = 35;
  }

  setMontBold(doc, fonts, 22);
  setColor(doc, CHARCOAL);
  const tLines: string[] = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
  for (const line of tLines) {
    y = ensureSpace(doc, y, 10, fonts);
    doc.text(line, MARGIN, y);
    y += 9;
  }

  if (subtitle) {
    setPlayfairItalic(doc, fonts, 12);
    setColor(doc, CHARCOAL);
    y = ensureSpace(doc, y, 7, fonts);
    doc.text(subtitle, MARGIN, y);
    y += 6;
  }

  if (subheader) {
    setMontBold(doc, fonts, 9);
    setColor(doc, CHARCOAL);
    y = ensureSpace(doc, y, 8, fonts);
    doc.text(subheader.toUpperCase(), MARGIN, y);
    y += 6;
  }

  y = ensureSpace(doc, y, 6, fonts);
  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 10;

  if (body) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    y = drawParagraphs(doc, body, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 4;
  }

  if (calloutTitle || calloutBody) {
    y += 4;
    y = drawCalloutBox(doc, calloutTitle, calloutBody, MARGIN, y, CONTENT_W, fonts, SOFT_GREEN, true);
    y += 8;
  }

  if (body2) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    const b2Lines: string[] = doc.splitTextToSize(body2, CONTENT_W);
    const b2H = b2Lines.length * 5.5 + 4;
    if (b2H < 40) y = ensureSpace(doc, y, b2H, fonts);
    y = drawParagraphs(doc, body2, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 6;
  }

  y = ensureSpace(doc, y, 35, fonts);
  y += 4;

  setPlayfairItalic(doc, fonts, 14);
  setColor(doc, CHARCOAL);
  doc.text("Love, light, and black holes,", MARGIN, y);
  y += 14;

  setPlayfairItalic(doc, fonts, 22);
  setColor(doc, CHARCOAL);
  doc.text("Morgan", MARGIN, y);
  y += 12;

  setMontRegular(doc, fonts, 9);
  setColor(doc, DARK_TEXT);
  doc.text("hello@lovelightandblackholes.com", MARGIN, y);
  y += 6;
  doc.text("@lovelightandblackholes", MARGIN, y);

  return y;
}

function addFootersToRange(doc: Doc, startPage: number, endPage: number, fonts: Fonts) {
  for (let p = startPage; p <= endPage; p++) {
    doc.setPage(p);
    addFooter(doc, p, false, fonts);
  }
  doc.setPage(endPage);
}

// ---------------------------------------------------------------------------
// Journal prompt pages (Section 4B, 4C)
// ---------------------------------------------------------------------------
function buildJournalPage(
  doc: Doc,
  title: string,
  subtitle: string,
  prompts: { title: string; body: string }[],
  fonts: Fonts,
  pageCounter: { count: number }
): void {
  addCreamPage(doc);
  pageCounter.count = doc.getNumberOfPages();

  let y = 40;

  // Title
  setMontBold(doc, fonts, 28);
  setColor(doc, CHARCOAL);
  doc.text(title.toUpperCase(), MARGIN, y);
  y += 12;

  // Subtitle
  if (subtitle) {
    setPlayfairItalic(doc, fonts, 14);
    setColor(doc, CHARCOAL);
    doc.text(subtitle, MARGIN, y);
    y += 8;
  }

  // Pink line
  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 12;

  // Draw journal prompt callout boxes
  for (const prompt of prompts) {
    y = drawCalloutBox(
      doc,
      prompt.title,
      prompt.body,
      MARGIN,
      y,
      CONTENT_W,
      fonts,
      SOFT_GREEN,
      true
    );
    y += 8;
  }

  addFooter(doc, doc.getNumberOfPages(), false, fonts);
}

// ---------------------------------------------------------------------------
// Table pages (Section 5A, 5B — Chiron by Sign / by House)
// ---------------------------------------------------------------------------
function buildTablePage(
  doc: Doc,
  title: string,
  subtitle: string,
  tableText: string,
  headers: string[],
  fonts: Fonts,
  pageCounter: { count: number },
  colWidths?: number[]
): void {
  addCreamPage(doc);
  pageCounter.count = doc.getNumberOfPages();

  let y = 40;

  // Title
  setMontBold(doc, fonts, 28);
  setColor(doc, CHARCOAL);
  const titleLines: string[] = doc.splitTextToSize(
    title.toUpperCase(),
    CONTENT_W
  );
  for (const line of titleLines) {
    doc.text(line, MARGIN, y);
    y += 11;
  }
  y += 2;

  // Subtitle
  if (subtitle) {
    setPlayfairItalic(doc, fonts, 14);
    setColor(doc, CHARCOAL);
    doc.text(subtitle, MARGIN, y);
    y += 8;
  }

  // Pink line
  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 8;

  const rows = parseTableRows(tableText);
  y = drawTable(doc, rows, headers, MARGIN, y, CONTENT_W, fonts, colWidths);

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = pageCounter.count; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, false, fonts);
  }
  doc.setPage(totalPages);
}

// ---------------------------------------------------------------------------
// "How to Love Someone" page (5C)
// ---------------------------------------------------------------------------
function buildHowToLovePage(
  doc: Doc,
  sections: Map<string, string>,
  fonts: Fonts,
  pageCounter: { count: number }
): void {
  const title = sections.get("SECTION_5C_TITLE") || "HOW TO LOVE SOMEONE";
  const subtitle =
    sections.get("SECTION_5C_SUBTITLE") || "WITH THIS CHIRON PLACEMENT";
  const subheader = sections.get("SECTION_5C_SUBHEADER") || "";
  const body = sections.get("SECTION_5C_BODY") || "";
  const calloutTitle = sections.get("SECTION_5C_CALLOUT_TITLE") || "";
  const calloutBody = sections.get("SECTION_5C_CALLOUT_BODY") || "";
  const body2 = sections.get("SECTION_5C_BODY2") || "";
  const grid = sections.get("SECTION_5C_GRID") || sections.get("SECTION_5C_TABLE") || "";

  addCreamPage(doc);
  pageCounter.count = doc.getNumberOfPages();

  let y = 40;

  setMontBold(doc, fonts, 28);
  setColor(doc, CHARCOAL);
  const tLines: string[] = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
  for (const line of tLines) {
    doc.text(line, MARGIN, y);
    y += 11;
  }
  y += 2;

  if (subtitle) {
    setPlayfairItalic(doc, fonts, 14);
    setColor(doc, CHARCOAL);
    doc.text(subtitle, MARGIN, y);
    y += 8;
  }

  if (subheader) {
    setMontBold(doc, fonts, 9);
    setColor(doc, CHARCOAL);
    doc.text(subheader.toUpperCase(), MARGIN, y);
    y += 6;
  }

  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 10;

  if (body) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    y = drawParagraphs(doc, body, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 4;
  }

  if (grid) {
    y += 4;
    y = drawGrid(doc, grid, MARGIN, y, CONTENT_W, fonts, 4);
    y += 4;
  }

  if (calloutTitle || calloutBody) {
    y += 4;
    y = drawCalloutBox(
      doc,
      calloutTitle,
      calloutBody,
      MARGIN,
      y,
      CONTENT_W,
      fonts,
      SOFT_GREEN,
      true
    );
    y += 8;
  }

  if (body2) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    const b2Lines: string[] = doc.splitTextToSize(body2, CONTENT_W);
    const b2H = b2Lines.length * 5.5 + 4;
    if (b2H < 40) y = ensureSpace(doc, y, b2H, fonts);
    y = drawParagraphs(doc, body2, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = pageCounter.count; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, false, fonts);
  }
  doc.setPage(totalPages);
}

// ---------------------------------------------------------------------------
// CLOSING PAGE (page 26) — Section 5D
// ---------------------------------------------------------------------------
function buildClosingPage(
  doc: Doc,
  sections: Map<string, string>,
  fonts: Fonts,
  pageCounter: { count: number }
): void {
  const title =
    sections.get("SECTION_5D_TITLE") || "YOUR MAP IS NOT THE DESTINATION";
  const subtitle = sections.get("SECTION_5D_SUBTITLE") || "";
  const subheader = sections.get("SECTION_5D_SUBHEADER") || "";
  const body = sections.get("SECTION_5D_BODY") || "";
  const calloutTitle = sections.get("SECTION_5D_CALLOUT_TITLE") || "";
  const calloutBody = sections.get("SECTION_5D_CALLOUT_BODY") || "";
  const body2 = sections.get("SECTION_5D_BODY2") || "";

  addCreamPage(doc);
  pageCounter.count = doc.getNumberOfPages();

  let y = 40;

  // Title
  setMontBold(doc, fonts, 28);
  setColor(doc, CHARCOAL);
  const tLines: string[] = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
  for (const line of tLines) {
    doc.text(line, MARGIN, y);
    y += 11;
  }
  y += 2;

  if (subtitle) {
    setPlayfairItalic(doc, fonts, 14);
    setColor(doc, CHARCOAL);
    doc.text(subtitle, MARGIN, y);
    y += 8;
  }

  if (subheader) {
    setMontBold(doc, fonts, 9);
    setColor(doc, CHARCOAL);
    doc.text(subheader.toUpperCase(), MARGIN, y);
    y += 6;
  }

  drawPinkLine(doc, MARGIN, y, CONTENT_W, 0.4);
  y += 10;

  if (body) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    y = drawParagraphs(doc, body, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 4;
  }

  if (calloutTitle || calloutBody) {
    y += 4;
    y = drawCalloutBox(
      doc,
      calloutTitle,
      calloutBody,
      MARGIN,
      y,
      CONTENT_W,
      fonts,
      SOFT_GREEN,
      true
    );
    y += 8;
  }

  if (body2) {
    setMontRegular(doc, fonts, 10);
    setColor(doc, DARK_TEXT);
    const b2Lines: string[] = doc.splitTextToSize(body2, CONTENT_W);
    const b2H = b2Lines.length * 5.5 + 4;
    if (b2H < 40) y = ensureSpace(doc, y, b2H, fonts);
    y = drawParagraphs(doc, body2, MARGIN, y, CONTENT_W, 5.5, 4, fonts);
    y += 6;
  }

  // Sign-off
  y = ensureSpace(doc, y, 35, fonts);
  y += 4;

  setPlayfairItalic(doc, fonts, 14);
  setColor(doc, CHARCOAL);
  doc.text("Love, light, and black holes,", MARGIN, y);
  y += 14;

  setPlayfairItalic(doc, fonts, 22);
  setColor(doc, CHARCOAL);
  doc.text("Morgan", MARGIN, y);
  y += 12;

  setMontRegular(doc, fonts, 9);
  setColor(doc, DARK_TEXT);
  doc.text("hello@lovelightandblackholes.com", MARGIN, y);
  y += 6;
  doc.text("@lovelightandblackholes", MARGIN, y);

  const totalPages = doc.getNumberOfPages();
  for (let p = pageCounter.count; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, false, fonts);
  }
  doc.setPage(totalPages);
}

// ---------------------------------------------------------------------------
// Static cheat-sheet table data (used when AI doesn't generate 5A/5B)
// ---------------------------------------------------------------------------
const CHIRON_BY_SIGN_TABLE = `Aries|||Feels invisible or like too much. Learned that existing loudly costs you something.|||Walks in and changes the room. Pioneers paths other people are too scared to take.
Taurus|||Never feels like enough. Hoards proof of worth because scarcity taught them that having means surviving.|||Builds something real from nothing. Teaches other people that their worth is not negotiable.
Gemini|||Got told they were too much, too loud, too weird. Started editing themselves before they finished the thought.|||Translates the hard thing into language anyone can sit with. People trust them with the truth.
Cancer|||Felt unwelcome in their own home. Learned to manage everyone else's mood before their own.|||Creates rooms where nobody has to translate themselves. People stay because it feels like theirs.
Leo|||Creative light got dimmed or shamed. Learned that being seen is dangerous.|||Radiates without trying. Gives other people permission to stop hiding.
Virgo|||Never feels finished or good enough. Rewrites the email twelve times. Posts nothing.|||Notices what other people miss. Fixes things quietly. Makes everything they touch work better.
Libra|||Loses themselves in other people. Says yes when they mean no. Keeps the peace at their own cost.|||Models what balanced love actually looks like. Shows people you can choose yourself and still stay connected.
Scorpio|||Got burned by trust. Decided vulnerability is a trap. Now they test people before they let them in.|||Transforms pain into power. Walks other people through the dark because they already know the way.
Sagittarius|||Had their faith or truth dismissed. Stopped saying what they actually believe out loud.|||Says the thing everyone is thinking. Gives people permission to want more from their life.
Capricorn|||Never feels successful enough. Moves the goalpost every time they get close.|||Builds structures that last. Leads without apologizing for being in charge.
Aquarius|||Felt like a perpetual outsider. Stopped trying to fit in and started performing difference instead.|||Changes communities by being unapologetically themselves. Gives other people permission to be weird.
Pisces|||Absorbs everyone's pain. Forgets where they end and other people begin.|||Sits with what everyone else avoids. The person people bring the thing they cannot say out loud.`;

const CHIRON_BY_HOUSE_TABLE = `1st House|||Feels their existence is not acknowledged. Learned to disappear before anyone could tell them to.|||Shows up fully. Gives other people permission to stop apologizing for existing.
2nd House|||Never feels like enough. Ties their worth to what they produce or what they own.|||Builds real value. Teaches people their worth is not something they earn.
3rd House|||Voice was dismissed early. Learned that saying the wrong thing costs more than staying quiet.|||Says the thing nobody else will say. Teaches people to stop editing themselves.
4th House|||Felt like a stranger in their own home. Learned to make themselves small so they would not be a burden.|||Creates home wherever they go. Helps other people heal the thing they inherited.
5th House|||Play was shamed or stifled. Learned that joy is something you earn, not something you get.|||Creates fearlessly. Shows people that joy is not something you have to deserve.
6th House|||Worth tied to productivity. Feels guilty for resting. Burns out and calls it discipline.|||Serves from wholeness, not depletion. Models what healthy work actually looks like.
7th House|||Loses themselves in other people. Stays in the relationship past the point of self-abandonment.|||Shows people what real partnership looks like. Chooses themselves and stays connected.
8th House|||Fear of vulnerability and shared power. Keeps control because letting go felt like dying.|||Transforms. Walks people through their own depths because they already survived theirs.
9th House|||Beliefs were dismissed. Stopped sharing what they actually think about meaning and truth.|||Teaches by example. Gives people permission to trust their own path.
10th House|||Fear of exposure. Hides from recognition because being seen felt like being targeted.|||Leads on their own terms. Redefines success so it stops costing them their identity.
11th House|||Felt like an outsider in groups. Stopped trying to belong and started performing instead.|||Builds communities where people do not have to perform. Celebrates the weird ones.
12th House|||Carries pain that is not entirely theirs. Absorbs the room. Forgets where they end.|||Sits with what others cannot. Guides people through the dark because they live there too.`;

// ---------------------------------------------------------------------------
// MASTER BUILD — orchestrate all 26 pages
// ---------------------------------------------------------------------------
async function buildPdf(
  data: {
    name: string;
    email: string;
    chironSign: string;
    chironHouse: string;
    chironDegree: string;
    shadowId: string;
    report: string;
  }
): Promise<{ doc: Doc; pageCount: number }> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const fonts = await loadFonts(doc);
  console.log("Fonts loaded:", JSON.stringify(fonts));

  const sections = parseStructuredReport(data.report);
  console.log("Parsed sections:", Array.from(sections.keys()).join(", "));

  const woundName = sections.get("WOUND_NAME") || "Your Wound";

  // -----------------------------------------------------------------------
  // PAGE 1 — COVER
  // -----------------------------------------------------------------------
  buildCoverPage(
    doc,
    {
      name: data.name,
      chironSign: data.chironSign,
      chironHouse: data.chironHouse,
      woundName,
    },
    fonts
  );

  // -----------------------------------------------------------------------
  // PAGE 2 — OVERVIEW (dark)
  // -----------------------------------------------------------------------
  addDarkPage(doc);
  buildOverviewPage(doc, sections, data.chironSign, data.chironHouse, fonts);

  // -----------------------------------------------------------------------
  // PAGE 3 — SECTION 1 DIVIDER: "THE WOUND"
  // -----------------------------------------------------------------------
  addDarkPage(doc);
  buildSectionDivider(
    doc,
    "1",
    sections.get("SECTION_1_DIVIDER_LABEL") || "THE WOUND",
    "THE WOUND",
    sections.get("SECTION_1_DIVIDER_DESCRIPTION") || "",
    fonts
  );

  // -----------------------------------------------------------------------
  // SECTION 1 content (1A, 1B, 1C) — flowing on cream pages
  // -----------------------------------------------------------------------
  addCreamPage(doc);
  let sectionStartPage = doc.getNumberOfPages();
  let y = 40;
  y = drawContentBlock(doc, sections, "SECTION_1A", fonts, y, false);
  y = drawContentBlock(doc, sections, "SECTION_1B", fonts, y, true);
  y = drawContentBlock(doc, sections, "SECTION_1C", fonts, y, true);
  addFootersToRange(doc, sectionStartPage, doc.getNumberOfPages(), fonts);

  // -----------------------------------------------------------------------
  // SECTION 2 DIVIDER: "WHERE IT SHOWS UP"
  // -----------------------------------------------------------------------
  addDarkPage(doc);
  buildSectionDivider(
    doc,
    "2",
    sections.get("SECTION_2_DIVIDER_LABEL") || "THE FINGERPRINTS",
    "WHERE IT SHOWS UP",
    sections.get("SECTION_2_DIVIDER_DESCRIPTION") || "",
    fonts
  );

  // -----------------------------------------------------------------------
  // SECTION 2 content (2A through 2F) — flowing on cream pages
  // -----------------------------------------------------------------------
  addCreamPage(doc);
  sectionStartPage = doc.getNumberOfPages();
  y = 40;
  const section2Subs = ["2A", "2B", "2C", "2D", "2E", "2F"];
  for (let i = 0; i < section2Subs.length; i++) {
    y = drawContentBlock(doc, sections, `SECTION_${section2Subs[i]}`, fonts, y, i > 0);
  }
  addFootersToRange(doc, sectionStartPage, doc.getNumberOfPages(), fonts);

  // -----------------------------------------------------------------------
  // SECTION 3 DIVIDER: "THE OTHER SIDE OF THE COIN"
  // -----------------------------------------------------------------------
  addDarkPage(doc);
  buildSectionDivider(
    doc,
    "3",
    sections.get("SECTION_3_DIVIDER_LABEL") || "THE OTHER SIDE OF THE COIN",
    "THE OTHER SIDE OF THE COIN",
    sections.get("SECTION_3_DIVIDER_DESCRIPTION") || "",
    fonts
  );

  // -----------------------------------------------------------------------
  // SECTION 3 content (3A, 3B, 3C) — flowing on cream pages
  // -----------------------------------------------------------------------
  addCreamPage(doc);
  sectionStartPage = doc.getNumberOfPages();
  y = 40;
  const section3Subs = ["3A", "3B", "3C"];
  for (let i = 0; i < section3Subs.length; i++) {
    y = drawContentBlock(doc, sections, `SECTION_${section3Subs[i]}`, fonts, y, i > 0);
  }
  addFootersToRange(doc, sectionStartPage, doc.getNumberOfPages(), fonts);

  // -----------------------------------------------------------------------
  // SECTION 4 DIVIDER: "INTEGRATION"
  // -----------------------------------------------------------------------
  addDarkPage(doc);
  buildSectionDivider(
    doc,
    "4",
    sections.get("SECTION_4_DIVIDER_LABEL") || "INTEGRATION",
    "INTEGRATION",
    sections.get("SECTION_4_DIVIDER_DESCRIPTION") || "",
    fonts
  );

  // -----------------------------------------------------------------------
  // SECTION 4 content (4A, 4B, 4C) — flowing on cream pages
  // -----------------------------------------------------------------------
  addCreamPage(doc);
  sectionStartPage = doc.getNumberOfPages();
  y = 40;
  y = drawContentBlock(doc, sections, "SECTION_4A", fonts, y, false);
  y = drawJournalBlock(doc, sections, "SECTION_4B", fonts, y);
  y = drawJournalBlock(doc, sections, "SECTION_4C", fonts, y);
  addFootersToRange(doc, sectionStartPage, doc.getNumberOfPages(), fonts);

  // -----------------------------------------------------------------------
  // SECTION 5 DIVIDER: "CHIRON CHEAT SHEETS"
  // -----------------------------------------------------------------------
  addDarkPage(doc);
  buildSectionDivider(
    doc,
    "5",
    sections.get("SECTION_5_DIVIDER_LABEL") || "CHIRON CHEAT SHEETS",
    "CHIRON CHEAT SHEETS",
    sections.get("SECTION_5_DIVIDER_DESCRIPTION") || "",
    fonts
  );

  // -----------------------------------------------------------------------
  // SECTION 5 content (5A, 5B, 5C, 5D) — flowing on cream pages
  // -----------------------------------------------------------------------
  addCreamPage(doc);
  sectionStartPage = doc.getNumberOfPages();
  y = 40;

  // 5A: Chiron by Sign table
  {
    const tableText = sections.get("SECTION_5A_BODY") || sections.get("SECTION_5A_GRID") || CHIRON_BY_SIGN_TABLE;
    y = drawTableBlock(
      doc,
      sections.get("SECTION_5A_TITLE") || "CHIRON BY SIGN",
      sections.get("SECTION_5A_SUBTITLE") || "Quick reference for reading others",
      tableText,
      ["SIGN", "WOUND", "GIFT"],
      fonts,
      y,
      [CONTENT_W * 0.18, CONTENT_W * 0.41, CONTENT_W * 0.41]
    );
  }

  // 5B: Chiron by House table
  {
    const tableText = sections.get("SECTION_5B_BODY") || sections.get("SECTION_5B_GRID") || CHIRON_BY_HOUSE_TABLE;
    y = drawTableBlock(
      doc,
      sections.get("SECTION_5B_TITLE") || "CHIRON BY HOUSE",
      sections.get("SECTION_5B_SUBTITLE") || "Where the wound lives in the chart",
      tableText,
      ["HOUSE", "WOUND", "GIFT"],
      fonts,
      y,
      [CONTENT_W * 0.18, CONTENT_W * 0.41, CONTENT_W * 0.41]
    );
  }

  // 5C: How to Love Someone
  y = drawHowToLoveBlock(doc, sections, fonts, y);

  // 5D: Closing
  addCreamPageWithFooter(doc, fonts);
  y = 35;
  y = drawClosingBlock(doc, sections, fonts, y);

  addFootersToRange(doc, sectionStartPage, doc.getNumberOfPages(), fonts);

  const pageCount = doc.getNumberOfPages();
  console.log(`PDF built with ${pageCount} pages`);

  return { doc, pageCount };
}

// ---------------------------------------------------------------------------
// Deno.serve() handler
// ---------------------------------------------------------------------------
// Internal only: called by the Stripe webhook after a confirmed payment using
// the service role key.
function isInternalCaller(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) return false;
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (token.length !== serviceKey.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ serviceKey.charCodeAt(i);
  }
  return diff === 0;
}

function normalizePdfText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\u2014/g, " - ") : "";
}

async function isAdminPasscode(passcode: unknown): Promise<boolean> {
  if (typeof passcode !== "string" || passcode.length === 0) return false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return false;

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/admin_passcode_ok`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ p_passcode: passcode }),
  });

  if (!response.ok) return false;
  return (await response.json()) === true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const authorized =
      isInternalCaller(req) || (await isAdminPasscode(body.passcode));

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      name,
      email,
      chironSign,
      chironHouse,
      chironDegree,
      shadowId,
      report,
    } = body;

    if (!report || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name and report" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pdfName = normalizePdfText(name || "Friend");
    const pdfEmail = normalizePdfText(email || "");
    const pdfChironSign = normalizePdfText(chironSign || "Unknown");
    const pdfChironHouse = normalizePdfText(chironHouse || "Unknown");
    const pdfChironDegree = normalizePdfText(chironDegree || "");
    const pdfShadowId = normalizePdfText(shadowId || "report");
    const pdfReport = normalizePdfText(report);

    console.log(
      `Generating PDF for: ${pdfName}, report length: ${pdfReport.length}`
    );

    const { doc, pageCount } = await buildPdf({
      name: pdfName,
      email: pdfEmail,
      chironSign: pdfChironSign,
      chironHouse: pdfChironHouse,
      chironDegree: pdfChironDegree,
      shadowId: pdfShadowId,
      report: pdfReport,
    });

    // Generate PDF binary
    const pdfOutput = doc.output("arraybuffer");
    const pdfBytes = new Uint8Array(pdfOutput);
    let pdfBinary = "";
    for (let i = 0; i < pdfBytes.length; i++) {
      pdfBinary += String.fromCharCode(pdfBytes[i]);
    }
    const pdfBase64 = btoa(pdfBinary);

    // Upload to Supabase storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const filename = `shadow-map-${shadowId || "report"}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("shadow-reports")
      .upload(filename, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
    }

    // The bucket is private: hand out a time limited signed link instead of a
    // public URL so the report is not readable by anyone who finds the path.
    let downloadUrl = "";
    const { data: signed, error: signError } = await supabase.storage
      .from("shadow-reports")
      .createSignedUrl(filename, 60 * 60 * 24 * 365);

    if (signError) {
      console.error("Could not create signed URL:", signError);
    } else {
      downloadUrl = signed?.signedUrl ?? "";
    }

    console.log("PDF uploaded:", filename);

    return new Response(
      JSON.stringify({
        pdfBase64,
        publicUrl: downloadUrl,
        pages: pageCount,
        filename,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
