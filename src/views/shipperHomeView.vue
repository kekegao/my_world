<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

/** 登录用户信息（登录后由 login.vue 写入 localStorage） */
const userInfo = ref<Record<string, unknown>>({})
try {
  userInfo.value = JSON.parse(localStorage.getItem('userInfo') || '{}') as Record<string, unknown>
} catch {
  userInfo.value = {}
}

/** 欢迎语中展示的名称：真实姓名 > 用户名 > 脱敏手机号 */
const displayName = computed(() => {
  const u = userInfo.value
  const raw = String(u.realName || u.userName || u.mobile || '')
  const mobile = /^1\d{10}$/.test(raw) ? raw.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : raw
  return mobile || '尊敬的货主'
})

/** 跳转智运宝账户（充值 / 提现 / 资金托管） */
function goAccount() {
  router.push('/account')
}

/** 跳转我的运单（已发布订单列表） */
function goMyOrder() {
  router.push('/publishOrderList')
}

/** 跳转银行卡管理 */
function goBankList() {
  router.push('/bankList')
}

/** 跳转发布运单 */
function goPublishOrder() {
  router.push('/publishOrder')
}

/** 「功能建设中」轻提示 */
const tipVisible = ref(false)
let tipTimer: number | undefined
function showTip() {
  tipVisible.value = true
  window.clearTimeout(tipTimer)
  tipTimer = window.setTimeout(() => {
    tipVisible.value = false
  }, 1800)
}

onBeforeUnmount(() => window.clearTimeout(tipTimer))
</script>

<template>
  <div class="shipper-home-app">
    <!-- 顶部欢迎区 -->
    <header class="hero">
      <div class="hero-brand">
        <span class="hero-logo">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2.5 20 5.5v6c0 4.6-3.2 8.2-8 9.9-4.8-1.7-8-5.3-8-9.9v-6l8-3z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <path d="M8.5 12.2l2.3 2.3 4.7-4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="hero-title">智运宝 · 货主端</span>
      </div>
      <h1 class="hero-greet">你好，{{ displayName }}</h1>
      <p class="hero-sub">发布运单、托管运费，全程可视化跟踪</p>
    </header>

    <main class="home-body">
      <!-- 上半部分：核心功能大按钮 -->
      <section class="quick-section">
        <button type="button" class="quick-card quick-account" @click="goAccount">
          <span class="quick-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" stroke-width="1.6" />
              <path d="M2.5 9.5h19" stroke="currentColor" stroke-width="1.6" />
              <path d="M16 15h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <span class="quick-main">
            <b class="quick-name">智运宝</b>
            <small class="quick-desc">充值提现 · 运费托管</small>
          </span>
          <svg class="quick-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <button type="button" class="quick-card quick-order" @click="goMyOrder">
          <span class="quick-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.6" />
              <path d="M7 9h10M7 13h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              <circle cx="16.5" cy="15.5" r="2.5" stroke="currentColor" stroke-width="1.6" />
              <path d="M16.5 18v1M16.5 12v1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </span>
          <span class="quick-main">
            <b class="quick-name">我的运单</b>
            <small class="quick-desc">发布记录 · 运输进度</small>
          </span>
          <svg class="quick-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </section>

      <!-- 下半部分：我的服务宫格 -->
      <section class="service-section">
        <p class="service-title">我的服务</p>
        <div class="service-grid">
          <button type="button" class="service-item" @click="goBankList">
            <span class="service-icon service-bank">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2.5" y="5" width="19" height="14" rx="2" stroke="currentColor" stroke-width="1.6" />
                <path d="M2.5 10.5h19" stroke="currentColor" stroke-width="1.6" />
                <path d="M6.5 15h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </span>
            <span class="service-name">银行卡管理</span>
          </button>

          <button type="button" class="service-item" @click="goPublishOrder">
            <span class="service-icon service-publish">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </span>
            <span class="service-name">发布运单</span>
          </button>

          <button type="button" class="service-item" @click="showTip">
            <span class="service-icon service-msg">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V6z"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
                <path d="M8 9.5h8M8 13h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </span>
            <span class="service-name">我的消息</span>
          </button>

          <button type="button" class="service-item" @click="showTip">
            <span class="service-icon service-more">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
                <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </span>
            <span class="service-name">更多功能</span>
          </button>
        </div>
      </section>
    </main>

    <!-- 建设中轻提示 -->
    <Transition name="toast">
      <p v-if="tipVisible" class="build-tip">功能建设中，敬请期待</p>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.shipper-home-app {
  position: relative;
  max-width: 480px;
  margin: 0 auto;
  padding: $spacing-md;
  min-height: 100vh;
  background: $bg-page;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.06);
}

/* ===== 顶部欢迎区 ===== */
.hero {
  padding: 14px $spacing-lg $spacing-md;
  background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
  color: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
}

.hero-brand {
  display: inline-flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 4px 12px 4px 6px;
  border-radius: $radius-full;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(4px);
  font-size: $font-size-sm;
  font-weight: 600;
}

.hero-logo {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);

  svg {
    width: 14px;
    height: 14px;
  }
}

.hero-title {
  letter-spacing: 1px;
}

.hero-greet {
  margin-top: 14px;
  font-size: $font-size-xl;
  font-weight: 700;
  letter-spacing: 1px;
}

.hero-sub {
  margin-top: 6px;
  font-size: $font-size-sm;
  opacity: 0.92;
}

/* ===== 主体 ===== */
.home-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-md;
}

/* 上半：双功能大卡 */
.quick-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.quick-card {
  position: relative;
  padding: $spacing-lg $spacing-sm $spacing-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  border: none;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-md;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;

  &:active {
    transform: translateY(1px);
    box-shadow: $shadow-sm;
  }
}

.quick-icon {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-full;

  svg {
    width: 26px;
    height: 26px;
  }
}

.quick-account .quick-icon {
  background: rgba($color-primary, 0.12);
  color: $color-primary;
}

.quick-order .quick-icon {
  background: rgba($color-success, 0.12);
  color: #059669;
}

.quick-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.quick-name {
  font-size: $font-size-base;
  font-weight: 700;
}

.quick-desc {
  font-size: $font-size-xs;
  color: $text-muted;
}

.quick-arrow {
  display: none;
}

/* 下半：服务宫格 */
.service-section {
  padding: $spacing-lg $spacing-md;
  border-radius: $radius-lg;
  background: $bg-card;
  box-shadow: $shadow-sm;
}

.service-title {
  margin-bottom: $spacing-md;
  font-size: $font-size-sm;
  font-weight: 600;
  color: $text-primary;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-md $spacing-sm;
}

.service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: $text-primary;
  cursor: pointer;
  transition: $transition-base;

  &:active {
    opacity: 0.75;
  }
}

.service-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;

  svg {
    width: 24px;
    height: 24px;
  }
}

.service-bank {
  background: rgba($color-primary, 0.1);
  color: $color-primary;
}

.service-publish {
  background: rgba($color-success, 0.1);
  color: #059669;
}

.service-msg {
  background: rgba($color-warning, 0.12);
  color: $color-warning;
}

.service-more {
  background: rgba(#6b7280, 0.1);
  color: #6b7280;
}

.service-name {
  font-size: $font-size-xs;
  color: $text-secondary;
}

/* ===== 建设中提示 ===== */
.build-tip {
  position: fixed;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  z-index: 60;
  max-width: min(320px, 80vw);
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-full;
  background: rgba(31, 41, 55, 0.88);
  color: #fff;
  font-size: $font-size-sm;
  text-align: center;
  box-shadow: $shadow-lg;
  backdrop-filter: blur(4px);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
