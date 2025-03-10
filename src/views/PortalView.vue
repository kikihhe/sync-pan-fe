<template>
  <div class="portal-container">
    <div class="portal-background">
      <!-- 云朵和同步图标 SVG 背景 -->
      <svg class="background-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
        <!-- 背景渐变 -->
        <defs>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e6f7ff" />
            <stop offset="100%" stop-color="#f0f9ff" />
          </linearGradient>
          
          <!-- 云朵图案 -->
          <symbol id="cloud" viewBox="0 0 54 30">
            <path d="M54 19.5c0 5.8-4.7 10.5-10.5 10.5h-33C4.7 30 0 25.3 0 19.5c0-5.3 3.9-9.6 9-10.4.5-5.1 4.8-9.1 10-9.1 3.1 0 5.9 1.4 7.8 3.7C28.5 1.5 31.1 0 34 0c5.5 0 10 4.5 10 10 0 .5 0 1-.1 1.5 5.7.3 10.1 5 10.1 10.7v-2.7z" fill="currentColor" />
          </symbol>
          
          <!-- 同步图标 -->
          <symbol id="sync-icon" viewBox="0 0 24 24">
            <path d="M12 4V1L8 5l4 4V6c3.3 0 6 2.7 6 6 0 1-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor" />
          </symbol>
          
          <!-- 文件图标 -->
          <symbol id="file-icon" viewBox="0 0 24 24">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" fill="currentColor" />
          </symbol>
          
          <!-- 设备图标 -->
          <symbol id="device-icon" viewBox="0 0 24 24">
            <path d="M4 6h16v10H4z" fill="currentColor" />
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" fill="currentColor" />
          </symbol>
        </defs>
        
        <!-- 背景矩形 -->
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />
        
        <!-- 云朵装饰 -->
        <use href="#cloud" x="80" y="60" width="54" height="30" class="cloud cloud-1" />
        <use href="#cloud" x="200" y="140" width="70" height="40" class="cloud cloud-2" />
        <use href="#cloud" x="1100" y="80" width="60" height="35" class="cloud cloud-3" />
        <use href="#cloud" x="1250" y="170" width="50" height="28" class="cloud cloud-4" />
        <use href="#cloud" x="600" y="40" width="65" height="36" class="cloud cloud-5" />
        
        <!-- 同步图标装饰 -->
        <use href="#sync-icon" x="150" y="300" width="40" height="40" class="icon sync-icon-1" />
        <use href="#sync-icon" x="1200" y="350" width="45" height="45" class="icon sync-icon-2" />
        <use href="#sync-icon" x="700" y="150" width="50" height="50" class="icon sync-icon-3" />
        
        <!-- 文件图标装饰 -->
        <use href="#file-icon" x="300" y="400" width="35" height="35" class="icon file-icon-1" />
        <use href="#file-icon" x="900" y="250" width="30" height="30" class="icon file-icon-2" />
        <use href="#file-icon" x="500" y="500" width="40" height="40" class="icon file-icon-3" />
        
        <!-- 设备图标装饰 -->
        <use href="#device-icon" x="400" y="200" width="45" height="45" class="icon device-icon-1" />
        <use href="#device-icon" x="1000" y="450" width="40" height="40" class="icon device-icon-2" />
        
        <!-- 连接线 -->
        <path d="M200 320 L300 400" stroke="#3b82f6" stroke-width="1" stroke-dasharray="5,5" class="connection-line" />
        <path d="M700 175 L900 250" stroke="#3b82f6" stroke-width="1" stroke-dasharray="5,5" class="connection-line" />
        <path d="M400 222 L500 500" stroke="#3b82f6" stroke-width="1" stroke-dasharray="5,5" class="connection-line" />
        <path d="M1000 470 L1200 372" stroke="#3b82f6" stroke-width="1" stroke-dasharray="5,5" class="connection-line" />
        
        <!-- 圆点装饰 -->
        <circle cx="250" cy="150" r="3" class="dot dot-1" />
        <circle cx="800" cy="350" r="4" class="dot dot-2" />
        <circle cx="1100" cy="200" r="3" class="dot dot-3" />
        <circle cx="350" cy="500" r="2" class="dot dot-4" />
        <circle cx="650" cy="450" r="3" class="dot dot-5" />
        <circle cx="950" cy="100" r="2" class="dot dot-6" />
      </svg>
      
      <!-- 动态粒子效果 -->
      <div class="particles">
        <div class="particle particle-1"></div>
        <div class="particle particle-2"></div>
        <div class="particle particle-3"></div>
        <div class="particle particle-4"></div>
        <div class="particle particle-5"></div>
        <div class="particle particle-6"></div>
        <div class="particle particle-7"></div>
        <div class="particle particle-8"></div>
      </div>
    </div>
    
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
  z-index: 0;
  overflow: hidden;
}

