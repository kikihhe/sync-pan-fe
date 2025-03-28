<template>
  <div class="device-view">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search class="search-icon" :size="20" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索设备名称..."
          />
          <button class="search-btn" @click="handleSearch">搜索</button>
        </div>
      </div>

      <div class="toolbar-right">
        <div class="filter-group">
          <select v-model="sortBy" @change="handleSort" class="filter-select">
            <option value="createdTimeDesc">创建时间 (最新)</option>
            <option value="createdTimeAsc">创建时间 (最早)</option>
          </select>
        </div>

        <div class="action-group">
          <button class="add-btn" @click="handleAddDevice">
            <PlusCircle :size="20" />
            添加设备
          </button>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <table class="device-table">
        <thead>
          <tr>
            <th class="checkbox-cell">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>设备名</th>
            <th>状态</th>
            <th>密钥名称</th>
            <th>最近同步时间</th>
            <th class="actions-cell">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="device in displayedDevices"
            :key="device.id"
            @contextmenu.prevent="showContextMenu($event, device)"
            @mouseenter="showDeviceDetails(device)"
            @mouseleave="hideDeviceDetails"
          >
            <td class="checkbox-cell">
              <input
                type="checkbox"
                v-model="selectedDevices"
                :value="device.id"
              />
            </td>
            <td>{{ device.name }}</td>
            <td>
              <span
                class="status-badge"
                :class="{
                  'status-healthy': device.status === DEVICE_STATUS.HEALTHY,
                  'status-dead': device.status === DEVICE_STATUS.DEAD,
                  'status-paused': device.status === DEVICE_STATUS.PAUSED,
                  'status-register': device.status === DEVICE_STATUS.REGISTER,
                }"
              >
                {{
                  device.status === DEVICE_STATUS.HEALTHY
                    ? "健康"
                    : device.status === DEVICE_STATUS.PAUSED
                    ? "暂停"
                    : device.status === DEVICE_STATUS.REGISTER
                    ? "注册"
                    : "死亡"
                }}
              </span>
            </td>
            <td class="secret-key">
              <span>{{ maskSecretKey(device.secretKey) }}</span>
            </td>
            <td>{{ formatDate(device.lastSyncTime) }}</td>
            <td class="actions-cell">
              <button
                class="action-btn"
                :class="{ disabled: device.status === DEVICE_STATUS.DEAD }"
                @click="handleStopSync(device)"
                :disabled="device.status === DEVICE_STATUS.DEAD"
              >
                <Pause :size="16" />
              </button>
              <button
                class="action-btn"
                @click="handleViewBindings(device)"
                title="查看绑定目录"
              >
                <FolderOpen :size="16" />
              </button>
              <button
                class="action-btn delete"
                @click="handleDeleteDevice(device)"
              >
                <Trash2 :size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="displayedDevices.length === 0">
            <td colspan="6" class="empty-message">暂无设备</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <div class="pagination-info">共 {{ total }} 项</div>
      <div class="pagination-controls">
        <button
          class="page-btn"
          :disabled="currentPage === 1"
          @click="handlePageChange(currentPage - 1)"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="handlePageChange(currentPage + 1)"
        >
          <ChevronRight :size="16" />
        </button>
        <select
          v-model="pageSize"
          @change="handlePageSizeChange"
          class="page-size-select"
        >
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div
        class="context-menu-item"
        :class="{ disabled: contextMenu.item?.status === DEVICE_STATUS.DEAD }"
        @click="handleContextMenuAction('stopSync')"
      >
        <Pause :size="16" />
        停止同步
      </div>
      <div
        class="context-menu-item"
        @click="handleContextMenuAction('viewBindings')"
      >
        <FolderOpen :size="16" />
        查看绑定目录
      </div>
      <div
        class="context-menu-item delete"
        @click="handleContextMenuAction('delete')"
      >
        <Trash2 :size="16" />
        删除设备
      </div>
    </div>

    <!-- 设备详情悬浮框 -->
    <div
      v-if="deviceDetails.show"
      class="device-details"
      :style="{ top: deviceDetails.y + 'px', left: deviceDetails.x + 'px' }"
    >
      <div class="details-header">
        <h3>{{ deviceDetails.device?.name }}</h3>
        <span
          class="status-badge"
          :class="{
            'status-healthy':
              deviceDetails.device?.status === DEVICE_STATUS.HEALTHY,
            'status-dead': deviceDetails.device?.status === DEVICE_STATUS.DEAD,
            'status-paused':
              deviceDetails.device?.status === DEVICE_STATUS.PAUSED,
            'status-register':
              deviceDetails.device?.status === DEVICE_STATUS.REGISTER,
          }"
        >
          {{
            deviceDetails.device?.status === DEVICE_STATUS.HEALTHY
              ? "健康"
              : deviceDetails.device?.status === DEVICE_STATUS.PAUSED
              ? "暂停"
              : deviceDetails.device?.status === DEVICE_STATUS.REGISTER
              ? "注册"
              : "死亡"
          }}
        </span>
      </div>
      <div class="details-content">
        <div class="details-item">
          <span class="details-label">设备ID:</span>
          <span class="details-value">{{ deviceDetails.device?.deviceKey }}</span>
        </div>
        <div class="details-item">
          <span class="details-label">Secret Key:</span>
          <span class="details-value">{{
            deviceDetails.device?.secretKey
          }}</span>
        </div>
        <div class="details-item">
          <span class="details-label">IP地址:</span>
          <span class="details-value">{{
            deviceDetails.device?.ipAddress || '-'
          }}</span>
        </div>
        <div class="details-item">
          <span class="details-label">操作系统:</span>
          <span class="details-value">{{ deviceDetails.device?.os || '-' }}</span>
        </div>
        <div class="details-item">
          <span class="details-label">创建时间:</span>
          <span class="details-value">{{
            formatDate(deviceDetails.device?.createdTime)
          }}</span>
        </div>
        <div class="details-item">
          <span class="details-label">最近同步:</span>
          <span class="details-value">{{
            formatDate(deviceDetails.device?.lastSyncTime)
          }}</span>
        </div>
      </div>
    </div>

    <!-- 设备添加对话框 -->
    <DeviceAddDialog
      v-model="showAddDeviceDialog"
      :device-key="newDeviceKey"
      @confirm="confirmAddDevice"
      @cancel="cancelAddDevice"
    />
    
    <!-- 设备绑定目录对话框 -->
    <DeviceBoundDialog
      v-model="showBoundDialog"
      :device-id="selectedDeviceId"
      :device-name="selectedDeviceName"
      @refresh="loadData"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  PlusCircle,
  Pause,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from "lucide-vue-next";
