# iOS Testing Guide - BumpTop Mixed Reality Desktop

## The Problem: WebXR on iOS

**Current Status (2024)**:
- ❌ **Chrome on iOS**: Does NOT support WebXR (uses WebKit engine, same as Safari)
- ❌ **Safari on iPhone/iPad**: Does NOT support WebXR
- ✅ **Safari on Vision Pro**: Supports WebXR (only Apple Vision Pro)
- ⚠️ **XRViewer**: Old/unmaintained app, may show black screen on newer iOS versions
- ✅ **Best Option for iPhone**: Use an Android device, or test desktop mode

## Why You're Seeing Issues

### 1. **Black Screen in XRViewer**
- XRViewer is outdated and not maintained
- May not work with iOS 16+ or newer devices
- JavaScript errors may be causing the black screen
- WebGL context may not be initializing

### 2. **"AR Unsupported" in Chrome**
- Chrome on iOS uses WebKit (Safari's engine) under the hood
- Apple doesn't allow other browser engines on iOS
- Chrome on iOS has **zero WebXR support**
- This is an iOS limitation, not a bug in your code

## Solutions for Testing on iPhone

### ❌ **Option 1: Safari on iPhone/iPad - NOT AVAILABLE**

**Important**: Safari on iPhone and iPad does **NOT** support WebXR. Only Safari on **Apple Vision Pro** supports WebXR.

**If you have Vision Pro**:
1. Open Safari on Vision Pro
2. Navigate to your app (HTTPS required)
3. WebXR should work natively

**For iPhone/iPad**: WebXR is not available. Use desktop mode or an Android device.

### ✅ **Option 1: Use Desktop Mode (Recommended for iPhone)**

The app now automatically enables desktop mode when WebXR is not available. You can:
- View the 3D desktop and files
- Use mouse/trackpad to orbit, zoom, and pan
- Test physics and interactions
- No AR features, but full 3D scene

### ✅ **Option 2: Use HTTPS (Required for WebXR on Vision Pro)**

WebXR **requires HTTPS** (except localhost). If you're testing over HTTP on a network, it won't work.

**Quick HTTPS Setup**:

**Using ngrok** (easiest):
```bash
# Install ngrok
brew install ngrok

# Start your dev server
npm run dev

# In another terminal, create HTTPS tunnel
ngrok http 3000
```

Then use the HTTPS URL from ngrok on your iPhone Safari.

**Using localtunnel**:
```bash
npm install -g localtunnel
npm run dev
# In another terminal
lt --port 3000 --https
```

### ✅ **Option 3: Test on Android Instead (Best for WebXR)**

**Why Android is Better for WebXR**:
- ✅ Full WebXR support in Chrome/Edge
- ✅ No experimental features needed
- ✅ Better AR performance
- ✅ More reliable hit-test

**Recommended**: Test on Android device for best WebXR experience, then optimize for iOS later.

### ✅ **Option 4: Desktop Testing (Full 3D, No AR)**

You can test the 3D scene on desktop (no AR):
- Run `npm run dev`
- Open `http://localhost:3000` in desktop browser
- You'll see the scene but AR won't work
- Good for testing physics and interactions

## Code Changes Made for iOS Compatibility

The code has been updated to:

1. **Make hit-test optional** (not required) - iOS may not support it
2. **Add iOS detection** - Shows helpful messages
3. **Better error handling** - Graceful fallbacks
4. **Debug information** - Console logs for troubleshooting

### What Changed:

```typescript
// Before: Required hit-test (fails on iOS)
<ARButton sessionInit={{ requiredFeatures: ['hit-test'] }} />

// After: Hit-test is optional
<ARButton 
  sessionInit={{ 
    optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor'],
    requiredFeatures: [] // Don't require hit-test
  }} 
/>
```

## Testing Checklist for iOS

### Pre-Testing
- [ ] iPhone running iOS 15.0 or later
- [ ] Using Safari (not Chrome)
- [ ] HTTPS connection (or localhost)
- [ ] Camera permissions granted
- [ ] Good lighting for AR

### During Testing
- [ ] App loads without errors
- [ ] AR button appears
- [ ] Camera activates
- [ ] Check browser console for errors (Safari: Settings → Advanced → Web Inspector)
- [ ] Surface scanning works (if hit-test available)
- [ ] Desktop can be placed
- [ ] Files appear and can be interacted with

### Troubleshooting Steps

1. **Check Console Errors**:
   - Connect iPhone to Mac
   - Enable Web Inspector: Settings → Safari → Advanced → Web Inspector
   - Open Safari on Mac: Develop → [Your iPhone] → [Your Page]
   - Check console for errors

2. **Verify WebXR Support**:
   - Open browser console
   - Run: `navigator.xr?.isSessionSupported('immersive-ar')`
   - Should return a Promise that resolves to `true` or `false`

3. **Check HTTPS**:
   - URL must start with `https://` (not `http://`)
   - Exception: `localhost` or `127.0.0.1` work over HTTP

4. **Camera Permissions**:
   - Settings → Safari → Camera → Allow
   - Or grant when prompted in browser

## Alternative: Native iOS AR (Future Consideration)

If WebXR continues to be problematic on iOS, consider:

1. **ARKit Integration**: Build a native iOS app using ARKit
2. **React Native**: Use React Native with ARKit bindings
3. **WebAR Platforms**: Use 8th Wall or Zappar for cross-platform WebAR

## Current Limitations

### iOS Safari WebXR Status:
- ❌ **iPhone/iPad Safari**: NO WebXR support at all
- ✅ **Vision Pro Safari**: Full WebXR support
- ⚠️ **XRViewer**: Outdated, may show black screen

### What Works on iPhone/iPad:
- ✅ Desktop mode (automatic when WebXR unavailable)
- ✅ 3D scene rendering
- ✅ Mouse/trackpad controls (orbit, zoom, pan)
- ✅ Physics simulation
- ✅ File interactions (in desktop mode)

### What Does NOT Work on iPhone/iPad:
- ❌ WebXR/AR features - not supported
- ❌ AR session - not available
- ❌ Hit-test - not available
- ❌ Hand tracking - not available

## Recommended Testing Strategy

1. **Primary Testing**: Use Android device (Chrome/Edge)
   - Full WebXR support
   - All features work
   - Best performance

2. **iOS Testing**: Use Desktop Mode (automatic)
   - Test 3D scene rendering
   - Test physics and interactions
   - Verify desktop mode works correctly
   - Note: No AR features available on iPhone/iPad

3. **Desktop Testing**: For development
   - Test 3D scene
   - Test physics
   - Debug interactions

## Debugging Tips

### Enable Safari Web Inspector on iPhone:
1. iPhone: Settings → Safari → Advanced → Web Inspector (ON)
2. Mac: Safari → Preferences → Advanced → "Show Develop menu"
3. Connect iPhone to Mac via USB
4. Mac Safari: Develop → [Your iPhone] → [Your Page]
5. Console will show JavaScript errors

### Common Errors to Look For:

```
WebXR not supported
→ Browser doesn't support WebXR (Chrome on iOS)

Hit-test not available
→ Feature not supported (common on iOS)

Camera permission denied
→ Need to grant camera access

Failed to create WebGL context
→ Graphics issue, try restarting browser
```

## Next Steps

1. **Test on Android first** to verify everything works (full WebXR)
2. **Then test on iPhone/iPad** - Desktop mode should work automatically
3. **Test on Vision Pro** (if available) - WebXR should work natively
4. **Document platform-specific issues** for future fixes

## Resources

- [WebXR Device API Spec](https://www.w3.org/TR/webxr/)
- [Can I Use WebXR](https://caniuse.com/webxr)
- [Safari WebXR Support](https://webkit.org/blog/11353/meet-webxr/)
- [iOS WebXR Limitations](https://developer.apple.com/documentation/webkitjs/webxr)

---

**Bottom Line**: iOS WebXR support is limited. For best testing experience, use an Android device. iOS support will improve over time, but currently has significant limitations.

