const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const srcImg = path.join(workspaceRoot, 'src', 'assets', 'images', 'hexagon.png');
const appLogoDst = path.join(workspaceRoot, 'src', 'assets', 'images', 'app_logo.png');

const mipmapFolders = [
  'android/app/src/main/res/mipmap-mdpi',
  'android/app/src/main/res/mipmap-hdpi',
  'android/app/src/main/res/mipmap-xhdpi',
  'android/app/src/main/res/mipmap-xxhdpi',
  'android/app/src/main/res/mipmap-xxxhdpi',
];

function abort(msg) {
  console.error(msg);
  process.exit(1);
}

if (!fs.existsSync(srcImg)) {
  abort(`Source image not found: ${srcImg}\nPlease save your attached PNG as 'frontend/src/assets/images/hexagon.png' and run this script again.`);
}

try {
  // copy to in-app logo
  fs.copyFileSync(srcImg, appLogoDst);
  console.log(`Copied to ${appLogoDst}`);

  // copy to each mipmap ic_launcher.png and ic_launcher_round.png
  mipmapFolders.forEach((rel) => {
    const dstFolder = path.join(workspaceRoot, rel);
    if (!fs.existsSync(dstFolder)) {
      console.warn(`Skipping missing folder: ${dstFolder}`);
      return;
    }
    const ic = path.join(dstFolder, 'ic_launcher.png');
    const icRound = path.join(dstFolder, 'ic_launcher_round.png');
    try {
      fs.copyFileSync(srcImg, ic);
      console.log(`Copied to ${ic}`);
    } catch (e) {
      console.warn(`Failed to copy to ${ic}: ${e.message}`);
    }
    try {
      fs.copyFileSync(srcImg, icRound);
      console.log(`Copied to ${icRound}`);
    } catch (e) {
      // not all projects have round icon; that's fine
    }
  });

  console.log('\nDone. You should now rebuild the Android app so launcher icons are updated.');
  console.log('Build command (from frontend/android):');
  console.log('  .\\gradlew assembleRelease');
} catch (err) {
  abort('Error during copy: ' + err.message);
}
