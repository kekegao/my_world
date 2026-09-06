import { post } from '@/api/request'

/** 账户余额（后端 tf_b_account 返回，字段与 AccountDto 对齐） */
export interface AccountBalanceDto {
  /** 主键 */
  id?: number
  /** 用户 userId */
  userId?: string
  /** 用户名称 */
  userName?: string
  /** 真实名称 */
  realName?: string
  /** 手机号 */
  mobile?: string
  /** 总余额（元） */
  balance?: number | string
  /** 冻结金额（元） */
  frozenAmount?: number | string
  /** 可用金额（元） */
  availableAmount?: number | string
  /** 状态：1 正常 */
  status?: number
  /** 更新时间 */
  updateTime?: string
}

/** 查询当前登录用户的账户余额（POST /api/account/balance） */
export function queryAccountBalance() {
  return post('/api/account/balance', {})
}
