import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 自动携带登录后保存的 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    // 根据后端数据结构调整
    return data
  },
  (error) => {
    // 统一错误处理
    let message = '请求失败'
    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = '未授权，请重新登录'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = `请求错误 (${error.response.status})`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    }
    console.error(`[Request Error] ${message}`, error)
    return Promise.reject(error)
  },
)

export function get<T = unknown>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) {
  return instance.get<T>(url, { params, ...config })
}

export function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return instance.post<T>(url, data, config)
}

export function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
  return instance.put<T>(url, data, config)
}

export function del<T = unknown>(url: string, config?: AxiosRequestConfig) {
  return instance.delete<T>(url, config)
}

export default instance
