import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './config/supabase.js';

// 路由导入
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import shoppingRoutes from './routes/shopping.js';
import categoryRoutes from './routes/categories.js';
import scanRoutes from './routes/scan.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartPantry API is running' });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/ai', aiRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     SmartPantry Backend Server                 ║
╠════════════════════════════════════════════════╣
║  环境: ${process.env.NODE_ENV || 'development'}${' '.repeat(37)}║
║  端口: ${PORT}${' '.repeat(41)}║
║  时间: ${new Date().toLocaleString('zh-CN')}${' '.repeat(19)}║
╚════════════════════════════════════════════════╝
  `);
  console.log('API 端点:');
  console.log(`  - POST   /api/auth/register    用户注册`);
  console.log(`  - POST   /api/auth/login       用户登录`);
  console.log(`  - GET    /api/items            获取物品列表`);
  console.log(`  - POST   /api/items            创建物品`);
  console.log(`  - GET    /api/shopping         获取购物清单`);
  console.log(`  - POST   /api/shopping         添加购物项`);
  console.log(`  - POST   /api/scan/receipt     扫描小票`);
  console.log('');
});
