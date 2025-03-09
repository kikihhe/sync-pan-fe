import httpClient from '../utils/ajax'

export const userService = {
  login
}

export const login = async (username, password) => {
  return await httpClient.post('/user/login', {
    username,
    password
  })
}