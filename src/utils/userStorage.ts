import { supabase } from '@/integrations/supabase/client';

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
  mode: 'GHOST' | 'PROPP' | 'PROPP_FREE' | 'AIROTS' | 'PAROLE_CHIAMANO' | 'CAMPBELL' | 'CSS' | 'PROFESSION';
  authorId: string;
  authorName: string;
  isPublic: boolean;
  language?: 'italian' | 'english';
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

export const getUserById = (id: string): User | null => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

export const authenticateUser = (name: string, password: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
  
  if (user && user.password.toLowerCase() === password.toLowerCase()) {
    // Update last access
    user.lastAccess = new Date().toISOString();
    saveUser(user);
    return user;
  }
  
  return null;
};

export const sendMessage = (fromUserId: string, toUserIds: string[], content: string, isBroadcast: boolean = false) => {
  const users = getUsers();
  const message: Message = {
    id: generateUUID(),
    from: fromUserId,
    content,
    timestamp: new Date().toISOString(),
    read: false
  };

  const targetUsers = isBroadcast ? users : users.filter(u => toUserIds.includes(u.id));
  
  targetUsers.forEach(user => {
    if (!user.unreadMessages) user.unreadMessages = [];
    user.unreadMessages.push(message);
    saveUser(user);
  });
};

export const markMessagesAsRead = (userId: string) => {
  const user = getUserById(userId);
  if (user && user.unreadMessages) {
    user.unreadMessages = user.unreadMessages.map(m => ({ ...m, read: true }));
    saveUser(user);
  }
};

export const saveStory = async (story: Story) => {
  // Always save to localStorage for now (to fix mobile issues)
  console.log('Saving story to localStorage:', story.title);
  saveStoryToLocalStorage(story);
};

// Funzione separata per il salvataggio localStorage (per compatibilità)
const saveStoryToLocalStorage = (story: Story) => {
  const stories = getStories();
  const existingIndex = stories.findIndex(s => s.id === story.id);
  
  // Ensure user directory structure exists
  ensureUserDirectoryStructure(story.authorId);
  
  // Create organized path according to specifications
  const documentPath = `/Documenti/FANTASMIA/${story.authorId}/${story.mode}/${story.title}.txt`;
  
  // Add path to story
  const storyWithPath = {
    ...story,
    documentPath,
    createdAt: story.lastModified,
    category: story.mode // For compatibility with database
  };
  
  if (existingIndex >= 0) {
    stories[existingIndex] = storyWithPath;
  } else {
    stories.push(storyWithPath);
  }
  
  localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
  
  // Update user's personal archive - FIXED: ensure stories appear in personal archive
  updateUserStoryArchive(story.authorId, storyWithPath);
  
  // Update directory structure
  updateDirectoryStructure(story.authorId, story.mode, story.title);
};

// Ensure user directory structure exists
const ensureUserDirectoryStructure = (userId: string) => {
  const categories = ['GHOST', 'PROPP', 'AIROTS', 'UNA_PAROLA_TANTE_STORIE', 'CAMPBELL', 'CSS', 'PROFESSION'];
  const baseStructureKey = 'fantasmia_directory_structure';
  
  const existingStructure = JSON.parse(localStorage.getItem(baseStructureKey) || '{}');
  
  if (!existingStructure['FANTASMIA']) {
    existingStructure['FANTASMIA'] = {};
  }
  
  if (!existingStructure['FANTASMIA'][userId]) {
    existingStructure['FANTASMIA'][userId] = {};
  }
  
  categories.forEach(category => {
    if (!existingStructure['FANTASMIA'][userId][category]) {
      existingStructure['FANTASMIA'][userId][category] = {};
    }
  });
  
  localStorage.setItem(baseStructureKey, JSON.stringify(existingStructure));
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

export const getStoriesForUser = (userId: string, includePublic: boolean = false): Story[] => {
  // Get user's personal archive
  const userArchiveKey = `fantasmia_user_archive_${userId}`;
  const userArchive = JSON.parse(localStorage.getItem(userArchiveKey) || '[]');
  
  // Sort by descending date
  return userArchive.sort((a: Story, b: Story) => 
    new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );
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
          mode: (story.mode || story.category) as 'GHOST' | 'PROPP' | 'PROPP_FREE' | 'AIROTS' | 'PAROLE_CHIAMANO' | 'CAMPBELL' | 'CSS' | 'PROFESSION',
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
    
    // Process localStorage stories and ensure proper author names
    const processedLocalStories = localStories.map(story => {
      const user = users.find(u => u.id === story.authorId);
      return {
        ...story,
        authorName: user?.name || story.authorName || 'Utente Sconosciuto'
      };
    });
    
    // Merge stories from both sources, removing duplicates by title and author
    const allStories = [...supabaseStories];
    
    processedLocalStories.forEach(localStory => {
      // Check if this story already exists in Supabase stories
      const existsInSupabase = supabaseStories.some(supabaseStory => 
        supabaseStory.title === localStory.title && 
        supabaseStory.authorName === localStory.authorName
      );
      
      if (!existsInSupabase) {
        allStories.push(localStory);
      }
    });
    
    // Sort by descending date
    return allStories.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  } catch (error) {
    console.error('Error fetching stories:', error);
    
    // Complete fallback to localStorage only
    const stories = getStories();
    const users = getUsers();
    
    return stories
      .map(story => {
        const user = users.find(u => u.id === story.authorId);
        return {
          ...story,
          authorName: user?.name || story.authorName || 'Utente Sconosciuto'
        };
      })
      .sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
  }
};

