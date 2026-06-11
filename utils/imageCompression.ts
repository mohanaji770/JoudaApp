/* ─── Configuration ─── */
const IMAGE_CONFIG = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.72,           // JPEG quality (0–1). 0.72 ≈ good quality at small size
  maxFileSizeKB: 150,      // Target max after compression
  absoluteMaxKB: 512,      // Hard reject if still bigger after second pass
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/* ─── Image Compression ─── */

/**
 * Compress and resize an image file before upload.
 * - Resizes to max 512×512 while preserving aspect ratio
 * - Converts to JPEG for optimal size (except PNGs with transparency)
 * - Runs two compression passes if needed to hit the target size
 * - Returns a File object ready for upload
 */
export const compressImage = async (file: File): Promise<File> => {
  // Validate type
  if (!(IMAGE_CONFIG.acceptedTypes as readonly string[]).includes(file.type)) {
    throw new Error(`نوع الملف غير مدعوم. الأنواع المدعومة: JPEG, PNG, WebP`);
  }

  // Validate original size (max 10MB upfront)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('حجم الصورة كبير جدًا. الحد الأقصى 10 ميجابايت.');
  }

  // Check if the image has transparency (PNG with alpha)
  const hasAlpha = await detectAlphaChannel(file);

  // If it's a tiny file already, skip compression
  if (file.size <= IMAGE_CONFIG.maxFileSizeKB * 1024 && !hasAlpha) {
    return file;
  }

  const { blob, usedType } = await resizeAndCompress(file, {
    maxWidth: IMAGE_CONFIG.maxWidth,
    maxHeight: IMAGE_CONFIG.maxHeight,
    quality: IMAGE_CONFIG.quality,
    preserveAlpha: hasAlpha,
  });

  // Second pass: if still too large, compress more aggressively
  let finalBlob = blob;
  if (blob.size > IMAGE_CONFIG.absoluteMaxKB * 1024) {
    const { blob: secondPass } = await resizeAndCompress(file, {
      maxWidth: 256,       // smaller dimensions
      maxHeight: 256,
      quality: 0.55,       // lower quality
      preserveAlpha: hasAlpha,
    });
    finalBlob = secondPass;
  }

  // Hard limit check
  if (finalBlob.size > IMAGE_CONFIG.absoluteMaxKB * 1024) {
    throw new Error(`لم نتمكن من ضغط الصورة بما يكفي (${Math.round(finalBlob.size / 1024)}KB). يرجى استخدام صورة أصغر.`);
  }

  // Convert blob → File with correct extension
  const ext = usedType === 'image/png' ? 'png' : usedType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([finalBlob], `${baseName}.${ext}`, { type: usedType });
};

/**
 * Resize and compress an image using canvas.
 */
const resizeAndCompress = async (
  file: File,
  options: { maxWidth: number; maxHeight: number; quality: number; preserveAlpha: boolean }
): Promise<{ blob: Blob; usedType: string }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions preserving aspect ratio
      let { width, height } = img;
      if (width > options.maxWidth || height > options.maxHeight) {
        const ratio = Math.min(options.maxWidth / width, options.maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // White background for JPEG (no transparency support)
      const outputType = options.preserveAlpha ? 'image/png' : 'image/jpeg';

      if (outputType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('فشل في تحويل الصورة'));
            return;
          }
          resolve({ blob, usedType: outputType });
        },
        outputType,
        outputType === 'image/jpeg' ? options.quality : undefined // PNG doesn't use quality param
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('فشل في تحميل الصورة'));
    };

    img.src = url;
  });
};

/**
 * Detect if a PNG image has an alpha channel (transparency).
 */
const detectAlphaChannel = (file: File): Promise<boolean> => {
  if (file.type !== 'image/png') return Promise.resolve(false);

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(false); return; }

      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      // Check alpha channel (every 4th byte)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 254) { // not fully opaque
          resolve(true);
          return;
        }
      }
      resolve(false);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
};

/**
 * Utility to convert a File object to a Base64 string.
 * This is useful after compression if you need to send the image directly to an API (like Gemini).
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
