export default [
  ...tanstackConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/components/ui/**/*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]
