<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  addFrozenRecord,
  formatAmount,
  loadAccountBalance,
  roundMoney,
  withdraw,
  type AccountBalance,
} from '@/utils/account'

const router = useRouter()

/** 当前余额（提现页进入时读取，可提现 = 可用余额） */
const balance = ref<AccountBalance>(loadAccountBalance())

/** 提现金额（字符串便于输入控制） */
const amountText = ref('')
/** 单笔提现限制（元） */
const MIN_AMOUNT = 1
const MAX_AMOUNT = 20000

/** 模拟绑定的到账银行卡 */
const bankCard = { bank: '招商银行', cardType: '储蓄卡', tail: '6821' }

/** 手续费（元，模拟免费）与到账时效 */
const FEE = 0
const ARRIVE_TEXT = '预计 2 小时内到账'

const submitting = ref(false)
const successAmount = ref(0)

/** 解析后的提现金额 */
const amountNum = computed(() => roundMoney(Number(amountText.value) || 0))

/** 可提现余额 */
const available = computed(() => balance.value.available)

/** 校验信息 */
const errMsg = computed(() => {
  if (!amountText.value) return ''
  if (amountNum.value < MIN_AMOUNT) return `提现金额不能低于 ¥${MIN_AMOUNT}`
  if (amountNum.value > MAX_AMOUNT) return `单笔提现金额不能超过 ¥${formatAmount(MAX_AMOUNT)}`
  if (amountNum.value > available.value) return '提现金额超出可提现余额'
  return ''
})

/** 实际到账金额（扣除手续费） */
const actualAmount = computed(() => roundMoney(amountNum.value - FEE))

/** 输入过滤：仅允许数字与一个小数点，最多两位小数 */
function onAmountInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const clean = raw.replace(/[^\d.]/g, '')
  const [intPart, decPart = ''] = clean.split('.')
  amountText.value = decPart !== '' ? `${intPart}.${decPart.slice(0, 2)}` : intPart
}

/** 一键填入全部可用余额 */
function fillAll() {
  amountText.value = String(roundMoney(available.value))
}

/** 模拟提交提现 */
async function submit() {
  if (errMsg.value || amountNum.value <= 0 || submitting.value) return
  submitting.value = true
  // 模拟请求耗时
  await new Promise((resolve) => setTimeout(resolve, 800))
  withdraw(amountNum.value)
  addFrozenRecord('提现冻结', amountNum.value)
  submitting.value = false
  successAmount.value = amountNum.value
}

