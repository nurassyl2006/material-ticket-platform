/**
 * Utilities for safely handling images and data URLs without triggering
 * browser top-frame navigation restrictions (e.g. about:blank#blocked).
 */

/**
 * Converts a base64 Data URL to a Blob
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;

    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binaryStr = atob(parts[1]);
    const len = binaryStr.length;
    const u8arr = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      u8arr[i] = binaryStr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Error converting dataUrl to blob:', err);
    return null;
  }
}

/**
 * Safely opens an image (data URL, blob URL, or web URL) in a new browser tab.
 * Avoids browser "Not allowed to navigate top frame to data URL" error by
 * wrapping data URLs in a temporary Blob Object URL.
 */
export function openImageInNewTab(imageUrl, title = 'Photo Preview') {
  if (!imageUrl) return;

  try {
    // If it's already an http, https, or blob URL, window.open is safe
    if (!imageUrl.startsWith('data:')) {
      const win = window.open(imageUrl, '_blank');
      if (win) {
        win.focus();
        return;
      }
    }

    // Convert data URL to Blob URL
    const blob = dataUrlToBlob(imageUrl);
    if (!blob) {
      window.open(imageUrl, '_blank');
      return;
    }

    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win) {
      win.focus();
      // Revoke after window has had time to load
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } else {
      // If popup blocker blocked it, fallback to download
      downloadImage(imageUrl, `${title.replace(/[^\w\d-]/g, '_')}.jpg`);
    }
  } catch (err) {
    console.error('Failed to open image in new tab:', err);
  }
}

/**
 * Downloads an image (data URL or web URL) directly to user's device
 */
export function downloadImage(imageUrl, filename = 'photo.jpg') {
  if (!imageUrl) return;

  try {
    let downloadUrl = imageUrl;
    let isObjectUrl = false;

    if (imageUrl.startsWith('data:')) {
      const blob = dataUrlToBlob(imageUrl);
      if (blob) {
        downloadUrl = URL.createObjectURL(blob);
        isObjectUrl = true;
      }
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (isObjectUrl) {
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
    }
  } catch (err) {
    console.error('Failed to download image:', err);
  }
}
