<template>
  <el-dialog
    v-model="dialogVisible"
    title="文件预览"
    width="60%"
    append-to-body
    @close="handleClose"
  >
    <div class="preview-container" v-loading="loading">
      <!-- Office文档预览 -->
      <vue-office-docx
        v-if="fileType === 'docx'"
        :src="fileUrl"
        style="height: 100%"
        @rendered="handleRendered"
        @error="handleError"
      />

      <vue-office-excel
        v-if="fileType === 'xlsx'"
        :src="fileUrl"
        style="height: 78vh"
        @rendered="handleRendered"
        @error="handleError"
      />

      <vue-office-pdf
        v-if="fileType === 'pdf'"
        :src="fileUrl"
        style="height: 100%"
        @rendered="handleRendered"
        @error="handleError"
      />

      <!-- 图片预览 -->
      <el-image
        v-if="fileType === 'image'"
        :src="fileUrl"
        fit="contain"
        style="width: 100%; height: 100%"
        @load="handleRendered"
        @error="handleError"
      />

      <!-- 视频预览 -->
      <video
        v-if="fileType === 'video'"
        controls
        controlslist="nodownload"
        style="width: 100%"
      >
        <source :src="fileUrl" />
        您的浏览器不支持视频播放
      </video>

      <!-- 音频预览 -->
      <audio
        v-if="fileType === 'audio'"
        controls
        controlslist="nodownload"
        style="width: 100%"
      >
        <source :src="fileUrl" type="audio/mpeg" />
        您的浏览器不支持音频播放
      </audio>

      <!-- 文本预览 -->
      <pre v-if="fileType === 'text'" style="white-space: pre-wrap; word-wrap: break-word;">
        {{ fileContent }}
      </pre>

      <!-- 不支持的文件类型 -->
      <div v-if="fileType === 'unknown'" class="unsupported-file">
        <el-icon><WarningFilled /></el-icon>
        <p>该文件类型暂不支持预览</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import VueOfficePdf from '@vue-office/pdf'
import '@vue-office/docx/lib/index.css'
import '@vue-office/excel/lib/index.css'
import { fileService } from '@/api/FileService'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  fileId: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = ref(props.visible)
const loading = ref(true)
const fileUrl = ref('')
const fileContent = ref('')
const fileType = ref('unknown')

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 监听对话框可见性变化
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 检测文件类型
const detectFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase()
  
  const types = {
    // 图片
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image', webp: 'image',
    // 文档
    pdf: 'pdf',
    doc: 'docx', docx: 'docx',
    xls: 'xlsx', xlsx: 'xlsx',
    // 文本
    txt: 'text', json: 'text', xml: 'text', md: 'text',
    // 音视频
    mp3: 'audio', wav: 'audio', ogg: 'audio',
    mp4: 'video', webm: 'video', mov: 'video'
  }
  
  return types[extension] || 'unknown'
}

// 加载文件
const loadFile = async () => {
  try {
    console.log('开始加载文件:', props.fileName, '文件ID:', props.fileId)
    loading.value = true
    const response = await fileService.previewFile(props.fileId)
    console.log('获取到文件响应:', response)
    
    if (!response || !(response instanceof Blob)) {
      console.error('响应不是Blob类型:', response)
      throw new Error('无效的文件响应')
    }

    fileType.value = detectFileType(props.fileName)
    console.log('检测到文件类型:', fileType.value)

    if (fileType.value === 'text') {
      console.log('处理文本文件')
      // 文本文件直接读取内容
      const textContent = await response.text()
      console.log('文本内容长度:', textContent ? textContent.length : 0)
      if (!textContent && textContent !== '') {
        console.error('文本内容为空或无效')
        throw new Error('无法读取文本内容')
      }
      fileContent.value = textContent
    } else {
      console.log('处理二进制文件，MIME类型:', response.type)
      // 其他类型创建blob URL
      const blob = new Blob([response], { type: response.type })
      console.log('创建Blob对象:', blob.size, '字节')
      const url = URL.createObjectURL(blob)
      if (!url) {
        console.error('URL创建失败')
        throw new Error('无法创建文件URL')
      }
      console.log('创建URL成功:', url)
      fileUrl.value = url
    }
  } catch (error) {
    console.error('文件预览错误:', error)
    ElMessage.error('文件加载失败：' + (error.message || '未知错误'))
    handleClose()
  }
}

// 渲染完成回调
const handleRendered = () => {
  loading.value = false
}

// 错误处理
const handleError = (error) => {
  console.error('预览错误：', error)
  ElMessage.error('文件预览失败')
  loading.value = false
}

// 关闭对话框
const handleClose = () => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
  }
  dialogVisible.value = false
  loading.value = true
  fileUrl.value = ''
  fileContent.value = ''
}

// 组件挂载时加载文件
onMounted(() => {
  if (props.visible && props.fileId) {
    loadFile()
  }
})
</script>

<style scoped>
.preview-container {
  min-height: 400px;
  max-height: 80vh;
  overflow: auto;
  position: relative;
}

.unsupported-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.unsupported-file .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
</style>