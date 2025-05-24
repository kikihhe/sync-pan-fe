<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-mask">
        <div class="modal-container">
          <!-- 加载中遮罩 -->
          <div v-if="isLoading" class="loading-overlay">
            <div class="loading-content">
              <Loader :size="32" class="loading-icon" />
              <p class="loading-text">{{ loadingMessage }}</p>
            </div>
          </div>
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
                         :class="['conflict-item', getTypeClass(file.type)]">
                      <File v-if="file.file.fileType" :size="16" class="item-icon" />
                      <Folder v-else :size="16" class="item-icon" />
                      <span class="item-name">{{ file.file.fileName }}</span>
                      <span class="conflict-type">{{ getTypeText(file.type) }}</span>
                      
                      <!-- 添加向右箭头按钮 -->
                      <button class="arrow-btn right" @click="moveToMerged('local', 'file', file)">
                        <ChevronRight :size="16" />
                      </button>
                    </div>
                    
                    <!-- 目录冲突 -->
                    <menu-conflict-item 
                      v-for="menu in conflicts[1].menuConflictVOList" 
                      :key="menu.menu.id"
                      :menu="menu"
                      source="local"
                      @move-to-merged="moveToMerged">
                      <template #action-button>
                        <button class="arrow-btn right" @click="moveToMerged('local', 'menu', menu)">
                          <ChevronRight :size="16" />
                        </button>
                      </template>
                    </menu-conflict-item>
                  </template>
                </div>
              </div>

              <!-- 合并结果 -->
              <div class="conflict-section merged">
                <h4 class="section-title">合并结果</h4>
                <div class="conflict-items">
                  <!-- 显示合并后的文件和目录（树形结构） -->
                  <template v-for="(item, index) in organizedMergedItems" :key="index">
                    <!-- 根级目录或文件 -->
                    <div 
                      :class="['conflict-item', getTypeClass(item.type)]"
                      :style="{ paddingLeft: item.level * 16 + 'px' }"
                    >
                      <!-- 展开/折叠按钮（仅对目录显示） -->
                      <button 
                        v-if="item.itemType === 'menu' && hasChildren(item.item.menu.id)" 
                        class="expand-btn" 
                        @click="toggleItemExpand(item.item.menu.id)"
                      >
                        <ChevronDown v-if="isExpanded(item.item.menu.id)" :size="16" />
                        <ChevronRight v-else :size="16" />
                      </button>
                      <span v-else class="expand-placeholder"></span>
                      
                      <File v-if="item.itemType === 'file' && item.item.file.fileType" :size="16" class="item-icon" />
                      <Folder v-else :size="16" class="item-icon" />
                      <span class="item-name">
                        {{ item.itemType === 'file' ? item.item.file.fileName : item.item.menu.menuName }}
                      </span>
                      <span class="conflict-type">已合并</span>
                      
                      <!-- 添加移除按钮 -->
                      <button class="remove-btn" @click="removeFromMerged(item.originalIndex)">
                        <X :size="16" />
                      </button>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 云端版本 -->
              <div class="conflict-section remote">
                <h4 class="section-title">云端版本</h4>
                <div class="conflict-items">
                  <template v-if="conflicts[0]">
                    <!-- 文件冲突 -->
                    <div v-for="file in conflicts[0].fileConflictVOList" :key="file.file.id"
                         :class="['conflict-item', getTypeClass(file.type)]">
                      <!-- 添加向左箭头按钮 -->
                      <button class="arrow-btn left" @click="moveToMerged('remote', 'file', file)">
                        <ChevronLeft :size="16" />
                      </button>
                      <File v-if="file.file.fileType" :size="16" class="item-icon" />
                      <Folder v-else :size="16" class="item-icon" />
                      <span class="item-name">{{ file.file.fileName }}</span>
                      <span class="conflict-type">{{ getTypeText(file.type) }}</span>
                      
                      <!-- 添加向左箭头按钮
                      <button class="arrow-btn left" @click="moveToMerged('remote', 'file', file)">
                        <ChevronLeft :size="16" />
                      </button> -->
                    </div>
                    
                    <!-- 目录冲突 -->
                    <menu-conflict-item 
                      v-for="menu in conflicts[0].menuConflictVOList" 
                      :key="menu.menu.id"
                      :menu="menu"
                      source="remote"
                      @move-to-merged="moveToMerged">
                      <template #action-button>
                        <button class="arrow-btn left" @click="moveToMerged('remote', 'menu', menu)">
                          <ChevronLeft :size="16" />
                        </button>
                      </template>
                    </menu-conflict-item>
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
import { File, Folder, X, ChevronLeft, ChevronRight, ChevronDown, Loader } from 'lucide-vue-next';
import { defineProps, defineEmits, ref, computed, watch } from 'vue';
import MenuConflictItem from './menu-conflict-item.vue';
import { resolveConflict, getResolvedConflict } from '../api/BoundMenuService';
import { ElMessage } from 'element-plus';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  conflicts: {
    type: Array,
    required: true
  },
  currentMenu: {
    type: Object,
    required: true
  },
  currentDirectoryId: {
    type: [Number, String, null],
    required: false,
    default: null
  }
});

