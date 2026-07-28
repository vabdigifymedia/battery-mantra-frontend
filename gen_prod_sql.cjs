const fs = require('fs');

const raw = fs.readFileSync('/home/ankur/.gemini/antigravity-ide/brain/60d13baf-ee3d-4e4e-9916-2b43df88c197/scratch/extracted_content.txt', 'utf-8');
const lines = raw.split('\n');

const categories = [];
const attributes = [];
const units = [];

let currentSection = 0;

for (let line of lines) {
  line = line.trim();
  if (!line) continue;

  if (line.includes('Name\tCategory\tAction') || line.includes('Name    Category        Action')) {
    currentSection = 1;
    continue;
  } else if (line.includes('Attribute Name\tAttr. Category') || line.includes('Attribute Name  Attr. Category')) {
    currentSection = 2;
    continue;
  } else if (line.includes('Unit Name\tParameter\tAttr. Category') || line.includes('Unit Name       Parameter       Attr. Category')) {
    currentSection = 3;
    continue;
  }
  
  if (line.includes('Data or bhi h') || line.includes('<USER_REQUEST>') || line.includes('bro! client ka call') || line.includes('product management me') || line.includes('Search:') || line.includes('Bata kya')) {
    continue;
  }

  const parts = line.split(/\t| {2,}/).map(s => s.trim()).filter(s => s);
  if (parts.length < 2) continue;

  if (currentSection === 1) {
    categories.push({
      name: parts[0].replace(/'/g, "''"),
      productCategory: parts[1].replace(/'/g, "''")
    });
  } else if (currentSection === 2) {
    attributes.push({
      name: parts[0].replace(/'/g, "''"),
      specCategory: parts[1].replace(/'/g, "''"),
      productCategory: parts[2] ? parts[2].replace(/'/g, "''") : null
    });
  } else if (currentSection === 3) {
    units.push({
      name: parts[0].replace(/'/g, "''"),
      attribute: parts[1].replace(/'/g, "''"),
      specCategory: parts[2].replace(/'/g, "''"),
      productCategory: parts[3] ? parts[3].replace(/'/g, "''") : null
    });
  }
}

// Function to map category name to flexible SQL condition
function getCategoryCondition(catName) {
  if (!catName) return "1=1";
  const name = catName.toLowerCase();
  if (name.includes('car')) return "(category_name ILIKE '%car%' OR category_name ILIKE '%four wheeler%')";
  if (name.includes('inverter battery') || name.includes('inverter & battery')) return "(category_name ILIKE '%inverter%batter%')";
  if (name.includes('inverter') && !name.includes('battery')) return "(category_name ILIKE '%inverter%' AND category_name NOT ILIKE '%battery%')";
  if (name.includes('generator')) return "(category_name ILIKE '%generator%' OR category_name ILIKE '%heavy%')";
  if (name.includes('solar')) return "(category_name ILIKE '%solar%')";
  if (name.includes('stabilizer')) return "(category_name ILIKE '%stabilizer%')";
  if (name.includes('ups')) return "(category_name ILIKE '%ups%')";
  if (name.includes('trolley')) return "(category_name ILIKE '%trolley%')";
  return `category_name ILIKE '%${catName.replace(/s$/, '')}%'`;
}

// Generate SQL for Categories
let catSql = "-- 1. Insert Spec Categories for Production\n";
const catUnique = new Set();
for (const c of categories) {
  const key = `${c.name}|${c.productCategory}`;
  if (catUnique.has(key)) continue;
  catUnique.add(key);
  
  const cond = getCategoryCondition(c.productCategory);
  catSql += `INSERT INTO spec_categories (id, name, category_id)\n`;
  catSql += `SELECT gen_random_uuid(), '${c.name}', category_id FROM categories WHERE ${cond};\n`;
}

// Generate SQL for Attributes
let attrSql = "-- 2. Insert Spec Attributes for Production\n";
const attrUnique = new Set();
for (const a of attributes) {
  const key = `${a.name}|${a.specCategory}|${a.productCategory||''}`;
  if (attrUnique.has(key)) continue;
  attrUnique.add(key);
  
  const cond = getCategoryCondition(a.productCategory);
  attrSql += `INSERT INTO spec_attributes (id, name, spec_category_id, category_id)\n`;
  attrSql += `SELECT gen_random_uuid(), '${a.name}', sc.id, sc.category_id FROM spec_categories sc JOIN categories c ON sc.category_id = c.category_id WHERE sc.name = '${a.specCategory}' AND ${cond};\n`;
}

// Generate SQL for Units
let unitSql = "-- 3. Insert Spec Units for Production\n";
const unitUnique = new Set();
for (const u of units) {
  const key = `${u.name}|${u.attribute}|${u.specCategory}|${u.productCategory||''}`;
  if (unitUnique.has(key)) continue;
  unitUnique.add(key);
  
  const cond = getCategoryCondition(u.productCategory);
  unitSql += `INSERT INTO spec_units (id, value, spec_attribute_id, spec_category_id, category_id)\n`;
  unitSql += `SELECT gen_random_uuid(), '${u.name}', sa.id, sa.spec_category_id, sa.category_id FROM spec_attributes sa JOIN categories c ON sa.category_id = c.category_id WHERE sa.name = '${u.attribute}' AND sa.spec_category_id IN (SELECT id FROM spec_categories WHERE name = '${u.specCategory}') AND ${cond};\n`;
}

fs.writeFileSync('/home/ankur/.gemini/antigravity-ide/brain/60d13baf-ee3d-4e4e-9916-2b43df88c197/production_spec_categories.sql', catSql);
fs.writeFileSync('/home/ankur/.gemini/antigravity-ide/brain/60d13baf-ee3d-4e4e-9916-2b43df88c197/production_spec_attributes.sql', attrSql);
fs.writeFileSync('/home/ankur/.gemini/antigravity-ide/brain/60d13baf-ee3d-4e4e-9916-2b43df88c197/production_spec_units.sql', unitSql);

console.log("Production SQL scripts generated successfully!");
