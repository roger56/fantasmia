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
  // Try to save to Supabase first, then fallback to localStorage
  try {
    // Check for both real Supabase session and bridged session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Import AuthBridge dynamically to avoid circular dependency
    const { AuthBridge } = await import('./authBridge');
    const bridgedSession = AuthBridge.getCurrentBridgedSession();
    
    if (session || bridgedSession) {
      // Determine user ID and name
      let userId = session?.user.id;
      let userName = story.authorName;
      
      if (bridgedSession && !session) {
        // Use bridged session data
        userId = bridgedSession.user.id;
        userName = bridgedSession.user.user_metadata?.name || story.authorName;
      }
      
      // User è autenticato - salva in Supabase
      const storyData = {
        title: story.title,
        content: story.content || '',
        category: story.mode,
        mode: story.mode,
        status: story.status,
        user_id: userId,
        author_id: userId,
        author_name: userName, // Il trigger automaticamente lo correggerà se necessario
        user_name: userName,
        is_public: story.isPublic || false,
        language: story.language || 'italian'
      };

      const { data, error } = await supabase
        .from('stories')
        .insert([storyData])
        .select()
        .single();

      if (error) {
        console.error('Errore salvataggio Supabase:', error);
        // Fallback a localStorage
        saveStoryToLocalStorage(story);
      } else {
        console.log('Storia salvata in Supabase:', data);
        // Salva anche in localStorage per compatibilità
        const storyWithSupabaseData = {
          ...story,
          id: data.id,
          authorName: data.author_name || data.user_name || story.authorName
        };
        saveStoryToLocalStorage(storyWithSupabaseData);
      }
    } else {
      // User non autenticato - salva solo in localStorage
      console.log('Utente non autenticato, salvataggio in localStorage');
      saveStoryToLocalStorage(story);
    }
  } catch (error) {
    console.error('Errore during save:', error);
    // Fallback a localStorage
    saveStoryToLocalStorage(story);
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
          mode: (story.mode || story.category) as 'GHOST' | 'PROPP' | 'PROPP_FREE' | 'AIROTS' | 'PAROLE_CHIAMANO' | 'CAMPBELL' | 'CSS',
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
