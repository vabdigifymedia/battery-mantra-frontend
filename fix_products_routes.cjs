const fs = require('fs');
const glob = require('glob'); // Not installed globally probably, we can use built-in fs

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = dir + '/' + file;
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // We want to replace `/products/$id` with `/product/$slug`
  // We want to replace `/products/${` with `/product/${` ONLY if it looks like a frontend route link
  // e.g., to={`/products/${id}`} -> to={`/product/${id}`}
  
  // Replacing standard Link to
  if (content.includes('to="/products/$id"')) {
    content = content.replace(/to="\/products\/\$id"/g, 'to="/product/$slug"');
    changed = true;
  }
  
  if (content.includes('to: "/products/$id"')) {
    content = content.replace(/to: "\/products\/\$id"/g, 'to: "/product/$slug"');
    changed = true;
  }
  if (content.includes("to: '/products/$id'")) {
    content = content.replace(/to: '\/products\/\$id'/g, "to: '/product/$slug'");
    changed = true;
  }
  
  if (content.includes('params={{ id:')) {
    // only if it's in a Link to product.
    if (content.includes('to="/product/$slug"')) {
      content = content.replace(/params={{ id:/g, 'params={{ slug:');
      changed = true;
    }
  }

  // Handle template literals for navigate or simple hrefs if any
  // e.g. navigate({ to: `/products/${item.product._id}` }) -> that is TanStack Router so it would be to: "/products/$id", params: { id: ... } 
  // Wait, Tanstack Router doesn't use template literals for routes typically, it uses the to: and params:.
  // Let's check `grep -r "/products/\\$" src/` manually before committing this regex.

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
