// Local prototype server. No external dependencies or persistent user data.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomInt } = require('node:crypto');
const root = __dirname;
const fortunes = JSON.parse(fs.readFileSync(path.join(root, 'fortune.json'), 'utf8'));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'};
const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status, data) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(data, null, 2)); };
  if (req.method !== 'GET') return reply(405, {error:'GETを使ってください。'});
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/fortune.api') {
    const month = url.searchParams.get('month');
    if (!/^(?:[1-9]|1[0-2])$/.test(month || '')) return reply(400, {error:'monthに1〜12を指定してください。'});
    let choices = fortunes[month];
    const exclude = url.searchParams.get('exclude');
    if (exclude) choices = choices.filter(item => item.id !== exclude);
    const item = choices[randomInt(choices.length)];
    return reply(200, {month:Number(month), ...item});
  }
  // Deliberately expose only the prototype and its image assets, not source/tools.
  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  if (!['index.html','style.css','app.js','fortune.json','sprite-gallery.html'].includes(name) && !/^images\/fortune-\d{2}-\d{2}\.png$/.test(name)) return reply(404, {error:'見つかりません。'});
  const file = path.join(root, name);
  fs.readFile(file, (err, data) => {
    if (err) return reply(404, {error:'見つかりません。'});
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
});
const port = Number(process.env.FORTUNE_PORT || 4178);
server.listen(port, '127.0.0.1', () => console.log(`Fortune mock: http://localhost:${port}/`));
server.on('error', error => { console.error(`起動できません: ${error.message}`); process.exitCode = 1; });
