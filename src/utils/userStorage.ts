import { supabase } from '@/integrations/supabase/client';
import { AuthBridge } from './authBridge';

// Generate a proper UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface User {
  id: string;
  name: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female';
  password: string;
  lastAccess?: string;
  unreadMessages?: Message[];
}

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Story {
  id: string;
  title: string;
  content?: string;
  status: 'completed' | 'suspended' | 'in-progress';
  lastModified: string;
  mode: 'GHOST' | 'PROPP' | 'PROPP_FREE' | 'AIROTS' | 'PAROLE_CHIAMANO' | 'ALOVAF' | 'CAMPBELL' | 'CSS' | 'PROFESSION';
  authorId: string;
  authorName: string;
  isPublic: boolean;
  language?: 'italian' | 'english';
  category?: string;
}

export const saveUser = (user: User) => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
    // Create directory structure for new user
    createUserDirectoryStructure(user.id);
  }
  
  localStorage.setItem('fantasmia_users', JSON.stringify(users));
};

export const updateUser = (user: User) => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
    localStorage.setItem('fantasmia_users', JSON.stringify(users));
  }
};

// Create the base directory structure for a new user
const createUserDirectoryStructure = (userId: string) => {
  const categories = ['GHOST', 'PROPP', 'AIROTS', 'UNA_PAROLA_TANTE_STORIE', 'CAMPBELL', 'CSS', 'PROFESSION'];
  const baseStructureKey = 'fantasmia_directory_structure';
  
  // Get existing structure or create new one
  const existingStructure = JSON.parse(localStorage.getItem(baseStructureKey) || '{}');
  
  // Create base FANTASMIA directory if not exists
  if (!existingStructure['FANTASMIA']) {
    existingStructure['FANTASMIA'] = {};
  }
  
  // Create user directory
  if (!existingStructure['FANTASMIA'][userId]) {
    existingStructure['FANTASMIA'][userId] = {};
  }
  
  // Create category subdirectories
  categories.forEach(category => {
    if (!existingStructure['FANTASMIA'][userId][category]) {
      existingStructure['FANTASMIA'][userId][category] = {};
    }
  });
  
  localStorage.setItem(baseStructureKey, JSON.stringify(existingStructure));
};

export const getUsers = (): User[] => {
  const stored = localStorage.getItem('fantasmia_users');
  return stored ? JSON.parse(stored) : [];
};

export const getUserByEmailAndPassword = (email: string, password: string): User | null => {
  const users = getUsers();
  // Trim spaces and make comparison case-insensitive for both email and password
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim().toLowerCase();
  
  return users.find(u => {
    const userEmail = (u.email || '').trim().toLowerCase();
    const userPassword = (u.password || '').trim().toLowerCase();
    return userEmail === cleanEmail && userPassword === cleanPassword;
  }) || null;
};

export const getUserByNameAndPassword = (name: string, password: string): User | null => {
  const users = getUsers();
  // Trim spaces and make comparison case-insensitive for both name and password
  const cleanName = name.trim().toLowerCase();
  const cleanPassword = password.trim().toLowerCase();
  
  return users.find(u => {
    const userName = (u.name || '').trim().toLowerCase();
    const userPassword = (u.password || '').trim().toLowerCase();
    return userName === cleanName && userPassword === cleanPassword;
  }) || null;
};

export const getUserById = (id: string): User | null => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

export const getUserByName = (name: string): User | null => {
  const users = getUsers();
  const cleanName = name.trim().toLowerCase();
  return users.find(u => {
    const userName = (u.name || '').trim().toLowerCase();
    return userName === cleanName;
  }) || null;
};

export const deleteUser = (id: string): boolean => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index >= 0) {
    users.splice(index, 1);
    localStorage.setItem('fantasmia_users', JSON.stringify(users));
    return true;
  }
  return false;
};

