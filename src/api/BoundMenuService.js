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

// 导出所有方法
export const boundMenuService = {
  getDeviceBindings,
  createBinding,
  removeBinding
}