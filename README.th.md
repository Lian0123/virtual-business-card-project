# Virtual Business Card Project

สร้าง แก้ไข ดูตัวอย่าง และส่งออกนามบัตรดิจิทัลแบบมืออาชีพได้ในเบราว์เซอร์ รองรับ PWA, การควบคุมระยะไกลผ่าน WebMCP (JSON-RPC) และการส่งออก PNG/JPG/WebP/HTML/VCF

## Languages
- 繁體中文: [README.md](README.md)
- English: [README.en.md](README.en.md)
- 日本語: [README.ja.md](README.ja.md)
- 한국어: [README.ko.md](README.ko.md)
- Français: [README.fr.md](README.fr.md)
- ไทย (หน้านี้)
- Español: [README.es.md](README.es.md)
- Português: [README.pt.md](README.pt.md)
- Deutsch: [README.de.md](README.de.md)

## Demo
- แอปหลัก: https://lian0123.github.io/virtual-business-card-project/
- ตัวอย่าง WebMCP: https://lian0123.github.io/virtual-business-card-project/webmcp-example.html
- WebMCP JSON: https://lian0123.github.io/virtual-business-card-project/webmcp.json
- OpenAPI 3.1: https://lian0123.github.io/virtual-business-card-project/webmcp.openapi.yaml

## ฟีเจอร์หลัก
- แก้ไขนามบัตร: ชื่อ, ตำแหน่ง, บริษัท, ช่องทางติดต่อ, ที่อยู่, เว็บไซต์, แนะนำตัว
- ออกแบบภาพ: ธีม, เทมเพลต, พื้นหลัง, ขอบ, แอนิเมชัน, สติกเกอร์
- ส่งออก: PNG / JPG / WebP / HTML / VCF
- เชื่อมต่อ AI: WebMCP (`tools/list`, `tools/call`, `card.*`)

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