import { format } from "date-fns";
import {
  getDeviceList,
  addDevice,
  registerDevice,
  deleteDevice,
  stopDeviceSync,
} from "../api/DeviceService";
import DeviceAddDialog from "../components/device-add-dialog.vue";
import DeviceBoundDialog from "../components/device-bound-dialog.vue";

// 状态
const searchQuery = ref("");
const sortBy = ref("createdTimeDesc");
const selectedDevices = ref([]);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const devices = ref([]);
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  item: null,
});
const deviceDetails = ref({
  show: false,
  x: 0,
  y: 0,
  device: null,
});

// 设备添加对话框状态
const showAddDeviceDialog = ref(false);
const newDeviceKey = ref("");

// 设备绑定目录对话框状态
const showBoundDialog = ref(false);
const selectedDeviceId = ref(null);
const selectedDeviceName = ref("");

// 设备状态常量
const DEVICE_STATUS = {
  DEAD: 0,
  HEALTHY: 1,
  PAUSED: 2,
  REGISTER: 3,
};

// 计算属性
const isAllSelected = computed(() => {
  return (
    displayedDevices.value.length > 0 &&
    selectedDevices.value.length === displayedDevices.value.length
  );
});

const totalPages = computed(() => {
  return Math.ceil(total.value / pageSize.value);
});

const displayedDevices = computed(() => {
  return devices.value;
});

