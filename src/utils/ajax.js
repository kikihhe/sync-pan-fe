import axios from 'axios'

// 创建 axios 实例
const httpClient = axios.create({
  // 从环境变量获取基础URL
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
httpClient.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    // 如果有 token，添加到请求头
    if (token) {
      config.headers['Authorization'] = `${token}`
    }
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
httpClient.interceptors.response.use(
  response => {
    const res = response.data
    return res
  }
)

// 封装 GET 请求
export const get = (url, params = {}) => {
  return httpClient.get(url, { params })
}

// 封装 POST 请求
export const post = (url, data = {}) => {
  return httpClient.post(url, data)
}

// 封装 PUT 请求
export const put = (url, data = {}) => {
  return httpClient.put(url, data)
}

// 封装 DELETE 请求
export const del = (url, params = {}) => {
  return httpClient.delete(url, { params })
}

// 封装 POST 请求
export const upload = (url, file, onUploadProgress = null) => {
  const formData = new FormData()
  formData.append('file', file)
  
  return httpClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  })
}

// 导出 httpClient 实例，以便可以直接使用
export default {
  get,
  post,
  put,
  delete: del,
  upload,
  request: httpClient
}