<template>
  <div class="secret-view">
    <h2 class="section-title">密钥管理</h2>

    
    <div class="section-container">
      <div class="section-header">
        <div>

          <p class="section-description">管理你的应用密钥</p>
        </div>
        <button class="btn-primary" @click="showAddSecretDialog = true">
          <Plus :size="16" />
          添加密钥
        </button>
      </div>

      
      <div class="token-list" v-if="secrets.length > 0">
        <div v-for="secret in secrets" :key="secret.id" class="token-item">
          <div class="token-info">
            <div class="token-name">
              <Key :size="16" class="token-icon" />
              {{ secret.key }}
            </div>
            <div class="token-meta">
              <span class="token-date"
                >创建于 {{ formatDate(secret.createTime) }}</span
              >
            </div>
          </div>
          <div class="token-actions">
            <button class="btn-danger" @click="handleDeleteSecret(secret)">
              <Trash2 :size="16" />
              删除
            </button>
          </div>
        </div>
      </div>

      
      <div v-else class="empty-state">
        <Key :size="32" class="empty-icon" />
        <p>你还没有添加任何密钥</p>
        <button class="btn-primary" @click="showAddSecretDialog = true">
          添加密钥
        </button>
      </div>
    </div>

    
    <div v-if="showAddSecretDialog" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>添加密钥</h3>
          <button class="btn-close" @click="showAddSecretDialog = false">
            <X :size="20" />
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="secretKey">密钥名称</label>
            <input
              type="text"
              id="secretKey"
              v-model="newSecret.key"
              placeholder="输入密钥名称"
            />
          </div>
          <div class="form-group">
            <label for="secretValue">密钥值</label>
            <input
              type="text"
              id="secretValue"
              v-model="newSecret.value"
              placeholder="输入密钥值"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showAddSecretDialog = false">
            取消
          </button>
          <button class="btn-primary" @click="handleAddSecret">
            添加
          </button>
        </div>
      </div>
    </div>

    
    <div v-if="showConfirmDialog" class="dialog-overlay">
      <div class="dialog">
        <div class="dialog-header">
          <h3>确认添加</h3>
          <button class="btn-close" @click="showConfirmDialog = false">
            <X :size="20" />
          </button>
        </div>
        <div class="dialog-body">
          <p class="warning-text">请记住密钥，丢失无法找回</p>
          <p>密钥名称: {{ newSecret.key }}</p>
          <p>密钥值: {{ newSecret.value }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showConfirmDialog = false">
            取消
          </button>
          <button class="btn-primary" @click="confirmAddSecret">
            确认添加
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import { ref, onMounted } from "vue";
import { Key, Plus, Trash2, X } from "lucide-vue-next";
import { format } from "date-fns";
import { ElMessage, ElMessageBox } from "element-plus";
import { listSecret, addSecret, deleteSecret } from "../api/SecretService";

// 密钥列表数据
const secrets = ref([]);

// 新密钥数据
const newSecret = ref({
  key: "",
  value: ""
});

// 对话框显示状态
const showAddSecretDialog = ref(false);
const showConfirmDialog = ref(false);

// 获取密钥列表
const fetchSecrets = async () => {
  try {
    const res = await listSecret();
    if (res.code === 200) {
      secrets.value = res.data || [];
    } else {
      ElMessage.error(res.message || "获取密钥列表失败");
    }
  } catch (error) {
    console.error("获取密钥列表出错:", error);
    ElMessage.error("获取密钥列表失败");
  }
};

// 添加密钥
const handleAddSecret = () => {
  // 表单验证
  if (!newSecret.value.key || !newSecret.value.value) {
    ElMessage.warning("密钥名称和值不能为空");
    return;
  }
  
  // 显示确认对话框
  showConfirmDialog.value = true;
};

// 确认添加密钥
const confirmAddSecret = async () => {
  try {
    const res = await addSecret(newSecret.value.key, newSecret.value.value);
    if (res.code === 200) {
      ElMessage.success("添加密钥成功");
      // 重置表单
      newSecret.value = { key: "", value: "" };
      // 关闭对话框
      showAddSecretDialog.value = false;
      showConfirmDialog.value = false;
      // 刷新列表
      fetchSecrets();
    } else {
      ElMessage.error(res.message || "添加密钥失败");
    }
  } catch (error) {
    console.error("添加密钥出错:", error);
    ElMessage.error("添加密钥失败");
  }
};

// 删除密钥
const handleDeleteSecret = (secret) => {
  ElMessageBox.confirm(
    `确定要删除密钥 "${secret.key}" 吗？`,
    "删除确认",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      try {
        const res = await deleteSecret(secret.id);
        if (res.code === 200) {
          ElMessage.success("删除密钥成功");
          // 刷新列表
          fetchSecrets();
        } else {
          ElMessage.error(res.message || "删除密钥失败");
        }
      } catch (error) {
        console.error("删除密钥出错:", error);
        ElMessage.error("删除密钥失败");
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return format(new Date(dateString), "yyyy-MM-dd HH:mm:ss");
};

// 页面加载时获取密钥列表
onMounted(() => {
  fetchSecrets();
});
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

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}

.dialog-body {
  padding: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1e293b;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.warning-text {
  color: #dc2626;
  font-weight: 500;
  margin-bottom: 16px;
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