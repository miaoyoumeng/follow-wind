import RequestHttp from './request';
import { CONTENT_TYPE_ENUM } from './request';

const http = new RequestHttp({
  baseURL: import.meta.env.VITE_API_URL as string,
  timeout: 5000,
  headers: { 'Content-Type': CONTENT_TYPE_ENUM.JSON }
});

export default http;
