import { post } from '@/api/request'

/** 登录参数 */
export interface LoginParams {
  mobile: string
  password: string
}

/** 注册参数 */
export interface RegisterParams {
  /** 用户类型 1货主 2司机 */
  userType: number
  /** 真实姓名 */
  realName: string
  /** 手机号 */
  mobile: string
  /** 密码 */
  password: string
}

/** 登录 */
export function login(data: LoginParams) {
  return post('/api/app/login', data)
}

/** 注册 */
export function register(data: RegisterParams) {
  return post('/api/app/register', data)
}
