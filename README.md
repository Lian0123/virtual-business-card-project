# Virtual Business Card Project｜數位名片製作工具

可在瀏覽器中建立、編輯、預覽與匯出專業數位名片，支援 PWA、WebMCP（JSON-RPC）遠端操作，以及多種匯出格式（PNG/JPG/WebP/HTML/VCF）。

## Languages
- 繁體中文（目前頁）
- English: [README.en.md](README.en.md)
- 日本語: [README.ja.md](README.ja.md)
- 한국어: [README.ko.md](README.ko.md)
- Français: [README.fr.md](README.fr.md)
- ไทย: [README.th.md](README.th.md)
- Español: [README.es.md](README.es.md)
- Português: [README.pt.md](README.pt.md)
- Deutsch: [README.de.md](README.de.md)
- Bahasa Indonesia: [README.id.md](README.id.md)
- Русский: [README.ru.md](README.ru.md)
- Polski: [README.pl.md](README.pl.md)
- Türkçe: [README.tr.md](README.tr.md)
- العربية: [README.ar.md](README.ar.md)

## Demo
- 主站: https://lian0123.github.io/virtual-business-card-project/
- WebMCP 範例頁: https://lian0123.github.io/virtual-business-card-project/webmcp-example.html
- WebMCP 能力描述: https://lian0123.github.io/virtual-business-card-project/webmcp.json
- WebMCP OpenAPI 3.1: https://lian0123.github.io/virtual-business-card-project/webmcp.openapi.yaml

## SEO / Discoverability Keywords
`virtual business card`, `digital business card`, `business card maker`, `webmcp`, `mcp`, `json-rpc`, `openapi`, `pwa`, `ai tool integration`, `card export`, `vcard generator`

## 核心功能
- 名片編輯：姓名、職稱、公司、聯絡資訊、地址、網站、自介
- 視覺設計：主題、模板、背景圖、漸層、邊框、動畫、貼圖
- 匯出格式：PNG / JPG / WebP / HTML / VCF
- PWA：可安裝、離線快取、接近 App 的啟動體驗
- WebMCP：提供 `tools/list`、`tools/call` 與 `card.*` 工具供 AI/Agent 呼叫

## WebMCP 快速使用
### 1) 列出工具
```bash
curl -X POST "https://lian0123.github.io/virtual-business-card-project/api/webmcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/list",
    "params":{}
  }'
```

### 2) 修改欄位
```bash
curl -X POST "https://lian0123.github.io/virtual-business-card-project/api/webmcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"card.updateField",
      "arguments":{"field":"name","value":"Alex Chen"}
    }
  }'
```

### 3) 匯出名片
```bash
curl -X POST "https://lian0123.github.io/virtual-business-card-project/api/webmcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"card.export",
      "arguments":{"format":"png"}
    }
  }'
```

## 文件導覽
- WebMCP 開發指南: [docs/WEBMCP_GUIDE.md](docs/WEBMCP_GUIDE.md)
- 快速開始: [docs/QUICKSTART.md](docs/QUICKSTART.md)
- 功能說明: [docs/FEATURES.md](docs/FEATURES.md)
- 常見問題: [docs/FAQ.md](docs/FAQ.md)
- 瀏覽器相容性: [docs/BROWSER_COMPATIBILITY.md](docs/BROWSER_COMPATIBILITY.md)

## 本機開發
```bash
npm install
npm run start
```

## Smoke Test
```bash
npm run smoke:test
```

## 專案結構
```text
.
├── index.html
├── sw.js
├── manifest.webmanifest
├── webmcp.json
├── webmcp.openapi.yaml
├── webmcp-example.html
├── scripts/webmcp-smoke-test.mjs
└── docs/
```

## 安全說明
目前 WebMCP 為 `authType: none`（無內建驗證）。
若部署到公開環境，建議在反向代理/API Gateway 層加入：
- API Key 或簽章驗證
- Rate limiting
- 操作審計日誌

## License
MIT
