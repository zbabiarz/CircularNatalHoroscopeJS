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

function parseMarkdownToText(markdown: string): { sections: Array<{ title: string; content: string[] }> } {
  const lines = markdown.split('\n');
  const sections: Array<{ title: string; content: string[] }> = [];
  let currentSection: { title: string; content: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith('**') && line.endsWith('**')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/\*\*/g, '').trim(),
        content: []
      };
    } else if (currentSection && line.trim()) {
      currentSection.content.push(line.trim());
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return { sections };
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

async function loadCinzelDecorativeFont(): Promise<string | null> {
  try {
    const fontUrl = "https://fonts.gstatic.com/s/cinzeldecorative/v18/daaCSScvJGqLYhG8nNt8KPPswUAPni7TTMw.ttf";
    const response = await fetch(fontUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error("Error loading font:", error);
    return null;
  }
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

    const headerImageUrl = "https://storage.googleapis.com/msgsndr/QFjnAi2H2A9Cpxi7l0ri/media/69666e4102f1bec5b7190e9d.png";

    const [headerImageBase64, fontBase64] = await Promise.all([
      fetchImageAsBase64(headerImageUrl),
      loadCinzelDecorativeFont()
    ]);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    if (fontBase64) {
      doc.addFileToVFS("CinzelDecorative-Regular.ttf", fontBase64);
      doc.addFont("CinzelDecorative-Regular.ttf", "CinzelDecorative", "normal");
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    doc.setFillColor(249, 242, 235);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    if (headerImageBase64) {
      const imgWidth = 60;
      const imgHeight = 20;
      const imgX = (pageWidth - imgWidth) / 2;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.7 }));
      doc.addImage(`data:image/png;base64,${headerImageBase64}`, 'PNG', imgX, yPosition, imgWidth, imgHeight);
      doc.restoreGraphicsState();
      yPosition += imgHeight + 8;
    }

    const useCinzel = fontBase64 !== null;

    doc.setFontSize(26);
    doc.setTextColor(0, 0, 0);
    if (useCinzel) {
      doc.setFont('CinzelDecorative', 'normal');
    } else {
      doc.setFont('helvetica', 'bold');
    }
    const titleText = `${name}'s Chiron Shadow`;
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 10;

    doc.setFontSize(20);
    doc.setTextColor(219, 39, 119);
    if (useCinzel) {
      doc.setFont('CinzelDecorative', 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    const archetypeText = archetype.startsWith('The ') ? archetype : `The ${archetype}`;
    const archetypeWidth = doc.getTextWidth(archetypeText);
    doc.text(archetypeText, (pageWidth - archetypeWidth) / 2, yPosition);
    yPosition += 8;

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const placementText = `Chiron in ${chironSign}${chironHouse ? ` in the ${chironHouse}` : ''} at ${chironDegree.toFixed(2)}°`;
    const placementWidth = doc.getTextWidth(placementText);
    doc.text(placementText, (pageWidth - placementWidth) / 2, yPosition);
    yPosition += 12;

    const { sections } = parseMarkdownToText(report);

    doc.setTextColor(0, 0, 0);

    for (const section of sections) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        doc.setFillColor(249, 242, 235);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPosition = margin;
      }

      doc.setFontSize(16);
      if (useCinzel) {
        doc.setFont('CinzelDecorative', 'normal');
      } else {
        doc.setFont('helvetica', 'bold');
      }
      doc.text(section.title, margin, yPosition);
      yPosition += 7;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      for (const contentLine of section.content) {
        const isBullet = contentLine.startsWith('- ');
        const text = isBullet ? contentLine.substring(2) : contentLine;
        const wrappedLines = wrapText(doc, text, maxWidth - (isBullet ? 5 : 0));

        for (let i = 0; i < wrappedLines.length; i++) {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            doc.setFillColor(249, 242, 235);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            yPosition = margin;
          }

          const xPos = margin + (isBullet && i === 0 ? 0 : isBullet ? 5 : 0);
          const lineText = isBullet && i === 0 ? `• ${wrappedLines[i]}` : wrappedLines[i];
          doc.text(lineText, xPos, yPosition);
          yPosition += 5.5;
        }

        yPosition += 2;
      }

      yPosition += 5;
    }

    if (yPosition > pageHeight - 50) {
      doc.addPage();
      doc.setFillColor(249, 242, 235);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      yPosition = margin;
    }

    yPosition += 10;

    const buttonWidth = 50;
    const buttonHeight = 12;
    const buttonX = (pageWidth - buttonWidth) / 2;
    const buttonY = yPosition;

    doc.setFillColor(219, 39, 119);
    doc.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 3, 3, 'F');

    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const buttonText = "Turn this wound into wisdom";
    const buttonTextWidth = doc.getTextWidth(buttonText);
    const buttonTextX = buttonX + (buttonWidth - buttonTextWidth) / 2;
    const buttonTextY = buttonY + 8;
    doc.text(buttonText, buttonTextX, buttonTextY);

    doc.link(buttonX, buttonY, buttonWidth, buttonHeight, { url: 'https://lovelightandblackholes.com/wound-to-wisdom' });

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-chiron-shadow-report.pdf`;
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