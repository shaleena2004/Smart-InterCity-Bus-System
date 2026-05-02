const fs = require('fs');
const path = require('path');

const foldersToScan = ['app', 'components'];

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Cards background to White
    content = content.replace(/#36454F/gi, '#FFFFFF');
    
    // Dark texts
    content = content.replace(/color:\s*['"`]#222222['"`]/gi, "color: '#000000'");
    content = content.replace(/color:\s*['"`]#222['"`]/gi, "color: '#000000'");
    
    // Light texts to black
    content = content.replace(/color:\s*['"`]#fff['"`]/gi, "color: '#000000'");
    content = content.replace(/color:\s*['"`]#ffffff['"`]/gi, "color: '#000000'");
    
    // Subtexts to dark grey
    content = content.replace(/color:\s*['"`]#ccc['"`]/gi, "color: '#666666'");
    content = content.replace(/color:\s*['"`]#cccccc['"`]/gi, "color: '#666666'");
    
    // Title yellows to slightly darker gold for readability on white UI
    content = content.replace(/color:\s*['"`]#FFD700['"`]/gi, "color: '#D4AF37'");
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function traverseDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

for (const folder of foldersToScan) {
    traverseDir(path.join(__dirname, folder));
}
console.log('Colors replaced successfully!');
