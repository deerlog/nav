<template>
  <div class="app">
    <!-- Header -->
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <button 
            v-if="categories.length > 0"
            class="sidebar-toggle-btn" 
            @click="sidebarOpen = !sidebarOpen"
            title="切换分类侧边栏"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <h1 class="app-title">{{ customTitle }}</h1>
        </div>
        
        <!-- 未登录状态：直接显示登录按钮 -->
        <button 
          v-if="!isAuthenticated"
          class="btn btn-primary"
          @click="loginModal.open(); showMobileMenu = false"
        >
          登录
        </button>
        
        <!-- 已登录状态：显示汉堡菜单按钮 -->
        <template v-else>
          <button class="mobile-menu-btn" @click.stop="showMobileMenu = !showMobileMenu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          
          <!-- 桌面端/移动端展开的操作按钮 -->
          <div class="header-actions" :class="{ 'mobile-menu-open': showMobileMenu }">
            <!-- Admin Controls in Header -->
            <button 
              class="btn btn-secondary"
              @click="settingsPage.open(); showMobileMenu = false"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
              </svg>
              <span>设置</span>
            </button>
            
            <button 
              class="btn"
              :class="isEditMode ? 'btn-primary' : 'btn-secondary'"
              @click="isEditMode = !isEditMode; showMobileMenu = false"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>{{ isEditMode ? '完成' : '编辑' }}</span>
            </button>
            
            <button 
              class="btn btn-secondary"
              @click="handleLogout(); showMobileMenu = false"
            >
              退出
            </button>
          </div>
        </template>
      </div>
      
      <div v-if="showSearch" class="header-search">
        <SearchBar />
      </div>
      
      <!-- Edit Mode Toolbar -->
      <EditModeToolbar 
        :is-edit-mode="isEditMode"
        :is-batch-mode="isBatchMode"
        :selected-count="selectedCount"
        :selected-category-count="selectedCategoryCount"
        :has-bookmarks="bookmarks.length > 0"
        @addBookmark="handleAddBookmark"
        @addCategory="handleAddCategory"
        @toggleBatchMode="handleToggleBatchMode"
        @selectAll="handleSelectAll"
        @deselectAll="handleDeselectAll"
        @invertSelection="handleInvertSelection"
        @batchMove="handleBatchMove"
        @batchEdit="handleBatchEdit"
        @batchDelete="handleBatchDelete"
        @batchDeleteCategories="handleBatchDeleteCategories"
      />
    </header>
    
    <main class="page-main">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="!publicMode && !isAuthenticated" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <p>需要登录才能访问</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">
          此书签站点处于非公开模式，请先登录
        </p>
        <button class="btn btn-primary" @click="loginModal.open()" style="margin-top: 1rem;">
          立即登录
        </button>
      </div>
      
      <div v-else-if="categories.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p>还没有分类和书签</p>
        <p v-if="isAuthenticated" style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);">
          点击右上角 <strong style="color: var(--primary);">⚙️ 设置</strong> → <strong style="color: var(--primary);">📊 数据管理</strong> → <strong style="color: var(--primary);">导入书签</strong>
        </p>
        <p v-if="isAuthenticated" style="font-size: 0.875rem; margin-top: 0.75rem; color: var(--text-tertiary);">
          或点击 <strong style="color: var(--primary);">✏️ 编辑</strong> 按钮手动添加
        </p>
        <p v-else style="font-size: 0.9rem; margin-top: 0.5rem;">
          请先登录以管理书签
        </p>
        <button 
          v-if="isAuthenticated" 
          class="btn btn-primary" 
          @click="settingsPage.open(); setActiveSettingsTab('data')" 
          style="margin-top: 1.5rem;"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 18px; height: 18px;">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          快速导入书签
        </button>
      </div>
      
      <div v-else class="main-layout">
        <!-- Sidebar Backdrop (Mobile) -->
        <div 
          v-if="sidebarOpen && !isDesktop" 
          class="sidebar-backdrop" 
          @click="sidebarOpen = false"
        ></div>
        
        <!-- Category Sidebar -->
        <CategorySidebar
          :categories="categories"
          :bookmarkCountByCategory="bookmarkCountByCategory"
          :totalBookmarkCount="totalBookmarkCount"
          :selectedCategoryId="selectedCategoryId"
          :selectedCategoryIds="selectedCategoryIds"
          :is-open="sidebarOpen"
          :is-desktop="isDesktop"
          :is-edit-mode="isEditMode"
          :is-batch-mode="isBatchMode"
          @toggle="sidebarOpen = !sidebarOpen"
          @select="handleSelectCategory"
          @toggle-category-selection="handleToggleCategorySelection"
          @edit-category="handleEditCategory"
          @delete-category="handleDeleteCategory"
        />
        
        <!-- Bookmarks Content -->
        <div class="bookmarks-area">
          <template v-if="displayedCategories.length > 0">
            <CategorySection
              v-for="category in displayedCategories"
              :key="category.id"
              :category="category"
              :bookmarks="bookmarksByCategory[category.id] || []"
              :is-edit-mode="isEditMode"
              :is-batch-mode="isBatchMode"
              :selected-ids="selectedIds"
              :selected-category-ids="selectedCategoryIds"
              @edit-category="handleEditCategory"
              @delete-category="handleDeleteCategory"
              @edit-bookmark="handleEditBookmark"
              @delete-bookmark="handleDeleteBookmark"
              @reorder-bookmarks="handleReorderBookmarks"
              @toggle-selection="handleToggleSelection"
              @toggle-category-selection="handleToggleCategorySelection"
            />
          </template>
          <div v-else class="empty-state">
            暂无可用分类，请先创建分类
          </div>
        </div>
      </div>
    </main>
    
    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content" v-html="footerContent"></div>
    </footer>
    
    <!-- Floating Buttons -->
    <FloatingButtons />
    
    <!-- Modals -->
    <LoginModal ref="loginModal" />
    <BookmarkDialog ref="bookmarkDialog" />
    <ConfirmDialog ref="confirmDialog" />
    <PromptDialog ref="promptDialog" />
    <FooterEditDialog ref="footerEditDialog" />
    <ImportExportDialog ref="importExportDialog" />
    <BatchOperationDialog ref="batchOperationDialog" />
    
    <!-- Settings Page -->
    <SettingsPage 
      ref="settingsPage"
      :theme-mode="themeMode"
      :is-dark="isDark"
      :bookmarks="bookmarks"
      :show-search="showSearch"
      :hide-empty-categories="hideEmptyCategories"
      :public-mode="publicMode"
      :custom-title="customTitle"
      :footer-content="footerContent"
      :active-settings-tab="activeSettingsTab"
      :empty-category-count="emptyCategoryCount"
      @action="handleSettingsAction"
      @set-theme-mode="setThemeMode"
      @toggle-search="toggleSearch"
      @toggle-hide-empty="toggleHideEmptyCategories"
      @toggle-public-mode="togglePublicMode"
      @update-title="updateCustomTitle"
      @update-footer="updateFooterContent"
      @editTitle="handleEditTitle"
      @editFooter="handleEditFooter"
      @setActiveTab="handleSettingsTabChange"
    />
    
    <!-- Update Notification -->
    <UpdateNotification />
    
    <!-- Toast Notifications -->
    <ToastNotification ref="toast" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useAuth } from './composables/useAuth'
