import { ref, computed } from 'vue'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

const categories = ref([])
const bookmarks = ref([])
const searchQuery = ref('')

export function useBookmarks() {
  const { getAuthHeaders, logout, apiRequest } = useAuth()
  const { error: toastError } = useToast()
  
  
  const filteredBookmarks = computed(() => {
    if (!searchQuery.value) return bookmarks.value
    
    const query = searchQuery.value.toLowerCase()
    return bookmarks.value.filter(bookmark => 
      bookmark.name.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query)
    )
  })
  
  const bookmarksByCategory = computed(() => {
    const result = {}
    categories.value.forEach(category => {
      result[category.id] = filteredBookmarks.value
        .filter(b => b.category_id === category.id)
        .sort((a, b) => a.position - b.position)
    })
    return result
  })
  
  const fetchData = async () => {
    try {
      const authHeaders = getAuthHeaders()
      
      // 获取分类
      const categoriesRes = await fetch('/api/categories', {
        headers: authHeaders
      })
      
      if (categoriesRes.status === 401) {
        if (authHeaders.Authorization) {
          logout()
        }
        categories.value = []
      } else {
        const categoriesData = await categoriesRes.json()
        categories.value = categoriesData.data || []
      }
      
      // 获取书签（如果已登录，带上token以获取私密书签）
      const bookmarksRes = await fetch('/api/bookmarks', {
        headers: authHeaders
      })
      
      if (bookmarksRes.status === 401) {
        if (authHeaders.Authorization) {
          logout()
        }
        bookmarks.value = []
        return
      }
      
      const bookmarksData = await bookmarksRes.json()
      bookmarks.value = bookmarksData.data || []
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }
  
  const addBookmark = async (data) => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      })
      
      if (response.status === 401) {
        logout()
        return { success: false, error: '未授权' }
      }
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: '添加失败' }
    } catch (error) {
      return { success: false, error: '网络错误' }
    }
  }
  
  const updateBookmark = async (id, data) => {
    try {
      const response = await apiRequest(`/api/bookmarks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: '更新失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const deleteBookmark = async (id) => {
    try {
      const response = await apiRequest(`/api/bookmarks/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: '删除失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const addCategory = async (name, parentId = null) => {
    try {
      const body = { name }
      if (parentId !== null) {
        body.parent_id = parentId
      }
      
      const response = await apiRequest('/api/categories', {
        method: 'POST',
        body: JSON.stringify(body)
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: result.error || '添加失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const updateCategory = async (id, name) => {
    try {
      const response = await apiRequest(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: '更新失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const deleteCategory = async (id) => {
    try {
      const response = await apiRequest(`/api/categories/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: '删除失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const reorderItems = async (type, items) => {
    try {
      const response = await apiRequest('/api/reorder', {
        method: 'POST',
        body: JSON.stringify({ type, items })
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: '排序失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const batchOperation = async (operation, bookmarkIds, data = {}, categoryIds = null) => {
    try {
      const body = { operation, data }
      if (bookmarkIds) {
        body.bookmarkIds = bookmarkIds
      }
      if (categoryIds) {
        body.categoryIds = categoryIds
      }
      
      const response = await apiRequest('/api/batch-operations', {
        method: 'POST',
        body: JSON.stringify(body)
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { success: true }
      }
      return { success: false, error: '批量操作失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const getEmptyCategories = async () => {
    try {
      const response = await apiRequest('/api/cleanup-empty-categories', {
        method: 'GET'
      })
      
      const result = await response.json()
      if (result.success) {
        return { 
          success: true, 
          emptyCategories: result.emptyCategories || [],
          count: result.count || 0
        }
      }
      return { success: false, error: result.error || '获取空分类失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  const cleanupEmptyCategories = async () => {
    try {
      const response = await apiRequest('/api/cleanup-empty-categories', {
        method: 'POST'
      })
      
      const result = await response.json()
      if (result.success) {
        await fetchData()
        return { 
          success: true,
          deletedCount: result.deletedCount || 0,
          deletedCategories: result.deletedCategories || []
        }
      }
      return { success: false, error: result.error || '清理空分类失败' }
    } catch (error) {
      if (error.message === 'Token expired') {
        return { success: false, error: '登录已过期，请重新登录' }
      }
      return { success: false, error: '网络错误' }
    }
  }
  
  return {
    categories,
    bookmarks,
    searchQuery,
    filteredBookmarks,
    bookmarksByCategory,
    fetchData,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderItems,
    batchOperation,
    getEmptyCategories,
    cleanupEmptyCategories
  }
}

