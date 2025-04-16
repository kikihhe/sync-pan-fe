<template>
  <div v-if="show" class="folder-upload-dialog-overlay">
    <div class="folder-upload-dialog">
      <div class="folder-upload-header">
        <h3>上传文件夹</h3>
        <button class="close-btn" @click="onClose" :disabled="isUploading">
          <X :size="20" />
        </button>
      </div>

      <!-- 上传区域 -->
      <div
        v-if="!selectedFolder"
        class="upload-area"
        @drop.prevent="handleDrop"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        :class="{ dragging: isDragging }"
        @click="triggerFolderInput"
      >
        <input
          type="file"
          ref="folderInput"
          webkitdirectory
          style="display: none"
          @change="handleFolderSelect"
        />
        <div class="upload-icon">
          <FolderUp :size="48" />
        </div>
        <p>单击或拖动文件夹到此区域上传</p>
      </div>

      <!-- 文件夹信息 -->
      <div v-if="selectedFolder" class="folder-info">
        <h4>选择的文件夹: {{ selectedFolder.name }}</h4>
        <div class="folder-stats">
          <p>文件数量: {{ fileCount }}</p>
          <p>文件夹数量: {{ dirCount }}</p>
          <p>总大小: {{ formatSize(totalSize) }}</p>
        </div>
      </div>

      <!-- 上传进度 -->
      <div v-if="isUploading" class="upload-progress">
        <div class="progress-header">
          <span>上传进度</span>
          <span>{{ uploadedCount }}/{{ totalCount }}</span>
        </div>
        <div class="progress-bar-container">
          <div
            class="progress-bar"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
        <div class="current-operation">
          {{ currentOperation }}
        </div>
      </div>

      <!-- 文件树结构 -->
      <div v-if="selectedFolder && !isUploading" class="file-tree">
        <div class="file-tree-header">文件夹结构</div>
        <div class="file-tree-content">
          <template v-for="(node, index) in fileTree" :key="index">
            <div
              class="tree-node"
              :style="{ paddingLeft: `${node.level * 20}px` }"
              :class="{ 'file-node': !node.isDirectory }"
            >
              <template v-if="node.isDirectory">
                <FolderOpen v-if="node.level === 0" :size="16" />
                <Folder v-else :size="16" />
              </template>
              <template v-else>
                <File :size="16" />
              </template>
              <span :title="node.path">{{ node.name }}</span>
            </div>
          </template>
        </div>
      </div>

      <div class="folder-upload-footer">
        <button class="cancel-btn" @click="onClose" :disabled="isUploading">
          取消
        </button>
        <button
          class="upload-btn"
          @click="startUpload"
          :disabled="!selectedFolder || isUploading"
        >
          开始上传
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { FolderUp, FolderOpen, Folder, File, X } from "lucide-vue-next";
import { fileService } from "@/api/FileService.js";
import { menuService } from "@/api/MenuService.js";

const props = defineProps({
  show: Boolean,
  parentMenuId: [String, Number, null],
  currentMenu: {
    type: Object,
    default: () => ({ menuLevel: 0 }),
  },
});

const emit = defineEmits(["close", "upload-complete", "upload-error"]);

// 状态变量
const isDragging = ref(false);
const folderInput = ref(null);
const selectedFolder = ref(null);
const fileTree = ref([]);
const isUploading = ref(false);
const uploadedCount = ref(0);
const totalCount = ref(0);
const currentOperation = ref("");
const maxConcurrentUploads = 5; // 最大并发上传数

// 上传进度
const uploadProgress = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((uploadedCount.value / totalCount.value) * 100);
});

// 文件和目录计数
const fileCount = computed(() => {
  return fileTree.value.filter((node) => !node.isDirectory).length;
});

const dirCount = computed(() => {
  return fileTree.value.filter((node) => node.isDirectory).length;
});

// 总大小
const totalSize = computed(() => {
  return fileTree.value.reduce((total, node) => {
    return total + (node.isDirectory ? 0 : node.size);
  }, 0);
});

// 触发文件夹选择
const triggerFolderInput = () => {
  folderInput.value.click();
};

// 处理文件夹选择
const handleFolderSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  // 获取根文件夹名称
  const rootPath = files[0].webkitRelativePath.split("/")[0];
  selectedFolder.value = { name: rootPath };

  // 构建文件树
  buildFileTree(files);
};

// 处理拖拽
const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (e) => {
  isDragging.value = false;
  const items = e.dataTransfer.items;

  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry();

      if (entry && entry.isDirectory) {
        selectedFolder.value = { name: entry.name };
        traverseDirectory(entry);
        break;
      }
    }
  }
};

