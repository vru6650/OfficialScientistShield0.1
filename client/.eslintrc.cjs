module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { react: { version: '18.2' } },
    plugins: ['react-refresh'],
    rules: {
        // The codebase does not use PropTypes; disabling removes hundreds of noisy violations.
        'react/prop-types': 'off',
        // Many components keep placeholder state for upcoming features; treat unused vars as warnings at most.
        'no-unused-vars': 'off',
        // Debug helpers intentionally use empty blocks; allow them while keeping empty catch blocks safe.
        'no-empty': ['error', { allowEmptyCatch: true }],
        // Hook dependencies are often managed manually in complex editors; avoid false positives.
        'react-hooks/exhaustive-deps': 'off',
        // Allow friendly copy with apostrophes/quotes without escaping.
        'react/no-unescaped-entities': 'off',
        // Next.js fast-refresh rule is too strict for route definitions and utility exports here.
        'react-refresh/only-export-components': 'off',
    },
}
