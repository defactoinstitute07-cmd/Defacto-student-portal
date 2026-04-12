const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'frontend', 'dist');
const targetDir = path.join(rootDir, 'public');
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
    path.join(targetDir, 'defacto-student-erp.apk'),
    path.join(targetDir, 'app-debug.apk')
];

if (!fs.existsSync(sourceDir)) {
    console.error(`Frontend build output not found: ${sourceDir}`);
    process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

const apkSourcePath = apkCandidates.find((candidatePath) => fs.existsSync(candidatePath));

if (apkSourcePath) {
    apkTargetPaths.forEach((targetPath) => fs.cpSync(apkSourcePath, targetPath));
} else {
    console.warn(`APK output not found, skipping copy. Checked: ${apkCandidates.join(', ')}`);
}
