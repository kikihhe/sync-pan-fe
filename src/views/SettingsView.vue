<template>
  <div class="settings-view">
    
    <div class="settings-header">
      <div class="header-content">
        <button type="button" class="btn-back" @click="goToFile">
          <ArrowLeft :size="16" class="back-icon" />
          回到首页
        </button>
        <br />
        <h1 class="settings-title">设置</h1>
      </div>
    </div>

    
    <div class="settings-container">
      
      <nav class="settings-sidebar">
        <RouterLink
          :to="{ name: 'settings-account'}"
          class="nav-item"
          :class="{ active: currentTab === 'account' }"
        >
          <User class="nav-icon" :size="16" />
          账户
        </RouterLink>
        <RouterLink
          :to="{ name:'settings-secret'}"
          class="nav-item"
          :class="{ active: currentTab === 'secret' }"
        >
          <Key class="nav-icon" :size="16" />
          密钥
        </RouterLink>
      </nav>

      
      <div class="settings-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { User, Key, ArrowLeft } from "lucide-vue-next";

const router = useRouter();

const route = useRoute();
const currentTab = ref("account");

const goToFile = () => {
  router.push({ name: 'file' });
};

// Update active tab based on route
watch(
  () => route.path,
  (path) => {
    if (path.includes("account")) {
      currentTab.value = "account";
    } else if (path.includes("secret")) {
      currentTab.value = "secret";
    }
  },
  { immediate: true }
);
</script>
  
  <style scoped>
.settings-view {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.settings-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  color: #64748b;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  color: #1e293b;
  background-color: #f1f5f9;
}

.back-icon {
  margin-right: 2px;
}

.settings-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
}

.settings-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 32px;
  min-height: calc(100vh - 200px);
}

.settings-sidebar {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: #64748b;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.nav-item.active {
  background-color: #eff6ff;
  color: #3b82f6;
  font-weight: 500;
}

.nav-icon {
  flex-shrink: 0;
}

.settings-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>