import type { MenuDomain } from '../domain/MenuDomain';
import type { FileDomain } from '../domain/FileDomain';

export interface MenuVO {
    total: number
    pageNum: number
    pageSize: number
    subMenuList: MenuDomain[]
    subFileList: FileDomain[]
}