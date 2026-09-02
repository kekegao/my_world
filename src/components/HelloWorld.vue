<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="hello-world">
    <div class="logos">
      <span class="logo vite-logo">⚡ Vite</span>
      <span class="logo vue-logo">💚 Vue</span>
    </div>
    <h3 class="message">{{ msg }}</h3>
  </div>
</template>

<style lang="scss" scoped>
.hello-world {
  text-align: center;
}

.logos {
  display: flex;
  justify-content: center;
  gap: $spacing-xl;
  margin-bottom: $spacing-md;
}

.logo {
  font-size: $font-size-lg;
  font-weight: 700;
  padding: $spacing-sm $spacing-lg;
  border-radius: $radius-lg;
  transition: $transition-base;
}

.vite-logo {
  background: linear-gradient(135deg, #bd34fe, #ff6a33);
  color: white;
}

.vue-logo {
  background: linear-gradient(135deg, #42b883, #35495e);
  color: white;
}

.logo:hover {
  transform: scale(1.08);
}

.message {
  color: $text-primary;
  font-size: $font-size-lg;
}
</style>