// 遍历目录
const traverseDirectory = async (entry, path = "") => {
  fileTree.value = [];

  // 添加根目录
  fileTree.value.push({
    name: entry.name,
    path: entry.name,
    isDirectory: true,
    level: 0,
  });

  // 创建一个队列来存储待处理的条目
  const queue = [
    {
      entry: entry,
      path: entry.name,
      level: 0,
    },
  ];

  while (queue.length > 0) {
    const { entry, path, level } = queue.shift();

    if (entry.isFile) {
      const file = await getFileFromEntry(entry);
      fileTree.value.push({
        name: entry.name,
        path: path,
        size: file.size,
        isDirectory: false,
        file: file,
        level: level,
      });
    } else if (entry.isDirectory && level > 0) {
      // 跳过根目录
      fileTree.value.push({
        name: entry.name,
        path: path,
        isDirectory: true,
        level: level,
      });

      const dirReader = entry.createReader();
      const entries = await readEntriesPromise(dirReader);

      for (const childEntry of entries) {
        queue.push({
          entry: childEntry,
          path: `${path}/${childEntry.name}`,
          level: level + 1,
        });
      }
    } else if (entry.isDirectory) {
      // 根目录
      const dirReader = entry.createReader();
      const entries = await readEntriesPromise(dirReader);

      for (const childEntry of entries) {
        queue.push({
          entry: childEntry,
          path: `${path}/${childEntry.name}`,
          level: level + 1,
        });
      }
    }
  }

  // 按层级和类型排序
  fileTree.value.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  console.log("构建的文件树:", fileTree.value);
};

// 从文件列表构建文件树
const buildFileTree = (files) => {
  fileTree.value = [];

  // 首先，创建一个完整的路径映射
  const pathMap = new Map();

  // 添加所有文件和目录到映射
  files.forEach((file) => {
    const pathParts = file.webkitRelativePath.split("/");
    const rootFolder = pathParts[0];

    // 确保根文件夹存在
    if (!pathMap.has(rootFolder)) {
      pathMap.set(rootFolder, {
        name: rootFolder,
        path: rootFolder,
        isDirectory: true,
        level: 0,
        children: [],
      });
    }

    // 构建完整路径
    let currentPath = rootFolder;
    let parent = pathMap.get(rootFolder);

    // 处理中间目录
    for (let i = 1; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const newPath = `${currentPath}/${part}`;

      if (!pathMap.has(newPath)) {
        const newNode = {
          name: part,
          path: newPath,
          isDirectory: true,
          level: i,
          children: [],
        };
        pathMap.set(newPath, newNode);
        parent.children.push(newNode);
      }

      currentPath = newPath;
      parent = pathMap.get(newPath);
    }

    // 添加文件
    if (pathParts.length > 1) {
      const fileName = pathParts[pathParts.length - 1];
      const filePath = file.webkitRelativePath;

      const fileNode = {
        name: fileName,
        path: filePath,
        isDirectory: false,
        level: pathParts.length - 1,
        size: file.size,
        file: file,
      };

      parent.children.push(fileNode);
    }
  });

  // 将树形结构转换为扁平列表，保持正确的顺序
  const flattenTree = (node, result = []) => {
    result.push(node);

    if (node.children) {
      // 先处理目录，再处理文件
      const dirs = node.children.filter((child) => child.isDirectory);
      const files = node.children.filter((child) => !child.isDirectory);

      // 递归处理目录
      dirs.forEach((dir) => flattenTree(dir, result));

      // 添加文件
      files.forEach((file) => result.push(file));
    }

    return result;
  };

  // 获取根目录
  const root = pathMap.get(files[0].webkitRelativePath.split("/")[0]);

  // 先添加根目录
  fileTree.value.push({
    name: root.name,
    path: root.path,
    isDirectory: true,
    level: 0,
  });

  // 然后添加所有子节点
  const allNodes = [];

  // 先处理目录
  root.children
    .filter((child) => child.isDirectory)
    .forEach((dir) => {
      flattenTree(dir, allNodes);
    });

  // 再处理文件
  root.children
    .filter((child) => !child.isDirectory)
    .forEach((file) => {
      allNodes.push(file);
    });

  // 添加到文件树
  fileTree.value = fileTree.value.concat(allNodes);

  console.log("构建的文件树:", fileTree.value);
};
// 开始上传
const startUpload = async () => {
  if (!selectedFolder.value) return;

  isUploading.value = true;
  uploadedCount.value = 0;

  // 获取文件和目录
  const directories = fileTree.value.filter((node) => node.isDirectory);
  const files = fileTree.value.filter((node) => !node.isDirectory);

  // 计算总操作数（创建目录树 + 上传文件）
  totalCount.value = 1 + files.length; // 1个批量创建目录的操作 + 文件数量

  try {
    // 1. 构建目录树结构
    const baseMenuLevel = props.currentMenu?.menuLevel
      ? props.currentMenu.menuLevel + 1
      : 1;
    console.log(
      "当前菜单级别:",
      props.currentMenu?.menuLevel,
      "基础菜单级别:",
      baseMenuLevel
    );

    // 添加根目录
    const directoryTree = {
      menuName: selectedFolder.value.name,
      parentId: props.parentMenuId,
      menuLevel: baseMenuLevel,
      displayPath: `/${selectedFolder.value.name}`,
      children: [],
    };

    // 按层级排序目录，跳过根目录
    const sortedDirs = [...directories]
      .filter((dir) => dir.level > 0)
      .sort((a, b) => a.level - b.level);

    // 处理子目录
    const pathToNodeMap = new Map();
    pathToNodeMap.set(selectedFolder.value.name, directoryTree);

    for (const dir of sortedDirs) {
      const pathParts = dir.path.split("/");
      const parentPath = pathParts.slice(0, -1).join("/");
      const parentNode = pathToNodeMap.get(parentPath);

      if (parentNode) {
        const newNode = {
          menuName: dir.name,
          parentId: null, // 将由后端填充
          menuLevel: parentNode.menuLevel + 1,
          displayPath: `${parentNode.displayPath}/${dir.name}`,
          children: [],
        };

        if (!parentNode.children) {
          parentNode.children = [];
        }

        parentNode.children.push(newNode);
        pathToNodeMap.set(dir.path, newNode);
      }
    }

    // 2. 批量创建目录
    currentOperation.value = `批量创建目录...`;
    console.log("发送的目录树:", directoryTree);
    const dirRes = await menuService.batchCreateDirectories(directoryTree);

    if (dirRes.code === 200) {
      uploadedCount.value++;

      // 3. 创建目录ID映射
      const directoryMap = new Map();

      // 递归处理目录映射
      const processDirMap = (node) => {
        // 使用displayPath作为键
        directoryMap.set(node.displayPath.substring(1), node.id); // 去掉开头的/

        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            processDirMap(child);
          }
        }
      };

      processDirMap(dirRes.data);
      console.log("目录ID映射:", directoryMap);

      // 4. 并发上传文件
      currentOperation.value = `准备上传文件...`;

      await fileService.concurrentUploadFiles(files, directoryMap, {
        maxConcurrent: maxConcurrentUploads,
        onProgress: (completed, total) => {
          uploadedCount.value = completed + 1; // +1 是因为目录创建操作
        },
        onFileStart: (file) => {
          currentOperation.value = `上传文件: ${file.path}`;
        },
        onFileComplete: (file) => {
          // 文件上传完成的回调
        },
        onFileError: (file, error) => {
          console.error(`上传文件失败: ${file.path}`, error);
        },
      });

      // 触发完成事件
      emit("upload-complete");
    } else {
      throw new Error(`批量创建目录失败: ${dirRes.message}`);
    }
  } catch (error) {
    console.error("上传过程出错:", error);
    currentOperation.value = `错误: ${error.message}`;
    emit("upload-error", error);
  } finally {
    isUploading.value = false;
  }
};

