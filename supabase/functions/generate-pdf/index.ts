import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  name: string;
  chironSign: string;
  chironHouse?: string;
  chironDegree: number;
  archetype: string;
  report: string;
}

interface ReportSection {
  title: string;
  content: string[];
}

const BEIGE_BG = [249, 242, 235];
const DARK_TEXT = [31, 31, 31];
const TEAL_BUTTON = [72, 133, 122];
const WHITE = [255, 255, 255];

function parseMarkdownReport(markdown: string): {
  archetype: string;
  theme: string;
  chironStory: string[];
  coreWound: string[];
  howItFeels: string[];
  shadowPatterns: string[];
  yourMedicine: string[];
  yourInvitation: string[];
  reflectionPrompts: string[];
} {
  const lines = markdown.split('\n').map(l => l.trim()).filter(l => l);

  const result = {
    archetype: '',
    theme: '',
    chironStory: [] as string[],
    coreWound: [] as string[],
    howItFeels: [] as string[],
    shadowPatterns: [] as string[],
    yourMedicine: [] as string[],
    yourInvitation: [] as string[],
    reflectionPrompts: [] as string[]
  };

  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('**Archetype:**')) {
      result.archetype = line.replace('**Archetype:**', '').trim();
      continue;
    }

    if (line.startsWith('**Theme:**')) {
      result.theme = line.replace('**Theme:**', '').trim();
      continue;
    }

    if (line === "**Chiron's Story**" || line === "**Chiron's Story:**") {
      currentSection = 'chironStory';
      continue;
    }

    if (line === '**Core Wound**' || line === '**Core Wound:**') {
      currentSection = 'coreWound';
      continue;
    }

    if (line === '**How It Feels**' || line === '**How It Feels:**') {
      currentSection = 'howItFeels';
      continue;
    }

    if (line === '**Shadow Patterns**' || line === '**Shadow Patterns:**') {
      currentSection = 'shadowPatterns';
      continue;
    }

    if (line === '**Your Medicine**' || line === '**Your Medicine:**') {
      currentSection = 'yourMedicine';
      continue;
    }

    if (line === '**Your Invitation**' || line === '**Your Invitation:**') {
      currentSection = 'yourInvitation';
      continue;
    }

    if (line.includes('Journal') || line.includes('Reflection Prompts')) {
      currentSection = 'reflectionPrompts';
      continue;
    }

    if (currentSection && line) {
      result[currentSection as keyof typeof result].push(line);
    }
  }

  return result;
}

function wrapText(doc: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = doc.getTextWidth(testLine);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}

async function loadCustomFonts(doc: jsPDF): Promise<{ hasSerif: boolean; hasSans: boolean }> {
  try {
    const cinzelUrl = "https://fonts.gstatic.com/s/cinzel/v23/8vIU7w042Wp87g4G0UTUEE5eK_w.ttf";
    const response = await fetch(cinzelUrl);
    if (!response.ok) return { hasSerif: false, hasSans: false };

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const fontBase64 = btoa(binary);

    doc.addFileToVFS("Cinzel-Regular.ttf", fontBase64);
    doc.addFont("Cinzel-Regular.ttf", "Cinzel", "normal");

    return { hasSerif: true, hasSans: false };
  } catch (error) {
    console.error("Error loading fonts:", error);
    return { hasSerif: false, hasSans: false };
  }
}

function drawSparkleIcon(doc: jsPDF, x: number, y: number, size: number = 4) {
  doc.setDrawColor(31, 31, 31);
  doc.setLineWidth(0.5);

  doc.line(x, y - size, x, y + size);
  doc.line(x - size, y, x + size, y);

  const smallSize = size * 0.5;
  doc.line(x - smallSize * 0.7, y - smallSize * 0.7, x + smallSize * 0.7, y + smallSize * 0.7);
  doc.line(x - smallSize * 0.7, y + smallSize * 0.7, x + smallSize * 0.7, y - smallSize * 0.7);
}

