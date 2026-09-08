<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { carrierAcceptOrder, querySourceOrderList, type PublishedOrderItem } from '@/api/modules/order'

const router = useRouter()

type OrderStatus = '可摘单' | '已摘单'

/** 货源订单（承运方视角） */
interface SourceOrder {
  id: number
  orderNo: string
  status: OrderStatus
  publishTime: string
  goodsType: string
  goodsDescription: string
  /** 物品重量（吨） */
  goodsWeight: number
  /** 运费（元），空表示面议 */
  transportMoney?: number
  // 发货地址
  shipperProvince: string
  shipperCity: string
  shipperArea: string
  shipperAddress: string
  // 收货地址
  carrierProvince: string
  carrierCity: string
  carrierArea: string
  carrierAddress: string
  // 货主
  shipperName: string
  shipperMobile: string
}

/** 后端货源行数据结构（tf_b_order 返回结构，status 为数值） */
type RawSourceOrder = PublishedOrderItem

/** 后端订单状态 → 承运端文案（货源大厅仅返回 1发布=可摘 / 2摘单=已摘） */
const SOURCE_STATUS_MAP: Record<number, OrderStatus> = {
  1: '可摘单',
  2: '已摘单',
}

/** 后端订单行 → 页面货源展示结构 */
function toSourceOrder(row: RawSourceOrder): SourceOrder {
  const statusNum = Number(row.status)
  return {
    id: row.id ?? 0,
    orderNo: row.orderId ?? '',
    status: SOURCE_STATUS_MAP[statusNum] ?? '可摘单',
    publishTime: row.createTime ?? '',
    goodsType: row.goodsType ?? '',
    goodsDescription: row.goodsDescription ?? '',
    goodsWeight: row.goodsWeight ?? 0,
    transportMoney: row.transportMoney,
    shipperProvince: row.shipperProvince ?? '',
    shipperCity: row.shipperCity ?? '',
    shipperArea: row.shipperArea ?? '',
    shipperAddress: row.shipperAddress ?? '',
    carrierProvince: row.carrierProvince ?? '',
    carrierCity: row.carrierCity ?? '',
    carrierArea: row.carrierArea ?? '',
    carrierAddress: row.carrierAddress ?? '',
    shipperName: row.shipperName ?? '',
    shipperMobile: row.shipperMobile ?? '',
  }
}

/** 展示列表：大厅全量或线路搜索结果 */
const orderList = ref<SourceOrder[]>([])
/** 大厅全量货源快照，仅用于顶部统计口径（线路搜索不改变） */
const allOrders = ref<SourceOrder[]>([])
/** 列表加载状态 */
const loading = ref(false)
const loadError = ref('')
/** 最近一次查询条件，供失败重试复用 */
const lastQuery = ref<{ shipperKeyword?: string; carrierKeyword?: string }>({})
/** 当前是否处于「线路搜索」结果态（区别于大厅全量） */
const searched = ref(false)

/**
 * 查询货源大厅（POST /api/accept/list）
 * @param keyword 携带 shipperKeyword / carrierKeyword 即线路搜索；缺省则返回大厅全量
 */
async function fetchOrders(keyword: { shipperKeyword?: string; carrierKeyword?: string } = {}) {
  loading.value = true
  loadError.value = ''
  const query = {
    shipperKeyword: keyword.shipperKeyword?.trim() || undefined,
    carrierKeyword: keyword.carrierKeyword?.trim() || undefined,
  }
  lastQuery.value = query
  try {
    const res = (await querySourceOrderList(query)) as {
      success?: boolean
      code?: string | number
      message?: string
      data?: RawSourceOrder[]
    }
    if (res && (res.success === true || String(res.code) === '200')) {
      const rows = Array.isArray(res.data) ? res.data.map(toSourceOrder) : []
      orderList.value = rows
      if (!query.shipperKeyword && !query.carrierKeyword) {
        allOrders.value = rows
      }
      return
    }
    loadError.value = res?.message || '加载失败，请稍后重试'
    orderList.value = []
  } catch (err) {
    console.error('加载货源大厅失败：', err)
    loadError.value = '无法连接服务器，请确认后端服务已启动'
    orderList.value = []
  } finally {
    loading.value = false
  }
}

