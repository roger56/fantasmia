// Parser for Daily Stories ASCII file format
// Format: "gg mese, racconto, massima" or "gg mese, racconto, "massima""

const ITALIAN_MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'
];

// Days per month (February allows 29 for leap years)
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export interface DailyStory {
  date: string;   // "12 dicembre"
  story: string;  // racconto breve ASCII
  quote: string;  // massima del giorno
}

export interface ParseResult {
  success: boolean;
  stories: DailyStory[];
  errors: Array<{ line: number; message: string }>;
}

/**
 * Parse a CSV-like line with proper handling of quoted fields
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Push last field
  result.push(current.trim());
  
  return result;
};

/**
 * Validate Italian date format "gg mese"
 */
const validateItalianDate = (dateStr: string): string | null => {
  const match = dateStr.trim().match(/^(\d{1,2})\s+(\w+)$/i);
  if (!match) return null;
  
  const day = parseInt(match[1]);
  const monthStr = match[2].toLowerCase();
  const monthIndex = ITALIAN_MONTHS.indexOf(monthStr);
  
  if (monthIndex === -1) return null;
  
  // Validate day is within valid range for month
  if (day < 1 || day > DAYS_IN_MONTH[monthIndex]) return null;
  
  return `${day} ${monthStr}`;
};

/**
 * Remove emojis and non-ASCII characters
 */
const sanitizeASCII = (text: string): string => {
  // Remove emojis and non-ASCII characters, but keep basic punctuation
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[^\\x00-\\x7F\\u00C0-\\u00FF\\u0100-\\u017F]/g, '') // Keep Latin Extended
    .trim();
};

/**
 * Parse daily stories file content
 */
export const parseDailyStoriesFile = (content: string): ParseResult => {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const stories: DailyStory[] = [];
  const errors: Array<{ line: number; message: string }> = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    try {
      const parts = parseCSVLine(line);
      
      if (parts.length < 3) {
        errors.push({ 
          line: lineNum, 
          message: 'Formato non valido: servono data, racconto, massima separati da virgole' 
        });
        return;
      }
      
      const [dateStr, storyText, quoteText] = parts;
      
      // Validate date
      const validatedDate = validateItalianDate(dateStr);
      if (!validatedDate) {
        errors.push({ 
          line: lineNum, 
          message: `Data non valida: "${dateStr}". Formato richiesto: "gg mese" (es. "12 dicembre")` 
        });
        return;
      }
      
      // Validate story content
      if (!storyText || storyText.length < 10) {
        errors.push({ 
          line: lineNum, 
          message: 'Racconto troppo breve o mancante' 
        });
        return;
      }
      
      // Validate quote content
      if (!quoteText || quoteText.length < 5) {
        errors.push({ 
          line: lineNum, 
          message: 'Massima troppo breve o mancante' 
        });
        return;
      }
      
      // Clean and sanitize text
      const cleanStory = sanitizeASCII(storyText);
      // Remove surrounding quotes from quote if present
      const cleanQuote = sanitizeASCII(quoteText.replace(/^["']|["']$/g, ''));
      
      stories.push({
        date: validatedDate,
        story: cleanStory,
        quote: cleanQuote
      });
      
    } catch (e) {
      errors.push({ 
        line: lineNum, 
        message: `Errore parsing: ${e instanceof Error ? e.message : 'errore sconosciuto'}` 
      });
    }
  });
  
  return { 
    success: errors.length === 0, 
    stories, 
    errors 
  };
};

/**
 * Validate a single daily story
 */
export const validateDailyStory = (story: Partial<DailyStory>): string[] => {
  const errors: string[] = [];
  
  if (!story.date) {
    errors.push('Data mancante');
  } else if (!validateItalianDate(story.date)) {
    errors.push('Data non valida. Formato richiesto: "gg mese" (es. "12 dicembre")');
  }
  
  if (!story.story || story.story.length < 10) {
    errors.push('Racconto troppo breve (minimo 10 caratteri)');
  }
  
  if (!story.quote || story.quote.length < 5) {
    errors.push('Massima troppo breve (minimo 5 caratteri)');
  }
  
  return errors;
};
