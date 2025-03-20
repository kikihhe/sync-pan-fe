<template>
  <div v-if="show" class="upload-dialog-overlay">
    <div class="upload-dialog">
      <div class="upload-dialog-header">
        <h3>{{ isFolder ? "上传文件夹" : "上传文件" }}</h3>
        <button class="close-btn" @click="onClose">
          <X :size="20" />
        </button>
      </div>

      <div
        class="upload-area"
        @drop.prevent="handleDrop"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        :class="{ dragging: isDragging }"
        @click="triggerFileInput"
      >
        <input
          type="file"
          ref="fileInput"
          :multiple="!isFolder"
          :webkitdirectory="isFolder"
          style="display: none"
          @change="handleFileSelect"
        />
        <div class="upload-icon">
          <FolderUp :size="48" v-if="isFolder" />
          <Upload :size="48" v-else />
        </div>
        <p>单击或拖动{{ isFolder ? '文件夹' : '文件' }}到此区域上传</p>
      </div>

      <!-- 文件列表 -->
      <div class="file-list" v-if="selectedFiles.length > 0">
        <div class="file-list-header">
          <span class="file-name">名称</span>
          <div class="file-size-wrapper">
            <span>大小</span>
            <div class="tooltip-container">
              <HelpCircle :size="14" class="help-icon" />
              <span class="tooltip-text">文件大于 10M 时将使用分片上传</span>
            </div>
          </div>
        </div>
        
        <div class="file-items">
          <div class="file-item" v-for="file in selectedFiles" :key="file.path">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatSize(file.size) }}</span>
          </div>
        </div>
        
        <div class="total-size" v-if="selectedFiles.length > 0">
          总大小: {{ formatSize(totalSize) }}
        </div>
      </div>

      <div class="upload-dialog-footer">
        <button class="cancel-btn" @click="onClose">取消</button>
        <button
          class="upload-btn"
          @click="handleUpload"
          :disabled="selectedFiles.length === 0"
        >
          开始上传
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Upload, FolderUp, X, HelpCircle } from "lucide-vue-next";
import { fileService } from '@/api/FileService.js';

const props = defineProps({
  show: Boolean,
  isFolder: Boolean,
  parentMenuId: [String, Number, null],
  currentMenu: {
    type: Object,
    default: () => ({ menuLevel: 0 }),
  },
});

const emit = defineEmits(["close", "upload-complete", "upload-error"]);

const isDragging = ref(false);
const fileInput = ref(null);
const selectedFiles = ref([]);

// 计算总大小
const totalSize = computed(() => {
  return selectedFiles.value.reduce((total, file) => total + file.size, 0);
});

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click();
};

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (props.isFolder) {
    // 处理文件夹上传
    const folderFiles = files.map((file) => ({
      name: file.webkitRelativePath || file.name,
      size: file.size,
      file: file,
    }));
    selectedFiles.value = folderFiles;
  } else {
    // 处理文件上传
    const selectedFilesList = files.map((file) => ({
      name: file.name,
      size: file.size,
      file: file,
    }));
    selectedFiles.value = selectedFilesList;
  }
};

// 处理拖拽
const handleDragOver = (e) => {
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  isDragging.value = false;
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer.files);
  if (props.isFolder) {
    // 仅处理文件夹
    const items = e.dataTransfer.items;
    if (items) {
      const folderItem = Array.from(items).find((item) => {
        const entry = item.webkitGetAsEntry();
        return entry && entry.isDirectory;
      });
      if (folderItem) {
        const entry = folderItem.webkitGetAsEntry();
        traverseDirectory(entry);
      }
    }
  } else {
    // 处理文件
    selectedFiles.value = files.map((file) => ({
      name: file.name,
      size: file.size,
      file: file,
    }));
  }
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

// 处理上传
const handleUpload = async () => {
  console.log('开始上传, parentMenuId: ', props.parentMenuId)
  try {
    for (const fileItem of selectedFiles.value) {
      const res = await fileService.uploadSingleFile(
        fileItem.file,
        props.parentMenuId
      );
      if (res.code !== 200) {
        console.error("文件上传失败:", fileItem.name);
      }
    }
    emit("file-upload-complete");
    onClose();
  } catch (error) {
    console.error("上传过程中出错:", error);
    emit("upload-error", error);
  }
};

// 关闭对话框
const onClose = () => {
  selectedFiles.value = [];
  emit("close");
};
</script>

<style scoped>
.upload-dialog-overlay {
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

.upload-dialog {
  background: white;
  border-radius: .5rem;
  width: 90%;
  max-width: 37.5rem;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.upload-dialog-header {
  padding: 1rem;
  border-bottom: .0625rem solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-dialog-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: .25rem;
  border-radius: .25rem;
}

.close-btn:hover {
  background-color: #f1f5f9;
}

.upload-area {
  margin: 1rem;
  border: .125rem dashed #e2e8f0;
  border-radius: .5rem;
  padding: 2rem;
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
  margin-bottom: 1rem;
}

.file-list {
  margin: 0 1rem;
  max-height: 18.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: .0625rem solid #e2e8f0;
  border-radius: .25rem;
}

.file-list-header {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: .5rem 1rem;
  background-color: #f8fafc;
  border-bottom: .0625rem solid #e2e8f0;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 2;
}

.file-size-wrapper {
  display: flex;
  align-items: center;
  gap: .375rem;
  position: relative;
}

.help-icon {
  color: #64748b;
  cursor: help;
}

.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip-text {
  visibility: hidden;
  width: 12.5rem;
  background-color: #1e293b;
  color: #fff;
  text-align: center;
  border-radius: .25rem;
  padding: .375rem .5rem;
  position: absolute;
  z-index: 9999;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  font-weight: normal;
  font-size: .75rem;
  white-space: nowrap;
  box-shadow: 0 .125rem .3125rem rgba(0, 0, 0, 0.2);
}

.tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -0.3125rem;
  border-width: .3125rem;
  border-style: solid;
  border-color: #1e293b transparent transparent transparent;
}

.tooltip-container:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}

.file-items {
  overflow-y: auto;
  max-height: 12.5rem;
}

.file-item {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: .5rem 1rem;
  border-bottom: .0625rem solid #e2e8f0;
}

.file-item:last-child {
  border-bottom: none;
}

.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #64748b;
}

.total-size {
  padding: .5rem 1rem;
  background-color: #f8fafc;
  border-top: .0625rem solid #e2e8f0;
  text-align: right;
  font-weight: 500;
  margin-top: auto;
}

.upload-dialog-footer {
  padding: 1rem;
  border-top: .0625rem solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
  margin-top: auto;
}

.cancel-btn,
.upload-btn {
  padding: .5rem 1rem;
  border-radius: .25rem;
  cursor: pointer;
  font-size: .875rem;
}

.cancel-btn {
  background: none;
  border: .0625rem solid #e2e8f0;
  color: #64748b;
}

.cancel-btn:hover {
  background-color: #f1f5f9;
}

.upload-btn {
  background-color: #3b82f6;
  border: none;
  color: white;
}

.upload-btn:hover {
  background-color: #2563eb;
}

.upload-btn:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
</style>