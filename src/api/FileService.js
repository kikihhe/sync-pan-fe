import httpClient from '@/utils/ajax'
import SparkMD5 from 'spark-md5'

const calculateMD5 = (file) => {
    return new Promise((resolve) => {
        const chunkSize = 2097152 // 2m
        const spark = new SparkMD5.ArrayBuffer()
        const fileReader = new FileReader()
        let currentChunk = 0

        fileReader.onload = (e) => {
            spark.append(e.target.result)
            currentChunk++
            if (currentChunk * chunkSize < file.size) {
                loadNext()
            } else {
                resolve(spark.end())
            }
        }

        const loadNext = () => {
            const start = currentChunk * chunkSize
            const end = Math.min(start + chunkSize, file.size)
            fileReader.readAsArrayBuffer(file.slice(start, end))
        }

        loadNext()
    })
}

export const uploadSingleFile = async (file, menuId) => {
    const formData = new FormData()

    formData.append('fileName', file.name)
    formData.append('fileType', file.name.split('.').pop() || '') // Get extension
    formData.append('menuId', menuId || '')
    const fileHash = await calculateMD5(file)
    formData.append('identifier', fileHash)
    formData.append('multipartFile', file)

    // Send request
    const res = await httpClient.post('/file/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

    return res
}

// 修改文件
export const updateFile = async (data) => {
    return await httpClient.post('/file/updateFile', data)
}

// 删除文件
export const deleteFile = async (data) => {
    return await httpClient.post('/file/delete', data)
}

// 预览文件
export const previewFile = async (fileId) => {
    return httpClient.get(`/file/preview?fileId=${fileId}`, {
        responseType: 'blob',
        headers: {
            'Cache-Control': 'no-cache', // 防止缓存旧文件
            'Pragma': 'no-cache'
        }
    });
};

// 并发上传文件
export const concurrentUploadFiles = async (files, directoryMap, options = {}) => {
    const {
        maxConcurrent = 5,
        onProgress = () => { },
        onFileStart = () => { },
        onFileComplete = () => { },
        onFileError = () => { }
    } = options

    let completed = 0
    const total = files.length

    // 创建一个队列来管理上传任务
    const queue = [...files]
    const activeUploads = new Set()

    // 处理单个文件上传
    const processFile = async (file) => {
        try {
            onFileStart(file)

            // 根据文件路径找到对应的目录ID
            const filePath = file.path
            const lastSlashIndex = filePath.lastIndexOf('/')
            const dirPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : ''

            // 构建displayPath
            const displayPath = '/' + dirPath

            // 从directoryMap中找到对应的目录ID
            let menuId = null
            for (const [path, id] of directoryMap.entries()) {
                // 如果是根目录文件
                if (lastSlashIndex <= 0 && path === file.path.split('/')[0]) {
                    menuId = id
                    break
                }
                // 如果是子目录文件
                else if (path === dirPath) {
                    menuId = id
                    break
                }
            }

            if (!menuId) {
                throw new Error(`找不到文件 ${file.path} 对应的目录ID`)
            }

            // 上传文件
            await uploadSingleFile(file.file, menuId)

            onFileComplete(file)
        } catch (error) {
            onFileError(file, error)
        } finally {
            activeUploads.delete(file)
            completed++
            onProgress(completed, total)

            // 从队列中取出下一个文件进行上传
            if (queue.length > 0) {
                const nextFile = queue.shift()
                activeUploads.add(nextFile)
                processFile(nextFile)
            }
        }
    }

    // 启动初始的并发上传
    const initialBatch = Math.min(maxConcurrent, queue.length)
    for (let i = 0; i < initialBatch; i++) {
        const file = queue.shift()
        activeUploads.add(file)
        processFile(file)
    }

    // 等待所有上传完成
    return new Promise((resolve) => {
        const checkComplete = setInterval(() => {
            if (completed === total) {
                clearInterval(checkComplete)
                resolve()
            }
        }, 100)
    })
}
const baseURL = import.meta.env.VITE_API_BASE_URL
// 获取已删除文件列表
export const getDeletedFiles = async (params) => {
    return await httpClient.post('/file/getDeletedFile', params);
};

// 彻底删除文件
export const permanentDeleteFile = async (fileId) => {
    return await httpClient.post('/file/permanentDelete', { fileId });
};

// 恢复已删除文件
export const restoreDeletedFile = async (fileId, targetMenuId) => {
    return await httpClient.post('/file/recycle', { fileId, targetMenuId });
};

// 下载文件
export const downloadFile = (fileId) => {
    console.log('触发下载接口')
    // 创建一个隐藏的 a 标签来触发下载
    const downloadLink = document.createElement('a')
    downloadLink.href = `${baseURL}/file/download?id=${fileId}`
    // downloadLink.target = '_blank'
    
    // 添加到文档中并触发点击
    document.body.appendChild(downloadLink)
    downloadLink.click()
    
    // 清理 DOM
    setTimeout(() => {
      document.body.removeChild(downloadLink)
    }, 100)
}
  
export const fileService = {
    uploadSingleFile,
    updateFile,
    deleteFile,
    previewFile,
    concurrentUploadFiles,
    downloadFile,
    getDeletedFiles,
    permanentDeleteFile,
    restoreDeletedFile,
}