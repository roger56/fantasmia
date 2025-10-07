/**
 * Utility functions for reliable base64/dataURL conversion to Blob
 * with comprehensive error handling and telemetry
 */

export interface NormalizedBase64 {
  mime: string;
  base64: string;
}

/**
 * Normalizes base64 or dataURL strings to clean format
 * Handles URL-safe base64, padding, and MIME type extraction
 */
export function normalizeDataUrlOrBase64(input: string): NormalizedBase64 {
  // Remove whitespace and newlines
  let s = input.trim().replace(/\s+/g, '');
  let mime = 'image/png'; // default
  
  // Check if it's a dataURL format
  const dataUrlMatch = /^data:([^;]+);base64,(.*)$/i.exec(s);
  if (dataUrlMatch) {
    mime = dataUrlMatch[1].toLowerCase();
    s = dataUrlMatch[2];
  }
  
  // Convert URL-safe base64 to standard
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add proper padding
  const pad = s.length % 4;
  if (pad === 2) s += '==';
  else if (pad === 3) s += '=';
  else if (pad === 1) throw new Error('Invalid base64 length');
  
  return { mime, base64: s };
}

/**
 * Safely converts base64 string to Blob using chunked processing
 * to avoid RangeError on large strings
 */
export function base64ToBlobSafe(input: string): Blob {
  const { mime, base64 } = normalizeDataUrlOrBase64(input);
  
  console.info({ step: 'base64-convert-start', mime, length: base64.length });
  
  // Decode in chunks to prevent RangeError on large strings
  const chunkSize = 32768; // 32KB chunks
  const bytes: Uint8Array[] = [];
  
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const binaryString = atob(chunk);
    const buffer = new Uint8Array(binaryString.length);
    
    for (let j = 0; j < binaryString.length; j++) {
      buffer[j] = binaryString.charCodeAt(j);
    }
    
    bytes.push(buffer);
  }
  
  // Merge all chunks into a single Uint8Array
  const totalLength = bytes.reduce((acc, arr) => acc + arr.length, 0);
  const mergedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of bytes) {
    mergedBytes.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Validate MIME type for security
  const validMimeType = ['image/jpeg', 'image/png', 'image/webp'].includes(mime) ? mime : 'image/webp';
  
  const blob = new Blob([mergedBytes], { type: validMimeType });
  console.info({ step: 'base64-convert-done', finalMime: blob.type, size: blob.size });
  
  return blob;
}

/**
 * Canvas fallback for converting displayed images to Blob
 * Uses crossOrigin handling and quality fallbacks
 */
export function convertImageToBlob(img: HTMLImageElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    console.info({ step: 'canvas-fallback-start', naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Cannot create canvas context'));
      return;
    }

    // Use natural dimensions for quality
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    try {
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Try WebP first with quality 0.92
      canvas.toBlob((blob) => {
        if (blob && blob.size >= 10240) { // 10KB minimum
          console.info({ step: 'canvas-fallback-done', format: 'webp', size: blob.size });
          resolve(blob);
        } else {
          // Fallback to PNG
          canvas.toBlob((pngBlob) => {
            if (pngBlob && pngBlob.size >= 10240) {
              console.info({ step: 'canvas-fallback-done', format: 'png', size: pngBlob.size });
              resolve(pngBlob);
            } else {
              reject(new Error('Canvas conversion resulted in invalid blob'));
            }
          }, 'image/png', 0.92);
        }
      }, 'image/webp', 0.92);
    } catch (error) {
      reject(new Error(`Canvas drawing failed: ${error.message}`));
    }
  });
}

/**
 * Test function for base64 conversion
 * Creates a synthetic image dataURL and tests conversion
 */
export function testBase64Conversion(): { success: boolean; size: number; error?: string } {
  try {
    // Create a minimal 1x1 PNG dataURL for testing
    const testDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGJALoZ1QAAAAABJRU5ErkJggg==';
    const blob = base64ToBlobSafe(testDataURL);
    
    return {
      success: true,
      size: blob.size
    };
  } catch (error) {
    return {
      success: false,
      size: 0,
      error: error.message
    };
  }
}