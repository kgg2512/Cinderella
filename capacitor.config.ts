import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.g2company.cinderella',
  appName: '신데렐라',
  // CAPACITOR_BUILD=true && next build → out/ 디렉토리에 정적 파일 생성됨
  webDir: 'out',

  // CISO 보안 요건 (필수)
  server: {
    allowMixedContent: false,
    cleartext: false,
  },

  ios: {
    limitsNavigationsToAppBoundDomains: true,
    contentInset: 'automatic',
  },

  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    // 카메라 (상품 촬영)
    Camera: {
      // 권한 요청 문구는 Info.plist / AndroidManifest에서 설정
    },

    // 상품 이미지 업로드 / 갤러리 접근
    Filesystem: {
      // 기본 설정으로 충분
    },

    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
    },

    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
  },
};

export default config;
