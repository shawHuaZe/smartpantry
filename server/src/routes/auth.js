import express from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和密码' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6个字符' });
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    // 加密密码
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        username: username || email.split('@')[0]
      })
      .select('id, email, username')
      .single();

    if (error) {
      return res.status(500).json({ error: '注册失败' });
    }

    // 生成 token
    const token = generateToken(newUser.id);

    res.status(201).json({
      message: '注册成功',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: '请提供邮箱和密码' });
    }

    // 查找用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成 token
    const token = generateToken(user.id);

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url
      },
      token
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    获取当前用户信息
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, avatar_url, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    更新用户资料
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, avatar_url } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        username,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select('id, email, username, avatar_url')
      .single();

    if (error) {
      return res.status(500).json({ error: '更新失败' });
    }

    res.json({
      message: '更新成功',
      user
    });
  } catch (error) {
    console.error('更新用户资料错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
