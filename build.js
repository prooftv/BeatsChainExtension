// Build script for BeatsChain Extension
const fs = require('fs');
const path = require('path');

console.log('🎵 Building BeatsChain Extension...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Copy static files
const filesToCopy = [
    'manifest.json',
    'popup/index.html',
    'popup/popup.css'
];

filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(distDir, path.basename(file));
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied ${file}`);
    } else {
        console.log(`❌ Missing ${file}`);
    }
});

// Copy assets directory
const assetsDir = path.join(__dirname, 'assets');
const distAssetsDir = path.join(distDir, 'assets');

if (fs.existsSync(assetsDir)) {
    if (!fs.existsSync(distAssetsDir)) {
        fs.mkdirSync(distAssetsDir, { recursive: true });
    }
    
    // Copy icons
    const iconsDir = path.join(assetsDir, 'icons');
    const distIconsDir = path.join(distAssetsDir, 'icons');
    
    if (fs.existsSync(iconsDir)) {
        if (!fs.existsSync(distIconsDir)) {
            fs.mkdirSync(distIconsDir, { recursive: true });
        }
        
        fs.readdirSync(iconsDir).forEach(file => {
            fs.copyFileSync(
                path.join(iconsDir, file),
                path.join(distIconsDir, file)
            );
        });
        console.log('✅ Copied assets/icons');
    }
}

// Bundle JavaScript files (simplified)
const jsFiles = {
    'popup.js': [
        'lib/storage.js',
        'lib/wallet.js', 
        'lib/chrome-ai.js',
        'lib/thirdweb.js',
        'popup/popup.js'
    ],
    'service-worker.js': [
        'background/service-worker.js'
    ]
};

Object.entries(jsFiles).forEach(([outputFile, inputFiles]) => {
    let bundledContent = '';
    
    inputFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Remove import/export statements for simple bundling
            content = content.replace(/import .* from .*;\n?/g, '');
            content = content.replace(/export default .*;?\n?/g, '');
            
            bundledContent += `\n// === ${file} ===\n${content}\n`;
        } else {
            console.log(`❌ Missing ${file}`);
        }
    });
    
    fs.writeFileSync(path.join(distDir, outputFile), bundledContent);
    console.log(`✅ Bundled ${outputFile}`);
});

console.log('🎉 Build complete! Extension ready in ./dist/');
console.log('\n📋 Next steps:');
console.log('1. Open Chrome and go to chrome://extensions/');
console.log('2. Enable Developer mode');
console.log('3. Click "Load unpacked" and select the ./dist/ folder');
console.log('4. Test the extension!');