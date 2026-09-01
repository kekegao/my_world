<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { publishOrder } from '@/api/modules/order'

const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const goodsTypeOptions = ['建材', '钢铁', '煤炭', '其他']

const form = reactive({
  // 货物信息
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
  <div class="publish-page page-container">
    <div class="page-header">
      <h2>发布订单</h2>
      <p>填写货物与运输信息，快速发布物流订单</p>
    </div>

    <form class="publish-card" @submit.prevent="handleSubmit">
      <!-- 货物信息 -->
      <section class="form-section">
        <h3 class="section-title">货物信息</h3>
        <div class="form-grid form-grid-3">
          <div class="form-item">
            <label>物品类型</label>
            <select v-model="form.goodsType" class="form-input">
              <option value="" disabled>请选择物品类型</option>
              <option v-for="opt in goodsTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input
              v-if="form.goodsType === '其他'"
              v-model="form.goodsTypeCustom"
              class="form-input"
              type="text"
              maxlength="20"
              placeholder="请输入物品类型"
            />
          </div>
          <div class="form-item">
            <label>物品重量（吨）</label>
            <input
              v-model="form.goodsWeight"
              class="form-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="请输入物品重量"
            />
          </div>
          <div class="form-item">
            <label>运费（元）</label>
            <input
              v-model="form.transportMoney"
              class="form-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="请输入运费"
            />
          </div>
        </div>
        <div class="form-item">
          <label>物品描述</label>
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
      <section class="form-section">
        <h3 class="section-title">发货地址</h3>
        <div class="form-grid form-grid-3">
          <div class="form-item">
            <label>省份</label>
            <input v-model="form.shipperProvince" class="form-input" type="text" maxlength="20" placeholder="如：广东省" />
          </div>
          <div class="form-item">
            <label>城市</label>
            <input v-model="form.shipperCity" class="form-input" type="text" maxlength="20" placeholder="如：深圳市" />
          </div>
          <div class="form-item">
            <label>区县</label>
            <input v-model="form.shipperArea" class="form-input" type="text" maxlength="20" placeholder="如：南山区" />
          </div>
        </div>
        <div class="form-item">
          <label>详细地址</label>
          <input
            v-model="form.shipperAddress"
            class="form-input"
            type="text"
            maxlength="100"
            placeholder="请输入详细发货地址"
          />
        </div>
      </section>

      <!-- 收货地址 -->
      <section class="form-section">
        <h3 class="section-title">收货地址</h3>
        <div class="form-grid form-grid-3">
          <div class="form-item">
            <label>省份</label>
            <input v-model="form.carrierProvince" class="form-input" type="text" maxlength="20" placeholder="如：广东省" />
          </div>
          <div class="form-item">
            <label>城市</label>
            <input v-model="form.carrierCity" class="form-input" type="text" maxlength="20" placeholder="如：深圳市" />
          </div>
          <div class="form-item">
            <label>区县</label>
            <input v-model="form.carrierArea" class="form-input" type="text" maxlength="20" placeholder="如：南山区" />
          </div>
        </div>
        <div class="form-item">
          <label>详细地址</label>
          <input
            v-model="form.carrierAddress"
            class="form-input"
            type="text"
            maxlength="100"
            placeholder="请输入详细收货地址"
          />
        </div>
      </section>

      <!-- 货主信息 -->
      <section class="form-section">
        <h3 class="section-title">货主信息</h3>
        <div class="form-grid">
          <div class="form-item">
            <label>货主名称</label>
            <input v-model="form.shipperName" class="form-input" type="text" maxlength="30" placeholder="货主名称" />
          </div>
          <div class="form-item">
            <label>货主手机号</label>
            <input v-model="form.shipperMobile" class="form-input" type="text" maxlength="11" placeholder="货主手机号" />
          </div>
        </div>
      </section>

      <!-- 承运方信息（选填） -->
      <section class="form-section">
        <h3 class="section-title">承运方信息（选填）</h3>
        <div class="form-grid">
          <div class="form-item">
            <label>承运方名称</label>
            <input v-model="form.carrierName" class="form-input" type="text" maxlength="30" placeholder="承运方名称" />
          </div>
          <div class="form-item">
            <label>承运方手机号</label>
            <input v-model="form.carrierMobile" class="form-input" type="text" maxlength="11" placeholder="承运方手机号" />
          </div>
        </div>
      </section>

      <p v-if="errorMsg" class="form-tip error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="form-tip success">{{ successMsg }}</p>

      <div class="form-actions">
        <button class="submit-btn" type="submit" :disabled="loading">
          {{ loading ? '发布中...' : '发布订单' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.publish-page {
  max-width: 720px;
  padding-bottom: $spacing-2xl;
}

.page-header {
  margin-bottom: $spacing-lg;

  h2 {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $text-primary;
  }

  p {
    margin-top: $spacing-xs;
    font-size: $font-size-sm;
    color: $text-secondary;
  }
}

.publish-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.form-section {
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.section-title {
  font-size: $font-size-base;
  font-weight: 600;
  color: $text-primary;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
}

.form-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  label {
    font-size: $font-size-sm;
    color: $text-primary;
  }
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: $text-primary;
  background: $bg-card;
  transition: $transition-base;
  box-sizing: border-box;

  &::placeholder {
    color: $text-muted;
  }

  &:focus {
    outline: none;
    border-color: $color-primary;
    box-shadow: 0 0 0 3px rgba($color-primary, 0.15);
  }
}

.form-textarea {
  height: auto;
  padding: $spacing-sm $spacing-md;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
}

.form-tip {
  font-size: $font-size-sm;
  text-align: center;
  border-radius: $radius-md;
  padding: $spacing-sm $spacing-md;

  &.error {
    color: $color-danger;
    background: #fef2f2;
  }

  &.success {
    color: $color-success;
    background: #f0fdf4;
  }
}

.form-actions {
  text-align: center;
}

.submit-btn {
  min-width: 200px;
  height: 44px;
  border: none;
  border-radius: $radius-md;
  background: $color-primary;
  color: #fff;
  font-size: $font-size-base;
  font-weight: 600;
  letter-spacing: 4px;
  cursor: pointer;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: $color-primary-hover;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@media (max-width: 640px) {
  .form-grid,
  .form-grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
