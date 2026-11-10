import type { ComponentPublicInstance } from 'vue';
/**
 * @description 全局代码错误捕捉
 * */
const errorHandler = (error: unknown, instance: ComponentPublicInstance | null) => {
  const errorMap: { [key: string]: string } = {
    InternalError: 'Javascript引擎内部错误',
    ReferenceError: '未找到对象',
    TypeError: '使用了错误的类型或对象',
    RangeError: '使用内置对象时，参数超范围',
    SyntaxError: '语法错误',
    EvalError: '错误的使用了Eval',
    URIError: 'URI错误'
  };
  let message = '';
  if (error instanceof Error) {
    console.error('error.message: ' + error.message);
    message = errorMap[error.name];
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = '未知错误';
  }
  console.error(message);
  console.error('instance : {}', JSON.stringify(instance));
};

export default errorHandler;
