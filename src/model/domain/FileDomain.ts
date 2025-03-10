export interface FileDomain {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  storageType: string;
  menuId: number;
  owner: string;
  identifier: string;
  realPath: string;
  createTime: string;
  updateTime: string;
  deleted: boolean;
}