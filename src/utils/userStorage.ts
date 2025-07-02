
interface User {
  id: string;
  name: string;
  email?: string;
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

interface Story {
  id: string;
  title: string;
  content?: string;
  status: 'completed' | 'suspended' | 'in-progress';
  lastModified: string;
  mode: 'GHOST' | 'PROPP' | 'ALOVAF' | 'PAROLE_CHIAMANO';
  authorId: string;
  authorName: string;
  isPublic: boolean;
}

export const saveUser = (user: User) => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem('fantasmia_users', JSON.stringify(users));
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

export const saveStory = (story: Story) => {
  const stories = getStories();
  const existingIndex = stories.findIndex(s => s.id === story.id);
  
  if (existingIndex >= 0) {
    stories[existingIndex] = story;
  } else {
    stories.push(story);
  }
  
  localStorage.setItem('fantasmia_stories', JSON.stringify(stories));
};

export const getStories = (): Story[] => {
  const stored = localStorage.getItem('fantasmia_stories');
  return stored ? JSON.parse(stored) : [];
};

export const getStoriesForUser = (userId: string, includePublic: boolean = false): Story[] => {
  const stories = getStories();
  return stories.filter(s => s.authorId === userId || (includePublic && s.isPublic));
};
