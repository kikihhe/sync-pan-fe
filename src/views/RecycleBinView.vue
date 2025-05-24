<template>
  <div class="recycle-bin-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search class="search-icon" :size="20" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索文件名..."
          />
        </div>
      </div>

      <div class="toolbar-right">
        <div class="filter-group">
          <select v-model="sortBy" @change="handleSort" class="filter-select">
            <option value="createTime">按创建时间排序</option>
            <option value="updateTime">按修改时间排序</option>
            <option value="fileSize">按文件大小排序</option>
            <option value="deleteTime">按删除时间排序</option>
          </select>

          <button class="sort-btn" @click="toggleSortOrder">
            <ArrowUp v-if="desc === 'asc'" :size="16" />
            <ArrowDown v-else :size="16" />
          </button>
        </div>
        <button class="search-btn" @click="handleSearch">搜索</button>

        <div class="info-tip">
          <Info :size="16" />
          <span class="tooltip-text">回收站内的文件将保存30天，30天后自动删除</span>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div class="file-list-container">
      <!-- 表头 -->
      <div class="file-list-header">
        <div class="header-item checkbox">
          <input
            type="checkbox"
            :checked="isAllSelected"
            @change="toggleSelectAll"
          />
        </div>
        <div class="header-item name">文件名</div>
        <div class="header-item size">大小</div>
        <div class="header-item delete-time">删除时间</div>
        <div class="header-item actions">操作</div>
      </div>

      <!-- 加载中状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="items.length === 0" class="empty-state">
        <Trash2 :size="48" class="empty-icon" />
        <p>回收站为空</p>
      </div>

      <!-- 文件列表 -->
      <div v-else class="file-list">
        <div
          v-for="item in items"
          :key="item.id"
          class="file-item"
          :class="{ selected: selectedItems.includes(item.id) }"
          @click="toggleSelectItem(item.id, $event)"
        >
          <div class="item-cell checkbox">
            <input
              type="checkbox"
              :checked="selectedItems.includes(item.id)"
              @click.stop
              @change="toggleSelectItem(item.id, $event)"
            />
          </div>

          <div class="item-cell name">
            <div class="file-icon">
              <File :size="20" v-if="item.type === 'file'" />
            </div>
            <span class="file-name">{{ item.name }}</span>
          </div>

          <div class="item-cell size">
            {{ formatFileSize(item.size) }}
          </div>

          <div class="item-cell delete-time">
            {{ formatDate(item.updateTime) }}
          </div>

          <div class="item-cell actions">
            <button class="action-btn restore" @click.stop="handleRestore(item)">
              <RefreshCw :size="16" />
              <span>恢复</span>
            </button>
            <button class="action-btn delete" @click.stop="handlePermanentDelete(item)">
              <Trash2 :size="16" />
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <div class="pagination-info">
        共 {{ total }} 项，已选择 {{ selectedItems.length }} 项
      </div>
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
        <select
          v-model="pageSize"
          @change="handlePageSizeChange"
          class="page-size-select"
        >
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </div>

    <!-- 目录选择对话框 -->
    <FolderSelectDialog
      v-model="showFolderSelectDialog"
      @select="handleFolderSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Search,
  ArrowUp,
  ArrowDown,
  File,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-vue-next";
import { format } from "date-fns";
import { ElMessage, ElMessageBox } from "element-plus";
import { fileService } from "@/api/FileService.js";
import FolderSelectDialog from "@/components/folder-select-dialog.vue";

// 状态
const searchQuery = ref("");
const sortBy = ref("updateTime");
const desc = ref("desc");
const selectedItems = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const items = ref([]);
const isLoading = ref(false);

// 目录选择对话框
const showFolderSelectDialog = ref(false);
const currentRestoreFile = ref(null);

// 计算属性
const isAllSelected = computed(() => {
  return items.value.length > 0 && selectedItems.value.length === items.value.length;
});

const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value) || 1;
});

// 方法
const loadData = async () => {
  isLoading.value = true;
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      fileName: searchQuery.value.trim() || undefined,
      sortField: sortBy.value,
      desc: desc.value === "desc" ? 1 : 0,
    };

    const res = await fileService.getDeletedFiles(params);
    if (res && res.code === 200) {
      const data = res.data;
      items.value = (data.records || []).map((file) => ({
        id: file.id,
        name: file.fileName,
        type: "file",
        size: parseInt(file.fileSize) || 0,
        updateTime: file.updateTime,
        createTime: file.createTime,
        fileType: file.fileType,
        storageType: file.storageType,
        menuId: file.menuId,
        owner: file.owner,
        identifier: file.identifier,
        realPath: file.realPath,
        displayPath: file.displayPath,
      }));

      total.value = data.total;
      currentPage.value = data.pageNum;
      pageSize.value = data.pageSize;
    } else {
      ElMessage.error(res?.message || "获取已删除文件列表失败");
      items.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("获取已删除文件列表出错:", error);
    ElMessage.error("获取已删除文件列表出错: " + error.message);
    items.value = [];
    total.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const toggleSortOrder = () => {
  desc.value = desc.value === "desc" ? "asc" : "desc";
  loadData();
};

const handleSort = () => {
  loadData();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  loadData();
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  loadData();
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = [];
  } else {
    selectedItems.value = items.value.map((item) => item.id);
  }
};