import { useBookmarks } from './composables/useBookmarks'
import { useBatchOperations } from './composables/useBatchOperations'
import { useTheme } from './composables/useTheme'
import { useSettings } from './composables/useSettings'
import { useToast } from './composables/useToast'
import SearchBar from './components/SearchBar.vue'
import CategorySidebar from './components/CategorySidebar.vue'
import CategorySection from './components/CategorySection.vue'
import FloatingButtons from './components/FloatingButtons.vue'
import EditModeToolbar from './components/EditModeToolbar.vue'
import SettingsPage from './components/SettingsPage.vue'
import LoginModal from './components/LoginModal.vue'
import BookmarkDialog from './components/BookmarkDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import PromptDialog from './components/PromptDialog.vue'
import FooterEditDialog from './components/FooterEditDialog.vue'
import ImportExportDialog from './components/ImportExportDialog.vue'
import BatchOperationDialog from './components/BatchOperationDialog.vue'
import UpdateNotification from './components/UpdateNotification.vue'
import ToastNotification from './components/ToastNotification.vue'

const { isAuthenticated, logout, onAuthChange } = useAuth()
const {
  categories,
  bookmarks,
  filteredBookmarks,
  bookmarksByCategory,
  fetchData,
  addCategory,
  updateCategory,
  deleteCategory,
  updateBookmark,
  deleteBookmark,
  reorderItems,
  batchOperation,
  getEmptyCategories,
  cleanupEmptyCategories
} = useBookmarks()
const { themeMode, isDark, setThemeMode, toggleTheme, loadThemeFromDB } = useTheme()
const { showSearch, hideEmptyCategories, customTitle, footerContent, activeSettingsTab, publicMode, toggleSearch, toggleHideEmptyCategories, togglePublicMode, updateCustomTitle, updateFooterContent, setActiveSettingsTab, loadSettingsFromDB } = useSettings()
const { setToastInstance, success: toastSuccess, error: toastError } = useToast()
const {
  isBatchMode,
  selectedCount,
  selectedCategoryCount,
  toggleBatchMode,
  toggleBookmarkSelection,
  toggleCategorySelection,
  selectAll,
  deselectAll,
  invertSelection,
  getSelectedIds,
  getSelectedCategoryIds,
  clearSelection,
  clearCategorySelection
} = useBatchOperations()

