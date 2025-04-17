import httpClient from '../utils/ajax'

// 获取子目录列表
export const getSubMenuList = async (params) => {
    // 直接使用传入的参数对象
    const res = await httpClient.post('/menu/getSubMenuList', {
        pageNum: params.pageNum,
        pageSize: params.pageSize,
        menuId: params.menuId,
        name: params.name,
        sortField: params.sortField,
        desc: params.desc,
        type: params.type
    });
    return res;
};

// 添加目录
export const addMenu = async (params) => {
    return await httpClient.post('/menu/addMenu', params);
}

// 更新目录名称
export const updateMenu = async (data) => {
    return await httpClient.post("/menu/updateMenu", data)
}

// 删除目录
export const deleteMenu = async (menuId) => {
    return await httpClient.post("/menu/deleteMenu?menuId=" + menuId)
}

// 批量创建目录
export const batchCreateDirectories = async (directoryTree) => {
    // 确保displayPath格式正确
    ensureDisplayPath(directoryTree)
    return await httpClient.post('/menu/batchAddMenu', directoryTree)
}
// 确保displayPath格式正确
const ensureDisplayPath = (node) => {
    // 确保displayPath以/开头
    if (!node.displayPath.startsWith('/')) {
      node.displayPath = '/' + node.displayPath
    }
    
    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        // 确保子节点的displayPath是基于父节点的
        if (!child.displayPath) {
          child.displayPath = `${node.displayPath}/${child.menuName}`
        }
        ensureDisplayPath(child)
      }
    }
}
  
// 构建目录树结构
export const buildDirectoryTree = (rootFolderName, parentMenuId, baseMenuLevel, directories) => {
    // 创建一个路径到节点的映射
    const pathMap = new Map()

    // 添加根目录
    const rootDir = {
        menuName: rootFolderName,
        parentId: parentMenuId,
        menuLevel: baseMenuLevel,
        displayPath: `/${rootFolderName}`,
        children: [],
        path: rootFolderName // 用于映射
    }

    pathMap.set(rootFolderName, rootDir)

    // 按层级排序目录
    const sortedDirs = [...directories].sort((a, b) => a.level - b.level)

    // 处理子目录
    for (const dir of sortedDirs) {
        const pathParts = dir.path.split('/')
        const parentPath = pathParts.slice(0, -1).join('/')
        const parentDir = pathMap.get(parentPath)

        if (parentDir) {
            const newDir = {
                menuName: dir.name,
                parentId: null, // 将由后端填充
                menuLevel: parentDir.menuLevel + 1, // 确保 menuLevel 是连续的
                displayPath: `${parentDir.displayPath}/${dir.name}`,
                children: [],
                path: dir.path // 用于映射
            }

            parentDir.children.push(newDir)
            pathMap.set(dir.path, newDir)
        }
    }

    return rootDir
}

// 处理目录ID映射
export const processDirectoryMap = (directoryResponse) => {
    const directoryMap = new Map()

    const processDirMap = (dir, map) => {
        map.set(dir.path, dir.id)

        if (dir.children && dir.children.length > 0) {
            for (const child of dir.children) {
                processDirMap(child, map)
            }
        }
    }

    processDirMap(directoryResponse, directoryMap)
    return directoryMap
}

// 检查目录冲突
export const checkConflict = async (menuId) => {
    const res = await httpClient.post('/menu/checkConflict?menuId=' + menuId)
    console.log(res)
    return res
}

export const menuService = {
    getSubMenuList,
    addMenu,
    updateMenu,
    deleteMenu,
    batchCreateDirectories,
    buildDirectoryTree,
    processDirectoryMap,
    checkConflict
}