// 辅助函数
const readEntriesPromise = (dirReader) => {
  return new Promise((resolve) => {
    dirReader.readEntries((entries) => {
      resolve(entries);
    });
  });
};

const getFileFromEntry = (entry) => {
  return new Promise((resolve) => {
    entry.file(resolve);
  });
};

// 格式化文件大小
const formatSize = (size) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

// 关闭对话框
const onClose = () => {
  if (isUploading.value) return;

  selectedFolder.value = null;
  fileTree.value = [];
  emit("close");
};
</script>

<style scoped>
.folder-upload-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.folder-upload-dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.folder-upload-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.folder-upload-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-area {
  margin: 16px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover,
.upload-area.dragging {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.upload-icon {
  color: #64748b;
  margin-bottom: 16px;
}

.folder-info {
  margin: 16px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.folder-info h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1rem;
}

.folder-stats {
  display: flex;
  gap: 16px;
}

.folder-stats p {
  margin: 0;
  color: #64748b;
}

.file-tree {
  margin: 0 16px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.file-tree-header {
  padding: 8px 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
}

.file-tree-content {
  padding: 8px 0;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  font-size: 14px;
}

.tree-node:hover {
  background-color: #f1f5f9;
}

.root-node {
  font-weight: 500;
}

.tree-children {
  margin-left: 0;
}

.file-node {
  color: #64748b;
}

.upload-progress {
  margin: 16px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-bar-container {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-bar {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.current-operation {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-upload-footer {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn,
.upload-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: none;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-btn {
  background-color: #3b82f6;
  border: none;
  color: white;
}

.upload-btn:hover:not(:disabled) {
  background-color: #2563eb;
}

.upload-btn:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>