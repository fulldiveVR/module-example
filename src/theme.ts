export const themeCSS = `
/* color palette from https://github.com/vuejs/theme */
:root {
  /* Text Colors - Light Theme */
  --text-main-light: #1c192b;
  --text-secondary-light: #5f5c71;

  /* Neutral Colors - Light Theme */
  --neutral-grey-light: #ada8c0;
  --neutral-light-grey-light: #d9dee5;
  --neutral-stroke-grey-light: #e3e4e8;
  --neutral-surface-light: #f3f4f6;
  --neutral-light-light: #ffffff;
  --neutral-white-600-light: rgba(255, 255, 255);
  --neutral-white-300-light: rgba(255, 255, 255, 0.3);

  /* Primary Colors - Light Theme */
  --primary-main-light: #3e6cff;
  --primary-500-light: #709eff;
  --primary-800-light: #e0ecff;
  --primary-transparent-light: rgba(112, 158, 231, 0.15);

  /* Primary RU Colors - Light Theme */
  --primary-ru-main-light: #3350d4;
  --primary-ru-500-light: #99a7e9;
  --primary-ru-800-light: #f1f2fe;
  --primary-ru-transparent-light: rgba(51, 80, 212, 0.15);

  /* Secondary Colors - Light Theme */
  --secondary-main-light: #5f5c71;
  --secondary-500-light: #78748b;
  --secondary-800-light: #c9c3dc;
  --secondary-transparent-light: rgba(95, 92, 113, 0.15);

  /* Tertiary Colors - Light Theme */
  --tertiary-main-light: #cc8b8c;
  --tertiary-500-light: #eaa9aa;
  --tertiary-800-light: #ffc7c8;
  --tertiary-transparent-light: rgba(204, 139, 140, 0.15);

  /* Error Colors - Light Theme */
  --error-main-light: #ef476f;
  --error-500-light: #ff79a1;
  --error-800-light: #ff97bf;
  --error-transparent-light: rgba(239, 71, 111, 0.15);

  /* Result Colors - Light Theme */
  --result-main-light: #00cc96;
  --result-500-light: #80e6ca;
  --result-800-light: #cdf7ec;
  --result-transparent-light: rgba(0, 204, 150, 0.15);

  /* Electric Blue Colors - Light Theme */
  --electric-blue-main-light: #0496ff;
  --electric-blue-500-light: #81caff;
  --electric-blue-800-light: #cdeaff;
  --electric-blue-transparent-light: rgba(4, 150, 255, 0.15);

  /* Extra Colors - Light Theme */
  --extra-main-light: #a66ae2;
  --extra-500-light: #d2b4f0;
  --extra-800-light: #ede1f9;
  --extra-transparent-light: rgba(166, 106, 226, 0.15);

  /* Text Colors - Dark Theme */
  --text-main-dark: #fdf8fd;
  --text-secondary-dark: #cbc6cb;

  /* Neutral Colors - Dark Theme */
  --neutral-dark-grey-dark: #312e41;
  --neutral-divider-dark: #312e41;
  --neutral-grey-dark: #78748b;
  --neutral-dark-dark: #19181c;
  --neutral-surface-dark: #201f22;
  --neutral-elevation-dark: #29282b;
  --bg-600-dark: rgba(20, 19, 22);
  --bg-300-dark: rgba(20, 19, 22);

  /* Primary Colors - Dark Theme */
  --primary-main-dark: #709eff;
  --primary-500-dark: #4876d7;
  --primary-200-dark: #204eaf;
  --primary-transparent-dark: rgba(200, 191, 255, 0.15);

  /* Primary RU Colors - Dark Theme */
  --primary-ru-main-dark: #b9c3ff;
  --primary-ru-500-dark: #686e95;
  --primary-ru-200-dark: #373c56;
  --primary-ru-transparent-dark: rgba(185, 195, 255, 0.15);

  /* Secondary Colors - Dark Theme */
  --secondary-main-dark: #c9c3dc;
  --secondary-500-dark: #78748b;
  --secondary-200-dark: #312e41;
  --secondary-transparent-dark: rgba(201, 195, 220, 0.15);

  /* Tertiary Colors - Dark Theme */
  --tertiary-main-dark: #ecb8ce;
  --tertiary-500-dark: #ba869c;
  --tertiary-200-dark: #9c687e;
  --tertiary-transparent-dark: rgba(236, 184, 206, 0.15);

  /* Error Colors - Dark Theme */
  --error-main-dark: #ff658d;
  --error-500-dark: #cd335b;
  --error-200-dark: #af153d;
  --error-transparent-dark: rgba(255, 101, 141, 0.15);

  /* Result Colors - Dark Theme */
  --result-main-dark: #82eacf;
  --result-500-dark: #50b89d;
  --result-200-dark: #329a7f;
  --result-transparent-dark: rgba(130, 234, 207, 0.15);

  /* Electric Blue Colors - Dark Theme */
  --electric-blue-main-dark: #81caff;
  --electric-blue-500-dark: #4f98cd;
  --electric-blue-200-dark: #317aaf;
  --electric-blue-transparent-dark: rgba(129, 202, 255, 0.15);

  /* Extra Colors - Dark Theme */
  --extra-main-dark: #d2b4f0;
  --extra-500-dark: #a082be;
  --extra-200-dark: #8264a0;
  --extra-transparent-dark: rgba(210, 180, 240, 0.15);

  /* Common variables shared across themes */
  --border-top-box-shadow: 1px 1px 1px 1px rgba(0, 0, 111, 0.25);
  --light-box-shadow: 0px 1px 4px 0px #00006f33;
  --brand-background: rgba(112, 91, 231, 0.15);
  --ant-icon-mask: brightness(0%) saturate(100%) invert(37%) sepia(37%) saturate(500%) hue-rotate(219deg) brightness(102%) contrast(100%);
  --primary-mask-color: brightness(0%) saturate(100%) invert(37%) sepia(37%) saturate(6240%) hue-rotate(219deg) brightness(102%) contrast(100%);
}

[data-theme="light"] {
  --error-main: var(--error-main-light);
  --error-500: var(--error-500-light);
  --error-800: var(--error-800-light);

  --result-main: var(--result-main-light);
  --result-500: var(--result-500-light);
  --result-800: var(--result-800-light);

  --secondary-main: var(--secondary-main-light);
  --secondary-500: var(--secondary-500-light);
  --secondary-800: var(--secondary-800-light);

  --tertiary-main: var(--tertiary-main-light);
  --tertiary-500: var(--tertiary-500-light);
  --tertiary-800: var(--tertiary-800-light);

  --extra-main: var(--extra-main-light);
  --extra-500: var(--extra-500-light);
  --extra-800: var(--extra-800-light);

  --electric-blue-main: var(--electric-blue-main-light);
  --electric-blue-500: var(--electric-blue-500-light);
  --electric-blue-800: var(--electric-blue-800-light);

  --text-main: var(--text-main-light);
  --text-secondary: var(--text-secondary-light);

  --neutral-gray: var(--neutral-grey-light);
  --neutral-light-gray: var(--neutral-light-grey-light);
  --neutral-gray-hover: var(--neutral-stroke-grey-light);
  --neutral-light-gray-hover: var(--neutral-surface-light);
  --neutral-background: var(--neutral-surface-light);
  --neutral-light: var(--neutral-light-light);
  --neutral-card: var(--neutral-surface-light);
  --neutral-outline: var(--neutral-light-grey-light);
  --banner-backgounrd: var(--primary-800-light);

  --starter: var(--electric-blue-main-light);

  --checkbox-inner: var(--neutral-light-light);
  --checkbox-checked: var(--primary);

  /*background*/
  --all-in-one-background: var(--neutral-white-600-light);
  --all-in-one-background-secondary: var(--neutral-white-300-light);
  /*hover*/
  --all-in-one-hover: var(--neutral-white-300-light);
  /*border*/
  --all-in-one-border: var(--neutral-light-light);

  --primary: var(--primary-main-light);
  --primary-500: var(--primary-500-light);
  --primary-800: var(--primary-800-light);
  --primary-hover: var(--primary-500-light);
  --primary-dark: var(--primary-500-light);
  --primary-dark-hover: var(--primary-500-light);
  --primary-dark-disabled: var(--neutral-stroke-grey-light);
  --primary-hover-mask-color: brightness(0%) saturate(100%) invert(69%) sepia(39%) saturate(6339%) hue-rotate(199deg)
    brightness(106%) contrast(101%);

  --color-background: var(--neutral-light);
  --text-primary: var(--text-main);
  --text-caption: var(--secondary-main);
  --active-menu: var(--primary);
  --active-menu-hover: var(--primary-hover);
  --tile-bg: var(--neutral-background);
  --sider-bc: var(--neutral-light-gray);
  --background-disabled: var(--neutral-background);
  --tooltip-background: var(--secondary-main);

  --chat-message-fade: linear-gradient(90deg, rgba(255, 255, 255, 0.5) 10%, rgba(255, 255, 255, 0.7) 37%);
}

[data-theme="dark"] {
  --error-main: var(--error-main-dark);
  --error-500: var(--error-500-dark);
  --error-800: var(--error-200-dark);

  --result-main: var(--result-main-dark);
  --result-500: var(--result-500-dark);
  --result-800: var(--result-200-dark);

  --secondary-main: var(--secondary-main-dark);
  --secondary-500: var(--secondary-500-dark);
  --secondary-800: var(--secondary-200-dark);

  --tertiary-main: var(--tertiary-main-dark);
  --tertiary-500: var(--tertiary-500-dark);
  --tertiary-800: var(--tertiary-200-dark);

  --extra-main: var(--extra-main-dark);
  --extra-500: var(--extra-500-dark);
  --extra-800: var(--extra-200-dark);

  --electric-blue-main: var(--electric-blue-main-dark);
  --electric-blue-500: var(--electric-blue-500-dark);
  --electric-blue-800: var(--electric-blue-200-dark);

  --text-main: var(--text-main-dark);
  --text-secondary: var(--text-secondary-dark);

  --neutral-gray: var(--neutral-grey-dark);
  --neutral-light-gray: var(--neutral-divider-dark);
  --neutral-gray-hover: var(--neutral-dark-grey-dark);
  --neutral-light-gray-hover: var(--neutral-surface-dark);
  --neutral-background: var(--neutral-dark-dark);
  --neutral-light: var(--neutral-surface-dark);
  --neutral-card: var(--neutral-surface-dark);
  --neutral-outline: var(--neutral-divider-dark);
  --banner-backgounrd: var(--primary-200-dark);

  --starter: var(--electric-blue-main-dark);

  --checkbox-inner: var(--all-in-one-background);
  --checkbox-checked: var(--primary-transparent-light);

  --all-in-one-background: var(--bg-600-dark);
  --all-in-one-background-secondary: var(--bg-300-dark);
  --all-in-one-hover: var(--bg-300-dark);
  --all-in-one-border: var(--neutral-surface-dark);

  --primary: var(--primary-main-dark);
  --primary-500: var(--primary-500-dark);
  --primary-800: var(--primary-200-dark);
  --primary-hover: var(--primary-500-dark);
  --primary-dark: var(--primary-500-dark);
  --primary-dark-hover: var(--primary-500-dark);
  --primary-dark-disabled: var(--neutral-dark-grey-dark);
  --primary-hover-mask-color: brightness(0%) saturate(100%) invert(69%) sepia(39%) saturate(6339%) hue-rotate(199deg);

  --color-background: var(--neutral-dark-dark);
  --text-primary: var(--text-main-dark);
  --text-caption: var(--secondary-main-dark);
  --active-menu: var(--primary-main-dark);
  --active-menu-hover: var(--primary-500-dark);
  --tile-bg: var(--neutral-surface-dark);
  --sider-bc: var(--neutral-divider-dark);
  --background-disabled: var(--neutral-surface-dark);
  --tooltip-background: var(--neutral-elevation-dark);

  --chat-message-fade: linear-gradient(90deg, rgba(20, 19, 22, 0.5) 10%, rgba(20, 19, 22, 0.7) 37%);
}
`;

let injected = false;

export function ensureThemeStyles() {
  if (injected) return;
  if (typeof document === "undefined") return;
  const styleTag = document.createElement("style");
  styleTag.setAttribute("data-generated", "themecss");
  styleTag.textContent = themeCSS;
  document.head.appendChild(styleTag);
  injected = true;
} 