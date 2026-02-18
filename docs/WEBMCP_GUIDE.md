# WebMCP 開發與整合指南

## 1. 功能概覽
本專案提供 WebMCP（JSON-RPC 2.0）能力，支援遠端控制名片頁面：
- 修改文字與樣式欄位（`card.updateField`）
- 批次更新欄位與整體狀態（`card.updateFields` / `card.setState`）
- 變更背景圖（`card.setBackgroundImage`）
- 調整版面參數（`card.updateLayout`）
- 匯出卡片（`card.export`）
- 模擬操作（`card.simulateAction`）
- 取得完整狀態（`card.getState`）

相關檔案：
- `index.html`：WebMCP 主邏輯與工具實作
- `sw.js`：HTTP 端點 `/api/webmcp` 橋接
- `webmcp.json`：能力描述
- `webmcp-example.html`：手動測試頁

## 2. 傳輸方式
### A. postMessage
- Request type: `WEB_MCP_REQUEST`
- Response type: `WEB_MCP_RESPONSE`
- 方法：`tools/list`、`tools/call`

### B. HTTP
- Endpoint: `POST /api/webmcp`
- Body: JSON-RPC 2.0
- Service Worker 會把請求轉交給開啟中的主頁處理

## 3. 安全機制
- 目前 WebMCP 已移除 auth 驗證流程，不需要 token。
- `card.simulateAction` 仍限制可操作 target（匯出與動畫操作）。
- 建議在正式部署時，由外層代理或反向代理補上驗證、限流與審計。

## 4. API 範例
## 4.1 tools/list
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

## 4.2 tools/call（修改名稱）
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "card.updateField",
    "arguments": {
      "field": "name",
      "value": "Alex Chen"
    }
  }
}
```

## 4.3 tools/call（匯出 PNG）
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "card.export",
    "arguments": {
      "format": "png"
    }
  }
}
```

## 5. 與其他 AI 平台整合
可將本頁視為「可遠端控制的工具端點」，由代理層翻譯成 WebMCP JSON-RPC 呼叫：
1. 平台接收使用者意圖
2. 代理層決定要呼叫的工具與參數
3. 透過 postMessage 或 HTTP 發送 JSON-RPC
4. 回收結果並回覆使用者

建議整合模式：
- 同網域前端代理：優先用 postMessage
- 需要 REST 風格：用 `/api/webmcp`

## 6. 測試環境流程
1. 開啟 `index.html`
2. 開啟 `webmcp-example.html`
3. 點擊「開啟主頁並建立連線」
4. 選擇 transport（postMessage 或 HTTP）
5. 執行 `tools/list`、`card.getState`、`card.updateField` / `card.setState` 等測試

## 7. 維護與安全更新建議
- 新增工具時同步更新：
  - `index.html` 的 `webMcpTools` 與執行邏輯
  - `webmcp.json` 描述
  - `webmcp-example.html` 測試選項
- 發布前至少做一次 smoke test：
  - `tools/list`
  - `card.updateField`
  - `card.updateLayout`
  - `card.export`
  - `card.simulateAction`
- 如需更高安全等級，可在代理層加入簽章/一次性 nonce 與審計日誌。
