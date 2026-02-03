import fs from 'fs';
import path from 'path';

const cosmicBg = fs.readFileSync('./src/data/cosmic-bg-base64.txt', 'utf8').trim();
const discoBall = fs.readFileSync('./src/data/disco-ball-base64.txt', 'utf8').trim();
const cinzelRegular = fs.readFileSync('./src/data/cinzel-regular-base64.txt', 'utf8').trim();
const cinzelBold = fs.readFileSync('./src/data/cinzel-bold-base64.txt', 'utf8').trim();
const tenorSans = fs.readFileSync('./src/data/tenor-sans-base64.txt', 'utf8').trim();

const functionCode = `import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const COSMIC_BG_BASE64 = "${cosmicBg}";
const DISCO_BALL_BASE64 = "${discoBall}";
const CINZEL_REGULAR_BASE64 = "${cinzelRegular}";
const CINZEL_BOLD_BASE64 = "${cinzelBold}";
const TENOR_SANS_BASE64 = "${tenorSans}";

interface RequestBody {
  name: string;
  chironSign: string;
  chironHouse?: string;
  chironDegree: number;
  archetype: string;
  report: string;
}

const BEIGE_BG: [number, number, number] = [245, 240, 232];
const DARK_TEXT: [number, number, number] = [45, 45, 45];
const TEAL_BUTTON: [number, number, number] = [74, 155, 140];
const WHITE: [number, number, number] = [255, 255, 255];
const CARD_BG: [number, number, number] = [250, 247, 243];

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
  const lines = markdown.split('\\n').map(l => l.trim()).filter(l => l);
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
      const arr = result[currentSection as keyof typeof result];
      if (Array.isArray(arr)) {
        arr.push(line);
      }
    }
  }
  return result;
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? \`\${currentLine} \${word}\` : word;
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

function drawSparkleIcon(doc: jsPDF, x: number, y: number, size: number = 6) {
  doc.setDrawColor(45, 45, 45);
  doc.setLineWidth(0.8);
  doc.line(x, y - size, x, y + size);
  doc.line(x - size, y, x + size, y);
  const smallSize = size * 0.4;
  doc.line(x - smallSize, y - smallSize, x + smallSize, y + smallSize);
  doc.line(x - smallSize, y + smallSize, x + smallSize, y - smallSize);
}

function drawRoundedCard(doc: jsPDF, x: number, y: number, width: number, height: number, radius: number = 8, opacity: number = 1) {
  if (opacity < 1) {
    doc.setFillColor(250, 247, 243);
  } else {
    doc.setFillColor(...CARD_BG);
  }
  doc.roundedRect(x, y, width, height, radius, radius, 'F');
}

function addCosmicBackground(doc: jsPDF, pageWidth: number, pageHeight: number) {
  try {
    doc.addImage('data:image/jpeg;base64,' + COSMIC_BG_BASE64, 'JPEG', 0, 0, pageWidth, pageHeight);
  } catch {
    doc.setFillColor(30, 25, 45);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }
}

function addDiscoBall(doc: jsPDF, x: number, y: number, size: number = 25) {
  try {
    doc.addImage('data:image/png;base64,' + DISCO_BALL_BASE64, 'PNG', x - size/2, y - size/2, size, size);
  } catch {
    doc.setFillColor(200, 200, 210);
    doc.circle(x, y, size/3, 'F');
  }
}

function setupFonts(doc: jsPDF) {
  try {
    doc.addFileToVFS('Cinzel-Regular.ttf', CINZEL_REGULAR_BASE64);
    doc.addFont('Cinzel-Regular.ttf', 'Cinzel', 'normal');
    doc.addFileToVFS('Cinzel-Bold.ttf', CINZEL_BOLD_BASE64);
    doc.addFont('Cinzel-Bold.ttf', 'Cinzel', 'bold');
    doc.addFileToVFS('TenorSans-Regular.ttf', TENOR_SANS_BASE64);
    doc.addFont('TenorSans-Regular.ttf', 'TenorSans', 'normal');
    return true;
  } catch {
    return false;
  }
}

function addContentPage(
  doc: jsPDF,
  title: string,
  content: string[],
  pageWidth: number,
  pageHeight: number,
  margin: number,
  hasFonts: boolean
): number {
  doc.addPage();
  doc.setFillColor(...BEIGE_BG);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  let yPos = margin + 8;
  drawSparkleIcon(doc, pageWidth / 2, yPos, 5);
  yPos += 18;
  doc.setFontSize(32);
  doc.setTextColor(...DARK_TEXT);
  if (hasFonts) {
    doc.setFont('Cinzel', 'normal');
  } else {
    doc.setFont('times', 'bold');
  }
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, yPos);
  yPos += 15;
  const cardMargin = margin - 5;
  const cardWidth = pageWidth - (cardMargin * 2);
  let cardStartY = yPos;
  let cardContentY = yPos + 12;
  if (hasFonts) {
    doc.setFont('TenorSans', 'normal');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  doc.setFontSize(11);
  doc.setTextColor(...DARK_TEXT);
  const maxWidth = cardWidth - 24;
  let tempY = cardContentY;
  const processedContent: { type: string; lines: string[] }[] = [];
  for (const paragraph of content) {
    if (!paragraph || paragraph === title) continue;
    if (paragraph.startsWith('This placement often comes with:') ||
        paragraph.startsWith('When unhealed,') ||
        paragraph.startsWith('When integrated,')) {
      const wrappedIntro = wrapText(doc, paragraph, maxWidth);
      processedContent.push({ type: 'intro', lines: wrappedIntro });
      tempY += wrappedIntro.length * 6 + 8;
    } else if (paragraph.startsWith('- ') || paragraph.startsWith('*')) {
      const bulletText = paragraph.replace(/^[-*]\\s*/, '');
      const wrappedBullet = wrapText(doc, bulletText, maxWidth - 10);
      processedContent.push({ type: 'bullet', lines: wrappedBullet });
      tempY += wrappedBullet.length * 6 + 4;
    } else {
      const wrappedParagraph = wrapText(doc, paragraph, maxWidth);
      processedContent.push({ type: 'paragraph', lines: wrappedParagraph });
      tempY += wrappedParagraph.length * 6 + 6;
    }
  }
  const cardHeight = Math.min(tempY - cardStartY + 15, pageHeight - cardStartY - margin);
  drawRoundedCard(doc, cardMargin, cardStartY, cardWidth, cardHeight, 12);
  for (const item of processedContent) {
    if (cardContentY > pageHeight - margin - 20) break;
    if (item.type === 'intro') {
      for (const line of item.lines) {
        doc.text(line, cardMargin + 12, cardContentY);
        cardContentY += 6;
      }
      cardContentY += 4;
    } else if (item.type === 'bullet') {
      for (let i = 0; i < item.lines.length; i++) {
        if (i === 0) {
          doc.text('*', cardMargin + 14, cardContentY);
          doc.text(item.lines[i], cardMargin + 22, cardContentY);
        } else {
          doc.text(item.lines[i], cardMargin + 22, cardContentY);
        }
        cardContentY += 6;
      }
      cardContentY += 2;
    } else {
      for (const line of item.lines) {
        doc.text(line, cardMargin + 12, cardContentY);
        cardContentY += 6;
      }
      cardContentY += 4;
    }
  }
  return cardContentY;
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
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const hasFonts = setupFonts(doc);

    // PAGE 1: Cover
    addCosmicBackground(doc, pageWidth, pageHeight);
    let yPos = 25;
    addDiscoBall(doc, pageWidth / 2, yPos, 30);
    yPos += 35;
    doc.setFontSize(38);
    doc.setTextColor(...WHITE);
    if (hasFonts) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('times', 'bold');
    }
    const titleLine1 = "YOUR SHADOW";
    const titleLine2 = "MEDICINE";
    let title1Width = doc.getTextWidth(titleLine1);
    let title2Width = doc.getTextWidth(titleLine2);
    doc.text(titleLine1, (pageWidth - title1Width) / 2, yPos);
    yPos += 14;
    doc.text(titleLine2, (pageWidth - title2Width) / 2, yPos);
    yPos += 12;
    doc.setFontSize(13);
    if (hasFonts) {
      doc.setFont('TenorSans', 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const subtitle = "Chiron Report by Morgan Garza";
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, yPos);
    yPos += 25;
    const boxPadding = 15;
    const boxWidth = pageWidth - (margin * 2);
    const boxHeight = pageHeight - yPos - 10;
    doc.setFillColor(...BEIGE_BG);
    doc.roundedRect(margin, yPos, boxWidth, boxHeight, 0, 0, 'F');
    yPos += 20;
    doc.setFontSize(36);
    doc.setTextColor(...DARK_TEXT);
    if (hasFonts) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('times', 'bold');
    }
    const placementTitle = \`Chiron in \${chironSign}\`;
    const placementTitleWidth = doc.getTextWidth(placementTitle);
    doc.text(placementTitle, (pageWidth - placementTitleWidth) / 2, yPos);
    yPos += 12;
    doc.setFontSize(16);
    if (hasFonts) {
      doc.setFont('TenorSans', 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const houseText = chironHouse ? chironHouse : '';
    if (houseText) {
      const houseWidth = doc.getTextWidth(houseText);
      doc.text(houseText, (pageWidth - houseWidth) / 2, yPos);
      yPos += 10;
    }
    const parsed = parseMarkdownReport(report);
    const archetypeTitle = parsed.archetype || archetype;
    const archetypeDisplay = archetypeTitle.startsWith('The ') ? archetypeTitle : \`The \${archetypeTitle}\`;
    const archetypeTitleWidth = doc.getTextWidth(archetypeDisplay);
    doc.text(archetypeDisplay, (pageWidth - archetypeTitleWidth) / 2, yPos);
    yPos += 18;
    doc.setFontSize(11);
    const storyText = parsed.chironStory.join(' ');
    const storyLines = wrapText(doc, storyText, boxWidth - (boxPadding * 2));
    for (let i = 0; i < storyLines.length && yPos < pageHeight - 15; i++) {
      const lineWidth = doc.getTextWidth(storyLines[i]);
      doc.text(storyLines[i], (pageWidth - lineWidth) / 2, yPos);
      yPos += 6;
    }

    // PAGE 2: Core Wound
    addContentPage(doc, 'Core Wound', parsed.coreWound, pageWidth, pageHeight, margin, hasFonts);

    // PAGE 3: How it Feels
    addContentPage(doc, 'How it Feels', parsed.howItFeels, pageWidth, pageHeight, margin, hasFonts);

    // PAGE 4: Shadow Patterns
    addContentPage(doc, 'Shadow Patterns', parsed.shadowPatterns, pageWidth, pageHeight, margin, hasFonts);

    // PAGE 5: Your Medicine (cosmic background)
    doc.addPage();
    addCosmicBackground(doc, pageWidth, pageHeight);
    yPos = 20;
    addDiscoBall(doc, pageWidth / 2, yPos, 25);
    yPos += 30;
    doc.setFontSize(36);
    doc.setTextColor(...WHITE);
    if (hasFonts) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('times', 'bold');
    }
    const medicineTitle = "Your Medicine";
    const medicineTitleWidth = doc.getTextWidth(medicineTitle);
    doc.text(medicineTitle, (pageWidth - medicineTitleWidth) / 2, yPos);
    yPos += 15;
    const medicineCardMargin = margin - 5;
    const medicineCardWidth = pageWidth - (medicineCardMargin * 2);
    const medicineCardHeight = 140;
    drawRoundedCard(doc, medicineCardMargin, yPos, medicineCardWidth, medicineCardHeight, 12, 0.9);
    yPos += 15;
    doc.setFontSize(11);
    doc.setTextColor(...DARK_TEXT);
    if (hasFonts) {
      doc.setFont('TenorSans', 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const medicineIntro = "When integrated, this placement becomes POWERFUL:";
    doc.text(medicineIntro, medicineCardMargin + 12, yPos);
    yPos += 12;
    for (const item of parsed.yourMedicine.slice(0, 6)) {
      if (yPos > pageHeight - 50) break;
      if (item.startsWith('- ') || item.startsWith('*')) {
        const bulletText = item.replace(/^[-*]\\s*/, '');
        const wrappedBullet = wrapText(doc, bulletText, medicineCardWidth - 35);
        for (let i = 0; i < wrappedBullet.length; i++) {
          if (i === 0) {
            doc.text('*', medicineCardMargin + 14, yPos);
            doc.text(wrappedBullet[i], medicineCardMargin + 22, yPos);
          } else {
            doc.text(wrappedBullet[i], medicineCardMargin + 22, yPos);
          }
          yPos += 6;
        }
        yPos += 3;
      }
    }
    yPos += 5;
    const medicineClosing = parsed.yourMedicine.filter(item =>
      item.toLowerCase().includes('wound') && item.toLowerCase().includes('superpower')
    );
    const transformText = medicineClosing.length > 0
      ? medicineClosing[0].replace(/^[-*]\\s*/, '')
      : "Your wound becomes your superpower when you embrace your authentic truth.";
    const wrappedTransform = wrapText(doc, transformText, medicineCardWidth - 24);
    for (const line of wrappedTransform) {
      doc.text(line, medicineCardMargin + 12, yPos);
      yPos += 6;
    }

    // PAGE 6: Your Invitation
    addContentPage(doc, 'Your Invitation', parsed.yourInvitation, pageWidth, pageHeight, margin, hasFonts);

    // PAGE 7: Reflection
    doc.addPage();
    doc.setFillColor(...BEIGE_BG);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    yPos = margin + 8;
    drawSparkleIcon(doc, pageWidth / 2, yPos, 5);
    yPos += 18;
    doc.setFontSize(32);
    doc.setTextColor(...DARK_TEXT);
    if (hasFonts) {
      doc.setFont('Cinzel', 'normal');
    } else {
      doc.setFont('times', 'bold');
    }
    const reflectionTitle = "Reflection";
    const reflectionTitleWidth = doc.getTextWidth(reflectionTitle);
    doc.text(reflectionTitle, (pageWidth - reflectionTitleWidth) / 2, yPos);
    yPos += 15;
    const reflectionCardMargin = margin - 5;
    const reflectionCardWidth = pageWidth - (reflectionCardMargin * 2);
    const reflectionCardHeight = 55;
    drawRoundedCard(doc, reflectionCardMargin, yPos, reflectionCardWidth, reflectionCardHeight, 12);
    yPos += 12;
    if (hasFonts) {
      doc.setFont('TenorSans', 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    doc.setFontSize(11);
    const reflectionPrompts = parsed.reflectionPrompts.filter(p => p.startsWith('-') || p.includes('?'));
    for (const prompt of reflectionPrompts.slice(0, 2)) {
      const promptText = prompt.replace(/^[-*]\\s*/, '');
      const wrappedPrompt = wrapText(doc, promptText, reflectionCardWidth - 24);
      for (const line of wrappedPrompt) {
        doc.text(line, reflectionCardMargin + 12, yPos);
        yPos += 6;
      }
      yPos += 6;
    }
    yPos += 20;
    doc.setFontSize(15);
    if (hasFonts) {
      doc.setFont('TenorSans', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    const ctaText1 = "Did this report crack you wide open?";
    const ctaText1Width = doc.getTextWidth(ctaText1);
    doc.text(ctaText1, (pageWidth - ctaText1Width) / 2, yPos);
    yPos += 8;
    doc.setFontSize(14);
    const ctaText2 = "Send this quiz to someone who needs it!";
    const ctaText2Width = doc.getTextWidth(ctaText2);
    doc.text(ctaText2, (pageWidth - ctaText2Width) / 2, yPos);
    yPos += 18;
    const shareButtonWidth = 90;
    const shareButtonHeight = 14;
    doc.setFillColor(...TEAL_BUTTON);
    doc.roundedRect((pageWidth - shareButtonWidth) / 2, yPos, shareButtonWidth, shareButtonHeight, 7, 7, 'F');
    doc.setFontSize(14);
    doc.setTextColor(...WHITE);
    if (hasFonts) {
      doc.setFont('TenorSans', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    const shareText = "SHARE";
    const shareTextWidth = doc.getTextWidth(shareText);
    doc.text(shareText, (pageWidth - shareTextWidth) / 2 - 8, yPos + 10);
    const arrowX = (pageWidth + shareTextWidth) / 2 + 2;
    const arrowY = yPos + 7;
    doc.setDrawColor(...WHITE);
    doc.setLineWidth(0.8);
    doc.line(arrowX, arrowY + 3, arrowX + 8, arrowY - 2);
    doc.line(arrowX + 8, arrowY - 2, arrowX + 5, arrowY - 2);
    doc.line(arrowX + 8, arrowY - 2, arrowX + 8, arrowY + 1);
    doc.link((pageWidth - shareButtonWidth) / 2, yPos, shareButtonWidth, shareButtonHeight, {
      url: 'https://shadow.lovelightandblackholes.com/'
    });
    yPos += shareButtonHeight + 25;
    doc.setFontSize(18);
    doc.setTextColor(...DARK_TEXT);
    if (hasFonts) {
      doc.setFont('TenorSans', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    const deeperText = "Want to go deeper?";
    const deeperTextWidth = doc.getTextWidth(deeperText);
    doc.text(deeperText, (pageWidth - deeperTextWidth) / 2, yPos);
    yPos += 15;
    const wisdomButtonWidth = 160;
    const wisdomButtonHeight = 14;
    doc.setFillColor(...TEAL_BUTTON);
    doc.roundedRect((pageWidth - wisdomButtonWidth) / 2, yPos, wisdomButtonWidth, wisdomButtonHeight, 7, 7, 'F');
    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    const wisdomText = "TURN THIS WOUND INTO WISDOM";
    const wisdomTextWidth = doc.getTextWidth(wisdomText);
    doc.text(wisdomText, (pageWidth - wisdomTextWidth) / 2, yPos + 10);
    doc.link((pageWidth - wisdomButtonWidth) / 2, yPos, wisdomButtonWidth, wisdomButtonHeight, {
      url: 'https://lovelightandblackholes.com/wound-to-wisdom'
    });

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = \`\${name.toLowerCase().replace(/\\s+/g, '-')}-\${Date.now()}-shadow-medicine.pdf\`;
    const filePath = \`reports/\${fileName}\`;
    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });
    if (uploadError) {
      throw new Error(\`Upload failed: \${uploadError.message}\`);
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
`;

const outputPath = './supabase/functions/generate-pdf/index.ts';
fs.writeFileSync(outputPath, functionCode);
console.log('Generated PDF function at:', outputPath);
console.log('Total function size:', functionCode.length, 'chars');
