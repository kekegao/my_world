<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { queryPublishOrderList, type PublishedOrderItem } from '@/api/modules/order'

const router = useRouter()

type OrderStatus = '待接单' | '已接单' | '运输中' | '已完成' | '已取消'
type TabKey = OrderStatus | '全部'

/** 货主视角「我的订单」行数据，字段与后端 OrderDto 对齐 */
type OrderRow = PublishedOrderItem

/**
 * 后端 tf_b_order.status：1发布 2摘单 3成交 4发货 5确认收货 6回单确认 7结算申请 8结算 9对账 10发票。
 * 货主视角将流转状态归并为：待接单 / 已接单 / 运输中 / 已完成。
 */
const STATUS_TEXT: Record<number, OrderStatus> = {
  1: '待接单', // 发布，等待司机摘单
  2: '已接单', // 摘单
  3: '已接单', // 成交
  4: '运输中', // 发货
  5: '已完成', // 确认收货
  6: '已完成', // 回单确认
  7: '已完成', // 结算申请
  8: '已完成', // 结算
  9: '已完成', // 对账
  10: '已完成', // 发票
}

/** 状态主题色 */
const statusTheme: Record<OrderStatus, { color: string; bg: string }> = {
  待接单: { color: '#b45309', bg: '#fef3c7' },
  已接单: { color: '#1d4ed8', bg: '#dbeafe' },
  运输中: { color: '#047857', bg: '#d1fae5' },
  已完成: { color: '#4b5563', bg: '#e5e7eb' },
  已取消: { color: '#b91c1c', bg: '#fee2e2' },
}

/** 列表数据与加载状态 */
const orderList = ref<OrderRow[]>([])
/** 用于统计卡片的全部订单（与当前 Tab 筛选解耦） */
const allOrders = ref<OrderRow[]>([])
const loading = ref(false)
const loadError = ref('')

/**
 * 从后端查询当前货主发布的订单列表（POST /api/publishOrder/list）
 * 完整调用链：
 * publishOrderList.vue -> ams-app(PublishOrderController) -> order-bsm-biz-service(OrderProtocolImpl)
 *   -> OrderServiceImpl -> OrderMapper(selectPublishOrderList) -> MyBatis -> tf_b_order 表
 *
 * @param statusList 后端 tf_b_order.status 状态集合，undefined/null 表示查询全部
 */
async function loadOrders(statusList?: number[]) {
  loading.value = true
  loadError.value = ''
  try {
    const res = (await queryPublishOrderList({ statusList })) as {
      success?: boolean
      code?: string | number
      message?: string
      data?: OrderRow[]
    }
    if (res && (res.success === true || String(res.code) === '200')) {
      orderList.value = Array.isArray(res.data) ? res.data : []
    } else {
      loadError.value = res?.message || '加载失败，请稍后重试'
      orderList.value = []
    }
  } catch (err) {
    console.error('加载已发布订单列表失败：', err)
    loadError.value = '无法连接服务器，请确认 ams-app 后端服务已启动'
    orderList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadOrders()
  allOrders.value = orderList.value
})

/** 状态文案：优先按状态码归并，其次取后端状态描述，兜底「其他」 */
function statusTextOf(order: OrderRow): string {
  const mapped = order.status != null ? STATUS_TEXT[order.status] : undefined
  if (mapped) return mapped
  const desc = order.statusDesc
  if (desc && ['待接单', '已接单', '运输中', '已完成', '已取消'].includes(desc)) return desc
  return '其他'
}

/** 状态徽标样式（未知状态兜底灰色） */
function badgeStyle(order: OrderRow): { color: string; bg: string } {
  const theme = statusTheme[statusTextOf(order) as OrderStatus]
  return theme ?? { color: '#6b7280', bg: '#f3f4f6' }
}

/** 筛选标签 */
const tabs: TabKey[] = ['全部', '待接单', '已接单', '运输中', '已完成', '已取消']
const activeTab = ref<TabKey>('全部')

/**
 * Tab -> 后端 tf_b_order.status 状态码映射。
 * null/undefined 表示查询全部；
 * 已取消目前业务未定义状态码，先用 [-1] 让 IN 查询结果为空，后续有真实取消状态时替换即可。
 */
