<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-mask">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">添加设备</h3>
            <button class="btn-close" @click="handleCancel">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-content">
            <!-- 步骤指示器 -->
            <div class="steps-container">
              <div
                v-for="(step, index) in steps"
                :key="index"
                class="step"
                :class="{
                  active: currentStep === index,
                  completed: currentStep > index,
                }"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-label">{{ step }}</div>
              </div>
            </div>

            <!-- 步骤1: 设备信息 -->
            <div v-if="currentStep === 0" class="step-content">
              <div class="form-group">
                <label for="deviceName">设备名称</label>
                <input
                  type="text"
                  id="deviceName"
                  v-model="deviceInfo.name"
                  placeholder="输入设备名称"
                />
              </div>

              <div class="form-group">
                <label for="secretSearch">密钥</label>
                <div class="search-container">
                  <input
                    type="text"
                    id="secretSearch"
                    v-model="secretSearchQuery"
                    placeholder="搜索密钥..."
                    @input="searchSecrets"
                  />
                  <button
                    v-if="secretSearchQuery"
                    class="clear-btn"
                    @click="clearSearch"
                  >
                    <X :size="14" />
                  </button>
                </div>

                <div v-if="isSearching" class="loading-indicator">
                  搜索中...
                </div>

                <div v-if="filteredSecrets.length > 0" class="secret-list">
                  <div
                    v-for="secret in filteredSecrets"
                    :key="secret.id"
                    class="secret-item"
                    :class="{ selected: deviceInfo.secretId === secret.id }"
                    @click="selectSecret(secret)"
                  >
                    <div class="secret-name">
                      <Key :size="14" />
                      {{ secret.key }}
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="secretSearchQuery && !isSearching"
                  class="no-results"
                >
                  未找到匹配的密钥
                </div>
              </div>

              <div v-if="selectedSecret" class="selected-secret">
                <div class="selected-secret-header">
                  <span>已选择密钥:</span>
                  <button class="remove-btn" @click="removeSelectedSecret">
                    <X :size="14" />
                  </button>
                </div>
                <div class="selected-secret-content">
                  <div class="secret-detail">
                    <span class="label">名称:</span>
                    <span class="value">{{ selectedSecret.key }}</span>
                  </div>
                  <div class="secret-detail">
                    <span class="label">值:</span>
                    <span class="value secret-value">{{
                      maskSecretValue(selectedSecret.value)
                    }}</span>
                    <button
                      class="copy-btn"
                      @click="copySecretValue(selectedSecret.value)"
                    >
                      <Copy :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤2: 安装指引 -->
            <div v-if="currentStep === 1" class="step-content">
              <div class="install-guide">
                <h4>安装指引</h4>
                <p>请按照以下步骤在您的设备上安装同步客户端:</p>

                <div class="guide-section">
                  <h5>1. 下载客户端</h5>
                  <div class="code-block">
                    <pre><code>{{ downloadCommand }}</code></pre>
                    <button
                      class="copy-btn"
                      @click="copyCommand(downloadCommand)"
                    >
                      <Copy :size="14" />
                    </button>
                  </div>
                  <div class="download-button-container">
                    <button
                      class="download-btn"
                      @click="downloadClient"
                    >
                      <Download :size="14" />
                      直接下载客户端
                    </button>
                  </div>
                </div>

                <div class="guide-section">
                  <h5>2. 运行客户端</h5>
                  <div class="code-block">
                    <pre><code>
java -jar sync-client.jar \
  --device-key={{ deviceInfo.registeredDeviceKey || deviceInfo.deviceKey }} \
  --secret=YOUR_SECRET_VALUE
                    </code></pre>
                    <button
                      class="copy-btn"
                      @click="
                        copyCommand(
                          `java -jar sync-client.jar --device-key=${deviceInfo.deviceKey} --secret=YOUR_SECRET_VALUE`
                        )
                      "
                    >
                      <Copy :size="14" />
                    </button>
                  </div>
                </div>

                <div class="guide-section">
                  <h5>3. 验证连接</h5>
                  <p>
                    客户端启动后，将自动连接到服务器并开始同步。您可以在设备列表中查看设备状态。
                  </p>
                </div>

                <div class="important-note">
                  <AlertTriangle :size="16" />
                  <span
                    >重要提示:
                    请保存好您的设备密钥和Secret，这些信息仅显示一次！</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button
              v-if="currentStep > 0"
              class="btn-secondary"
              @click="prevStep"
            >
              上一步
            </button>
            <button
              v-if="currentStep === 0"
              class="btn-secondary"
              @click="handleCancel"
            >
              取消
            </button>
            <button
              v-if="currentStep < steps.length - 1"
              class="btn-primary"
              @click="nextStep"
              :disabled="!canProceed"
            >
              下一步
            </button>
            <button v-else class="btn-primary" @click="handleFinish">
              完成
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { X, Key, Copy, AlertTriangle, Download } from "lucide-vue-next";
import { listSecret } from "../api/SecretService";
import { ElMessage } from "element-plus";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  deviceKey: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);
import { registerDevice } from "../api/DeviceService";

// 状态变量
const show = ref(false);
const steps = ["设备信息", "安装指引"];
const currentStep = ref(0);
const deviceInfo = ref({
  name: "",
  secretId: null,
  deviceKey: props.deviceKey,
  registeredDeviceKey: null, // 保存注册后返回的deviceKey
});
const secretSearchQuery = ref("");
const filteredSecrets = ref([]);
const isSearching = ref(false);
const selectedSecret = ref(null);

