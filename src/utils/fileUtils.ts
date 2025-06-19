
/**
 * Sanitizes filenames by removing or replacing problematic characters
 * especially useful for Cyrillic characters that cause issues with Supabase Storage
 */
export const sanitizeFilename = (filename: string): string => {
  // Get the file extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

  // Transliterate common Cyrillic characters to Latin equivalents
  const cyrillicToLatin: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  // Transliterate Cyrillic characters
  let sanitizedName = name.split('').map(char => cyrillicToLatin[char] || char).join('');

  // Remove or replace other problematic characters
  sanitizedName = sanitizedName
    .normalize('NFD') // Normalize unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace non-alphanumeric chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 100); // Limit length to 100 characters

  // Ensure we have a valid filename
  if (!sanitizedName) {
    sanitizedName = 'file';
  }

  return sanitizedName + extension.toLowerCase();
};

/**
 * Generates a unique filename with timestamp and user ID
 */
export const generateUniqueFilename = (originalFilename: string, userId: string): string => {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const lastDotIndex = sanitized.lastIndexOf('.');
  const name = lastDotIndex > 0 ? sanitized.substring(0, lastDotIndex) : sanitized;
  const extension = lastDotIndex > 0 ? sanitized.substring(lastDotIndex) : '';
  
  return `${userId.substring(0, 8)}_${timestamp}_${name}${extension}`;
};

/**
 * Extracts text from PDF files using the browser's File API
 * This is a placeholder implementation that reads the file as text
 * In a real implementation, you'd use a PDF parsing library like pdf-parse or PDF.js
 */
export const extractTextFromPDF = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        // This is a simplified implementation
        // In practice, you'd need a proper PDF parsing library
        const result = reader.result as string;
        
        // For now, we'll return a placeholder message indicating the file was read
        // The actual PDF text extraction will be handled by the backend
        resolve(`PDF file: ${file.name} (${file.size} bytes) - Content will be extracted on the server`);
      } catch (error) {
        reject(new Error(`Failed to read PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the PDF file'));
    };
    
    // Read as text for now - in a real implementation, you'd use ArrayBuffer and a PDF library
    reader.readAsText(file);
  });
};