const emit = defineEmits(['close', 'merge', 'refresh']);

// 存储合并结果的数组
const mergedItems = ref([]);

// 存储展开/折叠状态的集合
const expandedMenuIds = ref(new Set());

// 加载状态
const isLoading = ref(false);

// 加载提示信息
const loadingMessage = ref('');

// 获取文件或目录的所有父目录ID路径
const getParentMenuPath = (item, itemType, source) => {
  const path = [];
  let currentMenuId = null;
  
  // 获取当前项目的直接父目录ID
  if (itemType === 'file' && item.file.menuId) {
    currentMenuId = item.file.menuId;
    path.push(currentMenuId);
  } else if (itemType === 'menu' && item.menu.parentId) {
    currentMenuId = item.menu.parentId;
    path.push(currentMenuId);
  }
  
  // 递归查找所有上级目录
  if (currentMenuId) {
    const findParentMenus = (menuId) => {
      const parentMenu = findMenuById(menuId, source);
      if (parentMenu && parentMenu.menu.parentId) {
        path.push(parentMenu.menu.parentId);
        findParentMenus(parentMenu.menu.parentId);
      }
    };
    
    findParentMenus(currentMenuId);
  }
  
  return path;
};

// 根据ID查找目录
const findMenuById = (menuId, source) => {
  const conflictIndex = source === 'local' ? 1 : 0;
  const menuList = props.conflicts[conflictIndex]?.menuConflictVOList || [];
  return menuList.find(menu => menu.menu.id === menuId);
};

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
    // 先添加父目录（如果有且不在合并结果中）
    const parentIds = getParentMenuPath(item, itemType, source);
    parentIds.forEach(parentId => {
      const parentMenu = findMenuById(parentId, source);
      if (parentMenu) {
        const parentExistsIndex = mergedItems.value.findIndex(mergedItem => 
          mergedItem.itemType === 'menu' && mergedItem.item.menu.id === parentId
        );
        if (parentExistsIndex === -1) {
          mergedItems.value.push({
            source,
            itemType: 'menu',
            item: parentMenu,
            type: parentMenu.type
          });
        }
      }
    });

    // 添加当前项目
    mergedItems.value.push({
      source, // 'local' 或 'remote'
      itemType, // 'file' 或 'menu'
      item,
      type: item.type // 1 表示新增，2表示删除，3表示修改
    });
    
    // 如果是目录，递归添加子文件（但不自动添加子目录）
    if (itemType === 'menu' && item.subFileList && item.subFileList.length > 0) {
      item.subFileList.forEach(file => {
        moveToMerged(source, 'file', file);
      });
    }
  }
};

