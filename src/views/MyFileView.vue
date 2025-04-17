<template>
  <div class="file-view">
    <!-- 文件预览对话框 -->
    <file-preview-dialog
      v-model:visible="showPreviewDialog"
      :file-id="currentPreviewFile.id"
      :file-name="currentPreviewFile.name"
    />
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

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search class="search-icon" :size="20" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索文件或文件夹..."
          />
        </div>
      </div>

      <div class="toolbar-right">
        <div class="filter-group">
          <select v-model="sortBy" @change="handleSort" class="filter-select">
            <option value="createTime">按创建时间排序</option>
            <option value="updateTime">按修改时间排序</option>
          </select>

          <select v-model="desc" @change="handleSort" class="filter-select">
            <option value="desc">倒序</option>
            <option value="asc">正序</option>
          </select>

          <select
            v-model="typeFilter"
            @change="handleTypeFilter"
            class="filter-select"
          >
            <option value="all">全部</option>
            <option value="folder">只看文件夹</option>
            <option value="file">只看文件</option>
          </select>
        </div>

        <button class="search-btn" @click="handleSearch">搜索</button>

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
            <th>创建时间</th>
            <th>修改时间</th>
            <th>类型</th>
            <th class="actions-cell">操作</th>
          </tr>
        </thead>
        <!--        禁止点击空白处-->
        <!--        <tbody @contextmenu.prevent="showContextMenu($event, null)">-->
        <tbody>
          <tr
            v-for="item in displayedItems"
            :key="item.id"
            @contextmenu.stop.prevent="showContextMenu($event, item)"
          >
            <td class="checkbox-cell">
              <input type="checkbox" v-model="selectedItems" :value="item.id" />
            </td>
            <td>
              <div class="name-cell">
                <Folder
                  v-if="item.type === 'folder'"
                  class="item-icon"
                  :size="16"
                  @click="enterFolder(item)"
                />
                <File v-else class="item-icon" :size="16" />
                <!-- 放在图标与文件名之间，拉开间隔 -->
                <div style="width: 10px; height: 100%"></div>

                <!-- 编辑状态和非编辑状态的显示切换 -->
                <input
                  v-if="item.isEditing"
                  ref="editNameInput"
                  class="folder-name-input"
                  type="text"
                  v-model="item.editName"
                  @keyup.enter="saveNewFolderName(item)"
                  @blur="saveNewFolderName(item)"
                  @click.stop
                />
                <span
                  class="folder-name"
                  :class="{ clickable: item.type === 'folder' }"
                  @click="item.type === 'folder' && enterFolder(item)"
                  v-show="!item.isEditing"
                  >{{ item.name }}</span
                >
              </div>
            </td>
            <td>{{ formatSize(item.size) }}</td>
            <td>{{ formatDate(item.createTime) }}</td>
            <td>{{ formatDate(item.updateTime) }}</td>
            <td>
              {{ item.type === "folder" ? "文件夹" : item.fileType || "文件" }}
            </td>
            <td class="actions-cell">
              <button class="action-btn" @click="handleRename(item)">
                <Edit2 :size="16" />
              </button>
              <button class="action-btn delete" @click="handleDelete(item)">
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>

          <tr v-if="isCreatingFolder">
            <td class="checkbox-cell">
              <input type="checkbox" disabled />
            </td>
            <td>
              <div class="name-cell">
                <Folder class="item-icon" :size="16" />
                <div style="width: 10px; height: 100%"></div>
                <input
                  ref="newFolderInput"
                  class="folder-name-input"
                  type="text"
                  v-model="newFolderName"
                  @keyup.enter="confirmCreateFolder"
                  @blur="confirmCreateFolder"
                  @click.stop
                />
              </div>
            </td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>文件夹</td>
            <td class="actions-cell">-</td>
          </tr>

          <tr v-if="displayedItems.length === 0">
            <td colspan="7" class="empty-message">暂无数据</td>
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

    <!-- 上传文件 -->
    <FileUploadDialog
      :show="showFileUploadDialog"
      :is-folder="isUploadingFolder"
      :parent-menu-id="currentMenu?.id"
      :current-menu="currentMenu"
      @close="showFileUploadDialog = false"
      @file-upload-complete="handleUploadComplete"
    />
    <!-- 上传文件夹 -->
    <FolderUploadDialog
      :show="showFolderUploadDialog"
      :parent-menu-id="currentMenu?.id"
      :current-menu="currentMenu"
      @close="showFolderUploadDialog = false"
      @upload-complete="handleUploadComplete"
    />

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <template
        v-if="contextMenu.type === 'file' || contextMenu.type === 'folder'"
      >
        <!-- 仅文件显示预览 -->
        <div
          class="context-menu-item"
          @click="handleContextMenuAction('preview')"
          v-if="contextMenu.item?.type === 'file'"
        >
          <Eye :size="16" />
          预览
        </div>

        <!-- 下载选项 - 仅对文件显示 -->
        <div
          class="context-menu-item"
          @click="handleContextMenuAction('download')"
          v-if="contextMenu.item?.type === 'file'"
        >
          <Download :size="16" />
          下载
        </div>

        <div
          class="context-menu-item"
          @click="handleContextMenuAction('rename')"
        >
          <Edit2 :size="16" />
          重命名
        </div>

        <div
          class="context-menu-item delete"
          @click="handleContextMenuAction('delete')"
        >
          <Trash2 :size="16" />
          删除
        </div>
      </template>
      <template
        v-if="contextMenu.type === 'file' || contextMenu.type === 'folder'"
      >
        <div
          class="context-menu-item"
          @click="handleContextMenuAction('uploadFile')"
        >
          <Upload :size="16" />
          上传文件
        </div>
        <div
          class="context-menu-item"
          @click="handleContextMenuAction('uploadFolder')"
        >
          <FolderPlus :size="16" />
          上传文件夹
        </div>
        <div
          class="context-menu-item"
          @click="handleContextMenuAction('createFolder')"
        >
          <FolderPlus :size="16" />
          新建文件夹
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
// 导包
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
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
  Eye,
  Download,
} from "lucide-vue-next";
import { format } from "date-fns";
import { menuService } from "@/api/MenuService.js";
import { fileService } from "@/api/FileService.js";
import FileUploadDialog from "@/components/file-upload-dialog.vue";
// 导入新组件
import FolderUploadDialog from "@/components/folder-upload-dialog.vue";
// 导入Element Plus组件
import { ElMessage, ElMessageBox } from "element-plus";
import FilePreviewDialog from '@/components/file-preview-dialog.vue'

