<template>
  <div class="file-view">

  <!-- 导航栏 -->
  <div class="navigation-bar">
      <button 
        class="back-btn" 
        @click="navigateBack"
        :disabled="navigationHistory.length === 0"
      >
        <ChevronLeft :size="16" />
        返回上一级
      </button>
      <div class="breadcrumb">
        <template v-for="(item, index) in currentPath" :key="index">
          <span 
            class="breadcrumb-item"
            :class="{ 'clickable': index < currentPath.length - 1 }"
            @click="navigateToPath(index)"
          >
            {{ item.name }}
          </span>
          <span 
            v-if="index < currentPath.length - 1" 
            class="breadcrumb-separator"
          >/</span>
        </template>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search class="search-icon" :size="20" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索文件或文件夹..."
            @input="handleSearch"
          />
        </div>
      </div>
      
      <div class="toolbar-right">
        <div class="filter-group">
          <select v-model="sortBy" @change="handleSort" class="filter-select">
            <option value="modifiedTime">按修改时间排序</option>
            <option value="createdTime">按创建时间排序</option>
          </select>
          
          <select v-model="typeFilter" @change="handleTypeFilter" class="filter-select">
            <option value="all">全部</option>
            <option value="folder">只看文件夹</option>
            <option value="file">只看文件</option>
          </select>
        </div>
        
        <div class="action-group">
          <button class="upload-btn" @click="handleUploadFile">
            <Upload :size="20" />
            上传文件
          </button>
          <button class="upload-btn" @click="handleUploadFolder">
            <FolderPlus :size="20" />
            上传文件夹
          </button>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <table class="file-table">
        <thead>
          <tr>
            <th class="checkbox-cell">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>名称</th>
            <th>大小</th>
            <th>修改时间</th>
            <th>创建时间</th>
            <th>类型</th>
            <th class="actions-cell">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="item in displayedItems" 
            :key="item.id"
            @contextmenu.prevent="showContextMenu($event, item)"
          >
            <td class="checkbox-cell">
              <input 
                type="checkbox" 
                v-model="selectedItems"
                :value="item.id"
              />
            </td>
            <td class="name-cell">
              <Folder v-if="item.type === 'folder'" class="item-icon" :size="16" @click="enterFolder(item)" />
              <File v-else class="item-icon" :size="16" />
              <span class="folder-name" :class="{ 'clickable': item.type === 'folder' }">{{ item.name }}</span>
            </td>
            <td>{{ formatSize(item.size) }}</td>
            <td>{{ formatDate(item.modifiedTime) }}</td>
            <td>{{ formatDate(item.createdTime) }}</td>
            <td>{{ item.type === 'folder' ? '文件夹' : (item.fileType || '文件') }}</td>
            <td class="actions-cell">
              <button class="action-btn" @click="handleRename(item)">
                <Edit2 :size="16" />
              </button>
              <button class="action-btn delete" @click="handleDelete(item)">
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="displayedItems.length === 0">
            <td colspan="7" class="empty-message">
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <div class="pagination-info">共 {{ total }} 项</div>
      <div class="pagination-controls">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          <ChevronRight :size="16" />
        </button>
        <select v-model="pageSize" @change="handlePageSizeChange" class="page-size-select">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.show" 
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div class="context-menu-item" @click="handleContextMenuAction('rename')">
        <Edit2 :size="16" />
        重命名
      </div>
      <div class="context-menu-item delete" @click="handleContextMenuAction('delete')">
        <Trash2 :size="16" />
        删除
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Search, 
  Upload, 
  FolderPlus, 
  Folder, 
  File, 
  Edit2, 
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import { format } from 'date-fns'
import { menuService } from '@/api/MenuService.js'

// 状态
const searchQuery = ref('')
const sortBy = ref('modifiedTime')
const typeFilter = ref('all')
const selectedItems = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const items = ref([])
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  item: null
})
// 进入的文件夹记录
const currentMenuId = ref(null)
const navigationHistory = ref([])
const currentPath = ref([{ id: null, name: '全部文件' }])

// 计算属性
const isAllSelected = computed(() => {
  return displayedItems.value.length > 0 && 
         selectedItems.value.length === displayedItems.value.length
})

const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value)
})

const displayedItems = computed(() => {
  return items.value
})

// Add methods for navigation
const navigateBack = async () => {
  if (navigationHistory.value.length > 0) {
    // Pop the current location
    currentPath.value.pop()
    // Get the previous menu ID
    const previousMenu = navigationHistory.value.pop()
    currentMenuId.value = previousMenu?.id || null
    // Reload data with the new menu ID
    await loadData()
  }
}