const toggleSelectItem = (id, event) => {
  if (event.target.type === "checkbox") {
    // 如果点击的是复选框，则切换选中状态
    const index = selectedItems.value.indexOf(id);
    if (index === -1) {
      selectedItems.value.push(id);
    } else {
      selectedItems.value.splice(index, 1);
    }
  } else {
    // 如果点击的是行，则切换选中状态
    const index = selectedItems.value.indexOf(id);
    if (index === -1) {
      selectedItems.value.push(id);
    } else {
      selectedItems.value.splice(index, 1);
    }
  }
};

const handleRestore = (item) => {
  currentRestoreFile.value = item;
  showFolderSelectDialog.value = true;
};

const handleFolderSelect = async (folder) => {
  if (!currentRestoreFile.value) return;

  try {
    const res = await fileService.restoreDeletedFile(
      currentRestoreFile.value.id,
      folder.id
    );

    if (res && res.code === 200) {
      ElMessage.success(`文件已恢复到 ${folder?.name ? folder.name : '根目录'}`);
    } else {
      ElMessage.error(res?.message || "恢复文件失败");
    }
    loadData();
  } catch (error) {
    console.error("恢复文件出错:", error);
    ElMessage.error("恢复文件出错: " + error.message);
  } finally {
    currentRestoreFile.value = null;
  }
};

const handlePermanentDelete = async (item) => {
  try {
    const result = await ElMessageBox.confirm(
      "此操作将永久删除该文件, 是否继续?",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    if (result === "confirm") {
      isLoading.value = true; // 开始加载状态
      try {
        const res = await fileService.permanentDeleteFile(item.id);
        if (res && res.code === 200) {
          ElMessage.success("文件已永久删除");
          
          // 检查是否需要调整页码
          // 如果当前是最后一页，并且该页只有一条数据（即将被删除的数据）
            currentPage.value -= 1;

          
          await loadData();
        } else {
          ElMessage.error(res?.message || "删除文件失败");
          isLoading.value = false; // 结束加载状态
        }
      } catch (err) {
        console.error("删除文件出错:", err);
        ElMessage.error("删除文件出错: " + err.message);
        isLoading.value = false; // 确保错误时也结束加载状态
      }
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除文件出错:", error);
      ElMessage.error("删除文件出错: " + error.message);
      isLoading.value = false; // 确保错误时也结束加载状态
    }
  }
};

// 格式化文件大小
const formatFileSize = (size) => {
  if (!size || size === "-") return "-";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let formattedSize = size;
  let unitIndex = 0;

  while (formattedSize >= 1024 && unitIndex < units.length - 1) {
    formattedSize /= 1024;
    unitIndex++;
  }

  return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss");
};

// 初始加载数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.recycle-bin-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 6px;
  padding: 8px 12px;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
  color: #1e293b;
  font-size: 14px;
}

.search-icon {
  color: #64748b;
  margin-right: 8px;
}

.search-btn {
  padding: 6px 12px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-btn:hover {
  background-color: #4338ca;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #1e293b;
  font-size: 14px;
}

.search-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-tip {
  position: relative;
  display: flex;
  align-items: center;
  color: #64748b;
  cursor: help;
}

.info-tip .tooltip-text {
  visibility: hidden;
  width: 240px;
  background-color: #334155;
  color: white;
  text-align: center;
  border-radius: 6px;
  padding: 8px;
  position: absolute;
  z-index: 100;
  top: 125%;
  right: 0;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.info-tip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.sort-filter {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-filter select {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #1e293b;
  font-size: 14px;
}

.sort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
}

/* 文件列表容器 */
.file-list-container {
  flex: 1;
  overflow: auto;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

/* 表头 */
.file-list-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
  color: #64748b;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-item {
  padding: 0 8px;
}

.header-item.checkbox {
  width: 40px;
  flex-shrink: 0;
}

.header-item.name {
  flex: 2;
}

.header-item.size {
  width: 100px;
  flex-shrink: 0;
}

.header-item.delete-time {
  width: 180px;
  display: flex;
  align-items: center;
  /* justify-content: center; */
  flex-shrink: 0;
}

.header-item.actions {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

/* 加载中状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-icon {
  color: #94a3b8;
  margin-bottom: 16px;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 24px;
}

/* 文件列表 */
.file-list {
  display: flex;
  flex-direction: column;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
  cursor: pointer;
}

.file-item:hover {
  background-color: #f8fafc;
}

.file-item.selected {
  background-color: #eff6ff;
}

.item-cell {
  padding: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-cell.checkbox {
  width: 40px;
  flex-shrink: 0;
}

.item-cell.name {
  flex: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #64748b;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-cell.size {
  width: 100px;
  flex-shrink: 0;
  color: #64748b;
}

.item-cell.delete-time {
  width: 180px;
  flex-shrink: 0;
  color: #64748b;
}

.item-cell.actions {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.action-btn.restore {
  background-color: #ecfdf5;
  color: #10b981;
}

.action-btn.restore:hover {
  background-color: #d1fae5;
}

.action-btn.delete {
  background-color: #fef2f2;
  color: #ef4444;
}

.action-btn.delete:hover {
  background-color: #fee2e2;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #1e293b;
  font-size: 14px;
}
</style>