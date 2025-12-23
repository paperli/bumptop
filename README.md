# BumpTop WebXR

A 3D desktop interface for interacting with files in a physics-based environment. Supports both desktop/laptop (simulated mode) and mobile AR (WebXR mode) with real file integration via Dropbox.

![BumpTop WebXR](https://img.shields.io/badge/status-MVP%20Complete-success)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![WebXR](https://img.shields.io/badge/WebXR-AR%20Ready-orange)

---

## ✨ Features

### 🖥️ Simulated Mode (Desktop/Laptop)
- **3D Desktop Environment** - Files displayed as 3D objects on a virtual desk
- **Physics Interactions** - Click, drag, and throw files with realistic physics
- **Content Previews** - Open images, videos, audio, and text files in 3D panels
- **Boundary Enforcement** - Objects stay within desk boundaries with bounce physics

### 📱 AR Mode (Mobile Devices)
- **WebXR Support** - Immersive AR on supported mobile devices
- **Hand Tracking** - Natural hand interactions (device dependent)
- **Real-world Integration** - Place virtual desk in your physical space
- **Camera View** - See files overlaid on your real environment

### ☁️ File Integration
- **Dropbox Integration** - Load your real files from Dropbox /Desktop folder
- **OAuth 2.0 + PKCE** - Secure authentication without storing passwords
- **Mock Provider** - Sample files for testing without Dropbox account
- **Provider Switching** - Toggle between Mock and Dropbox seamlessly

### 📄 Supported File Types
- **Images** - JPG, PNG, GIF, WebP with zoom controls
- **Videos** - MP4, WebM, MOV with playback controls
- **Audio** - MP3, WAV, OGG with waveform visualization
- **Text** - TXT, MD with pagination and search

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- For AR mode: WebXR-supported mobile device (Android Chrome 90+ or iOS Safari 17.4+)
- For Dropbox: Dropbox account and app credentials

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bumptop

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Testing AR Mode on Mobile

AR requires HTTPS. Use ngrok for mobile testing:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
npm run dev:tunnel
```

Open the ngrok HTTPS URL on your mobile device. See [AR_TESTING.md](./AR_TESTING.md) for detailed instructions.

### Dropbox Setup (Optional)

1. Create a Dropbox app at https://www.dropbox.com/developers/apps
2. Set redirect URI to `http://localhost:5173/auth/callback`
3. Create `.env` file:

```bash
VITE_DROPBOX_APP_KEY=your_app_key_here
VITE_DROPBOX_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_DROPBOX_ROOT_PATH=/Desktop
```

4. Restart dev server
5. Click "Dropbox" in provider selector and sign in

---

## 📚 Documentation

- **[PROGRESS.md](./PROGRESS.md)** - Complete project progress, all completed phases, and context
- **[TODO.md](./TODO.md)** - Pending tasks and future enhancements
- **[AR_TESTING.md](./AR_TESTING.md)** - Mobile AR testing guide with ngrok setup
- **[TROUBLESHOOTING_AR.md](./TROUBLESHOOTING_AR.md)** - AR mode troubleshooting and common issues

---

## 🏗️ Architecture

### Tech Stack
- **React 18** + **TypeScript** - UI framework
- **React Three Fiber (R3F)** - 3D rendering with Three.js
- **@react-three/xr** - WebXR integration for AR mode
- **Rapier** - Physics engine for realistic object interactions
- **Zustand** - State management
- **React Router** - OAuth callback routing
- **Vite** - Build tool and dev server

### Key Concepts

**File System Provider Pattern**
```typescript
interface FileSystemProvider {
  id: string
  label: string
  isAuthenticated(): boolean
  signIn(): Promise<void>
  signOut(): Promise<void>
  listFixedFolder(): Promise<FileEntry[]>
  getFileContent(entry: FileEntry): Promise<FileContentHandle>
}
```

Providers: `MockProvider` (sample files), `DropboxProvider` (OAuth + API)

**State Management**
- `appStore` - App settings, mode, capabilities
- `fileStore` - File list and provider
- `contentStore` - Open content previews
- `authStore` - Authentication state for Dropbox

**Mode System**
- `simulated` - Desktop/laptop 3D view with OrbitCamera
- `ar` - Mobile AR view with WebXR session

---

## 🎮 Usage

### Desktop Mode (Simulated)

**Mouse Controls:**
- **Left Click** - Select/deselect file
- **Left Drag** - Move file
- **Throw** - Drag quickly and release for velocity
- **Double Click** - Open file preview
- **Right Click** - Rotate camera
- **Scroll** - Zoom (if enabled)

**Keyboard Shortcuts:**
- `Esc` - Close content preview
- `s` - Open settings panel

### AR Mode (Mobile)

1. Click "Enter AR" button (only shows if WebXR supported)
2. Grant camera permission
3. Wait for "Start AR Session" button to enable
4. Click "Start AR Session"
5. Point camera at floor/table surface
6. Use hand gestures or screen touch to interact with files
7. Click "Exit AR" to return to simulated mode

### Provider Switching

- Click "Mock Files" or "Dropbox" in top-left selector
- If Dropbox: Click "Sign in with Dropbox" and authorize
- Files automatically reload when switching providers

---

## 🧪 Development

### Project Structure

```
src/
├── app/              # UI components
│   ├── ARMode.tsx           # AR mode Canvas with XR
│   ├── SimulatedMode.tsx    # Desktop mode Canvas
│   ├── StartARButton.tsx    # AR entry overlay
│   ├── ExitARButton.tsx     # AR exit button
│   ├── Settings.tsx         # Settings panel
│   ├── ProviderSelector.tsx # Provider switcher
│   └── AuthCallback.tsx     # OAuth callback handler
├── scene/            # 3D scene components
│   ├── DeskBoundary.tsx     # Desk plane
│   ├── FileObject.tsx       # 3D file representation
│   ├── FileIcon.tsx         # File type icons
│   ├── ContentObject.tsx    # Content preview panel
│   └── content/             # Content preview types
├── store/            # Zustand stores
│   ├── appStore.ts          # App state
│   ├── fileStore.ts         # File list
│   ├── contentStore.ts      # Open previews
│   └── authStore.ts         # Auth state
├── fs/               # File system providers
│   ├── MockProvider.ts      # Sample files
│   └── DropboxProvider.ts   # Dropbox integration
├── utils/            # Utility functions
│   ├── oauth.ts             # PKCE crypto functions
│   ├── tokenStorage.ts      # Token management
│   └── physicsConfig.ts     # Physics settings
└── types/            # TypeScript types
    └── index.ts             # Shared types
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run dev:tunnel       # Start ngrok HTTPS tunnel for AR testing

# Build
npm run build            # Production build
npm run preview          # Preview production build

# Linting
npm run lint             # Run ESLint
```

### Environment Variables

```bash
# Dropbox Integration (optional)
VITE_DROPBOX_APP_KEY=<your_dropbox_app_key>
VITE_DROPBOX_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_DROPBOX_ROOT_PATH=/Desktop
```

---

## 🐛 Known Issues

1. **iOS WebXR Limited** - Apple's WebXR support incomplete (iOS 17.4)
2. **Hand Tracking Device-Dependent** - Requires ARCore Depth API (newer Android devices)
3. **Token Refresh Not Implemented** - Dropbox tokens expire after 4 hours, requires re-authentication
4. **Physics Performance** - May struggle with 100+ files on mobile devices

See [TROUBLESHOOTING_AR.md](./TROUBLESHOOTING_AR.md) for detailed solutions.

---

## 🗺️ Roadmap

### ✅ Completed (MVP)
- Phase 1: Foundation (3D scene, UI)
- Phase 2: File System Abstraction
- Phase 3: File Objects in 3D Space
- Phase 4: Content Preview System
- Phase 5: AR Mode Implementation
- Phase 6: Dropbox Integration

### 🚧 In Progress
- AR mode device testing (iOS, Quest)
- Hit testing for surface placement
- Error handling improvements

### 📋 Planned
- Folder support (navigate into folders)
- File upload to Dropbox
- Thumbnail generation
- Performance optimization
- Multi-select files
- Keyboard shortcuts

See [TODO.md](./TODO.md) for complete task list and [PROGRESS.md](./PROGRESS.md) for detailed progress.

---

## 🤝 Contributing

This is currently a personal project. If you'd like to contribute:

1. Check [TODO.md](./TODO.md) for pending tasks
2. Read [PROGRESS.md](./PROGRESS.md) for project context
3. See [TROUBLESHOOTING_AR.md](./TROUBLESHOOTING_AR.md) for AR development tips

---

## 📄 License

[Add license information here]

---

## 🙏 Acknowledgments

- **BumpTop** - Original inspiration (2006-2010)
- **@react-three/xr** - Excellent WebXR React integration
- **Rapier** - High-performance physics engine
- **Dropbox** - File storage and OAuth API

---

## 📞 Support

For issues and questions:
- Check [TROUBLESHOOTING_AR.md](./TROUBLESHOOTING_AR.md) for AR issues
- Check [TODO.md](./TODO.md) for known limitations
- [Open an issue](https://github.com/your-username/bumptop/issues) on GitHub

---

**Built with Claude Code** 🤖

*A physics-based 3D file manager that brings the desktop into augmented reality.*
