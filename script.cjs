/* 极简静态服务器：把本目录里的圣诞树通过 HTTP 分享给手机访问
   启动：node serve-tree.cjs 8080 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent((req.url || '/').split('?')[0]); }
  catch (e) { urlPath = '/'; }

  // /download/xxx 表示当作附件下载（方便手机上保存页面、离线打开）
  let download = false;
  if (urlPath.indexOf('/download/') === 0) {
    download = true;
    urlPath = urlPath.slice('/download'.length);
  }

  if (!urlPath || urlPath === '/') urlPath = '/christmas-tree.html';

  const rel = path.normalize(urlPath).replace(/^[\\/]+/, '');
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 forbidden');
  }

  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 not found: ' + urlPath);
    }
    const headers = {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    };
    if (download) {
      headers['Content-Disposition'] = 'attachment; filename="' + path.basename(file) + '"';
    }
    res.writeHead(200, headers);
    res.end(buf);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const ips = [];
  Object.keys(nets).forEach(function (k) {
    (nets[k] || []).forEach(function (n) {
      if (n.family === 'IPv4' && !n.internal) ips.push(n.address);
    });
  });
  console.log('星光圣诞树已上线（端口 ' + PORT + '）');
  console.log('  本机打开: http://127.0.0.1:' + PORT + '/');
  ips.forEach(function (ip) {
    console.log('  手机打开: http://' + ip + ':' + PORT + '/');
  });
});
