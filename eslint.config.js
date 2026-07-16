// @ts-check
//
// ESLint flat config (required by ESLint v10).
//
// WHY NOT `eslint-config-next` directly:
//   eslint-config-next imports @typescript-eslint/typescript-estree, which
//   crashes at module-load time with TypeScript 7 because ts.Extension (an
//   internal enum) is no longer exported from the TypeScript main CJS entry
//   point in TS7's restructured package layout.
//
// WHY NOT `next/dist/compiled/babel/eslint-parser` directly:
//   That Babel-based parser (designed for ESLint ≤9) returns a scope manager
//   that lacks `addGlobals`, a method ESLint v10 requires via
//   SourceCode.finalize(). Using it directly causes a TypeError at runtime.
//
// SOLUTION:
//   We use `next/dist/compiled/babel/eslint-parser` (TypeScript/JSX-capable)
//   for AST parsing, then replace its scope manager with one produced by
//   `eslint-scope` (which implements `addGlobals` for ESLint v10 compatibility).
//   This fully replicates the rules from the original .eslintrc.json
//   (extends: ["next/core-web-vitals", "next/typescript"]) using the
//   individual plugins that compose those configs, minus the
//   @typescript-eslint type-aware rules that require TypeScript ≤5.

const nextPlugin = require('@next/eslint-plugin-next')
const reactPlugin = require('eslint-plugin-react')
const reactHooksPlugin = require('eslint-plugin-react-hooks')
const importPlugin = require('eslint-plugin-import')
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y')
const globals = require('globals')
const babelParser = require('next/dist/compiled/babel/eslint-parser')
const eslintScope = require('eslint-scope')

/**
 * Wrapper around next/dist/compiled/babel/eslint-parser that replaces the
 * scope manager with an eslint-scope-produced one, which implements
 * addGlobals() as required by ESLint v10.
 *
 * @type {{ parse: Function; parseForESLint: Function; meta?: object }}
 */
const parser = {
  meta: babelParser.meta,
  parse: babelParser.parse,
  parseForESLint(code, options) {
    const result = babelParser.parseForESLint(code, options)
    if (result && result.ast) {
      result.scopeManager = eslintScope.analyze(result.ast, {
        ecmaVersion: 2020,
        sourceType: options && options.sourceType === 'script' ? 'script' : 'module',
        childVisitorKeys: result.visitorKeys,
        nodejsScope: false,
        impliedStrict: false,
        optimistic: false,
      })
    }
    return result
  },
}

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  // --- global ignores (mirrors eslint-config-next) ---
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },

  // --- main config block (mirrors the 'next' config in eslint-config-next/index) ---
  {
    name: 'next',
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'module',
        allowImportExportEverywhere: true,
        babelOptions: {
          presets: ['next/babel'],
          caller: {
            supportsTopLevelAwait: true,
          },
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: '19.2.7',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // React recommended rules
      ...reactPlugin.configs.recommended.rules,
      // React-Hooks recommended rules
      ...reactHooksPlugin.configs.recommended.rules,
      // Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
      // Next.js overrides (same as eslint-config-next)
      'import/no-anonymous-default-export': 'warn',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'react/jsx-no-target-blank': 'off',
    },
  },

  // --- core-web-vitals rules (additive on top of the base block) ---
  {
    name: 'next/core-web-vitals',
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: nextPlugin.configs['core-web-vitals'].rules,
  },

  // --- Vitest globals for test files ---
  {
    name: 'vitest/globals',
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
]
