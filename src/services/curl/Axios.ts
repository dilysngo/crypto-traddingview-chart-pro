import axios from 'axios'
import { ROOT_API, ROOT_API_TIMEOUT } from '../../constants/index'

const handle = axios.create({
  baseURL: ROOT_API,
  timeout: ROOT_API_TIMEOUT,
})

export const addToken = (token: string | undefined) => {
  handle.defaults.headers.common.Authorization = `Bearer ${token}`
}

export const removeToken = () => {
  delete handle.defaults.headers.common.Authorization
}

export default handle
