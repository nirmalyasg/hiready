import JSZip from "jszip";
import { parseString } from "xml2js";
import { promisify } from "util";

async function parsePdfWithLib(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  try {
    const { PDFParse } = await import("pdf-parse");
    
    // Use the new PDFParse class API (v2.x)
    const parser = new PDFParse({ data: buffer });
    
    // Get info to get page count
    const info = await parser.getInfo({ parsePageInfo: true });
    const totalPages = info.total || 1;
    
    // Get text content
    const textResult = await parser.getText();
    const text = textResult.text || "";
    
    await parser.destroy();
    
    console.log(`[PDF Parse] Parsed ${totalPages} pages, text length: ${text.length}`);
    return {
      text,
      numpages: totalPages,
    };
  } catch (e) {
    console.error("PDF parse error:", e);
    return { text: "", numpages: 1 };
  }
}

const parseXml = promisify(parseString);

export interface SlideContent {
  slideNumber: number;
  title: string;
  bulletPoints: string[];
  speakerNotes: string;
  rawText: string;
}

export interface PresentationData {
  fileName: string;
  totalSlides: number;
  slides: SlideContent[];
  extractedText: string;
  topic?: string;
  fileType: "pptx" | "pdf";
  originalBuffer?: Buffer;
}

export function isPptxFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pptx");
}

export function isPdfFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

export function getSupportedFileTypes(): string[] {
  return [".pptx", ".pdf"];
}

function isValidSlideText(text: string): boolean {
  if (!text || text.length < 2) return false;
  if (text.startsWith("http://") || text.startsWith("https://")) return false;
  if (/^\{[A-F0-9-]+\}$/i.test(text)) return false;
  if (/^rId\d+$/i.test(text)) return false;
  if (/^[0-9]+$/.test(text) && text.length < 4) return false;
  if (/^[a-z]$/.test(text)) return false;
  if (text.includes("schemas.openxmlformats") || text.includes("schemas.microsoft")) return false;
  if (/^(Freeform|TextBox|Group)\s+\d+$/i.test(text)) return false;
  return true;
}

function cleanSlideTexts(texts: string[]): string[] {
  return texts.filter(isValidSlideText);
}

function extractTextFromXml(obj: any): string[] {
  const texts: string[] = [];
  
  function traverse(node: any) {
    if (!node) return;
    
    if (typeof node === "string") {
      const trimmed = node.trim();
      if (trimmed && isValidSlideText(trimmed)) texts.push(trimmed);
      return;
    }
    
    if (Array.isArray(node)) {
      node.forEach(traverse);
      return;
    }
    
    if (typeof node === "object") {
      if (node["a:t"]) {
        const textContent = node["a:t"];
        if (Array.isArray(textContent)) {
          textContent.forEach((t: any) => {
            if (typeof t === "string" && t.trim() && isValidSlideText(t.trim())) {
              texts.push(t.trim());
            } else if (typeof t === "object" && t._ && isValidSlideText(t._.trim())) {
              texts.push(t._.trim());
            }
          });
        } else if (typeof textContent === "string" && textContent.trim() && isValidSlideText(textContent.trim())) {
          texts.push(textContent.trim());
        }
      }
      
      Object.values(node).forEach(traverse);
    }
  }
  
  traverse(obj);
  return texts;
}

function categorizeSlideTexts(texts: string[]): { title: string; bulletPoints: string[] } {
  if (texts.length === 0) {
    return { title: "", bulletPoints: [] };
  }
  
  const title = texts[0] || "";
  const bulletPoints = texts.slice(1).filter(t => t.length > 0 && t !== title);
  
  return { title, bulletPoints };
}

