import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  name: string;
  email?: string;
  age?: number;
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
  mode: 'GHOST' | 'PROPP' | 'PROPP_FREE' | 'AIROTS' | 'PAROLE_CHIAMANO' | 'CAMPBELL' | 'CSS';
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
  const categories = ['GHOST', 'PROPP', 'AIROTS', 'UNA_PAROLA_TANTE_STORIE', 'CAMPBELL', 'CSS'];
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
    id: Date.now().toString(),
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
  // PRIMARIO: salvataggio localStorage (sempre attivo)
  saveStoryToLocalStorage(story);
  console.log('✅ Storia salvata in localStorage');
  
  // OPZIONALE: sync cloud (solo se CLOUD_ENABLED)
  const { CLOUD_ENABLED, supabase } = await import('@/integrations/supabase/client');
  
  if (!CLOUD_ENABLED || !supabase) {
    console.log('🔒 Cloud sync disabilitato - solo IndexedDB');
    return;
  }
  
  // Try cloud sync (non-blocking)
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { AuthBridge } = await import('./authBridge');
    const bridgedSession = AuthBridge.getCurrentBridgedSession();
    
    if (session || bridgedSession) {
      let userId = session?.user.id;
      let userName = story.authorName;
      
      if (bridgedSession && !session) {
        userId = bridgedSession.user.id;
        userName = bridgedSession.user.user_metadata?.name || story.authorName;
      }
      
      const storyData = {
        title: story.title,
        content: story.content || '',
        category: story.mode,
        mode: story.mode,
        status: story.status,
        user_id: userId,
        author_id: userId,
        author_name: userName,
        user_name: userName,
        is_public: story.isPublic || false,
        language: story.language || 'italian'
      };

      const { data, error } = await (supabase as any)
        .from('stories')
        .insert([storyData])
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Cloud sync fallito (non bloccante):', error);
      } else {
        console.log('☁️ Storia sincronizzata su cloud:', data);
      }
    }
  } catch (error) {
    console.warn('⚠️ Cloud sync error (non bloccante):', error);
  }
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
  const categories = ['GHOST', 'PROPP', 'AIROTS', 'UNA_PAROLA_TANTE_STORIE', 'CAMPBELL', 'CSS'];
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
    const { CLOUD_ENABLED, supabase } = await import('@/integrations/supabase/client');
    
    let supabaseStories: Story[] = [];
    
    // Only try cloud if enabled
    if (CLOUD_ENABLED && supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { AuthBridge } = await import('./authBridge');
        const bridgedSession = AuthBridge.getCurrentBridgedSession();
        
        if (session || bridgedSession) {
          const { data: supabaseStoriesData, error } = await (supabase as any)
            .from('stories')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && supabaseStoriesData) {
            supabaseStories = supabaseStoriesData.map((story: any) => ({
              id: story.id,
              title: story.title,
              content: story.content || '',
              status: story.status as 'completed' | 'suspended' | 'in-progress',
              lastModified: story.updated_at || story.created_at,
              mode: (story.mode || story.category) as 'GHOST' | 'PROPP' | 'PROPP_FREE' | 'AIROTS' | 'PAROLE_CHIAMANO' | 'CAMPBELL' | 'CSS',
              authorId: story.author_id || story.user_id,
              authorName: story.author_name || story.user_name || 'Utente Sconosciuto',
              isPublic: story.is_public || false,
              language: (story.language || 'italian') as 'italian' | 'english'
            }));
          }
        }
      } catch (cloudError) {
        console.warn('⚠️ Cloud fetch fallito, uso solo localStorage:', cloudError);
      }
    }
    
    // Always get localStorage stories
    const localStories = getStories();
    const users = getUsers();
    
    const processedLocalStories = localStories.map(story => {
      const user = users.find(u => u.id === story.authorId);
      return {
        ...story,
        authorName: user?.name || story.authorName || 'Utente Sconosciuto'
      };
    });
    
    // Merge stories, removing duplicates
    const allStories = [...supabaseStories];
    
    processedLocalStories.forEach(localStory => {
      const existsInSupabase = supabaseStories.some(supabaseStory => 
        supabaseStory.title === localStory.title && 
        supabaseStory.authorName === localStory.authorName
      );
      
      if (!existsInSupabase) {
        allStories.push(localStory);
      }
    });
    
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

