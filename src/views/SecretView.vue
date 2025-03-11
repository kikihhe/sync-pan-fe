<template>
  <div class="secret-view">
    <h2 class="section-title">密钥管理</h2>

    <!-- Access Token Section -->
    <div class="section-container">
      <div class="section-header">
        <div>
          <h3>访问令牌</h3>
          <p class="section-description">管理你的个人访问令牌</p>
        </div>
        <button class="btn-primary" @click="handleGenerateToken">
          <Plus :size="16" />
          生成新令牌
        </button>
      </div>

      <!-- Token List -->
      <div class="token-list" v-if="tokens.length > 0">
        <div v-for="token in tokens" :key="token.id" class="token-item">
          <div class="token-info">
            <div class="token-name">
              <Key :size="16" class="token-icon" />
              {{ token.name }}
            </div>
            <div class="token-meta">
              <span class="token-date"
                >创建于 {{ formatDate(token.createdAt) }}</span
              >
              <span class="token-date">·</span>
              <span class="token-date"
                >最后使用 {{ formatDate(token.lastUsed) }}</span
              >
            </div>
          </div>
          <div class="token-actions">
            <button class="btn-secondary" @click="handleCopyToken(token)">
              <Copy :size="16" />
              复制
            </button>
            <button class="btn-danger" @click="handleDeleteToken(token)">
              <Trash2 :size="16" />
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <Key :size="32" class="empty-icon" />
        <p>你还没有任何访问令牌</p>
        <button class="btn-primary" @click="handleGenerateToken">
          生成新令牌
        </button>
      </div>
    </div>

    <!-- SSH Keys Section -->
    <div class="section-container">
      <div class="section-header">
        <div>
          <h3>SSH 密钥</h3>
          <p class="section-description">管理用于身份验证的 SSH 密钥</p>
        </div>
        <button class="btn-primary" @click="handleAddSSHKey">
          <Plus :size="16" />
          添加 SSH 密钥
        </button>
      </div>

      <!-- SSH Key List -->
      <div class="key-list" v-if="sshKeys.length > 0">
        <div v-for="key in sshKeys" :key="key.id" class="key-item">
          <div class="key-info">
            <div class="key-name">
              <Terminal :size="16" class="key-icon" />
              {{ key.name }}
            </div>
            <div class="key-meta">
              <span class="key-date">添加于 {{ formatDate(key.addedAt) }}</span>
              <span class="key-date">·</span>
              <span class="key-fingerprint">{{ key.fingerprint }}</span>
            </div>
          </div>
          <button class="btn-danger" @click="handleDeleteSSHKey(key)">
            <Trash2 :size="16" />
            删除
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <Terminal :size="32" class="empty-icon" />
        <p>你还没有添加任何 SSH 密钥</p>
        <button class="btn-primary" @click="handleAddSSHKey">
          添加 SSH 密钥
        </button>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import { ref } from "vue";
import { Key, Plus, Copy, Trash2, Terminal } from "lucide-vue-next";
import { format } from "date-fns";

// 模拟数据
const tokens = ref([
  {
    id: 1,
    name: "开发环境令牌",
    createdAt: "2024-03-10T10:00:00Z",
    lastUsed: "2024-03-11T15:30:00Z",
  },
  {
    id: 2,
    name: "生产环境令牌",
    createdAt: "2024-03-01T08:00:00Z",
    lastUsed: "2024-03-11T09:15:00Z",
  },
]);

const sshKeys = ref([
  {
    id: 1,
    name: "MacBook Pro",
    fingerprint: "SHA256:uRyRX7qfnQwp9v7L+8Q5q7v7X8Q5q7v7X8Q5q7v7X8Q",
    addedAt: "2024-02-15T14:30:00Z",
  },
]);

const formatDate = (dateString) => {
  return format(new Date(dateString), "yyyy-MM-dd HH:mm:ss");
};

const handleGenerateToken = () => {
  // 实现生成令牌逻辑
};

const handleCopyToken = (token) => {
  // 实现复制令牌逻辑
};

const handleDeleteToken = (token) => {
  // 实现删除令牌逻辑
};

const handleAddSSHKey = () => {
  // 实现添加 SSH 密钥逻辑
};

const handleDeleteSSHKey = (key) => {
  // 实现删除 SSH 密钥逻辑
};
</script>
  
  <style scoped>
.secret-view {
  max-width: 800px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 24px;
}

.section-container {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.section-description {
  color: #64748b;
  font-size: 14px;
}

/* Token List Styles */
.token-list,
.key-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.token-item,
.key-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.token-info,
.key-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.token-name,
.key-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1e293b;
}

.token-icon,
.key-icon {
  color: #64748b;
}

.token-meta,
.key-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-date,
.key-date,
.key-fingerprint {
  font-size: 12px;
  color: #64748b;
}

.token-actions {
  display: flex;
  gap: 8px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  text-align: center;
}

.empty-icon {
  color: #64748b;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 8px;
}

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #b91c1c;
}
</style>