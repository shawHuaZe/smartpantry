import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import bcrypt from 'bcrypt';

/**
 * 插入测试数据到数据库
 */

const testUser = {
  email: 'test@smartpantry.com',
  password: 'test123456',
  username: '测试用户'
};

const testCategories = [
  { name: '食品', icon: 'restaurant', color: '#339cff' },
  { name: '医药', icon: 'medical_services', color: '#ff6b6b' },
  { name: '日用品', icon: 'shopping_basket', color: '#51cf66' },
  { name: '其他', icon: 'category', color: '#9775fa' }
];

const testItems = [
  {
    name: '有机全脂牛奶',
    description: 'DairyFresh • 1L',
    quantity: 2,
    category: 'Food',
    expiry_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4天后
    purchase_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-A9wmd13hxsdBAL1OriRJScVNzfFpcyMA4AdSLPeQ2T2rI0BaWNjnX6DNxtLtspeaa_aMomlsb-esO74tQZcpc0Nw1faCKcmm7o-zPD4BJY07-XMT_VGoucrq-fVW42f-63cv2dxzk2UW_wGE6DGxL-9UwM6ugxrkG9J-fScvCEPCTR2Qwfa83JsClEhQZ8QjGGieRnwYYOvdP8l4QudTwU2D2rPxXUWjadLjQUa_3C5JLxH_SA8JzGSW442Zt7_OPV89dG_J1Ok',
    rating: 4.8,
    tags: ['乳制品', '有机'],
    is_expiring_soon: true,
    is_recommended: true
  },
  {
    name: '布洛芬 200mg',
    description: '60粒/瓶',
    quantity: 1,
    category: 'Medicine',
    expiry_date: '2026-03-15',
    purchase_date: '2025-10-12',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDj_WKVKeubQucSLQETLRnCHkFL4iX4F037oeG4QAs9_Cd957n5CKwmMsbqAgSUivV40Iq4eLVZC2p7eTZiT6sSQ_BADAXFZynOrSg_baRDiM5cdq6QYUwYJJHREkcsdr1bk6jRDMIsi6INH8KwOlkjEAWo1qv1MHObaklF-1uHHYQI0lgFKO9mQOo85YgxvIB322xwrrqbwkD3kcTEYjFIy6IiSRByMVl85E_a8ErmTRE-ZNScHXn_RVKy5ynhLi1Z5eCEISpLjsw',
    rating: 5.0,
    tags: ['止痛', '感冒'],
    is_expiring_soon: false,
    is_recommended: true
  },
  {
    name: '新鲜鸡蛋 12枚',
    description: '土鸡蛋 • 600g',
    quantity: 1,
    category: 'Food',
    expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purchase_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOZ5r9KWhkiW7ATkvaqZ3Ks7bv2xfPnKCsrraBLMW4kEfm2ihoEYvmSiW9BkUl4sVEbYV6PvB06QiLeB-hvFOD1PFuEgjt9u-JrTAz6v-IRfw6Kxk9Ap4S-sJq50kNb_kqd1YrTsNUsBmr0um4_giL_iZ0NammGPZYplaig7rKHWegItdeRwl1yGFfkmXW_MJ1ldP9Svz-m6Zm6Wei-_Q1mrdGaMNwZTl5hWKy8nhFQsGOUgeKhv6EOcLx3JI0pKgox5PwQParwDk',
    rating: 4.5,
    tags: ['蛋白质', '早餐'],
    is_expiring_soon: false,
    is_recommended: false
  },
  {
    name: '氯雷他定片',
    description: '10mg*10片/盒',
    quantity: 2,
    category: 'Medicine',
    expiry_date: '2025-12-31',
    purchase_date: '2025-08-15',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvu0qj8CbEg3IWgvFpvc4bWaXE-FOUrYlFd426uRxolOSt-BxdOwYt3WVJwbn4xbTzGUzVQGpy8gUB2P07zeTJkfU-SXmZreHM-uP5fn7b3RjGN_0BSw1ENIy2uOyGszjl4yE5AoundevmqVnpug41yUT78SvkeIZmHk5L_a_3wZrHpmwtlR8QDuflHznll-b-wSjoglOylVi0tNnlshvTGNLhe6lbY6mVtiIuQOnm3aarjfyWxGhdGx3UQ4lMp0T3R0jJyX7xiys',
    rating: 4.7,
    tags: ['过敏'],
    is_expiring_soon: false,
    is_recommended: true
  },
  {
    name: '感冒止咳糖浆',
    description: '120ml/瓶',
    quantity: 1,
    category: 'Medicine',
    expiry_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purchase_date: '2025-09-20',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOZ5r9KWhkiW7ATkvaqZ3Ks7bv2xfPnKCsrraBLMW4kEfm2ihoEYvmSiW9BkUl4sVEbYV6PvB06QiLeB-hvFOD1PFuEgjt9u-JrTAz6v-IRfw6Kxk9Ap4S-sJq50kNb_kqd1YrTsNUsBmr0um4_giL_iZ0NammGPZYplaig7rKHWegItdeRwl1yGFfkmXW_MJ1ldP9Svz-m6Zm6Wei-_Q1mrdGaMNwZTl5hWKy8nhFQsGOUgeKhv6EOcLx3JI0pKgox5PwQParwDk',
    rating: 4.6,
    tags: ['止咳', '感冒'],
    is_expiring_soon: true,
    is_recommended: true
  },
  {
    name: '全麦吐司',
    description: '阳光烘焙 • 400g',
    quantity: 1,
    category: 'Food',
    expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purchase_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString().split('T')[0],
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400',
    rating: 4.3,
    tags: ['烘焙', '早餐'],
    is_expiring_soon: false,
    is_recommended: false
  },
  {
    name: '除菌洗手液',
    description: '500ml 替换装',
    quantity: 3,
    category: 'Home',
    expiry_date: null,
    purchase_date: '2025-10-01',
    image: 'https://images.unsplash.com/photo-1584117719253-1ce2e1c7e9a2?w=400',
    rating: 4.5,
    tags: ['清洁', '日用品'],
    is_expiring_soon: false,
    is_recommended: true
  },
  {
    name: '超韧抽纸',
    description: '3层 120抽x6包',
    quantity: 2,
    category: 'Home',
    expiry_date: null,
    purchase_date: '2025-09-15',
    image: 'https://images.unsplash.com/photo-1584030373081-f37b08456b91?w=400',
    rating: 4.7,
    tags: ['纸品', '日用品'],
    is_expiring_soon: false,
    is_recommended: false
  }
];

