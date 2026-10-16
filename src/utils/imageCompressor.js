/**
 * Client-side Image Compression Utility
 * Resizes large camera photos down to optimized resolutions (max 1280px)
 * and compresses JPEG/WebP to ~100-200KB for fast, reliable storage in SQLite DB.
 */

export function compressImageFile(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.82,
    outputType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(e.target.result); // Fallback to raw data URL
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down dimensions preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(e.target.result);
          }

          // Fill white background for transparent PNGs converted to JPEG
          if (outputType === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL(outputType, quality);
          resolve(compressedDataUrl);
        } catch (err) {
          // If canvas tainted or error, fallback to raw
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Process multiple files in parallel and return compressed base64 strings
 */
export async function compressMultipleImageFiles(files, maxCount = 5) {
  const fileArray = Array.from(files).slice(0, maxCount);
  const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

  const compressedPromises = imageFiles.map(file => 
    compressImageFile(file).catch(() => null)
  );

  const results = await Promise.all(compressedPromises);
  return results.filter(Boolean);
}
