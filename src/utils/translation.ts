
const translateToEnglish = async (text: string): Promise<string> => {
  try {
    // Simple translation using Google Translate API approach
    // In a real app, you'd use a proper translation service
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl=en&dt=t&q=${encodeURIComponent(text)}`);
    
    // Check for CORS or other HTTP errors
    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.debug('Translation API error (dev mode):', response.status, response.statusText);
      }
      return text; // Return original if translation fails
    }
    
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((item: any) => item[0]).join('');
    }
    
    return text; // Return original if translation fails
  } catch (error) {
    // In development, use debug logging for CORS/network errors
    if (import.meta.env.DEV) {
      console.debug('Translation error (dev mode):', error);
    } else {
      console.error('Translation error:', error);
    }
    return text; // Return original if translation fails
  }
};

const translateToItalian = async (text: string): Promise<string> => {
  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=it&dt=t&q=${encodeURIComponent(text)}`);
    
    // Check for CORS or other HTTP errors
    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.debug('Translation API error (dev mode):', response.status, response.statusText);
      }
      return text; // Return original if translation fails
    }
    
    const data = await response.json();
    
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0].map((item: any) => item[0]).join('');
    }
    
    return text; // Return original if translation fails
  } catch (error) {
    // In development, use debug logging for CORS/network errors
    if (import.meta.env.DEV) {
      console.debug('Translation error (dev mode):', error);
    } else {
      console.error('Translation error:', error);
    }
    return text; // Return original if translation fails
  }
};

export { translateToEnglish, translateToItalian };
