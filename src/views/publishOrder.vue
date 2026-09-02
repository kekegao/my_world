<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { publishOrder } from '@/api/modules/order'

const router = useRouter()
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

/** 返回我的订单列表 */
function goOrderList() {
  router.push('/publishOrderList')
}

const goodsTypeOptions = ['建材', '钢铁', '煤炭', '其他']

const form = reactive({
  // 货物信息kkk
  goodsType: '',
  goodsTypeCustom: '',
  goodsDescription: '',
  goodsWeight: '',
  transportMoney: '',
  // 发货地址
  shipperProvince: '',
  shipperCity: '',
  shipperArea: '',
  shipperAddress: '',
  // 收货地址
  carrierProvince: '',
  carrierCity: '',
  carrierArea: '',
  carrierAddress: '',
  // 货主信息（登录后自动带出，可修改）
  shipperUserId: '',
  shipperUserName: '',
  shipperName: '',
  shipperMobile: '',
  // 承运方信息（选填）
  carrierUserId: '',
  carrierUserName: '',
  carrierName: '',
  carrierMobile: '',
})

/** 登录成功后把用户信息写入 localStorage，这里自动带出货主信息 */
function loadUserInfo() {
  try {
    const raw = localStorage.getItem('userInfo')
    if (!raw) return
    const info = JSON.parse(raw) as Record<string, unknown>
    const str = (v: unknown) => (v == null ? '' : String(v))
    form.shipperUserId = str(info.shipperUserId ?? info.userId)
    form.shipperUserName = str(info.shipperUserName ?? info.username ?? info.realName)
    form.shipperName = str(info.shipperName ?? info.realName)
    form.shipperMobile = str(info.shipperMobile ?? info.mobile)
  } catch {
    // 忽略解析失败
  }
}

onMounted(loadUserInfo)

/** 从后端返回中提取提示信息，兼容不同返回结构 */
function getErrorMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { msg?: string; message?: string; detail?: string } }
    msg?: string
    message?: string
  }
  return e?.response?.data?.msg || e?.response?.data?.message || e?.response?.data?.detail || e?.msg || e?.message || '请求失败'
}

/** 判断后端返回是否表示成功，兼容 code / success 两种结构 */
function isSuccess(res: unknown): boolean {
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>
    if ('code' in r) {
      const code = r.code
      return code === 200 || code === 0 || code === '200' || code === '0' || code === '0000'
    }
    if ('success' in r) return r.success === true
  }
  return true
}

function getGoodsType(): string {
  return form.goodsType === '其他' ? form.goodsTypeCustom.trim() : form.goodsType
}

