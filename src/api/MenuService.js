import httpClient from '../utils/ajax'


export const getSubMenuList = async (params) => {
    // 直接使用传入的参数对象
    const res = await httpClient.post('/menu/getSubMenuList', {
            pageNum: params.pageNum,
            pageSize: params.pageSize,
            menuId: params.menuId
    });
    return res;
};

export const menuService = {
    getSubMenuList
}