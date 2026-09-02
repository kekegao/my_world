<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login, register } from '@/api/modules/auth'

const route = useRoute()
const router = useRouter()

type Mode = 'login' | 'register'

const mode = ref<Mode>('login')
const loading = ref(false)
const errorMsg = ref('')

const loginForm = reactive({
  mobile: '',
  password: '',
})

const registerForm = reactive({
  userType: 1 as number,
  realName: '',
  mobile: '',
  password: '',
  confirmPassword: '',
})

const userTypeOptions = [
  { value: 1, label: '货主' },
  { value: 2, label: '司机' },
]

function switchMode(next: Mode) {
  mode.value = next
  errorMsg.value = ''
}

/** 从后端返回中提取提示信息，兼容不同返回结构 */
function getErrorMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { msg?: string; message?: string; detail?: string } }
    msg?: string
    message?: string
  }
  return e?.response?.data?.msg || e?.response?.data?.message || e?.response?.data?.detail || e?.msg || e?.message || '请求失败'
}

/** 深度查找返回数据中的 token，兼容不同字段名与嵌套层级 */
function findToken(obj: unknown, depth = 0): string {
  if (!obj || typeof obj !== 'object' || depth > 3) return ''
  const keys = ['token', 'accessToken', 'access_token', 'tokenValue', 'authToken', 'jwt']
  for (const key of keys) {
    const v = (obj as Record<string, unknown>)[key]
    if (typeof v === 'string' && v) return v
  }
  for (const value of Object.values(obj as Record<string, unknown>)) {
    const found = findToken(value, depth + 1)
    if (found) return found
  }
  return ''
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

async function handleLogin() {
  errorMsg.value = ''
  if (!loginForm.mobile.trim()) {
    errorMsg.value = '请输入账号'
    return
  }
  if (!loginForm.password) {
    errorMsg.value = '请输入密码'
    return
  }

  loading.value = true
  try {
    const res = await login({
      mobile: loginForm.mobile.trim(),
      password: loginForm.password,
    })
    // 后端在 HTTP 200 下也可能返回业务失败（如 code=500），此时不跳转
    if (!isSuccess(res)) {
      errorMsg.value = getErrorMessage(res) || '登录失败'
      return
    }
    // 深度提取 token（兼容不同字段名/嵌套层级），不存在也不阻塞跳转
    const token = findToken(res)
    if (token) {
      localStorage.setItem('token', token)
    }
    // 保存用户信息，便于发布订单等页面自动带出
    const data = (res as { data?: unknown })?.data
    const userInfo = data && typeof data === 'object' ? data : res
    if (userInfo && typeof userInfo === 'object') {
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    }
    // 跳转到来源页面，默认进入发布订单页
    const redirect = (route.query.redirect as string) || '/publishOrderList'
    router.push(redirect)
  } catch (err) {
    errorMsg.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  errorMsg.value = ''
  if (!registerForm.realName.trim()) {
    errorMsg.value = '请输入真实姓名'
    return
  }
  if (!/^1\d{10}$/.test(registerForm.mobile.trim())) {
    errorMsg.value = '请输入正确的 11 位手机号'
    return
  }
  if (!registerForm.password) {
    errorMsg.value = '请输入密码'
    return
  }
  if (registerForm.password.length < 6) {
    errorMsg.value = '密码长度不能少于 6 位'
    return
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    await register({
      userType: registerForm.userType,
      realName: registerForm.realName.trim(),
      mobile: registerForm.mobile.trim(),
      password: registerForm.password,
    })
    // 注册成功后切换回登录页
    switchMode('login')
    loginForm.mobile = registerForm.mobile.trim()
    loginForm.password = ''
    alert('注册成功，请登录')
  } catch (err) {
    errorMsg.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="card-title">{{ mode === 'login' ? '欢迎登录' : '注册账号' }}</h1>
      <p class="card-subtitle">
        {{ mode === 'login' ? '请输入账号和密码登录系统' : '请填写以下信息完成注册' }}
      </p>

      <form class="card-form" @submit.prevent="mode === 'login' ? handleLogin() : handleRegister()">
        <!-- 登录 -->
        <template v-if="mode === 'login'">
          <div class="form-item">
            <label for="login-mobile">账号</label>
            <input
              id="login-mobile"
              v-model="loginForm.mobile"
              class="form-input"
              type="text"
              maxlength="11"
              placeholder="请输入手机号 / 账号"
              autocomplete="username"
            />
          </div>
          <div class="form-item">
            <label for="login-password">密码</label>
            <input
              id="login-password"
              v-model="loginForm.password"
              class="form-input"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>
        </template>

        <!-- 注册 -->
        <template v-else>
          <div class="form-item">
            <label>用户类型</label>
            <div class="user-type-group">
              <label
                v-for="opt in userTypeOptions"
                :key="opt.value"
                class="user-type-option"
                :class="{ active: registerForm.userType === opt.value }"
              >
                <input v-model="registerForm.userType" type="radio" name="userType" :value="opt.value" />
                {{ opt.label }}
              </label>
            </div>
          </div>
          <div class="form-item">
            <label for="register-name">真实姓名</label>
            <input
              id="register-name"
              v-model="registerForm.realName"
              class="form-input"
              type="text"
              maxlength="20"
              placeholder="请输入真实姓名"
            />
          </div>
          <div class="form-item">
            <label for="register-mobile">手机号</label>
            <input
              id="register-mobile"
              v-model="registerForm.mobile"
              class="form-input"
              type="text"
              maxlength="11"
              placeholder="请输入 11 位手机号"
              autocomplete="username"
            />
          </div>
          <div class="form-item">
            <label for="register-password">密码</label>
            <input
              id="register-password"
              v-model="registerForm.password"
              class="form-input"
              type="password"
              maxlength="20"
              placeholder="请输入密码（至少 6 位）"
              autocomplete="new-password"
            />
          </div>
          <div class="form-item">
            <label for="register-confirm">确认密码</label>
            <input
              id="register-confirm"
              v-model="registerForm.confirmPassword"
              class="form-input"
              type="password"
              maxlength="20"
              placeholder="请再次输入密码"
              autocomplete="new-password"
            />
          </div>
        </template>

        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>

        <button class="submit-btn" type="submit" :disabled="loading">
          {{ loading ? (mode === 'login' ? '登录中...' : '注册中...') : mode === 'login' ? '登 录' : '注 册' }}
        </button>
      </form>

      <p class="switch-tip">
        <template v-if="mode === 'login'">
          还没有账号？
          <a class="switch-link" @click="switchMode('register')">立即注册</a>
        </template>
        <template v-else>
          已有账号？
          <a class="switch-link" @click="switchMode('login')">去登录</a>
        </template>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  background: linear-gradient(135deg, #eff6ff 0%, #f3f4f6 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-2xl $spacing-xl;
  box-shadow: $shadow-lg;
}

.card-title {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $text-primary;
  text-align: center;
  margin-bottom: $spacing-xs;
}

.card-subtitle {
  font-size: $font-size-sm;
  color: $text-secondary;
  text-align: center;
  margin-bottom: $spacing-xl;
}

.card-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
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
  height: 42px;
  padding: 0 $spacing-md;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: $font-size-base;
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

.user-type-group {
  display: flex;
  gap: $spacing-sm;
}

.user-type-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  height: 42px;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: $text-secondary;
  cursor: pointer;
  transition: $transition-base;

  input {
    display: none;
  }

  &.active {
    border-color: $color-primary;
    color: $color-primary;
    background: rgba($color-primary, 0.08);
    font-weight: 600;
  }
}

.form-error {
  font-size: $font-size-sm;
  color: $color-danger;
  text-align: center;
}

.submit-btn {
  width: 100%;
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

.switch-tip {
  margin-top: $spacing-lg;
  text-align: center;
  font-size: $font-size-sm;
  color: $text-secondary;
}

.switch-link {
  color: $color-primary;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    color: $color-primary-hover;
    text-decoration: underline;
  }
}
</style>
