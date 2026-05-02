const fs = require('fs');
const path = require('path');
const foldersToScan = ['app', 'components'];

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    content = content.replace(/backgroundcolor:\s*'#000000'/gi, "backgroundColor: '#FFFFFF'");
    content = content.replace(/bordercolor:\s*'#000000'/gi, "borderColor: '#E0E0E0'");
    content = content.replace(/backgroundcolor:\s*'#666666'/gi, "backgroundColor: '#E0E0E0'");

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
console.log('Fixed regex mistake!');
