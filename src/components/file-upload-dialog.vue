<template>
  <div v-if="show" class="upload-dialog-overlay">
    <div class="upload-dialog">
      <div class="upload-dialog-header">
        <h3>上传文件</h3>
        <button class="close-btn" @click="onClose" :disabled="isUploading">
          <X :size="20"/>
        </button>
      </div>

      <div
          v-if="!isUploading"
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
            multiple
            style="display: none"
            @change="handleFileSelect"
        />
        <div class="upload-icon">
          <Upload :size="48"/>
        </div>
        <p>单击或拖动文件到此区域上传</p>
      </div>

      <!-- 上传进度 -->
      <div v-if="isUploading" class="upload-progress">
        <div class="progress-header">
          <span>上传进度</span>
          <span>{{ uploadedCount }}/{{ totalCount }}</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        <div class="current-operation">
          {{ currentOperation }}
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-list" v-if="selectedFiles.length > 0 && !isUploading">
        <div class="file-list-header">
          <span class="file-path">路径</span>
          <span class="file-size">大小</span>
        </div>
        <div class="file-item" v-for="file in selectedFiles" :key="file.path">
          <div class="file-path-container">
            <span class="file-path" :title="file.path">{{ file.path }}</span>
            <button class="copy-path-btn" @click="copyPath(file.path)" title="复制路径">
              <Copy :size="14"/>
            </button>
          </div>
          <span class="file-size">{{ formatSize(file.size) }}</span>
        </div>
        <div class="total-size" v-if="selectedFiles.length > 0">
          总大小: {{ formatSize(totalSize) }}
        </div>
      </div>

      <div class="upload-dialog-footer">
        <button class="cancel-btn" @click="onClose" :disabled="isUploading">取消</button>
        <button
            class="upload-btn"
            @click="startUpload"
            :disabled="selectedFiles.length === 0 || isUploading"
        >
          开始上传
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed} from 'vue'
import {Upload, Copy, X} from 'lucide-vue-next'
import {fileService} from '@/api/FileService.js'

const props = defineProps({
  show: Boolean,
  parentMenuId: [String, Number, null],
  currentMenu: {
    type: Object,
    default: () => ({id: null, menuLevel: 0})
  }
})

const emit = defineEmits(['close', 'uploadComplete'])

// 状态变量
const isDragging = ref(false)
const fileInput = ref(null)
const selectedFiles = ref([])
const isUploading = ref(false)
const uploadedCount = ref(0)
const totalCount = ref(0)
const currentOperation = ref('')

// 计算总大小
const totalSize = computed(() => {
  return selectedFiles.value.reduce((total, file) => total + file.size, 0)
})

// 上传进度
const uploadProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((uploadedCount.value / totalCount.value) * 100)
})

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  // 处理文件上传
  const selectedFilesList = files.map(file => ({
    name: file.name,
    path: getFilePath(file),
    size: file.size,
    file: file
  }))
  selectedFiles.value = selectedFilesList
}

// 尝试获取更完整的文件路径
const getFilePath = (file) => {
  // 对于文件夹上传，使用webkitRelativePath
  if (file.webkitRelativePath) {
    return file.webkitRelativePath;
  }

  // 回退到文件名
  return file.name;
}

// 复制路径
const copyPath = (path) => {
  navigator.clipboard.writeText(path)
      .then(() => {
        alert('路径已复制到剪贴板')
      })
      .catch(err => {
        console.error('复制失败:', err)
      })
}

// 处理拖拽
const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files)

  // 处理文件
  selectedFiles.value = files.map(file => ({
    name: file.name,
    path: file.name,
    size: file.size,
    file: file
  }))
}

// 开始上传
const startUpload = async () => {
  if (selectedFiles.value.length === 0) return

  isUploading.value = true
  uploadedCount.value = 0
  totalCount.value = selectedFiles.value.length

  try {
    for (const file of selectedFiles.value) {
      currentOperation.value = `上传文件: ${file.name}`

      try {
        const res = await fileService.uploadSingleFile(file.file, props.currentMenu?.id)
        if (res.code === 200) {
          uploadedCount.value++
        } else {
          console.error(`上传文件失败: ${file.name}`, res.msg)
          currentOperation.value = `上传失败: ${file.name} - ${res.msg}`
        }
      } catch (error) {
        console.error(`上传文件出错: ${file.name}`, error)
        currentOperation.value = `上传出错: ${file.name} - ${error.message}`
      }
    }

    // 上传完成
    emit('uploadComplete')
  } catch (error) {
    console.error('上传过程出错:', error)
    currentOperation.value = `错误: ${error.message}`
  } finally {
    // 延迟关闭上传状态，让用户看到完成信息
    setTimeout(() => {
      isUploading.value = false
    }, 1000)
  }
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

// 关闭对话框
const onClose = () => {
  if (isUploading.value) return

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

.file-path-container {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.file-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-path-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  opacity: 0.5;
  transition: opacity 0.2s, background-color 0.2s;
}

.file-path-container:hover .copy-path-btn {
  opacity: 1;
}

.copy-path-btn:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
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