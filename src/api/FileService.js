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
    // Create form data
    const formData = new FormData()

    // Add file metadata
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

export const fileService = {
    uploadSingleFile,
    updateFile,
    deleteFile,
    previewFile,
}