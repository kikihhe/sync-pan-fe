<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-mask">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">选择目录</h3>
            <button class="btn-close" @click="handleClose">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-content">
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
                    :class="{ clickable: index < currentPath.length - 1 }"
                    @click="navigateToPath(index)"
                  >
                    {{ item.name }}
                  </span>
                  <span
                    v-if="index < currentPath.length - 1"
                    class="breadcrumb-separator"
                    >/</span
                  >
                </template>
              </div>
            </div>

            <!-- 搜索栏 -->
            <div class="search-bar">
              <div class="search-box">
                <Search class="search-icon" :size="20" />
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="搜索文件夹..."
                  @keyup.enter="handleSearch"
                />
              </div>
              <button class="search-btn" @click="handleSearch">搜索</button>
            </div>

            <!-- 目录列表 -->
            <div v-if="isLoading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>
            <div v-else-if="folders.length === 0" class="empty-state">
              <FolderX :size="48" class="empty-icon" />
              <p>暂无目录</p>
            </div>
            <div v-else class="folder-list">
              <div
                v-for="folder in folders"
                :key="folder.id"
                class="folder-item"
                :class="{ 'folder-item-selected': selectedFolder && selectedFolder.id === folder.id }"
                @click="selectFolder(folder)"
                @dblclick="enterFolder(folder)"
              >
                <Folder class="folder-icon" :size="20" />
                <span class="folder-name">{{ folder.name }}</span>
              </div>
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
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="handleClose">取消</button>
            <button
              class="btn-primary"
              @click="handleSelect"
              :disabled="!currentMenu"
            >
              选择此目录
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  X,
  FolderX,
  Folder,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { menuService } from "@/api/MenuService.js";
import { ElMessage } from "element-plus";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "select"]);

// 状态变量
const show = ref(false);
const isLoading = ref(false);
const folders = ref([]);
const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 当前目录
const currentMenu = ref(null);
// 历史路径
const navigationHistory = ref([]);
// 导航栏的当前进入的目录路径
const currentPath = ref([{ id: null, name: "全部文件" }]);
// 当前选中的文件夹
const selectedFolder = ref(null);

// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    show.value = val;
    if (val) {
      // 重置状态
      currentPage.value = 1;
      searchQuery.value = "";
      currentMenu.value = null;
      navigationHistory.value = [];
      currentPath.value = [{ id: null, name: "全部文件" }];
      // 加载目录列表
      loadData();
    }
  }
);

// 监听show变化，同步回父组件
watch(
  () => show.value,
  (val) => {
    emit("update:modelValue", val);
  }
);

// 计算属性
const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value) || 1;
});

