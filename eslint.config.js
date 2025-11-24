const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");
const reactHooks = require("eslint-plugin-react-hooks");
const reactRefresh = require("eslint-plugin-react-refresh");

module.exports = [
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/apps/**/dist/**",
            "**/drizzle/migrations/**",
            "**/coverage/**",
            "**/.vite/**",
            "**/playwright-report/**",
        ],
    },

    js.configs.recommended,

    ...tseslint.configs.recommended,

    {
        files: ["apps/server/**/*.ts"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            parserOptions: {
                project: ["apps/server/tsconfig.json"],
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
        },
    },

    {
        files: [
            "apps/client/*.config.{js,cjs}",
            "apps/client/vite.config.ts",
            "apps/client/postcss.config.js",
            "apps/client/tailwind.config.js",
        ],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "@typescript-eslint/no-var-requires": "off",
        },
    },

    {
        files: ["apps/client/src/**/*.{ts,tsx}"],
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                project: ["apps/client/tsconfig.json"],
                tsconfigRootDir: __dirname,
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
        },
    },

    prettier,
];
