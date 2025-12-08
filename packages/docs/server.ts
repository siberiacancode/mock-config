import http from 'node:http';
import handler from 'serve-handler';

const PORT = 3000;
const BASE_PATH = '/mock-config';
const OUT_DIR = 'out';

const server = http.createServer((req, res) => {
  if (!req.url) {
    req.url = '/';
  }

  if (req.url.startsWith(BASE_PATH)) {
    const stripped = req.url.slice(BASE_PATH.length);
    req.url = stripped.length > 0 ? stripped : '/';
  }

  if (!req.url.startsWith('/')) {
    req.url = `/${req.url}`;
  }

  return handler(req, res, {
    public: OUT_DIR
  });
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT} (serving "${OUT_DIR}")`);
});
