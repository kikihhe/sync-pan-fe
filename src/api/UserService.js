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

export const sendVerifyCode = async (email) => {
  return await httpClient.post(`/user/sendVerifyCode?email=${email}`)
}

export const register = async (user, code) => {
  return await httpClient.post(`/user/register?code=${code}`, user)
}

export const userService = {
  login,
  getCurrentUser,
  uploadAvatar,
  sendVerifyCode,
  register
}