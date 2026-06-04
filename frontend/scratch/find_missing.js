const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
const missing = new Set();
const srcDir = path.join(__dirname, '../src');

function findImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findImports(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const importRegex = /import\s+.*?\s+from\s+['"]([^'".]+)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                let mod = match[1];
                if (!mod.startsWith('.')) {
                    // Extract base module name (e.g., 'react-native-vector-icons/MaterialIcons' -> 'react-native-vector-icons')
                    const parts = mod.split('/');
                    if (mod.startsWith('@')) {
                        mod = parts[0] + '/' + parts[1];
                    } else {
                        mod = parts[0];
                    }
                    if (!allDeps[mod] && mod !== 'react' && mod !== 'react-native') {
                        missing.add(mod);
                    }
                }
            }
        }
    }
}

findImports(srcDir);
console.log('Missing dependencies:', Array.from(missing).join(', '));
