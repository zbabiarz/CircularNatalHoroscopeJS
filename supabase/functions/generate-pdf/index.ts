import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Design system colors
const CHARCOAL = { r: 30, g: 34, b: 32 }; // #1E2220
const CREAM = { r: 246, g: 241, b: 235 }; // #F6F1EB
const LIME = { r: 195, g: 205, b: 66 }; // #C3CD42
const SOFT_PINK = { r: 244, g: 228, b: 232 }; // #F4E4E8
const SOFT_LIME = { r: 238, g: 241, b: 214 }; // #EEF1D6
const SOFT_STONE = { r: 236, g: 233, b: 227 }; // #ECE9E3
const PINK_LINE = { r: 233, g: 185, b: 196 }; // #E9B9C4
const WHITE = { r: 255, g: 255, b: 255 };

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface Color {
  r: number;
  g: number;
  b: number;
}

interface ReportSections {
  woundName: string;
  sections: { title: string; body: string }[];
}

const SECTION_LABELS = [
  "THE WOUND",
  "WHERE IT SHOWS UP",
  "THE POWER",
  "PUT IT TO WORK",
  "READ THE PEOPLE YOU LOVE",
];

const BOX_COLORS: Color[] = [
  SOFT_PINK,
  SOFT_LIME,
  SOFT_STONE,
  SOFT_PINK,
  SOFT_LIME,
];

