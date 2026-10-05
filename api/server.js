// Learning sample: listens only on this computer. Start with node server.js.
const http = require('node:http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'GET' && req.url === '/api/hello') {
    res.end(JSON.stringify({ message: 'こんにちは、API！' }));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: '窓口が見つかりません' }));
});

server.listen(3000, '127.0.0.1', () => {
  console.log('http://localhost:3000/api/hello');
});
