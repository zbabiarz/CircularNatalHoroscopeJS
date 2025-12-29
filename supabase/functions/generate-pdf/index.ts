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

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Background color
    doc.setFillColor(249, 242, 235);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Title
    doc.setFontSize(24);
    doc.setTextColor(139, 69, 19);
    doc.setFont('helvetica', 'bold');
    const titleText = `${name}'s Chiron Shadow`;
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 10;

    // Archetype
    doc.setFontSize(18);
    doc.setTextColor(219, 39, 119);
    doc.setFont('helvetica', 'normal');
    const archetypeText = archetype.startsWith('The ') ? archetype : `The ${archetype}`;
    const archetypeWidth = doc.getTextWidth(archetypeText);
    doc.text(archetypeText, (pageWidth - archetypeWidth) / 2, yPosition);
    yPosition += 8;

    // Placement info
    doc.setFontSize(11);
    doc.setTextColor(139, 69, 19, 0.7 * 255);
    const placementText = `Chiron in ${chironSign}${chironHouse ? ` in the ${chironHouse}` : ''} at ${chironDegree.toFixed(2)}°`;
    const placementWidth = doc.getTextWidth(placementText);
    doc.text(placementText, (pageWidth - placementWidth) / 2, yPosition);
    yPosition += 12;

    // Parse and add report sections
    const { sections } = parseMarkdownToText(report);

    doc.setTextColor(139, 69, 19);

    for (const section of sections) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        doc.setFillColor(249, 242, 235);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPosition = margin;
      }

      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margin, yPosition);
      yPosition += 7;

      // Section content
      doc.setFontSize(10);
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
          yPosition += 5;
        }

        yPosition += 2;
      }

      yPosition += 5;
    }

    // Get PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Upload to Supabase Storage
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

    // Get public URL
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