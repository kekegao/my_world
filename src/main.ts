import { createApp, defineComponent, h } from 'vue'
import { createPinia } from 'pinia'
import { RouterView } from 'vue-router'
import router from './router'
import './assets/styles/global.scss'

// 已移除 App.vue，根组件仅作为路由出口，页面由路由表控制
const Root = defineComponent({
  name: 'Root',
  render() {
    return h(RouterView)
  },
})

const app = createApp(Root)

app.use(createPinia())
app.use(router)

app.mount('#app')