const navigateToPath = async (index) => {
  if (index < currentPath.value.length - 1) {
    // Remove items after the clicked index
    const newPath = currentPath.value.slice(0, index + 1)
    currentPath.value = newPath
    // Update current menu ID
    currentMenuId.value = newPath[newPath.length - 1].id
    // Update navigation history
    navigationHistory.value = navigationHistory.value.slice(0, index)
    // Reload data
    await loadData()
  }
}

const loadData = async () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    menuId: currentMenuId.value
  }
  console.log('params ', params)
  const res = await menuService.getSubMenuList(params)
  if (res.code === 200) {
    const data = res.data
    items.value = [
      ...(data.subMenuList || []).map(menu => ({
        id: menu.id,
        name: menu.menuName,
        type: 'folder',
        size: '-',
        modifiedTime: menu.updateTime,
        createdTime: menu.createTime,
        parentId: menu.parentId,
        menuLevel: menu.menuLevel,
        owner: menu.owner
      })),
      ...(data.subFileList || []).map(file => ({
        id: file.id,
        name: file.fileName,
        type: 'file',
        size: file.fileSize,
        modifiedTime: file.updateTime,
        createdTime: file.createTime,
        fileType: file.fileType,
        storageType: file.storageType,
        menuId: file.menuId,
        owner: file.owner,
        identifier: file.identifier,
        realPath: file.realPath
      }))
    ]
    total.value = data.total
    currentPage.value = data.pageNum
    pageSize.value = data.pageSize
  }
}

const handleSearch = () => {
  // 实现搜索逻辑
}

const handleSort = () => {
  // 实现排序逻辑
}

const handleTypeFilter = () => {
  // 实现类型筛选逻辑
}

const handleUploadFile = () => {
  // 实现文件上传逻辑
}

const handleUploadFolder = () => {
  // 实现文件夹上传逻辑
}

const handleRename = (item) => {
  // 实现重命名逻辑
}

const handleDelete = (item) => {
  // 实现删除逻辑
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  loadData()
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = displayedItems.value.map(item => item.id)
  }
}

const showContextMenu = (event, item) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    item
  }
}

const handleContextMenuAction = (action) => {
  const item = contextMenu.value.item
  if (action === 'rename') {
    handleRename(item)
  } else if (action === 'delete') {
    handleDelete(item)
  }
  contextMenu.value.show = false
}

const hideContextMenu = (event) => {
  if (!event.target.closest('.context-menu')) {
    contextMenu.value.show = false
  }
}

const formatSize = (size) => {
  if (size === '-' || size === null || size === undefined) return '-'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = Number(size)
  let unitIndex = 0
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  
  return `${value.toFixed(2)} ${units[unitIndex]}`
}

const formatDate = (dateStr) => {
  return dateStr ? format(new Date(dateStr), 'yyyy-MM-dd HH:mm:ss') : '-'
}

// 生命周期钩子
onMounted(() => {
  loadData()
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})
</script>

<style scoped>
.file-view {
  padding: 16px;
  background-color: #f8fafc;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background-color: white;
  padding: 12px;
  border-radius: 4px;
}

.toolbar-left {
  flex: 1;
  margin-right: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 4px;
  padding: 6px 12px;
  width: 240px;
}

.search-icon {
  color: #64748b;
  margin-right: 8px;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
  color: #1e293b;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #1e293b;
  cursor: pointer;
  font-size: 14px;
}

.action-group {
  display: flex;
  gap: 8px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.upload-btn:hover {
  background-color: #4338ca;
}

/* 表格样式 */
.table-container {
  background-color: white;
  border-radius: 4px;
  margin-bottom: 16px;
}

.file-table {
  width: 100%;
  border-collapse: collapse;
}

.file-table th,
.file-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.file-table th {
  background-color: #f8fafc;
  color: #64748b;
  font-weight: 500;
}

.checkbox-cell {
  width: 40px;
  text-align: center;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-icon {
  color: #64748b;
}

.actions-cell {
  width: 80px;
  text-align: right;
}

.action-btn {
  padding: 4px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.action-btn.delete:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: white;
  border-radius: 4px;
}

.pagination-info {
  color: #64748b;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 6px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  padding: 0 8px;
  color: #64748b;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 1000;
  font-size: 14px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #1e293b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.context-menu-item:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.context-menu-item.delete:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

.empty-message {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
}



/* 导航栏 */

.navigation-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: white;
  border-radius: 4px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;
}

.breadcrumb-item {
  color: #64748b;
}

.breadcrumb-item.clickable {
  cursor: pointer;
  color: #3b82f6;
}

.breadcrumb-item.clickable:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #94a3b8;
}

.name-cell {
  cursor: pointer;
}

.folder-name {
  cursor: pointer;
}

.folder-name:hover {
  color: #3b82f6;
}

</style>

