<script setup lang="ts">
const features = [
  { name: 'Vue 3', desc: 'Composition API + <script setup> 语法', version: '3.5+' },
  { name: 'TypeScript', desc: '类型安全的 JavaScript 超集', version: '~6.0' },
  { name: 'Vite', desc: '极速开发服务器和构建工具', version: '8.x' },
  { name: 'Vue Router', desc: '官方路由管理', version: '4.x' },
  { name: 'Pinia', desc: 'Vue 3 官方状态管理', version: '4.x' },
  { name: 'Axios', desc: 'HTTP 请求封装（拦截器）', version: '1.x' },
  { name: 'SCSS', desc: 'CSS 预处理器 + 全局变量', version: '-' },
  { name: 'ESLint + Prettier', desc: '代码规范与格式化', version: '-' },
]
</script>

<template>
  <div class="about-page page-container">
    <section class="hero">
      <h2>关于此框架</h2>
      <p class="hero-desc">
        这是一个生产就绪的 Vue 3 前端框架模板，集成了现代前端开发所需的核心工具链。
      </p>
    </section>

    <section class="tech-grid">
      <div v-for="item in features" :key="item.name" class="tech-card">
        <h3>{{ item.name }}</h3>
        <p class="tech-desc">{{ item.desc }}</p>
        <span class="tech-version">{{ item.version }}</span>
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
  font-size: $font-size-base;
  max-width: 600px;
  margin: 0 auto;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: $spacing-lg;
  padding-bottom: $spacing-2xl;
}

.tech-card {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-sm;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-2px);
  }

  h3 {
    font-size: $font-size-lg;
    color: $color-primary;
    margin-bottom: $spacing-sm;
  }
}

.tech-desc {
  color: $text-secondary;
  font-size: $font-size-sm;
  margin-bottom: $spacing-md;
}

.tech-version {
  display: inline-block;
  padding: 2px $spacing-sm;
  background: $bg-page;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  color: $text-muted;
  font-family: monospace;
}
</style>
