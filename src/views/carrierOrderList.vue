<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { carrierConfirmReceipt, carrierShipOrder, queryCarrierOrders } from '@/api/modules/order'

const router = useRouter()

type TabKey = '全部' | '进行中' | '已完成'

/**
 * 我摘过的运单（承运方视角）。
 * 结构对齐后端 OrderDto：status 为状态机数字，statusDesc 为后端状态文案
 * （状态机：2摘单-3成交-4发货-5确认收货-6回单确认-7结算申请-8结算-9对账-10发票）。
 */
interface MyOrderItem {
  /** 订单号 */
  orderId: string
  /** 订单状态：2 摘单 ~ 10 发票 */
  status: number
  /** 订单状态描述，例如：摘单 */
  statusDesc: string
  /** 发布时间（ISO 字符串），用于详情展示 */
  createTime?: string
  /** 物品类型 */
  goodsType?: string
  /** 物品描述 */
  goodsDescription?: string
  /** 物品重量（吨） */
  goodsWeight?: number
  /** 运费（元），空表示面议 */
  transportMoney?: number
  /** 发货源省市区-省份 */
  shipperProvince: string
  /** 发货源省市区-城市 */
  shipperCity: string
  /** 发货源省市区-地区 */
  shipperArea: string
  /** 发货源省市区-详细地址 */
  shipperAddress: string
  /** 收货地省市区-省份 */
  carrierProvince: string
  /** 收货地省市区-城市 */
  carrierCity: string
  /** 收货地省市区-地区 */
  carrierArea: string
  /** 收货地省市区-详细地址 */
  carrierAddress: string
  /** 货主名称 */
  shipperName: string
  /** 货主手机号 */
  shipperMobile: string
}

/** 已摘后仍处于运输/结算前的过程状态（含摘单待发货等履约阶段） */
const RUNNING_STATUSES = [2, 3, 4, 5, 6, 7]
/** 结算收尾的完成状态 */
const DONE_STATUSES = [8, 9, 10]

/** 后端 statusDesc 缺失时按状态机兜底 */
const STATUS_TEXT: Record<number, string> = {
  2: '摘单',
  3: '成交',
  4: '发货',
  5: '确认收货',
  6: '回单确认',
  7: '结算申请',
  8: '结算',
  9: '对账',
  10: '发票',
}

function statusText(status: number): string {
  return STATUS_TEXT[status] || `状态${status}`
}

/** 状态分桶：进行中 / 已完成（未知状态兜底为已完成，保证筛选不丢单） */
function bucketOf(status: number): '进行中' | '已完成' {
  if (RUNNING_STATUSES.includes(status)) return '进行中'
  if (DONE_STATUSES.includes(status)) return '已完成'
  return '已完成'
}

/** 承运方已摘运单列表（后端实时数据） */
const orderList = ref<MyOrderItem[]>([])
/** 首次加载中 */
const loading = ref(false)
/** 请求失败（区别于无数据空态） */
const loadFailed = ref(false)
const loadErrorMsg = ref('')

/** 状态主题色 */
const statusTheme: Record<'进行中' | '已完成', { color: string; bg: string }> = {
  进行中: { color: '#0369a1', bg: '#e0f2fe' },
  已完成: { color: '#047857', bg: '#d1fae5' },
}

/** 状态徽章样式：按进行中/已完成分桶取色 */
function badgeStyle(status: number) {
  const theme = statusTheme[bucketOf(status)]
  return { color: theme.color, background: theme.bg }
}

/** 筛选标签 */
const tabs: TabKey[] = ['全部', '进行中', '已完成']
const activeTab = ref<TabKey>('全部')

const filteredOrders = computed(() => {
  if (activeTab.value === '全部') return orderList.value
  return orderList.value.filter((o) => bucketOf(o.status) === activeTab.value)
})

/** 顶部统计 */
const stats = computed(() => {
  const list = orderList.value
  return {
    total: list.length,
    running: list.filter((o) => bucketOf(o.status) === '进行中').length,
    done: list.filter((o) => bucketOf(o.status) === '已完成').length,
  }
})

