import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Sanitizes a field ID to be valid for PDF form field names
 * PDF field names can contain letters, numbers, and certain special characters
 */
function sanitizeFieldId(id: string): string {
  // Replace invalid characters with underscores
  return id.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface FormField {
  id: string;
  type: 'text' | 'checkbox' | 'textarea' | 'radio' | 'dropdown' | 'signature' | 'label' | 'ul' | 'ol';
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  options?: string[]; // For dropdown/radio/lists
}

export async function generateFormPDF(fields: FormField[]): Promise<Blob> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const form = pdfDoc.getForm();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Height of A4 is 842. We need to flip Y coordinates because
  // DOM (0,0) is top-left, PDF (0,0) is bottom-left.
  const pageHeight = 842;

  for (const field of fields) {
    // Validate field coordinates and dimensions
    if (field.width <= 0 || field.height <= 0) {
      console.warn(`Skipping field ${field.id}: invalid dimensions`);
      continue;
    }
    
    // Invert Y coordinate.
    // field.y is from top. PDF expects from bottom.
    const pdfY = pageHeight - field.y - field.height;
    
    // Validate coordinates are within page bounds
    if (field.x < 0 || field.x + field.width > 595 || pdfY < 0 || pdfY + field.height > pageHeight) {
      console.warn(`Skipping field ${field.id}: coordinates out of bounds`);
      continue;
    }

    // Draw Label
    // For 'label' type (Static Text), we draw the text AT the box position.
    if (field.type === 'label') {
        page.drawText(field.label, {
            x: field.x,
            y: pdfY + field.height - 10, // Align top-ish inside the box
            size: 12,
            font: helvetica,
            color: rgb(0, 0, 0),
        });
        continue; // Skip creating a form widget
    }

    // Draw Lists (UL/OL)
    if (field.type === 'ul' || field.type === 'ol') {
        const items = field.options || ['Item 1', 'Item 2', 'Item 3'];
        const fontSize = 10;
        const lineHeight = 14;
        
        items.forEach((item, index) => {
            const prefix = field.type === 'ul' ? '• ' : `${index + 1}. `;
            page.drawText(`${prefix}${item}`, {
                x: field.x,
                y: (pdfY + field.height - 10) - (index * lineHeight), // Start top-ish and go down
                size: fontSize,
                font: helvetica,
                color: rgb(0, 0, 0),
            });
        });
        continue;
    }

    // For other fields, we do NOT draw a label. The entry box is standalone.

    // Sanitize field ID for PDF compatibility
    const sanitizedId = sanitizeFieldId(field.id);

    if (field.type === 'text' || field.type === 'textarea') {
      const textField = form.createTextField(sanitizedId);
      textField.setText('');
      if (field.type === 'textarea') {
        textField.enableMultiline();
      }
      textField.addToPage(page, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height,
      });
    } else if (field.type === 'checkbox') {
      const checkBox = form.createCheckBox(sanitizedId);
      checkBox.addToPage(page, {
        x: field.x,
        y: pdfY,
        width: field.width,
        height: field.height,
      });
    } else if (field.type === 'radio') {
      // Create a unique group for this single button for now
      const radioGroup = form.createRadioGroup(`group_${sanitizedId}`);
      radioGroup.addOptionToPage(sanitizedId, page, {
          x: field.x,
          y: pdfY,
          width: field.width,
          height: field.height,
      });
    } else if (field.type === 'dropdown') {
        const dropdown = form.createDropdown(sanitizedId);
        if (field.options) {
            dropdown.setOptions(field.options);
        } else {
            dropdown.setOptions(['Option 1', 'Option 2', 'Option 3']);
        }
        dropdown.addToPage(page, {
            x: field.x,
            y: pdfY,
            width: field.width,
            height: field.height,
        });
    } else if (field.type === 'signature') {
        // Signature field is essentially a form field but often handled by specific signature handlers.
        // We can create a text field intended for digital signatures or a button.
        // pdf-lib doesn't support creating digital signature fields easily yet.
        // We will fallback to a visual box (rectangle) and a text field.
        const sigField = form.createTextField(sanitizedId);
        sigField.enableMultiline();
        sigField.setText('Sign Here');
        sigField.addToPage(page, {
            x: field.x,
            y: pdfY,
            width: field.width,
            height: field.height,
        });
        
        // Add a visual border using vector graphics purely for print
        page.drawRectangle({
            x: field.x,
            y: pdfY,
            width: field.width,
            height: field.height,
            borderWidth: 1,
            borderColor: rgb(0, 0, 0),
            opacity: 0.1 // Subtle background
        });
    }
  }

  // Add instruction text at the bottom of the page about making PDF readonly
  try {
    const instructionLines = [
      'Note: After filling this form, use the "Make PDF Readonly" button',
      'in the web app to lock all fields and prevent further editing.'
    ];
    const fontSize = 7;
    const lineHeight = 10;
    const startY = 15; // Start 15px from bottom
    
    instructionLines.forEach((line, index) => {
      // Calculate text width to center it (approximate)
      const textWidth = line.length * (fontSize * 0.6); // Rough estimate
      const centeredX = Math.max(20, (595 - textWidth) / 2);
      
      page.drawText(line, {
        x: centeredX,
        y: startY + (instructionLines.length - 1 - index) * lineHeight,
        size: fontSize,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4), // Dark gray color
      });
    });
  } catch (error) {
    // If text drawing fails, continue without it
    console.warn('Could not add readonly instruction to PDF:', error);
  }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Makes a PDF readonly by flattening all form fields
 * @param pdfFile - The PDF file to process
 * @returns A new PDF blob with all fields flattened (readonly)
 */
export async function makePDFReadonly(pdfFile: File | Blob): Promise<Blob> {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const form = pdfDoc.getForm();
    
    // Flatten all form fields - this makes them non-editable
    form.flatten();
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error making PDF readonly:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