const loading = ref(true)
const isEditMode = ref(false)
const showMobileMenu = ref(false)
const emptyCategoryCount = ref(0)
const loginModal = ref(null)
const bookmarkDialog = ref(null)
const confirmDialog = ref(null)
const promptDialog = ref(null)
const footerEditDialog = ref(null)
const importExportDialog = ref(null)
const batchOperationDialog = ref(null)
const settingsPage = ref(null)
const toast = ref(null)

const ALL_CATEGORIES_ID = 'all'
const SCROLL_OFFSET = 140
const PROGRAMMATIC_SCROLL_TIMEOUT = 600
let scrollResetTimer = null

const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1025 : true)
const sidebarOpen = ref(isDesktop.value)
const selectedCategoryId = ref(ALL_CATEGORIES_ID)
const isScrollingProgrammatically = ref(false)

const selectedIds = computed(() => getSelectedIds())
const selectedCategoryIds = computed(() => getSelectedCategoryIds())

const bookmarkCountByCategory = computed(() => {
  const counts = {}
  categories.value.forEach(category => {
    counts[category.id] = bookmarksByCategory.value[category.id]?.length || 0
  })
  return counts
})

const totalBookmarkCount = computed(() => {
  return categories.value.reduce((total, category) => {
    return total + (bookmarkCountByCategory.value[category.id] || 0)
  }, 0)
})

const displayedCategories = computed(() => categories.value)

watch(categories, (newCategories) => {
  if (!newCategories.length) {
    selectedCategoryId.value = ALL_CATEGORIES_ID
    return
  }
  // 如果当前选中的分类已被删除，回到"全部"
  if (selectedCategoryId.value !== ALL_CATEGORIES_ID && !newCategories.some(category => category.id === selectedCategoryId.value)) {
    selectedCategoryId.value = ALL_CATEGORIES_ID
  }

  nextTick(() => {
    updateActiveCategoryFromScroll()
  })
}, { immediate: true })

watch([showSearch, isEditMode, isBatchMode, isAuthenticated], () => {
  if (typeof window === 'undefined') return
  nextTick(() => {
    updateLayoutOffsets()
  })
})

const setProgrammaticScroll = () => {
  isScrollingProgrammatically.value = true
  if (scrollResetTimer) clearTimeout(scrollResetTimer)
  scrollResetTimer = setTimeout(() => {
    isScrollingProgrammatically.value = false
  }, PROGRAMMATIC_SCROLL_TIMEOUT)
}

const getScrollOffset = () => {
  if (typeof window === 'undefined') return SCROLL_OFFSET
  const header = document.querySelector('.app-header')
  return header ? header.offsetHeight + 24 : SCROLL_OFFSET
}

