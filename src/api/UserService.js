import httpClient from '../utils/ajax'

export const login = async (username, password, rememberMe = false) => {
  return await httpClient.post('/user/login', {
    username,
    password,
    rememberMe
  })
}

export const getCurrentUser = async () => {
  return await httpClient.get('/user/currentUser')
}

export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return await httpClient.post('/user/uploadAvatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const userService = {
  login,
  getCurrentUser,
  uploadAvatar
}