<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  formatAmount,
  loadAccountBalance,
  loadFrozenDetails,
  type AccountBalance,
  type FrozenBizType,
  type FrozenDetailItem,
} from '@/utils/account'

const router = useRouter()

/**
 * 账户余额：读取本地模拟存储，与充值 / 提现页共享并联动；
 * 对接后端时改为「账户余额查询」接口返回数据。
 */
const accountBalance = ref<AccountBalance>(loadAccountBalance())

/** 冻结业务类型主题色 */
const bizTheme: Record<FrozenBizType, { color: string; bg: string }> = {
  运费托管: { color: '#1d4ed8', bg: '#dbeafe' },
  提现冻结: { color: '#b45309', bg: '#fef3c7' },
}

/**
 * 冻结明细：读取本地模拟存储（含提现后新增的记录）；
 * 对接后端时改为「冻结明细查询」接口返回数据。
 */
const frozenDetails = ref<FrozenDetailItem[]>(loadFrozenDetails())

/** 冻结明细合计 */
const frozenTotal = computed(() => frozenDetails.value.reduce((sum, item) => sum + item.amount, 0))

/** 当前展示视图：home 余额主页 / frozen 冻结明细页 */
const view = ref<'home' | 'frozen'>('home')

/** 页面每次进入时同步最新余额（充值 / 提现返回后数据联动） */
onMounted(() => {
  accountBalance.value = loadAccountBalance()
  frozenDetails.value = loadFrozenDetails()
})

/** 返回上一页，无历史记录时回到我的订单页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/publishOrderList')
  }
}

/** 进入我的运单（我的订单） */
function goMyOrder() {
  router.push('/publishOrderList')
}

/** 跳转充值页 */
function goRecharge() {
  router.push('/recharge')
}

/** 跳转提现页 */
function goWithdraw() {
  router.push('/withdraw')
}

/** 打开冻结金额明细 */
function openFrozenDetail() {
  view.value = 'frozen'
  nextTick(() => window.scrollTo({ top: 0 }))
}

/** 返回余额主页 */
function closeFrozenDetail() {
  view.value = 'home'
  nextTick(() => window.scrollTo({ top: 0 }))
}
</script>

