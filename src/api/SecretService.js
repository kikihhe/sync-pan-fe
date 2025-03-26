import httpClient from '../utils/ajax'

// 获取密钥列表
export const listSecret = async (key = '') => {
  return await httpClient.get(`/secret/listSecret?key=${key}`)
}

// 添加密钥
export const addSecret = async (key, value) => {
  return await httpClient.post('/secret/addSecret', {
    key,
    value
  })
}

// 删除密钥
export const deleteSecret = async (id) => {
  return await httpClient.post('/secret/deleteSecret?id=' + id)
}

// 导出所有方法
export const secretService = {
  listSecret,
  addSecret,
  deleteSecret
}