const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const root = __dirname;
const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8"
};

const server = http.createServer((request, response) => {
  const safePath = decodeURIComponent(request.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  const filePath = path.normalize(path.join(root, safePath));

  if (filePath !== root && !filePath.startsWith(rootWithSep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": types[path.extname(filePath)] || "application/octet-stream" });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Impact Links running at http://${host}:${port}`);
});
