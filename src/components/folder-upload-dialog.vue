<template>
  <div v-if="show" class="folder-upload-dialog-overlay">
    <div class="folder-upload-dialog">
      <div class="folder-upload-header">
        <h3>上传文件夹</h3>
        <button class="close-btn" @click="onClose" :disabled="isUploading">
          <X :size="20"/>
        </button>
      </div>

      <!-- 上传区域 -->
      <div
          v-if="!selectedFolder"
          class="upload-area"
          @drop.prevent="handleDrop"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          :class="{ 'dragging': isDragging }"
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
          <FolderUp :size="48"/>
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
          <div class="progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
        </div>
        <div class="current-operation">
          {{ currentOperation }}
        </div>
      </div>

      <!-- 文件树结构 -->
      <div v-if="selectedFolder && !isUploading" class="file-tree">
        <div class="file-tree-header">文件夹结构</div>
        <div class="file-tree-content">
          <div class="tree-node root-node">
            <FolderOpen :size="16"/>
            <span>{{ selectedFolder.name }}</span>
          </div>
          <div class="tree-children">
            <template v-for="(node, index) in fileTree" :key="index">
              <div class="tree-node" :style="{ paddingLeft: `${node.level * 20}px` }">
                <template v-if="node.isDirectory">
                  <Folder :size="16"/>
                </template>
                <template v-else>
                  <File :size="16"/>
                </template>
                <span :title="node.path">{{ node.name }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="folder-upload-footer">
        <button class="cancel-btn" @click="onClose" :disabled="isUploading">取消</button>
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

import {ref, computed, reactive} from 'vue'
import {FolderUp, FolderOpen, Folder, File, X} from 'lucide-vue-next'
import {fileService} from '@/api/FileService.js'

const props = defineProps({
  show: Boolean,
  parentMenuId: [String, Number, null],
  currentMenu: {
    type: Object,
    default: () => ({ menuLevel: 0 })
  }
})

const emit = defineEmits(['close', 'uploadComplete'])

// 状态变量
const isDragging = ref(false)
const folderInput = ref(null)
const selectedFolder = ref(null)
const fileTree = ref([])
const isUploading = ref(false)
const uploadedCount = ref(0)
const totalCount = ref(0)
const currentOperation = ref('')

// 上传进度
const uploadProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((uploadedCount.value / totalCount.value) * 100)
})

// 文件和目录计数
const fileCount = computed(() => {
  return fileTree.value.filter(node => !node.isDirectory).length
})

const dirCount = computed(() => {
  return fileTree.value.filter(node => node.isDirectory).length
})

// 总大小
const totalSize = computed(() => {
  return fileTree.value.reduce((total, node) => {
    return total + (node.isDirectory ? 0 : node.size)
  }, 0)
})

// 触发文件夹选择
const triggerFolderInput = () => {
  folderInput.value.click()
}

// 处理文件夹选择
const handleFolderSelect = (event) => {
  const files = Array.from(event.target.files)
  if (files.length === 0) return

  // 获取根文件夹名称
  const rootPath = files[0].webkitRelativePath.split('/')[0]
  selectedFolder.value = {name: rootPath}

  // 构建文件树
  buildFileTree(files)
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
  const items = e.dataTransfer.items

  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const entry = item.webkitGetAsEntry()

      if (entry && entry.isDirectory) {
        selectedFolder.value = {name: entry.name}
        traverseDirectory(entry)
        break
      }
    }
  }
}

// 遍历目录
const traverseDirectory = async (entry, path = '') => {
  fileTree.value = []
  const traverseHelper = async (entry, path, level) => {
    if (entry.isFile) {
      const file = await getFileFromEntry(entry)
      fileTree.value.push({
        name: entry.name,
        path: path ? `${path}/${entry.name}` : entry.name,
        size: file.size,
        isDirectory: false,
        file: file,
        level
      })
    } else if (entry.isDirectory) {
      fileTree.value.push({
        name: entry.name,
        path: path ? `${path}/${entry.name}` : entry.name,
        isDirectory: true,
        children: [],
        level
      })

      const dirReader = entry.createReader()
      const entries = await readEntriesPromise(dirReader)

      for (const childEntry of entries) {
        await traverseHelper(
            childEntry,
            path ? `${path}/${entry.name}` : entry.name,
            level + 1
        )
      }
    }
  }

  await traverseHelper(entry, path, 0)

  // 按路径排序
  fileTree.value.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.path.localeCompare(b.path)
  })
}

