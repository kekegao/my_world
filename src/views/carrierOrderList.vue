<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

type OrderStatus = '运输中' | '已完成'
type TabKey = OrderStatus | '全部'

/** 我摘过的运单（承运方视角） */
interface MyOrderItem {
  id: number
  orderNo: string
  status: OrderStatus
  /** 摘单时间 */
  grabTime: string
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
 * 对接后端时，将 initialOrders 替换为「承运方摘单列表」接口返回值即可。
 */
const initialOrders: MyOrderItem[] = [
  {
    id: 1,
    orderNo: 'YD20260902001',
    status: '运输中',
    grabTime: '2026-09-02 09:40',
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
    orderNo: 'YD20260901005',
    status: '运输中',
    grabTime: '2026-09-01 10:12',
    goodsType: '其他',
    goodsDescription: '日用百货，需防潮垫底',
    goodsWeight: 12,
    transportMoney: 950,
    shipperProvince: '广东省',
    shipperCity: '东莞市',
    shipperArea: '虎门镇',
    shipperAddress: '虎门大道 88 号物流园 A 区',
    carrierProvince: '广东省',
    carrierCity: '佛山市',
    carrierArea: '顺德区',
    carrierAddress: '容桂街道容奇大道 15 号仓库',
    shipperName: '李强',
    shipperMobile: '13700000005',
  },
  {
    id: 3,
    orderNo: 'YD20260831009',
    status: '已完成',
    grabTime: '2026-08-31 09:20',
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
    id: 4,
    orderNo: 'YD20260830012',
    status: '已完成',
    grabTime: '2026-08-30 14:05',
    goodsType: '钢铁',
    goodsDescription: '螺纹钢 HRB400，共 5 捆',
    goodsWeight: 40,
    transportMoney: 2600,
    shipperProvince: '广东省',
    shipperCity: '佛山市',
    shipperArea: '乐从镇',
    shipperAddress: '乐从钢铁世界 C 区 12 档',
    carrierProvince: '广东省',
    carrierCity: '江门市',
    carrierArea: '新会区',
    carrierAddress: '会城街道今古洲工业园工地',
    shipperName: '王芳',
    shipperMobile: '13600000002',
  },
  {
    id: 5,
    orderNo: 'YD20260828003',
    status: '已完成',
    grabTime: '2026-08-28 08:55',
    goodsType: '煤炭',
    goodsDescription: '块煤，装车均匀堆放',
    goodsWeight: 33,
    transportMoney: 2100,
    shipperProvince: '广东省',
    shipperCity: '清远市',
    shipperArea: '英德市',
    shipperAddress: '英红工业园储煤场',
    carrierProvince: '广东省',
    carrierCity: '肇庆市',
    carrierArea: '四会市',
    carrierAddress: '南江工业园纸箱厂',
    shipperName: '陈涛',
    shipperMobile: '13500000006',
  },
]

const orderList = ref<MyOrderItem[]>(initialOrders)

/** 运单状态主题色 */
const statusTheme: Record<OrderStatus, { color: string; bg: string }> = {
  运输中: { color: '#0369a1', bg: '#e0f2fe' },
  已完成: { color: '#047857', bg: '#d1fae5' },
}

/** 筛选标签 */
const tabs: TabKey[] = ['全部', '运输中', '已完成']
const activeTab = ref<TabKey>('全部')

const filteredOrders = computed(() =>
  activeTab.value === '全部' ? orderList.value : orderList.value.filter((o) => o.status === activeTab.value),
)

/** 顶部统计 */
const stats = computed(() => {
  const list = orderList.value
  return {
    total: list.length,
    running: list.filter((o) => o.status === '运输中').length,
    done: list.filter((o) => o.status === '已完成').length,
  }
})

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
          <span>运输中</span>
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
          <span class="goods-meta">{{ order.goodsDescription }}</span>
          <span class="goods-meta goods-fee">¥ {{ order.transportMoney }}</span>
        </div>

        <!-- 底部：摘单时间 -->
        <footer class="card-foot">
          <span class="grab-time">摘单于 {{ order.grabTime }}</span>
          <a class="call-link" :href="`tel:${order.shipperMobile}`">联系货主</a>
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
        <p class="empty-title">暂无已摘运单</p>
        <p class="empty-tip">去货源大厅摘一单，运单将显示在这里</p>
      </div>
    </main>
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

.route-tag {
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
  font-size: $font-size-xs;
  color: $text-muted;
}

.call-link {
  flex-shrink: 0;
  height: 30px;
  padding: 6px $spacing-md;
  border-radius: $radius-full;
  background: rgba($color-success, 0.1);
  color: $color-success;
  font-size: $font-size-sm;
  font-weight: 600;
  text-decoration: none;
  transition: $transition-base;

  &:active {
    background: $color-success;
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
</style>
