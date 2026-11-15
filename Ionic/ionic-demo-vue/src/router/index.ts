import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import LoginPage from '@/views/Login.vue'
import RegisterPage from '@/views/Register.vue'
import StudyPage from '@/views/StudyPage.vue'
import PreviewPage from '@/views/PreviewPage.vue'
import WordSearchPage from '@/views/WordSearchPage.vue'
import ProfilePage from '@/views/ProfilePage.vue'
import FeedbackPage from '@/views/FeedbackPage.vue'
import TabsPage from '@/views/TabsPage.vue'
import AdminLayout from '@/views/AdminLayout.vue'
import { isAuthenticated, isAdmin, getUserId } from '@/services/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home',
  },
  {
    path: '/tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home',
      },
      {
        path: 'home',
        name: 'Home',
        component: HomePage,
        meta: { requiresAuth: true },
      },
      {
        path: 'search',
        name: 'Search',
        component: WordSearchPage,
        meta: { requiresAuth: true },
      },
      {
        path: 'preview',
        name: 'Preview',
        component: PreviewPage,
        meta: { requiresAuth: true },
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: FeedbackPage,
        meta: { requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ProfilePage,
        meta: { requiresAuth: true },
      },
    ],
  },
  // 兼容旧路径（redirect 会保留 query，历史字符串跳转无需改动）
  {
    path: '/home',
    redirect: '/tabs/home',
  },
  {
    path: '/search',
    redirect: '/tabs/search',
  },
  {
    path: '/preview',
    redirect: '/tabs/preview',
  },
  {
    path: '/profile',
    redirect: '/tabs/profile',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
  },
  {
    path: '/study',
    name: 'Study',
    component: StudyPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/feedback',
    name: 'AdminFeedback',
    component: AdminLayout,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/:table',
    name: 'Admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/** 
 * 全局导航守卫：未登录用户访问受保护页面时重定向到 /login
 */ 
router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAdmin && !isAdmin.value) {
    next('/login')
  } else if (to.meta.requiresAuth && (!isAuthenticated.value || getUserId() <= 0)) {
    next('/login')
  } else {
    next()
  }
})

export default router
