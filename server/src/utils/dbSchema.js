import { supabase } from '../config/supabase.js';

/**
 * 创建 Supabase 数据库表
 * 运行此脚本以初始化数据库架构
 */

const SQL_SCHEMA = `
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
    category ENUM('Food', 'Medicine', 'Home', 'Other') DEFAULT 'Other',
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

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_expiry_date ON items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 items 表添加更新时间触发器
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 shopping_list 表添加更新时间触发器
CREATE TRIGGER update_shopping_list_updated_at BEFORE UPDATE ON shopping_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 为 users 表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

// 显示 SQL 架构
console.log('===== SmartPantry 数据库架构 =====\n');
console.log(SQL_SCHEMA);
console.log('\n====================================\n');
console.log('请在 Supabase SQL Editor 中执行以上 SQL 语句来创建数据库表。\n');
console.log('或者访问 Supabase Dashboard -> SQL Editor，粘贴并运行上述 SQL。\n');

export { SQL_SCHEMA };