// 方法
const loadData = async () => {
  try {
    // 调用API获取设备列表
    const response = await getDeviceList();

    // 检查API响应
    if (response && response.data) {
      // 转换后端数据格式为前端需要的格式
      const apiDevices = response.data.map((device) => ({
        id: device.id,
        name: device.deviceName,
        status: device.status, // 0-死亡，1-健康，2-暂停
        secretKey: device.secretKey, // 设备密钥key
        lastSyncTime: device.lastHeartbeat,
        deviceKey: device.deviceKey,
        createdTime: device.createTime,
      }));

      // 过滤
      let filteredDevices = [...apiDevices];
      if (searchQuery.value) {
        filteredDevices = filteredDevices.filter((device) =>
          device.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }

      // 排序
      if (sortBy.value === "createdTimeDesc") {
        filteredDevices.sort(
          (a, b) => new Date(b.createdTime) - new Date(a.createdTime)
        );
      } else if (sortBy.value === "createdTimeAsc") {
        filteredDevices.sort(
          (a, b) => new Date(a.createdTime) - new Date(b.createdTime)
        );
      }

      // 分页
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;

      devices.value = filteredDevices.slice(start, end);
      total.value = filteredDevices.length;
    } else {
      console.error("获取设备列表失败:", response);
      devices.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("获取设备列表出错:", error);
    devices.value = [];
    total.value = 0;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const handleSort = () => {
  loadData();
};

const handleAddDevice = () => {
  // 生成一个临时的设备密钥，将在确认添加时使用
  newDeviceKey.value = generateRandomDeviceKey();
  // 显示设备添加对话框
  showAddDeviceDialog.value = true;
};

// 生成随机设备密钥
const generateRandomDeviceKey = () => {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  );
};

// 确认添加设备
const confirmAddDevice = async (deviceData) => {
  try {
    // 调用API注册设备
    const response = await registerDevice(deviceData.name, deviceData.secretId);
    if (response && response.code === 200) {
      alert("添加设备成功");
      loadData(); // 重新加载设备列表
    } else {
      alert("添加设备失败: " + (response?.msg || "未知错误"));
    }
  } catch (error) {
    console.error("添加设备出错:", error);
    alert("添加设备失败: " + error.message);
  }
};

// 取消添加设备
const cancelAddDevice = () => {
  showAddDeviceDialog.value = false;
  newDeviceKey.value = "";
};

const handleStopSync = async (device) => {
  if (device.status === DEVICE_STATUS.DEAD) return;
  try {
    const response = await stopDeviceSync(device.id);
    if (response && response.code === 200) {
      alert("停止同步成功");
      loadData(); // 重新加载设备列表
    } else {
      alert("停止同步失败: " + (response?.msg || "未知错误"));
    }
  } catch (error) {
    console.error("停止同步出错:", error);
    alert("停止同步失败: " + error.message);
  }
};

const handleDeleteDevice = async (device) => {
  try {
    if (!confirm(`确定要删除设备 "${device.name}" 吗？`)) return;

    const response = await deleteDevice(device.id);
    if (response && response.code === 200) {
      alert("删除设备成功");
      loadData(); // 重新加载设备列表
    } else {
      alert("删除设备失败: " + (response?.msg || "未知错误"));
    }
  } catch (error) {
    console.error("删除设备出错:", error);
    alert("删除设备失败: " + error.message);
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  loadData();
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  loadData();
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedDevices.value = [];
  } else {
    selectedDevices.value = displayedDevices.value.map((device) => device.id);
  }
};

const showContextMenu = (event, device) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    item: device,
  };
};

const handleContextMenuAction = (action) => {
  const device = contextMenu.value.item;
  if (action === "stopSync" && device.status !== DEVICE_STATUS.DEAD) {
    handleStopSync(device);
  } else if (action === "delete") {
    handleDeleteDevice(device);
  } else if (action === "viewBindings") {
    handleViewBindings(device);
  }
  contextMenu.value.show = false;
};

// 查看设备绑定目录
const handleViewBindings = (device) => {
  // 确保deviceId是数字类型
  selectedDeviceId.value = Number(device.id);
  selectedDeviceName.value = device.name;
  showBoundDialog.value = true;
};

const hideContextMenu = (event) => {
  if (!event.target.closest(".context-menu")) {
    contextMenu.value.show = false;
  }
};

// 定时器引用
const detailsTimer = ref(null);

const showDeviceDetails = (device) => {
  // 获取鼠标位置
  const x = event.clientX + 10;
  const y = event.clientY + 10;

  // 清除之前的定时器
  if (detailsTimer.value) {
    clearTimeout(detailsTimer.value);
  }

  // 设置5秒延时显示
  detailsTimer.value = setTimeout(() => {
    deviceDetails.value = {
      show: true,
      x,
      y,
      device,
    };
  }, 5000);
};

const hideDeviceDetails = () => {
  // 清除定时器
  if (detailsTimer.value) {
    clearTimeout(detailsTimer.value);
    detailsTimer.value = null;
  }
  deviceDetails.value.show = false;
};

// 在组件卸载时清除定时器
onUnmounted(() => {
  if (detailsTimer.value) {
    clearTimeout(detailsTimer.value);
  }
});

const maskSecretKey = (key) => {
  if (!key) return "";

  return key;
};

const copySecretKey = (key) => {
  navigator.clipboard
    .writeText(key)
    .then(() => {
      console.log("Secret Key 已复制到剪贴板");
    })
    .catch((err) => {
      console.error("复制失败:", err);
    });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return format(new Date(dateStr), "yyyy-MM-dd HH:mm:ss");
};

// 生命周期钩子
onMounted(() => {
  loadData();
  document.addEventListener("click", hideContextMenu);
});

onUnmounted(() => {
  document.removeEventListener("click", hideContextMenu);
});
</script>

<style scoped>
.device-view {
  padding: 16px;
  background-color: #f8fafc;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background-color: white;
  padding: 12px;
  border-radius: 4px;
}

.toolbar-left {
  flex: 1;
  margin-right: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 4px;
  padding: 6px 12px;
  width: 300px;
}

.search-icon {
  color: #64748b;
  margin-right: 8px;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
  color: #1e293b;
  font-size: 14px;
}

.search-btn {
  margin-left: 8px;
  padding: 4px 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #1e293b;
  cursor: pointer;
  font-size: 14px;
}

.action-group {
  display: flex;
  gap: 8px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.add-btn:hover {
  background-color: #4338ca;
}

/* 表格样式 */
.table-container {
  background-color: white;
  border-radius: 4px;
  margin-bottom: 16px;
}

.device-table {
  width: 100%;
  border-collapse: collapse;
}

.device-table th,
.device-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.device-table th {
  background-color: #f8fafc;
  color: #64748b;
  font-weight: 500;
}

.checkbox-cell {
  width: 40px;
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.status-healthy {
  background-color: #dcfce7;
  color: #16a34a;
}

.status-dead {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-paused {
  background-color: #fef3c7;
  color: #d97706;
}

.status-register {
  background-color: #e0f2fe;
  color: #0284c7;
}

.secret-key {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  padding: 2px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.copy-btn:hover {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.actions-cell {
  width: 80px;
  text-align: right;
}

.action-btn {
  padding: 4px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.action-btn:hover:not(.disabled) {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.action-btn.delete:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: white;
  border-radius: 4px;
}

.pagination-info {
  color: #64748b;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 6px;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  padding: 0 8px;
  color: #64748b;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 1000;
  font-size: 14px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #1e293b;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.context-menu-item:hover:not(.disabled) {
  background-color: #f1f5f9;
  color: #3b82f6;
}

.context-menu-item.delete:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 设备详情悬浮框 */
.device-details {
  position: fixed;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 16px;
  z-index: 1000;
  width: 300px;
  font-size: 14px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.details-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.details-item {
  display: flex;
  justify-content: space-between;
}

.details-label {
  color: #64748b;
  font-weight: 500;
}

.details-value {
  color: #1e293b;
}

.empty-message {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
}
</style>
