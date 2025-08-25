/**
 * Extracts a meaningful, short description from story content for image generation
 */
export const extractStoryDescription = (content: string, title?: string): string => {
  if (!content || content.trim().length === 0) {
    return title ? `Una storia intitolata "${title}"` : "Una storia magica";
  }

  // Clean the content
  let cleanContent = content
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Look for the first sentence or meaningful phrase (up to 150 characters)
  const sentences = cleanContent.split(/[.!?]+/);
  if (sentences.length > 0 && sentences[0].length > 0) {
    let firstSentence = sentences[0].trim();
    
    // If first sentence is too short, try to add the second one
    if (firstSentence.length < 50 && sentences.length > 1 && sentences[1]) {
      const combined = (firstSentence + '. ' + sentences[1].trim()).substring(0, 150);
      return combined;
    }
    
    // Return first sentence, truncated if necessary
    return firstSentence.length > 150 ? firstSentence.substring(0, 147) + '...' : firstSentence;
  }

  // Fallback: use first 150 characters
  return cleanContent.length > 150 ? cleanContent.substring(0, 147) + '...' : cleanContent;
};