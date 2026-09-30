const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const dirs = ['app', 'components', 'lib'];
dirs.forEach(d => {
    walk(d, (filePath) => {
        if (filePath.match(/\.(tsx|ts|jsx|js|css)$/)) {
            let content = fs.readFileSync(filePath, 'utf8');
            let newContent = content
                .replace(/EVOCRM/g, 'EVO PIXEL')
                .replace(/EvoPixel/g, 'EVO PIXEL')
                .replace(/crm-evopixel/g, 'evo-pixel');
            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Updated ${filePath}`);
            }
        }
    });
});