export const getStoriesByCategory = (category: string): Story[] => {
  const stories = getStories();
  return stories
    .filter(s => s.mode === category)
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
};

export const getStoriesByUserAndCategory = (userId: string, category: string): Story[] => {
  const userStories = getStoriesForUser(userId);
  return userStories.filter(s => s.mode === category);
};

export const getStoryById = (storyId: string): Story | null => {
  const stories = getStories();
  return stories.find(s => s.id === storyId) || null;
};

export const updateStory = (storyId: string, updates: Partial<Story>) => {
  const stories = getStories();
  const storyIndex = stories.findIndex(s => s.id === storyId);
  
  if (storyIndex >= 0) {
    stories[storyIndex] = { ...stories[storyIndex], ...updates, lastModified: new Date().toISOString() };
    localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
  }
};

export const deleteStory = (storyId: string): boolean => {
  const stories = getStories();
  const storyIndex = stories.findIndex(s => s.id === storyId);
  
  if (storyIndex >= 0) {
    stories.splice(storyIndex, 1);
    localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
    return true;
  }
  return false;
};

// Initialize directory structure for existing users
export const initializeDirectoryStructureForExistingUsers = () => {
  const users = getUsers();
  users.forEach(user => {
    ensureUserDirectoryStructure(user.id);
  });
};

// Get directory structure for navigation
export const getDirectoryStructure = () => {
  const baseStructureKey = 'fantasmia_directory_structure';
  return JSON.parse(localStorage.getItem(baseStructureKey) || '{}');
};

// Get files in a specific directory
export const getFilesInDirectory = (userId: string, category: string): string[] => {
  const structure = getDirectoryStructure();
  if (structure['FANTASMIA'] && 
      structure['FANTASMIA'][userId] && 
      structure['FANTASMIA'][userId][category]) {
    return Object.keys(structure['FANTASMIA'][userId][category]);
  }
  return [];
};

// Get all unique authors from stories
export const getAllAuthors = async (): Promise<string[]> => {
  const stories = await getAllStoriesForSuperuser();
  const uniqueAuthors = new Set(stories.map(story => story.authorName));
  return Array.from(uniqueAuthors).sort();
};

// Published Stories (for public reading)
export interface PublishedStory {
  id: string;
  title: string;
  content: string;
  published_at: string;
  original_author?: string;
}

// Reading Stories Management (SuperUser only)
export interface ReadingStory {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Story Images Tracking
export interface StoryImage {
  storyId: string;
  imageCount: number;
  lastImageCreated: string;
}

export const saveStoryImage = (storyId: string) => {
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

export const saveReadingStory = (story: ReadingStory) => {
  const stories = getReadingStories();
  const existingIndex = stories.findIndex(s => s.id === story.id);
  
  if (existingIndex >= 0) {
    stories[existingIndex] = { ...story, updated_at: new Date().toISOString() };
  } else {
    stories.push(story);
  }
  
  localStorage.setItem('fantasmia_reading_stories', JSON.stringify(stories));
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

// Published Stories Management (for public archive)
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
