<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatAmount, recharge } from '@/utils/account'

const router = useRouter()

/** 充值金额（字符串便于输入控制） */
const amountText = ref('')
/** 快捷金额档位 */
const quickAmounts = [100, 200, 500, 1000, 2000]
/** 单笔充值上限（元） */
const MAX_AMOUNT = 50000

/** 提交与成功状态 */
const submitting = ref(false)
const successAmount = ref(0)

/** 支付渠道（模拟） */
const payChannels = [
  { id: 'wechat', name: '微信支付', desc: '微信安全支付' },
  { id: 'alipay', name: '支付宝', desc: '推荐有礼' },
  { id: 'bank', name: '银行卡', desc: '快捷支付' },
]
const channel = ref('wechat')

/** 解析后的充值金额（两位小数） */
const amountNum = computed(() => Math.round((Number(amountText.value) || 0) * 100) / 100)

/** 是否命中快捷金额 */
function isQuick(v: number) {
  return amountNum.value === v
}

/** 校验信息 */
const errMsg = computed(() => {
  if (!amountText.value) return ''
  if (amountNum.value <= 0) return '请输入大于 0 的充值金额'
  if (amountNum.value > MAX_AMOUNT) return `单笔充值金额不能超过 ¥${formatAmount(MAX_AMOUNT)}`
  return ''
})

/** 输入过滤：仅允许数字与一个小数点，最多两位小数 */
function onAmountInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const clean = raw.replace(/[^\d.]/g, '')
  const [intPart, decPart = ''] = clean.split('.')
  amountText.value = decPart !== '' ? `${intPart}.${decPart.slice(0, 2)}` : intPart
}

/** 点击快捷金额 */
function selectQuick(v: number) {
  amountText.value = String(v)
}

/** 模拟提交充值 */
async function submit() {
  if (errMsg.value || amountNum.value <= 0 || submitting.value) return
  submitting.value = true
  // 模拟请求耗时
  await new Promise((resolve) => setTimeout(resolve, 700))
  recharge(amountNum.value)
  submitting.value = false
  successAmount.value = amountNum.value
}

/** 完成充值，返回账户页 */
function done() {
  router.replace('/account')
}

/** 返回上一页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/account')
  }
}
</script>

<template>
  <div class="recharge-app">
    <!-- 顶部导航 -->
    <header class="app-bar">
      <button type="button" class="back-btn" aria-label="返回" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span class="app-title">充值</span>
      <span class="app-right"></span>
    </header>

    <main class="recharge-body">
      <!-- 充值金额 -->
      <section class="amount-card">
        <p class="section-label">充值金额</p>
        <div class="amount-input-row">
          <span class="currency">¥</span>
          <input
            class="amount-input"
            type="text"
            inputmode="decimal"
            placeholder="请输入充值金额"
            :value="amountText"
            @input="onAmountInput"
          />
        </div>
        <div class="quick-list">
          <button
            v-for="item in quickAmounts"
            :key="item"
            type="button"
            class="quick-item"
            :class="{ active: isQuick(item) }"
            @click="selectQuick(item)"
          >
            ¥{{ item }}
          </button>
        </div>
        <p class="amount-tip">单笔充值 ¥0.01 ~ ¥{{ formatAmount(MAX_AMOUNT) }}，请确认金额后再付款</p>
        <p v-if="errMsg" class="error-text">{{ errMsg }}</p>
      </section>

      <!-- 支付方式 -->
      <section class="pay-card">
        <p class="section-label">支付方式</p>
        <label
          v-for="item in payChannels"
          :key="item.id"
          class="pay-item"
          :class="{ active: channel === item.id }"
        >
          <input v-model="channel" type="radio" name="pay-channel" :value="item.id" />
          <span class="pay-logo" aria-hidden="true">
            <svg v-if="item.id === 'wechat'" viewBox="0 0 24 24" fill="none">
              <path
                d="M9.2 4C5.7 4 3 6.2 3 9c0 2.6 2.3 4.8 5.5 5.3l-.3 1.5c-.1.5.5.9 1 .6l1.9-1.1c.6.1 1.1.2 1.7.2"
                stroke="#22c55e"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M14.8 6.2C18.9 6.2 22 8.3 22 11.1c0 2.7-2.9 4.9-6.7 5.3l-1.5.9a.5.5 0 0 1-.7-.4l-.2-1.1c-3-.8-4.8-2.5-4.8-4.6.1-2.9 3.3-5 8.7-5z"
                stroke="#22c55e"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
            </svg>
            <svg v-else-if="item.id === 'alipay'" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#2563eb" stroke-width="1.6" />
              <path
                d="M7.5 11.5c1.2-3 3.4-5.5 6.2-6.2 1-.2 1.8.3 2 1.2.3 1.2-.8 2.6-2.2 3.6-1.6 1.1-3.6 1.9-5.8 2.2-1.1.1-1.4-.6-.2-.8z"
                stroke="#2563eb"
                stroke-width="1.2"
              />
              <path d="M4.5 14c3 .8 6.4 1.6 9.4.9 2.5-.6 4.4-1.8 5.4-3.3" stroke="#2563eb" stroke-width="1.2" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="#f59e0b" stroke-width="1.6" />
              <path d="M3 10h18" stroke="#f59e0b" stroke-width="1.6" />
              <path d="M7 15h4" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </span>
          <span class="pay-name">{{ item.name }}</span>
          <span v-if="item.desc" class="pay-desc">{{ item.desc }}</span>
          <span class="radio-dot" aria-hidden="true"></span>
        </label>
      </section>

      <!-- 说明 -->
      <p class="recharge-tip">模拟支付场景：点击「立即充值」后金额到账智运宝账户可用余额，并实时同步账户页。</p>
    </main>

    <!-- 底部操作栏 -->
    <footer class="action-bar">
      <button
        type="button"
        class="submit-btn"
        :disabled="submitting || successAmount > 0"
        @click="submit"
      >
        {{ submitting ? '充值中…' : '立即充值' }}
      </button>
    </footer>

    <!-- 充值成功弹层 -->
    <Transition name="fade">
      <div v-if="successAmount > 0" class="success-mask">
        <div class="success-card">
          <span class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 13.6-3.4-3.4 1.2-1.2 2.2 2.2 4.8-4.8 1.2 1.3-6 5.9z" fill="currentColor" />
            </svg>
          </span>
          <h2 class="success-title">充值成功</h2>
          <p class="success-amount">¥ {{ formatAmount(successAmount) }}</p>
          <p class="success-tip">已到账智运宝账户可用余额</p>
          <button type="button" class="success-btn" @click="done">完成</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.recharge-app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: $bg-page;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.06);
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

/* ===== 主体 ===== */
.recharge-body {
  padding: $spacing-md $spacing-md 120px;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.section-label {
  margin-bottom: $spacing-md;
  font-size: $font-size-sm;
  font-weight: 600;
  color: $text-primary;
}

/* 金额卡 */
.amount-card {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.amount-input-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  border-bottom: 1px solid $border-color;
  padding-bottom: $spacing-sm;
}

.currency {
  font-size: 26px;
  font-weight: 700;
  color: $text-primary;
}

.amount-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 30px;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    font-size: 20px;
    font-weight: 400;
    color: $text-muted;
  }
}