/** 后端行数据归一化（补默认值、数字转换、状态文案兜底） */
function normalizeOrder(raw: Record<string, unknown>): MyOrderItem {
  const status = Number(raw.status ?? 2)
  return {
    orderId: String(raw.orderId ?? ''),
    status,
    statusDesc: String(raw.statusDesc ?? '') || statusText(status),
    createTime: raw.createTime != null ? String(raw.createTime) : undefined,
    goodsType: raw.goodsType != null ? String(raw.goodsType) : '',
    goodsDescription: raw.goodsDescription != null ? String(raw.goodsDescription) : '',
    goodsWeight: raw.goodsWeight != null ? Number(raw.goodsWeight) : undefined,
    transportMoney: raw.transportMoney != null ? Number(raw.transportMoney) : undefined,
    shipperProvince: String(raw.shipperProvince ?? ''),
    shipperCity: String(raw.shipperCity ?? ''),
    shipperArea: String(raw.shipperArea ?? ''),
    shipperAddress: String(raw.shipperAddress ?? ''),
    carrierProvince: String(raw.carrierProvince ?? ''),
    carrierCity: String(raw.carrierCity ?? ''),
    carrierArea: String(raw.carrierArea ?? ''),
    carrierAddress: String(raw.carrierAddress ?? ''),
    shipperName: String(raw.shipperName ?? ''),
    shipperMobile: String(raw.shipperMobile ?? ''),
  }
}

/**
 * 实时查询后端：当前承运方所有已摘的运单。
 * 承运方身份由后端从登录态获取（POST /api/accept/myOrders），不传任何身份参数。
 */
async function loadOrders() {
  loading.value = true
  loadFailed.value = false
  try {
    const res = (await queryCarrierOrders()) as {
      success?: boolean
      code?: string | number
      data?: MyOrderItem[]
      message?: string
    }
    if (res && (res.success === true || String(res.code) === '200')) {
      orderList.value = Array.isArray(res.data)
        ? res.data.map((raw) => normalizeOrder(raw as unknown as Record<string, unknown>))
        : []
    } else {
      loadFailed.value = true
      loadErrorMsg.value = res?.message || '查询运单失败，请稍后重试'
    }
  } catch (err) {
    console.error('查询我的运单失败：', err)
    loadFailed.value = true
    loadErrorMsg.value = '网络异常，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})

/** 当前查看详情的运单：非空时整页切换为「查看详情」（与 publishOrderList 同款模式） */
const currentOrder = ref<MyOrderItem | null>(null)

function openDetail(order: MyOrderItem) {
  currentOrder.value = order
  nextTick(() => window.scrollTo({ top: 0 }))
}

function closeDetail() {
  currentOrder.value = null
  nextTick(() => window.scrollTo({ top: 0 }))
}

/* ===== 确认发货：成交(3) -> 发货(4)，后端校验仅承运方本人 ===== */
/** 待确认发货的运单 */
const shipTarget = ref<MyOrderItem | null>(null)
const shipping = ref(false)

function openShipConfirm(order: MyOrderItem) {
  shipTarget.value = order
}

function closeShipConfirm() {
  if (shipping.value) return
  shipTarget.value = null
}

/** 提交确认发货，成功后刷新列表 */
async function submitShip() {
  const order = shipTarget.value
  if (!order || shipping.value) return
  shipping.value = true
  let succeeded = false
  try {
    const res = (await carrierShipOrder({ orderId: order.orderId })) as {
      success?: boolean
      code?: string | number
      message?: string
    }
    if (res && (res.success === true || String(res.code) === '200')) {
      succeeded = true
    } else {
      showToast(res?.message || '发货失败，请稍后重试')
    }
  } catch (err) {
    console.error('确认发货失败：', err)
    showToast('网络异常，请稍后重试')
  } finally {
    shipping.value = false
    if (succeeded) {
      shipTarget.value = null
      showToast('已确认发货')
      loadOrders()
    }
  }
}

/* ===== 确认收货：发货(4) -> 确认收货(5)，后端校验仅承运方本人 ===== */
/** 待确认收货的运单 */
const receiveTarget = ref<MyOrderItem | null>(null)
const receiving = ref(false)

function openReceiveConfirm(order: MyOrderItem) {
  receiveTarget.value = order
}

function closeReceiveConfirm() {
  if (receiving.value) return
  receiveTarget.value = null
}

/** 提交确认收货，成功后刷新列表 */
async function submitReceive() {
  const order = receiveTarget.value
  if (!order || receiving.value) return
  receiving.value = true
  let succeeded = false
  try {
    const res = (await carrierConfirmReceipt({ orderId: order.orderId })) as {
      success?: boolean
      code?: string | number
      message?: string
    }
    if (res && (res.success === true || String(res.code) === '200')) {
      succeeded = true
    } else {
      showToast(res?.message || '确认收货失败，请稍后重试')
    }
  } catch (err) {
    console.error('确认收货失败：', err)
    showToast('网络异常，请稍后重试')
  } finally {
    receiving.value = false
    if (succeeded) {
      receiveTarget.value = null
      showToast('已确认收货')
      loadOrders()
    }
  }
}

/* ===== 轻提示 ===== */
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined
function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2000)
}

