# XRViewer Black Screen - Root Causes & Solutions

## Why You See a Black Screen in XRViewer

### Primary Causes

1. **XRViewer is Outdated and Unmaintained**
   - Last updated: 2020-2021
   - Not compatible with iOS 15+ and newer
   - No longer actively developed by Mozilla
   - Known issues with newer WebXR implementations

2. **WebGL Context Issues**
   - WebGL context may not initialize properly
   - Context lost errors
   - Incompatible WebGL settings

3. **JavaScript Errors**
   - Module loading failures
   - React rendering errors
   - WebXR API incompatibilities
   - Missing error boundaries causing silent failures

4. **WebXR Session Failures**
   - AR session doesn't start
   - Camera permissions denied
   - Hit-test feature not available
   - Session initialization errors

5. **Canvas Rendering Issues**
   - Canvas not mounting properly
   - Three.js scene not initializing
   - Renderer configuration problems

## Code Improvements Made

### ✅ Added Error Boundary
- Catches React rendering errors
- Shows error messages instead of black screen
- Provides error details for debugging

### ✅ Added WebGL Error Detection
- Checks if WebGL is available
- Detects WebGL context loss
- Logs WebGL context information

### ✅ Added Canvas Error Handling
- `onCreated` callback for successful initialization
- `onError` callback for canvas errors
- WebGL context event listeners

### ✅ Added XRViewer Detection
- Detects when running in XRViewer
- Shows warning message
- Provides alternative suggestions

### ✅ Enhanced Logging
- Device information logging
- WebGL context info logging
- Canvas creation logging
- Error logging with details

## How to Debug the Black Screen

### Step 1: Check Browser Console

**In XRViewer** (if possible):
- Look for JavaScript errors
- Check for WebGL errors
- Look for module loading failures

**Alternative - Use Safari Web Inspector**:
1. Connect iPhone to Mac via USB
2. iPhone: Settings → Safari → Advanced → Web Inspector (ON)
3. Mac Safari: Develop → [Your iPhone] → [Your Page]
4. Check Console tab for errors

### Step 2: Look for These Errors

**Common Errors**:
```
WebGL context lost
→ WebGL stopped working (try reloading)

Failed to create WebGL context
→ Device/browser doesn't support WebGL

Module not found
→ Import/loading issue

WebXR session failed
→ AR session couldn't start
```

### Step 3: Check the Error Messages

The app now shows error messages on screen:
- **Red box**: Critical errors (WebGL, Canvas)
- **Orange box**: Warnings (iOS, XRViewer)
- **Error details**: Click to see full error

## Solutions

### ✅ Solution 1: Don't Use XRViewer (Recommended)

**XRViewer is outdated** - Use these instead:

1. **Safari on Vision Pro** (if available):
   - WebXR works natively
   - Use HTTPS (ngrok/localtunnel)
   - Full WebXR support

   **Note**: iPhone/iPad Safari does NOT support WebXR

2. **Android Device**:
   - Chrome/Edge on Android
   - Full WebXR support
   - Best experience

3. **Desktop Browser** (for development):
   - Test 3D scene (no AR)
   - Debug interactions
   - Verify code works

### ✅ Solution 2: Check Console Errors

1. Open browser console
2. Look for red error messages
3. Check the error details
4. Fix the underlying issue

### ✅ Solution 3: Verify WebGL Support

The app now checks WebGL automatically. If you see:
- "WebGL not available" → Device doesn't support it
- "WebGL context lost" → Try reloading

### ✅ Solution 4: Check Permissions

1. Camera permission: Required for AR
2. Location permission: May be required
3. Grant when prompted

### ✅ Solution 5: Use HTTPS

WebXR requires HTTPS (except localhost):
```bash
# Using ngrok
ngrok http 3000

# Using localtunnel
lt --port 3000 --https
```

## What the Code Now Does

### Error Detection
- ✅ Detects XRViewer and shows warning
- ✅ Detects WebGL availability
- ✅ Catches React errors
- ✅ Catches Canvas errors
- ✅ Logs detailed diagnostic info

### Error Display
- ✅ Shows error messages on screen
- ✅ Provides error details
- ✅ Suggests solutions
- ✅ Reload button for errors

### Debugging
- ✅ Console logging for all major events
- ✅ WebGL context information
- ✅ Device information
- ✅ WebXR support status

## Testing Checklist

### Before Testing
- [ ] Updated code (with error handling)
- [ ] HTTPS connection (or localhost)
- [ ] Camera permissions granted
- [ ] Good lighting

### During Testing
- [ ] Check for error messages on screen
- [ ] Check browser console for errors
- [ ] Look for diagnostic logs
- [ ] Verify WebGL is available
- [ ] Verify WebXR is available

### If Black Screen Persists
1. **Check console** - Look for errors
2. **Check error messages** - On screen warnings
3. **Try Safari** - Instead of XRViewer
4. **Try Android** - For full WebXR support
5. **Check WebGL** - Verify device supports it

## Expected Behavior

### With Updated Code:
- ✅ Error messages appear instead of black screen
- ✅ Diagnostic information in console
- ✅ Warning about XRViewer being outdated
- ✅ Suggestions for alternatives

### If XRViewer Works:
- AR button appears
- Camera activates
- Scene renders
- Interactions work

### If XRViewer Doesn't Work:
- Error message appears
- Console shows detailed errors
- Suggestions for alternatives

## Why XRViewer Specifically Fails

1. **Outdated WebXR Implementation**
   - Uses old WebXR API
   - Doesn't support newer features
   - Incompatible with React Three Fiber updates

2. **iOS Compatibility Issues**
   - Not updated for iOS 15+
   - WebKit changes break functionality
   - ARKit integration issues

3. **Module Loading Problems**
   - ES modules may not load correctly
   - Import map issues
   - CDN loading failures

4. **WebGL Context Problems**
   - Context initialization fails
   - Context lost immediately
   - Incompatible settings

## Recommended Action

**Stop using XRViewer** and use:
1. **Safari on Vision Pro** (if available - only Vision Pro supports WebXR)
2. **Android device** (Chrome/Edge) - Full WebXR support
3. **Desktop browser** (for development - desktop mode with 3D scene)

XRViewer is no longer maintained and causes more problems than it solves.

## Next Steps

1. **Test the updated code** - Should show errors instead of black screen
2. **Check console** - Look for diagnostic information
3. **Use Desktop Mode** - Works on iPhone/iPad (no AR, but full 3D scene)
4. **Try Android** - Full WebXR support (Chrome/Edge)
5. **Try Vision Pro Safari** - If you have Vision Pro, WebXR works natively
6. **Report specific errors** - If you see error messages, share them

The updated code should now show you **why** it's failing instead of just a black screen.

