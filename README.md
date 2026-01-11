<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SmartPantry - 智能库存管理系统

一个基于 React + Node.js + Supabase 的全栈智能库存管理应用，支持 AI 小票识别、物品过期提醒、购物清单管理等功能。

## 功能特性

- **AI 小票识别** - 使用 Gemini AI 自动识别购物小票，提取物品信息
- **库存管理** - 分类管理食品、药品、日用品等库存物品
- **过期提醒** - 自动追踪物品过期日期，提前提醒
- **购物清单** - 便捷的购物清单管理，一键移入库存
- **数据统计** - 可视化展示库存数据
- **用户认证** - 完整的用户注册、登录系统

## 技术栈

### 前端
- React 19.2.3
- TypeScript 5.8.2
- Vite 6.2.0
- Tailwind CSS
- Recharts（数据可视化）

### 后端
- Node.js + Express
- Supabase（数据库）
- JWT（用户认证）
- Gemini AI（小票识别）

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js (v18 或更高版本)
- npm 或 yarn

### 2. 配置 Supabase

1. 访问 [Supabase](https://supabase.com) 创建账号并创建新项目
2. 在项目设置中获取：
   - Project URL
   - Service Role Key (API Key)

3. 在 Supabase SQL Editor 中执行以下命令创建数据库表：

```bash
cd server
npm run db:push
```

或者在 SQL Editor 中手动运行 `server/src/utils/dbSchema.js` 中的 SQL 语句。

### 3. 安装依赖

```bash
# 安装所有依赖（前端 + 后端）
npm run install:all
```

### 4. 配置环境变量

#### 前端配置 (.env.local)
```bash
cp .env.example .env.local
```

编辑 `.env.local`：
```env
VITE_API_URL=http://localhost:3001/api
GEMINI_API_KEY=your-gemini-api-key
```

#### 后端配置 (server/.env)
```bash
cp server/.env.example server/.env
```

编辑 `server/.env`：
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 5. 启动应用

**方式一：同时启动前后端**
```bash
npm run dev:all
```

**方式二：分别启动**
```bash
# 终端 1 - 启动后端
npm run dev:server

# 终端 2 - 启动前端
npm run dev
```

### 6. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001

## API 接口文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料

### 物品管理
- `GET /api/items` - 获取物品列表
- `GET /api/items/:id` - 获取物品详情
- `POST /api/items` - 创建物品
- `PUT /api/items/:id` - 更新物品
- `DELETE /api/items/:id` - 删除物品
- `GET /api/items/stats/summary` - 获取统计信息

### 购物清单
- `GET /api/shopping` - 获取购物清单
- `POST /api/shopping` - 添加购物项
- `PUT /api/shopping/:id` - 更新购物项
- `DELETE /api/shopping/:id` - 删除购物项
- `DELETE /api/shopping/clear/all` - 清空购物清单
- `POST /api/shopping/move-to-inventory` - 移入库存

### 分类管理
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### AI 扫描
- `POST /api/scan/receipt` - 扫描小票
- `POST /api/scan/save-to-shopping-list` - 保存到购物清单
- `POST /api/scan/save-to-inventory` - 保存到库存

## 项目结构

```
smartpantry/
├── server/                 # 后端代码
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── routes/        # API 路由
│   │   ├── middleware/    # 中间件
│   │   └── utils/         # 工具函数
│   └── package.json
├── src/                   # 前端代码
│   ├── components/        # React 组件
│   ├── pages/            # 页面组件
│   ├── utils/            # 工具函数（API 客户端）
│   └── types.ts          # TypeScript 类型定义
├── package.json
└── README.md
```

## 部署

### 前端部署
```bash
npm run build
```
构建产物在 `dist/` 目录，可部署到任何静态托管服务。

### 后端部署
```bash
cd server
npm start
```

建议使用 PM2 或其他进程管理工具：
```bash
npm install -g pm2
pm2 start src/index.js --name smartpantry-api
```

## 许可证

MIT License

## 启动问题
  npm run dev:all

  这个命令会同时启动：
  - 前端：http://localhost:3000 (Vite 开发服务器)
  - 后端：http://localhost:3001 (Express API 服务器)

  如果将来再次遇到端口被占用的问题，可以使用：

  # 查看占用端口的进程
  lsof -i:3001

  # 停止占用端口的进程
  lsof -ti:3001 | xargs kill -9

---

使用测试账号登录：
    - 邮箱: test@smartpantry.com
    - 密码: 使用测试账号登录：
    - 邮箱: test@smartpantry.com
    - 密码: test123456