.background-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

/* 云朵样式 */
.cloud {
  opacity: 0.1;
  fill: #3b82f6;
}

.cloud-1 {
  animation: float 20s infinite ease-in-out;
}

.cloud-2 {
  animation: float 25s infinite ease-in-out 2s;
}

.cloud-3 {
  animation: float 22s infinite ease-in-out 5s;
}

.cloud-4 {
  animation: float 28s infinite ease-in-out 3s;
}

.cloud-5 {
  animation: float 24s infinite ease-in-out 1s;
}

/* 图标样式 */
.icon {
  opacity: 0.1;
  fill: #3b82f6;
}

.sync-icon-1 {
  animation: rotate 15s infinite linear;
}

.sync-icon-2 {
  animation: rotate 18s infinite linear reverse;
}

.sync-icon-3 {
  animation: rotate 20s infinite linear;
}

.file-icon-1, .file-icon-2, .file-icon-3,
.device-icon-1, .device-icon-2 {
  animation: pulse 8s infinite ease-in-out;
}

/* 连接线样式 */
.connection-line {
  opacity: 0.15;
  animation: dash 20s infinite linear;
}

/* 圆点样式 */
.dot {
  fill: #3b82f6;
  opacity: 0.2;
  animation: pulse 5s infinite alternate;
}

.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 1s; }
.dot-3 { animation-delay: 2s; }
.dot-4 { animation-delay: 3s; }
.dot-5 { animation-delay: 4s; }
.dot-6 { animation-delay: 5s; }

/* 粒子效果 */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  background-color: #3b82f6;
  border-radius: 50%;
  opacity: 0.1;
}

.particle-1 {
  width: 10px;
  height: 10px;
  top: 20%;
  left: 10%;
  animation: particle-move 25s infinite ease-in-out;
}

.particle-2 {
  width: 15px;
  height: 15px;
  top: 70%;
  left: 20%;
  animation: particle-move 30s infinite ease-in-out 2s;
}

.particle-3 {
  width: 8px;
  height: 8px;
  top: 40%;
  left: 80%;
  animation: particle-move 28s infinite ease-in-out 5s;
}

.particle-4 {
  width: 12px;
  height: 12px;
  top: 60%;
  left: 70%;
  animation: particle-move 22s infinite ease-in-out 8s;
}

.particle-5 {
  width: 6px;
  height: 6px;
  top: 30%;
  left: 40%;
  animation: particle-move 35s infinite ease-in-out 1s;
}

.particle-6 {
  width: 9px;
  height: 9px;
  top: 80%;
  left: 30%;
  animation: particle-move 32s infinite ease-in-out 7s;
}

.particle-7 {
  width: 7px;
  height: 7px;
  top: 25%;
  left: 65%;
  animation: particle-move 27s infinite ease-in-out 3s;
}

.particle-8 {
  width: 11px;
  height: 11px;
  top: 75%;
  left: 85%;
  animation: particle-move 29s infinite ease-in-out 6s;
}

/* 动画定义 */
@keyframes float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-20px) translateX(10px);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.1;
    transform: scale(1);
  }
  50% {
    opacity: 0.2;
    transform: scale(1.1);
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: 100;
  }
}

@keyframes particle-move {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(50px, 30px);
  }
  50% {
    transform: translate(20px, 80px);
  }
  75% {
    transform: translate(-30px, 40px);
  }
}

.portal-card {
  width: 100%;
  max-width: 480px;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(5px);
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
  
  /* 减少移动设备上的动画元素数量 */
  .cloud-4, .cloud-5,
  .sync-icon-3,
  .file-icon-3,
  .device-icon-2,
  .particle-5, .particle-6, .particle-7, .particle-8 {
    display: none;
  }
}
</style>