// 监听props变化
watch(
  () => props.modelValue,
  (val) => {
    show.value = val;
    if (val) {
      // 重置状态
      currentStep.value = 0;
      deviceInfo.value = {
        name: "",
        secretId: null,
        deviceKey: props.deviceKey,
      };
      secretSearchQuery.value = "";
      filteredSecrets.value = [];
      selectedSecret.value = null;
      // 初始加载密钥列表
      searchSecrets();
    }
  }
);

// 计算属性
const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return deviceInfo.value.name && selectedSecret.value;
  }
  return true;
});

// 根据用户平台生成下载命令
const downloadCommand = computed(() => {
  // 检测用户平台，这里简单使用navigator.platform
  const isWindows = navigator.platform.indexOf("Win") > -1;
  const downloadUrl = "https://xiaohetypora.oss-cn-shanghai.aliyuncs.com/client-1.0-SNAPSHOT.jar"; // 客户端下载链接

  if (isWindows) {
    return `curl -o sync-client.jar ${downloadUrl}`;
  } else {
    return `wget -O sync-client.jar ${downloadUrl}`;
  }
});

// 方法
const searchSecrets = async () => {
  isSearching.value = true;
  try {
    const response = await listSecret(secretSearchQuery.value);
    if (response && response.code === 200) {
      filteredSecrets.value = response.data || [];
    } else {
      console.error("获取密钥列表失败:", response);
      ElMessage.error(response.message || "获取密钥列表失败");
      filteredSecrets.value = [];
    }
  } catch (error) {
    console.error("搜索密钥出错:", error);
    ElMessage.error("搜索密钥出错");
    filteredSecrets.value = [];
  } finally {
    isSearching.value = false;
  }
};

const clearSearch = () => {
  secretSearchQuery.value = "";
  searchSecrets();
};

const selectSecret = (secret) => {
  selectedSecret.value = secret;
  deviceInfo.value.secretId = secret.id;
};

const removeSelectedSecret = () => {
  selectedSecret.value = null;
  deviceInfo.value.secretId = null;
};

const maskSecretValue = (value) => {
  if (!value) return "";
  if (value.length <= 8) return "********";
  return value.substring(0, 4) + "****" + value.substring(value.length - 4);
};

const copySecretValue = (value) => {
  navigator.clipboard
    .writeText(value)
    .then(() => {
      ElMessage.success("密钥值已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制失败:", err);
      ElMessage.error("复制失败");
    });
};

const copyCommand = (command) => {
  navigator.clipboard
    .writeText(command)
    .then(() => {
      ElMessage.success("命令已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制失败:", err);
      ElMessage.error("复制失败");
    });
};

const downloadClient = () => {
  const downloadUrl = "https://xiaohetypora.oss-cn-shanghai.aliyuncs.com/client-1.0-SNAPSHOT.jar";
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = "sync-client.jar";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

const nextStep = async () => {
  if (currentStep.value === 0) {
    try {
      // 调用API注册设备
      const response = await registerDevice(deviceInfo.value.name, deviceInfo.value.secretId, deviceInfo.value.deviceKey);
      if (response && response.code === 200) {
        // 保存注册返回的deviceKey
        deviceInfo.value.registeredDeviceKey = response.data.deviceKey;
        ElMessage.success(deviceInfo.value.name + " 添加成功");
        currentStep.value++;
      } else {
        ElMessage.error("添加设备失败: " + (response?.msg || "未知错误"));
      }
    } catch (error) {
      console.error("添加设备出错:", error);
      ElMessage.error("添加设备失败: " + error.message);
    }
  } else if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const handleCancel = () => {
  emit("cancel");
  emit("update:modelValue", false);
};

const handleFinish = () => {
  emit("confirm");
  emit("update:modelValue", false);
  // 重置注册信息
  deviceInfo.value.registeredDeviceKey = null;
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
}

.modal-container {
  width: 90%;
  max-width: 600px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}

.modal-content {
  margin-bottom: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

/* 步骤指示器样式 */
.steps-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  position: relative;
}

.steps-container::before {
  content: "";
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #e5e7eb;
  z-index: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f3f4f6;
  border: 2px solid #e5e7eb;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.step.active .step-number {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.step.completed .step-number {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

.step-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.step.active .step-label,
.step.completed .step-label {
  color: #1f2937;
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1f2937;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

/* 搜索容器 */
.search-container {
  position: relative;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
}

/* 密钥列表 */
.secret-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-top: 8px;
}

.secret-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.secret-item:hover {
  background-color: #f3f4f6;
}

.secret-item.selected {
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.secret-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.loading-indicator,
.no-results {
  padding: 8px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-top: 8px;
}

/* 已选择的密钥 */
.selected-secret {
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background-color: #f8fafc;
}

.selected-secret-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1f2937;
}

.remove-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
}

.selected-secret-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.secret-detail {
  display: flex;
  align-items: center;
}

.secret-detail .label {
  width: 60px;
  color: #64748b;
  font-size: 14px;
}

.secret-detail .value {
  flex: 1;
  font-size: 14px;
}

.secret-value {
  font-family: monospace;
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.copy-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
}

.copy-btn:hover {
  color: #3b82f6;
}

/* 安装指引样式 */
.install-guide {
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.install-guide h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #1f2937;
}

.guide-section {
  margin-bottom: 20px;
}

.guide-section h5 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: #1f2937;
}

.code-block {
  position: relative;
  background-color: #1e293b;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.code-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.code-block code {
  color: #e2e8f0;
  font-family: monospace;
  font-size: 14px;
}

.code-block .copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border-radius: 4px;
  padding: 4px;
}

.code-block .copy-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.download-button-container {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover {
  background-color: #2563eb;
}

.important-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #fff7ed;
  border-left: 4px solid #f97316;
  border-radius: 4px;
  margin-top: 16px;
}

.important-note svg {
  color: #f97316;
  flex-shrink: 0;
}

/* 过渡动画 */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>
