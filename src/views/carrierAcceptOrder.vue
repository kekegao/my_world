<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type OrderStatus = '可摘单' | '已摘单'
type TabKey = OrderStatus | '全部'

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

/**
 * 当前为前端模拟数据，方便直接预览效果；
 * 对接后端时，将 initialOrders 替换为「货源大厅/摘单列表」接口返回值即可。
 */
const initialOrders: SourceOrder[] = [
  {
    id: 1,
    orderNo: 'YD20260902001',
    status: '可摘单',
    publishTime: '2026-09-02 09:32',
    goodsType: '煤炭',
    goodsDescription: '动力煤，低位发热量 5200 大卡',
    goodsWeight: 60,
    transportMoney: 3200,
    shipperProvince: '广东省',
    shipperCity: '韶关市',
    shipperArea: '曲江区',
    shipperAddress: '乌石镇火车站东侧货场',
    carrierProvince: '广东省',
    carrierCity: '惠州市',
    carrierArea: '惠阳区',
    carrierAddress: '秋长镇维布工业园仓库',
    shipperName: '赵敏',
    shipperMobile: '13900000003',
  },
  {
    id: 2,
    orderNo: 'YD20260902002',
    status: '可摘单',
    publishTime: '2026-09-02 08:50',
    goodsType: '建材',
    goodsDescription: '建筑河沙，装车后需覆盖篷布',
    goodsWeight: 25,
    transportMoney: 1800,
    shipperProvince: '广东省',
    shipperCity: '广州市',
    shipperArea: '番禺区',
    shipperAddress: '东环街道兴南路 12 号堆场',
    carrierProvince: '广东省',
    carrierCity: '深圳市',
    carrierArea: '宝安区',
    carrierAddress: '福永街道福园一路 88 号工地',
    shipperName: '张伟',
    shipperMobile: '13800000001',
  },
  {
    id: 3,
    orderNo: 'YD20260902003',
    status: '可摘单',
    publishTime: '2026-09-02 08:15',
    goodsType: '钢铁',
    goodsDescription: '螺纹钢 HRB400，约 120 根',
    goodsWeight: 42,
    transportMoney: 2600,
    shipperProvince: '广东省',
    shipperCity: '佛山市',
    shipperArea: '顺德区',
    shipperAddress: '乐从钢铁世界 A 区 6 号仓',
    carrierProvince: '广东省',
    carrierCity: '东莞市',
    carrierArea: '长安镇',
    carrierAddress: '霄边工业区振安中路 100 号',
    shipperName: '王芳',
    shipperMobile: '13800000002',
  },
  {
    id: 4,
    orderNo: 'YD20260902004',
    status: '已摘单',
    publishTime: '2026-09-01 16:40',
    goodsType: '煤炭',
    goodsDescription: '洗精煤，灰分 ≤ 12%',
    goodsWeight: 58,
    transportMoney: 3100,
    shipperProvince: '广东省',
    shipperCity: '清远市',
    shipperArea: '清城区',
    shipperAddress: '源潭镇红杉装卸场',
    carrierProvince: '广东省',
    carrierCity: '江门市',
    carrierArea: '台山市',
    carrierAddress: '台城街道陈宜禧路仓库',
    shipperName: '林峰',
    shipperMobile: '13900000007',
  },
  {
    id: 5,
    orderNo: 'YD20260901005',
    status: '可摘单',
    publishTime: '2026-09-01 10:05',
    goodsType: '其他',
    goodsDescription: '日用百货散货，共 12 托',
    goodsWeight: 3.5,
    transportMoney: 650,
    shipperProvince: '广东省',
    shipperCity: '东莞市',
    shipperArea: '南城区',
    shipperAddress: '宏图路 33 号物流园 3 号库',
    carrierProvince: '广东省',
    carrierCity: '珠海市',
    carrierArea: '香洲区',
    carrierAddress: '南屏科技园屏东二路 6 号',
    shipperName: '孙丽',
    shipperMobile: '13800000004',
  },
  {
    id: 6,
    orderNo: 'YD20260901006',
    status: '已摘单',
    publishTime: '2026-09-01 09:18',
    goodsType: '建材',
    goodsDescription: '袋装水泥 P.O 42.5，800 包',
    goodsWeight: 40,
    transportMoney: 2200,
    shipperProvince: '广东省',
    shipperCity: '肇庆市',
    shipperArea: '四会市',
    shipperAddress: '大沙镇陶瓷城西门装卸点',
    carrierProvince: '广东省',
    carrierCity: '广州市',
    carrierArea: '白云区',
    carrierAddress: '太和镇大源北路 150 号工地',
    shipperName: '吴涛',
    shipperMobile: '13900000005',
  },
  {
    id: 7,
    orderNo: 'YD20260901007',
    status: '可摘单',
    publishTime: '2026-09-01 08:30',
    goodsType: '钢铁',
    goodsDescription: '钢板 Q235B 10mm，30 张',
    goodsWeight: 32,
    transportMoney: 2000,
    shipperProvince: '广东省',
    shipperCity: '广州市',
    shipperArea: '黄埔区',
    shipperAddress: '鱼珠码头金属加工区',
    carrierProvince: '广东省',
    carrierCity: '佛山市',
    carrierArea: '南海区',
    carrierAddress: '狮山镇小塘工业大道 21 号',
    shipperName: '郑凯',
    shipperMobile: '13800000006',
  },
  {
    id: 8,
    orderNo: 'YD20260831008',
    status: '可摘单',
    publishTime: '2026-08-31 15:22',
    goodsType: '建材',
    goodsDescription: '河沙细沙 2.0 目，装车覆盖',
    goodsWeight: 30,
    transportMoney: undefined,
    shipperProvince: '广东省',
    shipperCity: '清远市',
    shipperArea: '英德市',
    shipperAddress: '浛洸镇望埠河段装卸点',
    carrierProvince: '广东省',
    carrierCity: '广州市',
    carrierArea: '白云区',
    carrierAddress: '钟落潭镇良田路 66 号工地',
    shipperName: '何静',
    shipperMobile: '13900000008',
  },
]

