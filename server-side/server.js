const express = require('express');
const cors = require('cors');
const connection = require('./event_db'); // 导入数据库连接

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 1. 首页API：获取所有活跃的、未来的活动
app.get('/api/events/home', (req, res) => {
  const query = `
    SELECT e.*, c.name AS category_name 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.is_active = TRUE
    ORDER BY e.date ASC
  `;
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 2. 搜索API：根据条件筛选活动
app.get('/api/events/search', (req, res) => {
  const { category, location, date } = req.query;
  let query = `
    SELECT e.*, c.name AS category_name 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.is_active = TRUE
  `;
  let params = [];

  if (category) {
    query += ` AND c.name = ?`;
    params.push(category);
  }
  if (location) {
    query += ` AND e.location LIKE ?`;
    params.push(`%${location}%`);
  }
  if (date) {
    query += ` AND DATE(e.date) = ?`;
    params.push(date);
  }

  connection.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 3. 获取所有类别（用于搜索页面的下拉菜单）
app.get('/api/categories', (req, res) => {
  connection.query('SELECT * FROM categories', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// 4. 活动详情API：根据ID获取单个活动的所有信息
app.get('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  const query = `
    SELECT e.*, c.name AS category_name 
    FROM events e 
    JOIN categories c ON e.category_id = c.id 
    WHERE e.id = ?
  `;
  connection.query(query, [eventId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(results[0]);
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});