/* ===== 展示格式化 ===== */
function displayValue(value?: string | null): string {
  return value && value.trim() ? value : '—'
}

function formatTime(time?: string | null): string {
  if (!time) return ''
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatMoney(money?: number | string | null): string {
  if (money === null || money === undefined || money === '') return '面议'
  const num = Number(money)
  return Number.isFinite(num) ? `¥ ${num}` : '面议'
}

function weightText(order: MyOrderItem): string {
  return order.goodsWeight === null || order.goodsWeight === undefined ? '未填写' : `${order.goodsWeight} 吨`
}

/** 拼接省市区，过滤空段 */
function region(province: string, city: string, area: string): string {
  return [province, city, area].filter(Boolean).join(' ')
}

/** 返回上一页，无历史记录时回承运方首页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/carrierHomeView')
  }
}
</script>

<template>
  <div class="order-app">
    <!-- ======= 列表页 ======= -->
    <Transition name="page" mode="out-in">
      <div v-if="!currentOrder" key="list" class="page-list">
        <!-- 顶部导航 -->
        <header class="top-bar">
          <button type="button" class="back-btn" aria-label="返回" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="top-title">我的运单</span>
          <span class="top-right"></span>
        </header>

        <!-- 统计卡片 -->
        <section class="stats-card">
          <div class="stats-main">
            <span class="stats-label">已摘运单</span>
            <strong class="stats-num">{{ stats.total }}</strong>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <b>{{ stats.running }}</b>
              <span>进行中</span>
            </div>
            <div class="stats-item">
              <b>{{ stats.done }}</b>
              <span>已完成</span>
            </div>
          </div>
        </section>

        <!-- 状态筛选 -->
        <nav class="filter-bar">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            class="filter-chip"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </nav>

        <!-- 运单列表 -->
        <main class="order-list">
          <p v-if="filteredOrders.length" class="list-count">共 {{ filteredOrders.length }} 条运单</p>

          <article v-for="order in filteredOrders" :key="order.orderId" class="order-card">
            <!-- 顶部：货主 + 状态 -->
            <div class="card-head">
              <span class="shipper-name">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
                  <path d="M4.5 20c.9-3.2 3.7-5 7.5-5s6.6 1.8 7.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
                {{ order.shipperName }}
              </span>
              <span class="status-badge" :style="badgeStyle(order.status)">
                {{ order.statusDesc || statusText(order.status) }}
              </span>
            </div>

            <!-- 路线：发货 / 收货地址 -->
            <div class="route">
              <div class="route-row">
                <div class="route-marker marker-from"></div>
                <div class="route-text">
                  <span class="route-tag tag-from">发货</span>
                  <p class="route-region">{{ region(order.shipperProvince, order.shipperCity, order.shipperArea) }}</p>
                  <p class="route-detail">{{ order.shipperAddress }}</p>
                </div>
              </div>
              <div class="route-row">
                <div class="route-marker marker-to"></div>
                <div class="route-text">
                  <span class="route-tag tag-to">收货</span>
                  <p class="route-region">{{ region(order.carrierProvince, order.carrierCity, order.carrierArea) }}</p>
                  <p class="route-detail">{{ order.carrierAddress }}</p>
                </div>
              </div>
            </div>

            <!-- 货物信息 -->
            <div class="goods-row">
              <span class="goods-chip">{{ order.goodsType }}</span>
              <span class="goods-meta">{{ order.goodsDescription }}</span>
              <span v-if="order.transportMoney != null" class="goods-meta goods-fee">¥ {{ order.transportMoney }}</span>
            </div>

            <!-- 底部：运单号 + 操作按钮（成交态可确认发货，发货态可确认收货） -->
            <footer class="card-foot">
              <span class="grab-time">运单号 {{ order.orderId }}</span>
              <div class="card-actions">
                <button
                  v-if="order.status === 3"
                  type="button"
                  class="action-btn action-primary"
                  @click="openShipConfirm(order)"
                >
                  确认发货
                </button>
                <button
                  v-else-if="order.status === 4"
                  type="button"
                  class="action-btn action-primary"
                  @click="openReceiveConfirm(order)"
                >
                  确认收货
                </button>
                <button type="button" class="action-btn action-plain" @click="openDetail(order)">查看详情</button>
              </div>
            </footer>
          </article>

          <!-- 首次加载中 -->
          <div v-if="loading && !orderList.length" class="empty-state">
            <p class="empty-title">运单加载中…</p>
            <p class="empty-tip">正在实时获取您的已摘运单</p>
          </div>

          <!-- 加载失败（区别于无数据） -->
          <div v-else-if="!loading && loadFailed && !orderList.length" class="empty-state">
            <p class="empty-title">运单加载失败</p>
            <p class="empty-tip">{{ loadErrorMsg }}</p>
            <button type="button" class="retry-btn" @click="loadOrders">重新加载</button>
          </div>

          <!-- 空状态 -->
          <div v-else-if="!filteredOrders.length" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="6" y="16" width="38" height="26" rx="4" fill="#e5e7eb" />
              <path d="M44 26h10a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H46a4 4 0 0 1-4-4v-6a6 6 0 0 0 2-6z" fill="#d1d5db" />
              <circle cx="17" cy="48" r="5" fill="#cbd5e1" />
              <circle cx="43" cy="48" r="5" fill="#cbd5e1" />
              <path d="M6 16 10 6h30" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="empty-title">暂无已摘运单</p>
            <p class="empty-tip">去货源大厅摘一单，运单将显示在这里</p>
          </div>
        </main>
      </div>

      <!-- ======= 详情页：整页切换查看，模式与样式对齐 publishOrderList 的「查看详情」 ======= -->
      <div v-else key="detail" class="page-detail">
        <template v-if="currentOrder">
          <header class="detail-bar">
            <button type="button" class="back-btn" aria-label="返回" @click="closeDetail">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <span class="detail-bar-title">运单详情</span>
            <span class="detail-bar-right"></span>
          </header>

          <main class="detail-body">
            <!-- 状态 + 路线概览 -->
            <section class="detail-hero">
              <div class="hero-head">
                <span class="status-badge hero-status" :style="badgeStyle(currentOrder.status)">
                  {{ currentOrder.statusDesc || statusText(currentOrder.status) }}
                </span>
                <span class="hero-time">{{ formatTime(currentOrder.createTime) }} 发布</span>
              </div>
              <div class="hero-route">
                <span class="hero-city">{{ displayValue(currentOrder.shipperCity) }}</span>
                <span class="hero-arrow">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="hero-city">{{ displayValue(currentOrder.carrierCity) }}</span>
              </div>
              <div class="hero-goods">
                <span>{{ displayValue(currentOrder.goodsType) }}</span>
                <span>{{ weightText(currentOrder) }}</span>
                <span class="hero-fee">{{ formatMoney(currentOrder.transportMoney) }}</span>
              </div>
            </section>

            <!-- 路线详情 -->
            <section class="card-block">
              <h3 class="block-title">运输路线</h3>
              <div class="route-detail-list">
                <div class="node">
                  <div class="node-rail">
                    <span class="node-dot from"></span>
                  </div>
                  <div class="node-body">
                    <span class="node-tag tag-from">发货</span>
                    <p class="node-region">{{ region(currentOrder.shipperProvince, currentOrder.shipperCity, currentOrder.shipperArea) }}</p>
                    <p class="node-address">{{ displayValue(currentOrder.shipperAddress) }}</p>
                    <p v-if="currentOrder.shipperName" class="node-contact">联系人：{{ currentOrder.shipperName }} {{ currentOrder.shipperMobile }}</p>
                  </div>
                </div>
                <div class="node">
                  <div class="node-rail">
                    <span class="node-dot to"></span>
                  </div>
                  <div class="node-body">
                    <span class="node-tag tag-to">收货</span>
                    <p class="node-region">{{ region(currentOrder.carrierProvince, currentOrder.carrierCity, currentOrder.carrierArea) }}</p>
                    <p class="node-address">{{ displayValue(currentOrder.carrierAddress) }}</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- 货物信息 -->
            <section class="card-block">
              <h3 class="block-title">货物信息</h3>
              <ul class="info-list">
                <li class="info-item">
                  <span class="info-label">物品类型</span>
                  <span class="info-value">{{ displayValue(currentOrder.goodsType) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">物品描述</span>
                  <span class="info-value">{{ displayValue(currentOrder.goodsDescription) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">物品重量</span>
                  <span class="info-value">{{ weightText(currentOrder) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">运费</span>
                  <span class="info-value fee">{{ formatMoney(currentOrder.transportMoney) }}</span>
                </li>
              </ul>
            </section>

            <!-- 订单信息 -->
            <section class="card-block">
              <h3 class="block-title">订单信息</h3>
              <ul class="info-list">
                <li class="info-item">
                  <span class="info-label">运单编号</span>
                  <span class="info-value">{{ displayValue(currentOrder.orderId) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">当前状态</span>
                  <span class="info-value">{{ currentOrder.statusDesc || statusText(currentOrder.status) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">发布时间</span>
                  <span class="info-value">{{ formatTime(currentOrder.createTime) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">货主</span>
                  <span class="info-value">{{ displayValue(currentOrder.shipperName) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">货主电话</span>
                  <span class="info-value">{{ displayValue(currentOrder.shipperMobile) }}</span>
                </li>
              </ul>
            </section>

            <p class="detail-tip">如对运单有疑问，请及时联系平台客服处理</p>
          </main>
        </template>
      </div>
    </Transition>

    <!-- 确认发货弹框 -->
    <div v-if="shipTarget" class="dialog-mask" @click.self="closeShipConfirm">
      <div class="dialog-panel" role="dialog" aria-modal="true">
        <h3 class="dialog-title">确认发货</h3>
        <p class="dialog-tip">
          运单 <b class="dialog-order-no">{{ shipTarget.orderId }}</b><br />
          发货后将进入实际运输环节，是否确认已安排发货？
        </p>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-cancel" :disabled="shipping" @click="closeShipConfirm">再想想</button>
          <button type="button" class="dialog-btn dialog-ok" :disabled="shipping" @click="submitShip">
            {{ shipping ? '发货中…' : '确认发货' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 确认收货弹框 -->
    <div v-if="receiveTarget" class="dialog-mask" @click.self="closeReceiveConfirm">
      <div class="dialog-panel" role="dialog" aria-modal="true">
        <h3 class="dialog-title">确认收货</h3>
        <p class="dialog-tip">
          运单 <b class="dialog-order-no">{{ receiveTarget.orderId }}</b><br />
          确认收货后运单将进入回单确认环节，是否确认货物已送达？
        </p>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-cancel" :disabled="receiving" @click="closeReceiveConfirm">再想想</button>
          <button type="button" class="dialog-btn dialog-ok" :disabled="receiving" @click="submitReceive">
            {{ receiving ? '提交中…' : '确认收货' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 轻提示 -->
    <Transition name="fade">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.order-app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: $bg-page;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.06);
}

/* ===== 页面切换动画 ===== */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* ===== 顶部导航 ===== */
.top-bar,
.detail-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 52px;
  padding: 0 $spacing-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $bg-card;
  border-bottom: 1px solid $border-color;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  color: $text-primary;
  transition: $transition-base;

  svg {
    width: 22px;
    height: 22px;
  }

  &:active {
    background: $bg-page;
  }
}

