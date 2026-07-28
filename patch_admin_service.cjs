const fs = require('fs');
const file = '/home/ankur/Downloads/battery-mantra-frontend/src/services/admin.service.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/};\s+async getCategorySpecTemplate\([\s\S]*?}\n/, '');
content = content.replace(/  updateEnquiryStatus:([\s\S]*?body \}),/, 
  '  updateEnquiryStatus:$1,\n  getCategorySpecTemplate: (categoryId: string) =>\n    apiFetch<CategorySpecTemplateResponse>(`/api/admin/specs/template/category/${categoryId}`, { method: "GET" }),');

fs.writeFileSync(file, content);