function addContentPage(
  doc: jsPDF,
  title: string,
  content: string[],
  fonts: { hasSerif: boolean; hasSans: boolean },
  pageWidth: number,
  pageHeight: number,
  margin: number
): number {
  doc.addPage();
  doc.setFillColor(...BEIGE_BG);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  let yPos = margin + 5;

  drawSparkleIcon(doc, pageWidth / 2, yPos, 3);
  yPos += 10;

  doc.setFontSize(32);
  doc.setTextColor(...DARK_TEXT);
  if (fonts.hasSerif) {
    doc.setFont('Cinzel', 'normal');
  } else {
    doc.setFont('helvetica', 'bold');
  }

  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, yPos);
  yPos += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);

  const maxWidth = pageWidth - (margin * 2);

  for (const paragraph of content) {
    if (!paragraph || paragraph === title) continue;

    if (paragraph.startsWith('This placement often comes with:') ||
        paragraph.startsWith('When unhealed,') ||
        paragraph.startsWith('When integrated,')) {

      if (yPos > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(...BEIGE_BG);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin;
      }

      const wrappedIntro = wrapText(doc, paragraph, maxWidth);
      for (const line of wrappedIntro) {
        doc.text(line, margin, yPos);
        yPos += 6;
      }
      yPos += 3;
      continue;
    }

    if (paragraph.startsWith('- ') || paragraph.startsWith('•')) {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        doc.setFillColor(...BEIGE_BG);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin;
      }

      const bulletText = paragraph.replace(/^[-•]\s*/, '');
      const wrappedBullet = wrapText(doc, bulletText, maxWidth - 8);

      for (let i = 0; i < wrappedBullet.length; i++) {
        if (i === 0) {
          doc.text('•', margin + 2, yPos);
          doc.text(wrappedBullet[i], margin + 8, yPos);
        } else {
          doc.text(wrappedBullet[i], margin + 8, yPos);
        }
        yPos += 6;
      }
      yPos += 2;
    } else {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        doc.setFillColor(...BEIGE_BG);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = margin;
      }

      const wrappedParagraph = wrapText(doc, paragraph, maxWidth);
      for (const line of wrappedParagraph) {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          doc.setFillColor(...BEIGE_BG);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 6;
      }
      yPos += 5;
    }
  }

  return yPos;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const { name, chironSign, chironHouse, chironDegree, archetype, report }: RequestBody = await req.json();

    const cosmicBgUrl = "https://images.pexels.com/photos/956999/milky-way-starry-sky-night-sky-star-956999.jpeg";

    const [cosmicBgBase64, fonts] = await Promise.all([
      fetchImageAsBase64(cosmicBgUrl),
      (async () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        return await loadCustomFonts(doc);
      })()
    ]);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    await loadCustomFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    if (cosmicBgBase64) {
      doc.addImage(`data:image/jpeg;base64,${cosmicBgBase64}`, 'JPEG', 0, 0, pageWidth, pageHeight);

      doc.setFillColor(0, 0, 0);
      doc.setGState(new doc.GState({ opacity: 0.5 }));
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    } else {
      doc.setFillColor(20, 20, 30);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    let yPos = 40;

    const discoBallSize = 20;
    doc.setFillColor(200, 200, 220);
    doc.circle(pageWidth / 2, yPos, discoBallSize / 2, 'F');
    doc.setFillColor(255, 255, 255);
    doc.setGState(new doc.GState({ opacity: 0.3 }));
    doc.circle(pageWidth / 2 - 3, yPos - 3, 6, 'F');
    doc.setGState(new doc.GState({ opacity: 1.0 }));

    yPos += discoBallSize + 15;

    doc.setFontSize(48);
    doc.setTextColor(...WHITE);
    if (fonts.hasSerif) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }

    const titleLine1 = "YOUR SHADOW";
    const titleLine2 = "MEDICINE";
    const title1Width = doc.getTextWidth(titleLine1);
    const title2Width = doc.getTextWidth(titleLine2);

    doc.text(titleLine1, (pageWidth - title1Width) / 2, yPos);
    yPos += 18;
    doc.text(titleLine2, (pageWidth - title2Width) / 2, yPos);
    yPos += 15;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    const subtitle = `Chiron Report by Morgan Garza`;
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, yPos);
    yPos += 35;

    doc.setFillColor(...BEIGE_BG);
    doc.setGState(new doc.GState({ opacity: 0.95 }));
    const boxPadding = 15;
    const boxWidth = pageWidth - (margin * 2);
    const boxHeight = 70;
    doc.roundedRect(margin, yPos - 10, boxWidth, boxHeight, 3, 3, 'F');
    doc.setGState(new doc.GState({ opacity: 1.0 }));

    doc.setFontSize(36);
    doc.setTextColor(...DARK_TEXT);
    if (fonts.hasSerif) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }

    const placementTitle = `Chiron in ${chironSign}`;
    const placementTitleWidth = doc.getTextWidth(placementTitle);
    doc.text(placementTitle, (pageWidth - placementTitleWidth) / 2, yPos);
    yPos += 12;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    const houseText = chironHouse ? `${chironHouse}` : '';
    if (houseText) {
      const houseWidth = doc.getTextWidth(houseText);
      doc.text(houseText, (pageWidth - houseWidth) / 2, yPos);
      yPos += 10;
    }

    const parsed = parseMarkdownReport(report);

    doc.setFontSize(16);
    const archetypeTitle = parsed.archetype || archetype;
    const archetypeDisplay = archetypeTitle.startsWith('The ') ? archetypeTitle : `The ${archetypeTitle}`;
    const archetypeTitleWidth = doc.getTextWidth(archetypeDisplay);
    doc.text(archetypeDisplay, (pageWidth - archetypeTitleWidth) / 2, yPos);
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK_TEXT);
    const storyText = parsed.chironStory.join(' ');
    const storyLines = wrapText(doc, storyText, boxWidth - (boxPadding * 2));
    const maxStoryLines = 5;
    for (let i = 0; i < Math.min(storyLines.length, maxStoryLines); i++) {
      doc.text(storyLines[i], margin + boxPadding, yPos);
      yPos += 5;
    }

    addContentPage(doc, 'Core Wound', parsed.coreWound, fonts, pageWidth, pageHeight, margin);

    addContentPage(doc, 'How it Feels', parsed.howItFeels, fonts, pageWidth, pageHeight, margin);

    addContentPage(doc, 'Shadow Patterns', parsed.shadowPatterns, fonts, pageWidth, pageHeight, margin);

    doc.addPage();
    if (cosmicBgBase64) {
      doc.addImage(`data:image/jpeg;base64,${cosmicBgBase64}`, 'JPEG', 0, 0, pageWidth, pageHeight);
      doc.setFillColor(0, 0, 0);
      doc.setGState(new doc.GState({ opacity: 0.5 }));
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setGState(new doc.GState({ opacity: 1.0 }));
    }

    yPos = margin + 20;
    doc.setFontSize(42);
    doc.setTextColor(...WHITE);
    if (fonts.hasSerif) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    const medicineTitle = "Your Medicine";
    const medicineTitleWidth = doc.getTextWidth(medicineTitle);
    doc.text(medicineTitle, (pageWidth - medicineTitleWidth) / 2, yPos);
    yPos += 20;

    doc.setFillColor(...BEIGE_BG);
    doc.setGState(new doc.GState({ opacity: 0.85 }));
    const medicineBoxHeight = 150;
    doc.roundedRect(margin, yPos, boxWidth, medicineBoxHeight, 5, 5, 'F');
    doc.setGState(new doc.GState({ opacity: 1.0 }));

    yPos += 12;
    doc.setFontSize(12);
    doc.setTextColor(...DARK_TEXT);
    doc.setFont('helvetica', 'normal');

    const medicineIntro = "When integrated, this placement becomes POWERFUL:";
    doc.text(medicineIntro, margin + 10, yPos);
    yPos += 10;

    for (const item of parsed.yourMedicine.slice(0, 5)) {
      if (item.startsWith('- ') || item.startsWith('•')) {
        const bulletText = item.replace(/^[-•]\s*/, '');
        const wrappedBullet = wrapText(doc, bulletText, boxWidth - 30);

        for (let i = 0; i < wrappedBullet.length; i++) {
          if (i === 0) {
            doc.text('•', margin + 12, yPos);
            doc.text(wrappedBullet[i], margin + 18, yPos);
          } else {
            doc.text(wrappedBullet[i], margin + 18, yPos);
          }
          yPos += 6;
        }
        yPos += 2;
      }
    }

    yPos += 5;
    const medicineClosing = parsed.yourMedicine.filter(item =>
      item.toLowerCase().includes('wound') && item.toLowerCase().includes('superpower')
    );
    const transformText = medicineClosing.length > 0
      ? medicineClosing[0].replace(/^[-•]\s*/, '')
      : "Your wound becomes your superpower when you embrace your authentic truth.";
    const wrappedTransform = wrapText(doc, transformText, boxWidth - 20);
    for (const line of wrappedTransform) {
      doc.text(line, margin + 10, yPos);
      yPos += 6;
    }

    addContentPage(doc, 'Your Invitation', parsed.yourInvitation, fonts, pageWidth, pageHeight, margin);

    doc.addPage();
    doc.setFillColor(...BEIGE_BG);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    yPos = margin + 5;
    drawSparkleIcon(doc, pageWidth / 2, yPos, 3);
    yPos += 15;

    doc.setFontSize(32);
    doc.setTextColor(...DARK_TEXT);
    if (fonts.hasSerif) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    const reflectionTitle = "Reflection";
    const reflectionTitleWidth = doc.getTextWidth(reflectionTitle);
    doc.text(reflectionTitle, (pageWidth - reflectionTitleWidth) / 2, yPos);
    yPos += 20;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const reflectionPrompts = parsed.reflectionPrompts.filter(p => p.startsWith('-') || p.includes('?'));
    for (const prompt of reflectionPrompts.slice(0, 2)) {
      const promptText = prompt.replace(/^[-•]\s*/, '');
      const wrappedPrompt = wrapText(doc, promptText, pageWidth - (margin * 2));
      for (const line of wrappedPrompt) {
        doc.text(line, margin, yPos);
        yPos += 6;
      }
      yPos += 8;
    }

    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const ctaText1 = "Did this report crack you wide open?";
    const ctaText1Width = doc.getTextWidth(ctaText1);
    doc.text(ctaText1, (pageWidth - ctaText1Width) / 2, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    const ctaText2 = "Send this quiz to someone who needs it!";
    const ctaText2Width = doc.getTextWidth(ctaText2);
    doc.text(ctaText2, (pageWidth - ctaText2Width) / 2, yPos);
    yPos += 15;

    const buttonWidth = 70;
    const buttonHeight = 12;
    doc.setFillColor(...TEAL_BUTTON);
    doc.roundedRect((pageWidth - buttonWidth) / 2, yPos, buttonWidth, buttonHeight, 3, 3, 'F');

    doc.setFontSize(13);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    const shareText = "SHARE ➤";
    const shareTextWidth = doc.getTextWidth(shareText);
    doc.text(shareText, (pageWidth - shareTextWidth) / 2, yPos + 8);

    doc.link((pageWidth - buttonWidth) / 2, yPos, buttonWidth, buttonHeight, {
      url: 'https://shadow.lovelightandblackholes.com/'
    });

    yPos += buttonHeight + 20;

    doc.setFontSize(16);
    doc.setTextColor(...DARK_TEXT);
    doc.setFont('helvetica', 'bold');
    const deeperText = "Want to go deeper?";
    const deeperTextWidth = doc.getTextWidth(deeperText);
    doc.text(deeperText, (pageWidth - deeperTextWidth) / 2, yPos);
    yPos += 12;

    const wisdomButtonWidth = 130;
    doc.setFillColor(...TEAL_BUTTON);
    doc.roundedRect((pageWidth - wisdomButtonWidth) / 2, yPos, wisdomButtonWidth, buttonHeight, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    const wisdomText = "TURN THIS WOUND INTO WISDOM";
    const wisdomTextWidth = doc.getTextWidth(wisdomText);
    doc.text(wisdomText, (pageWidth - wisdomTextWidth) / 2, yPos + 8);

    doc.link((pageWidth - wisdomButtonWidth) / 2, yPos, wisdomButtonWidth, buttonHeight, {
      url: 'https://lovelightandblackholes.com/wound-to-wisdom'
    });

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-shadow-medicine.pdf`;
    const filePath = `reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        url: publicUrlData.publicUrl,
        fileName
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate PDF"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
