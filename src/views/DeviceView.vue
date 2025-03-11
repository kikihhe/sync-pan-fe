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
            <th>Secret Key</th>
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
                  'status-healthy': device.status === 'healthy',
                  'status-dead': device.status === 'dead',
                }"
              >
                {{ device.status === "healthy" ? "健康" : "死亡" }}
              </span>
            </td>
            <td class="secret-key">
              <span>{{ maskSecretKey(device.secretKey) }}</span>
              <button class="copy-btn" @click="copySecretKey(device.secretKey)">
                <Copy :size="14" />
              </button>
            </td>
            <td>{{ formatDate(device.lastSyncTime) }}</td>
            <td class="actions-cell">
              <button
                class="action-btn"
                :class="{ disabled: device.status === 'dead' }"
                @click="handleStopSync(device)"
                :disabled="device.status === 'dead'"
              >
                <Pause :size="16" />
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
        :class="{ disabled: contextMenu.item?.status === 'dead' }"
        @click="handleContextMenuAction('stopSync')"
      >
        <Pause :size="16" />
        停止同步
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
            'status-healthy': deviceDetails.device?.status === 'healthy',
            'status-dead': deviceDetails.device?.status === 'dead',
          }"
        >
          {{ deviceDetails.device?.status === "healthy" ? "健康" : "死亡" }}
        </span>
      </div>
      <div class="details-content">
        <div class="details-item">
          <span class="details-label">设备ID:</span>
          <span class="details-value">{{ deviceDetails.device?.id }}</span>
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
            deviceDetails.device?.ipAddress
          }}</span>
        </div>
        <div class="details-item">
          <span class="details-label">操作系统:</span>
          <span class="details-value">{{ deviceDetails.device?.os }}</span>
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
  </div>
</template>
  
  <script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  Search,
  PlusCircle,
  Pause,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";
import { format } from "date-fns";

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

// 模拟数据
const mockDevices = [
  {
    id: 1,
    name: "家庭PC",
    status: "healthy",
    secretKey: "sk_live_51NXwDbGIvkZdkvTuGipK3Y8aqtPVdh",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 5), // 5分钟前
    ipAddress: "192.168.1.100",
    os: "Windows 11",
    createdTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30天前
  },
  {
    id: 2,
    name: "工作笔记本",
    status: "healthy",
    secretKey: "sk_live_51NXwDbGIvkZdkvTuHjpL4Z9brqQWei",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
    ipAddress: "192.168.1.101",
    os: "macOS Sonoma",
    createdTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15天前
  },
  {
    id: 3,
    name: "旧手机",
    status: "dead",
    secretKey: "sk_live_51NXwDbGIvkZdkvTuIkqM5A0csrRXfj",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10天前
    ipAddress: "192.168.1.102",
    os: "Android 12",
    createdTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60天前
  },
  {
    id: 4,
    name: "服务器",
    status: "healthy",
    secretKey: "sk_live_51NXwDbGIvkZdkvTuJlrN6B1dtsSYgk",
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 2), // 2分钟前
    ipAddress: "192.168.1.103",
    os: "Ubuntu 22.04",
    createdTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5天前
  },
];

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
const loadData = () => {
  // 模拟API调用
  setTimeout(() => {
    // 过滤
    let filteredDevices = [...mockDevices];
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
  }, 300);
};

const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const handleSort = () => {
  loadData();
};

const handleAddDevice = () => {
  // 实现添加设备逻辑
  console.log("添加设备");
};

const handleStopSync = (device) => {
  if (device.status === "dead") return;
  console.log("停止同步设备:", device.name);
};

const handleDeleteDevice = (device) => {
  console.log("删除设备:", device.name);
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
  if (action === "stopSync" && device.status !== "dead") {
    handleStopSync(device);
  } else if (action === "delete") {
    handleDeleteDevice(device);
  }
  contextMenu.value.show = false;
};

const hideContextMenu = (event) => {
  if (!event.target.closest(".context-menu")) {
    contextMenu.value.show = false;
  }
};

const showDeviceDetails = (device) => {
  // 获取鼠标位置
  const x = event.clientX + 10;
  const y = event.clientY + 10;

  deviceDetails.value = {
    show: true,
    x,
    y,
    device,
  };
};

const hideDeviceDetails = () => {
  deviceDetails.value.show = false;
};

const maskSecretKey = (key) => {
  if (!key) return "";
  return key.substring(0, 8) + "..." + key.substring(key.length - 4);
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