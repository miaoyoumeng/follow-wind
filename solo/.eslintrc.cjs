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
    sourceType: 'module'
  },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended', 'plugin:import/recommended', 'plugin:import/typescript'],
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
    // 函数逻辑代码（不含空行和注释）不得超过 35 行
    'max-lines-per-function': ['error', { max: 35, skipBlankLines: true, skipComments: true }],
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
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off'
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
  ]
};
