<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 登录等独立页面不展示公共布局
const isBlankLayout = computed(() => route.meta.layout === 'blank')
</script>

<template>
  <div v-if="isBlankLayout" class="app-blank">
    <router-view />
  </div>
  <div v-else class="app-wrapper">
    <header class="app-header">
      <div class="header-inner">
        <h1 class="app-logo" @click="router.push('/')">My World</h1>
        <nav class="app-nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/about" class="nav-link">关于</router-link>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>&copy; {{ new Date().getFullYear() }} My World. All rights reserved.</p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background: $bg-card;
  border-bottom: 1px solid $border-color;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 $spacing-lg;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-logo {
  font-size: $font-size-xl;
  font-weight: 700;
  color: $color-primary;
  cursor: pointer;
  user-select: none;
}

.app-nav {
  display: flex;
  gap: $spacing-lg;
}

.nav-link {
  color: $text-secondary;
  font-size: $font-size-base;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-md;
  transition: $transition-base;

  &:hover {
    color: $color-primary;
  }

  &.router-link-exact-active {
    color: $color-primary;
    background: rgba($color-primary, 0.1);
  }
}

.app-main {
  flex: 1;
}

.app-footer {
  text-align: center;
  padding: $spacing-lg;
  color: $text-muted;
  font-size: $font-size-sm;
  border-top: 1px solid $border-color;
}
</style>