function validate(): boolean {
  const g = getGoodsType()
  if (!g) {
    errorMsg.value = '请选择或填写物品类型'
    return false
  }
  if (!form.goodsDescription.trim()) {
    errorMsg.value = '请输入物品描述'
    return false
  }
  const weight = Number(form.goodsWeight)
  if (!form.goodsWeight || Number.isNaN(weight) || weight <= 0) {
    errorMsg.value = '请输入正确的物品重量'
    return false
  }
  const transportMoney = Number(form.transportMoney)
  if (form.transportMoney && (Number.isNaN(transportMoney) || transportMoney < 0)) {
    errorMsg.value = '请输入正确的运费金额'
    return false
  }
  if (!form.shipperProvince.trim() || !form.shipperCity.trim() || !form.shipperArea.trim() || !form.shipperAddress.trim()) {
    errorMsg.value = '请完整填写发货地址'
    return false
  }
  if (!form.carrierProvince.trim() || !form.carrierCity.trim() || !form.carrierArea.trim() || !form.carrierAddress.trim()) {
    errorMsg.value = '请完整填写收货地址'
    return false
  }
  if (!form.shipperName.trim()) {
    errorMsg.value = '请输入货主名称'
    return false
  }
  if (!/^1\d{10}$/.test(form.shipperMobile.trim())) {
    errorMsg.value = '请输入正确的货主手机号'
    return false
  }
  return true
}

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''
  if (!validate()) return

  loading.value = true
  try {
    const res = await publishOrder({
      shipperUserId: form.shipperUserId || undefined,
      shipperUserName: form.shipperUserName.trim() || undefined,
      shipperName: form.shipperName.trim(),
      shipperMobile: form.shipperMobile.trim(),
      carrierUserId: form.carrierUserId || undefined,
      carrierUserName: form.carrierUserName.trim() || undefined,
      carrierName: form.carrierName.trim() || undefined,
      carrierMobile: form.carrierMobile.trim() || undefined,
      goodsType: getGoodsType(),
      goodsDescription: form.goodsDescription.trim(),
      goodsWeight: Number(form.goodsWeight),
      transportMoney: form.transportMoney ? Number(form.transportMoney) : undefined,
      shipperProvince: form.shipperProvince.trim(),
      shipperCity: form.shipperCity.trim(),
      shipperArea: form.shipperArea.trim(),
      shipperAddress: form.shipperAddress.trim(),
      carrierProvince: form.carrierProvince.trim(),
      carrierCity: form.carrierCity.trim(),
      carrierArea: form.carrierArea.trim(),
      carrierAddress: form.carrierAddress.trim(),
    })
    // 后端以 HTTP 200 返回业务失败（如 code=500 可用余额不足）时不视为成功
    if (!isSuccess(res)) {
      errorMsg.value = getErrorMessage(res) || '发布失败'
      return
    }
    successMsg.value = '订单发布成功'
    // 发布成功后清空货物与地址信息，保留货主信息
    form.goodsType = ''
    form.goodsTypeCustom = ''
    form.goodsDescription = ''
    form.goodsWeight = ''
    form.transportMoney = ''
    form.shipperProvince = ''
    form.shipperCity = ''
    form.shipperArea = ''
    form.shipperAddress = ''
    form.carrierProvince = ''
    form.carrierCity = ''
    form.carrierArea = ''
    form.carrierAddress = ''
  } catch (err) {
    errorMsg.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="order-app">
    <!-- 顶部导航 -->
    <header class="top-bar">
      <button type="button" class="back-btn" aria-label="返回" @click="goOrderList">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <span class="top-title">发布订单</span>
      <span class="top-right"></span>
    </header>

    <!-- 表单主体 -->
    <form class="publish-body" @submit.prevent="handleSubmit">
      <!-- 货物信息 -->
      <section class="form-card">
        <h3 class="card-title">
          <span>货物信息</span>
          <small>填写货物类型、重量与运费</small>
        </h3>

        <div class="form-field">
          <span class="field-label">物品类型</span>
          <div class="type-chips">
            <button
              v-for="opt in goodsTypeOptions"
              :key="opt"
              type="button"
              class="type-chip"
              :class="{ active: form.goodsType === opt }"
              @click="form.goodsType = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div v-if="form.goodsType === '其他'" class="form-field">
          <span class="field-label">自定义物品类型</span>
          <input
            v-model="form.goodsTypeCustom"
            class="form-input"
            type="text"
            maxlength="20"
            placeholder="请输入物品类型"
          />
        </div>

        <div class="half-grid">
          <div class="form-field">
            <span class="field-label">物品重量</span>
            <div class="input-box">
              <input
                v-model="form.goodsWeight"
                class="form-input"
                type="number"
                min="0"
                step="0.1"
                inputmode="decimal"
                placeholder="0"
              />
              <span class="input-suffix">吨</span>
            </div>
          </div>
          <div class="form-field">
            <span class="field-label">运费</span>
            <div class="input-box">
              <input
                v-model="form.transportMoney"
                class="form-input"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                placeholder="0"
              />
              <span class="input-suffix">元</span>
            </div>
          </div>
        </div>

        <div class="form-field">
          <span class="field-label">物品描述</span>
          <textarea
            v-model="form.goodsDescription"
            class="form-input form-textarea"
            rows="3"
            maxlength="200"
            placeholder="请描述货物情况，如品类、数量、包装等"
          ></textarea>
        </div>
      </section>

      <!-- 发货地址 -->
      <section class="form-card">
        <h3 class="card-title">
          <span>发货地址</span>
          <small>货物从哪里发出</small>
        </h3>
        <div class="region-grid">
          <div class="form-field">
            <span class="field-label">省份</span>
            <input v-model="form.shipperProvince" class="form-input" type="text" maxlength="20" placeholder="广东省" />
          </div>
          <div class="form-field">
            <span class="field-label">城市</span>
            <input v-model="form.shipperCity" class="form-input" type="text" maxlength="20" placeholder="深圳市" />
          </div>
          <div class="form-field">
            <span class="field-label">区县</span>
            <input v-model="form.shipperArea" class="form-input" type="text" maxlength="20" placeholder="南山区" />
          </div>
        </div>
        <div class="form-field">
          <span class="field-label">详细地址</span>
          <input
            v-model="form.shipperAddress"
            class="form-input"
            type="text"
            maxlength="100"
            placeholder="街道、门牌号、园区等"
          />
        </div>
      </section>

      <!-- 收货地址 -->
      <section class="form-card">
        <h3 class="card-title">
          <span>收货地址</span>
          <small>货物要送到哪里</small>
        </h3>
        <div class="region-grid">
          <div class="form-field">
            <span class="field-label">省份</span>
            <input v-model="form.carrierProvince" class="form-input" type="text" maxlength="20" placeholder="广东省" />
          </div>
          <div class="form-field">
            <span class="field-label">城市</span>
            <input v-model="form.carrierCity" class="form-input" type="text" maxlength="20" placeholder="深圳市" />
          </div>
          <div class="form-field">
            <span class="field-label">区县</span>
            <input v-model="form.carrierArea" class="form-input" type="text" maxlength="20" placeholder="南山区" />
          </div>
        </div>
        <div class="form-field">
          <span class="field-label">详细地址</span>
          <input
            v-model="form.carrierAddress"
            class="form-input"
            type="text"
            maxlength="100"
            placeholder="街道、门牌号、园区等"
          />
        </div>
      </section>

      <!-- 货主信息 -->
      <section class="form-card">
        <h3 class="card-title">
          <span>货主信息</span>
          <small>已自动带出，可修改</small>
        </h3>
        <div class="half-grid">
          <div class="form-field">
            <span class="field-label">货主名称</span>
            <input v-model="form.shipperName" class="form-input" type="text" maxlength="30" placeholder="货主名称" />
          </div>
          <div class="form-field">
            <span class="field-label">货主手机号</span>
            <input
              v-model="form.shipperMobile"
              class="form-input"
              type="tel"
              inputmode="numeric"
              maxlength="11"
              placeholder="货主手机号"
            />
          </div>
        </div>
      </section>

      <!-- 承运方信息（选填） -->
      <section class="form-card">
        <h3 class="card-title">
          <span>承运方信息</span>
          <small>选填</small>
        </h3>
        <div class="half-grid">
          <div class="form-field">
            <span class="field-label">承运方名称</span>
            <input v-model="form.carrierName" class="form-input" type="text" maxlength="30" placeholder="承运方名称" />
          </div>
          <div class="form-field">
            <span class="field-label">承运方手机号</span>
            <input
              v-model="form.carrierMobile"
              class="form-input"
              type="tel"
              inputmode="numeric"
              maxlength="11"
              placeholder="承运方手机号"
            />
          </div>
        </div>
      </section>

      <!-- 提示信息 -->
      <div v-if="errorMsg" class="form-banner error">{{ errorMsg }}</div>
      <div v-if="successMsg" class="form-banner success">
        {{ successMsg }}
        <button type="button" class="banner-link" @click="goOrderList">去查看我的订单 ›</button>
      </div>

      <!-- 底部提交栏 -->
      <footer class="submit-bar">
        <button class="submit-btn" type="submit" :disabled="loading">
          {{ loading ? '发布中…' : '发布订单' }}
        </button>
      </footer>
    </form>
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

/* ===== 表单主体 ===== */
.publish-body {
  padding: $spacing-md $spacing-md 96px;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.form-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-md;
  box-shadow: $shadow-sm;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.card-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  position: relative;
  padding-left: 12px;

  span {
    font-size: $font-size-base;
    font-weight: 700;
    color: $text-primary;
  }

  small {
    font-size: $font-size-xs;
    color: $text-muted;
  }

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

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field-label {
  font-size: $font-size-sm;
  color: $text-secondary;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 $spacing-md;
  border: 1px solid transparent;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: $text-primary;
  background: $bg-page;
  transition: $transition-base;
  box-sizing: border-box;

  &::placeholder {
    color: $text-muted;
  }

  &:focus {
    outline: none;
    background: $bg-card;
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.12);
  }
}

.form-textarea {
  height: auto;
  padding: $spacing-sm $spacing-md;
  resize: none;
  font-family: inherit;
  line-height: 1.6;
}

/* 物品类型选择 */
.type-chips {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;
}

.type-chip {
  height: 40px;
  border-radius: $radius-full;
  background: $bg-page;
  color: $text-secondary;
  font-size: $font-size-sm;
  transition: $transition-base;

  &.active {
    background: rgba($color-primary, 0.12);
    color: $color-primary;
    font-weight: 600;
  }
}

/* 双列 / 省市区 */
.half-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.input-box {
  position: relative;

  .form-input {
    padding-right: 44px;
  }
}

.input-suffix {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: $font-size-sm;
  color: $text-muted;
}

/* 提示条 */
.form-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  line-height: 1.5;

  &.error {
    color: $color-danger;
    background: #fef2f2;
  }

  &.success {
    color: $color-success;
    background: #f0fdf4;
  }
}

.banner-link {
  flex-shrink: 0;
  color: $color-primary;
  font-weight: 600;
}

/* ===== 底部提交栏 ===== */
.submit-bar {
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
  background: linear-gradient(135deg, $color-primary 0%, $color-primary-hover 100%);
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
</style>