const scrollToTop = () => {
  if (typeof window === 'undefined') return
  setProgrammaticScroll()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const scrollToCategory = (categoryId) => {
  if (typeof window === 'undefined') return
  const categoryElement = document.getElementById(`category-${categoryId}`)
  if (!categoryElement) return

  const offset = getScrollOffset()
  const elementTop = categoryElement.getBoundingClientRect().top + window.pageYOffset
  const targetTop = elementTop - offset

  setProgrammaticScroll()
  window.scrollTo({ top: targetTop, behavior: 'smooth' })
}

function updateActiveCategoryFromScroll() {
  if (typeof window === 'undefined') return
  if (isScrollingProgrammatically.value) return
  if (!categories.value.length) return

  const scrollY = window.scrollY || document.documentElement.scrollTop || 0
  if (scrollY <= 80) {
    if (selectedCategoryId.value !== ALL_CATEGORIES_ID) {
      selectedCategoryId.value = ALL_CATEGORIES_ID
    }
    return
  }

  const offset = getScrollOffset()
  let activeId = null

  for (const category of categories.value) {
    const element = document.getElementById(`category-${category.id}`)
    if (!element) continue
    const rect = element.getBoundingClientRect()

    if (rect.top - offset <= 0) {
      activeId = category.id
    } else {
      if (activeId === null) {
        activeId = category.id
      }
      break
    }
  }

  if (activeId === null && categories.value.length) {
    activeId = categories.value[categories.value.length - 1].id
  }

  if (activeId !== null && selectedCategoryId.value !== activeId) {
    selectedCategoryId.value = activeId
  }
}

const handleSelectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
  if (!isDesktop.value) {
    sidebarOpen.value = false
  }

  if (categoryId === ALL_CATEGORIES_ID) {
    scrollToTop()
  } else {
    setTimeout(() => scrollToCategory(categoryId), 100)
  }
}

const updateLayoutOffsets = () => {
  if (typeof window === 'undefined') return
  const header = document.querySelector('.app-header')
  const headerHeight = header?.offsetHeight ?? 0
  const root = document.documentElement
  if (!root) return

  root.style.setProperty('--app-header-height', `${headerHeight}px`)

  const availableHeight = Math.max(window.innerHeight - headerHeight, 0)
  root.style.setProperty('--app-sidebar-available-height', `${availableHeight}px`)
}

const handleResize = () => {
  if (typeof window === 'undefined') return
  const wasDesktop = isDesktop.value
  isDesktop.value = window.innerWidth >= 1025
  
  if (!wasDesktop && isDesktop.value) {
    sidebarOpen.value = true
  } else if (wasDesktop && !isDesktop.value) {
    sidebarOpen.value = false
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => updateLayoutOffsets())
  } else {
    updateLayoutOffsets()
  }
}

const handleSettingsTabChange = (tab) => {
  setActiveSettingsTab(tab)
  // 切换到数据管理标签时检查空分类
  if (tab === 'data' && isAuthenticated.value) {
    checkEmptyCategories()
  }
}

onMounted(async () => {
  await fetchData()
  // 初始化时加载设置（无论是否登录）
  await loadSettingsFromDB()
  await loadThemeFromDB()
  loading.value = false
  
  // 初始化 Toast
  if (toast.value) {
    setToastInstance(toast.value)
  }
  
  // 如果已登录，检查空分类数量
  if (isAuthenticated.value) {
    checkEmptyCategories()
  }
  
  // 监听登录状态变化，重新获取数据
  onAuthChange(async () => {
    await fetchData()
    // 登录后重新加载设置（确保获取最新数据）
    await loadSettingsFromDB()
    await loadThemeFromDB()
    // 登录后检查空分类
    if (isAuthenticated.value) {
      checkEmptyCategories()
    }
  })
  
  // 监听自定义标题变化，更新页面标题
  watch(customTitle, (newTitle) => {
    document.title = newTitle
  }, { immediate: true })
  
  // 点击外部关闭汉堡菜单
  const handleClickOutside = (event) => {
    if (showMobileMenu.value && !event.target.closest('.header-content')) {
      showMobileMenu.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  
  // 监听窗口滚动，更新活动分类
  let scrollTimeout = null
  const handleScroll = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      updateActiveCategoryFromScroll()
    }, 100)
  }
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  handleResize()
  
  // 清理事件监听
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    if (scrollResetTimer) clearTimeout(scrollResetTimer)
    if (scrollTimeout) clearTimeout(scrollTimeout)
  })
  
  // 初始化时调用一次滚动检测
  nextTick(() => {
    updateActiveCategoryFromScroll()
  })
  
  // 初始化布局偏移量
  nextTick(() => {
    updateLayoutOffsets()
  })
})

const handleLogout = async () => {
  const confirmed = await confirmDialog.value.open('确定要退出登录吗？')
  if (confirmed) {
    logout()
    isEditMode.value = false
    await fetchData()
  }
}

