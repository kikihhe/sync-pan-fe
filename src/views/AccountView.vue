<template>
  <div class="account-view">
    <h2 class="section-title">账户设置</h2>

    <form @submit.prevent="handleSubmit" class="settings-form">
      <!-- Profile Picture -->
      <div class="form-section">
        <div class="section-header">
          <h3>头像</h3>
          <p class="section-description">这将显示在你的个人资料和评论中</p>
        </div>
        <div class="avatar-section">
          <img
            :src="userAvatar || '/placeholder.svg'"
            alt="用户头像"
            class="avatar-preview"
          />
          <div class="avatar-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="handleUploadAvatar"
            >
              <Upload :size="16" />
              更换头像
            </button>
            <button
              type="button"
              class="btn-danger"
              @click="handleRemoveAvatar"
              :disabled="!userAvatar"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <!-- Basic Info -->
      <div class="form-section">
        <div class="section-header">
          <h3>基本信息</h3>
          <p class="section-description">设置你的个人信息</p>
        </div>

        <div class="form-group">
          <label for="name">用户名</label>
          <input
            type="text"
            id="name"
            v-model="formData.name"
            class="form-input"
          />
          <p class="input-hint">用户名将显示在你的个人资料中</p>
        </div>

        <div class="form-group">
          <label for="email">邮箱</label>
          <div class="email-group">
            <input
              type="email"
              id="email"
              v-model="formData.email"
              class="form-input"
              disabled
            />
            <button
              type="button"
              class="btn-secondary"
              @click="handleChangeEmail"
            >
              修改
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="bio">个人简介</label>
          <textarea
            id="bio"
            v-model="formData.bio"
            class="form-input"
            rows="3"
          ></textarea>
          <p class="input-hint">简单介绍一下你自己</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="!isFormChanged">
          保存更改
        </button>
      </div>
    </form>

    <!-- Danger Zone -->
    <div class="danger-zone">
      <h3 class="danger-title">危险区域</h3>
      <div class="danger-card">
        <div class="danger-info">
          <h4>删除账户</h4>
          <p>一旦删除账户，所有数据将永久删除且无法恢复</p>
        </div>
        <button type="button" class="btn-danger" @click="handleDeleteAccount">
          删除账户
        </button>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
import { ref, computed } from "vue";
import { Upload } from "lucide-vue-next";

const userAvatar = ref(null);
const formData = ref({
  name: "",
  email: "user@example.com",
  bio: "",
});

const originalFormData = {
  name: "",
  email: "user@example.com",
  bio: "",
};

const isFormChanged = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalFormData);
});

const handleUploadAvatar = () => {
  // 实现头像上传逻辑
};

const handleRemoveAvatar = () => {
  userAvatar.value = null;
};

const handleChangeEmail = () => {
  // 实现邮箱修改逻辑
};

const handleSubmit = () => {
  // 实现表单提交逻辑
};

const handleDeleteAccount = () => {
  // 实现账户删除逻辑
};
</script>
  
  <style scoped>
.account-view {
  max-width: 800px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 24px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 24px;
}

.section-header {
  margin-bottom: 16px;
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

.avatar-section {
  display: flex;
  gap: 24px;
  align-items: center;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #f1f5f9;
}

.avatar-actions {
  display: flex;
  gap: 8px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1e293b;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-input:disabled {
  background-color: #f8fafc;
  cursor: not-allowed;
}

.input-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.email-group {
  display: flex;
  gap: 8px;
}

.email-group .form-input {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.danger-zone {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.danger-title {
  font-size: 16px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 16px;
}

.danger-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.danger-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 4px;
}

.danger-info p {
  font-size: 14px;
  color: #ef4444;
}

/* Buttons */
.btn-primary {
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger {
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

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>