function parseReport(report: string): ReportSections {
  let woundName = "Your Shadow Map";
  const woundMatch = report.match(
    /===WOUND_NAME===\s*\n([\s\S]*?)(?=\n===SECTION_)/
  );
  if (woundMatch) {
    woundName = woundMatch[1].trim().replace(/^["']|["']$/g, "");
  }

  const sections: { title: string; body: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const pattern = new RegExp(
      `===SECTION_${i}:[^=]*===\\s*\\n([^\\n]+)\\n([\\s\\S]*?)(?=\\n===SECTION_${i + 1}:|$)`
    );
    const match = report.match(pattern);
    if (match) {
      sections.push({
        title: match[1].trim().replace(/^\[|\]$/g, ""),
        body: match[2].trim().replace(/^\[|\]$/g, ""),
      });
    }
  }

  if (sections.length === 0) {
    const paragraphs = report.split(/\n\n+/).filter((p) => p.trim());
    const chunkSize = Math.ceil(paragraphs.length / 5);
    for (let i = 0; i < 5; i++) {
      const chunk = paragraphs
        .slice(i * chunkSize, (i + 1) * chunkSize)
        .join("\n\n");
      sections.push({
        title: SECTION_LABELS[i],
        body: chunk || "",
      });
    }
  }

  return { woundName, sections };
}

async function fetchFont(url: string): Promise<string> {
  const resp = await fetch(url);
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadFonts(
  doc: InstanceType<typeof jsPDF>
): Promise<{
  hasMontserrat: boolean;
  hasPlayfair: boolean;
}> {
  let hasMontserrat = false;
  let hasPlayfair = false;

  try {
    const montBoldUrl =
      "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Hw5aXo.ttf";
    const montRegUrl =
      "https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.ttf";
    const playfairUrl =
      "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2rA0s.ttf";

    const [montBoldB64, montRegB64, playfairB64] = await Promise.all([
      fetchFont(montBoldUrl),
      fetchFont(montRegUrl),
      fetchFont(playfairUrl),
    ]);

    doc.addFileToVFS("Montserrat-Bold.ttf", montBoldB64);
    doc.addFont("Montserrat-Bold.ttf", "Montserrat", "bold");

    doc.addFileToVFS("Montserrat-Regular.ttf", montRegB64);
    doc.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");

    hasMontserrat = true;

    doc.addFileToVFS("PlayfairDisplay-Italic.ttf", playfairB64);
    doc.addFont("PlayfairDisplay-Italic.ttf", "Playfair", "italic");

    hasPlayfair = true;
  } catch (e) {
    console.error("Font loading failed, using fallback fonts:", e);
  }

  return { hasMontserrat, hasPlayfair };
}

function setColor(doc: InstanceType<typeof jsPDF>, c: Color) {
  doc.setTextColor(c.r, c.g, c.b);
}

function fillRect(
  doc: InstanceType<typeof jsPDF>,
  x: number,
  y: number,
  w: number,
  h: number,
  c: Color
) {
  doc.setFillColor(c.r, c.g, c.b);
  doc.rect(x, y, w, h, "F");
}

function addFooter(
  doc: InstanceType<typeof jsPDF>,
  pageNum: number,
  isDark: boolean,
  fonts: { hasMontserrat: boolean }
) {
  const y = PAGE_H - 12;
  const textColor = isDark
    ? { r: 150, g: 150, b: 150 }
    : { r: 120, g: 120, b: 120 };
  setColor(doc, textColor);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "\u00A9 Love, Light, and Black Holes | Morgan Garza",
    MARGIN,
    y
  );
  doc.text(String(pageNum), PAGE_W - MARGIN, y, { align: "right" });
}

function drawPinkAccentLine(
  doc: InstanceType<typeof jsPDF>,
  x: number,
  y: number,
  w: number
) {
  doc.setDrawColor(PINK_LINE.r, PINK_LINE.g, PINK_LINE.b);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + w, y);
}

function buildCoverPage(
  doc: InstanceType<typeof jsPDF>,
  name: string,
  woundName: string,
  chironSign: string,
  chironHouse: string | undefined,
  fonts: { hasMontserrat: boolean; hasPlayfair: boolean }
) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CHARCOAL);

  // Lime accent bar at top
  fillRect(doc, 0, 0, PAGE_W, 4, LIME);

  // Title block
  setColor(doc, LIME);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "bold");
  doc.setFontSize(14);
  doc.text("YOUR", PAGE_W / 2, 80, { align: "center" });
  doc.setFontSize(42);
  doc.text("SHADOW MAP", PAGE_W / 2, 100, { align: "center" });

  // Thin lime line under title
  const lineY = 108;
  doc.setDrawColor(LIME.r, LIME.g, LIME.b);
  doc.setLineWidth(0.6);
  doc.line(60, lineY, PAGE_W - 60, lineY);

  // Wound name in Playfair italic
  setColor(doc, WHITE);
  doc.setFont(fonts.hasPlayfair ? "Playfair" : "times", "italic");
  doc.setFontSize(18);
  const wrappedWound = doc.splitTextToSize(`"${woundName}"`, 140);
  doc.text(wrappedWound, PAGE_W / 2, 125, { align: "center" });

  // Person's name
  setColor(doc, CREAM);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "normal");
  doc.setFontSize(13);
  doc.text(`Prepared for ${name}`, PAGE_W / 2, 155, { align: "center" });

  // Chiron placement
  setColor(doc, { r: 180, g: 180, b: 180 });
  doc.setFontSize(10);
  const hasHouse = chironHouse && chironHouse !== "Unknown";
  const placementText = hasHouse
    ? `Chiron in ${chironSign} \u2022 ${chironHouse}`
    : `Chiron in ${chironSign}`;
  doc.text(placementText, PAGE_W / 2, 168, { align: "center" });

  // Bottom branding
  setColor(doc, { r: 130, g: 130, b: 130 });
  doc.setFontSize(8);
  doc.text(
    "Love, Light, and Black Holes \u2022 Morgan Garza",
    PAGE_W / 2,
    PAGE_H - 30,
    { align: "center" }
  );

  // Lime accent bar at bottom
  fillRect(doc, 0, PAGE_H - 4, PAGE_W, 4, LIME);
}

