<template>
  <div class="sidebar-container">
    <div class="logo-area">
      <h3 v-show="!sidebarStore.isCollapsed">SyncPan</h3>
      <button class="toggle-btn" @click="sidebarStore.toggleCollapse">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
    </div>
    
    <nav class="menu-items">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path"
        :to="{ name: item.name }"
        class="menu-item"
        active-class="active"
      >
        <component :is="item.icon" class="menu-icon" />
        <span v-show="!sidebarStore.isCollapsed">{{ item.title }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { useSidebarStore } from '@/stores/sidebar'
import { ref } from 'vue'

// 菜单配置项
const menuItems = ref([
  {
    title: '我的文件',
    name: 'MyFiles',
    path: '/home/files',
    icon: 'FolderIcon'
  },
  {
    title: '我的设备',
    name: 'MyDevices',
    path: '/home/devices',
    icon: 'ComputerIcon'
  },
  {
    title: '传输列表',
    name: 'Transfers',
    path: '/home/transfers',
    icon: 'TransferIcon'
  }
])

const sidebarStore = useSidebarStore()
</script>

<style scoped>
.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: 2px 0 8px rgba(0,0,0,0.05);
}

.logo-area {
  padding: 16px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.logo-area h3 {
  margin: 0 12px;
  font-size: 18px;
  color: #1a1a1a;
}

.toggle-btn {
  padding: 8px;
  border: none;
  background: none;
  cursor: pointer;
  color: #666;
}

.menu-items {
  flex: 1;
  padding: 16px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #666;
  text-decoration: none;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.active {
  color: #1890ff;
  background: #e6f7ff;
  border-right: 3px solid #1890ff;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin: 0 12px;
}
</style>