/** 进入页面：拉取大厅全量货源 */
onMounted(() => {
  fetchOrders()
})

/** 发货地 / 收货地搜索输入 */
const fromQuery = ref('')
const toQuery = ref('')

/** 输入中是否存在关键字（用于空结果提示文案） */
const hasKeyword = computed(() => !!(fromQuery.value.trim() || toQuery.value.trim()))

/** 点击「搜索」：以发货地 / 收货地关键字查询后端 */
async function handleSearch() {
  if (loading.value) return
  searched.value = true
  await fetchOrders({
    shipperKeyword: fromQuery.value.trim() || undefined,
    carrierKeyword: toQuery.value.trim() || undefined,
  })
}

/** 重置：清空输入并回到大厅全量 */
async function handleReset() {
  fromQuery.value = ''
  toQuery.value = ''
  searched.value = false
  await fetchOrders()
}

/** 加载失败重试（沿用最近一次查询条件） */
function handleRetry() {
  fetchOrders({ ...lastQuery.value })
}

/** 摘单状态主题色 */
const statusTheme: Record<OrderStatus, { color: string; bg: string }> = {
  可摘单: { color: '#b45309', bg: '#fef3c7' },
  已摘单: { color: '#047857', bg: '#d1fae5' },
}

/** 当前查看详情的订单，null 表示处于列表页 */
const currentOrder = ref<SourceOrder | null>(null)

/** 摘单请求中对应的订单 id */
const grabbingId = ref<number | null>(null)

/** 轻提示 */
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMsg.value = ''
  }, 2200)
}

/** 顶部统计：以大厅全量货源为准，搜索结果不改变口径 */
const stats = computed(() => {
  const list = allOrders.value
  return {
    total: list.length,
    open: list.filter((o) => o.status === '可摘单').length,
    accepted: list.filter((o) => o.status === '已摘单').length,
  }
})

/** 拼接省市区，过滤空段 */
function region(province: string, city: string, area: string): string {
  return [province, city, area].filter(Boolean).join(' ')
}

/** 运费展示，未填则显示面议 */
function formatMoney(money?: number): string {
  return money == null ? '面议' : `¥ ${money}`
}

/** 打开详情 */
function openDetail(order: SourceOrder) {
  currentOrder.value = order
  nextTick(() => window.scrollTo({ top: 0 }))
}

/** 返回列表 */
function closeDetail() {
  currentOrder.value = null
  nextTick(() => window.scrollTo({ top: 0 }))
}

/**
 * 摘单（抢单）：调用后端 /api/accept/acceptOrder
 * 后端负责状态 CAS 防并发 + 幂等，此处仅展示请求结果。
 */
async function grabOrder(order: SourceOrder) {
  if (order.status === '已摘单' || grabbingId.value != null) return
  grabbingId.value = order.id
  try {
    const res = (await carrierAcceptOrder({ orderId: order.orderNo })) as {
      success?: boolean
      code?: string | number
      message?: string
    }
    if (res && (res.success === true || String(res.code) === '200')) {
      order.status = '已摘单'
      showToast('摘单成功，请及时联系货主')
    } else {
      showToast(res?.message || '摘单失败，请稍后重试')
    }
  } catch (err) {
    console.error('摘单失败：', err)
    showToast('网络异常，摘单失败，请稍后重试')
  } finally {
    grabbingId.value = null
  }
}

