/**
 * 菜单数据结构
 */
export interface MenuDomain {
    id: number
    menuName: string
    menuLevel: number
    parentId: number
    owner: number
    createTime: string
    updateTime: string
    deleted: boolean
}
