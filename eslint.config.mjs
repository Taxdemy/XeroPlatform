import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import nextVitals from "eslint-config-next/core-web-vitals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Prefer native flat export when it is already an array.
const base = Array.isArray(nextVitals)
  ? nextVitals
  : new FlatCompat({ baseDirectory: __dirname }).extends(
      "next/core-web-vitals",
    );

const eslintConfig = [
  ...base,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "drizzle/**",
    ],
  },
];

export default eslintConfig;
