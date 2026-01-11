import express from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/shopping
 * @desc    获取用户的购物清单
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: '获取购物清单失败' });
    }

    res.json({ items });
  } catch (error) {
    console.error('获取购物清单错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   POST /api/shopping
 * @desc    添加购物项
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, sub, count, category, icon, image, item_id } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '物品名称不能为空' });
    }

    const { data: item, error } = await supabase
      .from('shopping_list')
      .insert({
        user_id: req.user.id,
        item_id,
        name,
        sub,
        count: count || 1,
        category: category || '其他',
        icon,
        image
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: '添加购物项失败' });
    }

    res.status(201).json({
      message: '添加成功',
      item
    });
  } catch (error) {
    console.error('添加购物项错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   PUT /api/shopping/:id
 * @desc    更新购物项
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, sub, count, category, icon, image, checked } = req.body;

    // 检查购物项是否存在
    const { data: existingItem } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!existingItem) {
      return res.status(404).json({ error: '购物项不存在' });
    }

    const { data: item, error } = await supabase
      .from('shopping_list')
      .update({
        name,
        sub,
        count,
        category,
        icon,
        image,
        checked,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: '更新购物项失败' });
    }

    res.json({
      message: '更新成功',
      item
    });
  } catch (error) {
    console.error('更新购物项错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   DELETE /api/shopping/:id
 * @desc    删除购物项
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: '删除购物项失败' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除购物项错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   DELETE /api/shopping/clear/all
 * @desc    清空购物清单
 */
router.delete('/clear/all', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: '清空购物清单失败' });
    }

    res.json({ message: '清空成功' });
  } catch (error) {
    console.error('清空购物清单错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   POST /api/shopping/move-to-inventory
 * @desc    将购物项移入库存
 */
router.post('/move-to-inventory', authMiddleware, async (req, res) => {
  try {
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: '请选择要移入库存的物品' });
    }

    // 获取购物项
    const { data: shoppingItems, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', req.user.id)
      .in('id', itemIds);

    if (error) {
      return res.status(500).json({ error: '获取购物项失败' });
    }

    // 批量创建物品
    const itemsToCreate = shoppingItems.map(item => ({
      user_id: req.user.id,
      name: item.name,
      description: item.sub,
      quantity: item.count,
      category: item.category === '食品' ? 'Food' :
                item.category === '医药' ? 'Medicine' :
                item.category === '日用品' ? 'Home' : 'Other',
      image: item.image
    }));

    const { data: newItems, error: insertError } = await supabase
      .from('items')
      .insert(itemsToCreate)
      .select();

    if (insertError) {
      return res.status(500).json({ error: '创建物品失败' });
    }

    // 删除已移入库存的购物项
    await supabase
      .from('shopping_list')
      .delete()
      .eq('user_id', req.user.id)
      .in('id', itemIds);

    res.json({
      message: `成功将 ${itemIds.length} 件物品移入库存`,
      items: newItems
    });
  } catch (error) {
    console.error('移入库存错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
