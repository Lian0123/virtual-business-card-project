import { spawn } from 'node:child_process';
import process from 'node:process';

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8000';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    console.error('缺少 playwright，請先執行: npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}

function startServer() {
  const child = spawn('python3', ['-m', 'http.server', '8000'], {
    stdio: 'ignore',
    detached: true
  });
  child.unref();
  return child.pid;
}

function stopServer(pid) {
  if (!pid) return;
  try {
    process.kill(pid);
  } catch {}
}

async function wait(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const { chromium } = await loadPlaywright();
  const serverPid = startServer();
  await wait(1200);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });

    await page.waitForFunction(() => window.WebMCP && navigator.serviceWorker, null, { timeout: 10000 });

    try {
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 5000 });
    } catch {
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 10000 });
    }

    const rpc = async (id, method, params = {}) => {
      return page.evaluate(async ({ id, method, params }) => {
        const response = await fetch('./api/webmcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
        });
        const body = await response.json();
        return { status: response.status, body };
      }, { id, method, params });
    };

    const listRes = await rpc(1, 'tools/list', {});
    if (listRes.status !== 200 || listRes.body.error) {
      throw new Error(`tools/list 失敗: ${JSON.stringify(listRes.body)}`);
    }

    const updateRes = await rpc(2, 'tools/call', {
      name: 'card.updateField',
      arguments: { field: 'name', value: 'Smoke Test User' }
    });
    if (updateRes.status !== 200 || updateRes.body.error) {
      throw new Error(`card.updateField 失敗: ${JSON.stringify(updateRes.body)}`);
    }

    const exportRes = await rpc(3, 'tools/call', {
      name: 'card.export',
      arguments: { format: 'png' }
    });
    if (exportRes.status !== 200 || exportRes.body.error) {
      throw new Error(`card.export 失敗: ${JSON.stringify(exportRes.body)}`);
    }

    console.log('✅ WebMCP smoke test passed');
    console.log('- tools/list: OK');
    console.log('- card.updateField: OK');
    console.log('- card.export: OK');
  } finally {
    await browser.close();
    stopServer(serverPid);
  }
}

run().catch((error) => {
  console.error('❌ WebMCP smoke test failed');
  console.error(error.message || error);
  process.exit(1);
});