function buildIntroPage(
  doc: InstanceType<typeof jsPDF>,
  name: string,
  fonts: { hasMontserrat: boolean; hasPlayfair: boolean }
) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CREAM);

  let y = 40;

  // Section label
  setColor(doc, LIME);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "bold");
  doc.setFontSize(9);
  doc.text("BEFORE WE BEGIN", MARGIN, y);
  y += 8;

  drawPinkAccentLine(doc, MARGIN, y, CONTENT_W);
  y += 14;

  // Headline
  setColor(doc, CHARCOAL);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`${name}, here's what you're holding.`, MARGIN, y);
  y += 16;

  // Body text
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "normal");
  doc.setFontSize(10.5);
  setColor(doc, { r: 60, g: 60, b: 60 });
  const lineHeight = 5.6;

  const introText = [
    "This isn't a horoscope. It's not a personality quiz result. What you're about to read is a map of the wound you've been carrying \u2014 probably since before you had words for it \u2014 and the power that lives inside it.",
    "Your Chiron placement is the place in your chart where you got hurt early, adapted brilliantly, and then spent years wondering why the adaptation stopped working. It's the thing people close to you have maybe tried to point out, and you've maybe tried not to hear.",
    "This report will name it. Specifically. Not in vague astrology-speak, but in the kind of detail that might make you uncomfortable \u2014 because it's that accurate.",
    "Here's how to read this:",
    "THE WOUND tells you what happened. Not the story you tell at dinner parties, but the real one. The one that shaped how you move through the world.",
    "WHERE IT SHOWS UP maps the patterns \u2014 in your relationships, your work, your inner dialogue. This is the section where most people go quiet for a minute.",
    "THE POWER is the turn. Because the thing about Chiron is this: your deepest wound created your greatest gift. The sensitivity you developed, the skills you built to survive \u2014 those aren't baggage. They're your edge.",
    "PUT IT TO WORK gets practical. This is where the wound stops running your life and starts funding it.",
    "READ THE PEOPLE YOU LOVE helps you see these patterns in the people around you, because once you understand your own Chiron, you'll start recognizing everyone else's.",
    "Take your time with this. Read it once fast, then read it again slow. The second read is where it lands.",
  ];

  for (const para of introText) {
    const lines = doc.splitTextToSize(para, CONTENT_W);
    for (const line of lines) {
      if (y > PAGE_H - 25) {
        doc.addPage();
        fillRect(doc, 0, 0, PAGE_W, PAGE_H, CREAM);
        addFooter(doc, doc.getNumberOfPages(), false, fonts);
        y = 30;
      }
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
    y += 4;
  }

  addFooter(doc, doc.getNumberOfPages(), false, fonts);
}

function buildSectionDivider(
  doc: InstanceType<typeof jsPDF>,
  sectionNum: number,
  label: string,
  title: string,
  fonts: { hasMontserrat: boolean; hasPlayfair: boolean }
) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CHARCOAL);

  // Lime accent bar
  fillRect(doc, MARGIN, 100, 40, 3, LIME);

  // Section number + label
  setColor(doc, LIME);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`SECTION ${sectionNum}`, MARGIN, 120);

  // Section label
  setColor(doc, WHITE);
  doc.setFontSize(28);
  doc.text(label, MARGIN, 140);

  // Section title in Playfair italic
  setColor(doc, CREAM);
  doc.setFont(fonts.hasPlayfair ? "Playfair" : "times", "italic");
  doc.setFontSize(15);
  const wrappedTitle = doc.splitTextToSize(title, CONTENT_W);
  doc.text(wrappedTitle, MARGIN, 160);

  addFooter(doc, doc.getNumberOfPages(), true, fonts);
}

function buildSectionContent(
  doc: InstanceType<typeof jsPDF>,
  body: string,
  boxColor: Color,
  sectionNum: number,
  fonts: { hasMontserrat: boolean; hasPlayfair: boolean }
): number {
  doc.addPage();
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CREAM);

  let y = 30;
  let pageCount = doc.getNumberOfPages();
  const lineHeight = 5.8;
  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim());

  // Light colored box for the first paragraph (pull-quote feel)
  if (paragraphs.length > 0) {
    const firstPara = paragraphs[0];
    doc.setFont(fonts.hasPlayfair ? "Playfair" : "times", "italic");
    doc.setFontSize(11.5);
    const quoteLines = doc.splitTextToSize(firstPara, CONTENT_W - 24);
    const boxH = quoteLines.length * 6.2 + 20;

    fillRect(doc, MARGIN, y, CONTENT_W, boxH, boxColor);
    drawPinkAccentLine(doc, MARGIN, y, CONTENT_W);

    setColor(doc, CHARCOAL);
    let qy = y + 14;
    for (const line of quoteLines) {
      doc.text(line, MARGIN + 12, qy);
      qy += 6.2;
    }
    y += boxH + 10;
  }

  // Remaining paragraphs
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "normal");
  doc.setFontSize(10.5);
  setColor(doc, { r: 50, g: 50, b: 50 });

  for (let i = 1; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    const lines = doc.splitTextToSize(para, CONTENT_W);
    for (const line of lines) {
      if (y > PAGE_H - 25) {
        addFooter(doc, pageCount, false, fonts);
        doc.addPage();
        pageCount = doc.getNumberOfPages();
        fillRect(doc, 0, 0, PAGE_W, PAGE_H, CREAM);
        y = 30;
      }
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
    y += 5;
  }

  addFooter(doc, pageCount, false, fonts);
  return pageCount;
}

