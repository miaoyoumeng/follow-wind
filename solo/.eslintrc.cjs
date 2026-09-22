// @see: http://eslint.cn

module.exports = {
  root: true,
  env: {
    node: true,
    es6: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.eslint.json'
  },
  extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
      'plugin:import/recommended',
      'plugin:import/typescript'
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      }
    }
  },
  rules: {
    // eslint
    'no-var': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    // 函数逻辑代码（不含空行和注释）不得超过 40 行
    'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
    // 禁止 import 带 .js 后缀或 /index
    'no-restricted-syntax': [
      'error',
      {
        selector: "ImportDeclaration[source.value=/\\.js$/]",
        message: 'Import 路径不要带 .js 后缀'
      },
      {
        selector: "ImportDeclaration[source.value=/\\/index$/]",
        message: 'Import 路径不要带 /index，直接写目录名即可'
      },
      {
        selector: "ImportDeclaration[source.value=/\\.\\/$/]",
        message: "Import can be shortened: remove the trailing slash.",
      },
      {
        selector: "ImportDeclaration[source.value=/\\/\\//]",
        message: "Import can be shortened: remove duplicate slashes in the path.",
      }
    ],
    'prefer-const': 'off',
    'no-use-before-define': 'off',
    'no-unused-vars': 'off',
    // typeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/prefer-ts-expect-error': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    // 类型感知规则（需要 parserOptions.project）
    // 捕获涉及 any/unknown 的不安全操作，配合 tsc --noEmit 共同保障类型安全
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
    "@typescript-eslint/naming-convention": [
      "error",
      { "selector": "variable", "format": ["camelCase", "UPPER_CASE"] },
      { "selector": "function", "format": ["camelCase"] },
      { "selector": "class", "format": ["PascalCase"] },
      { "selector": "interface", "format": ["PascalCase"] },
      { "selector": "typeAlias", "format": ["PascalCase"] }
    ],
    "func-style": ["error", "declaration", { "allowArrowFunctions": true }],
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { "prefer": "type-imports", "fixStyle": "inline-type-imports" }
    ],
    "@typescript-eslint/prefer-readonly": "error"
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'], // 匹配所有的 ts 和 tsx 文件
      rules: {
        'max-lines': ['error', {
          max: 500,
          skipBlankLines: true,
          skipComments: true
        }],
      },
    },
    {
      files: ['test/**/*.ts'],
      rules: {
        // 测试文件天然包含较长的 describe/it 块和 mock 设置，放宽行数和函数长度限制
        'max-lines': 'off',
        'max-lines-per-function': 'off',
        // 测试中声明但未使用的变量通常是待接入的 mock 或后续断言准备，不阻断 lint
        '@typescript-eslint/no-unused-vars': 'off',
        // mock 返回空函数是标准测试模式，不需要告警
        '@typescript-eslint/no-empty-function': 'off',
        // mock 返回值可能非 Promise，防御性 await 是合理写法，降级为警告
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        // eslint-plugin-import 对测试目录的 tsconfig 路径感知偶有偏差，降级为警告避免误阻断
        'import/no-unresolved': 'error'
      }
    }
  ]
};
