import httpClient from '../utils/ajax'

// 获取设备列表
export const getDeviceList = async () => {
  return await httpClient.get('/device/getDeviceList')
}

// 发送设备心跳
export const sendHeartbeat = async (deviceKey, secret) => {
  return await httpClient.post('/device/heartbeat', {
    deviceKey,
    secret
  })
}

// 添加设备
export const addDevice = async (deviceName) => {
  return await httpClient.post('/device/addDevice', {
    deviceName
  })
}

// 注册设备
export const registerDevice = async (deviceName, secretId, deviceKey) => {
  return await httpClient.post('/device/registerDevice', {
    deviceName,
    secretId: secretId,
    deviceKey: deviceKey
  })
}

// 删除设备
export const deleteDevice = async (deviceId) => {
  return await httpClient.post('/device/deleteDevice', {
    deviceId
  })
}

// 停止设备同步
export const stopDeviceSync = async (deviceId) => {
  return await httpClient.post('/device/stopSync', {
    deviceId
  })
}

// 导出所有方法
export const deviceService = {
  getDeviceList,
  sendHeartbeat,
  addDevice,
  registerDevice,
  deleteDevice,
  stopDeviceSync
}