import express from 'express';
import { supabase } from '../config/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/categories
 * @desc    获取用户的所有分类
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*, items(count)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: '获取分类失败' });
    }

    res.json({ categories });
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   POST /api/categories
 * @desc    创建新分类
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '分类名称不能为空' });
    }

    // 检查分类是否已存在
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('name', name)
      .single();

    if (existingCategory) {
      return res.status(400).json({ error: '该分类已存在' });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: req.user.id,
        name,
        icon: icon || 'category',
        color: color || '#339cff'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: '创建分类失败' });
    }

    res.status(201).json({
      message: '创建成功',
      category
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    更新分类
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, icon, color } = req.body;

    // 检查分类是否存在
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!existingCategory) {
      return res.status(404).json({ error: '分类不存在' });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name,
        icon,
        color
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: '更新分类失败' });
    }

    res.json({
      message: '更新成功',
      category
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    删除分类
 * @query   {boolean} moveItems - 是否将物品移动到"其他"分类，默认false（删除物品）
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { moveItems } = req.query;
    const shouldMoveItems = moveItems === 'true';

    // 检查分类是否存在
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    // 处理该分类下的物品
    if (shouldMoveItems) {
      // 将所有该分类的物品移动到"Other"分类
      await supabase
        .from('items')
        .update({ category: 'Other' })
        .eq('category', req.params.id)
        .eq('user_id', req.user.id);
    } else {
      // 删除该分类下的所有物品
      await supabase
        .from('items')
        .delete()
        .eq('category', req.params.id)
        .eq('user_id', req.user.id);
    }

    // 删除分类
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: '删除分类失败' });
    }

    res.json({
      message: shouldMoveItems ? '分类已删除，物品已移动到其他' : '分类及其物品已删除'
    });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
