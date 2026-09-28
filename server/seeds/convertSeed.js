const fs = require('fs');
const path = require('path');

const clientFilePath = path.join(__dirname, '../../client/src/data/itemMasterData.js');
const seedDir = path.join(__dirname, 'data');
const seedFilePath = path.join(seedDir, 'itemMaster.seed.json');

if (!fs.existsSync(seedDir)) {
  fs.mkdirSync(seedDir, { recursive: true });
}

const content = fs.readFileSync(clientFilePath, 'utf-8');
// Replace export statement to make it JSON parseable or execute it
const jsonText = content
  .replace(/^export const itemMasterList =\s*/, '')
  .replace(/;\s*$/, '');

try {
  const items = JSON.parse(jsonText);
  fs.writeFileSync(seedFilePath, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`Successfully created itemMaster.seed.json with ${items.length} items.`);
} catch (err) {
  console.error('Failed to convert itemMasterData.js to JSON:', err);
}
