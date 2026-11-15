# 跨平台英语学习应用（Ionic Vue + Capacitor）

一个基于 **Ionic Framework 8 + Vue 3 + Capacitor 8** 的跨平台英语学习 App，
一套代码同时支持 **Web** 与 **Android**（打包成 APK）。

## ✨ 功能特性

- 🔍 单词查询与搜索（含搜索历史记录）
- 📖 单词学习 / 预览 / 个人学习档案
- 📝 行内编辑（RowEditor）与表格列表
- 💬 用户反馈 + 管理员反馈管理
- 🔐 JWT 登录 / 注册 / 权限区分（普通用户 / 管理员）
- 📱 Capacitor 桥接，可打包为 Android APK
- 🎨 基于 Ionic 100+ UI 组件，自适应移动端

## 🛠 技术栈

| 层 | 技术 |
| --- | --- |
| UI 框架 | Ionic Framework 8 |
| 前端框架 | Vue 3 + TypeScript |
| 路由 | Vue Router 4（Ionic Vue Router） |
| HTTP 客户端 | Axios |
| 构建工具 | Vite 5 |
| 跨平台 | Capacitor 8 |
| 本地数据库 | sql.js + Capacitor Filesystem |

## 📁 目录结构

```
.
├── Ionic/ionic-demo-vue/     # 主应用（Ionic Vue + Capacitor）
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   ├── composables/      # 组合式函数
│   │   ├── router/           # 路由配置
│   │   ├── services/         # API / 认证 / 搜索历史
│   │   ├── theme/            # 主题变量
│   │   └── views/            # 页面
│   ├── capacitor.config.ts   # Capacitor 配置
│   ├── vite.config.ts        # Vite 配置
│   └── .env.example          # 环境变量模板
├── DOM/                      # 早期原型（单文件 .vue）
├── UI/                       # 部署相关页面
└── JS/                       # （预留）
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- npm 或 pnpm

### 安装依赖

```bash
cd Ionic/ionic-demo-vue
npm install
```

### 配置后端地址

```bash
cd Ionic/ionic-demo-vue
cp .env.example .env
# 编辑 .env，设置 VITE_API_BASE=http://你的后端地址:8011
```

### 启动开发服务器

```bash
npm run dev
# 或使用 Ionic CLI（会自动打开浏览器）
npm run ionic:serve
```

## 📱 打包 Android APK

```bash
cd Ionic/ionic-demo-vue
npm run build          # 1. 编译 Web 资源到 dist/
npx cap add android    # 2. 添加 Android 平台（首次）
npx cap sync android   # 3. 同步 Web 资源到 Android 项目
npx cap open android   # 4. 用 Android Studio 打开并打包
```

在 Android Studio 中：`Build → Build Bundle(s) / APK(s) → Build APK(s)`，
产物位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

## 📄 许可

[MIT](./LICENSE)