.top-title {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
}

.top-right {
  width: 36px;
}

/* ===== 统计卡片 ===== */
.stats-card {
  margin: $spacing-md;
  padding: $spacing-md $spacing-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: $shadow-md;
}

.stats-main {
  display: flex;
  flex-direction: column;
}

.stats-label {
  font-size: $font-size-sm;
  opacity: 0.9;
}

.stats-num {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
}

.stats-grid {
  display: flex;
  gap: $spacing-lg;
  padding-right: $spacing-sm;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  b {
    font-size: $font-size-lg;
  }

  span {
    font-size: $font-size-xs;
    opacity: 0.85;
  }
}

/* ===== 状态筛选 ===== */
.filter-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  padding: 0 $spacing-md $spacing-xs;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &::after {
    content: '';
    flex-shrink: 0;
    width: $spacing-sm;
  }
}

.filter-chip {
  flex-shrink: 0;
  padding: 5px 11px;
  border-radius: $radius-full;
  background: $bg-card;
  border: 1px solid $border-color;
  color: $text-secondary;
  font-size: $font-size-sm;
  transition: $transition-base;

  &.active {
    background: rgba($color-success, 0.12);
    border-color: rgba($color-success, 0.4);
    color: $color-success;
    font-weight: 600;
  }
}

/* ===== 运单列表 ===== */
.order-list {
  padding: $spacing-sm $spacing-md $spacing-2xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.list-count {
  font-size: $font-size-xs;
  color: $text-muted;
  padding: 0 $spacing-xs;
}

.order-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-md;
  box-shadow: $shadow-sm;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-sm;
}

