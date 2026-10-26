import js from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "dist-server/**",
      "node_modules/**",
      "astro-change-package/**",
      "public/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URL: "readonly",
        AbortSignal: "readonly",
        TextDecoder: "readonly",
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        HTMLHeadingElement: "readonly",
        HTMLSpanElement: "readonly",
        navigator: "readonly",
      },
    },
  },
);
