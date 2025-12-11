# Testing Guide - BumpTop Mixed Reality Desktop

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will start on `http://localhost:3000` (or the next available port).

### 3. Access the App

Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:3000`).

---

## Testing AR Features

### Requirements for AR Testing

**Important**: WebXR/AR features require specific conditions:

1. **HTTPS or Localhost**: 
   - ✅ `localhost` works (development)
   - ✅ `127.0.0.1` works (development)
   - ❌ HTTP on non-localhost won't work
   - ✅ HTTPS required for production/testing on real devices

2. **Supported Browsers**:
   - **Chrome/Edge** (Android): Full WebXR support
   - **Safari** (Vision Pro only): WebXR support
   - **Safari** (iPhone/iPad): ❌ NO WebXR support
   - **Firefox Reality**: Full support
   - **Oculus Browser**: Full support

3. **Device Requirements**:
   - **Mobile/Tablet**: Android or iOS device with AR support
   - **MR Headsets**: Quest, Vision Pro, Android XR devices
   - **Desktop**: Limited (no AR, but can test 3D scene)

### Testing on Mobile Device

#### Option 1: Local Network (Same WiFi)

1. Find your computer's local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or on macOS
   ipconfig getifaddr en0
   ```

2. Update `vite.config.ts` to allow external connections (already configured with `host: '0.0.0.0'`)

3. Run dev server:
   ```bash
   npm run dev
   ```

4. On your mobile device, open browser and go to:
   ```
   http://YOUR_LOCAL_IP:3000
   ```
   Example: `http://192.168.1.100:3000`

5. **Note**: For AR to work, you may need HTTPS. See "HTTPS Setup" below.

#### Option 2: HTTPS Tunnel (Recommended for AR)

Use a service like **ngrok** or **localtunnel** to create an HTTPS tunnel:

**Using ngrok:**
```bash
# Install ngrok (if not installed)
# brew install ngrok  # macOS
# or download from https://ngrok.com

# Start dev server
npm run dev

# In another terminal, create tunnel
ngrok http 3000
```

Use the HTTPS URL provided by ngrok on your mobile device.

**Using localtunnel:**
```bash
npm install -g localtunnel
npm run dev
# In another terminal
lt --port 3000
```

### Testing on Desktop (Limited)

Desktop browsers can test the 3D scene but **won't have AR features**:

1. Run `npm run dev`
2. Open `http://localhost:3000`
3. You'll see the 3D scene but AR button won't work
4. Can test physics and interactions using mouse (if implemented)

---

## Testing Workflow

### 1. Basic Functionality Test

1. **Start the app** - Should load without errors
2. **Check AR Button** - Should appear on screen
3. **Click AR Button** - Should request camera permissions
4. **Grant Permissions** - Camera should activate

### 2. AR Interaction Test

1. **Scan Surface** - Move phone/tablet to scan floor/table
2. **See Reticle** - White ring should appear on detected surface
3. **Tap to Place** - Tap screen to place virtual desktop
4. **See Files** - 7 file objects should appear on desktop
5. **Drag Files** - Use controller/pointer to drag files
6. **Throw Files** - Release while moving to throw
7. **Check Boundaries** - Files should bounce off desktop edges

### 3. File Interaction Test

- **Hover**: Files should show white wireframe highlight
- **Drag**: Files should follow controller smoothly
- **Physics**: Files should fall and bounce realistically
- **Labels**: File names should be visible above each file

---

## Troubleshooting

### AR Button Not Working

**Problem**: AR button doesn't appear or doesn't work

**Solutions**:
- ✅ Ensure you're on HTTPS or localhost
- ✅ Check browser supports WebXR (Chrome/Edge on Android)
- ✅ Grant camera permissions
- ✅ Try different browser (Chrome recommended)
- ✅ Check device has AR support (ARKit/ARCore)

### Camera Not Starting

**Problem**: Camera doesn't activate

**Solutions**:
- ✅ Check browser permissions (Settings > Site Settings > Camera)
- ✅ Try refreshing the page
- ✅ Check if another app is using the camera
- ✅ Restart browser

### Files Not Appearing

**Problem**: Desktop placed but no files visible

**Solutions**:
- ✅ Check browser console for errors (F12)
- ✅ Verify physics engine initialized
- ✅ Check files aren't spawning outside view
- ✅ Try moving camera to look around

### Performance Issues

**Problem**: Low frame rate, laggy interactions

**Solutions**:
- ✅ Close other apps/tabs
- ✅ Reduce number of files (modify MOCK_FILES array)
- ✅ Check device capabilities
- ✅ Use Chrome (better WebXR performance)

### Desktop Not Placing

**Problem**: Can't place desktop, reticle not appearing

**Solutions**:
- ✅ Ensure good lighting
- ✅ Move device to scan flat surfaces
- ✅ Try different surface (table, floor)
- ✅ Check hit-test feature is enabled in browser

---

## Browser Console

Open browser console (F12) to see:
- **Errors**: Any JavaScript errors
- **Warnings**: WebXR warnings
- **Logs**: Debug information

Common errors to watch for:
- `WebXR not supported` - Browser/device doesn't support WebXR
- `Camera permission denied` - Need to grant camera access
- `Hit-test not available` - AR features limited

---

## Testing Checklist

### Basic Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server starts (`npm run dev`)
- [ ] App loads in browser
- [ ] No console errors

### AR Features (Mobile)
- [ ] AR button appears
- [ ] Camera activates
- [ ] Surface scanning works
- [ ] Reticle appears on surfaces
- [ ] Desktop places on tap
- [ ] Files appear on desktop

### Interactions
- [ ] Files can be dragged
- [ ] Files can be thrown
- [ ] Physics works (bouncing, falling)
- [ ] Boundaries work (files stay on desktop)
- [ ] Hover feedback works

### Visual
- [ ] Lighting looks good
- [ ] Shadows render correctly
- [ ] File labels visible
- [ ] Different file types have different visuals
- [ ] Desktop grid visible

---

## Development vs Production Testing

### Development (`npm run dev`)
- ✅ Hot reload (changes update automatically)
- ✅ Source maps for debugging
- ✅ Detailed error messages
- ⚠️ Slower performance
- ⚠️ Larger bundle size

### Production (`npm run build` + `npm run preview`)
```bash
npm run build
npm run preview
```
- ✅ Optimized performance
- ✅ Smaller bundle
- ✅ Production-like environment
- ❌ No hot reload
- ❌ Minified code (harder to debug)

---

## Next Steps After Testing

Once basic testing is complete:

1. **Test on Multiple Devices**: Different phones/tablets
2. **Test Different Browsers**: Chrome, Edge, Safari
3. **Test Edge Cases**: Many files, rapid interactions
4. **Performance Testing**: Frame rate, memory usage
5. **User Testing**: Get feedback from others

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for issues
npm run build  # Will show TypeScript errors
```

---

## Need Help?

- Check browser console for errors
- Review [CURRENT_STATE.md](./CURRENT_STATE.md) for known issues
- Check [MILESTONES.md](./MILESTONES.md) for planned features
- WebXR compatibility: https://caniuse.com/webxr