export const saveStory = async (story: Story) => {
  try {
    // Get authenticated user using AuthBridge
    const authStatus = await AuthBridge.isAuthenticated();
    
    if (!authStatus.authenticated || !authStatus.userName) {
      console.error('No authenticated user found');
      return;
    }
    
    // Get user details by name
    const currentUser = getUserByName(authStatus.userName);
    if (!currentUser) {
      console.error('User not found:', authStatus.userName);
      return;
    }

    // For CSS stories, clean the content to remove questions
    let processedContent = story.content;
    if (story.mode === 'CSS' && story.content) {
      // Extract only the user's answers, not the questions
      const lines = story.content.split('\n\n').filter(line => line.trim());
      processedContent = lines.join('\n\n');
    }

    const storyWithAuthor = {
      ...story,
      content: processedContent,
      authorId: currentUser.id,
      authorName: currentUser.name,
      id: story.id || generateUUID(),
      lastModified: new Date().toISOString()
    };
    
    // Save to user's personal archive
    updateUserStoryArchive(currentUser.id, storyWithAuthor);
    
    // Also save to global stories for compatibility
    const stories = getStories();
    const existingIndex = stories.findIndex(s => s.id === storyWithAuthor.id);
    
    if (existingIndex >= 0) {
      stories[existingIndex] = storyWithAuthor;
    } else {
      stories.push(storyWithAuthor);
    }
    
    localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
    
    // Save to IndexedDB for persistence
    const { saveStoryToCache } = await import('./imageStorage');
    await saveStoryToCache(storyWithAuthor);
    
    // Update directory structure
    const categoryMapping = {
      'GHOST': 'GHOST',
      'PROPP': 'PROPP',
      'PROPP_FREE': 'PROPP',
      'AIROTS': 'AIROTS',
      'PAROLE_CHIAMANO': 'UNA_PAROLA_TANTE_STORIE',
      'ALOVAF': 'UNA_PAROLA_TANTE_STORIE',
      'CAMPBELL': 'CAMPBELL',
      'CSS': 'CSS',
      'PROFESSION': 'PROFESSION'
    };
    
    const category = categoryMapping[story.mode] || 'GHOST';
    updateDirectoryStructure(currentUser.id, category, story.title);
  } catch (error) {
    console.error('Error saving story:', error);
  }
};

// Update directory structure with new file
const updateDirectoryStructure = (userId: string, category: string, fileName: string) => {
  const baseStructureKey = 'fantasmia_directory_structure';
  const existingStructure = JSON.parse(localStorage.getItem(baseStructureKey) || '{}');
  
  if (existingStructure['FANTASMIA'] && 
      existingStructure['FANTASMIA'][userId] && 
      existingStructure['FANTASMIA'][userId][category]) {
    existingStructure['FANTASMIA'][userId][category][`${fileName}.txt`] = {
      created: new Date().toISOString(),
      type: 'file'
    };
  }
  
  localStorage.setItem(baseStructureKey, JSON.stringify(existingStructure));
};

const updateUserStoryArchive = (userId: string, story: Story) => {
  const userArchiveKey = `fantasmia_user_archive_${userId}`;
  const userArchive = JSON.parse(localStorage.getItem(userArchiveKey) || '[]');
  
  const existingIndex = userArchive.findIndex((s: Story) => s.id === story.id);
  if (existingIndex >= 0) {
    userArchive[existingIndex] = story;
  } else {
    userArchive.push(story);
  }
  
  localStorage.setItem(userArchiveKey, JSON.stringify(userArchive));
};

export const getStories = (): Story[] => {
  const stored = localStorage.getItem('fantasmia_stories');
  return stored ? JSON.parse(stored) : [];
};

