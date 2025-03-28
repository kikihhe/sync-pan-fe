<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-mask">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title">设备绑定目录</h3>
            <button class="btn-close" @click="handleClose">
              <X :size="20"/>
            </button>
          </div>

          <div class="modal-content">
            <div v-if="isLoading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>加载中...</p>
            </div>

            <div v-else-if="boundMenus.length === 0" class="empty-state">
              <FolderX :size="48" class="empty-icon"/>
              <p>该设备暂无绑定目录</p>
              <button class="btn-primary add-btn" @click="showAddBindingForm">
                <PlusCircle :size="16"/>
                添加绑定
              </button>
            </div>

            <div v-else>
              <div class="toolbar">
                <h4>{{ deviceName }} 的绑定目录</h4>
                <button class="btn-primary add-btn" @click="showAddBindingForm">
                  <PlusCircle :size="16"/>
                  添加绑定
                </button>
              </div>

              <div class="bound-list">
                <div v-for="item in boundMenus" :key="item.id" class="bound-item">
                  <div class="bound-info">
                    <div class="bound-paths">
                      <div class="path-item">
                        <span class="path-label">本地路径:</span>
                        <span class="path-value">{{ item.localPath }}</span>
                      </div>
                      <div class="path-item">
                        <span class="path-label">远程路径:</span>
                        <span class="path-value">{{ item.remotePath }}</span>
                      </div>
                    </div>
                    <div class="bound-details">
                      <div class="detail-item">
                        <span class="detail-label">同步方向:</span>
                        <span class="detail-value">
                          {{ formatDirection(item.direction) }}
                        </span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">最后同步:</span>
                        <span class="detail-value">
                          {{ formatDate(item.lastSyncedAt) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="bound-actions">
                    <button class="action-btn delete" @click="handleDeleteBinding(item)">
                      <Trash2 :size="16"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 添加绑定表单 -->
            <div v-if="showAddForm" class="add-binding-form">
              <h4>添加绑定目录</h4>
              <div class="form-group">
                <label for="localPath">本地路径</label>
                <input
                    type="text"
                    id="localPath"
                    v-model="newBinding.localPath"
                    placeholder="输入本地路径，如: D:\Documents"
                />
              </div>
              <div class="form-group">
                <label for="remotePath">远程路径</label>
                <div class="input-with-button">
                  <input
                      type="text"
                      id="remotePath"
                      v-model="newBinding.remotePath"
                      placeholder="输入远程路径，如: /documents"
                  />
                  <button type="button" class="browse-btn" @click="openFolderSelectDialog">
                    <FolderSearch :size="16"/>
                    浏览
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="direction">同步方向</label>
                <select id="direction" v-model="newBinding.direction">
                  <option :value="0">双向同步</option>
                  <option :value="1">上传 (本地 → 远程)</option>
                  <option :value="2">下载 (远程 → 本地)</option>
                </select>
              </div>
              <div class="form-actions">
                <button class="btn-secondary" @click="cancelAddBinding">取消</button>
                <button
                    class="btn-primary"
                    @click="handleAddBinding"
                    :disabled="!canAddBinding"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 目录选择对话框 -->
    <FolderSelectDialog
        v-model="showFolderSelectDialog"
        @select="handleFolderSelect"
    />
  </Teleport>
</template>

<script setup>
import {ref, computed, watch} from "vue";
import {X, FolderX, PlusCircle, Trash2, FolderSearch} from "lucide-vue-next";
import {format} from "date-fns";
import {boundMenuService} from "../api/BoundMenuService";
import {ElMessage} from "element-plus";
import FolderSelectDialog from "./folder-select-dialog.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  deviceId: {
    type: Number,
    default: null,
  },
  deviceName: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "refresh"]);

// 状态变量
const show = ref(false);
const isLoading = ref(false);
const boundMenus = ref([]);
const showAddForm = ref(false);
const showFolderSelectDialog = ref(false);
const newBinding = ref({
  deviceId: null,
  localPath: "",
  remotePath: "",
  direction: 0, // 默认双向同步
});

// 监听props变化
watch(
    () => props.modelValue,
    (val) => {
      show.value = val;
      if (val && props.deviceId) {
        // 重置状态
        showAddForm.value = false;
        newBinding.value = {
          deviceId: props.deviceId,
          localPath: "",
          remotePath: "",
          direction: 0,
        };
        // 加载绑定目录列表
        loadBindings();
      }
    }
);

