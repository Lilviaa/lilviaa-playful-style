const fs = require('fs');
const file = 'src/components/admin/products/product-form.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove gap-2 from panel groups
content = content.replace(/h-full gap-2/g, 'h-full');

// Fix Handles
content = content.replace(/className="bg-transparent w-full h-2 relative z-10 hover:bg-border\/50 transition-colors"/g, 'className="bg-transparent relative z-10 hover:bg-border/50 transition-colors"');
content = content.replace(/className="bg-transparent w-2 -mx-1 relative z-10 hover:bg-border\/50 transition-colors"/g, 'className="bg-transparent relative z-10 hover:bg-border/50 transition-colors"');

fs.writeFileSync(file, content);
console.log('done');
