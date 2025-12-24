
import { AsciiConfig, AsciiResult } from '../types';

/**
 * We are repurposing this to just process the image into a nice framed texture.
 * No longer doing ASCII conversion as per user request.
 */
export const convertImageToAscii = async (
  imageUrl: string,
  config: AsciiConfig
): Promise<AsciiResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No context');

      // Create a square frame for a Polaroid look
      const size = 512;
      canvas.width = size;
      canvas.height = size;

      // Draw white background (frame)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);

      // Draw the image in the center with a bit of margin
      const margin = 40;
      const drawWidth = size - (margin * 2);
      const drawHeight = drawWidth * (img.height / img.width);
      
      // Handle aspect ratio
      let finalW, finalH;
      if (img.width > img.height) {
        finalW = drawWidth;
        finalH = drawWidth * (img.height / img.width);
      } else {
        finalH = drawWidth;
        finalW = drawWidth * (img.width / img.height);
      }

      ctx.drawImage(img, (size - finalW) / 2, (size - finalH) / 2 - 20, finalW, finalH);

      // Add a small "Holiday" text at bottom
      ctx.fillStyle = '#b71c1c';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Merry Christmas', size / 2, size - 40);

      resolve({
        text: '', // Text is no longer needed
        canvas: canvas
      });
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};
