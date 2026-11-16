/**
 * Client-side Image Compression Utility
 * Resizes large camera photos down to optimized resolutions (max 1280px)
 * and compresses JPEG/WebP to ~100-200KB for fast, reliable storage in SQLite DB.
 */

function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  if (!file.type && file.name) {
    return /\.(jpg|jpeg|png|gif|webp|heic|heif|bmp)$/i.test(file.name);
  }
  return true;
}

function readAsDataUrlFallback(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

export function compressImageFile(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    outputType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    if (!isImageFile(file)) {
      return reject(new Error('File is not an image'));
    }

    const drawToCanvas = (img, fallbackSrc = null) => {
      try {
        let width = img.naturalWidth || img.width || 800;
        let height = img.naturalHeight || img.height || 600;

        // Scale down dimensions preserving aspect ratio (protects iOS Safari 16.7MP canvas limit)
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return fallbackSrc ? resolve(fallbackSrc) : readAsDataUrlFallback(file).then(resolve).catch(reject);
        }

        if (outputType === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL(outputType, quality);
        // Release iOS canvas memory immediately
        canvas.width = 0;
        canvas.height = 0;
        resolve(compressedDataUrl);
      } catch (err) {
        if (fallbackSrc) {
          resolve(fallbackSrc);
        } else {
          readAsDataUrlFallback(file).then(resolve).catch(reject);
        }
      }
    };

    // Fast path for iOS Safari: use Object URL to avoid loading 15MB base64 strings into RAM before downscaling
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      let objectUrl = null;
      try {
        objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          drawToCanvas(img, null);
        };
        img.onerror = () => {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          readAsDataUrlFallback(file).then(resolve).catch(reject);
        };
        img.src = objectUrl;
        return;
      } catch (e) {
        if (objectUrl) {
          try { URL.revokeObjectURL(objectUrl); } catch {}
        }
      }
    }

    // Fallback path via FileReader
    readAsDataUrlFallback(file)
      .then((dataUrl) => {
        const img = new Image();
        img.onerror = () => resolve(dataUrl);
        img.onload = () => drawToCanvas(img, dataUrl);
        img.src = dataUrl;
      })
      .catch(reject);
  });
}

/**
 * Process multiple files in parallel and return compressed base64 strings
 */
export async function compressMultipleImageFiles(files, maxCount = 5) {
  const fileArray = Array.from(files || []).slice(0, maxCount);
  const imageFiles = fileArray.filter(isImageFile);

  const compressedPromises = imageFiles.map(file => 
    compressImageFile(file).catch(() => null)
  );

  const results = await Promise.all(compressedPromises);
  return results.filter(Boolean);
}
