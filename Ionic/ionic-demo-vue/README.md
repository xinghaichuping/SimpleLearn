# ionic-demo-vue

跨平台英语学习应用的**主应用目录**，基于 Ionic Framework 8 + Vue 3 + Capacitor 8。

## 技术栈

- Ionic Framework 8
- Vue 3 + TypeScript
- Vite 5
- Capacitor 8
- Axios / Vue Router / sql.js

## 目录结构

```
src/
├── components/    # 通用组件（RowEditor 等）
├── composables/   # 组合式函数（useDropdown 等）
├── router/        # 路由配置
├── services/      # api.ts / auth.ts / searchHistory.ts
├── theme/         # 主题变量
└── views/         # 页面（StudyPage、WordSearchPage、ProfilePage 等）
```

## 开发

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，设置 VITE_API_BASE=http://你的后端地址:8011
```

### 启动开发服务器

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

## 打包 Android

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## 脚本说明

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run test:unit` | Vitest 单元测试 |
| `npm run test:e2e` | Cypress E2E 测试 |
| `npm run lint` | ESLint 检查 |
| `npm run ionic:serve` | Ionic CLI 启动（自动打开浏览器） |
