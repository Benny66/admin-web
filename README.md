# 管理系统前端

基于 Vue 3 + TypeScript + Vite + Element Plus 构建的现代化管理系统前端框架。

## 项目介绍

本项目是一个企业级管理系统的前端部分，采用最新的前端技术栈，提供了完善的用户界面和交互体验。系统包含用户管理、角色管理、菜单管理等基础功能模块，可以快速进行二次开发和功能扩展。

## 技术栈

- **核心框架**：Vue 3
- **开发语言**：TypeScript
- **构建工具**：Vite
- **UI 组件库**：Element Plus
- **状态管理**：Pinia
- **路由管理**：Vue Router
- **HTTP 请求**：Axios
- **CSS 预处理器**：SCSS

## 功能特性

- 响应式布局，适配不同屏幕尺寸
- 基于角色的权限控制系统
- 动态路由和菜单生成
- 标签页导航功能
- 用户管理、角色管理、菜单管理等基础功能
- 个人中心和账户设置

## 项目结构
```
admin-web/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── api/             # API 接口
│   ├── assets/          # 主题、字体等静态资源
│   ├── components/      # 全局公用组件
│   ├── layout/          # 全局布局
│   ├── router/          # 路由配置
│   ├── stores/          # 全局状态管理
│   ├── styles/          # 全局样式
│   ├── utils/           # 全局工具函数
│   ├── views/           # 页面组件
│   ├── App.vue          # 入口页面
│   └── main.ts          # 入口文件
├── .env                 # 环境变量
├── index.html           # HTML 模板
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 快速开始

### 环境准备

- Node.js >= 18.0.0
- npm >= 7.0.0

### 安装依赖

```bash
npm install
```
### 开发模式
```bash
npm run dev
 ```

### 构建生产版本
```bash
npm run build
 ```

### 预览生产版本
```bash
npm run preview
 ```

## 登录信息
- 默认用户名：admin
- 默认密码：123456
## 开发指南
### 新增页面
1. 在 src/views 目录下创建页面组件
2. 在 src/router/modules 中添加路由配置
3. 如需添加菜单，在菜单管理中配置对应的菜单项
### 新增API接口
1. 在 src/api 目录下创建对应的接口文件
2. 使用 axios 实例进行封装
3. 在页面组件中引入并使用
### 权限控制
系统采用基于角色的权限控制，可以在角色管理中为不同角色分配不同的菜单权限。

## Docker部署

本项目提供了Docker部署方案，可以通过以下步骤进行构建和运行：

### 构建Docker镜像

```bash
docker build -t admin-web:latest .
```


### 运行生产环境版本
docker run -d -p 80:80 -v /path/to/nginx.conf:/etc/nginx/conf.d/default.conf admin-web:latest

### 运行测试环境版本
docker run -d -p 8080:80 -v /path/to/test-nginx.conf:/etc/nginx/conf.d/default.conf admin-web:latest

### Nginx配置示例
生产环境配置示例( nginx.conf ):

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /app/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API代理配置
    location /api/ {
        proxy_pass http://backend-api-server/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
 ```


测试环境配置示例( test-nginx.conf ):

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /app/test_dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API代理配置
    location /api/ {
        proxy_pass http://test-backend-api-server/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

```


## 浏览器支持
- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)
## 贡献指南
1. Fork 本仓库
2. 创建您的特性分支 git checkout -b feature/amazing-feature
3. 提交您的更改 git commit -m 'Add some amazing feature'
4. 推送到分支 git push origin feature/amazing-feature
5. 提交 Pull Request
## 许可证
这个README文件包含了项目的基本介绍、技术栈、功能特性、项目结构、快速开始指南、开发指南以及浏览器支持等信息，为开发者提供了全面的项目说明。
