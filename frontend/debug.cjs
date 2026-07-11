const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

async function run() {
  console.log('Starting Vite server...');
  const server = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });

  server.stdout.on('data', data => console.log(`[Vite]: ${data}`));
  server.stderr.on('data', data => console.error(`[Vite ERR]: ${data}`));

  // Wait for Vite to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Starting Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[Browser ERR]: ${msg.text()}`);
    } else {
      console.log(`[Browser LOG]: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`[Browser PageError]: ${err.toString()}`);
  });

  console.log('Navigating to http://localhost:3000...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log('[Puppeteer]: Navigation complete or timed out.');
  }

  // Wait a bit to observe runtime
  console.log('Waiting 3 seconds to observe errors...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Closing browser and server...');
  await browser.close();
  server.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
