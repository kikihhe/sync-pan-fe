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
    // {
    //   path: '/user',
    //   name: 'user',
    //   component: UserView,
    // },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      children: [
        {
          path: '/account',
          name: 'settings-account',
          component: () => import('@/views/AccountView.vue'),
        },
        {
          path: '/secret',
          name: 'settings-secret',
          component: () => import('@/views/SecretView.vue'),
        }
      ]
    },
    // 主页，登录后的默认页面
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      children: [
        {
          path: '',
          redirect: '/file'
        },
        // {
        //   path: '/user',
        //   name: 'user',
        //   component: () => import('@/views/AccountView.vue'),
        // } ,
        {
          path: '/file',
          name: 'file',
          component: () => import('@/views/MyFileView.vue'), 
        },
        {
          path: '/transfer',
          name: 'transfer',
          component: () => import('@/views/TransferView.vue'), 
        },
        {
          path: '/device',
          name: 'device',
          component: () => import('@/views/DeviceView.vue'), 
        }
      ]
    },
    
    {
      path: '/notFound',
      component: NotFoundView,
    },
    // 通配符路由，匹配所有未定义的路由并重定向到404页面
    {
      path: '/:pathMatch(.*)*',
      redirect: '/notFound'
    }
  ],
})

// 路由白名单（不需要登录验证的路径）
const whiteList = ['/portal', '/portal/login', '/portal/register']
// 访问页面时需要判断登录状态
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 判断是否在登录页
  const isLoginPage = to.path.startsWith('/portal')
  
  if (whiteList.includes(to.path)) {
    return next()
  }

  if (!token) {
    // 未登录且不在白名单，跳转登录页
    next('/portal')
  } else {
    // 已登录但访问登录相关页面，跳转首页
    if (isLoginPage) {
      next('/home')
    } else {
      next()
    }
  }
})

export default router
