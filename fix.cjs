const fs = require('fs');
const file = '/home/ankur/Downloads/battery-mantra-frontend/src/services/admin.service.ts';
let content = fs.readFileSync(file, 'utf8');

// The issue was I removed the closing bracket of the export.
// Let's find the `updateEnquiryStatus` method and the end of the file.
let correctBottom = `
  updateEnquiryStatus: (id: string, body: UpdateEnquiryStatusRequest) =>
    apiFetch<EnquiryResponse>(endpoints.admin.enquiries.updateStatus(id), { method: "PATCH", body }),

  getCategorySpecTemplate: (categoryId: string) =>
    apiFetch<CategorySpecTemplateResponse>(\`/api/admin/specs/template/category/\${categoryId}\`, { method: "GET" }),
};
`;

content = content.replace(/  updateEnquiryStatus: \([\s\S]*$/, correctBottom.trim() + '\n');
fs.writeFileSync(file, content);