const handleSettingsAction = (action) => {
  switch (action) {
    case 'importExport':
      // 导入导出保持在设置页面内，不关闭设置页面
      importExportDialog.value.open()
      break
    case 'cleanupEmptyCategories':
      // 清理空分类保持在设置页面内
      handleCleanupEmptyCategories()
      break
    case 'addBookmark':
      // 其他操作需要关闭设置页面
      settingsPage.value.close()
      setTimeout(() => {
        bookmarkDialog.value.open()
      }, 300)
      break
    case 'addCategory':
      // 其他操作需要关闭设置页面
      settingsPage.value.close()
      setTimeout(() => {
        handleAddCategory()
      }, 300)
      break
  }
}

const checkEmptyCategories = async () => {
  try {
    const result = await getEmptyCategories()
    if (result.success) {
      emptyCategoryCount.value = result.count || 0
    }
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('Failed to check empty categories:', error)
  }
}

const handleCleanupEmptyCategories = async () => {
  // 先检查空分类数量
  const result = await getEmptyCategories()
  if (!result.success) {
    toastError(result.error || '获取空分类失败')
    return
  }
  
  if (result.count === 0) {
    toastError('当前没有空分类需要清理')
    return
  }
  
  // 构建确认消息
  const categoryNames = result.emptyCategories.map(cat => `"${cat.name}"`).join('、')
  const message = result.count === 1
    ? `确定要删除空分类 ${categoryNames} 吗？`
    : `确定要删除以下 ${result.count} 个空分类吗？\n\n${categoryNames}\n\n此操作不可恢复！`
  
  const confirmed = await confirmDialog.value.open(message, '清理空分类')
  if (!confirmed) return
  
  // 执行清理
  const cleanupResult = await cleanupEmptyCategories()
  if (cleanupResult.success) {
    if (cleanupResult.deletedCount === 0) {
      toastError('没有空分类需要清理')
    } else {
      toastSuccess(`已成功清理 ${cleanupResult.deletedCount} 个空分类`)
      // 更新空分类数量
      emptyCategoryCount.value = 0
    }
  } else {
    toastError(cleanupResult.error || '清理空分类失败')
  }
}

// 监听数据变化，更新空分类数量（使用防抖）
let checkEmptyCategoriesTimer = null
watch([categories, bookmarks], async () => {
  if (isAuthenticated.value) {
    // 防抖：延迟 500ms 执行，避免频繁检查
    if (checkEmptyCategoriesTimer) {
      clearTimeout(checkEmptyCategoriesTimer)
    }
    checkEmptyCategoriesTimer = setTimeout(async () => {
      await checkEmptyCategories()
      checkEmptyCategoriesTimer = null
    }, 500)
  }
})

const handleAddCategory = async () => {
  const name = await promptDialog.value.open('新建分类', '', '请输入分类名称')
  if (name) {
    const result = await addCategory(name)
    if (result.success) {
      toastSuccess('分类添加成功')
    } else {
      toastError(result.error || '添加分类失败')
    }
  }
}

const handleEditCategory = async (category) => {
  const name = await promptDialog.value.open('编辑分类', category.name, '请输入新的分类名称')
  if (name && name !== category.name) {
    const result = await updateCategory(category.id, name)
    if (result.success) {
      toastSuccess('分类已更新')
    } else {
      toastError(result.error || '更新分类失败')
    }
  }
}

const handleDeleteCategory = async (category) => {
  const confirmed = await confirmDialog.value.open(
    `确定要删除分类"${category.name}"吗？该分类下的所有书签也将被删除。`,
    '删除分类'
  )
  if (confirmed) {
    const result = await deleteCategory(category.id)
    if (result.success) {
      toastSuccess('分类已删除')
    } else {
      toastError(result.error || '删除分类失败')
    }
  }
}

const handleEditBookmark = (bookmark) => {
  bookmarkDialog.value.open(bookmark)
}

const handleDeleteBookmark = async (bookmark) => {
  const confirmed = await confirmDialog.value.open(
    `确定要删除书签"${bookmark.name}"吗？`,
    '删除书签'
  )
  if (confirmed) {
    const result = await deleteBookmark(bookmark.id)
    if (result.success) {
      toastSuccess('书签已删除')
    } else {
      toastError(result.error || '删除书签失败')
    }
  }
}

const visibleBookmarkIds = computed(() => filteredBookmarks.value.map(bookmark => bookmark.id))

const handleToggleBatchMode = () => {
  if (!isBatchMode.value && filteredBookmarks.value.length === 0 && categories.value.length === 0) {
    toastError('当前没有可操作的书签或分类')
    return
  }
  if (!isBatchMode.value) {
    clearSelection()
    clearCategorySelection()
  }
  toggleBatchMode()
}