.quick-list {
  margin-top: $spacing-md;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.quick-item {
  height: 34px;
  border: 1px solid $border-color;
  border-radius: $radius-full;
  background: $bg-card;
  font-size: $font-size-sm;
  color: $text-primary;
  transition: $transition-base;

  &.active {
    border-color: $color-primary;
    background: rgba($color-primary, 0.08);
    color: $color-primary;
    font-weight: 600;
  }

  &:active {
    opacity: 0.8;
  }
}

.amount-tip {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  color: $text-muted;
}

.error-text {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  color: $color-danger;
}

/* 支付方式卡 */
.pay-card {
  padding: $spacing-md $spacing-lg $spacing-sm;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.pay-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm 0 $spacing-sm $spacing-xs;
  cursor: pointer;

  & + & {
    border-top: 1px solid $border-color;
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
}

.pay-logo {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $bg-page;

  svg {
    width: 24px;
    height: 24px;
  }
}

.pay-name {
  font-size: $font-size-base;
  color: $text-primary;
}

.pay-desc {
  margin-left: 2px;
  font-size: $font-size-xs;
  color: $text-muted;
}

.radio-dot {
  margin-left: auto;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 2px solid $border-color;
  border-radius: 50%;
  transition: $transition-base;

  .pay-item.active & {
    border-color: $color-primary;
    background: radial-gradient(circle, $color-primary 0 5px, transparent 6px);
  }
}

.recharge-tip {
  padding: 0 $spacing-xs;
  font-size: $font-size-xs;
  color: $text-muted;
  line-height: 1.7;
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

.submit-btn {
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

  &:disabled {
    opacity: 0.6;
    transform: none;
    box-shadow: none;
  }
}

/* ===== 成功弹层 ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.success-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
}

.success-card {
  width: 300px;
  padding: $spacing-xl $spacing-lg $spacing-lg;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: $bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
}

.success-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba($color-success, 0.12);
  color: $color-success;

  svg {
    width: 40px;
    height: 40px;
  }
}

.success-title {
  margin-top: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 700;
  color: $text-primary;
}

.success-amount {
  margin-top: $spacing-sm;
  font-size: 30px;
  font-weight: 700;
  color: $text-primary;
  font-variant-numeric: tabular-nums;
}

.success-tip {
  margin-top: $spacing-sm;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.success-btn {
  width: 100%;
  height: 44px;
  margin-top: $spacing-lg;
  border: none;
  border-radius: $radius-full;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  font-size: $font-size-base;
  font-weight: 600;
  transition: $transition-base;

  &:active {
    opacity: 0.85;
  }
}
</style>
