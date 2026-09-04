/**
 * 智运宝银行卡 · 前端模拟存储层
 *
 * 说明：银行卡的添加 / 删除 / 列表目前为前端模拟实现，通过 localStorage 共享数据，
 * 账户页「提现」的到账账户也读取本列表首张卡。对接后端后，
 * 将本文件的存取逻辑替换为「银行卡列表 / 添加 / 解绑」接口即可。
 */

/** 已绑定的银行卡 */
export interface BankCard {
  id: number
  /** 银行名称 */
  bank: string
  /** 卡片类型（储蓄卡 / 信用卡） */
  cardType: string
  /** 卡号（演示数据，仅用于掩码展示与尾号提取） */
  cardNo: string
  /** 持卡人 */
  holder: string
  /** 添加时间 */
  addTime: string
}

/** 可选的银行（带品牌色，用于卡片与图标展示） */
export interface BankOption {
  name: string
  /** 渐变起始色 */
  from: string
  /** 渐变结束色 */
  to: string
}

/** 常用银行卡种（模拟可选银行） */
export const BANK_OPTIONS: BankOption[] = [
  { name: '招商银行', from: '#e2574c', to: '#a8322a' },
  { name: '工商银行', from: '#c9212f', to: '#8e1520' },
  { name: '建设银行', from: '#2a6fd6', to: '#164f9e' },
  { name: '农业银行', from: '#33a25d', to: '#0f7a3d' },
  { name: '中国银行', from: '#c3272e', to: '#8c1620' },
  { name: '交通银行', from: '#3f6fd8', to: '#1f47a0' },
  { name: '邮政储蓄银行', from: '#3ea963', to: '#1f7a41' },
  { name: '中信银行', from: '#d4513f', to: '#9f3526' },
  { name: '浦发银行', from: '#2d63a8', to: '#163d6b' },
]

/** 默认已绑银行卡（与提现页早期演示保持一致，含 招商银行尾号6821） */
const DEFAULT_BANK_CARDS: BankCard[] = [
  {
    id: 1,
    bank: '招商银行',
    cardType: '储蓄卡',
    cardNo: '6225880000006821',
    holder: '本人',
    addTime: '2026-08-12 10:20',
  },
  {
    id: 2,
    bank: '工商银行',
    cardType: '储蓄卡',
    cardNo: '6212260000000835',
    holder: '本人',
    addTime: '2026-08-18 16:05',
  },
]

const BANK_KEY = 'zyb_bank_cards'

/** 读取银行卡列表（无本地数据时返回默认卡片） */
export function loadBankCards(): BankCard[] {
  try {
    const raw = localStorage.getItem(BANK_KEY)
    if (!raw) return [...DEFAULT_BANK_CARDS]
    return JSON.parse(raw) as BankCard[]
  } catch {
    return [...DEFAULT_BANK_CARDS]
  }
}

/** 保存银行卡列表 */
export function saveBankCards(list: BankCard[]) {
  localStorage.setItem(BANK_KEY, JSON.stringify(list))
}

/** 当前时间文本（yyyy-MM-dd HH:mm） */
function nowText(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 新增一张银行卡，返回新卡片 */
export function addBankCard(input: { bank: string; cardType?: string; cardNo: string; holder?: string }): BankCard {
  const list = loadBankCards()
  const card: BankCard = {
    id: list.length ? Math.max(...list.map((item) => item.id)) + 1 : 1,
    bank: input.bank,
    cardType: input.cardType || '储蓄卡',
    cardNo: input.cardNo,
    holder: (input.holder || '').trim() || '本人',
    addTime: nowText(),
  }
  saveBankCards([card, ...list])
  return card
}

/** 删除一张银行卡，返回删除后的列表 */
export function removeBankCard(id: number): BankCard[] {
  const list = loadBankCards().filter((item) => item.id !== id)
  saveBankCards(list)
  return list
}

/** 获取银行品牌色（未收录时使用默认灰） */
export function bankOption(bank: string): BankOption {
  return BANK_OPTIONS.find((item) => item.name === bank) ?? {
    name: bank,
    ...{ from: '#64748b', to: '#334155' },
  }
}

/** 卡号掩码：仅保留后四位用于展示 */
export function maskCardNo(cardNo: string): string {
  const tail = cardNo.slice(-4)
  return `**** **** **** ${tail}`
}

/** 银行卡尾号 */
export function cardTail(cardNo: string): string {
  return cardNo.slice(-4)
}

export { DEFAULT_BANK_CARDS }
