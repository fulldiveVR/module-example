export const themeCSS = `
/* Modern font imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* color palette from https://github.com/vuejs/theme */
:root {
  /* Typography */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
  
  /* Spacing System */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Text Colors - Light Theme */
  --text-main-light: #0f172a;
  --text-secondary-light: #64748b;
  --text-tertiary-light: #94a3b8;

  /* Neutral Colors - Light Theme */
  --neutral-grey-light: #e2e8f0;
  --neutral-light-grey-light: #f1f5f9;
  --neutral-stroke-grey-light: #e2e8f0;
  --neutral-surface-light: #f8fafc;
  --neutral-light-light: #ffffff;
  --neutral-white-600-light: rgba(255, 255, 255, 0.95);
  --neutral-white-300-light: rgba(255, 255, 255, 0.3);

  /* Primary Colors - Light Theme */
  --primary-main-light: #3b82f6;
  --primary-500-light: #60a5fa;
  --primary-600-light: #2563eb;
  --primary-700-light: #1d4ed8;
  --primary-800-light: #eff6ff;
  --primary-transparent-light: rgba(59, 130, 246, 0.1);

  /* Primary RU Colors - Light Theme */
  --primary-ru-main-light: #6366f1;
  --primary-ru-500-light: #8b5cf6;
  --primary-ru-800-light: #f0f0ff;
  --primary-ru-transparent-light: rgba(99, 102, 241, 0.1);

  /* Secondary Colors - Light Theme */
  --secondary-main-light: #64748b;
  --secondary-500-light: #94a3b8;
  --secondary-800-light: #e2e8f0;
  --secondary-transparent-light: rgba(100, 116, 139, 0.1);

  /* Success Colors - Light Theme */
  --success-main-light: #10b981;
  --success-500-light: #34d399;
  --success-800-light: #ecfdf5;
  --success-transparent-light: rgba(16, 185, 129, 0.1);

  /* Warning Colors - Light Theme */
  --warning-main-light: #f59e0b;
  --warning-500-light: #fbbf24;
  --warning-800-light: #fffbeb;
  --warning-transparent-light: rgba(245, 158, 11, 0.1);

  /* Error Colors - Light Theme */
  --error-main-light: #ef4444;
  --error-500-light: #f87171;
  --error-800-light: #fef2f2;
  --error-transparent-light: rgba(239, 68, 68, 0.1);

  /* Text Colors - Dark Theme */
  --text-main-dark: #f8fafc;
  --text-secondary-dark: #cbd5e1;
  --text-tertiary-dark: #94a3b8;

  /* Neutral Colors - Dark Theme */
  --neutral-dark-grey-dark: #334155;
  --neutral-divider-dark: #475569;
  --neutral-grey-dark: #64748b;
  --neutral-dark-dark: #0f172a;
  --neutral-surface-dark: #1e293b;
  --neutral-elevation-dark: #334155;
  --bg-600-dark: rgba(15, 23, 42, 0.95);
  --bg-300-dark: rgba(15, 23, 42, 0.7);

  /* Primary Colors - Dark Theme */
  --primary-main-dark: #60a5fa;
  --primary-500-dark: #3b82f6;
  --primary-600-dark: #2563eb;
  --primary-700-dark: #1d4ed8;
  --primary-200-dark: #1e40af;
  --primary-transparent-dark: rgba(96, 165, 250, 0.15);

  /* Primary RU Colors - Dark Theme */
  --primary-ru-main-dark: #a78bfa;
  --primary-ru-500-dark: #8b5cf6;
  --primary-ru-200-dark: #7c3aed;
  --primary-ru-transparent-dark: rgba(167, 139, 250, 0.15);

  /* Secondary Colors - Dark Theme */
  --secondary-main-dark: #cbd5e1;
  --secondary-500-dark: #94a3b8;
  --secondary-200-dark: #475569;
  --secondary-transparent-dark: rgba(203, 213, 225, 0.15);

  /* Success Colors - Dark Theme */
  --success-main-dark: #34d399;
  --success-500-dark: #10b981;
  --success-200-dark: #059669;
  --success-transparent-dark: rgba(52, 211, 153, 0.15);

  /* Warning Colors - Dark Theme */
  --warning-main-dark: #fbbf24;
  --warning-500-dark: #f59e0b;
  --warning-200-dark: #d97706;
  --warning-transparent-dark: rgba(251, 191, 36, 0.15);

  /* Error Colors - Dark Theme */
  --error-main-dark: #f87171;
  --error-500-dark: #ef4444;
  --error-200-dark: #dc2626;
  --error-transparent-dark: rgba(248, 113, 113, 0.15);

  /* Common variables shared across themes */
  --border-top-box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --light-box-shadow: var(--shadow-sm);
  --brand-background: var(--primary-transparent-light);
  --ant-icon-mask: brightness(0%) saturate(100%) invert(37%) sepia(37%) saturate(500%) hue-rotate(219deg) brightness(102%) contrast(100%);
  --primary-mask-color: brightness(0%) saturate(100%) invert(37%) sepia(37%) saturate(6240%) hue-rotate(219deg) brightness(102%) contrast(100%);
}

[data-theme="light"] {
  --error-main: var(--error-main-light);
  --error-500: var(--error-500-light);
  --error-800: var(--error-800-light);

  --success-main: var(--success-main-light);
  --success-500: var(--success-500-light);
  --success-800: var(--success-800-light);

  --warning-main: var(--warning-main-light);
  --warning-500: var(--warning-500-light);
  --warning-800: var(--warning-800-light);

  --secondary-main: var(--secondary-main-light);
  --secondary-500: var(--secondary-500-light);
  --secondary-800: var(--secondary-800-light);

  --text-main: var(--text-main-light);
  --text-secondary: var(--text-secondary-light);
  --text-tertiary: var(--text-tertiary-light);

  --neutral-gray: var(--neutral-grey-light);
  --neutral-light-gray: var(--neutral-light-grey-light);
  --neutral-gray-hover: var(--neutral-stroke-grey-light);
  --neutral-light-gray-hover: var(--neutral-surface-light);
  --neutral-background: var(--neutral-surface-light);
  --neutral-light: var(--neutral-light-light);
  --neutral-card: var(--neutral-light-light);
  --neutral-outline: var(--neutral-grey-light);
  --banner-background: var(--primary-800-light);

  --primary: var(--primary-main-light);
  --primary-500: var(--primary-500-light);
  --primary-600: var(--primary-600-light);
  --primary-700: var(--primary-700-light);
  --primary-800: var(--primary-800-light);
  --primary-hover: var(--primary-600-light);
  --primary-transparent: var(--primary-transparent-light);

  --color-background: var(--neutral-light);
  --color-surface: var(--neutral-card);
  --text-primary: var(--text-main);
  --text-caption: var(--text-secondary);
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

  --success-main: var(--success-main-dark);
  --success-500: var(--success-500-dark);
  --success-800: var(--success-200-dark);

  --warning-main: var(--warning-main-dark);
  --warning-500: var(--warning-500-dark);
  --warning-800: var(--warning-200-dark);

  --secondary-main: var(--secondary-main-dark);
  --secondary-500: var(--secondary-500-dark);
  --secondary-800: var(--secondary-200-dark);

  --text-main: var(--text-main-dark);
  --text-secondary: var(--text-secondary-dark);
  --text-tertiary: var(--text-tertiary-dark);

  --neutral-gray: var(--neutral-grey-dark);
  --neutral-light-gray: var(--neutral-divider-dark);
  --neutral-gray-hover: var(--neutral-dark-grey-dark);
  --neutral-light-gray-hover: var(--neutral-surface-dark);
  --neutral-background: var(--neutral-dark-dark);
  --neutral-light: var(--neutral-surface-dark);
  --neutral-card: var(--neutral-elevation-dark);
  --neutral-outline: var(--neutral-divider-dark);
  --banner-background: var(--primary-200-dark);

  --primary: var(--primary-main-dark);
  --primary-500: var(--primary-500-dark);
  --primary-600: var(--primary-600-dark);
  --primary-700: var(--primary-700-dark);
  --primary-800: var(--primary-200-dark);
  --primary-hover: var(--primary-500-dark);
  --primary-transparent: var(--primary-transparent-dark);

  --color-background: var(--neutral-light);
  --color-surface: var(--neutral-card);
  --text-primary: var(--text-main);
  --text-caption: var(--text-secondary);
  --active-menu: var(--primary);
  --active-menu-hover: var(--primary-hover);
  --tile-bg: var(--neutral-background);
  --sider-bc: var(--neutral-light-gray);
  --background-disabled: var(--neutral-background);
  --tooltip-background: var(--secondary-main);

  --chat-message-fade: linear-gradient(90deg, rgba(30, 41, 59, 0.5) 10%, rgba(30, 41, 59, 0.7) 37%);
}

/* Global styles for modern design */
* {
  box-sizing: border-box;
}

body {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-md);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Modern button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  outline: none;
}

.btn:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--text-primary);
  border: 1px solid var(--neutral-outline);
}

.btn-secondary:hover {
  background-color: var(--neutral-light-gray-hover);
  border-color: var(--primary);
}

.btn-ghost {
  background-color: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover {
  background-color: var(--neutral-light-gray-hover);
  color: var(--text-primary);
}

/* Modern input styles */
.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--neutral-outline);
  border-radius: var(--radius-md);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-sm);
  background-color: var(--color-surface);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-transparent);
}

.input::placeholder {
  color: var(--text-tertiary);
}

/* Modern card styles */
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--neutral-outline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--neutral-outline);
}

.card-content {
  padding: var(--spacing-lg);
}

/* Modern list styles */
.list-item {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: pointer;
}

.list-item:hover {
  background-color: var(--neutral-light-gray-hover);
}

.list-item.active {
  background-color: var(--primary-transparent);
  color: var(--primary);
  font-weight: 500;
}

/* Scrollbar styles */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--neutral-background);
}

::-webkit-scrollbar-thumb {
  background: var(--neutral-gray);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* Animation keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.fade-in {
  animation: fadeIn var(--transition-base) ease-out;
}

.slide-in {
  animation: slideIn var(--transition-base) ease-out;
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