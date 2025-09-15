const fs = require('fs');
const path = require('path');

// Create netlify/functions directory if it doesn't exist
const functionsDir = path.join(__dirname, '../netlify/functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Copy routes, controllers, and models to functions directory
const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    
    if (item.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

// Copy directories
copyDir(path.join(__dirname, '../routes'), path.join(functionsDir, 'routes'));
copyDir(path.join(__dirname, '../controllers'), path.join(functionsDir, 'controllers'));
copyDir(path.join(__dirname, '../models'), path.join(functionsDir, 'models'));

console.log('Files copied successfully for Netlify Functions');