const testShoppingList = [
  {
    name: '有机希腊酸奶',
    sub: 'DairyFresh • 500g',
    count: 2,
    category: '食品',
    icon: 'restaurant',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJhWp5zestQbrOrgO4T_W4LzSlWjX0lR9maK2NIWA5BDkbyLeHiRyh0oDXJ3oXlYIsUkXyKwUyJcZ0zCXqFaORuyaCqnvuOwrQj4y4-ydscUEbMG8Ybf10ysEluqodhEZZssL8nYkhJuk4T3NwnqBucuaklE0vPX8k1Ugxhsqqc7m1PAYD4Y1YAmm86G2pfhoVFA3virSWexdUu4EENtjZzE9vl-sbFwbKDW-cCK5VL0ZevuEZQ6W7l_AcEL5pA_QFK9WjNDVu_uY'
  },
  {
    name: '复合维生素',
    sub: '60粒/瓶',
    count: 1,
    category: '医药',
    icon: 'medical_services'
  }
];

async function seedDatabase() {
  if (!isSupabaseConfigured) {
    console.error('❌ Supabase 未配置，无法插入测试数据');
    console.log('请在 server/.env 中配置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY');
    return;
  }

  console.log('🌱 开始插入测试数据...\n');

  try {
    // 1. 创建或获取测试用户
    console.log('1️⃣  创建测试用户...');

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .single();

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      console.log('   ✓ 测试用户已存在');
    } else {
      const passwordHash = await bcrypt.hash(testUser.password, 10);
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: testUser.email,
          password_hash: passwordHash,
          username: testUser.username
        })
        .select('id')
        .single();

      if (userError) throw userError;
      userId = newUser.id;
      console.log('   ✓ 测试用户创建成功');
    }

    console.log(`   用户ID: ${userId}\n`);

    // 2. 创建分类
    console.log('2️⃣  创建分类...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .insert(testCategories.map(cat => ({
        user_id: userId,
        ...cat
      })))
      .select();

    if (categoriesError) {
      // 分类可能已存在，尝试获取现有分类
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (existingCategories && existingCategories.length > 0) {
        console.log('   ✓ 使用现有分类');
      } else {
        throw categoriesError;
      }
    } else {
      console.log(`   ✓ 创建了 ${categories.length} 个分类`);
    }
    console.log();

    // 3. 创建物品
    console.log('3️⃣  创建物品...');
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .insert(testItems.map(item => ({
        user_id: userId,
        ...item
      })))
      .select();

    if (itemsError) throw itemsError;
    console.log(`   ✓ 创建了 ${items.length} 个物品\n`);

    // 4. 创建购物清单
    console.log('4️⃣  创建购物清单...');
    const { data: shoppingItems, error: shoppingError } = await supabase
      .from('shopping_list')
      .insert(testShoppingList.map(item => ({
        user_id: userId,
        ...item
      })))
      .select();

    if (shoppingError) throw shoppingError;
    console.log(`   ✓ 创建了 ${shoppingItems.length} 个购物项\n`);

    console.log('✅ 测试数据插入成功！\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 登录信息：');
    console.log(`   邮箱: ${testUser.email}`);
    console.log(`   密码: ${testUser.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 显示统计信息
    console.log('📊 数据统计：');
    console.log(`   • 物品总数: ${items.length}`);
    console.log(`   • 即将过期: ${items.filter(i => i.is_expiring_soon).length}`);
    console.log(`   • 购物清单: ${shoppingItems.length}\n`);

  } catch (error) {
    console.error('❌ 插入数据失败:', error.message);
    if (error.code) {
      console.error(`   错误代码: ${error.code}`);
      console.error(`   错误详情: ${error.hint || error.message}`);
    }
  }
}

// 运行脚本
seedDatabase();
