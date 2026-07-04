import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['node_modules/', 'public/', 'coverage/'] },

  eslint.configs.recommended,

  ...tseslint.configs.recommended,

  ...pluginVue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'vue/max-attributes-per-line': ['warn', { singleline: { max: 4 }, multiline: { max: 1 } }],
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
]
