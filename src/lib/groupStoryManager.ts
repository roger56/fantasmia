// Group Story Manager - Gestisce storie di gruppo collaborative
import { fantasMiaDB } from '@/utils/indexedDB';
import { createAGStory } from '@/lib/storiesRepo';

interface GroupStory {
  id: string;
  title?: string;
  status: 'in_progress' | 'pending_approval' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  finalAGStoryId?: string;
  approvedBy?: string;
  approvedAt?: string;
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

interface GroupStoryWithDetails {
  id: string;
  title?: string;
  status: 'in_progress' | 'pending_approval' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  finalAGStoryId?: string;
  contributionCount: number;
  uniqueUsers: number;
  contributors: string[];
  lastContributor?: string;
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
): Promise<{ success: boolean; error?: string; pendingApproval?: boolean; completed?: boolean; agStoryId?: string }> => {
  try {
    const groupStory = await fantasMiaDB.getGroupStoryById(groupStoryId);
    if (!groupStory) {
      return { success: false, error: 'Storia di gruppo non trovata' };
    }
    
    if (groupStory.status === 'completed') {
      return { success: false, error: 'Questa storia è già stata completata' };
    }
    
    if (groupStory.status === 'pending_approval') {
      return { success: false, error: 'Questa storia è in attesa di approvazione' };
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
    
    // Set title from first contribution if not set
    if (!groupStory.title && contributions.length === 0) {
      // Extract first line as potential title
      const firstLine = content.trim().split('\n')[0];
      if (firstLine.length <= 50) {
        groupStory.title = firstLine;
      }
    }
    
    await fantasMiaDB.saveGroupStory(groupStory);
    
    // Check completion conditions
    const completionCheck = await checkCompletionConditions(groupStoryId);
    
    if (completionCheck.canComplete) {
      // Mark as pending approval instead of completing directly
      groupStory.status = 'pending_approval';
      groupStory.updatedAt = new Date().toISOString();
      await fantasMiaDB.saveGroupStory(groupStory);
      
      console.log('📝 Group story marked as pending approval:', groupStoryId);
      return { success: true, pendingApproval: true };
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
 * Get all group stories with details (for SU management)
 */
export const getAllGroupStoriesWithDetails = async (): Promise<GroupStoryWithDetails[]> => {
  const allStories = await fantasMiaDB.getAllGroupStories();
  
  const storiesWithDetails: GroupStoryWithDetails[] = [];
  
  for (const story of allStories) {
    const contributions = await fantasMiaDB.getContributionsByGroupStoryId(story.id);
    const contributorNames = [...new Set(contributions.map(c => c.userName))];
    
    storiesWithDetails.push({
      id: story.id,
      title: story.title,
      status: story.status,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      completedAt: story.completedAt,
      finalAGStoryId: story.finalAGStoryId,
      contributionCount: contributions.length,
      uniqueUsers: contributorNames.length,
      contributors: contributorNames,
      lastContributor: contributions.length > 0 ? contributions[contributions.length - 1].userName : undefined
    });
  }
  
  // Sort by updatedAt descending
  storiesWithDetails.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  
  return storiesWithDetails;
};

/**
 * Get pending approval stories count (for dashboard badge)
 */
export const getPendingApprovalCount = async (): Promise<number> => {
  const pendingStories = await fantasMiaDB.getGroupStoriesByStatus('pending_approval');
  return pendingStories.length;
};

/**
 * Get in-progress stories count (for dashboard badge)
 */
export const getInProgressCount = async (): Promise<number> => {
  const inProgressStories = await fantasMiaDB.getGroupStoriesByStatus('in_progress');
  return inProgressStories.length;
};

/**
 * Get full content of a group story (assembled from all contributions)
 */
export const getGroupStoryFullContent = async (groupStoryId: string): Promise<string> => {
  const contributions = await fantasMiaDB.getContributionsByGroupStoryId(groupStoryId);
  return contributions.map(c => c.content).join('\n\n');
};

/**
 * Approve and publish group story to AG (called by SU)
 */
export const approveAndPublish = async (groupStoryId: string, superuserId: string): Promise<string> => {
  const groupStory = await fantasMiaDB.getGroupStoryById(groupStoryId);
  if (!groupStory) {
    throw new Error('Group story not found');
  }
  
  if (groupStory.status !== 'pending_approval') {
    throw new Error('Story is not pending approval');
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
  groupStory.approvedBy = superuserId;
  groupStory.approvedAt = new Date().toISOString();
  await fantasMiaDB.saveGroupStory(groupStory);
  
  console.log('✅ Group story approved and migrated to AG:', agStoryId);
  
  return agStoryId;
};

/**
 * Reject and delete a group story (called by SU)
 */
export const rejectGroupStory = async (groupStoryId: string): Promise<void> => {
  const groupStory = await fantasMiaDB.getGroupStoryById(groupStoryId);
  if (!groupStory) {
    throw new Error('Group story not found');
  }
  
  // Delete all contributions
  const contributions = await fantasMiaDB.getContributionsByGroupStoryId(groupStoryId);
  for (const contribution of contributions) {
    await fantasMiaDB.deleteGroupStoryContribution(contribution.id);
  }
  
  // Delete the group story
  await fantasMiaDB.deleteGroupStory(groupStoryId);
  
  console.log('🗑️ Group story rejected and deleted:', groupStoryId);
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