// 监听show变化，同步回父组件
watch(
    () => show.value,
    (val) => {
      emit("update:modelValue", val);
    }
);

// 计算属性
const canAddBinding = computed(() => {
  return (
      newBinding.value.localPath.trim() !== "" &&
      newBinding.value.remotePath.trim() !== ""
  );
});

// 方法
const loadBindings = async () => {
  if (!props.deviceId) return;

  isLoading.value = true;
  try {
    const response = await boundMenuService.getDeviceBindings(props.deviceId);
    if (response && response.code === 200) {
      boundMenus.value = response.data || [];
    } else {
      console.error("获取绑定目录列表失败:", response);
      ElMessage.error(response.message || "获取绑定目录列表失败");
      boundMenus.value = [];
    }
  } catch (error) {
    console.error("获取绑定目录列表出错:", error);
    ElMessage.error("获取绑定目录列表出错");
    boundMenus.value = [];
  } finally {
    isLoading.value = false;
  }
};

const formatDirection = (direction) => {
  switch (direction) {
    case 0:
      return "双向同步";
    case 1:
      return "上传 (本地 → 远程)";
    case 2:
      return "下载 (远程 → 本地)";
    default:
      return "未知";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss");
};

const showAddBindingForm = () => {
  showAddForm.value = true;
};

const cancelAddBinding = () => {
  showAddForm.value = false;
  newBinding.value = {
    deviceId: props.deviceId,
    localPath: "",
    remotePath: "",
    direction: 0,
  };
};

const handleAddBinding = async () => {
  try {
    const response = await boundMenuService.createBinding(newBinding.value);
    if (response && response.code === 200) {
      ElMessage.success("添加绑定成功");
      showAddForm.value = false;
      newBinding.value = {
        deviceId: props.deviceId,
        localPath: "",
        remotePath: "",
        direction: 0,
      };
      loadBindings(); // 重新加载绑定列表
    } else {
      ElMessage.error("添加绑定失败: " + (response?.message || "未知错误"));
    }
  } catch (error) {
    console.error("添加绑定出错:", error);
    ElMessage.error("添加绑定失败: " + error.message);
  }
};

const handleDeleteBinding = async (binding) => {
  try {
    if (!confirm(`确定要删除此绑定目录吗？`)) return;

    const response = await boundMenuService.removeBinding(binding.id);
    if (response && response.code === 200) {
      ElMessage.success("删除绑定成功");
      loadBindings(); // 重新加载绑定列表
      emit("refresh"); // 通知父组件刷新
    } else {
      ElMessage.error("删除绑定失败: " + (response?.message || "未知错误"));
    }
  } catch (error) {
    console.error("删除绑定出错:", error);
    ElMessage.error("删除绑定失败: " + error.message);
  }
};

const handleClose = () => {
  emit("update:modelValue", false);
};

// 打开目录选择对话框
const openFolderSelectDialog = () => {
  showFolderSelectDialog.value = true;
};

// 处理目录选择结果
const handleFolderSelect = (menu) => {
  // newBinding.remotePath = menu.displayPath;
  newBinding.value = {
    ...newBinding.value,
    remotePath: menu.displayPath
  };
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
  max-width: 700px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
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
  margin-bottom: 16px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-icon {
  color: #94a3b8;
  margin-bottom: 16px;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 24px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar h4 {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 14px;
}

/* 绑定列表 */
.bound-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bound-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.bound-info {
  flex: 1;
}

.bound-paths {
  margin-bottom: 8px;
}

.path-item {
  margin-bottom: 4px;
}

.path-label {
  font-weight: 500;
  color: #64748b;
  margin-right: 8px;
}

.path-value {
  color: #1e293b;
  font-family: monospace;
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.bound-details {
  display: flex;
  gap: 16px;
}

.detail-label {
  color: #64748b;
  margin-right: 4px;
}

.detail-value {
  color: #1e293b;
}

.bound-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn.delete:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

/* 添加绑定表单 */
.add-binding-form {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.add-binding-form h4 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #1f2937;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #1f2937;
}

.input-with-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.browse-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.browse-btn:hover {
  background-color: #e2e8f0;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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