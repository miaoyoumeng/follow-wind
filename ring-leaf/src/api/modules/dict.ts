/* ===== 字典 Namespace ===== */
export declare namespace DictNamespace {
  interface NamespaceItem {
    id: number;
    namespace: string;
    description: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
  }

  interface ListParams {
    keyword?: string;
    pageNum: number;
    pageSize: number;
  }

  interface CreateParams {
    namespace: string;
    description?: string;
  }

  interface UpdateParams {
    id: number;
    description: string;
  }
}

/* ===== 字典 Key-Value ===== */
export declare namespace DictKeyValue {
  interface KeyValueItem {
    id: number;
    key: string;
    value: string;
    description: string;
    updatedAt: string;
    updatedBy: string;
    isReferenced: boolean;
  }

  interface ListParams {
    namespace: string;
    keyword?: string;
  }

  interface CreateParams {
    namespace: string;
    key: string;
    value: string;
    description?: string;
  }

  interface UpdateParams {
    id: number;
    namespace: string;
    key: string;
    value: string;
    description?: string;
  }

  interface DeleteParams {
    id: number;
  }
}