<template>
  <div class="account-app">
    <Transition name="page" mode="out-in">
      <!-- ======= 余额主页 ======= -->
      <div v-if="view === 'home'" key="home" class="page-home">
        <!-- 顶部导航 -->
        <header class="app-bar">
          <button type="button" class="back-btn" aria-label="返回" @click="goBack">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="app-title">智运宝</span>
          <span class="app-right"></span>
        </header>

        <main class="account-body">
          <!-- 余额主卡 -->
          <section class="balance-card">
            <div class="balance-head">
              <span class="balance-brand">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2.5 20 5.5v6c0 4.6-3.2 8.2-8 9.9-4.8-1.7-8-5.3-8-9.9v-6l8-3z"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linejoin="round"
                  />
                  <path d="M8.5 12.2l2.3 2.3 4.7-4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                资金已托管
              </span>
              <span class="balance-actions">
                <button type="button" class="balance-btn balance-btn-solid" @click="goRecharge">充值</button>
                <button type="button" class="balance-btn balance-btn-ghost" @click="goWithdraw">提现</button>
              </span>
            </div>

            <p class="balance-label">账户余额（元）</p>

            <p class="balance-amount">
              <span class="amount-symbol">¥</span>
              {{ formatAmount(accountBalance.total) }}
            </p>

            <p class="balance-update">更新于 {{ accountBalance.updateTime }}</p>
          </section>

          <!-- 余额明细 -->
          <section class="detail-card">
            <div class="detail-item">
              <span class="detail-label">可用余额</span>
              <span class="detail-value available">¥ {{ formatAmount(accountBalance.available) }}</span>
            </div>
            <!-- 冻结金额：可点击查看明细 -->
            <button type="button" class="detail-item detail-clickable" @click="openFrozenDetail">
              <span class="detail-label">
                冻结金额
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 4v16m0 0 4.5-4.5M12 20l-4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="detail-value frozen">¥ {{ formatAmount(accountBalance.frozen) }}</span>
              <svg class="detail-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <p class="detail-tip">冻结金额为进行中运单的运费托管及提现处理中的款项，点击可查看明细</p>
          </section>

          <!-- 我的运单入口 -->
          <section class="entry-card" role="button" tabindex="0" @click="goMyOrder" @keydown.enter="goMyOrder">
            <div class="entry-icon">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6" />
                <path d="M7 9h10M7 13h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="16.5" cy="15.5" r="2.5" stroke="currentColor" stroke-width="1.6" />
                <path d="M16.5 18v1M16.5 12v1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </div>
            <div class="entry-text">
              <b>我的运单</b>
              <span>查看全部运单与运输进度</span>
            </div>
            <svg class="entry-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </section>
        </main>

        <!-- 底部操作栏 -->
        <footer class="action-bar">
          <button type="button" class="order-btn" @click="goMyOrder">我的运单</button>
        </footer>
      </div>

      <!-- ======= 冻结明细页 ======= -->
      <div v-else key="frozen" class="page-frozen">
        <header class="app-bar">
          <button type="button" class="back-btn" aria-label="返回" @click="closeFrozenDetail">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="app-title">冻结明细</span>
          <span class="app-right"></span>
        </header>

        <main class="frozen-body">
          <!-- 冻结总额 -->
          <section class="frozen-total-card">
            <span class="frozen-total-label">当前冻结总额（元）</span>
            <strong class="frozen-total-num">¥ {{ formatAmount(frozenTotal) }}</strong>
            <p class="frozen-total-tip">运费托管及提现处理中的款项，解冻后自动转入可用余额</p>
          </section>

          <!-- 冻结明细列表 -->
          <section class="frozen-list">
            <p v-if="frozenDetails.length" class="list-count">共 {{ frozenDetails.length }} 笔冻结记录</p>

            <article v-for="item in frozenDetails" :key="item.id" class="frozen-item">
              <span class="biz-badge" :style="{ color: bizTheme[item.bizType].color, background: bizTheme[item.bizType].bg }">
                {{ item.bizType }}
              </span>
              <div class="frozen-main">
                <p class="frozen-order-no">
                  单号 {{ item.orderNo }}
                  <span class="frozen-status">{{ item.status }}</span>
                </p>
                <p class="frozen-time">{{ item.frozenTime }} 冻结</p>
              </div>
              <span class="frozen-amount">-¥ {{ formatAmount(item.amount) }}</span>
            </article>

            <!-- 空状态 -->
            <div v-if="!frozenDetails.length" class="empty-state">
              <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <circle cx="32" cy="32" r="24" stroke="#e5e7eb" stroke-width="4" />
                <path d="M20 32h8l3-8 6 16 3-8h4" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <p class="empty-title">暂无冻结明细</p>
              <p class="empty-tip">进行中的运单运费托管或提现将显示在这里</p>
            </div>
          </section>

          <p class="frozen-foot-tip">如对冻结款项有疑问，请联系平台客服处理</p>
        </main>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.account-app {
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
.app-bar {
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

.app-title {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
}

.app-right {
  width: 36px;
}

/* ===== 余额主页 ===== */
.page-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-page;
}

.account-body {
  flex: 1;
  padding: $spacing-md $spacing-md 96px;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/* 余额主卡 */
.balance-card {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  box-shadow: $shadow-md;
}

.balance-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.balance-actions {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.balance-btn {
  height: 32px;
  padding: 0 18px;
  border-radius: $radius-full;
  font-size: $font-size-sm;
  font-weight: 600;
  transition: $transition-base;

  &.balance-btn-solid {
    border: none;
    background: #fff;
    color: $color-primary;
  }

  &.balance-btn-ghost {
    border: 1px solid rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }

  &:active {
    opacity: 0.85;
    transform: translateY(1px);
  }
}

.balance-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px $spacing-sm;
  border-radius: $radius-full;
  background: rgba(255, 255, 255, 0.18);
  font-size: $font-size-xs;
  font-weight: 600;

  svg {
    width: 16px;
    height: 16px;
  }
}

.balance-label {
  margin-top: $spacing-lg;
  font-size: $font-size-sm;
  opacity: 0.92;
}

.balance-amount {
  margin-top: $spacing-sm;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
}

.amount-symbol {
  margin-right: 4px;
  font-size: $font-size-xl;
  font-weight: 600;
}

.balance-update {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  opacity: 0.8;
}

/* 余额明细卡 */
.detail-card {
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.detail-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: $spacing-sm 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;

  & + & {
    border-top: 1px dashed $border-color;
  }

  .detail-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: $font-size-sm;
    color: $text-secondary;

    svg {
      width: 15px;
      height: 15px;
      color: $color-warning;
    }
  }
}

/* 可用余额行不可点击 */
.detail-item.detail-clickable {
  cursor: pointer;
  transition: $transition-base;

  &:active {
    opacity: 0.7;
  }
}

.detail-label {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.detail-value {
  font-size: $font-size-lg;
  font-weight: 700;
  font-variant-numeric: tabular-nums;

  &.available {
    color: $text-primary;
  }

  &.frozen {
    color: $color-warning;
  }
}

.detail-arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: $text-muted;
}

.detail-tip {
  padding-top: $spacing-sm;
  border-top: 1px dashed $border-color;
  font-size: $font-size-xs;
  color: $text-muted;
  line-height: 1.6;
}

/* 我的运单入口卡 */
.entry-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: $transition-base;

  &:active {
    background: #f8fafc;
  }
}

