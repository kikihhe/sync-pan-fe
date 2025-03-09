<template>
  <div class="portal-container">
    <div class="portal-background"></div>
    <div class="portal-card">
      <div class="portal-header">
        <div class="portal-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          <span>Sync-Pan</span>
        </div>
        <div class="portal-tabs">
          <button 
            class="portal-tab" 
            :class="{ 'active': activeTab === 'login' }"
            @click="setActiveTab('login')"
          >
            登录
          </button>
          <button 
            class="portal-tab" 
            :class="{ 'active': activeTab === 'register' }"
            @click="setActiveTab('register')"
          >
            注册
          </button>
        </div>
      </div>
      
      <div class="portal-content">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="activeTab === 'login' ? LoginForm : RegisterForm" :key="activeTab" />
          </keep-alive>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'

const activeTab = ref('login')

const setActiveTab = (tab) => {
  activeTab.value = tab
}
</script>

<style scoped>
.portal-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  position: relative;
  background-color: #f5f5f5;
  overflow: hidden;
}

.portal-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  z-index: -1;
}

.portal-card {
  width: 100%;
  max-width: 480px;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.portal-header {
  padding: 1.5rem 2rem 0;
}

.portal-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  color: var(--color-primary, #3b82f6);
  font-weight: 700;
  font-size: 1.25rem;
}

.logo-icon {
  color: var(--color-primary, #3b82f6);
}

.portal-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.portal-tab {
  flex: 1;
  padding: 1rem;
  text-align: center;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.3s ease;
  position: relative;
}

.portal-tab::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--color-primary, #3b82f6);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.portal-tab.active {
  color: var(--color-primary, #3b82f6);
}

.portal-tab.active::after {
  transform: scaleX(1);
}

.portal-tab:hover {
  color: var(--color-primary, #3b82f6);
}

.portal-content {
  min-height: 400px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:root {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
}

@media (max-width: 640px) {
  .portal-container {
    padding: 1rem;
  }
  
  .portal-card {
    border-radius: 0.75rem;
  }
  
  .portal-header {
    padding: 1rem 1.5rem 0;
  }
}
</style>

