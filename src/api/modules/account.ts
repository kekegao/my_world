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

/**
 * 充值（POST /api/account/recharge）
 * 当前登录用户由后端从登录会话中获取（AccountController 注入 userId），前端仅需传金额。
 * 成功后返回最新账户快照（AccountDto：balance / availableAmount / frozenAmount）。
 */
export function submitRecharge(amount: number) {
  return post('/api/account/recharge', { amount })
}

/** 冻结明细（后端 tf_b_frozen_detail 返回，字段与 FrozenDetailDto 对齐） */
export interface FrozenDetailDto {
  /** 主键 */
  id?: number | string
  /** 账户所属用户ID */
  userId?: string
  /** 用户名称 */
  userName?: string
  /** 冻结业务类型：1运费托管 2提现冻结 */
  bizType?: number | string
  /** 业务类型名称（冗余）：运费托管/提现冻结 */
  bizTypeName?: string
  /** 关联业务ID（运单ID/提现申请ID） */
  refId?: string
  /** 关联单号（YD运单号/TX提现单号） */
  orderNo?: string
  /** 冻结金额（元） */
  amount?: number | string
  /** 冻结时间 */
  frozenTime?: string
  /** 状态：1冻结中 2已解冻 3已打款 */
  status?: number | string
  /** 状态描述（冗余）：冻结中/已解冻/已打款 */
  statusDesc?: string
  /** 结束时间 */
  finishTime?: string
  /** 备注 */
  remark?: string
  /** 删除标记：0正常 1已删除 */
  deleteFlag?: number
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/** 查询当前登录用户「冻结中」的冻结明细（POST /api/frozenDetail/list，status=1） */
export function queryFrozenDetailList() {
  return post('/api/frozenDetail/list', {})
}
