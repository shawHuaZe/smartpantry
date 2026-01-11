# SmartPantry 快速设置指南

## 第一步：配置 Supabase

1. 访问 [https://supabase.com](https://supabase.com) 注册账号
2. 创建新项目（选择免费套餐即可）
3. 进入项目设置 -> API，复制：
   - Project URL
   - service_role (secret) Key

4. 在 SQL Editor 中执行以下 SQL（或运行 `npm run db:push`）：

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'category',
    color VARCHAR(20) DEFAULT '#339cff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- 物品表
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    category VARCHAR(20) DEFAULT 'Other',
    expiry_date DATE,
    purchase_date DATE,
    image TEXT,
    rating DECIMAL(2,1) DEFAULT 0,
    tags TEXT[],
    is_expiring_soon BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 购物清单表
CREATE TABLE IF NOT EXISTS shopping_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sub TEXT,
    count INTEGER DEFAULT 1,
    category VARCHAR(50),
    icon VARCHAR(50),
    image TEXT,
    checked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
```

## 第二步：配置环境变量

### 后端配置 (server/.env)
```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
GEMINI_API_KEY=AIzaSy...
```

### 前端配置 (.env.local)
```bash
VITE_API_URL=http://localhost:3001/api
GEMINI_API_KEY=AIzaSy...
```

## 第三步：安装依赖并启动

```bash
# 安装所有依赖
npm run install:all

# 启动后端和前端
npm run dev:all
```

## 访问应用

- 前端：http://localhost:3000
- 后端：http://localhost:3001
- 健康检查：http://localhost:3001/health

## 获取 Gemini API Key

1. 访问 [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. 登录 Google 账号
3. 点击 "Create API key" 创建新的 API 密钥
4. 复制密钥到环境变量文件

## 故障排除

### 问题：端口已被占用
修改 `server/.env` 中的 PORT 为其他值

### 问题：数据库连接失败
检查 Supabase URL 和 Key 是否正确配置

### 问题：CORS 错误
确保 `server/.env` 中的 FRONTEND_URL 与前端访问地址一致
