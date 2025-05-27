import httpClient from '@/utils/ajax'
import SparkMD5 from 'spark-md5'

// 分片大小定义为20MB
const CHUNK_SIZE = 20 * 1024 * 1024
// 大文件阈值，超过此大小将使用分片上传，设置为150MB
const LARGE_FILE_THRESHOLD = 150 * 1024 * 1024

// 计算整个文件的MD5
const calculateMD5 = (file) => {
    return new Promise((resolve) => {
        const chunkSize = CHUNK_SIZE
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

// 计算单个分片的MD5
const calculateChunkMD5 = (chunk) => {
    return new Promise((resolve) => {
        const fileReader = new FileReader()
        fileReader.onload = (e) => {
            const spark = new SparkMD5.ArrayBuffer()
            spark.append(e.target.result)
            resolve(spark.end())
        }
        fileReader.readAsArrayBuffer(chunk)
    })
}

// 将文件分割成多个分片
const createFileChunks = (file, chunkSize = CHUNK_SIZE) => {
    const chunks = []
    let cur = 0
    while (cur < file.size) {
        chunks.push(file.slice(cur, cur + chunkSize))
        cur += chunkSize
    }
    return chunks
}

// 上传单个分片
const uploadChunk = async (chunk, params, onProgress) => {
    const formData = new FormData()
    
    // 添加所有参数到formData
    for (const key in params) {
        formData.append(key, params[key])
    }
    
    // 添加分片文件
    formData.append('multipartFile', chunk)
    
    // 发送请求
    const res = await httpClient.post('/file/uploadChunk', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                if (typeof onProgress === 'function') {
                    onProgress(percentCompleted)
                }
            }
        }
    })
    
    return res
}

// 合并分片
const mergeChunks = async (params) => {
    return await httpClient.post('/file/mergeChunk', params)
}

// 检查文件名是否重复
export const checkNameDuplicate = async (menuId, fileName) => {
    // 处理 menuId 为 null 的情况，将其转换为 0
    const safeMenuId = menuId === null ? 0 : menuId;
    // 对文件名进行 URL 编码以支持中文
    const encodedFileName = encodeURIComponent(fileName);
    return await httpClient.get(`/file/checkNameDuplicate?menuId=${safeMenuId}&fileName=${encodedFileName}`)
}

// 上传单个文件，根据文件大小自动选择普通上传或分片上传
export const uploadSingleFile = async (file, menuId, onProgress) => {
    // 计算文件MD5
    const fileHash = await calculateMD5(file)
    
    // 判断文件大小是否超过阈值
    if (file.size > LARGE_FILE_THRESHOLD) {
        // 大文件，使用分片上传
        return await uploadLargeFile(file, fileHash, menuId, onProgress)
    } else {
        // 小文件，使用普通上传
        const formData = new FormData()
        
        formData.append('fileName', file.name)
        formData.append('fileType', file.name.split('.').pop() || '') // 获取扩展名
        formData.append('menuId', menuId || '')
        formData.append('identifier', fileHash)
        formData.append('multipartFile', file)
        
        // 记录上传开始时间
        const uploadStartTime = Date.now()
        
        // 发送请求
        const res = await httpClient.post('/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    if (typeof onProgress === 'function') {
                        onProgress(percentCompleted)
                    }
                }
            }
        })
        
        // 记录上传结束时间和总耗时
        const uploadEndTime = Date.now()
        const totalUploadTime = uploadEndTime - uploadStartTime
        
        // 输出上传统计信息
        console.log(`文件 ${file.name} 上传完成，总大小: ${(file.size / 1024 / 1024).toFixed(2)}MB，总耗时: ${totalUploadTime}ms`)
        
        // 添加上传时间信息到返回结果
        if (res.code === 200) {
            res.uploadStats = {
                fileName: file.name,
                fileSize: file.size,
                totalUploadTime,
                totalChunks: 1
            }
        }
        
        return res
    }
}

