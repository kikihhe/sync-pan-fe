import httpClient from '../utils/ajax'

export const login = async (username, password) => {
  return await httpClient.post('/user/login', {
    username,
    password
  })
}

export const userService = {
  login
}