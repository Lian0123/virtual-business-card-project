# Virtual Business Card Project

ブラウザ上でプロ仕様のデジタル名刺を作成・編集・プレビュー・書き出しできます。PWA、WebMCP（JSON-RPC）によるリモート操作、PNG/JPG/WebP/HTML/VCF 出力に対応しています。

## Languages
- 繁體中文: [README.md](README.md)
- English: [README.en.md](README.en.md)
- 日本語（このページ）
- 한국어: [README.ko.md](README.ko.md)
- Français: [README.fr.md](README.fr.md)
- ไทย: [README.th.md](README.th.md)
- Español: [README.es.md](README.es.md)
- Português: [README.pt.md](README.pt.md)
- Deutsch: [README.de.md](README.de.md)

## Demo
- メイン: https://lian0123.github.io/virtual-business-card-project/
- WebMCP サンプル: https://lian0123.github.io/virtual-business-card-project/webmcp-example.html
- WebMCP JSON: https://lian0123.github.io/virtual-business-card-project/webmcp.json
- OpenAPI 3.1: https://lian0123.github.io/virtual-business-card-project/webmcp.openapi.yaml

## 主な機能
- 名刺編集: 氏名、役職、会社、連絡先、住所、Web、紹介文
- デザイン: テーマ、テンプレート、背景、枠線、アニメ、ステッカー
- 書き出し: PNG / JPG / WebP / HTML / VCF
- AI 連携: WebMCP（`tools/list`、`tools/call`、`card.*`）

## Local Development
```bash
npm install
npm run start
```

## Smoke Test
```bash
npm run smoke:test
```

## License
MIT
