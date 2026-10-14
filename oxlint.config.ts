import {defineConfig} from 'oxlint'

export default defineConfig({
    plugins: ['typescript', 'react'],
    ignorePatterns: ['dist/**'],
    categories: {
        correctness: 'error',
        suspicious: 'warn',
    },
    options: {
        typeAware: true,
    },
    rules: {
        'typescript/no-explicit-any': 'warn',
        'typescript/no-unused-vars': 'error',
        'react/rules-of-hooks': 'error',
        'react/exhaustive-deps': 'error',
        'react/only-export-components': 'error',
        "react/react-in-jsx-scope": "off",
    },
})