// 从合并结果中移除项目
const removeFromMerged = (index) => {
  const removedItem = mergedItems.value[index];
  mergedItems.value.splice(index, 1);
  
  // 如果移除的是目录，同时移除其所有子目录和子文件
  if (removedItem.itemType === 'menu') {
    // 找出并移除所有属于该目录的子目录
    const childMenuIds = getChildMenuIds(removedItem.item);
    if (childMenuIds.length > 0) {
      // 从后向前遍历，避免索引变化问题
      for (let i = mergedItems.value.length - 1; i >= 0; i--) {
        const item = mergedItems.value[i];
        if (item.itemType === 'menu' && childMenuIds.includes(item.item.menu.id)) {
          mergedItems.value.splice(i, 1);
        }
      }
    }
    
    // 找出并移除所有属于该目录及其子目录的文件
    const allMenuIds = [removedItem.item.menu.id, ...childMenuIds];
    // 从后向前遍历，避免索引变化问题
    for (let i = mergedItems.value.length - 1; i >= 0; i--) {
      const item = mergedItems.value[i];
      if (item.itemType === 'file' && item.item.file.menuId && allMenuIds.includes(item.item.file.menuId)) {
        mergedItems.value.splice(i, 1);
      }
    }
  }
  
  // 检查是否需要移除不再有子项的父目录
  checkAndRemoveEmptyParents();
};

// 检查并移除没有子项的父目录
const checkAndRemoveEmptyParents = () => {
  // 获取所有目录ID和文件所属的目录ID
  const usedMenuIds = new Set();
  
  // 收集所有文件所属的目录ID
  mergedItems.value.forEach(item => {
    if (item.itemType === 'file' && item.item.file.menuId) {
      usedMenuIds.add(item.item.file.menuId);
    } else if (item.itemType === 'menu') {
      // 对于目录，如果有父目录，将父目录ID添加到使用列表
      if (item.item.menu.parentId) {
        usedMenuIds.add(item.item.menu.parentId);
      }
    }
  });
  
  // 从后向前遍历，移除不再有子项的目录
  for (let i = mergedItems.value.length - 1; i >= 0; i--) {
    const item = mergedItems.value[i];
    if (item.itemType === 'menu' && !usedMenuIds.has(item.item.menu.id)) {
      // 这个目录没有子项，可以移除
      mergedItems.value.splice(i, 1);
    }
  }
};

// 获取目录的所有子目录ID
const getChildMenuIds = (menu) => {
  const ids = [];
  if (menu.submenuList && menu.submenuList.length > 0) {
    menu.submenuList.forEach(submenu => {
      ids.push(submenu.menu.id);
      // 递归获取子目录的ID
      const childIds = getChildMenuIds(submenu);
      ids.push(...childIds);
    });
  }
  return ids;
};

const handleClose = () => {
  // 清空合并结果
  mergedItems.value = [];
  // 清空展开状态
  expandedMenuIds.value.clear();
  emit('close');
};

// 判断目录是否有子项
const hasChildren = (menuId) => {
  return mergedItems.value.some(item => {
    if (item.itemType === 'file' && item.item.file.menuId) {
      return item.item.file.menuId === menuId;
    } else if (item.itemType === 'menu' && item.item.menu.parentId) {
      return item.item.menu.parentId === menuId;
    }
    return false;
  });
};

// 切换目录的展开/折叠状态
const toggleItemExpand = (menuId) => {
  if (expandedMenuIds.value.has(menuId)) {
    expandedMenuIds.value.delete(menuId);
  } else {
    expandedMenuIds.value.add(menuId);
  }
};

// 检查目录是否处于展开状态
const isExpanded = (menuId) => {
  return expandedMenuIds.value.has(menuId);
};