.shipper-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: $font-size-sm;
  font-weight: 600;
  color: $text-primary;

  svg {
    width: 18px;
    height: 18px;
    color: $color-success;
  }
}

.status-badge {
  flex-shrink: 0;
  padding: 2px $spacing-sm;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
}

/* 路线区域 */
.route {
  position: relative;
  padding-left: $spacing-md;
}

.route::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 12px;
  bottom: 12px;
  width: 1px;
  border-left: 2px dashed $border-color;
}

.route-row {
  position: relative;
  padding: $spacing-sm 0;
}

.route-marker {
  position: absolute;
  left: -$spacing-md;
  top: 18px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px currentColor;
  box-sizing: content-box;
}

.marker-from {
  color: $color-primary;
  background: $color-primary;
}

.marker-to {
  color: $color-danger;
  background: $color-danger;
}

.route-tag,
.node-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
}

.tag-from {
  color: $color-primary;
  background: rgba($color-primary, 0.1);
}

.tag-to {
  color: $color-danger;
  background: rgba($color-danger, 0.1);
}

.route-region {
  margin-top: $spacing-xs;
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
}

.route-detail {
  margin-top: 2px;
  font-size: $font-size-sm;
  color: $text-secondary;
}

/* 货物信息条 */
.goods-row {
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px dashed $border-color;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-size-sm;
}

