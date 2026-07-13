import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function download(url, outputPath) {
  console.log(`Iniciando download de ${url}...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Define o User-Agent e headers comuns para simular um navegador real
  await page.setExtraHTTPHeaders({
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  });

  const response = await page.goto(url, { waitUntil: 'networkidle' });
  if (!response) {
    throw new Error(`Falha ao obter resposta de ${url}`);
  }
  
  const status = response.status();
  if (status !== 200) {
    throw new Error(`Status de resposta inválido para ${url}: ${status}`);
  }

  const buffer = await response.body();
  fs.writeFileSync(outputPath, buffer);
  await browser.close();
  console.log(`Sucesso: ${url} salvo em ${outputPath} (Tamanho: ${buffer.length} bytes)`);
}

async function run() {
  const dir = path.resolve('public/assets');
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  await download('https://assets.codepen.io/13471/mixed-noise.png', path.join(dir, 'mixed-noise.png'));
  await download('https://assets.codepen.io/13471/glare.png', path.join(dir, 'glare.png'));
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
