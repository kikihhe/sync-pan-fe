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
  

export const menuService = {
    getSubMenuList,
    addMenu,
    updateMenu
}