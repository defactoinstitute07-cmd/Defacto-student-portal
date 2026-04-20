const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendPublicDir = path.join(rootDir, 'frontend', 'public');
const apkCandidates = [
    path.join(
        rootDir,
        'android-defacto-erp',
        'app',
        'build',
        'outputs',
        'apk',
        'release',
        'app-release.apk'
    ),
    path.join(
        rootDir,
        'android-defacto-erp',
        'app',
        'build',
        'outputs',
        'apk',
        'debug',
        'app-debug.apk'
    )
];
const apkTargetPaths = [
    path.join(frontendPublicDir, 'defacto-student-erp.apk'),
    path.join(frontendPublicDir, 'app-debug.apk')
];

const apkSourcePath = apkCandidates.find((candidatePath) => fs.existsSync(candidatePath));

if (!apkSourcePath) {
    console.warn(`APK output not found, skipping asset sync. Checked: ${apkCandidates.join(', ')}`);
    apkTargetPaths.forEach((targetPath) => {
        try {
            if (fs.existsSync(targetPath)) {
                fs.rmSync(targetPath, { force: true });
            }
        } catch (err) {
            console.warn(`Failed to remove old APK (may be locked by another process): ${err.message}`);
        }
    });
    process.exit(0);
}

try {
    fs.mkdirSync(frontendPublicDir, { recursive: true });
    apkTargetPaths.forEach((targetPath) => fs.cpSync(apkSourcePath, targetPath));
    console.log(`Synced APK asset from ${apkSourcePath}`);
} catch (err) {
    console.warn(`APK Asset sync failed (likely locked by another process). Skipping sync. Error: ${err.message}`);
}