/** 返回上一页，无历史记录时回首页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
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
          <span class="top-title">货源大厅</span>
          <span class="top-right"></span>
        </header>

        <!-- 统计卡片 -->
        <section class="stats-card">
          <div class="stats-main">
            <span class="stats-label">今日货源</span>
            <strong class="stats-num">{{ stats.total }}</strong>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <b>{{ stats.open }}</b>
              <span>可摘单</span>
            </div>
            <div class="stats-item">
              <b>{{ stats.accepted }}</b>
              <span>已摘单</span>
            </div>
            <div class="stats-item">
              <b>广东</b>
              <span>主要线路</span>
            </div>
          </div>
        </section>

        <!-- 线路搜索：发货地 → 收货地，最右端搜索按钮 -->
        <section class="search-card">
          <div class="search-row">
            <label class="search-field">
              <span class="field-tag tag-from">发货</span>
              <input v-model.trim="fromQuery" type="text" placeholder="发货地省市区" aria-label="发货地" @keyup.enter="handleSearch" />
            </label>
            <span class="field-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <label class="search-field">
              <span class="field-tag tag-to">收货</span>
              <input v-model.trim="toQuery" type="text" placeholder="收货地省市区" aria-label="收货地" @keyup.enter="handleSearch" />
            </label>
            <button type="button" class="search-btn" :disabled="loading" @click="handleSearch">
              {{ loading ? '…' : '搜索' }}
            </button>
          </div>
          <footer class="search-foot">
            <span class="search-tip">
              {{ loadError ? '加载失败，可点「重置」或下方「重新加载」重试' : searched ? `当前线路共 ${orderList.length} 条货源` : '输入发货地 / 收货地后点击搜索查询' }}
            </span>
            <button v-if="searched" type="button" class="search-reset" @click="handleReset">重置</button>
          </footer>
        </section>

        <!-- 货源列表 -->
        <main class="order-list">
          <p v-if="orderList.length" class="list-count">{{ searched ? '线路匹配' : '共' }} {{ orderList.length }} 条货源</p>

          <article v-for="order in orderList" :key="order.id" class="order-card">
            <!-- 顶部：货主 + 状态 -->
            <div class="card-head">
              <span class="shipper-name">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" />
                  <path d="M4.5 20c.9-3.2 3.7-5 7.5-5s6.6 1.8 7.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
                {{ order.shipperName }}
              </span>
              <span class="status-badge" :style="{ color: statusTheme[order.status].color, background: statusTheme[order.status].bg }">
                {{ order.status }}
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
              <span class="goods-meta">重量 {{ order.goodsWeight }} 吨</span>
              <span class="goods-meta goods-fee">{{ formatMoney(order.transportMoney) }}</span>
            </div>

            <!-- 底部：时间 + 按钮 -->
            <footer class="card-foot">
              <span class="publish-time">{{ order.publishTime }}</span>
              <div class="foot-actions">
                <button type="button" class="detail-btn" @click="openDetail(order)">详情</button>
                <button
                  v-if="order.status === '可摘单'"
                  type="button"
                  class="grab-btn"
                  :disabled="grabbingId != null"
                  @click="grabOrder(order)"
                >
                  {{ grabbingId === order.id ? '摘单中…' : '摘单' }}
                </button>
                <span v-else class="grabbed-label">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  已摘单
                </span>
              </div>
            </footer>
          </article>

          <!-- 空状态：加载中 / 失败可重试 / 无结果 -->
          <div v-if="!orderList.length" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="6" y="16" width="38" height="26" rx="4" fill="#e5e7eb" />
              <path d="M44 26h10a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H46a4 4 0 0 1-4-4v-6a6 6 0 0 0 2-6z" fill="#d1d5db" />
              <circle cx="17" cy="48" r="5" fill="#cbd5e1" />
              <circle cx="43" cy="48" r="5" fill="#cbd5e1" />
              <path d="M6 16 10 6h30" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="empty-title">
              {{ loading ? '加载中…' : loadError ? '加载失败' : hasKeyword ? '没有找到匹配的货源' : '暂无货源信息' }}
            </p>
            <p class="empty-tip">
              {{ loading ? '正在查询货源，请稍候' : loadError ? loadError : hasKeyword ? '试试更换发货地 / 收货地关键词' : '当前暂无合适的货源，稍后再来看看' }}
            </p>
            <button v-if="loadError && !loading" type="button" class="detail-btn empty-retry" @click="handleRetry">
              重新加载
            </button>
          </div>
        </main>
      </div>

      <!-- ======= 详情页 ======= -->
      <div v-else key="detail" class="page-detail">
        <template v-if="currentOrder">
          <header class="top-bar detail-bar">
            <button type="button" class="back-btn" aria-label="返回" @click="closeDetail">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <span class="top-title">货源详情</span>
            <span class="top-right"></span>
          </header>

          <main class="detail-body">
            <!-- 状态 + 路线概览 -->
            <section class="detail-hero">
              <div class="hero-head">
                <span class="status-badge hero-status" :style="{ color: statusTheme[currentOrder.status].color, background: statusTheme[currentOrder.status].bg }">
                  {{ currentOrder.status }}
                </span>
                <span class="hero-time">{{ currentOrder.publishTime }} 发布</span>
              </div>
              <div class="hero-route">
                <span class="hero-city">{{ currentOrder.shipperCity }}</span>
                <span class="hero-arrow">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span class="hero-city">{{ currentOrder.carrierCity }}</span>
              </div>
              <div class="hero-goods">
                <span>{{ currentOrder.goodsType }}</span>
                <span>{{ currentOrder.goodsWeight }} 吨</span>
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
                    <p class="node-address">{{ currentOrder.shipperAddress }}</p>
                  </div>
                </div>
                <div class="node">
                  <div class="node-rail">
                    <span class="node-dot to"></span>
                  </div>
                  <div class="node-body">
                    <span class="node-tag tag-to">收货</span>
                    <p class="node-region">{{ region(currentOrder.carrierProvince, currentOrder.carrierCity, currentOrder.carrierArea) }}</p>
                    <p class="node-address">{{ currentOrder.carrierAddress }}</p>
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
                  <span class="info-value">{{ currentOrder.goodsType }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">物品描述</span>
                  <span class="info-value">{{ currentOrder.goodsDescription }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">物品重量</span>
                  <span class="info-value">{{ currentOrder.goodsWeight }} 吨</span>
                </li>
                <li class="info-item">
                  <span class="info-label">运费</span>
                  <span class="info-value fee">{{ formatMoney(currentOrder.transportMoney) }}</span>
                </li>
              </ul>
            </section>

            <!-- 货主信息 -->
            <section class="card-block">
              <h3 class="block-title">货主信息</h3>
              <ul class="info-list">
                <li class="info-item">
                  <span class="info-label">货主名称</span>
                  <span class="info-value">{{ currentOrder.shipperName }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">联系电话</span>
                  <span class="info-value phone">{{ currentOrder.shipperMobile }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">货源编号</span>
                  <span class="info-value">{{ currentOrder.orderNo }}</span>
                </li>
              </ul>
            </section>
          </main>

          <!-- 底部摘单栏 -->
          <footer v-if="currentOrder.status === '可摘单'" class="action-bar">
            <button type="button" class="grab-big-btn" :disabled="grabbingId != null" @click="grabOrder(currentOrder)">
              {{ grabbingId === currentOrder.id ? '摘单中…' : '立即摘单' }}
            </button>
          </footer>
          <footer v-else class="action-bar action-bar-done">
            <span class="done-text">已摘单，可联系货主安排运输</span>
          </footer>
        </template>
      </div>
    </Transition>

    <!-- 轻提示 -->
    <Transition name="toast">
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
.top-bar {
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

/* ===== 线路搜索卡 ===== */
.search-card {
  margin: 0 $spacing-md $spacing-sm;
  padding: $spacing-md;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-field {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 10px;
  border-radius: $radius-md;
  background: $bg-page;
}

.field-tag {
  flex-shrink: 0;
  font-size: $font-size-xs;
  font-weight: 600;
}

.tag-from {
  color: $color-primary;
}

.tag-to {
  color: $color-danger;
}

.search-field input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: $font-size-sm;
  color: $text-primary;

  &::placeholder {
    color: $text-muted;
  }
}

