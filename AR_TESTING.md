# Testing AR Mode on Mobile Devices

WebXR requires a **secure context (HTTPS)** to function. This guide shows how to test the AR mode on your mobile device.

## Quick Start

### Step 1: Start the Dev Server
```bash
npm run dev
```
Keep this terminal open - the dev server should be running on `http://localhost:5173`

### Step 2: Start ngrok Tunnel (in a new terminal)
```bash
npm run dev:tunnel
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.app -> http://localhost:5173
```

### Step 3: Open on Mobile Device
1. Copy the **https** URL (e.g., `https://abc123.ngrok.app`)
2. Open it in your mobile browser
3. Grant camera permissions when prompted
4. Click **"Enter AR"** button

## Supported Devices

### ✅ Recommended
- **Android phones** with ARCore support (Chrome, Edge)
  - Pixel phones (3+)
  - Samsung Galaxy (S8+, Note 8+)
  - Most modern Android devices
- **Meta Quest** (Quest 2, Quest 3, Quest Pro) - Browser
- **Apple devices** with ARKit (iOS 15+)
  - iPhone 12 and newer (iOS 17.4+ required for WebXR)
  - iPad Pro with LiDAR

### Browser Support
- **Android**: Chrome 90+, Edge 90+
- **iOS**: Safari 17.4+ (WebXR support limited)
- **Meta Quest**: Built-in browser

## Troubleshooting

> **📘 For detailed troubleshooting and common issues, see [TROUBLESHOOTING_AR.md](./TROUBLESHOOTING_AR.md)**

### Quick Fixes

#### "Enter AR" button doesn't appear
- Check browser console for WebXR support:
  ```javascript
  navigator.xr ? 'WebXR available' : 'WebXR not available'
  ```
- Make sure you're accessing via HTTPS (ngrok URL)
- Update browser to latest version
- Check **Settings panel** → WebXR Debug Info section

#### Camera permission denied
- Go to browser settings → Site permissions
- Allow camera access for the ngrok domain
- Refresh the page

#### "Failed to enter AR: not connected to three.js" error
**This is the most common error.** See [TROUBLESHOOTING_AR.md](./TROUBLESHOOTING_AR.md) for detailed explanation.

Quick check:
- Verify Canvas in ARMode.tsx does NOT have `events` prop
- Ensure XR store is passed correctly to `<XR store={xrStore}>` component
- Wait for "Start AR Session" button to enable (gives Canvas time to initialize)

#### AR session fails to start
- Check console logs for error messages
- Ensure good lighting conditions
- Try restarting the browser
- Check WebXR Debug Info in Settings panel

#### ngrok tunnel expires (free tier)
- Free ngrok sessions expire after 2 hours
- Restart with `npm run dev:tunnel`
- Consider signing up for free ngrok account for longer sessions

## Alternative: Vite HTTPS (Local Network Only)

If you prefer not to use ngrok and your mobile device is on the same Wi-Fi:

1. Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem'),
    },
    host: '0.0.0.0', // Listen on all network interfaces
  },
})
```

2. Generate self-signed certificate:
```bash
mkdir certs
cd certs
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
cd ..
```

3. Start dev server:
```bash
npm run dev
```

4. Find your computer's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

5. Open on mobile: `https://<your-ip>:5173`
   - You'll need to accept the self-signed certificate warning

## Tips for AR Testing

1. **Good Lighting**: AR tracking works best in well-lit environments
2. **Stable Surface**: Point camera at floor/table for initial placement
3. **Space**: Ensure ~2m x 2m open space for the desk area
4. **Movement**: Move device slowly for better tracking
5. **Console**: Check browser console (connect via USB debugging) for error logs

## Known Limitations

- iOS WebXR support is limited (as of iOS 17.4)
- Some Android devices may have hardware limitations
- Hand tracking requires ARCore Depth API (newer devices)
- Performance varies by device

## Development Workflow

**Recommended setup:**
1. **Terminal 1**: `npm run dev` (keep running)
2. **Terminal 2**: `npm run dev:tunnel` (keep running)
3. **Mobile**: Open ngrok HTTPS URL
4. Edit code → Auto-reload on mobile via HMR

## Production Deployment

For production, deploy to a platform with HTTPS:
- Vercel (automatic HTTPS)
- Netlify (automatic HTTPS)
- Cloudflare Pages (automatic HTTPS)
- Your own server with Let's Encrypt certificate

No ngrok needed in production!