// 从文件列表构建文件树
const buildFileTree = (files) => {
  fileTree.value = []

  files.forEach(file => {
    const pathParts = file.webkitRelativePath.split('/')
    const fileName = pathParts.pop()
    const dirPath = pathParts.join('/')

    // 添加目录节点
    for (let i = 1; i < pathParts.length; i++) {
      const currentPath = pathParts.slice(0, i + 1).join('/')
      if (!fileTree.value.some(node => node.path === currentPath && node.isDirectory)) {
        fileTree.value.push({
          name: pathParts[i],
          path: currentPath,
          isDirectory: true,
          level: i
        })
      }
    }

    // 添加文件节点
    fileTree.value.push({
      name: fileName,
      path: file.webkitRelativePath,
      size: file.size,
      isDirectory: false,
      file: file,
      level: pathParts.length
    })
  })

  // 按路径排序
  fileTree.value.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1
    if (!a.isDirectory && b.isDirectory) return 1
    return a.path.localeCompare(b.path)
  })
}

// 开始上传
const startUpload = async () => {
  if (!selectedFolder.value) return

  isUploading.value = true
  uploadedCount.value = 0

  // 计算总操作数（创建目录 + 上传文件）
  const directories = fileTree.value.filter(node => node.isDirectory)
  const files = fileTree.value.filter(node => !node.isDirectory)
  totalCount.value = directories.length + files.length

  try {
    // 创建目录映射表，用于跟踪远程目录ID
    const directoryMap = new Map()
    // 根目录ID
    directoryMap.set('', props.parentMenuId)

    // 按层级排序目录
    const sortedDirectories = [...directories].sort((a, b) => {
      return a.level - b.level
    })

    // 1. 首先创建根目录
    currentOperation.value = `创建根目录: ${selectedFolder.value.name}`

    // 使用 currentMenu 对象中的 menuLevel + 1 来设置上传根目录的层级
    const rootMenuLevel = props.currentMenu?.menuLevel ? props.currentMenu.menuLevel + 1 : 1

    const rootDirRes = await fileService.createDirectory({
      menuName: selectedFolder.value.name,
      parentId: props.parentMenuId,
      menuLevel: rootMenuLevel
    })

    if (rootDirRes.code === 200) {
      const rootDirId = rootDirRes.data.id
      directoryMap.set(selectedFolder.value.name, rootDirId)
      uploadedCount.value++

      // 2. 递归创建子目录并上传文件
      await processDirectories(sortedDirectories, directoryMap, rootMenuLevel)

      // 3. 上传根目录下的文件
      const rootFiles = files.filter(file => {
        const pathParts = file.path.split('/')
        return pathParts.length === 2 // 根目录/文件名
      })

      await uploadFilesToDirectory(rootFiles, rootDirId)

      emit('uploadComplete')
    } else {
      throw new Error(`创建根目录失败: ${rootDirRes.msg}`)
    }
  } catch (error) {
    console.error('上传过程出错:', error)
    currentOperation.value = `错误: ${error.message}`
  } finally {
    isUploading.value = false
  }
}

// 处理目录创建和文件上传
const processDirectories = async (directories, directoryMap, baseMenuLevel) => {
  for (const dir of directories) {
    const pathParts = dir.path.split('/')
    const parentPath = pathParts.slice(0, -1).join('/')
    const parentId = directoryMap.get(parentPath)

    if (!parentId) {
      console.error(`找不到父目录ID: ${parentPath}`)
      continue
    }

    // 创建当前目录
    currentOperation.value = `创建目录: ${dir.path}`

    // 计算当前目录的层级 = 基础层级 + 相对层级
    const currentMenuLevel = baseMenuLevel + dir.level

    const dirRes = await fileService.createDirectory({
      menuName: dir.name,
      parentId: parentId,
      menuLevel: currentMenuLevel
    })

    if (dirRes.code === 200) {
      const dirId = dirRes.data.id
      directoryMap.set(dir.path, dirId)
      uploadedCount.value++

      // 上传当前目录下的文件
      const dirFiles = fileTree.value.filter(node => {
        if (node.isDirectory) return false
        const nodePathParts = node.path.split('/')
        const nodeDirPath = nodePathParts.slice(0, -1).join('/')
        return nodeDirPath === dir.path
      })

      await uploadFilesToDirectory(dirFiles, dirId)
    } else {
      console.error(`创建目录失败: ${dir.path}`, dirRes.msg)
    }
  }
}

// 上传文件到指定目录
const uploadFilesToDirectory = async (files, directoryId) => {
  for (const file of files) {
    currentOperation.value = `上传文件: ${file.path}`
    try {
      const res = await fileService.uploadSingleFile(file.file, directoryId)
      if (res.code === 200) {
        uploadedCount.value++
      } else {
        console.error(`上传文件失败: ${file.path}`, res.msg)
      }
    } catch (error) {
      console.error(`上传文件出错: ${file.path}`, error)
    }
  }
}

// 辅助函数
const readEntriesPromise = (dirReader) => {
  return new Promise((resolve) => {
    dirReader.readEntries(entries => {
      resolve(entries)
    })
  })
}

const getFileFromEntry = (entry) => {
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

// 关闭对话框
const onClose = () => {
  if (isUploading.value) return

  selectedFolder.value = null
  fileTree.value = []
  emit('close')
}
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

.upload-area:hover, .upload-area.dragging {
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