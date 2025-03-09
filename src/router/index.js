import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotFoundView from '../views/404.vue'
import PortalView from '../views/PortalView.vue'
import RegisterForm from '../views/RegisterForm.vue'
import LoginForm from '../views/LoginForm.vue'  

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 门户组件，包含注册、登录
    {
      path: '/',
      redirect: '/portal',
    },
    // 门户组件，包含注册、登录
    {
      path: '/portal',
      name: 'portal',
      component: PortalView,
      children: [
        {
          path: 'register',
          name: 'register',
          component: RegisterForm,
        },
        {
          path: 'login',
          name: 'login',
          component: LoginForm,
        },
      ],
    },
    // 主页，登录后的默认页面
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    
    {
      path: '/notFound',
      component: NotFoundView,
    }
  ],
})

export default router
