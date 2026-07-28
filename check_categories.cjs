const fs = require('fs');
const raw = fs.readFileSync('/home/ankur/.gemini/antigravity-ide/brain/60d13baf-ee3d-4e4e-9916-2b43df88c197/scratch/extracted_content.txt', 'utf-8');
const lines = raw.split('\n');

const cats = new Set();
for (let line of lines) {
  const parts = line.trim().split(/\t| {2,}/);
  if (parts.length >= 2) {
    cats.add(parts[1]);
    if (parts[2]) cats.add(parts[2]);
    if (parts[3]) cats.add(parts[3]);
  }
}
console.log("All category strings in extracted data:", Array.from(cats));