.field-arrow {
  flex-shrink: 0;
  display: flex;
  color: $text-muted;

  svg {
    display: block;
    width: 16px;
    height: 16px;
  }
}

.search-btn {
  flex-shrink: 0;
  width: 56px;
  height: 40px;
  border: none;
  border-radius: $radius-md;
  background: linear-gradient(135deg, #047857, #10b981);
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 600;
  box-shadow: $shadow-sm;
  transition: $transition-base;

  &:active {
    opacity: 0.85;
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.6;
  }
}

.search-foot {
  margin-top: $spacing-sm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
}

.search-tip {
  font-size: $font-size-xs;
  color: $text-muted;
}

.search-reset {
  flex-shrink: 0;
  padding: 3px 12px;
  border: none;
  border-radius: $radius-full;
  background: rgba($text-muted, 0.1);
  color: $text-secondary;
  font-size: $font-size-xs;
  transition: $transition-base;

  &:active {
    opacity: 0.7;
  }
}

.empty-retry {
  margin-top: $spacing-sm;
}

/* ===== 货源列表 ===== */
.order-list {
  padding: $spacing-sm $spacing-md ($spacing-2xl);
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
  padding: 2px $spacing-sm;
  border-radius: $radius-sm;
  background: rgba($color-primary, 0.08);
  color: $color-primary;
  font-weight: 600;
}

.goods-meta {
  color: $text-secondary;

  &.goods-fee {
    margin-left: auto;
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

.publish-time {
  font-size: $font-size-xs;
  color: $text-muted;
}

.foot-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex-shrink: 0;
}

.detail-btn {
  height: 30px;
  padding: 0 $spacing-md;
  border-radius: $radius-full;
  background: rgba($color-primary, 0.1);
  color: $color-primary;
  font-size: $font-size-sm;
  font-weight: 600;
  transition: $transition-base;

  &:active {
    background: $color-primary;
    color: #fff;
  }
}

.grab-btn {
  height: 30px;
  padding: 0 $spacing-md;
  border-radius: $radius-full;
  background: $color-success;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  transition: $transition-base;

  &:active:not(:disabled) {
    transform: scale(0.96);
  }

  &:disabled {
    opacity: 0.5;
  }
}

.grabbed-label {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 30px;
  padding: 0 $spacing-sm;
  color: $color-success;
  font-size: $font-size-sm;
  font-weight: 600;

  svg {
    width: 16px;
    height: 16px;
  }
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

/* ===== 详情页 ===== */
.detail-bar {
  position: sticky;
  top: 0;
}

.detail-body {
  padding: $spacing-md $spacing-md 96px;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.detail-hero {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
    background: $color-success;
  }
}

/* 路线详情（详情页） */
.route-detail-list {
  margin-top: $spacing-md;
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

  &.phone {
    color: $color-primary;
    font-weight: 600;
  }
}

/* ===== 底部操作栏 ===== */
.action-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  z-index: 30;
  width: min(480px, 100vw);
  padding: $spacing-sm $spacing-md;
  padding-bottom: calc(#{$spacing-sm} + env(safe-area-inset-bottom));
  background: rgba($bg-card, 0.94);
  backdrop-filter: blur(8px);
  border-top: 1px solid $border-color;
}

.grab-big-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: $radius-full;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  font-size: $font-size-base;
  font-weight: 600;
  letter-spacing: 2px;
  box-shadow: $shadow-md;
  transition: $transition-base;

  &:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: $shadow-sm;
  }

  &:disabled {
    opacity: 0.6;
  }
}

.action-bar-done {
  display: flex;
  align-items: center;
  justify-content: center;
}

.done-text {
  color: $color-success;
  font-size: $font-size-sm;
  font-weight: 600;
}

/* ===== 轻提示 ===== */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 120px;
  transform: translateX(-50%);
  z-index: 100;
  max-width: min(320px, calc(100vw - 48px));
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-full;
  background: rgba(17, 24, 39, 0.88);
  color: #fff;
  font-size: $font-size-sm;
  text-align: center;
  box-shadow: $shadow-md;
}
</style>
