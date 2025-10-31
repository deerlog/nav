<template>
  <li
    class="category-item"
    :class="{
      active: selectedCategoryId === category.id,
      selected: isCategorySelected
    }"
  >
    <div class="category-main" :style="{ paddingLeft: `${(level + 1) * 0.75}rem` }">
      <label v-if="isBatchMode" class="category-checkbox" @click.stop>
        <input
          type="checkbox"
          :checked="isCategorySelected"
          @change="$emit('toggle-category-selection', category.id)"
        />
      </label>

      <button
        type="button"
        class="category-button"
        @click="$emit('select', category.id)"
      >
        <span class="category-name">
          <span v-if="category.children?.length" class="category-tree-icon">📁</span>
          <span v-else class="category-tree-icon">📄</span>
          <span class="category-label">{{ category.name }}</span>
        </span>
        <span class="category-count">
          {{ bookmarkCountByCategory[category.id] ?? 0 }}
        </span>
      </button>
    </div>

    <div v-if="isEditMode && !isBatchMode" class="category-actions">
      <button
        type="button"
        class="icon-btn-small"
        @click.stop="$emit('edit-category', category)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        type="button"
        class="icon-btn-small delete-btn"
        @click.stop="$emit('delete-category', category)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="3 6 5 6 21 6" />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          />
        </svg>
      </button>
    </div>

    <ul v-if="category.children && category.children.length" class="category-children">
      <CategoryTreeItem
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :level="level + 1"
        :selected-category-id="selectedCategoryId"
        :selected-category-ids="selectedCategoryIds"
        :is-edit-mode="isEditMode"
        :is-batch-mode="isBatchMode"
        :bookmark-count-by-category="bookmarkCountByCategory"
        @select="$emit('select', $event)"
        @toggle-category-selection="$emit('toggle-category-selection', $event)"
        @edit-category="$emit('edit-category', $event)"
        @delete-category="$emit('delete-category', $event)"
      />
    </ul>
  </li>
</template>

<script setup>
import { computed } from 'vue'

defineOptions({ name: 'CategoryTreeItem' })

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  selectedCategoryId: {
    type: [Number, String, null],
    default: null
  },
  selectedCategoryIds: {
    type: Array,
    default: () => []
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  isBatchMode: {
    type: Boolean,
    default: false
  },
  bookmarkCountByCategory: {
    type: Object,
    default: () => ({})
  }
})

const isCategorySelected = computed(() => props.selectedCategoryIds?.includes(props.category.id) ?? false)
</script>

<style scoped>
.category-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-children {
  list-style: none;
  margin: 0;
  padding: 0;
}

.category-tree-icon {
  margin-right: 0.4rem;
}

.category-label {
  white-space: nowrap;
}
</style>
