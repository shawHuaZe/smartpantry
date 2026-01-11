import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);

    // 验证 JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 从数据库获取用户信息
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的令牌' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    return res.status(500).json({ error: '认证失败' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: user } = await supabase
        .from('users')
        .select('id, email, username')
        .eq('id', decoded.userId)
        .single();

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // 可选认证，忽略错误继续
    next();
  }
};
