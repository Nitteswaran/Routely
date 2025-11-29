/**
 * Utility functions for localStorage operations
 */

const STORAGE_KEYS = {
  GUARDIANS: 'routely_guardians',
  FORUM_POSTS: 'routely_forum_posts',
}

/**
 * Get guardians from localStorage
 */
export const getGuardians = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GUARDIANS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading guardians from localStorage:', error)
    return []
  }
}

/**
 * Save guardians to localStorage
 */
export const saveGuardians = (guardians) => {
  try {
    localStorage.setItem(STORAGE_KEYS.GUARDIANS, JSON.stringify(guardians))
    return true
  } catch (error) {
    console.error('Error saving guardians to localStorage:', error)
    return false
  }
}

/**
 * Add a new guardian
 */
export const addGuardian = (guardian) => {
  const guardians = getGuardians()
  const newGuardian = {
    id: Date.now().toString(),
    ...guardian,
    createdAt: new Date().toISOString(),
  }
  guardians.push(newGuardian)
  saveGuardians(guardians)
  return newGuardian
}

/**
 * Update an existing guardian
 */
export const updateGuardian = (id, updates) => {
  const guardians = getGuardians()
  const index = guardians.findIndex(g => g.id === id)
  if (index !== -1) {
    guardians[index] = {
      ...guardians[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveGuardians(guardians)
    return guardians[index]
  }
  return null
}

/**
 * Delete a guardian
 */
export const deleteGuardian = (id) => {
  const guardians = getGuardians()
  const filtered = guardians.filter(g => g.id !== id)
  saveGuardians(filtered)
  return filtered.length !== guardians.length
}

/**
 * Get forum posts from localStorage
 */
export const getForumPosts = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FORUM_POSTS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading forum posts from localStorage:', error)
    return []
  }
}

/**
 * Save forum posts to localStorage
 */
export const saveForumPosts = (posts) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FORUM_POSTS, JSON.stringify(posts))
    return true
  } catch (error) {
    console.error('Error saving forum posts to localStorage:', error)
    return false
  }
}

/**
 * Add a new forum post
 */
export const addForumPost = (post) => {
  const posts = getForumPosts()
  const userId = getCurrentUserId()
  const newPost = {
    _id: Date.now().toString(),
    ...post,
    userId: userId, // Track who created the post
    createdAt: new Date().toISOString(),
    likes: 0,
  }
  posts.unshift(newPost) // Add to beginning
  saveForumPosts(posts)
  return newPost
}

/**
 * Update an existing forum post
 */
export const updateForumPost = (postId, updates) => {
  const posts = getForumPosts()
  const index = posts.findIndex(p => p._id === postId)
  if (index !== -1) {
    posts[index] = {
      ...posts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveForumPosts(posts)
    return posts[index]
  }
  return null
}

/**
 * Delete a forum post
 */
export const deleteForumPost = (postId) => {
  const posts = getForumPosts()
  const filtered = posts.filter(p => p._id !== postId)
  saveForumPosts(filtered)
  return filtered.length !== posts.length
}

/**
 * Get or create current user ID
 */
export const getCurrentUserId = () => {
  const USER_ID_KEY = 'routely_user_id'
  let userId = localStorage.getItem(USER_ID_KEY)
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(USER_ID_KEY, userId)
  }
  return userId
}

/**
 * Get current user name (if set)
 */
export const getCurrentUserName = () => {
  const USER_NAME_KEY = 'routely_user_name'
  return localStorage.getItem(USER_NAME_KEY) || ''
}

/**
 * Set current user name
 */
export const setCurrentUserName = (name) => {
  const USER_NAME_KEY = 'routely_user_name'
  if (name) {
    localStorage.setItem(USER_NAME_KEY, name)
  } else {
    localStorage.removeItem(USER_NAME_KEY)
  }
}

/**
 * Initialize with default data if empty
 */
export const initializeDefaultData = () => {
  // Initialize guardians if empty
  if (getGuardians().length === 0) {
    saveGuardians([])
  }

  // Initialize forum posts with default data if empty
  if (getForumPosts().length === 0) {
    const defaultPosts = [
      {
        _id: '1',
        title: 'Best Parks for Morning Jogging',
        content: 'I found that Taman Tasik Titiwangsa has excellent air quality in the mornings. The AQI is usually below 30!',
        author: 'Sarah M.',
        userId: 'system_default', // Default example posts (can be edited/deleted)
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        likes: 12,
      },
      {
        _id: '2',
        title: 'Avoiding Peak Traffic Hours',
        content: 'Traffic congestion is worst between 7-9 AM and 5-7 PM. I plan my routes to avoid these times for better air quality exposure.',
        author: 'Ahmad K.',
        userId: 'system_default',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        likes: 8,
      },
      {
        _id: '3',
        title: 'Indoor Air Quality Tips',
        content: 'Using air purifiers and keeping windows closed during high pollution days really helps. Also, plants like peace lilies are great!',
        author: 'Lisa T.',
        userId: 'system_default',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        likes: 15,
      },
    ]
    saveForumPosts(defaultPosts)
  }
}

export default {
  getGuardians,
  saveGuardians,
  addGuardian,
  updateGuardian,
  deleteGuardian,
  getForumPosts,
  saveForumPosts,
  addForumPost,
  updateForumPost,
  deleteForumPost,
  getCurrentUserId,
  getCurrentUserName,
  setCurrentUserName,
  initializeDefaultData,
}

