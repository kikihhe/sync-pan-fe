import httpClient from '../utils/ajax'

// 获取设备绑定目录列表
export const getDeviceBindings = async (deviceId) => {
  return await httpClient.get(`/bound/${deviceId}`)
}

// 创建绑定
export const createBinding = async (bindingData) => {
  return await httpClient.post('/bound/createBinding', bindingData)
}

// 删除绑定
export const removeBinding = async (bindingId) => {
  return await httpClient.delete(`/bound/${bindingId}`)
}

// 检查目录冲突
export const checkConflict = async (menuId) => {
  return await httpClient.post('/bound/checkConflict?menuId=' + menuId)
}

// 解决冲突
export const resolveConflict = async (resolveData) => {
  return await httpClient.post('/bound/resolveConflict', resolveData)
}

// 获取已解决的冲突
export const getResolvedConflict = async (menuId) => {
  return await httpClient.post('/bound/getResolvedConflict?menuId=' + menuId)
}

// 导出所有方法
export const boundMenuService = {
  getDeviceBindings,
  createBinding,
  removeBinding,
  checkConflict,
  resolveConflict,
  getResolvedConflict
}