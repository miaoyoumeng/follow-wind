import http from '@/request';
import { ResultData } from '@/request/modules.ts';

// 获取我的应用列表
export const getDesktopApps = (): Promise<ResultData<App.AppResp[]>> => {
  return http.get('/security/desktop/apps');
};
export namespace App {
  export interface AppResp {
    appId: number;
    appName: string;
    appIcon: string;
    appUrl: string;
  }
}