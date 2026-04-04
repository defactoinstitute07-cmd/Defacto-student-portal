import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.student.erp',
    appName: 'Institute',
    webDir: 'dist',
    server: {
        url: 'https://defacto-student-erp-new.vercel.app',
        cleartext: false,
    },
};

export default config;
