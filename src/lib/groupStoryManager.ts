// Group Story Manager - Gestisce storie di gruppo collaborative
import { fantasMiaDB } from '@/utils/indexedDB';
import { createAGStory } from '@/lib/storiesRepo';

interface GroupStory {
  id: string;
  title?: string;
  status: 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  finalAGStoryId?: string;
}

interface GroupStoryContribution {
  id: string;
  groupStoryId: string;
  userId: string;
  userName: string;
  content: string;
  orderIndex: number;
  createdAt: string;
}

interface CompletionCheck {
  canComplete: boolean;
  reason?: string;
  contributionCount: number;
  uniqueUsers: number;
  containsEndPhrase: boolean;
}

const generateId = () => `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Get or create the current active group story
 */
export const getOrCreateActiveGroupStory = async (): Promise<GroupStory> => {
  const inProgressStories = await fantasMiaDB.getGroupStoriesByStatus('in_progress');
  
  if (inProgressStories.length > 0) {
    // Return most recent in-progress story
    inProgressStories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return inProgressStories[0];
  }
  
  // Create new group story
  const newStory: GroupStory = {
    id: generateId(),
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await fantasMiaDB.saveGroupStory(newStory);
  return newStory;
};

/**
 * Add a contribution to the group story
 */
export const addContribution = async (
  groupStoryId: string,
  userId: string,
  userName: string,
  content: string
): Promise<{ success: boolean; error?: string; completed?: boolean; agStoryId?: string }> => {
  try {
    const groupStory = await fantasMiaDB.getGroupStoryById(groupStoryId);
    if (!groupStory) {
      return { success: false, error: 'Storia di gruppo non trovata' };
    }
    
    if (groupStory.status === 'completed') {
      return { success: false, error: 'Questa storia è già stata completata' };
    }
    
    // Get existing contributions
    const contributions = await fantasMiaDB.getContributionsByGroupStoryId(groupStoryId);
    
    // Check if user is the last contributor (cannot write consecutive contributions)
    if (contributions.length > 0) {
      const lastContribution = contributions[contributions.length - 1];
      if (lastContribution.userId === userId) {
        return { success: false, error: 'Non puoi scrivere due contributi consecutivi. Attendi che un altro utente contribuisca.' };
      }
    }
    
    // Create new contribution
    const newContribution: GroupStoryContribution = {
      id: generateId(),
      groupStoryId,
      userId,
      userName,
      content,
      orderIndex: contributions.length,
      createdAt: new Date().toISOString()
    };
    
    await fantasMiaDB.saveGroupStoryContribution(newContribution);
    
    // Update group story timestamp
    groupStory.updatedAt = new Date().toISOString();
    await fantasMiaDB.saveGroupStory(groupStory);
    
    // Check completion conditions
    const completionCheck = await checkCompletionConditions(groupStoryId);
    
    if (completionCheck.canComplete) {
      // Complete and migrate to AG
      const agStoryId = await completeAndMigrateToAG(groupStoryId);
      return { success: true, completed: true, agStoryId };
    }
    
    return { success: true, completed: false };
  } catch (error) {
    console.error('Error adding contribution:', error);
    return { success: false, error: 'Errore durante il salvataggio del contributo' };
  }
};

/**
 * Get the last line of the last contribution
 */
export const getLastLine = async (groupStoryId: string): Promise<string | null> => {
  const contributions = await fantasMiaDB.getContributionsByGroupStoryId(groupStoryId);
  
  if (contributions.length === 0) {
    return null;
  }
  
  const lastContribution = contributions[contributions.length - 1];
  const lines = lastContribution.content.trim().split('\n');
  return lines[lines.length - 1] || null;
};

/**
 * Check if the story can be completed
 */
export const checkCompletionConditions = async (groupStoryId: string): Promise<CompletionCheck> => {
  const contributions = await fantasMiaDB.getContributionsByGroupStoryId(groupStoryId);
  
  if (contributions.length < 3) {
    return {
      canComplete: false,
      reason: 'Servono almeno 3 contributi',
      contributionCount: contributions.length,
      uniqueUsers: 0,
      containsEndPhrase: false
    };
  }
  
  // Count unique users
  const uniqueUsers = new Set(contributions.map(c => c.userId)).size;
  
  if (uniqueUsers < 2) {
    return {
      canComplete: false,
      reason: 'Servono almeno 2 utenti diversi',
      contributionCount: contributions.length,
      uniqueUsers,
      containsEndPhrase: false
    };
  }
  
  // Check if last contribution contains "felici e contenti" (case-insensitive)
  const lastContribution = contributions[contributions.length - 1];
  const containsEndPhrase = lastContribution.content.toLowerCase().includes('felici e contenti');
  
  if (!containsEndPhrase) {
    return {
      canComplete: false,
      reason: 'L\'ultimo contributo deve contenere "felici e contenti"',
      contributionCount: contributions.length,
      uniqueUsers,
      containsEndPhrase: false
    };
  }
  
  return {
    canComplete: true,
    contributionCount: contributions.length,
    uniqueUsers,
    containsEndPhrase: true
  };
};

/**
 * Complete the group story and migrate it to AG
 */
const completeAndMigrateToAG = async (groupStoryId: string): Promise<string> => {
  const groupStory = await fantasMiaDB.getGroupStoryById(groupStoryId);
  if (!groupStory) {
    throw new Error('Group story not found');
  }
  
  const contributions = await fantasMiaDB.getContributionsByGroupStoryId(groupStoryId);
  
  // Assemble full story text
  const fullText = contributions.map(c => c.content).join('\n\n');
  
  // Create AG story
  const agStoryId = await createAGStory('group', {
    title: groupStory.title || `Storia di gruppo #${groupStoryId.slice(-8)}`,
    text: fullText,
    category: 'world', // Reading stories category
  });
  
  // Mark group story as completed
  groupStory.status = 'completed';
  groupStory.completedAt = new Date().toISOString();
  groupStory.finalAGStoryId = agStoryId;
  await fantasMiaDB.saveGroupStory(groupStory);
  
  console.log('✅ Group story completed and migrated to AG:', agStoryId);
  
  return agStoryId;
};

/**
 * Get contribution statistics for a group story
 */
export const getGroupStoryStats = async (groupStoryId: string): Promise<{
  totalContributions: number;
  uniqueUsers: number;
  lastContributor: string | null;
}> => {
  const contributions = await fantasMiaDB.getContributionsByGroupStoryId(groupStoryId);
  
  return {
    totalContributions: contributions.length,
    uniqueUsers: new Set(contributions.map(c => c.userId)).size,
    lastContributor: contributions.length > 0 
      ? contributions[contributions.length - 1].userName 
      : null
  };
};