export const getStoriesForUser = async (userId: string, includePublic: boolean = false): Promise<Story[]> => {
  try {
    // Get user's personal archive da localStorage
    const userArchiveKey = `fantasmia_user_archive_${userId}`;
    let userArchive = JSON.parse(localStorage.getItem(userArchiveKey) || '[]');
    
    // Se non ci sono storie in localStorage, prova a recuperarle da IndexedDB
    if (userArchive.length === 0) {
      try {
        const { getAllStoriesFromCache } = await import('./imageStorage');
        const cachedStories = await getAllStoriesFromCache();
        userArchive = cachedStories.filter((story: Story) => story.authorId === userId);
        
        // Ripristina in localStorage se trovate in IndexedDB
        if (userArchive.length > 0) {
          localStorage.setItem(userArchiveKey, JSON.stringify(userArchive));
        }
      } catch (error) {
        console.warn('Failed to load stories from IndexedDB cache:', error);
      }
    }
    
    // Sort by descending date
    return userArchive.sort((a: Story, b: Story) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  } catch (error) {
    console.error('Error getting stories for user:', error);
    return [];
  }
};

export const getStoriesForUserByName = (userName: string): Promise<Story[]> => {
  return new Promise((resolve) => {
    try {
      const stories = getStories();
      const userStories = stories.filter(story => story.authorName === userName);
      resolve(userStories);
    } catch (error) {
      console.error('Error fetching user stories:', error);
      resolve([]);
    }
  });
};

export const getAllStoriesForSuperuser = async (): Promise<Story[]> => {
  try {
    // Get stories from both Supabase and localStorage, then merge them
    const { data: { session } } = await supabase.auth.getSession();
    
    // Import AuthBridge to check for bridged sessions
    const { AuthBridge } = await import('./authBridge');
    const bridgedSession = AuthBridge.getCurrentBridgedSession();
    
    let supabaseStories: Story[] = [];
    
    if (session || bridgedSession) {
      const { data: supabaseStoriesData, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && supabaseStoriesData) {
        // Convert Supabase format to local Story format
        supabaseStories = supabaseStoriesData.map(story => ({
          id: story.id,
          title: story.title,
          content: story.content || '',
          status: story.status as 'completed' | 'suspended' | 'in-progress',
          lastModified: story.updated_at || story.created_at,
          mode: (story.mode || story.category) as 'GHOST' | 'PROPP' | 'PROPP_FREE' | 'AIROTS' | 'PAROLE_CHIAMANO' | 'ALOVAF' | 'CAMPBELL' | 'CSS' | 'PROFESSION',
          authorId: story.author_id || story.user_id,
          authorName: story.author_name || story.user_name || 'Utente Sconosciuto',
          isPublic: story.is_public || false,
          language: (story.language || 'italian') as 'italian' | 'english'
        }));
      }
    }
    
    // Get localStorage stories
    const localStories = getStories();
    const users = getUsers();
    
    // Get all user archives to include user personal stories
    const allUserStories: Story[] = [];
    for (const user of users) {
      if (user.name !== 'superuser') {  // Exclude Superuser's own stories
        const userArchive = await getStoriesForUser(user.id);
        allUserStories.push(...userArchive);
      }
    }
    
    // Process localStorage stories and ensure proper author names
    const processedLocalStories = localStories.map(story => {
      const user = users.find(u => u.id === story.authorId);
      return {
        ...story,
        authorName: user ? user.name : story.authorName || 'Utente Sconosciuto'
      };
    });
    
    // Merge all stories, avoiding duplicates based on ID
    const allStories = [...supabaseStories];
    
    // Add user archive stories first
    allUserStories.forEach(userStory => {
      if (!allStories.find(story => story.id === userStory.id)) {
        allStories.push(userStory);
      }
    });
    
    // Then add processed localStorage stories
    processedLocalStories.forEach(localStory => {
      if (!allStories.find(story => story.id === localStory.id)) {
        allStories.push(localStory);
      }
    });
    
    // Sort by most recent modification
    return allStories.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  } catch (error) {
    console.error('Error fetching stories:', error);
    // Fallback to localStorage and user archives
    const localStories = getStories();
    const users = getUsers();
    
    // Get all user archives as fallback
    const allUserStories: Story[] = [];
    for (const user of users) {
      if (user.name !== 'superuser') {  // Exclude Superuser's own stories
        const userArchive = await getStoriesForUser(user.id);
        allUserStories.push(...userArchive);
      }
    }
    
    const processedLocalStories = localStories.map(story => {
      const user = users.find(u => u.id === story.authorId);
      return {
        ...story,
        authorName: user ? user.name : story.authorName || 'Utente Sconosciuto'
      };
    });
    
    const allStories = [...allUserStories];
    processedLocalStories.forEach(localStory => {
      if (!allStories.find(story => story.id === localStory.id)) {
        allStories.push(localStory);
      }
    });
    
    return allStories.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }
};

export const getAllAuthors = async (): Promise<string[]> => {
  const allStories = await getAllStoriesForSuperuser();
  const authors = Array.from(new Set(allStories.map(story => story.authorName).filter(Boolean)));
  return authors.sort();
};

export const updateStory = async (storyId: string, updates: Partial<Story>) => {
  try {
    const stories = getStories();
    const existingIndex = stories.findIndex(s => s.id === storyId);
    
    if (existingIndex >= 0) {
      stories[existingIndex] = { ...stories[existingIndex], ...updates, lastModified: new Date().toISOString() };
      localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
      
      // Also update in user's personal archive
      const authStatus = await AuthBridge.isAuthenticated();
      if (authStatus.authenticated && authStatus.userName) {
        const currentUser = getUserByName(authStatus.userName);
        if (currentUser) {
          updateUserStoryArchive(currentUser.id, stories[existingIndex]);
        }
      }
    }
  } catch (error) {
    console.error('Error updating story:', error);
  }
};

export const deleteStory = (storyId: string): boolean => {
  try {
    // Delete from main stories
    const stories = getStories();
    const storyIndex = stories.findIndex(s => s.id === storyId);
    
    if (storyIndex >= 0) {
      const deletedStory = stories[storyIndex];
      stories.splice(storyIndex, 1);
      localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
      
      // Also delete from user's personal archive
      const userArchiveKey = `fantasmia_user_archive_${deletedStory.authorId}`;
      const userArchive = JSON.parse(localStorage.getItem(userArchiveKey) || '[]');
      const userStoryIndex = userArchive.findIndex((s: Story) => s.id === storyId);
      
      if (userStoryIndex >= 0) {
        userArchive.splice(userStoryIndex, 1);
        localStorage.setItem(userArchiveKey, JSON.stringify(userArchive));
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting story:', error);
    return false;
  }
};

export const getStoryById = (id: string): Story | null => {
  const stories = getStories();
  return stories.find(s => s.id === id) || null;
};

// Story Images Management
interface StoryImage {
  storyId: string;
  imageCount: number;
  lastImageCreated: string;
}

export const markStoryAsHavingImages = (storyId: string) => {
  const images = getStoryImages();
  const existingIndex = images.findIndex(img => img.storyId === storyId);
  
  if (existingIndex >= 0) {
    images[existingIndex] = {
      ...images[existingIndex],
      imageCount: images[existingIndex].imageCount + 1,
      lastImageCreated: new Date().toISOString()
    };
  } else {
    images.push({
      storyId,
      imageCount: 1,
      lastImageCreated: new Date().toISOString()
    });
  }
  
  localStorage.setItem('fantasmia_story_images', JSON.stringify(images));
};

export const getStoryImages = (): StoryImage[] => {
  const stored = localStorage.getItem('fantasmia_story_images');
  return stored ? JSON.parse(stored) : [];
};

export const hasStoryImages = (storyId: string): boolean => {
  const images = getStoryImages();
  const storyImage = images.find(img => img.storyId === storyId);
  return storyImage ? storyImage.imageCount > 0 : false;
};

// Reading Stories Management (for superuser-curated stories)
export interface ReadingStory {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: string;
  image_url?: string;
  category?: string;
}

export const saveReadingStory = async (story: ReadingStory) => {
  // Mark as superuser story for public access
  const storyWithMeta = {
    ...story,
    author: 'superuser',
    category: 'reading_story',
    updated_at: new Date().toISOString()
  };
  
  const stories = getReadingStories();
  const existingIndex = stories.findIndex(s => s.id === story.id);
  
  if (existingIndex >= 0) {
    stories[existingIndex] = storyWithMeta;
  } else {
    stories.push(storyWithMeta);
  }
  
  localStorage.setItem('fantasmia_reading_stories', JSON.stringify(stories));
  
  // Save to IndexedDB for persistence
  try {
    const { saveStoryToCache } = await import('./imageStorage');
    await saveStoryToCache(storyWithMeta);
  } catch (error) {
    console.warn('Failed to save reading story to IndexedDB:', error);
  }
};

export const getReadingStories = (): ReadingStory[] => {
  const stored = localStorage.getItem('fantasmia_reading_stories');
  return stored ? JSON.parse(stored) : [];
};

export const updateReadingStory = (id: string, updates: Partial<ReadingStory>) => {
  const stories = getReadingStories();
  const storyIndex = stories.findIndex(s => s.id === id);
  
  if (storyIndex >= 0) {
    stories[storyIndex] = { 
      ...stories[storyIndex], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    localStorage.setItem('fantasmia_reading_stories', JSON.stringify(stories));
  }
};

export const deleteReadingStory = (id: string): boolean => {
  const stories = getReadingStories();
  const storyIndex = stories.findIndex(s => s.id === id);
  
  if (storyIndex >= 0) {
    stories.splice(storyIndex, 1);
    localStorage.setItem('fantasmia_reading_stories', JSON.stringify(stories));
    return true;
  }
  return false;
};

// Science Stories Management (new feature)
export interface ScienceStory {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: string;
  image_url?: string;
  category?: string;
}

export const saveScienceStory = async (story: ScienceStory) => {
  // Mark as superuser story for public access
  const storyWithMeta = {
    ...story,
    author: 'superuser',
    category: 'science_story',
    updated_at: new Date().toISOString()
  };
  
  const stories = getScienceStories();
  const existingIndex = stories.findIndex(s => s.id === story.id);
  
  if (existingIndex >= 0) {
    stories[existingIndex] = storyWithMeta;
  } else {
    stories.push(storyWithMeta);
  }
  
  localStorage.setItem('fantasmia_science_stories', JSON.stringify(stories));
  
  // Save to IndexedDB for persistence
  try {
    const { saveStoryToCache } = await import('./imageStorage');
    await saveStoryToCache(storyWithMeta);
  } catch (error) {
    console.warn('Failed to save science story to IndexedDB:', error);
  }
};

export const getScienceStories = (): ScienceStory[] => {
  const stored = localStorage.getItem('fantasmia_science_stories');
  return stored ? JSON.parse(stored) : [];
};

export const updateScienceStory = (id: string, updates: Partial<ScienceStory>) => {
  const stories = getScienceStories();
  const storyIndex = stories.findIndex(s => s.id === id);
  
  if (storyIndex >= 0) {
    stories[storyIndex] = { 
      ...stories[storyIndex], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    localStorage.setItem('fantasmia_science_stories', JSON.stringify(stories));
  }
};

export const deleteScienceStory = (id: string): boolean => {
  const stories = getScienceStories();
  const storyIndex = stories.findIndex(s => s.id === id);
  
  if (storyIndex >= 0) {
    stories.splice(storyIndex, 1);
    localStorage.setItem('fantasmia_science_stories', JSON.stringify(stories));
    return true;
  }
  return false;
};

// Published Stories Management (for public archive)
export interface PublishedStory {
  id: string;
  title: string;
  content: string;
  published_at: string;
  original_author: string;
  image_url?: string;
}

export const publishStoryFromArchive = (storyId: string, authorName?: string) => {
  const story = getStoryById(storyId);
  if (!story) return false;

  const publishedStories = getPublishedStories();
  const existingIndex = publishedStories.findIndex(s => s.id === storyId);
  
  const publishedStory: PublishedStory = {
    id: storyId,
    title: story.title,
    content: story.content || '',
    published_at: new Date().toISOString(),
    original_author: authorName || story.authorName
  };

  if (existingIndex >= 0) {
    publishedStories[existingIndex] = publishedStory;
  } else {
    publishedStories.push(publishedStory);
  }
  
  localStorage.setItem('fantasmia_published_stories', JSON.stringify(publishedStories));
  return true;
};

export const unpublishStory = (storyId: string): boolean => {
  const publishedStories = getPublishedStories();
  const storyIndex = publishedStories.findIndex(s => s.id === storyId);
  
  if (storyIndex >= 0) {
    publishedStories.splice(storyIndex, 1);
    localStorage.setItem('fantasmia_published_stories', JSON.stringify(publishedStories));
    return true;
  }
  return false;
};

export const getPublishedStories = (): PublishedStory[] => {
  const stored = localStorage.getItem('fantasmia_published_stories');
  const stories = stored ? JSON.parse(stored) : [];
  // Sort alphabetically by title
  return stories.sort((a: PublishedStory, b: PublishedStory) => a.title.localeCompare(b.title));
};

export const isStoryPublished = (storyId: string): boolean => {
  const publishedStories = getPublishedStories();
  return publishedStories.some(story => story.id === storyId);
};

// Missing exports for compatibility
export const authenticateUser = (nameOrEmail: string, password: string) => {
  // First try to authenticate by name (for normal users)
  const userByName = getUserByNameAndPassword(nameOrEmail, password);
  if (userByName) {
    return userByName;
  }
  
  // If that fails, try by email (for backward compatibility)
  return getUserByEmailAndPassword(nameOrEmail, password);
};

export const sendMessage = (fromUserId: string, targetUsers: string[] | string, content: string, isBroadcast?: boolean) => {
  // Placeholder implementation
  console.log('Message sent:', { fromUserId, targetUsers, content, isBroadcast });
};

export const markMessagesAsRead = (userId: string) => {
  // Placeholder implementation
  console.log('Messages marked as read for user:', userId);
};

export const initializeDirectoryStructureForExistingUsers = () => {
  // Placeholder implementation
  console.log('Directory structure initialized');
};