// 上传大文件（分片上传）
const uploadLargeFile = async (file, fileHash, menuId, onProgress) => {
    // 新增大文件存在性检查
    const checkRes = await httpClient.post('/file/checkLargeFileExists', {
        identifier: fileHash,
        chunkIdentifier: '',
        chunkName: '',
        fileName: file.name,
        fileType: file.name.split('.').pop() || '',
        chunkNumber: 0,
        currentChunkSize: 0,
        totalChunks: 0,
        totalSize: file.size,
        menuId: menuId || ''
    });

    if (checkRes.code === 200) {
        console.log(`文件 ${file.name} 已存在，跳过上传`);
        return checkRes;
    }

    // 将文件分割成多个分片
    const chunks = createFileChunks(file)
    const totalChunks = chunks.length
    let uploadedChunks = 0
    let allChunksUploaded = false
    
    // 记录整个文件上传的开始时间
    const fileUploadStartTime = Date.now()
    // 记录每个分片的上传时间
    const chunkUploadTimes = []
    
    try {
        // 并发上传分片，最多5个并发
        const concurrency = 5
        const uploadQueue = [...Array(totalChunks).keys()]
        const activeUploads = new Set()
        
        // 处理单个分片上传
        const processChunk = async (chunkIndex) => {
            if (chunkIndex >= totalChunks) return
            
            // 记录分片上传开始时间
            const chunkStartTime = Date.now()
            
            const chunk = chunks[chunkIndex]
            const chunkName = await calculateChunkMD5(chunk)
            
            // 构建分片上传参数
            const params = {
                identifier: fileHash,
                chunkIdentifier: `${fileHash}_${chunkIndex}`,
                chunkName: chunkName,
                fileName: file.name,
                fileType: file.name.split('.').pop() || '',
                chunkNumber: chunkIndex,
                currentChunkSize: chunk.size,
                totalChunks: totalChunks,
                totalSize: file.size,
                menuId: menuId || ''
            }
            
            try {
                // 上传分片
                const res = await uploadChunk(chunk, params, (chunkProgress) => {
                    // 计算总体进度
                    if (typeof onProgress === 'function') {
                        const totalProgress = ((uploadedChunks + chunkProgress / 100) / totalChunks) * 100
                        onProgress(Math.min(Math.round(totalProgress), 99)) // 最多显示99%，留1%给合并操作
                    }
                })
                
                // 检查是否所有分片都已上传完成
                if (res.code === 200) {
                    uploadedChunks++
                    allChunksUploaded = res.data === true
                    
                    // 记录分片上传结束时间和耗时
                    const chunkEndTime = Date.now()
                    const chunkUploadTime = chunkEndTime - chunkStartTime
                    chunkUploadTimes.push({
                        chunkIndex,
                        size: chunk.size,
                        uploadTime: chunkUploadTime
                    })
                    console.log(`分片 ${chunkIndex} 上传完成，大小: ${(chunk.size / 1024 / 1024).toFixed(2)}MB，耗时: ${chunkUploadTime}ms`)
                    if (res.code === 10000) {
                        console.log(`该大文件可以使用秒传功能，不必上传文件`)
                        return res
                    }
                    // 如果所有分片都已上传，则合并分片
                    if (allChunksUploaded) {
                        // 合并分片
                        const mergeParams = {
                            fileName: file.name,
                            identifier: fileHash,
                            totalSize: file.size,
                            menuId: menuId || ''
                        }
                        
                        const mergeRes = await mergeChunks(mergeParams)
                        if (mergeRes.code === 200) {
                            if (typeof onProgress === 'function') {
                                onProgress(100) // 合并完成，进度100%
                            }
                            return mergeRes
                        } else {
                            throw new Error(`合并分片失败: ${mergeRes.message}`)
                        }
                    }
                } else {
                    throw new Error(`上传分片失败: ${res.message}`)
                }
            } catch (error) {
                console.error(`分片 ${chunkIndex} 上传失败:`, error)
                throw error
            } finally {
                activeUploads.delete(chunkIndex)
                
                // 从队列中取出下一个分片进行上传
                if (uploadQueue.length > 0) {
                    const nextChunkIndex = uploadQueue.shift()
                    activeUploads.add(nextChunkIndex)
                    processChunk(nextChunkIndex)
                }
            }
        }
        
        // 启动初始的并发上传
        const initialBatch = Math.min(concurrency, totalChunks)
        const initialPromises = []
        
        for (let i = 0; i < initialBatch; i++) {
            const chunkIndex = uploadQueue.shift()
            activeUploads.add(chunkIndex)
            initialPromises.push(processChunk(chunkIndex))
        }
        
        // 等待所有分片上传完成
        await Promise.all(initialPromises)
        
        // 如果所有分片都已上传但没有触发合并，手动触发合并
        if (uploadedChunks === totalChunks && !allChunksUploaded) {
            const mergeParams = {
                fileName: file.name,
                identifier: fileHash,
                totalSize: file.size,
                menuId: menuId || ''
            }
            
            const mergeRes = await mergeChunks(mergeParams)
            if (mergeRes.code === 200) {
                if (typeof onProgress === 'function') {
                    onProgress(100) // 合并完成，进度100%
                }
                return mergeRes
            } else {
                throw new Error(`合并分片失败: ${mergeRes.message}`)
            }
        }
        
        // 计算并记录整个文件的上传时间
        const fileUploadEndTime = Date.now()
        const totalUploadTime = fileUploadEndTime - fileUploadStartTime
        
        // 计算平均分片上传时间
        const avgChunkUploadTime = chunkUploadTimes.reduce((sum, chunk) => sum + chunk.uploadTime, 0) / chunkUploadTimes.length
        
        // 输出上传统计信息
        console.log(`文件 ${file.name} 上传完成，总大小: ${(file.size / 1024 / 1024).toFixed(2)}MB，总耗时: ${totalUploadTime}ms`)
        console.log(`分片数量: ${totalChunks}，平均每个分片上传耗时: ${avgChunkUploadTime.toFixed(2)}ms`)
        console.log(`分片上传详情:`, chunkUploadTimes)
        
        // 返回成功结果，包含上传时间信息
        return { 
            code: 200, 
            message: '上传成功',
            uploadStats: {
                fileName: file.name,
                fileSize: file.size,
                totalUploadTime,
                totalChunks,
                avgChunkUploadTime,
                chunkUploadTimes
            }
        }
    } catch (error) {
        console.error('分片上传失败:', error)
        throw error
    }
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
        onFileProgress = () => { },
        onFileComplete = () => { },
        onFileError = () => { }
    } = options

    let completed = 0
    const total = files.length
    
    // 记录整体上传开始时间
    const totalUploadStartTime = Date.now()
    
    // 用于收集所有文件的上传统计信息
    const uploadStats = []

    // 创建一个队列来管理上传任务
    const queue = [...files]
    const activeUploads = new Set()

    // 处理单个文件上传
    const processFile = async (file) => {
        try {
            onFileStart(file)

            // 根据文件路径找到对应的目录ID
            const filePath = file.path
            const lastSlashIndex = filePath ? filePath.lastIndexOf('/') : -1
            const dirPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : ''

            // 构建displayPath
            const displayPath = '/' + dirPath

            // 从directoryMap中找到对应的目录ID
            let menuId = null
            if (directoryMap) {
                for (const [path, id] of directoryMap.entries()) {
                    // 如果是根目录文件
                    if (lastSlashIndex <= 0 && filePath && path === filePath.split('/')[0]) {
                        menuId = id
                        break
                    }
                    // 如果是子目录文件
                    else if (path === dirPath) {
                        menuId = id
                        break
                    }
                }
            } else {
                // 如果没有目录映射，直接使用传入的menuId
                menuId = options.menuId
            }

            // 上传文件
            const uploadResult = await uploadSingleFile(file.file, menuId, (progress) => {
                // 如果有进度回调，则调用
                if (typeof options.onFileProgress === 'function') {
                    options.onFileProgress(file, progress)
                }
            })
            
            // 收集上传统计信息
            if (uploadResult && uploadResult.uploadStats) {
                // 添加文件路径信息到统计数据
                uploadResult.uploadStats.path = file.path || file.name
                uploadStats.push(uploadResult.uploadStats)
            }

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
                
                // 计算总上传时间
                const totalUploadEndTime = Date.now()
                const totalElapsedTime = totalUploadEndTime - totalUploadStartTime
                
                // 计算统计信息
                const totalSize = uploadStats.reduce((sum, stat) => sum + stat.fileSize, 0)
                const avgFileUploadTime = uploadStats.reduce((sum, stat) => sum + stat.totalUploadTime, 0) / uploadStats.length
                
                // 输出汇总信息
                console.log('========== 文件上传统计信息 ==========');
                console.log(`总文件数: ${total}`);
                console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
                console.log(`总耗时: ${totalElapsedTime}ms`);
                console.log(`平均每个文件上传耗时: ${avgFileUploadTime.toFixed(2)}ms`);
                console.log('大文件上传详情:');
                
                // 输出大文件的详细信息
                uploadStats.filter(stat => stat.totalChunks > 1).forEach(stat => {
                    console.log(`文件: ${stat.path}`);
                    console.log(`  大小: ${(stat.fileSize / 1024 / 1024).toFixed(2)}MB`);
                    console.log(`  分片数: ${stat.totalChunks}`);
                    console.log(`  总耗时: ${stat.totalUploadTime}ms`);
                    if (stat.avgChunkUploadTime) {
                        console.log(`  平均分片上传耗时: ${stat.avgChunkUploadTime.toFixed(2)}ms`);
                    }
                });
                console.log('=======================================');
                
                resolve({
                    success: true,
                    stats: {
                        totalFiles: total,
                        totalSize,
                        totalElapsedTime,
                        avgFileUploadTime,
                        fileStats: uploadStats
                    }
                })
            }
        }, 100)
    })
}
const baseURL = import.meta.env.VITE_API_BASE_URL

// 导出大文件阈值常量，供组件使用
export const FILE_UPLOAD_CONFIG = {
    LARGE_FILE_THRESHOLD,
    CHUNK_SIZE
}

// 获取已删除文件列表
export const getDeletedFiles = async (params) => {
    return await httpClient.post('/file/getDeletedFile', params);
};

// 彻底删除文件
export const permanentDeleteFile = async (fileId) => {
    return await httpClient.post('/file/permanentDelete?fileId=' + fileId);
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
    FILE_UPLOAD_CONFIG
}