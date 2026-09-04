/**
 * 智运宝账户 · 前端模拟存储层
 *
 * 说明：充值 / 提现 / 账户余额目前为前端模拟实现，通过 localStorage
 * 在「账户主页 / 充值页 / 提现页」之间共享同一份数据，保证状态联动。
 * 对接后端后，将本文件的存取逻辑替换为真实接口调用即可（余额查询 / 充值下单 / 提现申请）。
 */

/** 账户余额（元） */
export interface AccountBalance {
  /** 账户总余额 */
  total: number
  /** 可用余额 */
  available: number
  /** 冻结金额（运费托管 / 提现处理中） */
  frozen: number
  /** 数据更新时间 */
  updateTime: string
}

/** 默认账户余额 */
const DEFAULT_BALANCE: AccountBalance = {
  total: 12850,
  available: 8749.5,
  frozen: 4100.5,
  updateTime: '2026-09-04 10:32',
}

const BALANCE_KEY = 'zyb_account_balance'

/** 读取账户余额（无本地数据时返回默认值） */
export function loadAccountBalance(): AccountBalance {
  try {
    const raw = localStorage.getItem(BALANCE_KEY)
    if (!raw) return { ...DEFAULT_BALANCE }
    return { ...DEFAULT_BALANCE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_BALANCE }
  }
}

/** 保存账户余额 */
export function saveAccountBalance(balance: AccountBalance) {
  localStorage.setItem(BALANCE_KEY, JSON.stringify(balance))
}

/** 当前时间文本（yyyy-MM-dd HH:mm） */
function nowText(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 金额格式化：千分位 + 两位小数 */
export function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** 金额取两位小数并消除浮点误差 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * 充值：总余额与可用余额同步增加，返回更新后的余额
 */
export function recharge(amount: number): AccountBalance {
  const balance = loadAccountBalance()
  const next: AccountBalance = {
    ...balance,
    total: roundMoney(balance.total + amount),
    available: roundMoney(balance.available + amount),
    updateTime: nowText(),
  }
  saveAccountBalance(next)
  return next
}

/**
 * 提现：可用余额减少并转入冻结（模拟「提现审核中」的冻结逻辑），返回更新后的余额
 */
export function withdraw(amount: number): AccountBalance {
  const balance = loadAccountBalance()
  const next: AccountBalance = {
    ...balance,
    available: roundMoney(balance.available - amount),
    frozen: roundMoney(balance.frozen + amount),
    updateTime: nowText(),
  }
  saveAccountBalance(next)
  return next
}

/** 冻结业务类型 */
export type FrozenBizType = '运费托管' | '提现冻结'

/** 冻结明细项 */
export interface FrozenDetailItem {
  id: number
  /** 冻结业务类型 */
  bizType: FrozenBizType
  /** 关联单号（运单号 / 提现单号） */
  orderNo: string
  /** 冻结金额（元） */
  amount: number
  /** 冻结时间 */
  frozenTime: string
  /** 当前状态 */
  status: string
}

/** 默认冻结明细（合计与默认冻结金额 4100.5 一致） */
const DEFAULT_FROZEN_DETAILS: FrozenDetailItem[] = [
  {
    id: 1,
    bizType: '运费托管',
    orderNo: 'YD20260902001',
    amount: 1800,
    frozenTime: '2026-09-02 09:40',
    status: '运输中',
  },
  {
    id: 2,
    bizType: '运费托管',
    orderNo: 'YD20260902002',
    amount: 2000,
    frozenTime: '2026-09-02 08:26',
    status: '运输中',
  },
  {
    id: 3,
    bizType: '提现冻结',
    orderNo: 'TX20260902001',
    amount: 300.5,
    frozenTime: '2026-09-02 15:10',
    status: '处理中',
  },
]

const FROZEN_KEY = 'zyb_frozen_details'

/** 读取冻结明细（无本地数据时返回默认明细） */
export function loadFrozenDetails(): FrozenDetailItem[] {
  try {
    const raw = localStorage.getItem(FROZEN_KEY)
    if (!raw) return [...DEFAULT_FROZEN_DETAILS]
    return JSON.parse(raw) as FrozenDetailItem[]
  } catch {
    return [...DEFAULT_FROZEN_DETAILS]
  }
}

/** 保存冻结明细 */
export function saveFrozenDetails(list: FrozenDetailItem[]) {
  localStorage.setItem(FROZEN_KEY, JSON.stringify(list))
}

/** 生成模拟业务单号，如 TX + 14 位时间数字 */
function genOrderNo(prefix: string): string {
  const digits = new Date().toISOString().replace(/\D/g, '')
  return `${prefix}${digits}`
}

/** 新增一笔冻结明细（提现后调用），返回新记录并置顶保存 */
export function addFrozenRecord(bizType: FrozenBizType, amount: number): FrozenDetailItem {
  const list = loadFrozenDetails()
  const record: FrozenDetailItem = {
    id: list.length ? Math.max(...list.map((item) => item.id)) + 1 : 1,
    bizType,
    orderNo: genOrderNo('TX'),
    amount: roundMoney(amount),
    frozenTime: nowText(),
    status: '处理中',
  }
  saveFrozenDetails([record, ...list])
  return record
}