function buildClosingPage(
  doc: InstanceType<typeof jsPDF>,
  name: string,
  fonts: { hasMontserrat: boolean; hasPlayfair: boolean }
) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, CHARCOAL);

  fillRect(doc, 0, 0, PAGE_W, 4, LIME);

  let y = 100;

  setColor(doc, LIME);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "bold");
  doc.setFontSize(10);
  doc.text("THIS IS YOUR MAP", PAGE_W / 2, y, { align: "center" });
  y += 16;

  setColor(doc, WHITE);
  doc.setFont(fonts.hasPlayfair ? "Playfair" : "times", "italic");
  doc.setFontSize(16);
  const closingLines = doc.splitTextToSize(
    `${name}, the wound was never the problem. The problem was not knowing it was there. Now you do. Now it works for you.`,
    140
  );
  doc.text(closingLines, PAGE_W / 2, y, { align: "center" });
  y += closingLines.length * 8 + 20;

  setColor(doc, CREAM);
  doc.setFont(fonts.hasMontserrat ? "Montserrat" : "helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Want to go deeper?", PAGE_W / 2, y, { align: "center" });
  y += 8;
  setColor(doc, LIME);
  doc.text("lovelightandblackholes.com", PAGE_W / 2, y, { align: "center" });

  // Bottom branding
  setColor(doc, { r: 130, g: 130, b: 130 });
  doc.setFontSize(8);
  doc.text(
    "\u00A9 Love, Light, and Black Holes | Morgan Garza",
    PAGE_W / 2,
    PAGE_H - 30,
    { align: "center" }
  );

  fillRect(doc, 0, PAGE_H - 4, PAGE_W, 4, LIME);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      name,
      email,
      chironSign,
      chironHouse,
      chironDegree,
      shadowId,
      report,
    } = await req.json();

    if (!report || !name) {
      throw new Error("Missing required fields: name and report");
    }

    console.log("Generating PDF for:", name, "report length:", report.length);

    const { woundName, sections } = parseReport(report);
    console.log(
      "Parsed wound:",
      woundName,
      "sections:",
      sections.length
    );

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const fonts = await loadFonts(doc);
    console.log("Fonts loaded:", fonts);

    // Page 1: Cover
    buildCoverPage(doc, name, woundName, chironSign, chironHouse, fonts);

    // Page 2-3: Intro
    doc.addPage();
    buildIntroPage(doc, name, fonts);

    // Sections 1-5: divider + content pages
    for (let i = 0; i < sections.length && i < 5; i++) {
      doc.addPage();
      buildSectionDivider(
        doc,
        i + 1,
        SECTION_LABELS[i] || `SECTION ${i + 1}`,
        sections[i].title,
        fonts
      );
      buildSectionContent(doc, sections[i].body, BOX_COLORS[i], i + 1, fonts);
    }

    // Closing page
    doc.addPage();
    buildClosingPage(doc, name, fonts);

    const totalPages = doc.getNumberOfPages();
    console.log("PDF generated with", totalPages, "pages");

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

    const {
      data: { publicUrl },
    } = supabase.storage.from("shadow-reports").getPublicUrl(filename);

    console.log("PDF uploaded:", publicUrl);

    return new Response(
      JSON.stringify({
        pdfBase64,
        publicUrl,
        pages: totalPages,
        filename,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PDF generation error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
