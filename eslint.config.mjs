// Next 16 поставляет eslint-config-next уже в формате flat-config (массивы
// Linter.Config[]), поэтому FlatCompat/@eslint/eslintrc больше не нужны —
// пресеты просто расспредываются. core-web-vitals включает базовый next-конфиг,
// typescript добавляет правила typescript-eslint.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
