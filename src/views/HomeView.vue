<template>
  <div class="home-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-container">
          <img src="../assets/image/logo.svg" alt="Description of SVG" class="logo" />
          <!-- <object data="../assets/image/logo.svg" type="image/svg+xml" class="logo" alt="sync-pan Logo"></object> -->
          <span v-show="!isSidebarCollapsed">Sync-Pan</span>
        </div>
        <button class="collapse-btn" @click="toggleSidebar">
          <ChevronLeft v-if="!isSidebarCollapsed" class="icon" />
          <ChevronRight v-else class="icon" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link 
          v-for="item in menuItems" 
          :key="item.name"
          :to="{ name: item.name }"
          class="nav-item"
          :class="{ 'active': route.name === item.name }"
        >
          <component :is="item.icon" class="nav-icon" />
          <span v-show="!isSidebarCollapsed">{{ item.title }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <a 
          href="https://github.com/kikihhe" 
          target="_blank" 
          rel="noopener noreferrer"
          class="github-link"
        >
          <Github class="github-icon" />
          <span v-show="!isSidebarCollapsed">GitHub</span>
        </a>
      </div>
    </aside>

    <div class="main-container">
      <!-- 头部 -->
      <header class="header">
        <div class="breadcrumb">
          <h1>{{ currentTitle }}</h1>
          <div class="path">{{ currentPath }}</div>
        </div>
        <div class="user-info">
          <div class="user-avatar" @click="toggleUserMenu">
            <img 
              :src="userAvatar || defaultAvatar" 
              alt="User avatar"
            />
          </div>
          <!-- 用户菜单 dropdown -->
          <div v-show="isUserMenuVisible" class="user-menu">
            <div class="user-menu-header">
              <strong>{{ username }}</strong>
            </div>
            <div class="user-menu-items">
              <button class="menu-item" @click="handleProfile">
                <User class="menu-icon" />
                个人信息
              </button>
              <button class="menu-item" @click="handleSettings">
                <Settings class="menu-icon" />
                设置
              </button>
              <button class="menu-item logout" @click="handleLogout">
                <LogOut class="menu-icon" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import defaultAvatar from '@/assets/image/default-avatar.svg';
import { 
  ChevronLeft, 
  ChevronRight, 
  FolderOpen, 
  Laptop,
  Github,
  User,
  Settings,
  LogOut,
  Trash2
} from 'lucide-vue-next'

// 侧边栏状态
const isSidebarCollapsed = ref(false)
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 菜单项配置
const menuItems = [
  {
    title: '我的文件',
    name: 'file',
    icon: FolderOpen
  },
  {
    title: '我的设备',
    name: 'device',
    icon: Laptop
  },
  {
    title: '回收站',
    name: 'recycle-bin',
    icon: Trash2
  }
]

// 路由相关
const route = useRoute()
const router = useRouter()

const currentPath = computed(() => route.path)
const currentTitle = computed(() => {
  const currentMenu = menuItems.find(item => item.name === route.name)
  return currentMenu ? currentMenu.title : ''
})

// 用户信息相关
const isUserMenuVisible = ref(false)
const username = ref('Admin') // 这里应该从用户状态获取
const userAvatar = ref('') // 这里应该从用户状态获取

const toggleUserMenu = () => {
  isUserMenuVisible.value = !isUserMenuVisible.value
}

// 用户菜单操作
const handleProfile = () => {
  router.push('/user')
  isUserMenuVisible.value = false
}

const handleSettings = () => {
  router.push('/settings')
  isUserMenuVisible.value = false
}

const handleLogout = () => {
  localStorage.setItem('token', '')
  // 实现登出逻辑
  router.push('/login')
}

// 点击外部关闭用户菜单
const closeUserMenu = (e) => {
  if (!e.target.closest('.user-info')) {
    isUserMenuVisible.value = false
  }
}

// 监听点击事件
import { onMounted } from 'vue'
onMounted(() => {
  document.addEventListener('click', closeUserMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu)
})
</script>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f8fafc;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background-color: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.25rem;
}

.logo {
  width: 32px;
  height: 32px;
}

.collapse-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #64748b;
  border-radius: 0.375rem;
}

.collapse-btn:hover {
  background-color: #f1f5f9;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.nav-item.active {
  background-color: #3b82f6;
  color: white;
  font-weight: 500;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

.github-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
  text-decoration: none;
  padding: 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.github-link:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.github-icon {
  width: 20px;
  height: 20px;
}

/* 主容器样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部样式 */
.header {
  height: 64px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
}

.breadcrumb {
  display: flex;
  flex-direction: column;
}

.breadcrumb h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.path {
  font-size: 0.875rem;
  color: #64748b;
}

.user-info {
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s ease;
}

.user-avatar:hover {
  border-color: #3b82f6;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 200px;
  z-index: 50;
}

.user-menu-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.user-menu-items {
  padding: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  text-align: left;
}

.menu-item:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.menu-item.logout {
  color: #ef4444;
}

.menu-item.logout:hover {
  background-color: #fef2f2;
  color: #dc2626;
}

.menu-icon {
  width: 16px;
  height: 16px;
}

/* 内容区域样式 */
.content {
  flex: 1;
  padding: 1.5rem;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 40;
    height: 100vh;
    transform: translateX(0);
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
  }

  .main-container {
    margin-left: 0;
  }
}
</style>