/** 完成提现，返回账户页 */
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
  <div class="withdraw-app">
    <!-- 顶部导航 -->
    <header class="app-bar">
      <button type="button" class="back-btn" aria-label="返回" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span class="app-title">提现</span>
      <span class="app-right"></span>
    </header>

    <main class="withdraw-body">
      <!-- 可提现余额 -->
      <section class="balance-card">
        <p class="balance-label">可提现余额（元）</p>
        <p class="balance-num">
          <span class="balance-symbol">¥</span>
          {{ formatAmount(available) }}
        </p>
      </section>

      <!-- 提现金额 -->
      <section class="amount-card">
        <div class="amount-row">
          <span class="currency">¥</span>
          <input
            class="amount-input"
            type="text"
            inputmode="decimal"
            placeholder="请输入提现金额"
            :value="amountText"
            @input="onAmountInput"
          />
          <button type="button" class="all-btn" @click="fillAll">全部提现</button>
        </div>
        <p class="amount-tip">单笔提现 ¥{{ MIN_AMOUNT }} ~ ¥{{ formatAmount(MAX_AMOUNT) }}</p>
        <p v-if="errMsg" class="error-text">{{ errMsg }}</p>

        <!-- 费用预览 -->
        <div v-if="amountNum >= MIN_AMOUNT && !errMsg" class="fee-preview">
          <span>到账金额（手续费 ¥{{ formatAmount(FEE) }}）</span>
          <strong>¥ {{ formatAmount(actualAmount) }}</strong>
        </div>
      </section>

      <!-- 到账账户 -->
      <section class="account-card">
        <p class="section-label">到账账户</p>
        <div class="bank-item">
          <span class="bank-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="#f59e0b" stroke-width="1.6" />
              <path d="M3 10h18" stroke="#f59e0b" stroke-width="1.6" />
              <path d="M7 15h4" stroke="#f59e0b" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </span>
          <span class="bank-info">
            <b>{{ bankCard.bank }}（{{ bankCard.cardType }}）</b>
            <span>尾号 {{ bankCard.tail }}</span>
          </span>
          <span class="bank-tag">已绑定</span>
        </div>
        <p class="arrive-row">{{ ARRIVE_TEXT }} · 申请提交后资金将暂时冻结</p>
      </section>

      <!-- 规则说明 -->
      <p class="withdraw-tip">
        模拟提现场景：提交申请后，对应金额计入「冻结金额」，可在账户页冻结明细中查看；提现成功后自动回到账户页。
      </p>
    </main>

    <!-- 底部操作栏 -->
    <footer class="action-bar">
      <button
        type="button"
        class="submit-btn"
        :disabled="submitting || successAmount > 0"
        @click="submit"
      >
        {{ submitting ? '提交中…' : '确认提现' }}
      </button>
    </footer>

    <!-- 提现成功弹层 -->
    <Transition name="fade">
      <div v-if="successAmount > 0" class="success-mask">
        <div class="success-card">
          <span class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 13.6-3.4-3.4 1.2-1.2 2.2 2.2 4.8-4.8 1.2 1.3-6 5.9z" fill="currentColor" />
            </svg>
          </span>
          <h2 class="success-title">提现申请已提交</h2>
          <p class="success-amount">¥ {{ formatAmount(successAmount) }}</p>
          <p class="success-tip">
            款项已冻结，{{ ARRIVE_TEXT }}至{{ bankCard.bank }}（尾号 {{ bankCard.tail }}）
          </p>
          <button type="button" class="success-btn" @click="done">完成</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.withdraw-app {
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
.withdraw-body {
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

/* 可提现余额 */
.balance-card {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
  color: #fff;
  box-shadow: $shadow-md;
}

.balance-label {
  font-size: $font-size-sm;
  opacity: 0.92;
}

.balance-num {
  margin-top: $spacing-sm;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.balance-symbol {
  margin-right: 4px;
  font-size: $font-size-xl;
  font-weight: 600;
}

/* 提现金额卡 */
.amount-card {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.amount-row {
  display: flex;
  align-items: center;
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

.all-btn {
  flex-shrink: 0;
  height: 32px;
  padding: 0 $spacing-md;
  border: 1px solid rgba($color-primary, 0.4);
  border-radius: $radius-full;
  background: rgba($color-primary, 0.08);
  color: $color-primary;
  font-size: $font-size-sm;
  font-weight: 600;
  transition: $transition-base;

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

.fee-preview {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: $radius-md;
  background: $bg-page;
  font-size: $font-size-sm;
  color: $text-secondary;

  strong {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-primary;
    font-variant-numeric: tabular-nums;
  }
}

/* 到账账户卡 */
.account-card {
  padding: $spacing-lg;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.bank-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.bank-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: rgba($color-warning, 0.12);

  svg {
    width: 26px;
    height: 26px;
  }
}

.bank-info {
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

.bank-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: $radius-sm;
  background: rgba($color-success, 0.12);
  color: $color-success;
  font-size: $font-size-xs;
  font-weight: 600;
}

.arrive-row {
  margin-top: $spacing-md;
  padding-top: $spacing-sm;
  border-top: 1px dashed $border-color;
  font-size: $font-size-xs;
  color: $text-muted;
}

.withdraw-tip {
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
  line-height: 1.6;
  text-align: center;
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
