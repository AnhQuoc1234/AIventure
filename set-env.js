const fs = require('fs');
const path = require('path');

const dir = 'src/environments';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const targetPath = path.join(__dirname, 'src/environments/environment.ts');
const apiKey = process.env.GEMINI_API_KEY || 'GEMINI_API_KEY';

const envConfigFile = `export const environment = {
  GEMINI_API_KEY: '${apiKey}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`Environment file generated at ${targetPath}`);