const orderList = ref<SourceOrder[]>(initialOrders)

/** 摘单状态主题色 */
const statusTheme: Record<OrderStatus, { color: string; bg: string }> = {
  可摘单: { color: '#b45309', bg: '#fef3c7' },
  已摘单: { color: '#047857', bg: '#d1fae5' },
}

/** 筛选标签 */
const tabs: TabKey[] = ['全部', '可摘单', '已摘单']
const activeTab = ref<TabKey>('全部')

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

const filteredOrders = computed(() =>
  activeTab.value === '全部' ? orderList.value : orderList.value.filter((o) => o.status === activeTab.value),
)

/** 顶部统计 */
const stats = computed(() => {
  const list = orderList.value
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

/** 摘单（模拟请求） */
async function grabOrder(order: SourceOrder) {
  if (order.status === '已摘单' || grabbingId.value != null) return
  grabbingId.value = order.id
  try {
    // TODO: 对接后端后替换为摘单接口调用，如 carrierAccept({ orderNo: order.orderNo })
    await new Promise<void>((resolve) => setTimeout(resolve, 600))
    order.status = '已摘单'
    showToast('摘单成功，请及时联系货主')
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

        <!-- 货源列表 -->
        <main class="order-list">
          <p v-if="filteredOrders.length" class="list-count">共 {{ filteredOrders.length }} 条货源</p>

          <article v-for="order in filteredOrders" :key="order.id" class="order-card">
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

          <!-- 空状态 -->
          <div v-if="!filteredOrders.length" class="empty-state">
            <svg class="empty-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="6" y="16" width="38" height="26" rx="4" fill="#e5e7eb" />
              <path d="M44 26h10a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H46a4 4 0 0 1-4-4v-6a6 6 0 0 0 2-6z" fill="#d1d5db" />
              <circle cx="17" cy="48" r="5" fill="#cbd5e1" />
              <circle cx="43" cy="48" r="5" fill="#cbd5e1" />
              <path d="M6 16 10 6h30" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <p class="empty-title">暂无货源信息</p>
            <p class="empty-tip">当前分类下暂时没有合适的货源</p>
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
