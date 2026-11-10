import RequestHttp from './request';
import { ContentTypeEnum } from './request';

const http = new RequestHttp({
  baseURL: import.meta.env.VITE_API_URL as string,
  timeout: 5000,
  headers: { 'Content-Type': ContentTypeEnum.JSON }
});

export default http;
