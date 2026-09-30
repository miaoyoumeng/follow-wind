// @see: http://eslint.cn

module.exports = {
  // 不再向上层目录查找配置文件，以本文件为最终配置
  root: true,
  // 声明代码运行环境，决定哪些全局变量被视为已定义
  env: {
    // 浏览器全局变量（window、document 等）
    browser: true,
    // Node.js 全局变量（process、__dirname 等）
    node: true,
    // ES6+ 语法与内置全局对象（Promise、Set 等）
    es6: true
  },
  // 指定如何解析语法
  parser: "vue-eslint-parser",
  // 优先级低于 parse 的语法解析配置
  parserOptions: {
    // 解析 .vue 文件内 <script lang="ts"> 所用的解析器
    parser: "@typescript-eslint/parser",
    // 支持的 ECMAScript 版本
    ecmaVersion: 2020,
    // 以 ES Module 方式解析，允许顶层 import / export
    sourceType: "module",
    // JSX 的工厂函数名（项目未使用 JSX，沿用默认值）
    jsxPragma: "React",
    // 允许解析 JSX 语法
    ecmaFeatures: {
      jsx: true
    },
    // 以下三项是类型感知规则（no-unsafe-*、no-floating-promises、naming-convention 等）的必需配置
    // 指向 tsconfig，类型感知规则据此获取类型信息
    project: "./tsconfig.json",
    // tsconfig 的查找基准目录（即本配置文件所在目录）
    tsconfigRootDir: __dirname,
    // .vue 不在 tsconfig 的 include 范围内，需显式声明才会被纳入类型分析
    extraFileExtensions: [".vue"]
  },
  // 继承某些已有的规则
  extends: [
    // Vue 3 官方推荐规则集
    "plugin:vue/vue3-recommended",
    // TypeScript 官方推荐规则集
    "plugin:@typescript-eslint/recommended",
    // 用 Prettier 做格式化检查，并关闭所有与 Prettier 冲突的规则
    "plugin:prettier/recommended"
  ],
  /**
   * "off" 或 0    ==>  关闭规则
   * "warn" 或 1   ==>  打开的规则作为警告（不影响代码执行）
   * "error" 或 2  ==>  规则作为一个错误（代码不能执行，界面报错）
   */
  rules: {
    // ===== ESLint 基础规则 (http://eslint.cn/docs/rules) =====

    // 禁止使用 var，统一用 let / const（避免变量提升与作用域污染）
    'no-var': 'error',
    // 连续空行最多 1 行
    'no-multiple-empty-lines': ['error', { max: 1 }],
    // 函数逻辑代码（不含空行和注释）不得超过 45 行
    'max-lines-per-function': ['error', { max: 45, skipBlankLines: true, skipComments: true }],
    // 统一 import 路径写法，禁止冗余后缀与写法（具体提示见各条 message）
    'no-restricted-syntax': [
      'error',
      // 禁止 import 路径带 .js 后缀
      {
        selector: "ImportDeclaration[source.value=/\\.js$/]",
        message: 'Import 路径不要带 .js 后缀'
      },
      // 禁止 import 路径以 /index 结尾，直接写目录名即可
      {
        selector: "ImportDeclaration[source.value=/\\/index$/]",
        message: 'Import 路径不要带 /index，直接写目录名即可'
      },
      // 禁止 import 路径以 ./ 结尾（多余，可省略）
      {
        selector: "ImportDeclaration[source.value=/\\.\\/$/]",
        message: "Import can be shortened: remove the trailing slash.",
      },
      // 禁止 import 路径中出现重复斜杠
      {
        selector: "ImportDeclaration[source.value=/\\/\\//]",
        message: "Import can be shortened: remove duplicate slashes in the path.",
      }
    ],
    // 声明后未再重新赋值的变量必须使用 const
    'prefer-const': 'error',
    // 禁止在变量/函数定义之前使用
    // 注：基础版规则不识别类型位置，declare namespace 内的类型互相引用时，被引用的声明必须写在前面
    'no-use-before-define': 'error',
    // 未使用的变量/参数报错
    // 注：基础版不识别 TS 类型引用与 enum 成员，若出现类型相关的误报，应关闭本规则只保留 @typescript-eslint 版本
    'no-unused-vars': 'error',

    // ===== TypeScript 规则 =====

    // 未使用的变量/参数报错（不使用 _ 前缀豁免：未使用即需删除或在实现中用上）
    '@typescript-eslint/no-unused-vars': 'error',
    // 禁止空函数体（避免遗留未实现的空壳）
    '@typescript-eslint/no-empty-function': 'error',
    // 需要忽略类型错误时优先用 @ts-expect-error：该错误一旦消失它会自身报错，避免失效的忽略注释长期残留
    '@typescript-eslint/prefer-ts-expect-error': 'error',
    // 禁止无说明的 @ts-ignore / @ts-nocheck 等忽略注释
    '@typescript-eslint/ban-ts-comment': 'error',
    // 禁止为可推断出类型的字面量显式标注类型（如 const a: number = 1）
    '@typescript-eslint/no-inferrable-types': 'error',
    // 禁止使用 TS 的 namespace 语法；本项目类型声明统一用 declare namespace（见 CLAUDE.md API 分层规范），
    // 相关的 model 文件已通过文件级 eslint-disable 声明豁免
    '@typescript-eslint/no-namespace': 'error',
    // 禁止显式 any，收口类型逃逸
    '@typescript-eslint/no-explicit-any': 'error',
    // 该规则名在 v8 后已不存在，配置里出现它会（无论设成什么非 off 的值）导致 ESLint 对每个文件报
    // "Definition for rule not found"，使整个 lint 瘫痪
    // 禁止 {} 与 Object 类型：它们几乎不做类型约束，等同于放弃检查
    '@typescript-eslint/no-empty-object-type': 'error',
    // 禁止裸 Function 类型：它不接受调用签名，写错参数也不会报错
    '@typescript-eslint/no-unsafe-function-type': 'error',
    // 禁止 CommonJS 的 require 写法；源码统一使用 ESM import
    '@typescript-eslint/no-var-requires': 'error',
    // 禁止非空断言 `!`：需改用类型守卫或局部常量收窄
    '@typescript-eslint/no-non-null-assertion': 'error',

    // ===== 类型感知规则（需要上方 parserOptions.project 提供类型信息）=====
    // 捕获涉及 any/unknown 的不安全操作，配合 tsc --noEmit 共同保障类型安全

    // 禁止把 any / unknown 的值传给有明确类型的参数
    '@typescript-eslint/no-unsafe-argument': 'error',
    // 禁止把 any 的值赋给有类型的变量
    '@typescript-eslint/no-unsafe-assignment': 'error',
    // 禁止调用 any 类型的值
    '@typescript-eslint/no-unsafe-call': 'error',
    // 禁止访问 any 类型值的属性
    '@typescript-eslint/no-unsafe-member-access': 'error',
    // 禁止从函数中返回 any 类型的值
    '@typescript-eslint/no-unsafe-return': 'error',
    // 禁止产生未处理的 Promise（必须 await，或显式 void 表示有意忽略）
    '@typescript-eslint/no-floating-promises': 'error',
    // 禁止 await 一个非 Promise 的值
    '@typescript-eslint/await-thenable': 'error',
    // 禁止把返回 Promise 的函数传给期望 void 的位置（如事件回调）
    '@typescript-eslint/no-misused-promises': 'error',
    // 模板字符串中禁止隐式字符串化其他类型；放行 number / boolean
    '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
    // 命名规范：变量 camelCase 或 UPPER_CASE，函数 camelCase，类 / 接口 / 类型别名 PascalCase
    "@typescript-eslint/naming-convention": [
      "error",
      // 变量：小驼峰，或全大写加下划线（常量）
      { "selector": "variable", "format": ["camelCase", "UPPER_CASE"] },
      // 函数：小驼峰
      { "selector": "function", "format": ["camelCase"] },
      // 类：大驼峰
      { "selector": "class", "format": ["PascalCase"] },
      // 接口：大驼峰
      { "selector": "interface", "format": ["PascalCase"] },
      // 类型别名：大驼峰
      { "selector": "typeAlias", "format": ["PascalCase"] }
    ],
    // 函数统一用函数声明或箭头函数，禁止函数表达式（如 const f = function () {}）
    "func-style": ["error", "declaration", { "allowArrowFunctions": true }],
    // 能用可选链 ?. 时，不用 && 逐层判断
    "@typescript-eslint/prefer-optional-chain": "error",
    // 能用空值合并 ?? 时，不用 || 做默认值兜底
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    // 仅用于类型的导入必须写成 import type，便于构建时直接擦除
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { "prefer": "type-imports", "fixStyle": "inline-type-imports" }
    ],
    // 从未被重新赋值的私有类成员，要求标记为 readonly
    "@typescript-eslint/prefer-readonly": "error",
    // 函数必须显式写出返回类型（下方为各类豁免场景）
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        // 允许表达式（如 const fn = () => x * 2）省略返回类型
        allowExpressions: true,
        // 允许高阶函数里的回调省略返回类型
        // 如 [1,2,3].map((x) => x + 1)
        allowTypedFunctionExpressions: true,
        // 允许作为对象属性/变量初始值的函数表达式省略返回类型
        // 如 const obj = { foo: () => 1 }
        allowHigherOrderFunctions: true,
        // 允许箭头函数直接返回 as const 断言值而省略返回类型
        allowDirectConstAssertionInArrowFunctions: true,
        // 允许 IIFE 省略
        // allowIIFEs: true,
      },
    ],
    // if / else / for / while 必须带花括号，即使只有一条语句
    'curly': ['error', 'all'],

    // ===== Vue 规则 (https://eslint.vuejs.org/rules) =====

    // 防止<script setup>使用的变量<template>被标记为未使用，此规则仅在启用该 no-unused-vars 规则时有效
    "vue/script-setup-uses-vars": "error",
    // 强制执行 v-slot 指令样式
    "vue/v-slot-style": "error",
    // 不允许改变组件 prop
    "vue/no-mutating-props": "error",
    // 为自定义事件名称强制使用特定大小写
    "vue/custom-event-name-casing": "error",
    // 标签的右括号 ">" 之前禁止换行。
    // 注：Prettier 在 htmlWhitespaceSensitivity 为 "css" 时，为保住内联元素的空白语义会把 ">" 拆到下一行，
    // 与本规则互相覆盖形成死循环，已在 .prettierrc.cjs 中改用 "ignore" 模式与之配套
    "vue/html-closing-bracket-newline": "error",
    // 对模板中的自定义组件强制执行属性命名样式：my-prop="prop"
    "vue/attribute-hyphenation": "error",
    // vue api使用顺序，强制执行属性顺序
    "vue/attributes-order": "error",
    // 禁止使用 v-html
    "vue/no-v-html": "error",
    // 此规则要求为每个 prop 为必填时，必须提供默认值
    "vue/require-default-prop": "error",
    // 要求组件名称始终为 “-” 链接的单词
    "vue/multi-word-component-names": "error",
    // 禁止解构 props 传递给 setup
    "vue/no-setup-props-destructure": "error"
  }
};