.goods-chip {
  flex-shrink: 0;
  padding: 2px $spacing-sm;
  border-radius: $radius-sm;
  background: rgba($color-primary, 0.08);
  color: $color-primary;
  font-weight: 600;
}

.goods-meta {
  color: $text-secondary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.goods-fee {
    margin-left: auto;
    flex-shrink: 0;
    color: $color-warning;
    font-weight: 700;
  }
}

/* 卡片底部 */
.card-foot {
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
}

.grab-time {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: $font-size-xs;
  color: $text-muted;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片操作按钮组：确认发货（成交3）/ 确认收货（发货4）+ 查看详情 */
.card-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.action-btn {
  height: 30px;
  padding: 0 $spacing-md;
  border-radius: $radius-full;
  font-size: $font-size-sm;
  font-weight: 600;
  line-height: 1;
  transition: $transition-base;

  &:disabled {
    opacity: 0.6;
  }

  &:active {
    opacity: 0.85;
  }
}

.action-primary {
  background: $color-success;
  color: #fff;
}

.action-plain {
  background: rgba($color-primary, 0.08);
  color: $color-primary;
}

/* ===== 空状态 ===== */
.empty-state {
  margin-top: $spacing-xl;
  padding: $spacing-xl $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: $bg-card;
  border-radius: $radius-lg;
}

.empty-icon {
  width: 88px;
  height: 88px;
}

.empty-title {
  margin-top: $spacing-md;
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
}

.empty-tip {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-muted;
}

.retry-btn {
  margin-top: $spacing-md;
  height: 32px;
  padding: 0 $spacing-xl;
  border-radius: $radius-full;
  background: $color-primary;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 600;
  transition: $transition-base;

  &:active {
    opacity: 0.85;
  }
}

/* ===== 详情页 ===== */
.detail-bar {
  justify-content: space-between;
}

.detail-bar-title {
  font-size: $font-size-base;
  font-weight: 700;
  color: $text-primary;
}

.detail-bar-right {
  width: 36px;
}

.detail-body {
  padding: $spacing-md $spacing-md ($spacing-2xl);
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/* 状态 + 路线概览 */
.detail-hero {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  box-shadow: $shadow-md;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .hero-status {
    font-size: $font-size-sm;
  }
}

.hero-time {
  font-size: $font-size-xs;
  opacity: 0.9;
}

.hero-route {
  margin: $spacing-lg 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
}

.hero-city {
  font-size: $font-size-xl;
  font-weight: 700;
}

.hero-arrow {
  color: rgba(255, 255, 255, 0.7);

  svg {
    width: 24px;
    height: 24px;
  }
}

.hero-goods {
  display: flex;
  justify-content: center;
  gap: $spacing-lg;
  font-size: $font-size-sm;
  opacity: 0.95;
}

.hero-fee {
  font-weight: 700;
}

/* 信息卡片 */
.card-block {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-md $spacing-lg;
  box-shadow: $shadow-sm;
}

.block-title {
  position: relative;
  padding-left: 12px;
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 14px;
    border-radius: 2px;
    background: $color-primary;
  }
}

/* 路线详情（详情页） */
.route-detail-list {
  margin-top: $spacing-md;
  position: relative;
}

.node {
  display: flex;
}

.node + .node::before {
  content: '';
  flex-shrink: 0;
  width: 22px;
}

.node + .node .node-rail::after {
  content: '';
  position: absolute;
  left: 50%;
  top: -24px;
  height: 24px;
  border-left: 2px dashed $border-color;
  transform: translateX(-1px);
}

.node-rail {
  position: relative;
  flex-shrink: 0;
  width: 22px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.node-dot {
  margin-top: 5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-sizing: border-box;

  &.from {
    background: $color-primary;
    border: 3px solid rgba($color-primary, 0.25);
  }

  &.to {
    background: $color-danger;
    border: 3px solid rgba($color-danger, 0.25);
  }
}

.node-body {
  flex: 1;
  padding-left: $spacing-sm;
  padding-bottom: $spacing-lg;
}

.node-region {
  margin-top: $spacing-xs;
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
}

.node-address {
  margin-top: 2px;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.node-contact {
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $text-primary;
  background: $bg-page;
  display: inline-block;
  padding: 2px $spacing-sm;
  border-radius: $radius-sm;
}

/* 信息行 */
.info-list {
  margin-top: $spacing-sm;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: $spacing-lg;
  padding: $spacing-sm 0;
  font-size: $font-size-sm;

  & + & {
    border-top: 1px dashed $border-color;
  }
}

.info-label {
  flex-shrink: 0;
  color: $text-secondary;
}

.info-value {
  text-align: right;
  color: $text-primary;
  word-break: break-all;

  &.fee {
    color: $color-warning;
    font-weight: 700;
  }
}

.detail-tip {
  text-align: center;
  font-size: $font-size-xs;
  color: $text-muted;
}

/* ===== 确认发货弹框 ===== */
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  background: rgba(15, 23, 42, 0.5);
}

.dialog-panel {
  width: 100%;
  max-width: 340px;
  padding: $spacing-xl $spacing-lg $spacing-lg;
  background: $bg-card;
  border-radius: $radius-lg;
  text-align: center;
}

.dialog-title {
  font-size: 17px;
  font-weight: 700;
}

.dialog-tip {
  margin-top: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
  line-height: 1.7;
}

.dialog-order-no {
  color: $color-primary;
}

.dialog-actions {
  margin-top: $spacing-lg;
  display: flex;
  gap: $spacing-sm;
}

.dialog-btn {
  flex: 1;
  height: 40px;
  border-radius: $radius-full;
  font-size: $font-size-sm;
  font-weight: 600;
  transition: $transition-base;

  &:disabled {
    opacity: 0.6;
  }
}

.dialog-cancel {
  background: rgba(0, 0, 0, 0.05);
  color: $text-secondary;
}

.dialog-ok {
  background: $color-success;
  color: #fff;
}

/* ===== 轻提示 ===== */
.toast {
  position: fixed;
  left: 50%;
  top: 45%;
  z-index: 80;
  transform: translateX(-50%);
  max-width: 80%;
  padding: 10px $spacing-xl;
  border-radius: $radius-full;
  background: rgba(17, 24, 39, 0.85);
  color: #fff;
  font-size: $font-size-sm;
  text-align: center;
}

/* ===== 过渡 ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