const TAB_STATUS_MAP: Record<TabKey, number[] | null> = {
  全部: null,
  待接单: [1],
  已接单: [2, 3],
  运输中: [4],
  已完成: [5, 6, 7, 8, 9, 10],
  已取消: [-1],
}

function onTabClick(tab: TabKey) {
  activeTab.value = tab
  loadOrders(TAB_STATUS_MAP[tab] ?? undefined)
}

/** 当前查看详情的订单，null 表示处于列表页 */
const currentOrder = ref<OrderRow | null>(null)

/** 顶部统计（基于全部订单，避免切换 Tab 时统计随列表变化） */
const stats = computed(() => {
  const list = allOrders.value
  return {
    total: list.length,
    waiting: list.filter((o) => statusTextOf(o) === '待接单').length,
    ongoing: list.filter((o) => ['已接单', '运输中'].includes(statusTextOf(o))).length,
    done: list.filter((o) => statusTextOf(o) === '已完成').length,
  }
})

/** 拼接省市区，过滤空段 */
function region(province?: string, city?: string, area?: string): string {
  return [province, city, area].filter(Boolean).join(' ')
}

/** 运费展示，未填则显示面议 */
function formatMoney(money?: number | string | null): string {
  if (money === null || money === undefined || money === '') return '面议'
  const num = Number(money)
  return Number.isFinite(num) ? `¥ ${num}` : '面议'
}

/** 物品重量展示 */
function weightText(order: OrderRow): string {
  return order.goodsWeight === null || order.goodsWeight === undefined ? '未填写' : `${order.goodsWeight} 吨`
}

/** 文本字段空值占位 */
function displayValue(value?: string | null): string {
  return value && value.trim() ? value : '—'
}