// 状态
const searchQuery = ref("");
const sortBy = ref("createTime");
const typeFilter = ref("all");
const selectedItems = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const items = ref([]);
const desc = ref("desc");

// 右键菜单
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  item: null,
  type: "item", // 新增菜单类型标识
});

// 当前目录
const currentMenu = ref(null);
// 历史路径
const navigationHistory = ref([]);
// 导航栏的当前进入的目录路径
const currentPath = ref([{ id: null, name: "全部文件" }]);

// 新建文件夹相关状态
const isCreatingFolder = ref(false);
const newFolderName = ref("新建文件夹");
const newFolderInput = ref(null);
const editNameInput = ref(null);

// 上传对话框状态
const showFileUploadDialog = ref(false);
const showFolderUploadDialog = ref(false);
const isUploadingFolder = ref(false);

// 预览对话框状态
const showPreviewDialog = ref(false);
const currentPreviewFile = ref({id: '', name: ''});

// 监听目录ID变化
watch(
  () => currentMenu.value?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      loadData();
    }
  }
);

// 监听新建文件夹状态
watch(isCreatingFolder, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (newFolderInput.value) {
        newFolderInput.value.focus();
        newFolderInput.value.select();
      }
    });
  }
});

// 计算属性
const isAllSelected = computed(() => {
  return (
    displayedItems.value.length > 0 &&
    selectedItems.value.length === displayedItems.value.length
  );
});

