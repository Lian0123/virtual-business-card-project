# Virtual Business Card Project

أنشئ وعدّل واستعرض وصدّر بطاقات أعمال رقمية احترافية مباشرة من المتصفح. يدعم المشروع PWA والتحكم عن بُعد عبر WebMCP (JSON-RPC) وصيغ التصدير PNG/JPG/WebP/HTML/VCF.

## اللغات
- 繁體中文: [README.md](README.md)
- English: [README.en.md](README.en.md)
- Bahasa Indonesia: [README.id.md](README.id.md)
- Русский: [README.ru.md](README.ru.md)
- Polski: [README.pl.md](README.pl.md)
- Türkçe: [README.tr.md](README.tr.md)
- العربية (هذه الصفحة)

## العرض التجريبي
- التطبيق الرئيسي: https://lian0123.github.io/virtual-business-card-project/
- مثال WebMCP: https://lian0123.github.io/virtual-business-card-project/webmcp-example.html
- ملف WebMCP JSON: https://lian0123.github.io/virtual-business-card-project/webmcp.json
- OpenAPI 3.1: https://lian0123.github.io/virtual-business-card-project/webmcp.openapi.yaml

## الميزات الأساسية
- تعديل البطاقة: الاسم، المسمى الوظيفي، الشركة، وسائل التواصل، العنوان، الموقع، النبذة
- التصميم المرئي: السمة، القالب، الخلفية، الحدود، الحركة، الملصقات
- التصدير: PNG / JPG / WebP / HTML / VCF
- تكامل الذكاء الاصطناعي: WebMCP (`tools/list` و `tools/call` وأدوات `card.*`)

## التطوير المحلي
```bash
npm install
npm run start
```

## اختبار Smoke
```bash
npm run smoke:test
```

## التوثيق
- دليل WebMCP: [docs/WEBMCP_GUIDE.md](docs/WEBMCP_GUIDE.md)
- البدء السريع: [docs/QUICKSTART.md](docs/QUICKSTART.md)
- الميزات: [docs/FEATURES.md](docs/FEATURES.md)

## الرخصة
MIT