/** 将后端 ISO 时间格式化为 yyyy-MM-dd HH:mm */
function formatTime(time?: string | null): string {
  if (!time) return ''
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 打开详情 */
function openDetail(order: OrderRow) {
  currentOrder.value = order
  nextTick(() => window.scrollTo({ top: 0 }))
}

/** 返回列表 */
function closeDetail() {
  currentOrder.value = null
  nextTick(() => window.scrollTo({ top: 0 }))
}

/**
 * 返回上一页：从「我的」账户页进入时原路退回；
 * 无历史记录（如登录后直达）时回到账户页，与账户页「我的运单」入口形成联动。
 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/account')
  }
}

/** 跳转到发布订单页 */
function goPublish() {
  router.push('/publishOrder')
}
</script>

<template>
  <div class="order-app">
    <!-- ======= 列表页 ======= -->
    <Transition name="page" mode="out-in">
      <div v-if="!currentOrder" key="list" class="page-list">
        <!-- 顶部导航：返回账户 + 标题（移到右上角原发布按钮位置） -->
        <header class="top-bar">
          <button type="button" class="back-btn" aria-label="返回" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="top-title">我的订单</span>
        </header>

        <!-- 统计卡片：已发布订单，发布按钮置于卡片右上角 -->
        <section class="stats-card">
          <div class="stats-head">
            <div class="stats-main">
              <span class="stats-label">已发布订单</span>
              <strong class="stats-num">{{ stats.total }}</strong>
            </div>
            <button class="stats-publish" type="button" @click="goPublish">＋ 发布</button>
          </div>
          <div class="stats-grid">
            <div class="stats-item">
              <b>{{ stats.waiting }}</b>
              <span>待接单</span>
            </div>
            <div class="stats-item">
              <b>{{ stats.ongoing }}</b>
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
            @click="onTabClick(tab)"
          >
            {{ tab }}
          </button>
        </nav>

        <!-- 订单列表 -->
        <main class="order-list">
          <p v-if="orderList.length" class="list-count">共 {{ orderList.length }} 条记录</p>

          <article v-for="order in orderList" :key="order.id" class="order-card">
            <!-- 顶部：单号 + 状态 -->
            <div class="card-head">
              <span class="order-no">单号 {{ order.orderId }}</span>
              <span class="status-badge" :style="badgeStyle(order)">
                {{ statusTextOf(order) }}
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
              <span class="goods-chip">{{ displayValue(order.goodsType) }}</span>
              <span class="goods-meta">重量 {{ weightText(order) }}</span>
              <span class="goods-meta goods-fee">{{ formatMoney(order.transportMoney) }}</span>
            </div>

            <!-- 底部：时间 + 详情 -->
            <footer class="card-foot">
              <span class="publish-time">{{ formatTime(order.createTime) }}</span>
              <button type="button" class="detail-btn" @click="openDetail(order)">查看详情</button>
            </footer>
          </article>

          <!-- 空状态 -->
          <div v-if="!orderList.length" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="6" y="16" width="38" height="26" rx="4" fill="#e5e7eb" />
              <path d="M44 26h10a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H46a4 4 0 0 1-4-4v-6a6 6 0 0 0 2-6z" fill="#d1d5db" />
              <circle cx="17" cy="48" r="5" fill="#cbd5e1" />
              <circle cx="43" cy="48" r="5" fill="#cbd5e1" />
              <path d="M6 16 10 6h30" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="empty-title">
              {{ loading ? '加载中…' : loadError ? '加载失败' : '暂无相关订单' }}
            </p>
            <p class="empty-tip">
              {{
                loading
                  ? '正在从服务器查询您的发布订单'
                  : loadError
                    ? loadError
                    : '切换到其他状态，或点击卡片上的「发布」按钮发布新订单'
              }}
            </p>
            <button v-if="loadError && !loading" type="button" class="detail-btn empty-retry" @click="() => loadOrders(TAB_STATUS_MAP[activeTab] ?? undefined)">
              重新加载
            </button>
          </div>
        </main>
      </div>

      <!-- ======= 详情页 ======= -->
      <div v-else key="detail" class="page-detail">
        <template v-if="currentOrder">
          <header class="detail-bar">
            <button type="button" class="back-btn" aria-label="返回" @click="closeDetail">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <span class="detail-bar-title">订单详情</span>
            <span class="detail-bar-right"></span>
          </header>

          <main class="detail-body">
            <!-- 状态 + 路线概览 -->
            <section class="detail-hero">
              <div class="hero-head">
                <span class="status-badge hero-status" :style="badgeStyle(currentOrder)">
                  {{ statusTextOf(currentOrder) }}
                </span>
                <span class="hero-time">{{ formatTime(currentOrder.createTime) }} 发布</span>
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
                    <p class="node-address">{{ currentOrder.shipperAddress }}</p>
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
                    <p class="node-address">{{ currentOrder.carrierAddress }}</p>
                    <p v-if="currentOrder.carrierName" class="node-contact">联系人：{{ currentOrder.carrierName }} {{ currentOrder.carrierMobile }}</p>
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
                  <span class="info-label">订单编号</span>
                  <span class="info-value">{{ displayValue(currentOrder.orderId) }}</span>
                </li>
                <li class="info-item">
                  <span class="info-label">订单状态</span>
                  <span class="info-value">{{ statusTextOf(currentOrder) }}</span>
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

            <p class="detail-tip">如对订单有疑问，请及时联系平台客服处理</p>
          </main>
        </template>
      </div>
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

.top-title {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
}

/* ===== 统计卡片 ===== */
.stats-card {
  margin: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  box-shadow: $shadow-md;
}

.stats-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-sm;
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
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

/* 卡片右上角的发布按钮（白色半透明胶囊） */
.stats-publish {
  height: 30px;
  padding: 0 $spacing-md;
  display: inline-flex;
  align-items: center;
  border-radius: $radius-full;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 600;
  transition: $transition-base;

  &:active {
    background: rgba(255, 255, 255, 0.32);
  }
}

.stats-grid {
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: space-around;
  gap: $spacing-sm;
}

.stats-item {
  flex: 1;
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

  /* 保证滚到最右侧时「已取消」仍与屏幕边缘有间距 */
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
    background: rgba($color-primary, 0.12);
    border-color: rgba($color-primary, 0.4);
    color: $color-primary;
    font-weight: 600;
  }
}

/* ===== 订单列表 ===== */
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

.order-no {
  font-size: $font-size-xs;
  color: $text-muted;
  letter-spacing: 0.3px;
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
}

.publish-time {
  font-size: $font-size-xs;
  color: $text-muted;
}

.detail-btn {
  height: 30px;
  padding: 0 $spacing-lg;
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

.empty-retry {
  margin-top: $spacing-md;
}

/* ===== 详情页 ===== */
.detail-bar {
  justify-content: space-between;
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

/* 状态 + 概览 */
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
</style>