// 计算属性：将合并项目组织为树形结构
const organizedMergedItems = computed(() => {
  // 创建一个新数组来存储组织后的项目
  const result = [];
  
  // 首先找出所有根级项目（没有父级或父级不在合并结果中的项目）
  const rootItems = mergedItems.value.filter(item => {
    if (item.itemType === 'file') {
      // 如果是文件，检查其所属目录是否在合并结果中
      if (!item.item.file.menuId) return true; // 没有所属目录的文件是根级项目
      
      // 检查所属目录是否在合并结果中
      return !mergedItems.value.some(menuItem => 
        menuItem.itemType === 'menu' && menuItem.item.menu.id === item.item.file.menuId
      );
    } else if (item.itemType === 'menu') {
      // 如果是目录，检查其父目录是否在合并结果中
      if (!item.item.menu.parentId) return true; // 没有父目录的目录是根级项目
      
      // 检查父目录是否在合并结果中
      return !mergedItems.value.some(menuItem => 
        menuItem.itemType === 'menu' && menuItem.item.menu.id === item.item.menu.parentId
      );
    }
    return false;
  });
  
  // 递归函数：添加项目及其子项
  const addItemWithChildren = (item, level, originalIndex) => {
    // 添加当前项目
    result.push({
      ...item,
      level,
      originalIndex
    });
    
    // 如果是目录且处于展开状态，添加其子项
    if (item.itemType === 'menu' && isExpanded(item.item.menu.id)) {
      // 添加子目录
      mergedItems.value.forEach((childItem, childIndex) => {
        if (childItem.itemType === 'menu' && 
            childItem.item.menu.parentId === item.item.menu.id) {
          addItemWithChildren(childItem, level + 1, childIndex);
        }
      });
      
      // 添加子文件
      mergedItems.value.forEach((childItem, childIndex) => {
        if (childItem.itemType === 'file' && 
            childItem.item.file.menuId === item.item.menu.id) {
          result.push({
            ...childItem,
            level: level + 1,
            originalIndex: childIndex
          });
        }
      });
    }
  };
  
  // 处理所有根级项目
  rootItems.forEach((item, index) => {
    const originalIndex = mergedItems.value.findIndex(i => i === item);
    addItemWithChildren(item, 0, originalIndex);
  });
  
  return result;
});

const handleMerge = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = '正在解决冲突，请耐心等待...';

    const menuItems = [];
    const fileItems = [];

    // Use the prop passed from MyFileView.vue
    const currentMenuId = props.currentMenu?.id;

    mergedItems.value.forEach(item => {
      if (item.itemType === 'file') {
        // Construct file object matching backend File domain
        fileItems.push({
          id: item.item.file.id,
          fileName: item.item.file.fileName,
          fileSize: item.item.file.fileSize,
          fileType: item.item.file.fileType,
          storageType: item.item.file.storageType,
          menuId: item.item.file.menuId,
          owner: item.item.file.owner,
          identifier: item.item.file.identifier,
          realPath: item.item.file.realPath,
          displayPath: item.item.file.displayPath,
          source: 3 // Mark as merged
        });
      } else if (item.itemType === 'menu') {
        // Construct menu object matching backend Menu domain
        menuItems.push({
          id: item.item.menu.id,
          menuName: item.item.menu.menuName,
          menuLevel: item.item.menu.menuLevel, // Ensure these exist or handle null
          parentId: item.item.menu.parentId,
          displayPath: item.item.menu.displayPath,
          owner: item.item.menu.owner,
          bound: item.item.menu.bound,
          source: 3 // Mark as merged
        });
      }
    });

    // Construct the DTO matching your backend
    const mergeData = {
      currentMenuId: currentMenuId, // Use the ID from the prop
      menuItems: menuItems,
      fileItems: fileItems
    };
    console.log('mergeData:', mergeData);
    
    const res = await resolveConflict(mergeData);

    if (res.code === 200) {
        ElMessage.success('冲突已成功解决！');
        emit('refresh'); 
        emit('close'); 
    } else {
        ElMessage.error(res.message || '解决冲突失败，请稍后重试。');
    }
  } catch (error) {
    console.error('解决冲突失败:', error);
    ElMessage.error(`解决冲突时发生错误: ${error.message || '未知错误'}`);
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

// 加载已解决的冲突
const loadResolvedConflicts = async () => {
  if (!props.currentMenu || !props.currentMenu.id) return;
  
  try {
    isLoading.value = true;
    loadingMessage.value = '正在加载已解决的冲突...';
    
    const res = await getResolvedConflict(props.currentMenu.id);
    
    if (res.code === 200 && res.data) {
      // 处理已解决的文件
      if (res.data.resolvedFileList && res.data.resolvedFileList.length > 0) {
        res.data.resolvedFileList.forEach(file => {
          // 构造与冲突文件格式相同的对象
          const resolvedFile = {
            source: 'resolved', // 标记为已解决
            itemType: 'file',
            item: {
              file: file,
              type: file.source === 3 ? 1 : 2 // 使用文件的source字段判断是新增还是删除
            }
          };
          
          // 添加到合并结果中
          mergedItems.value.push(resolvedFile);
        });
      }
      
      // 处理已解决的目录
      if (res.data.resolvedMenuList && res.data.resolvedMenuList.length > 0) {
        res.data.resolvedMenuList.forEach(menu => {
          // 构造与冲突目录格式相同的对象
          const resolvedMenu = {
            source: 'resolved', // 标记为已解决
            itemType: 'menu',
            item: {
              menu: menu,
              type: menu.source === 3 ? 1 : 2 // 使用目录的source字段判断是新增还是删除
            }
          };
          
          // 添加到合并结果中
          mergedItems.value.push(resolvedMenu);
        });
      }
      
      // 展开所有已解决的目录
      mergedItems.value.forEach(item => {
        if (item.itemType === 'menu') {
          expandedMenuIds.value.add(item.item.menu.id);
        }
      });
    }
  } catch (error) {
    console.error('加载已解决冲突失败:', error);
    ElMessage.error(`加载已解决冲突时发生错误: ${error.message || '未知错误'}`);
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    mergedItems.value = [];
    expandedMenuIds.value.clear();
    // 加载已解决的冲突
    loadResolvedConflicts();
  }
});

