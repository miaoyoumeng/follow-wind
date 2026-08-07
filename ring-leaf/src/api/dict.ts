import { ResultData, ResPage } from '@/request/modules.ts';
import { DictNamespace, DictKeyValue } from '@/api/modules/dict.ts';

import namespaceMock from '@/assets/jsons/dict-namespaces.json';
import keyvalueMock from '@/assets/jsons/dict-keyvalues.json';

type KeyValueMockData = Record<string, DictKeyValue.KeyValueItem[]>;
const kvData = keyvalueMock.data as KeyValueMockData;

/* ===== Namespace ===== */

export const getNamespaceListApi = (params: DictNamespace.ListParams): Promise<ResultData<ResPage<DictNamespace.NamespaceItem>>> => {
  const { pageNum, pageSize, keyword } = params;
  let list = namespaceMock.data.list;
  if (keyword) {
    list = list.filter(item => item.namespace.includes(keyword) || item.description?.includes(keyword));
  }
  const total = list.length;
  const start = (pageNum - 1) * pageSize;
  const end = start + pageSize;
  const pageList = list.slice(start, end);
  return Promise.resolve({
    code: '200',
    msg: '成功',
    displayMsg: '',
    uniqCode: '',
    data: { list: pageList, total, pageNum, pageSize }
  });
};

export const createNamespaceApi = (params: DictNamespace.CreateParams): Promise<ResultData<null>> => {
  const exists = namespaceMock.data.list.some(item => item.namespace === params.namespace);
  if (exists) {
    return Promise.reject(new Error('该 Namespace 已存在'));
  }
  const newItem: DictNamespace.NamespaceItem = {
    id: Math.max(...namespaceMock.data.list.map(i => i.id)) + 1,
    namespace: params.namespace,
    description: params.description || '',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    createdBy: '管理员',
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updatedBy: '管理员'
  };
  namespaceMock.data.list.unshift(newItem);
  namespaceMock.data.total = namespaceMock.data.list.length;
  return Promise.resolve({ code: '200', msg: 'Namespace 已创建', displayMsg: '', uniqCode: '', data: null });
};

export const updateNamespaceApi = (params: DictNamespace.UpdateParams): Promise<ResultData<null>> => {
  const item = namespaceMock.data.list.find(i => i.id === params.id);
  if (!item) {
    return Promise.reject(new Error('Namespace 不存在'));
  }
  item.description = params.description;
  item.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  item.updatedBy = '管理员';
  return Promise.resolve({ code: '200', msg: 'Namespace 已更新', displayMsg: '', uniqCode: '', data: null });
};

/* ===== Key-Value ===== */

export const getKeyValueListApi = (params: DictKeyValue.ListParams): Promise<ResultData<DictKeyValue.KeyValueItem[]>> => {
  const { namespace, keyword } = params;
  let list = kvData[namespace] || [];
  if (keyword) {
    list = list.filter(item => item.key.includes(keyword) || item.description?.includes(keyword));
  }
  return Promise.resolve({ code: '200', msg: '成功', displayMsg: '', uniqCode: '', data: list });
};

export const createKeyValueApi = (params: DictKeyValue.CreateParams): Promise<ResultData<null>> => {
  const list = kvData[params.namespace] || [];
  const exists = list.some(item => item.key === params.key);
  if (exists) {
    return Promise.reject(new Error('该 Key 已存在'));
  }
  const newItem: DictKeyValue.KeyValueItem = {
    id:
      Math.max(
        ...Object.values(kvData)
          .flat()
          .map(i => i.id),
        0
      ) + 1,
    key: params.key,
    value: params.value,
    description: params.description || '',
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updatedBy: '管理员',
    isReferenced: false
  };
  if (!kvData[params.namespace]) {
    kvData[params.namespace] = [];
  }
  kvData[params.namespace].push(newItem);
  return Promise.resolve({ code: '200', msg: 'Key-Value 已创建', displayMsg: '', uniqCode: '', data: null });
};

export const updateKeyValueApi = (params: DictKeyValue.UpdateParams): Promise<ResultData<null>> => {
  const list = kvData[params.namespace];
  if (!list) {
    return Promise.reject(new Error('Namespace 不存在'));
  }
  const item = list.find(i => i.id === params.id);
  if (!item) {
    return Promise.reject(new Error('Key-Value 不存在'));
  }
  const keyExists = list.some(i => i.key === params.key && i.id !== params.id);
  if (keyExists) {
    return Promise.reject(new Error('该 Key 已存在'));
  }
  item.key = params.key;
  item.value = params.value;
  item.description = params.description || '';
  item.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  item.updatedBy = '管理员';
  return Promise.resolve({ code: '200', msg: 'Key-Value 已更新', displayMsg: '', uniqCode: '', data: null });
};

export const deleteKeyValueApi = (params: DictKeyValue.DeleteParams): Promise<ResultData<null>> => {
  for (const ns of Object.keys(kvData)) {
    const idx = kvData[ns].findIndex(i => i.id === params.id);
    if (idx !== -1) {
      const item = kvData[ns][idx];
      if (item.isReferenced) {
        return Promise.reject(new Error('该 Key-Value 已被业务引用，无法删除'));
      }
      kvData[ns].splice(idx, 1);
      return Promise.resolve({ code: '200', msg: 'Key-Value 已删除', displayMsg: '', uniqCode: '', data: null });
    }
  }
  return Promise.reject(new Error('Key-Value 不存在'));
};