const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value);
});

const displayedItems = computed(() => {
  return items.value;
});

// 导航相关方法
const navigateBack = async () => {
  if (navigationHistory.value.length > 0) {
    // 弹出当前位置
    currentPath.value.pop();
    // 获取上一个菜单ID
    const previousMenu = navigationHistory.value.pop();
    currentMenu.value = previousMenu || null;
    // 使用新的菜单ID重新加载数据
    await loadData();
  }
};

// 进入指定目录
const navigateToPath = async (index) => {
  // 如果点击的是"全部文件"
  if (index === 0) {
    currentPath.value = [{ id: null, name: "全部文件" }];
    currentMenu.value = {
      id: null,
      menuLevel: 1,
    };
    navigationHistory.value = [];
  } else if (index < currentPath.value.length - 1) {
    // 移除点击索引之后的项
    const newPath = currentPath.value.slice(0, index + 1);
    currentPath.value = newPath;
    currentMenu.value = newPath[newPath.length - 1];
    navigationHistory.value = navigationHistory.value.slice(0, index - 1); // 减1是因为要排除"全部文件"
  }
  await loadData();
};

// 进入指定目录
const enterFolder = async (item) => {
  navigationHistory.value.push(currentMenu.value);
  currentMenu.value = { id: item.id, menuName: item.name };
  currentPage.value = 1;
  await loadData();
};

const loadData = async () => {
  const params = {
    pageNum: currentPage.value,
    pageSize: pageSize.value,
    menuId: currentMenu.value?.id,
    name: searchQuery.value.trim() || undefined,
    type:
      typeFilter.value === "folder" ? 1 : typeFilter.value === "file" ? 2 : 0,
    sortField: sortBy.value === "createTime" ? 1 : 2,
    desc: desc.value === "desc" ? 1 : 2,
  };
  // console.log("params ", params);
  const res = await menuService.getSubMenuList(params);
  if (res.code === 200) {
    const data = res.data;
    currentMenu.value = data.currentMenu;

    // 更新导航路径 - 确保始终包含"全部文件"
    if (data.currentMenu?.id) {
      // 构建完整的导航路径
      const fullPath = [];
      let currentId = data.currentMenu.id;
      
      // 从当前菜单开始，向上查找父级菜单
      while (currentId) {
        const menu = data.currentMenu.id === currentId ? data.currentMenu : 
          navigationHistory.value.find(h => h.id === currentId);
        
        if (menu) {
          fullPath.unshift({ id: menu.id, name: menu.menuName });
          currentId = menu.parentId;
        } else {
          break;
        }
      }
      
      currentPath.value = [
        { id: null, name: "全部文件" },
        ...fullPath
      ];
    } else {
      currentPath.value = [{ id: null, name: "全部文件" }];
    }

    items.value = [
      ...(data.subMenuList || []).map((menu) => ({
        id: menu.id,
        name: menu.menuName,
        type: "folder",
        size: menu.menuSize || "-",
        updateTime: menu.updateTime,
        createTime: menu.createTime,
        parentId: menu.parentId,
        menuLevel: menu.menuLevel,
        owner: menu.owner,
      })),
      ...(data.subFileList || []).map((file) => ({
        id: file.id,
        name: file.fileName,
        type: "file",
        size: file.fileSize,
        updateTime: file.updateTime,
        createTime: file.createTime,
        fileType: file.fileType,
        storageType: file.storageType,
        menuId: file.menuId,
        owner: file.owner,
        identifier: file.identifier,
        realPath: file.realPath,
      })),
    ];
    total.value = data.total;
    currentPage.value = data.pageNum;
    pageSize.value = data.pageSize;
  }
};

const handleSearch = () => {
  loadData();
};

const handleSort = () => {
  // 实现排序逻辑
  loadData();
};

const handleTypeFilter = () => {
  // 实现类型筛选逻辑
  loadData();
};

// 实现文件上传逻辑
const handleUploadFile = () => {
  isUploadingFolder.value = false;
  showFileUploadDialog.value = true;
};

