import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// 检查 Supabase 配置
if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-project-url') {
  console.warn('\n⚠️  警告: Supabase 配置未设置');
  console.warn('请按照以下步骤配置 Supabase:');
  console.warn('1. 访问 https://supabase.com 创建账号和项目');
  console.warn('2. 在 server/.env 文件中设置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY');
  console.warn('3. 运行 npm run db:push 初始化数据库表\n');
  console.warn('当前使用模拟模式，数据将不会持久化。\n');
}

// 如果配置有效，创建 Supabase 客户端；否则创建模拟客户端
export let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('创建 Supabase 客户端失败:', error.message);
  }
}

export const isSupabaseConfigured = !!supabase;

export default supabase;
