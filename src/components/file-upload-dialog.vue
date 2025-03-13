<template>
  <div v-if="show" class="upload-dialog-overlay">
    <div class="upload-dialog">
      <div class="upload-dialog-header">
        <h3>{{ isFolder ? '上传文件夹' : '上传文件' }}</h3>
        <button class="close-btn" @click="onClose">
          <X :size="20"/>
        </button>
      </div>

      <div
          class="upload-area"
          @drop.prevent="handleDrop"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          :class="{ 'dragging': isDragging }"
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
          <FolderUp :size="48" v-if="isFolder"/>
          <Upload :size="48" v-else/>
        </div>
        <p>单击或拖动{{ isFolder ? '文件夹' : '文件' }}到此区域上传</p>
      </div>

      <!-- 文件列表 -->
      <div class="file-list" v-if="selectedFiles.length > 0">
        <div class="file-list-header">
          <span class="file-name">名称</span>
          <span class="file-size">大小</span>
        </div>
        <div class="file-item" v-for="file in selectedFiles" :key="file.path">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatSize(file.size) }}</span>
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
import {ref, computed} from 'vue'
import {Upload, FolderUp, X} from 'lucide-vue-next'

const props = defineProps({
  show: Boolean,
  isFolder: Boolean
})

const emit = defineEmits(['close', 'upload'])

const isDragging = ref(false)
const fileInput = ref(null)
const selectedFiles = ref([])

// 计算总大小
const totalSize = computed(() => {
  return selectedFiles.value.reduce((total, file) => total + file.size, 0)
})

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (props.isFolder) {
    // 处理文件夹上传
    const folderFiles = files.map(file => ({
      name: file.webkitRelativePath || file.name,
      size: file.size,
      file: file
    }))
    selectedFiles.value = folderFiles
  } else {
    // 处理文件上传
    const selectedFilesList = files.map(file => ({
      name: file.name,
      size: file.size,
      file: file
    }))
    selectedFiles.value = selectedFilesList
  }
}

// 处理拖拽
const handleDragOver = (e) => {
  isDragging.value = true
}

const handleDragLeave = (e) => {
  isDragging.value = false
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)
  if (props.isFolder) {
    // 仅处理文件夹
    const items = e.dataTransfer.items
    if (items) {
      const folderItem = Array.from(items).find(item => {
        const entry = item.webkitGetAsEntry()
        return entry && entry.isDirectory
      })
      if (folderItem) {
        const entry = folderItem.webkitGetAsEntry()
        traverseDirectory(entry)
      }
    }
  } else {
    // 处理文件
    selectedFiles.value = files.map(file => ({
      name: file.name,
      size: file.size,
      file: file
    }))
  }
}

// 遍历目录
const traverseDirectory = async (entry) => {
  const files = []

  const readEntries = async (dirReader) => {
    return new Promise((resolve) => {
      dirReader.readEntries(async (entries) => {
        for (const entry of entries) {
          if (entry.isFile) {
            const file = await getFile(entry)
            files.push({
              name: entry.fullPath.slice(1),
              size: file.size,
              file: file
            })
          } else if (entry.isDirectory) {
            await traverseDirectory(entry)
          }
        }
        resolve()
      })
    })
  }

  const dirReader = entry.createReader()
  await readEntries(dirReader)
  selectedFiles.value = files
}

// 获取文件
const getFile = (entry) => {
  return new Promise((resolve) => {
    entry.file(resolve)
  })
}

// 格式化文件大小
const formatSize = (size) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = size
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`
}

// 处理上传
const handleUpload = () => {
  emit('upload', selectedFiles.value)
  onClose()
}

// 关闭对话框
const onClose = () => {
  selectedFiles.value = []
  emit('close')
}
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
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.upload-dialog-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-dialog-header h3 {
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

.close-btn:hover {
  background-color: #f1f5f9;
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

.upload-area:hover, .upload-area.dragging {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.upload-icon {
  color: #64748b;
  margin-bottom: 16px;
}

.file-list {
  margin: 0 16px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.file-list-header {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 8px 16px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
}

.file-item {
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 8px 16px;
  border-bottom: 1px solid #e2e8f0;
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
  padding: 8px 16px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  text-align: right;
  font-weight: 500;
}

.upload-dialog-footer {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cancel-btn, .upload-btn {
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