// 监听当前目录变化
watch(() => props.currentMenu?.id, (newVal, oldVal) => {
  if (newVal !== oldVal && props.show) {
    // 当前目录变化且对话框显示时，重新加载已解决的冲突
    mergedItems.value = [];
    expandedMenuIds.value.clear();
    loadResolvedConflicts();
  }
});

// 根据type获取对应的CSS类名
const getTypeClass = (type) => {
  switch(type) {
    case 1: return 'added';      // 新增 - 绿色
    case 2: return 'deleted';    // 删除 - 蓝色  
    case 3: return 'modified';   // 修改 - 黄色
    default: return 'added';
  }
};

// 根据type获取对应的文本
const getTypeText = (type) => {
  switch(type) {
    case 1: return '新增';
    case 2: return '删除';
    case 3: return '修改';
    default: return '新增';
  }
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
  transition: padding-left 0.2s ease;
}

.conflict-item.added {
  background-color: #ecfdf5;
  border: 1px solid #6ee7b7;
}

.conflict-item.deleted {
  background-color: #eff6ff;
  border: 1px solid #93c5fd;
}

.conflict-item.modified {
  background-color: #fef3c7;
  border: 1px solid #fbbf24;
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

.modified .conflict-type {
  background-color: #fef3c7;
  color: #d97706;
}

.deleted .conflict-type {
  background-color: #dbeafe;
  color: #2563eb;
}

/* 箭头按钮样式 */
.arrow-btn, .expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
}

.arrow-btn:hover, .expand-btn:hover {
  background-color: #f3f4f6;
  color: #2563eb;
}

/* 展开按钮占位符 */
.expand-placeholder {
  width: 24px;
  display: inline-block;
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
  background-color: #dbeafe;
  color: #2563eb;
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

/* 加载遮罩样式 */
.loading-overlay {
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(255, 255, 255, 0.8);
display: flex;
align-items: center;
justify-content: center;
z-index: 100;
border-radius: 8px;
}

.loading-content {
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
padding: 24px;
background-color: white;
border-radius: 8px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-icon {
animation: spin 1.5s linear infinite;
color: #3b82f6;
margin-bottom: 16px;
}

.loading-text {
font-size: 1rem;
color: #374151;
margin: 0;
}

@keyframes spin {
from {
  transform: rotate(0deg);
}
to {
  transform: rotate(360deg);
}
}