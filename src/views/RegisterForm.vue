<template>
  <div class="portal-form">
    <!-- <div class="form-header">
      <h2 class="portal-title">创建账号</h2>
      <p class="portal-subtitle">请填写以下信息完成注册</p>
    </div> -->
    
    <div class="form-body">
      <div class="form-group">
        <label for="register-username">用户名</label>
        <div class="input-container">
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </span>
          <input 
            id="register-username" 
            v-model="username" 
            type="text" 
            placeholder="请输入用户名"
          />
        </div>
        <p class="input-hint">用户名将用于登录和展示</p>
      </div>
      
      <div class="form-group">
        <label for="register-email">电子邮箱</label>
        <div class="input-container">
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </span>
          <input 
            id="register-email" 
            v-model="email" 
            type="email" 
            placeholder="请输入电子邮箱"
          />
        </div>
      </div>
      
      <div class="form-group">
        <label for="register-password">密码</label>
        <div class="input-container">
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </span>
          <input 
            id="register-password" 
            v-model="password" 
            :type="showConfirmPassword ? 'text' : 'password'" 
            placeholder="请设置密码"
          />
          <button 
            type="button" 
            class="password-toggle"
            @click="toggleConfirmPasswordVisibility"
          >
            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
          </button>
        </div>
        <div class="password-strength" :class="passwordStrength">
          <div class="strength-bar"></div>
          <div class="strength-bar"></div>
          <div class="strength-bar"></div>
          <div class="strength-bar"></div>
        </div>
        <p class="input-hint">密码应包含至少8个字符，包括字母和数字</p>
      </div>
      
      <div class="form-group">
        <label for="register-confirm-password">确认密码</label>
        <div class="input-container">
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </span>
          <input 
            id="register-confirm-password" 
            v-model="confirmPassword" 
            :type="showConfirmPassword ? 'text' : 'password'" 
            placeholder="请再次输入密码"
          />
        </div>
      </div>
      
      <div class="form-agreement">
        <label class="agreement-checkbox">
          <input type="checkbox" v-model="agreeTerms" />
          <span class="checkmark"></span>
          <span>我已阅读并同意 <a href="#" class="agreement-link">服务条款</a> 和 <a href="#" class="agreement-link">隐私政策</a></span>
        </label>
      </div>
    </div>
    
    <div class="form-footer">
      <button class="portal-button register-button" :disabled="!agreeTerms">
        <span>注册</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const agreeTerms = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const passwordStrength = computed(() => {
  if (!password.value) return ''
  
  const length = password.value.length
  const hasLetter = /[a-zA-Z]/.test(password.value)
  const hasNumber = /[0-9]/.test(password.value)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password.value)
  
  if (length < 6) return 'weak'
  if (length >= 8 && hasLetter && hasNumber && hasSpecial) return 'strong'
  if (length >= 6 && ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial))) return 'medium'
  return 'fair'
})
</script>

<style scoped>
.portal-form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-header {
  text-align: center;
  margin-bottom: 1rem;
}

.portal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #111827;
}

.portal-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  margin-bottom: 0.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.95rem;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-container input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: #f9fafb;
}

.input-container input:focus {
  outline: none;
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background-color: white;
}

.input-hint {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.password-toggle:hover {
  color: #6b7280;
}

.password-strength {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.75rem;
}

.strength-bar {
  height: 4px;
  flex: 1;
  background-color: #e5e7eb;
  border-radius: 2px;
  transition: background-color 0.3s ease;
}

.password-strength.weak .strength-bar:nth-child(1) {
  background-color: #ef4444;
}

.password-strength.fair .strength-bar:nth-child(1),
.password-strength.fair .strength-bar:nth-child(2) {
  background-color: #f59e0b;
}

.password-strength.medium .strength-bar:nth-child(1),
.password-strength.medium .strength-bar:nth-child(2),
.password-strength.medium .strength-bar:nth-child(3) {
  background-color: #10b981;
}

.password-strength.strong .strength-bar {
  background-color: #10b981;
}

.form-agreement {
  margin-top: 0.5rem;
}

.agreement-checkbox {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  position: relative;
  padding-left: 28px;
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.5;
}

.agreement-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 2px;
  left: 0;
  height: 18px;
  width: 18px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.agreement-checkbox:hover input ~ .checkmark {
  background-color: #e5e7eb;
}

.agreement-checkbox input:checked ~ .checkmark {
  background-color: var(--color-primary, #3b82f6);
  border-color: var(--color-primary, #3b82f6);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.agreement-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.agreement-checkbox .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.agreement-link {
  color: var(--color-primary, #3b82f6);
  text-decoration: none;
  transition: all 0.2s ease;
}

.agreement-link:hover {
  text-decoration: underline;
  color: var(--color-primary-dark, #2563eb);
}

.form-footer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.portal-button {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.register-button {
  background-color: var(--color-primary, #3b82f6);
  color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.register-button:hover {
  background-color: var(--color-primary-dark, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.register-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.register-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.portal-form {
  animation: fadeIn 0.3s ease-out;
}
</style>