// 实现文件夹上传逻辑
const handleUploadFolder = () => {
  showFolderUploadDialog.value = true;
};

// 不管是文件/目录，上传完成后都要刷新数据
const handleUploadComplete = () => {
  loadData();
};

// 重命名处理
const handleRename = (item) => {
  // 先重置其他项的编辑状态
  items.value.forEach((i) => {
    if (i.id !== item.id) {
      i.isEditing = false;
    }
  });

  item.isEditing = true;
  item.editName = item.name;

  nextTick(() => {
    const inputElement = document.querySelector(".folder-name-input");
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });
};

const handleDelete = async (item) => {
  try {
    // 添加确认对话框
    const confirmMessage = item.type === "folder" ? 
      "是否将此文件夹移入回收站？" : 
      "是否将此文件移入回收站？";
    
    const result = await ElMessageBox.confirm(
      confirmMessage,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    
    if (result === "confirm") {
      let res;
      if (item.type === "folder") {
        // 删除目录
        res = await menuService.deleteMenu(item.id);
      } else {
        // 删除文件
        res = await fileService.deleteFile({ fileList: [item.id] });
      }

      if (res.code === 200) {
        ElMessage.success(item.type === "folder" ? "文件夹已移入回收站" : "文件已移入回收站");
        // 清空选中项
        selectedItems.value = selectedItems.value.filter((id) => id !== item.id);
        // 重新加载数据
        await loadData();
      } else {
        ElMessage.error(res.message || "操作失败");
      }
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除操作出错: ", error);
      ElMessage.error("操作失败: " + error);
    }
  }
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
    selectedItems.value = displayedItems.value.map((item) => item.id);
  }
};

const showContextMenu = (event, i) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    item: i,
    type: i.type,
  };
};

const handleContextMenuAction = (action) => {
  const item = contextMenu.value.item;
  console.log("contextMenu: ", contextMenu);
  console.log("item: ", item);
  if (action === "rename" && item) {
    handleRename(item);
  } else if (action === "delete" && item) {
    handleDelete(item);
  } else if (action === "uploadFile") {
    handleUploadFile();
  } else if (action === "uploadFolder") {
    handleUploadFolder();
  } else if (action === "createFolder") {
    handleCreateFolder();
  } else if (action === "preview" && item) {
    currentPreviewFile.value = item;
    showPreviewDialog.value = true;
  } else if (action === "download" && item) {
    handleDownload(item); 
  }
  contextMenu.value.show = false;
};

// // 空白区域右键
// const handleBlankRightClick = (event) => {
//   contextMenu.value = {
//     show: true,
//     x: event.clientX,
//     y: event.clientY,
//     item: null,
//     type: "blank",
//   };
// };

// 新建文件夹 - 初始创建
const handleCreateFolder = async () => {
  // 检查是否需要添加序号
  let folderBaseName = "新建文件夹";
  let folderName = folderBaseName;
  let counter = 1;

  // 检查是否有重名文件夹
  while (
    items.value.some(
      (item) => item.name === folderName && item.type === "folder"
    )
  ) {
    folderName = `${folderBaseName}${counter}`;
    counter++;
  }

  newFolderName.value = folderName;
  isCreatingFolder.value = true;
};

// 确认创建文件夹
const confirmCreateFolder = async () => {
  if (!isCreatingFolder.value || !newFolderName.value.trim()) {
    isCreatingFolder.value = false;
    return;
  }
  try {
    // 构建请求参数
    let newMenuLevel = 0;
    let pid = null;
    if (currentMenu.value?.id === null) {
      newMenuLevel = 1;
    } else {
      newMenuLevel = currentMenu.value.menuLevel + 1;
      pid = currentMenu.value?.id;
    }

    const menuParams = {
      menuName: newFolderName.value.trim(),
      menuLevel: newMenuLevel,
      parentId: pid,
    };

    // 调用创建接口
    const res = await menuService.addMenu(menuParams);

    if (res.code === 200) {
      await loadData();
    } else {
      ElMessage.error("创建文件夹失败: " + res.message);
    }
  } catch (error) {
    ElMessage.error("创建文件夹出错: " + error);
  } finally {
    isCreatingFolder.value = false;
  }
};