// 方法
const loadData = async () => {
  isLoading.value = true;
  try {
    console.log('开始加载目录数据');
    const params = {
      pageNum: currentPage.value, // 后端从1开始计数
      pageSize: pageSize.value,
      menuId: currentMenu.value?.id,
      name: searchQuery.value.trim() || undefined,
      type: 1, // 只看文件夹
      sortField: 1, // 按创建时间排序
      desc: 1, // 倒序
    };
    console.log('请求参数:', params);

    const res = await menuService.getSubMenuList(params);
    console.log('API响应:', res);
    if (res && res.code === 200) {
      const data = res.data;
      currentMenu.value = data.currentMenu;

      // 更新导航路径 - 确保始终包含"全部文件"
      if (data.currentMenu?.id) {
        // 重新构建导航路径，避免重复
        currentPath.value = [
          { id: null, name: "全部文件" }, // 始终添加根目录
          ...navigationHistory.value.map((h) => ({ id: h.id, name: h.menuName })),
        ];
        
        // 只有当当前菜单不在导航历史中时才添加
        const isInHistory = navigationHistory.value.some(h => h.id === data.currentMenu.id);
        if (!isInHistory) {
          currentPath.value.push({ id: data.currentMenu.id, name: data.currentMenu.menuName });
        }
      } else {
        currentPath.value = [{ id: null, name: "全部文件" }];
      }

      folders.value = (data.subMenuList || []).map((menu) => ({
        id: menu.id,
        name: menu.menuName,
        parentId: menu.parentId,
        menuLevel: menu.menuLevel,
      }));

      total.value = data.total;
      currentPage.value = data.pageNum;
      pageSize.value = data.pageSize;
    } else {
      console.error("获取目录列表失败:", res);
      ElMessage.error(res?.message || "获取目录列表失败");
      folders.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("获取目录列表出错:", error);
    ElMessage.error("获取目录列表出错: " + (error.message || error));
    folders.value = [];
    total.value = 0;
  } finally {
    isLoading.value = false;
    console.log("目录加载完成，状态:", { folders: folders.value.length, total: total.value });
  }
};

const handleSearch = () => {
  currentPage.value = 1;
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

const navigateBack = async () => {
  if (navigationHistory.value.length > 0) {
    // 获取上一个菜单
    const previousMenu = navigationHistory.value.pop();
    currentMenu.value = previousMenu || null;
    // 重置选中状态
    selectedFolder.value = null;
    // 重置页码
    currentPage.value = 1;
    // 使用新的菜单ID重新加载数据
    await loadData();
  }
};

// 进入指定目录
const navigateToPath = async (index) => {
  // 如果点击的是"全部文件"
  if (index === 0) {
    currentPath.value = [{ id: null, name: "全部文件" }];
    currentMenu.value = null;
    navigationHistory.value = [];
  } else if (index < currentPath.value.length - 1) {
    // 计算需要保留的历史记录数量
    // 减1是因为要排除"全部文件"
    const historyToKeep = Math.max(0, index - 1);
    
    // 更新导航历史
    navigationHistory.value = navigationHistory.value.slice(0, historyToKeep);
    
    // 设置当前菜单为点击的路径项
    currentMenu.value = currentPath.value[index];
  }
  
  // 重置选中状态
  selectedFolder.value = null;
  // 重置页码
  currentPage.value = 1;
  // 加载数据
  await loadData();
};

// 选择文件夹（单击）
const selectFolder = (folder) => {
  // 保存当前选中的文件夹信息，包括id、name和可能存在的displayPath
  // 查找完整的文件夹信息
  const folderInfo = folders.value.find(f => f.id === folder.id);
  
  // 设置当前选中的文件夹，但不进入
  currentMenu.value = { 
    id: folder.id, 
    menuName: folder.name,
    // 如果文件夹有displayPath属性，保留它
    ...(folderInfo?.displayPath && { displayPath: folderInfo.displayPath })
  };
  
  // 更新选中状态
  selectedFolder.value = folder;
};

// 进入指定目录（双击）
const enterFolder = async (folder) => {
  // 保存当前菜单到历史记录
  if (currentMenu.value) {
    navigationHistory.value.push(currentMenu.value);
  }
  // 设置新的当前菜单
  currentMenu.value = { id: folder.id, menuName: folder.name };
  // 重置页码
  currentPage.value = 1;
  // 更新选中状态
  selectedFolder.value = null;
  // 加载新目录数据
  await loadData();
};

const handleClose = () => {
  emit("update:modelValue", false);
};

const handleSelect = () => {
  if (!currentMenu.value) return;
  
  // 获取当前路径的字符串表示
  const pathString = currentPath.value
    .slice(1) // 排除"全部文件"
    .map((item) => item.name)
    .join("/");

  // 构建完整路径
  const fullPath = "/" + pathString;
  
  // 发送选择事件，包含当前目录ID和路径
  // 优先使用后端返回的displayPath，如果没有则使用拼接的路径
  emit("select", {
    id: currentMenu.value?.id,
    path: fullPath, // 确保路径以/开头
    displayPath: currentMenu.value?.displayPath || fullPath
  });
  
  console.log('选择目录:', {
    id: currentMenu.value?.id,
    path: fullPath,
    displayPath: currentMenu.value?.displayPath || fullPath
  });
  
  emit("update:modelValue", false);
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 90%;
  max-width: 700px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}

.modal-content {
  margin-bottom: 16px;
  flex: 1;
  overflow-y: auto;
}

/* 导航栏 */
.navigation-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  background-color: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  margin-right: 12px;
}

.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.breadcrumb-item {
  color: #64748b;
  font-size: 14px;
}

.breadcrumb-item.clickable {
  color: #3b82f6;
  cursor: pointer;
}

.breadcrumb-separator {
  margin: 0 4px;
  color: #94a3b8;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 4px;
  padding: 6px 12px;
  margin-right: 8px;
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

.search-btn {
  padding: 6px 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:hover {
  background-color: #2563eb;
}

/* 加载状态 */
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

/* 目录列表 */
.folder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.folder-item:hover {
  background-color: #f1f5f9;
}

.folder-item-selected {
  background-color: #dbeafe;
  border-left: 3px solid #3b82f6;
}

.folder-item-selected:hover {
  background-color: #bfdbfe;
}

.folder-icon {
  color: #64748b;
  margin-right: 12px;
}

.folder-name {
  color: #1e293b;
  font-size: 14px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
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

/* 底部按钮 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-primary {
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

/* 过渡动画 */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>