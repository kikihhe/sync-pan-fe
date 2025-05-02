<template>
  <div class="menu-conflict-wrapper">
    <!-- 当前目录项 -->
    <div :class="['conflict-item', menu.type === 1 ? 'added' : 'deleted']">
      <Folder :size="16" class="item-icon" />
      <span class="item-name">{{ menu.menu.menuName }}</span>
      <span class="conflict-type">{{ menu.type === 1 ? '新增' : '删除' }}</span>
      
      <!-- 展开/折叠按钮 -->
      <button v-if="hasContent" class="expand-btn" @click="toggleExpand">
        <ChevronDown v-if="expanded" :size="16" />
        <ChevronRight v-else :size="16" />
      </button>
      
      <!-- 添加箭头按钮 -->
      <slot name="action-button"></slot>
    </div>
    
    <!-- 展开的内容：子目录和子文件 -->
    <div v-if="expanded && hasContent" class="submenu-list">
      <!-- 子目录列表 -->
      <div v-if="hasSubmenu" class="content-section">
        <div v-for="submenu in menu.submenuList" :key="submenu.menu.id" class="submenu-item">
          <menu-conflict-item 
            :menu="submenu" 
            :source="source"
            @move-to-merged="$emit('move-to-merged', source, 'menu', submenu)">
            <template #action-button>
              <button 
                :class="['arrow-btn', source === 'local' ? 'right' : 'left']" 
                @click="$emit('move-to-merged', source, 'menu', submenu)">
                <ChevronRight v-if="source === 'local'" :size="16" />
                <ChevronLeft v-else :size="16" />
              </button>
            </template>
          </menu-conflict-item>
        </div>
      </div>
      
      <!-- 子文件列表 -->
      <div v-if="hasSubfiles" class="content-section">
        <div v-for="file in menu.subFileList" :key="file.file.id" 
             :class="['conflict-item', file.type === 1 ? 'added' : 'deleted']">
          <File v-if="file.file.fileType" :size="16" class="item-icon" />
          <Folder v-else :size="16" class="item-icon" />
          <span class="item-name">{{ file.file.fileName }}</span>
          <span class="conflict-type">{{ file.type === 1 ? '新增' : '删除' }}</span>
          
          <!-- 添加箭头按钮 -->
          <button 
            :class="['arrow-btn', source === 'local' ? 'right' : 'left']" 
            @click="$emit('move-to-merged', source, 'file', file)">
            <ChevronRight v-if="source === 'local'" :size="16" />
            <ChevronLeft v-else :size="16" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Folder, File, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-vue-next';

const props = defineProps({
  menu: {
    type: Object,
    required: true
  },
  source: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['move-to-merged']);

// 控制子菜单的展开/折叠状态
const expanded = ref(false);

// 判断是否有子菜单
const hasSubmenu = computed(() => {
  return props.menu.submenuList && props.menu.submenuList.length > 0;
});

// 判断是否有子文件
const hasSubfiles = computed(() => {
  return props.menu.subFileList && props.menu.subFileList.length > 0;
});

// 判断是否有内容（子目录或子文件）
const hasContent = computed(() => {
  return hasSubmenu.value || hasSubfiles.value;
});

// 切换展开/折叠状态
const toggleExpand = () => {
  expanded.value = !expanded.value;
};
</script>

<style scoped>
.menu-conflict-wrapper {
  margin-bottom: 4px;
}

.submenu-list {
  margin-left: 20px;
  margin-top: 4px;
  border-left: 1px dashed #e5e7eb;
  padding-left: 12px;
}

.submenu-item {
  margin-bottom: 4px;
}

.content-section {
  margin-bottom: 12px;
}

.section-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 8px 0 4px 0;
  font-weight: 500;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

.expand-btn:hover {
  background-color: #f3f4f6;
}

/* 继承父组件的冲突项样式 */
.conflict-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  background-color: #f9fafb;
  position: relative;
}

.conflict-item.added {
  background-color: #ecfdf5;
  border: 1px solid #6ee7b7;
}

.conflict-item.deleted {
  background-color: #eff6ff;
  border: 1px solid #93c5fd;
}

.item-icon {
  margin-right: 8px;
  color: #6b7280;
}

.item-name {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conflict-type {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #e5e7eb;
  margin-right: 8px;
}

.added .conflict-type {
  background-color: #d1fae5;
  color: #059669;
}

.deleted .conflict-type {
  background-color: #dbeafe;
  color: #2563eb;
}

/* 箭头按钮样式 */
.arrow-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-btn:hover {
  background-color: #f3f4f6;
  color: #2563eb;
}

.arrow-btn.right {
  margin-left: auto;
}

.arrow-btn.left {
  margin-right: auto;
}
</style>