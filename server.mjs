import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChatRequest, setHistoryEnabled } from './api/chat.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer(async (req, res) => {
  // ✅ Route: Toggle Chat History
  if (req.method === 'POST' && req.url === '/toggle-history') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const { enabled } = JSON.parse(body);
        setHistoryEnabled(enabled);
        res.writeHead(200);
        res.end('History toggle updated ✅');
      } catch (err) {
        res.writeHead(400);
        res.end('Invalid toggle input ❌');
      }
    });
    return;
  }

  // ✅ Route: Chat Handling
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const { query } = JSON.parse(body);
        const reply = await handleChatRequest(query);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        console.error("❌ Chat handling error:", err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: 'Server error occurred 😓' }));
      }
    });
    return;
  }

  // ✅ Serve Static Files (index.html, style.css, script.js)
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();

  const contentTypeMap = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
  };
  const contentType = contentTypeMap[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
