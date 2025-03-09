<template>
    <div class="not-found-container">
      <div class="not-found-content">
        <h1 class="not-found-title">404</h1>
        <h2 class="not-found-subtitle">页面未找到</h2>
        <p class="not-found-message">
          抱歉，我们无法找到您要访问的页面。它可能已被移动或删除。
        </p>
        <button class="not-found-button" @click="goHome">
          <span class="not-found-button-icon">←</span>
          返回首页
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  const goHome = () => {
    router.push('/home')
  }
  </script>
  
  <style scoped>
  .not-found-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 0 1rem;
    text-align: center;
  }
  
  .not-found-content {
    max-width: 28rem;
  }
  
  .not-found-title {
    font-size: 9rem;
    font-weight: 800;
    line-height: 1;
    color: var(--color-primary, #3b82f6);
    margin-bottom: 1rem;
  }
  
  .not-found-subtitle {
    font-size: 1.875rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
  }
  
  .not-found-message {
    color: var(--color-text-secondary, #6b7280);
    margin-bottom: 2rem;
  }
  
  .not-found-button {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    font-weight: 500;
    background-color: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .not-found-button:hover {
    background-color: var(--color-primary-dark, #2563eb);
  }
  
  .not-found-button-icon {
    margin-right: 0.5rem;
  }
  </style>