.entry-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: rgba($color-primary, 0.1);
  color: $color-primary;

  svg {
    width: 24px;
    height: 24px;
  }
}

.entry-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;

  b {
    font-size: $font-size-base;
    color: $text-primary;
  }

  span {
    font-size: $font-size-xs;
    color: $text-muted;
  }
}

.entry-arrow {
  width: 20px;
  height: 20px;
  color: $text-muted;
  flex-shrink: 0;
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

.order-btn {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: $radius-full;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  font-size: $font-size-base;
  font-weight: 600;
  letter-spacing: 4px;
  box-shadow: $shadow-md;
  transition: $transition-base;

  &:active {
    transform: translateY(1px);
    box-shadow: $shadow-sm;
  }
}

/* ===== 冻结明细页 ===== */
.page-frozen {
  min-height: 100vh;
  background: $bg-page;
}

.frozen-body {
  padding: $spacing-md $spacing-md $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

/* 冻结总额卡 */
.frozen-total-card {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  box-shadow: $shadow-md;
}

.frozen-total-label {
  display: block;
  font-size: $font-size-sm;
  opacity: 0.92;
}

.frozen-total-num {
  display: block;
  margin-top: $spacing-sm;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.frozen-total-tip {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  opacity: 0.85;
  line-height: 1.6;
}

/* 明细列表 */
.frozen-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.list-count {
  font-size: $font-size-xs;
  color: $text-muted;
  padding: 0 $spacing-xs;
}

.frozen-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.biz-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
}

.frozen-main {
  flex: 1;
  min-width: 0;
}

.frozen-order-no {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  .frozen-status {
    margin-left: 6px;
    font-size: $font-size-xs;
    font-weight: 400;
    color: $color-success;
  }
}

.frozen-time {
  margin-top: 3px;
  font-size: $font-size-xs;
  color: $text-muted;
}

.frozen-amount {
  flex-shrink: 0;
  font-size: $font-size-base;
  font-weight: 700;
  color: $color-warning;
  font-variant-numeric: tabular-nums;
}

.frozen-foot-tip {
  text-align: center;
  font-size: $font-size-xs;
  color: $text-muted;
}

/* 空状态 */
.empty-state {
  margin-top: $spacing-sm;
  padding: $spacing-xl $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: $bg-card;
  border-radius: $radius-lg;

  svg {
    width: 72px;
    height: 72px;
  }
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
