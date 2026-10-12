#!/usr/bin/env node
// Run with Node.js and Playwright installed; uses local Chrome without network access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const handlebars = require(path.join(root, 'js/handlebars.js'));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const key = 'api.$["<&+|]';
    const hostile = '</script><img src=x onerror="window.injected=true">';
    const template = handlebars.compile(fs.readFileSync(path.join(root, 'hbs/odoc.hbs'), 'utf8'));
    const rendered = template({ id: '', uriPrefix: '/gui', terms: [
      { id: 'one & first', key }, { id: 'two', key },
      { id: 'unsafe', key: hostile }, { id: 'slow', key: 'slow' }, { id: 'fast', key: 'fast' },
      { id: 'missing', key: 'missing' }
    ] });
    await page.route('http://odoc.test/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/') {
        await route.fulfill({ contentType: 'text/html', body: '<!doctype html><script>' + fs.readFileSync(path.join(root, 'js/jquery.js'), 'utf8') + '</script>' + rendered });
        return;
      }
      if (url.pathname !== '/gui/odocKey') throw new Error('Unexpected URL: ' + url);
      const query = url.searchParams.get('q');
      const id = url.searchParams.get('id');
      if (query === key) assert.equal(id, 'one & first');
      if (query === 'slow') await new Promise(resolve => setTimeout(resolve, 250));
      const entry = query === 'missing' ? { error: 'Term not found', matches: [] } : {
        id, key: query, fullkey: query + '()', text: query + '\n  literal ' + hostile, format: 'markdown'
      };
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(entry) });
    });
    await page.goto('http://odoc.test/');
    assert.equal(await page.locator('.odocterm').count(), 6);
    assert.equal(await page.locator('img').count(), 0);
    await page.locator('#search').fill(key);
    assert.equal(await page.locator('.odocterm').count(), 2, 'Literal punctuation must filter without regex errors');
    await page.locator('.odocterm').first().click();
    await page.waitForFunction(() => document.querySelector('#keyCardContent p') !== null);
    assert.equal(await page.locator('#keyCardContent p').textContent(), key + '\n  literal ' + hostile);
    assert.equal(await page.locator('img').count(), 0, 'Documentation must be displayed as text');
    assert.equal(await page.evaluate(() => window.injected), undefined);
    const slowRequest = page.waitForRequest(request => request.url().includes('q=slow'));
    await page.locator('#search').fill('slow');
    await slowRequest;
    await page.locator('#search').fill('fast');
    await page.waitForFunction(() => document.querySelector('#keyCardContent p')?.textContent.startsWith('fast\n'));
    await page.waitForTimeout(350);
    assert.match(await page.locator('#keyCardContent p').textContent(), /^fast\n/, 'Late responses must not replace current results');
    const location = page.url();
    await page.locator('#search').press('Enter');
    await page.waitForTimeout(100);
    assert.equal(page.url(), location, 'Form submission must not navigate');
    await page.locator('#search').fill('missing');
    await page.waitForFunction(() => document.querySelector('#keyCardContent p')?.textContent === 'Term not found');
    await page.locator('#search').fill('no such term');
    assert.equal(await page.locator('#keyCardContent p').textContent(), 'Term not found.');
    assert.deepEqual(errors, []);
    console.log('PASS odoc browser: literal filtering, subject selection, encoding, escaping, missing results, stale responses, form submission');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