export async function parsePptxBuffer(buffer: Buffer, fileName: string): Promise<PresentationData> {
  const zip = await JSZip.loadAsync(buffer);
  const slides: SlideContent[] = [];
  
  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });
  
  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = slideFiles[i];
    const slideNum = i + 1;
    
    try {
      const slideContent = await zip.file(slideFile)?.async("string");
      if (!slideContent) continue;
      
      const parsed = await parseXml(slideContent) as any;
      const texts = extractTextFromXml(parsed);
      const { title, bulletPoints } = categorizeSlideTexts(texts);
      
      let speakerNotes = "";
      const notesFile = `ppt/notesSlides/notesSlide${slideNum}.xml`;
      if (zip.files[notesFile]) {
        try {
          const notesContent = await zip.file(notesFile)?.async("string");
          if (notesContent) {
            const notesParsed = await parseXml(notesContent) as any;
            const notesTexts = extractTextFromXml(notesParsed);
            speakerNotes = notesTexts.join(" ");
          }
        } catch (e) {
          console.warn(`Could not parse notes for slide ${slideNum}`);
        }
      }
      
      slides.push({
        slideNumber: slideNum,
        title,
        bulletPoints,
        speakerNotes,
        rawText: texts.join("\n"),
      });
    } catch (e) {
      console.error(`Error parsing slide ${slideNum}:`, e);
      slides.push({
        slideNumber: slideNum,
        title: `Slide ${slideNum}`,
        bulletPoints: [],
        speakerNotes: "",
        rawText: "",
      });
    }
  }
  
  const extractedText = slides
    .map(s => {
      let text = `Slide ${s.slideNumber}: ${s.title}`;
      if (s.bulletPoints.length > 0) {
        text += "\n  - " + s.bulletPoints.join("\n  - ");
      }
      if (s.speakerNotes) {
        text += `\n  Notes: ${s.speakerNotes}`;
      }
      return text;
    })
    .join("\n\n");
  
  return {
    fileName,
    totalSlides: slides.length,
    slides,
    extractedText,
    fileType: "pptx" as const,
    originalBuffer: buffer,
  };
}

export async function parsePdfBuffer(buffer: Buffer, fileName: string): Promise<PresentationData> {
  const pdfData = await parsePdfWithLib(buffer);
  
  const pageTexts = pdfData.text.split(/\f/).filter(text => text.trim());
  const totalPages = pdfData.numpages || pageTexts.length;
  
  const slides: SlideContent[] = [];
  
  for (let i = 0; i < totalPages; i++) {
    const pageText = pageTexts[i] || "";
    const lines = pageText.split("\n").map(l => l.trim()).filter(l => l);
    
    const title = lines[0] || `Page ${i + 1}`;
    const bulletPoints = lines.slice(1).filter(l => l.length > 2);
    
    slides.push({
      slideNumber: i + 1,
      title,
      bulletPoints,
      speakerNotes: "",
      rawText: pageText.trim(),
    });
  }
  
  const extractedText = slides
    .map(s => {
      let text = `Page ${s.slideNumber}: ${s.title}`;
      if (s.bulletPoints.length > 0) {
        text += "\n  - " + s.bulletPoints.slice(0, 10).join("\n  - ");
      }
      return text;
    })
    .join("\n\n");
  
  return {
    fileName,
    totalSlides: slides.length,
    slides,
    extractedText,
    fileType: "pdf" as const,
    originalBuffer: buffer,
  };
}

export async function parsePresentation(buffer: Buffer, fileName: string): Promise<PresentationData> {
  if (isPdfFile(fileName)) {
    return parsePdfBuffer(buffer, fileName);
  } else if (isPptxFile(fileName)) {
    return parsePptxBuffer(buffer, fileName);
  } else {
    throw new Error(`Unsupported file type. Please upload a .pptx or .pdf file.`);
  }
}

export function generatePresentationContext(presentation: PresentationData, topic: string, userContext?: string | null): string {
  const contextSection = userContext 
    ? `\nSITUATION CONTEXT:\n${userContext}\n`
    : '';
  
  return `
PRESENTATION PRACTICE SESSION
Topic: ${topic}
Presentation: ${presentation.fileName}
Total Slides: ${presentation.totalSlides}
${contextSection}
SLIDE CONTENT:
${presentation.extractedText}

---
The user is practicing delivering this presentation. As audience members, you should:
1. Listen attentively to their presentation
2. Ask clarifying questions about the content
3. Challenge assumptions or ask for more details on key points
4. Provide the kind of questions a real audience would ask
5. React naturally as engaged meeting participants would
${userContext ? `6. Keep in mind the situation context: "${userContext}" - tailor your questions and reactions accordingly` : ''}

Your role is to help them practice presenting this material confidently and handling audience questions.
`.trim();
}
