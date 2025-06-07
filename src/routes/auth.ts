import { Router } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

const router = Router();

// Simple authentication for demo purposes
// In production, implement proper user management
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Demo credentials
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign(
      { id: '1', role: 'admin' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({ token });
  } else if (username === 'user' && password === 'user') {
    const token = jwt.sign(
      { id: '2', role: 'user' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

export default router;

