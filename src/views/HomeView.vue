<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from '@/components/HelloWorld.vue'
import { useCounter } from '@/composables/useCounter'
import { post } from '@/api/request'

const { count, doubleCount, increment, decrement, reset } = useCounter()

const loading = ref(false)
const response = ref<unknown>(null)
const errorMsg = ref('')

async function sendChat() {
  loading.value = true
  response.value = null
  errorMsg.value = ''
  try {
    // 如需传参，修改这里的请求体
    const data = await post('/api/amsBsmControl/chat', {})
    response.value = data
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '请求失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="home-page page-container">
    <section class="hero">
      <h2>欢迎来到 My World</h2>
      <p class="hero-desc">这是一个基于 Vue 3 + TypeScript + Vite 构建的前端框架。</p>
    </section>

    <section class="demo-section">
      <HelloWorld msg="Vue 3 + Vite + TypeScript" />

      <div class="card">
        <h3>计数器示例 (Pinia)</h3>
        <div class="counter-display">
          <span class="counter-value">{{ count }}</span>
          <span class="counter-label">当前值 × 2 = {{ doubleCount }}</span>
        </div>
        <div class="counter-actions">
          <button class="btn btn-primary" @click="increment">+ 增加</button>
          <button class="btn" @click="decrement" :disabled="count <= 0">- 减少</button>
          <button class="btn btn-danger" @click="reset">重置</button>
        </div>
      </div>

      <div class="card">
        <h3>接口请求示例</h3>
        <button class="btn btn-primary" @click="sendChat" :disabled="loading">
          {{ loading ? '请求中...' : '请求 /chatControl/chat' }}
        </button>

        <div v-if="response" class="result-box success">
          <pre>{{ JSON.stringify(response, null, 2) }}</pre>
        </div>
        <div v-if="errorMsg" class="result-box error">{{ errorMsg }}</div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.hero {
  text-align: center;
  padding: $spacing-2xl 0;

  h2 {
    font-size: $font-size-2xl;
    color: $text-primary;
    margin-bottom: $spacing-md;
  }
}

.hero-desc {
  color: $text-secondary;
  font-size: $font-size-lg;
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  align-items: center;
}

.card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-md;
  text-align: center;
  width: 100%;
  max-width: 480px;

  h3 {
    font-size: $font-size-lg;
    margin-bottom: $spacing-lg;
    color: $text-primary;
  }
}

.counter-display {
  margin-bottom: $spacing-lg;
}

.counter-value {
  font-size: $font-size-2xl;
  font-weight: 700;
  color: $color-primary;
  display: block;
}

.counter-label {
  color: $text-secondary;
  font-size: $font-size-sm;
}

.counter-actions {
  display: flex;
  gap: $spacing-sm;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  background: $bg-page;
  color: $text-primary;
  transition: $transition-base;

  &:hover:not(:disabled) {
    background: $border-color;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: $color-primary;
  color: white;

  &:hover:not(:disabled) {
    background: $color-primary-hover;
  }
}

.btn-danger {
  background: $color-danger;
  color: white;

  &:hover:not(:disabled) {
    background: #dc2626;
  }
}

.result-box {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  border-radius: $radius-md;
  text-align: left;
  font-size: $font-size-sm;
  word-break: break-all;

  pre {
    margin: 0;
    font-family: monospace;
    white-space: pre-wrap;
  }
}

.result-box.success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: $text-primary;
}

.result-box.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: $color-danger;
}
</style>
