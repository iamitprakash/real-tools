import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Convert PDF to DOCX
 * Extracts text from PDF and creates a DOCX document
 * Note: Formatting preservation is limited as PDFs are layout-based, not content-based
 */
export async function convertPDFToDOCX(file: File): Promise<Blob> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0
    });
    const pdf = await loadingTask.promise;
    
    const paragraphs: Paragraph[] = [];
    const numPages = pdf.numPages;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum - 1);
      const textContent = await page.getTextContent();
      
      // Group text items into paragraphs (items with similar Y positions)
      const textItems = textContent.items as any[];
      let currentParagraph: string[] = [];
      let lastY = -1;
      
      for (const item of textItems) {
        if (item.str && item.str.trim()) {
          const itemY = item.transform[5]; // Y coordinate
          
          // If Y position changed significantly, start new paragraph
          if (lastY !== -1 && Math.abs(itemY - lastY) > 5) {
            if (currentParagraph.length > 0) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun(currentParagraph.join(' '))],
                })
              );
              currentParagraph = [];
            }
          }
          
          currentParagraph.push(item.str);
          lastY = itemY;
        }
      }
      
      // Add remaining text as paragraph
      if (currentParagraph.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(currentParagraph.join(' '))],
          })
        );
      }
      
      // Add page break (except for last page)
      if (pageNum < numPages) {
        paragraphs.push(
          new Paragraph({
            text: '',
            heading: HeadingLevel.HEADING_1,
          })
        );
      }
    }
    
    // Create DOCX document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs.length > 0 ? paragraphs : [
          new Paragraph({
            children: [new TextRun('(No text content found in PDF)')],
          })
        ],
      }],
    });
    
    // Generate DOCX blob
    const blob = await Packer.toBlob(doc);
    return blob;
  } catch (error) {
    throw new Error(`Failed to convert PDF to DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert DOCX to PDF
 * Note: This is a simplified conversion that extracts text and creates a basic PDF
 * Complex formatting, images, and tables may not be preserved perfectly
 */
export async function convertDOCXToPDF(file: File): Promise<Blob> {
  try {
    // Read DOCX file as ZIP (DOCX is a ZIP archive)
    const arrayBuffer = await file.arrayBuffer();
    const zip = await import('jszip');
    const JSZip = zip.default;
    const zipFile = await JSZip.loadAsync(arrayBuffer);
    
    // Read the main document XML
    const documentXml = await zipFile.file('word/document.xml')?.async('string');
    if (!documentXml) {
      throw new Error('Invalid DOCX file: document.xml not found');
    }
    
    // Parse XML to extract text (simplified - doesn't handle all formatting)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, 'text/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    
    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let yPosition = 800; // Start from top
    const lineHeight = 14;
    const margin = 50;
    const pageWidth = 595;
    let currentPage = page; // Track current page for multi-page documents
    
    // Extract text from paragraphs
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const textRuns = para.getElementsByTagName('w:t');
      let paragraphText = '';
      
      for (let j = 0; j < textRuns.length; j++) {
        const textNode = textRuns[j].textContent || '';
        paragraphText += textNode;
      }
      
      if (paragraphText.trim()) {
        // Check if we need a new page
        if (yPosition < margin + lineHeight) {
          currentPage = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        
        // Check if text is bold (simplified check)
        const isBold = para.getElementsByTagName('w:b').length > 0;
        const font = isBold ? helveticaBold : helvetica;
        
        // Word wrap text
        const words = paragraphText.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, 12);
          
          if (textWidth > pageWidth - 2 * margin && currentLine) {
            // Draw current line
            currentPage.drawText(currentLine, {
              x: margin,
              y: yPosition,
              size: 12,
              font: font,
              color: rgb(0, 0, 0),
            });
            yPosition -= lineHeight;
            currentLine = word;
            
            // Check for new page
            if (yPosition < margin + lineHeight) {
              currentPage = pdfDoc.addPage([595, 842]);
              yPosition = 800;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        // Draw remaining text
        if (currentLine) {
          currentPage.drawText(currentLine, {
            x: margin,
            y: yPosition,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPosition -= lineHeight * 1.5; // Extra space between paragraphs
        }
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    throw new Error(`Failed to convert DOCX to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download a file
 */
export function downloadFile(blob: Blob, filename: string) {
  saveAs(blob, filename);
}
