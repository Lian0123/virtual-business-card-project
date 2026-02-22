# WebMCP 開發與整合指南

本文件提供 WebMCP 的完整使用說明，協助開發者或 AI Agent 透過 JSON-RPC 控制頁面元素與功能。

## 1. 你可以做到什麼
WebMCP 支援以下遠端操作：
- 修改名片文字內容（`card.updateField` / `card.updateFields`）
- 變更背景圖片（`card.setBackgroundImage`）
- 調整版面與樣式（`card.updateLayout`、`card.applyTemplate`）
- 匯出名片（`card.export`）
- 模擬使用者操作（`card.simulateAction`）
- 讀取或批次套用狀態（`card.getState` / `card.setState`）

## 2. 架構與傳輸
### 2.1 postMessage（同頁/同瀏覽器上下文）
- Request type: `WEB_MCP_REQUEST`
- Response type: `WEB_MCP_RESPONSE`
- Methods: `tools/list`, `tools/call`

### 2.2 HTTP（跨程序或外部工具）
- Endpoint: `POST /api/webmcp`
- Protocol: JSON-RPC 2.0
- Service Worker 會把請求橋接到開啟中的主頁執行

> 若沒有可用的主頁 client，HTTP 會回傳錯誤：`No active page client to handle WebMCP request`。

## 3. API 文件入口
- 能力描述: [../webmcp.json](../webmcp.json)
- OpenAPI 3.1: [../webmcp.openapi.yaml](../webmcp.openapi.yaml)
- 範例頁: [../webmcp-example.html](../webmcp-example.html)

## 4. JSON-RPC 呼叫格式
### 4.1 列出可用工具
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### 4.2 呼叫工具
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

## 5. 工具清單（對應目前實作）
- `card.getState`
- `card.setType`（`main|qr|custom`）
- `card.setLanguage`
- `card.setTheme`（`light|dark`）
- `card.updateField`
- `card.updateFields`
- `card.updateLayout`
- `card.setQrContent`
- `card.applyTemplate`
- `card.setBackgroundImage`
- `card.export`（`png|jpg|webp|html|vcf`）
- `card.simulateAction`
- `card.setState`

## 6. 範例程式碼
### 6.1 JavaScript（HTTP）
```js
async function webmcpRpc(method, params = {}, id = Date.now()) {
  const res = await fetch('./api/webmcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'RPC error');
  return data.result;
}

async function updateNameAndExport() {
  await webmcpRpc('tools/call', {
    name: 'card.updateField',
    arguments: { field: 'name', value: 'Alex Chen' }
  });

  await webmcpRpc('tools/call', {
    name: 'card.export',
    arguments: { format: 'png' }
  });
}
```

### 6.2 JavaScript（postMessage）
```js
function webmcpPostMessage(method, params = {}, id = Date.now()) {
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const payload = event.data;
      if (!payload || payload.type !== 'WEB_MCP_RESPONSE' || payload.id !== id) return;
      window.removeEventListener('message', onMessage);
      if (payload.error) reject(new Error(payload.error.message || 'RPC error'));
      else resolve(payload.result);
    };

    window.addEventListener('message', onMessage);
    window.postMessage({
      type: 'WEB_MCP_REQUEST',
      jsonrpc: '2.0',
      id,
      method,
      params
    }, '*');
  });
}
```

### 6.3 cURL（快速驗證）
```bash
curl -X POST "http://localhost:8000/api/webmcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## 7. 常見操作對照
- 修改姓名：`card.updateField` + `{ field: "name", value: "..." }`
- 批次更新：`card.updateFields` + `{ updates: {...} }`
- 換背景圖：`card.setBackgroundImage` + `{ imageUrl: "https://..." }`
- 改版面：`card.updateLayout` + `{ updates: {...} }`
- 匯出：`card.export` + `{ format: "png" }`
- 模擬點擊匯出：`card.simulateAction` + `{ action: "click", target: "export.png" }`

## 8. 測試流程
### 8.1 手動測試
1. 開啟首頁 `index.html`
2. 開啟 `webmcp-example.html`
3. 先呼叫 `tools/list`
4. 再測 `card.updateField`
5. 最後測 `card.export`

### 8.2 一鍵 smoke test
```bash
npm run smoke:test
```
預設會依序驗證：
- `tools/list`
- `card.updateField`
- `card.export`

## 9. 錯誤處理建議
- 先檢查 JSON-RPC `method` 是否為 `tools/list` 或 `tools/call`
- `tools/call` 必須傳入 `params.name`
- 若返回 `Unsupported WebMCP tool`，請確認工具名稱拼字
- 若返回 bridge timeout，請確認主頁仍開啟且 Service Worker 正常

## 10. 安全注意事項
目前 WebMCP 未內建驗證流程（`authType: none`）。
建議正式環境至少加上：
- API Gateway 驗證（API key / mTLS / request signature）
- 請求限流與來源限制
- 審計日誌（請求者、參數、結果、時間）
- 依工具分類設定允許清單（例如只開放 `card.getState`、`card.export`）

## 11. 與外部 AI 平台整合建議
- ChatGPT / Agent：將自然語言意圖映射至 `tools/call`
- 語音助理：語音轉文字後再做工具選擇與參數補齊
- 後端中介層：統一處理驗證、策略與追蹤，再轉發到 WebMCP
