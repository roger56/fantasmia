// Media Download Utility for AG Stories
// Enables users to download media assets to their local device

import { fantasMiaDB } from '@/utils/indexedDB';

/**
 * Download a media asset associated with a story
 * @param storyId - The ID of the story
 * @param storyTitle - The title of the story (used for filename)
 * @returns true if download was successful, false otherwise
 */
export const downloadMediaAsset = async (
  storyId: string,
  storyTitle: string
): Promise<boolean> => {
  try {
    await fantasMiaDB.init();
    const asset = await fantasMiaDB.getLatestMediaAssetByStoryId(storyId);
    
    if (!asset || !asset.data) {
      console.warn('No media asset found for story:', storyId);
      return false;
    }

    // Ensure we have a proper Blob
    const blob = asset.data instanceof Blob
      ? asset.data
      : new Blob([asset.data], { type: asset.mime || 'image/png' });

    const url = URL.createObjectURL(blob);

    // Sanitize filename: remove special characters, limit length
    const safeTitle = storyTitle
      .replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s-]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
      .trim() || 'immagine';

    // Determine file extension from MIME type
    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = mimeToExt[asset.mime] || 'png';

    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}.${ext}`;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    console.log('✅ Media download initiated:', { storyId, filename: a.download });
    return true;
  } catch (error) {
    console.error('❌ Download failed:', error);
    return false;
  }
};

/**
 * Download media directly from a Blob or data URL
 * @param data - Blob or data URL string
 * @param filename - Desired filename
 */
export const downloadMediaDirect = (
  data: Blob | string,
  filename: string
): void => {
  let url: string;
  let shouldRevoke = false;

  if (data instanceof Blob) {
    url = URL.createObjectURL(data);
    shouldRevoke = true;
  } else if (typeof data === 'string' && data.startsWith('data:')) {
    url = data;
  } else {
    console.error('Invalid data format for download');
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (shouldRevoke) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  console.log('✅ Direct media download initiated:', filename);
};
