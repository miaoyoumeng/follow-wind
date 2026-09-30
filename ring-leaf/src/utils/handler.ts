import { NotifyPlugin } from 'tdesign-vue-next';

/**
 * @description 全局代码错误捕捉
 * */
interface HandlerError {
  status?: number;
  name?: string;
}

const errorHandler = (error: unknown): false | undefined => {
  const err = error as HandlerError;
  // 过滤 HTTP 请求错误
  if (err.status || err.status == 0) {
    return false;
  }
  const errorMap: { [key: string]: string } = {
    InternalError: 'Javascript引擎内部错误',
    ReferenceError: '未找到对象',
    TypeError: '使用了错误的类型或对象',
    RangeError: '使用内置对象时，参数超范围',
    SyntaxError: '语法错误',
    EvalError: '错误的使用了Eval',
    URIError: 'URI错误'
  };
  const errorName = errorMap[err.name ?? ''] ?? '未知错误';

  void NotifyPlugin.error({
    title: errorName,
    content: String(error),
    duration: 3000
  });
};

export default errorHandler;