// Delete specific story by title
export const deleteStoryByTitle = (title: string): boolean => {
  const stories = getStories();
  const storyIndex = stories.findIndex(s => s.title === title);
  
  if (storyIndex >= 0) {
    stories.splice(storyIndex, 1);
    localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
    return true;
  }
  return false;
};

// Auto-delete the specific unwanted stories
(() => {
  deleteStoryByTitle("RUSSIA : UN IDIOTA PATENTATO");
  deleteStoryByTitle("IL CAVALIERE DELLE BOLLE DI SAPONE");
  
  // Clean all user archives from these specific stories
  const allUsers = getUsers();
  allUsers.forEach(user => {
    const userArchiveKey = `fantasmia_user_archive_${user.id}`;
    const userArchive = JSON.parse(localStorage.getItem(userArchiveKey) || '[]');
    const filteredArchive = userArchive.filter((story: Story) => 
      story.title !== "RUSSIA : UN IDIOTA PATENTATO" && 
      story.title !== "IL CAVALIERE DELLE BOLLE DI SAPONE"
    );
    localStorage.setItem(userArchiveKey, JSON.stringify(filteredArchive));
  });
})();

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

// Reading Stories Management (SuperUser only)
export interface ReadingStory {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  category?: string; // For categorization (science, magic, general)
  authorId?: string; // Author ID
  authorName?: string; // Author name
}

export const saveReadingStory = (story: ReadingStory) => {
  const existingStories = getReadingStories();
  const index = existingStories.findIndex(s => s.id === story.id);
  
  // Add category based on story type for better categorization
  // Ensure authorId and authorName are set for superuser stories
  const storyWithCategory = {
    ...story,
    category: story.category || 'general', // Default category
    updated_at: new Date().toISOString(),
    authorId: story.authorId || 'superuser',
    authorName: story.authorName || 'superuser'
  };
  
  if (index >= 0) {
    existingStories[index] = storyWithCategory;
  } else {
    existingStories.push(storyWithCategory);
  }
  
  localStorage.setItem('fantasmia_reading_stories', JSON.stringify(existingStories));
};

// Story Image Management
export interface StoryImage {
  id: string;
  storyId: string;
  imageUrl: string;
  style: string;
  created_at: string;
}

export const saveStoryImage = (storyId: string, imageUrl: string, style: string) => {
  const images = getStoryImages();
  const newImage: StoryImage = {
    id: Date.now().toString(),
    storyId,
    imageUrl,
    style,
    created_at: new Date().toISOString()
  };
  
  // Remove existing image for this story
  const filteredImages = images.filter(img => img.storyId !== storyId);
  filteredImages.push(newImage);
  
  localStorage.setItem('fantasmia_story_images', JSON.stringify(filteredImages));
};

export const getStoryImages = (): StoryImage[] => {
  const stored = localStorage.getItem('fantasmia_story_images');
  return stored ? JSON.parse(stored) : [];
};

export const getStoryImage = (storyId: string): StoryImage | null => {
  const images = getStoryImages();
  return images.find(img => img.storyId === storyId) || null;
};

export const deleteStoryImage = (storyId: string) => {
  const images = getStoryImages();
  const filteredImages = images.filter(img => img.storyId !== storyId);
  localStorage.setItem('fantasmia_story_images', JSON.stringify(filteredImages));
};

export const getReadingStories = (): ReadingStory[] => {
  const stored = localStorage.getItem('fantasmia_reading_stories');
  return stored ? JSON.parse(stored) : [];
};

// Get reading stories for normal users - only stories created by superuser
export const getReadingStoriesForUser = (): ReadingStory[] => {
  const stories = getReadingStories();
  // Only return stories created by superuser (these are the "Archivio Generale" stories)
  return stories.filter(story => 
    story.authorId === 'superuser' || 
    story.authorId === 'Superuser' ||
    story.authorName === 'superuser' ||
    story.authorName === 'Superuser'
  ).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
};

// Get all reading stories for superuser management
export const getAllReadingStoriesForSuperuser = (): ReadingStory[] => {
  const stories = getReadingStories();
  return stories.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
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
