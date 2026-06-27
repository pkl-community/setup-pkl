import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vitest from '@vitest/eslint-plugin'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['__tests__/**/*.ts'],
    ...vitest.configs.recommended
  },
  prettierRecommended
)