const saveNewFolderName = async (item) => {
  if (!item.isEditing) return;
  const originalName = item.name;
  const newName = item.editName?.trim();
  if (!newName) {
    ElMessage.warning("名称不能为空");
    item.isEditing = false;
    return;
  }
  if (newName === originalName) {
    ElMessage.warning("名称未改动");
    // 退出编辑状态
    item.isEditing = false;
    return;
  }
  try {
    let res;

    if (item.type === "folder") {
      // 文件夹重命名
      res = await menuService.updateMenu({
        id: item.id,
        menuName: item.editName.trim(),
        owner: item.owner,
      });
    } else {
      // 文件重命名
      res = await fileService.updateFile({
        id: item.id,
        fileName: item.editName.trim(),
        owner: item.owner,
      });
    }

    if (res.code === 200) {
      ElMessage.success(item.type === "folder" ? "文件夹名称已更新" : "文件名称已更新");
    } else {
      ElMessage.error("更新名称失败: " + res.message);
    }
  } catch (error) {
    ElMessage.error("更新名称出错: " + error);
  } finally {
    item.name = item.editName;
    item.isEditing = false;
  }
  await loadData();
};

// 处理表格点击 - 取消创建/编辑状态
const handleTableClick = () => {
  // 如果正在创建文件夹，则确认创建
  if (isCreatingFolder.value) {
    confirmCreateFolder();
  }

  // 取消所有编辑状态
  items.value.forEach((item) => {
    if (item.isEditing) {
      saveNewFolderName(item);
    }
  });
};

// 文件预览
const handlePreview = async (item) => {
  if (item.type === 'file') {
    showPreviewDialog.value = true;
    currentPreviewFile.value = {
      id: item.id,
      name: item.name
    };
  }
};

// 添加文件下载处理函数
const handleDownload = (item) => {
  if (item.type === 'file') {
    fileService.downloadFile(item.id);
  }
};

// 隐藏右键菜单
const hideContextMenu = (event) => {
  if (!event.target.closest(".context-menu")) {
    contextMenu.value.show = false;
  }
};

const formatSize = (size) => {
  if (size === "-" || size === null || size === undefined) return "-";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(size);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

const formatDate = (dateStr) => {
  return dateStr ? format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss") : "-";
};

// 生命周期钩子
onMounted(async () => {
  const route = useRoute();
  const remoteMenuId = route.query.remoteMenuId;
  const path = route.query.path;

  if (remoteMenuId && path) {
    // 解析路径，构建导航历史
    const pathSegments = path.split('/').filter(Boolean);
    let currentId = null;
    
    // 逐级获取目录信息并构建导航历史
    for (const segment of pathSegments) {
      const params = {
        pageNum: 1,
        pageSize: 1,
        menuId: currentId,
        name: segment,
        type: 1, // 只搜索文件夹
      };
      
      const res = await menuService.getSubMenuList(params);
      if (res.code === 200 && res.data.subMenuList?.length > 0) {
        const menu = res.data.subMenuList[0];
        navigationHistory.value.push({ id: currentId, menuName: segment });
        currentId = menu.id;
      }
    }
    
    // 设置当前目录为目标目录
    currentMenu.value = { id: remoteMenuId };
  }
  
  loadData();
  document.addEventListener("click", hideContextMenu);
});

onUnmounted(() => {
  document.removeEventListener("click", hideContextMenu);
});
</script>

<style scoped>
.file-view {
  padding: 16px;
  background-color: #f8fafc;
  height: 80vh;
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
  width: 400px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  align-items: center;
  padding: 12px;
  background-color: white;
  border-radius: 4px;
  position: absolute;
  bottom: 0;
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
  z-index: 9999;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 4px;
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