# Android Domain

## Purpose

Jouda Android is a Capacitor 8 native wrapper around the React/Vite build output.

## Key Files

| File | Role |
|---|---|
| `capacitor.config.ts` | App id/name, `dist` web dir, Android HTTPS scheme, hostname |
| `android/build.gradle` | Android Gradle Plugin version |
| `android/gradle/wrapper/gradle-wrapper.properties` | Gradle wrapper version |
| `components/ui/Scanner.tsx` | Capacitor Camera usage with web fallback |

## Current Facts

- App ID: `com.joudafood.app`.
- App name: `Jouda - جودة`.
- Web output: `dist`.
- Hostname: `joudafood.com`.
- Native camera path uses `Camera.getPhoto()` with `CameraSource.Prompt`.

## Operational Notes

For Android changes:

```bash
npm run build
npx cap sync android
npx cap open android
```

Do not edit generated Android files casually. Prefer changing web code or Capacitor config unless the task is specifically native Android.

## Related Context

- Deployment: `context/processes/deployment.md`
- Decisions: `context/decisions.md`
