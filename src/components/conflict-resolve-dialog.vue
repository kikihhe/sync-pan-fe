<template>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="show" class="modal-mask">
          <div class="modal-container">
            <div class="modal-header">
              <h3 class="modal-title">解决冲突</h3>
              <button class="btn-close" @click="handleClose">
                <X :size="20" />
              </button>
            </div>
  
            <div class="modal-content">
              <div class="conflict-container">
                <!-- 本地版本 -->
                <div class="conflict-section local">
                  <h4 class="section-title">本地版本</h4>
                  <div class="conflict-items">
                    <template v-if="conflicts[1]">
                      <!-- 文件冲突 -->
                      <div v-for="file in conflicts[1].fileConflictVOList" :key="file.file.id" 
                           :class="['conflict-item', file.type === 1 ? 'added' : 'deleted']">
                        <File v-if="file.file.fileType" :size="16" class="item-icon" />
                        <Folder v-else :size="16" class="item-icon" />
                        <span class="item-name">{{ file.file.fileName }}</span>
                        <span class="conflict-type">{{ file.type === 1 ? '新增' : '删除' }}</span>
                        
                        <!-- 添加向右箭头按钮 -->
                        <button class="arrow-btn right" @click="moveToMerged('local', 'file', file)">
                          <ChevronRight :size="16" />
                        </button>
                      </div>
                      
                      <!-- 目录冲突 -->
                      <div v-for="menu in conflicts[1].menuConflictVOList" :key="menu.menu.id"
                           :class="['conflict-item', menu.type === 1 ? 'added' : 'deleted']">
                        <Folder :size="16" class="item-icon" />
                        <span class="item-name">{{ menu.menu.menuName }}</span>
                        <span class="conflict-type">{{ menu.type === 1 ? '新增' : '删除' }}</span>
                        
                        <!-- 添加向右箭头按钮 -->
                        <button class="arrow-btn right" @click="moveToMerged('local', 'menu', menu)">
                          <ChevronRight :size="16" />
                        </button>
                      </div>
                    </template>
                  </div>
                </div>
  
                <!-- 合并结果 -->
                <div class="conflict-section merged">
                  <h4 class="section-title">合并结果</h4>
                  <div class="conflict-items">
                    <!-- 显示合并后的文件 -->
                    <div v-for="(item, index) in mergedItems" :key="index"
                         :class="['conflict-item', item.type === 1 ? 'added' : 'deleted']">
                      <File v-if="item.itemType === 'file' && item.item.file.fileType" :size="16" class="item-icon" />
                      <Folder v-else :size="16" class="item-icon" />
                      <span class="item-name">
                        {{ item.itemType === 'file' ? item.item.file.fileName : item.item.menu.menuName }}
                      </span>
                      <span class="conflict-type">{{ item.type === 1 ? '新增' : '删除' }}</span>
                      
                      <!-- 添加移除按钮 -->
                      <button class="remove-btn" @click="removeFromMerged(index)">
                        <X :size="16" />
                      </button>
                    </div>
                  </div>
                </div>
  
                <!-- 云端版本 -->
                <div class="conflict-section remote">
                  <h4 class="section-title">云端版本</h4>
                  <div class="conflict-items">
                    <template v-if="conflicts[0]">
                      <!-- 文件冲突 -->
                      <div v-for="file in conflicts[0].fileConflictVOList" :key="file.file.id"
                           :class="['conflict-item', file.type === 1 ? 'added' : 'deleted']">
                        <!-- 添加向左箭头按钮 -->
                        <button class="arrow-btn left" @click="moveToMerged('remote', 'file', file)">
                          <ChevronLeft :size="16" />
                        </button>
                        <File v-if="file.file.fileType" :size="16" class="item-icon" />
                        <Folder v-else :size="16" class="item-icon" />
                        <span class="item-name">{{ file.file.fileName }}</span>
                        <span class="conflict-type">{{ file.type === 1 ? '新增' : '删除' }}</span>
                        
                        <!-- 添加向左箭头按钮
                        <button class="arrow-btn left" @click="moveToMerged('remote', 'file', file)">
                          <ChevronLeft :size="16" />
                        </button> -->
                      </div>
                      
                      <!-- 目录冲突 -->
                      <div v-for="menu in conflicts[0].menuConflictVOList" :key="menu.menu.id"
                           :class="['conflict-item', menu.type === 1 ? 'added' : 'deleted']">
                        <Folder :size="16" class="item-icon" />
                        <span class="item-name">{{ menu.menu.menuName }}</span>
                        <span class="conflict-type">{{ menu.type === 1 ? '新增' : '删除' }}</span>
                        
                        <!-- 添加向左箭头按钮 -->
                        <button class="arrow-btn left" @click="moveToMerged('remote', 'menu', menu)">
                          <ChevronLeft :size="16" />
                        </button>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="modal-footer">
              <button class="btn btn-cancel" @click="handleClose">取消</button>
              <button class="btn btn-merge" @click="handleMerge">合并</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
  
  <script setup>
  import { File, Folder, X, ChevronLeft, ChevronRight } from 'lucide-vue-next';
  import { defineProps, defineEmits, ref } from 'vue';
  
  const props = defineProps({
    show: {
      type: Boolean,
      required: true
    },
    conflicts: {
      type: Array,
      required: true
    }
  });
  
  const emit = defineEmits(['close', 'merge']);
  
  // 存储合并结果的数组
  const mergedItems = ref([]);
  
  // 将项目移动到合并结果
  const moveToMerged = (source, itemType, item) => {
    // 检查项目是否已经在合并结果中
    const existingIndex = mergedItems.value.findIndex(mergedItem => {
      if (itemType === 'file' && mergedItem.itemType === 'file') {
        return mergedItem.item.file.id === item.file.id;
      } else if (itemType === 'menu' && mergedItem.itemType === 'menu') {
        return mergedItem.item.menu.id === item.menu.id;
      }
      return false;
    });
  
    // 如果项目已经存在，则不重复添加
    if (existingIndex === -1) {
      mergedItems.value.push({
        source, // 'local' 或 'remote'
        itemType, // 'file' 或 'menu'
        item,
        type: item.type // 1 表示新增，其他值表示删除
      });
    }
  };
  
  // 从合并结果中移除项目
  const removeFromMerged = (index) => {
    mergedItems.value.splice(index, 1);
  };
  
  const handleClose = () => {
    // 清空合并结果
    mergedItems.value = [];
    emit('close');
  };
  
  const handleMerge = () => {
    // 将合并结果传递给父组件
    emit('merge', mergedItems.value);
    // 清空合并结果
    mergedItems.value = [];
  };
  </script>
  
  <style scoped>
  .modal-mask {
    position: fixed;
    z-index: 9999;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-container {
    width: 90%;
    max-width: 1200px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }
  
  .btn-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
  }
  
  .btn-close:hover {
    background-color: #f3f4f6;
  }
  
  .modal-content {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }
  
  .conflict-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
    height: 100%;
  }
  
  .conflict-section {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .section-title {
    margin: 0;
    padding: 12px 16px;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-size: 1rem;
    font-weight: 500;
    color: #374151;
  }
  
  .conflict-items {
    padding: 16px;
    overflow-y: auto;
    max-height: 500px;
  }
  
  .conflict-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 4px;
    background-color: #f9fafb;
    position: relative;
  }
  
  .conflict-item.added {
    background-color: #ecfdf5;
    border: 1px solid #6ee7b7;
  }
  
  .conflict-item.deleted {
    background-color: #fef2f2;
    border: 1px solid #fca5a5;
  }
  
  .item-icon {
    margin-right: 8px;
    color: #6b7280;
  }
  
  .item-name {
    flex: 1;
    font-size: 0.875rem;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .conflict-type {
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 4px;
    background-color: #e5e7eb;
    margin-right: 8px;
  }
  
  .added .conflict-type {
    background-color: #d1fae5;
    color: #059669;
  }
  
  .deleted .conflict-type {
    background-color: #fee2e2;
    color: #dc2626;
  }
  
  /* 箭头按钮样式 */
  .arrow-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .arrow-btn:hover {
    background-color: #f3f4f6;
    color: #2563eb;
  }
  
  /* 移除按钮样式 */
  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .remove-btn:hover {
    background-color: #fee2e2;
    color: #dc2626;
  }
  
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-cancel {
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
  }
  
  .btn-cancel:hover {
    background-color: #e5e7eb;
  }
  
  .btn-merge {
    background-color: #2563eb;
    border: 1px solid #1d4ed8;
    color: white;
  }
  
  .btn-merge:hover {
    background-color: #1d4ed8;
  }
  
  /* 过渡动画 */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
  </style>