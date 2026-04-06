# DeFacto ERP Android App

This Android project creates an APK named **DeFacto ERP** with:

- Native login screen (roll number + password)
- WebView shell for all remaining portal content
- API calls sent to `https://defacto-student-portal.vercel.app/`
- User-friendly errors such as:
  - `Invalid credentials`
  - `Link not found`
  - Network connectivity messages

## API target

Native login calls:

- `POST https://defacto-student-portal.vercel.app/api/student/login`

Web content loads from:

- `https://defacto-student-erp-new.vercel.app/`

## Build APK

1. Open `android-defacto-erp/` in Android Studio.
2. Let Gradle sync complete.
3. Build debug APK from:
   - `Build > Build Bundle(s) / APK(s) > Build APK(s)`
4. Find the APK under:
   - `app/build/outputs/apk/debug/app-debug.apk`

## Notes

- The app stores login session in SharedPreferences and injects `studentToken` and `studentInfo` into browser localStorage, so the web portal remains authenticated.
- If the target URL returns 404 or DNS/connect errors, the app shows `Link not found`.

## Upload Your Logo

Use this exact location for the app logo used in splash and login screens:

- `app/src/main/res/drawable/defacto_logo.xml` (current placeholder)

To use your own image:

1. Delete `app/src/main/res/drawable/defacto_logo.xml`
2. Add your image as `app/src/main/res/drawable/defacto_logo.png`

Keep the resource name `defacto_logo` unchanged so no code updates are needed.

## Push Notifications Setup

Android-side integration is already added in code (Firebase Messaging service + token sync to backend).

Manual steps required:

1. Download `google-services.json` from your Firebase Android app (`com.student.erp"`).
2. Place it at:
    - `app/google-services.json`
3. Keep backend Firebase env vars configured (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
4. Login in the Android app once so the FCM token is registered to:
    - `POST https://defacto-student-portal.vercel.app/api/student/device`

To send a broadcast notification from backend:

- Endpoint: `POST /api/notifications/broadcast`
- Header: `x-admin-push-key: <ADMIN_PUSH_API_KEY>`
- Body example:

```json
{
   "title": "Test Alert",
   "body": "This is a test notification",
   "data": {
      "type": "announcement"
   }
}
```