const handleSelectAll = () => {
  if (!isBatchMode.value) return
  if (visibleBookmarkIds.value.length === 0) {
    toastError('当前没有可选择的书签')
    return
  }
  deselectAll()
  selectAll(visibleBookmarkIds.value)
}

const handleDeselectAll = () => {
  if (!isBatchMode.value) return
  deselectAll()
}

const handleInvertSelection = () => {
  if (!isBatchMode.value) return
  if (visibleBookmarkIds.value.length === 0) {
    toastError('当前没有可选择的书签')
    return
  }
  invertSelection(visibleBookmarkIds.value)
}

const handleToggleSelection = (bookmarkId) => {
  if (!isBatchMode.value) return
  toggleBookmarkSelection(bookmarkId)
}

const handleToggleCategorySelection = (categoryId) => {
  if (!isBatchMode.value) return
  toggleCategorySelection(categoryId)
}

const handleBatchDelete = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要删除的书签')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('delete', selectedCount.value)
  if (!dialogResult?.confirmed) return

  const ids = getSelectedIds()
  const result = await batchOperation('delete', ids)
  if (result.success) {
    toastSuccess(`已删除 ${ids.length} 个书签`)
    clearSelection()
  } else {
    toastError(result.error || '批量删除失败')
  }
}

const handleBatchMove = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要移动的书签')
    return
  }
  if (categories.value.length === 0) {
    toastError('请先创建分类')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('move', selectedCount.value)
  if (!dialogResult?.categoryId) return

  const categoryId = parseInt(dialogResult.categoryId, 10)
  if (Number.isNaN(categoryId)) {
    toastError('请选择有效的分类')
    return
  }

  const ids = getSelectedIds()
  const result = await batchOperation('move', ids, { categoryId })
  if (result.success) {
    toastSuccess(`已移动 ${ids.length} 个书签`)
    clearSelection()
  } else {
    toastError(result.error || '批量移动失败')
  }
}

const handleBatchEdit = async () => {
  if (selectedCount.value === 0) {
    toastError('请先选择需要编辑的书签')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('edit', selectedCount.value)
  if (!dialogResult) return

  const ids = getSelectedIds()
  const result = await batchOperation('edit', ids, { isPrivate: dialogResult.isPrivate })
  if (result.success) {
    toastSuccess(`已更新 ${ids.length} 个书签的属性`)
    clearSelection()
  } else {
    toastError(result.error || '批量编辑失败')
  }
}

const handleReorderBookmarks = async (items) => {
  // 如果items包含category_id，说明是跨分类移动
  if (items[0]?.category_id) {
    const item = items[0]
    // 从所有书签中查找，而不是从目标分类中查找
    const bookmark = bookmarks.value.find(b => b.id === item.id)
    if (bookmark) {
      await updateBookmark(item.id, {
        ...bookmark,
        category_id: item.category_id,
        position: item.position
      })
    }
  } else {
    // 同分类内排序
    await reorderItems('bookmarks', items)
  }
}

const handleEditTitle = async () => {
  const newTitle = await promptDialog.value.open('自定义标题', customTitle.value, '请输入新的标题')
  if (newTitle && newTitle.trim()) {
    updateCustomTitle(newTitle.trim())
    toastSuccess('标题已更新')
  }
}

const handleEditFooter = async () => {
  const newFooter = await footerEditDialog.value.open('自定义页脚', footerContent.value, '请输入页脚HTML内容')
  if (newFooter !== null) {
    updateFooterContent(newFooter)
    toastSuccess('页脚已更新')
  }
}

const handleAddBookmark = () => {
  bookmarkDialog.value.open()
}

const handleBatchDeleteCategories = async () => {
  if (selectedCategoryCount.value === 0) {
    toastError('请先选择需要删除的分类')
    return
  }
  const dialogResult = await batchOperationDialog.value?.open('delete-categories', selectedCategoryCount.value)
  if (!dialogResult?.confirmed) return

  const ids = getSelectedCategoryIds()
  const result = await batchOperation('delete-categories', null, {}, ids)
  if (result.success) {
    toastSuccess(`已删除 ${ids.length} 个分类`)
    clearCategorySelection()
  } else {
    toastError(result.error || '批量删除分类失败')
  }
}
</script>

