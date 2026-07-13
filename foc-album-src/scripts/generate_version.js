import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const versionFilePath = path.join(publicDir, 'version.json');
const buildVersion = Date.now();

fs.writeFileSync(versionFilePath, JSON.stringify({ version: buildVersion }, null, 2));
console.log(`[Version Generator] Generated build version: ${buildVersion}`);
