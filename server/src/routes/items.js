import express from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/items
 * @desc    获取用户的所有物品
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, search, expiring } = req.query;

    let query = supabase
      .from('items')
      .select('*, categories(name, icon, color)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    // 按分类筛选
    if (category) {
      query = query.eq('category', category);
    }

    // 搜索功能
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: items, error } = await query;

    if (error) {
      return res.status(500).json({ error: '获取物品失败' });
    }

    // 如果查询过期物品，动态计算并过滤
    let filteredItems = items;
    if (expiring === 'true' && items) {
      const today = new Date();
      filteredItems = items.filter(item => {
        if (!item.expiry_date) return false;

        const expiryDate = new Date(item.expiry_date);
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // 包括已过期或7天内过期的物品
        return diffDays <= 7;
      });
    }

    res.json({ items: filteredItems });
  } catch (error) {
    console.error('获取物品错误:', error);
    res.status(500).json({ error: '服务器服务器错误' });
  }
});

/**
 * @route   GET /api/items/:id
 * @desc    获取单个物品详情
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: item, error } = await supabase
      .from('items')
      .select('*, categories(name, icon, color)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !item) {
      return res.status(404).json({ error: '物品不存在' });
    }

    res.json({ item });
  } catch (error) {
    console.error('获取物品详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   POST /api/items
 * @desc    创建新物品
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      quantity,
      category,
      expiry_date,
      purchase_date,
      image,
      rating,
      tags,
      category_id
    } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '物品名称不能为空' });
    }

    // 如果没有提供购买日期，默认设置为今天
    const finalPurchaseDate = purchase_date || new Date().toISOString().split('T')[0];

    // 检查是否即将过期 (7天内)
    let is_expiring_soon = false;
    if (expiry_date) {
      const expiry = new Date(expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      is_expiring_soon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        user_id: req.user.id,
        category_id,
        name,
        description,
        quantity: quantity || 1,
        category: category || 'Other',
        expiry_date,
        purchase_date: finalPurchaseDate,
        image,
        rating,
        tags,
        is_expiring_soon
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: '创建物品失败' });
    }

    res.status(201).json({
      message: '创建成功',
      item
    });
  } catch (error) {
    console.error('创建物品错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   PUT /api/items/:id
 * @desc    更新物品
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      quantity,
      category,
      expiry_date,
      purchase_date,
      image,
      rating,
      tags,
      is_recommended
    } = req.body;

    // 检查物品是否存在且属于当前用户
    const { data: existingItem } = await supabase
      .from('items')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!existingItem) {
      return res.status(404).json({ error: '物品不存在' });
    }

    // 检查是否即将过期
    let is_expiring_soon = existingItem.is_expiring_soon;
    if (expiry_date && expiry_date !== existingItem.expiry_date) {
      const expiry = new Date(expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      is_expiring_soon = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }

    const { data: item, error } = await supabase
      .from('items')
      .update({
        name,
        description,
        quantity,
        category,
        expiry_date,
        purchase_date,
        image,
        rating,
        tags,
        is_recommended,
        is_expiring_soon,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: '更新物品失败' });
    }

    res.json({
      message: '更新成功',
      item
    });
  } catch (error) {
    console.error('更新物品错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   DELETE /api/items/:id
 * @desc    删除物品
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: '删除物品失败' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除物品错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   GET /api/items/stats/summary
 * @desc    获取物品统计信息
 */
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    // 获取所有物品
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: '获取统计信息失败' });
    }

    // 计算总物品数
    const total = items?.length || 0;

    // 动态计算即将过期物品数（7天内过期或已过期）
    const today = new Date();
    const expiringCount = items?.filter(item => {
      if (!item.expiry_date) return false;

      const expiryDate = new Date(item.expiry_date);
      const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return diffDays <= 7;
    }).length || 0;

    // 按分类统计
    const categoryCounts = {};
    items?.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });

    res.json({
      total,
      expiring: expiringCount,
      byCategory: categoryCounts
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
