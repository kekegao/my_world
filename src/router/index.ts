import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login.vue'),
      meta: { layout: 'blank' },
    },
    {
      path: '/publishOrder',
      name: 'publishOrder',
      component: () => import('@/views/publishOrder.vue'),
      meta: { layout: 'blank', requiresAuth: true },
    },
    {
      path: '/publishOrderList',
      name: 'publishOrderList',
      component: () => import('@/views/publishOrderList.vue'),
      meta: { layout: 'blank', requiresAuth: true },
    },
    {
      path: '/carrierAcceptOrder',
      name: 'carrierAcceptOrder',
      component: () => import('@/views/carrierAcceptOrder.vue'),
      meta: { layout: 'blank', requiresAuth: true },
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('@/views/account.vue'),
      meta: { layout: 'blank', requiresAuth: true },
    },
    {
      path: '/recharge',
      name: 'recharge',
      component: () => import('@/views/recharge.vue'),
      meta: { layout: 'blank', requiresAuth: true },
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: () => import('@/views/withdraw.vue'),
      meta: { layout: 'blank', requiresAuth: true },
    },
    {
      path: '/bankList',
      name: 'bankList',
      component: () => import('@/views/bankList.vue'),
      meta: { layout: 'blank', requiresAuth: true },
    },
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
  ],
})

// 登录守卫：需要登录的页面未登录时跳转登录页
router.beforeEach((to) => {
  const authed = localStorage.getItem('token') || localStorage.getItem('userInfo')
  if (to.meta.requiresAuth && !authed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
