import { translateToEnglish, translateToItalian } from '@/utils/translation';

export interface TranslationResult {
  title: string;
  content: string;
}

export interface TranslateStoryParams {
  storyId: string;
  title: string;
  content: string;
  sourceLang: 'italian' | 'english';
  targetLang: 'italian' | 'english';
}

/**
 * Centralized story translation service
 * Translates both title and content completely
 */
export const translateStory = async ({
  title,
  content,
  sourceLang,
  targetLang,
}: TranslateStoryParams): Promise<TranslationResult> => {
  try {
    // Ensure we have content to translate
    if (!content || content.trim() === '') {
      console.warn('translateStory: Empty content provided');
      return { title, content };
    }

    const translateFn = targetLang === 'english' ? translateToEnglish : translateToItalian;

    // Translate both title and content in parallel
    const [translatedTitle, translatedContent] = await Promise.all([
      translateFn(title),
      translateFn(content),
    ]);

    // Ensure we return complete translations
    if (!translatedContent || translatedContent.trim() === '') {
      console.error('translateStory: Translation returned empty content');
      throw new Error('Translation returned empty content');
    }

    return {
      title: translatedTitle,
      content: translatedContent,
    };
  } catch (error) {
    console.error('translateStory error:', error);
    throw error;
  }
};

/**
 * Detect current language of text using simple heuristics
 */
export const detectLanguage = (text: string): 'italian' | 'english' => {
  if (!text) return 'italian';

  const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with', 'for', 'as', 'was', 'on'];
  const lowerText = text.toLowerCase();
  const englishWordCount = englishWords.filter(word => 
    lowerText.includes(` ${word} `) || 
    lowerText.startsWith(`${word} `) || 
    lowerText.endsWith(` ${word}`)
  ).length;

  return englishWordCount > 3 ? 'english' : 'italian';
};
