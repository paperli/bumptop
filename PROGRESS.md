# BumpTop WebXR Project Progress

**Last Updated:** 2025-12-23

This document tracks the complete development progress of the BumpTop WebXR project, capturing all completed features, pending work, and future enhancements.

---

## 🎯 Project Overview

BumpTop is a 3D desktop interface that allows users to interact with their files in a physics-based 3D environment. The project supports both simulated mode (desktop/laptop) and AR mode (mobile devices with WebXR support), with real file integration via Dropbox.

**Key Technologies:**
- React 18 + TypeScript
- React Three Fiber (R3F) for 3D rendering
- @react-three/xr for WebXR/AR support
- Rapier Physics Engine
- Zustand for state management
- Dropbox API with OAuth 2.0 + PKCE

---

## ✅ Completed Phases

### Phase 1: Foundation ✅ (Complete)
**Status:** Fully implemented and stable

**Features:**
- Basic 3D scene with React Three Fiber
- Desk boundary (3D plane)
- Mode detection (AR vs Simulated)
- UI overlays (mode label, settings panel)
- Physics world setup with Rapier

**Files:**
- `src/App.tsx` - Main app component
- `src/app/ModeDetector.tsx` - XR capability detection
- `src/app/ModeLabel.tsx` - Current mode display
- `src/app/Settings.tsx` - Settings panel
- `src/scene/DeskBoundary.tsx` - Desk plane
- `src/store/appStore.ts` - Zustand state management

---

### Phase 2: File System Abstraction ✅ (Complete)
**Status:** Fully implemented with provider pattern

**Features:**
- FileSystemProvider interface
- MockProvider with sample files
- FileEntry type definitions
- File kind detection (image, video, audio, text)

**Files:**
- `src/types/index.ts` - Type definitions
- `src/fs/MockProvider.ts` - Mock file provider
- `src/store/fileStore.ts` - File state management

**Provider Interface:**
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

---

### Phase 3: File Objects in 3D Space ✅ (Complete)
**Status:** Fully implemented with physics

**Features:**
- 3D file icons with thumbnails
- File type icons (image, video, audio, text, generic)
- Physics-based interactions (click, drag, throw)
- Grid layout on desk
- File metadata display (name, size, type)
- Boundary enforcement (objects stay on desk)

**Files:**
- `src/scene/FileObject.tsx` - 3D file representation
- `src/scene/FileIcon.tsx` - Icon rendering
- Mock asset files in `/public/mock-assets/`

**Interactions:**
- Click to select/deselect
- Drag to move
- Throw physics (velocity-based)
- Collision detection

---

### Phase 4: Content Preview System ✅ (Complete)
**Status:** Fully implemented with all file types

**Features:**
- Double-click to open files
- Content preview panel (floating in 3D space)
- Image preview with zoom controls
- Video preview with playback controls
- Audio preview with waveform visualization
- Text preview with pagination and search
- Close button to dismiss preview
- Physics interactions for content panels

**Files:**
- `src/scene/ContentObject.tsx` - 3D content panel
- `src/scene/content/ImagePreview.tsx` - Image viewer
- `src/scene/content/VideoPreview.tsx` - Video player
- `src/scene/content/AudioPreview.tsx` - Audio player
- `src/scene/content/TextPreview.tsx` - Text viewer
- `src/store/contentStore.ts` - Content state management

**Content Panel Features:**
- Drag to reposition
- Close button (red X)
- File type specific controls
- Boundary enforcement
- Physics-based movement

**Bug Fixes:**
- Fixed audio/video "red error panel" issue (invalid blob URL handling)

---

### Phase 5: AR Mode Implementation ✅ (Complete)
**Status:** Fully implemented and tested on device

**Features:**
- WebXR immersive-ar session support
- Hand tracking integration (@react-three/xr)
- AR mode component with XR Canvas
- Two-step AR entry process (eliminates race condition)
- Exit AR button
- Mode switching (Simulated ↔ AR)
- Mobile testing infrastructure with ngrok
- WebXR debug panel
- Comprehensive troubleshooting documentation

**Files:**
- `src/app/ARMode.tsx` - Main AR component
- `src/app/StartARButton.tsx` + CSS - AR entry overlay
- `src/app/ExitARButton.tsx` + CSS - Exit button
- `src/app/ARModeButton.tsx` - Enter AR button
- `vite.config.ts` - ngrok HTTPS support
- `AR_TESTING.md` - Mobile testing guide
- `TROUBLESHOOTING_AR.md` - Detailed troubleshooting

**Critical Bug Fixes:**
1. **Canvas `events` prop bug**: Removed `events={store as any}` that was blocking XR connection
2. **Race condition**: Implemented two-step process with StartARButton overlay

**AR Entry Flow:**
1. User clicks "Enter AR" → Switches to AR mode, mounts Canvas
2. Canvas/XR component initializes (1 second)
3. "Start AR Session" button appears and enables
4. User clicks → `store.enterAR()` succeeds
5. WebXR session starts, camera view activates

**Mobile Testing:**
- ngrok HTTPS tunnel for WebXR secure context
- `npm run dev:tunnel` script
- Hot Module Replacement (HMR) through HTTPS
- Tested on WebXR-supported Android device

**WebXR Debug Info:**
- Device type (mobile/desktop)
- Secure context (HTTPS) status
- WebXR API availability
- Immersive AR support
- Current mode and session status
- Browser information

---

### Phase 6: Dropbox Integration ✅ (Complete)
**Status:** Fully implemented and tested

**Features:**
- OAuth 2.0 + PKCE authentication
- Dropbox API integration
- File listing from /Desktop folder
- Pagination support (100+ files)
- File content download as blob URLs
- Token management with sessionStorage
- Provider selector UI
- OAuth callback handling
- CSRF protection with state parameter

**Files:**
- `src/fs/DropboxProvider.ts` (462 lines) - Dropbox API integration
- `src/utils/oauth.ts` - PKCE crypto utilities
- `src/utils/tokenStorage.ts` - Secure token storage
- `src/store/authStore.ts` - Auth state management
- `src/app/ProviderSelector.tsx` + CSS - Provider switcher
- `src/app/AuthCallback.tsx` + CSS - OAuth callback
- `src/main.tsx` - React Router setup

**OAuth Flow:**
1. User clicks "Sign in with Dropbox"
2. Generate PKCE code_verifier (128 chars) and code_challenge (SHA-256)
3. Redirect to Dropbox authorization page
4. User authorizes app
5. Dropbox redirects to `/auth/callback` with code and state
6. Validate state parameter (CSRF protection)
7. Exchange code + verifier for access token
8. Store token in sessionStorage (clears on tab close)
9. Fetch user info from Dropbox API
10. Load files from /Desktop folder
11. Display files on 3D desktop

**Security Features:**
- PKCE (RFC 7636) prevents authorization code interception
- State parameter for CSRF protection
- sessionStorage (not localStorage) for automatic cleanup
- Token expiration checking (5-minute buffer)
- 401 auto sign-out on expired token
- No token logging to console

**Dropbox API Endpoints:**
- Authorization: `https://www.dropbox.com/oauth2/authorize`
- Token Exchange: `https://api.dropboxapi.com/oauth2/token`
- List Folder: `https://api.dropboxapi.com/2/files/list_folder`
- Pagination: `https://api.dropboxapi.com/2/files/list_folder/continue`
- Download: `https://content.dropboxapi.com/2/files/download`
- User Info: `https://api.dropboxapi.com/2/users/get_current_account`

**Provider Switching:**
- Toggle between Mock Files and Dropbox
- Seamless file loading on switch
- Auth status display
- Sign out functionality

**Environment Variables Required:**
```bash
VITE_DROPBOX_APP_KEY=<your_app_key>
VITE_DROPBOX_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_DROPBOX_ROOT_PATH=/Desktop
```

---

## 🚧 Pending Work

### Phase 5: AR Mode - Remaining Tasks

#### 1. Surface Detection and Placement (Hit Testing) ⏳
**Status:** Not implemented
**Priority:** Medium
**Effort:** ~2-3 hours

**Description:**
Implement WebXR hit testing to detect real-world surfaces and place the virtual desk at a detected surface location instead of fixed position.

**Files to modify:**
- `src/app/ARMode.tsx` - Add hit-test-source request
- New: `src/hooks/useHitTest.ts` - Custom hook for hit testing

**Implementation approach:**
```typescript
// Request hit test source during session
session.requestReferenceSpace('viewer').then(space => {
  session.requestHitTestSource({ space }).then(hitTestSource => {
    // Use in render loop to detect surfaces
  })
})

// In XRFrame callback
const hitTestResults = frame.getHitTestResults(hitTestSource)
if (hitTestResults.length > 0) {
  const hit = hitTestResults[0]
  const pose = hit.getPose(referenceSpace)
  // Position desk at hit.pose.transform
}
```

**User Experience:**
- Show reticle/indicator where desk will be placed
- User taps screen to confirm placement
- Desk appears at detected surface
- Option to reposition desk

**References:**
- [WebXR Hit Testing](https://developer.mozilla.org/en-US/docs/Web/API/XRHitTestSource)
- [@react-three/xr hit testing examples](https://github.com/pmndrs/react-xr)

---

#### 2. Test AR Mode on AR-Capable Device ⏳
**Status:** Partially tested (Android Chrome)
**Priority:** High
**Effort:** Testing time

**Devices to test:**
- [x] Android phone with ARCore (Chrome) - **Tested, working**
- [ ] iPhone with ARKit (iOS 17.4+ Safari)
- [ ] Meta Quest Browser
- [ ] iPad Pro with LiDAR

**Test cases:**
- [ ] AR session initialization
- [ ] Hand tracking (if supported)
- [ ] File interactions in AR space
- [ ] Content preview panels in AR
- [ ] Exit AR and return to simulated mode
- [ ] Performance with 50+ files
- [ ] Different lighting conditions
- [ ] Surface detection (once implemented)

**Known Issues:**
- iOS WebXR support is limited (as of iOS 17.4)
- Some Android devices may have hardware limitations
- Hand tracking requires ARCore Depth API (newer devices only)

---

### Phase 7: Polish & Hardening (Not Started)

#### 1. Performance Optimization ⏳
**Priority:** Medium
**Effort:** ~3-4 hours

**Tasks:**
- [ ] Profile physics performance with 100+ files
- [ ] Optimize boundary enforcement (currently runs every 16ms)
- [ ] Implement object pooling for file icons
- [ ] Add level-of-detail (LOD) for distant objects
- [ ] Optimize texture loading (use compressed formats)
- [ ] Add loading states for heavy operations

**Files to modify:**
- `src/app/SimulatedMode.tsx` - Boundary enforcement optimization
- `src/app/ARMode.tsx` - Boundary enforcement optimization
- `src/scene/FileObject.tsx` - LOD implementation
- `src/scene/FileIcon.tsx` - Texture optimization

---

#### 2. Error Handling & Edge Cases ⏳
**Priority:** High
**Effort:** ~2-3 hours

**Tasks:**
- [ ] Handle empty /Desktop folder (show empty state)
- [ ] Handle Dropbox folder doesn't exist error
- [ ] Add retry mechanism for failed API calls
- [ ] Handle network offline state
- [ ] Add loading indicators for slow operations
- [ ] Handle large files (>50MB) gracefully
- [ ] Validate file types before loading
- [ ] Add error boundaries for React components

**Files to modify:**
- `src/fs/DropboxProvider.ts` - Enhanced error handling
- `src/app/SimulatedMode.tsx` - Loading states
- `src/scene/ContentObject.tsx` - File size warnings
- New: `src/app/ErrorBoundary.tsx` - React error boundary

---

#### 3. User Experience Improvements ⏳
**Priority:** Medium
**Effort:** ~2-3 hours

**Tasks:**
- [ ] Add file search/filter functionality
- [ ] Add file sorting options (name, date, size, type)
- [ ] Add multi-select (shift+click, ctrl+click)
- [ ] Add "select all" / "deselect all"
- [ ] Add file operations (delete, rename) - UI only, not implemented
- [ ] Add keyboard shortcuts documentation
- [ ] Add tooltips for buttons
- [ ] Add file count indicator
- [ ] Add storage usage indicator (Dropbox quota)

**Files to modify:**
- `src/store/fileStore.ts` - Add selection, filtering, sorting
- New: `src/app/FileControls.tsx` - File operations UI
- New: `src/app/KeyboardShortcuts.tsx` - Shortcuts help panel

---

#### 4. Accessibility ⏳
**Priority:** Low
**Effort:** ~2 hours

**Tasks:**
- [ ] Add keyboard navigation
- [ ] Add screen reader support
- [ ] Add high contrast mode
- [ ] Add focus indicators
- [ ] Add ARIA labels
- [ ] Test with keyboard only
- [ ] Test with screen reader

---

### Phase 8: Additional Features (Not Started)

#### 1. Folder Support ⏳
**Priority:** Low
**Effort:** ~4-6 hours

**Description:**
Support nested folders, not just files in /Desktop.

**Tasks:**
- [ ] Modify FileEntry to support folder type
- [ ] Add folder icon and visual differentiation
- [ ] Double-click folder to "enter" folder
- [ ] Show breadcrumb navigation
- [ ] Back button to parent folder
- [ ] Update Dropbox provider to list folder contents
- [ ] Handle folder physics (larger, different color)

---

#### 2. File Upload to Dropbox ⏳
**Priority:** Low
**Effort:** ~3-4 hours

**Description:**
Allow users to upload files from device to Dropbox.

**Tasks:**
- [ ] Add upload button to UI
- [ ] File picker dialog
- [ ] Upload progress indicator
- [ ] Call Dropbox upload API
- [ ] Refresh file list after upload
- [ ] Handle upload errors
- [ ] File size limits and validation

**Dropbox API:**
- Endpoint: `https://content.dropboxapi.com/2/files/upload`
- Max file size: 150MB (for single upload)

---

#### 3. Collaborative Features ⏳
**Priority:** Low
**Effort:** ~1-2 weeks

**Description:**
Multiple users in same AR space, see each other's cursors/hands.

**Tasks:**
- [ ] WebRTC or WebSocket for real-time sync
- [ ] Shared state for file positions
- [ ] User avatars/cursors
- [ ] Conflict resolution (two users move same file)
- [ ] Room creation and joining
- [ ] User list display

---

#### 4. Thumbnail Generation ⏳
**Priority:** Medium
**Effort:** ~3-4 hours

**Description:**
Generate real thumbnails instead of using generic file type icons.

**Tasks:**
- [ ] Use Dropbox `get_thumbnail_batch` API
- [ ] Cache thumbnails in memory
- [ ] Fallback to generic icon if thumbnail fails
- [ ] Support for images only initially
- [ ] Consider video thumbnails (more complex)

**Dropbox API:**
- Endpoint: `https://content.dropboxapi.com/2/files/get_thumbnail_batch`
- Supports: images only

---

#### 5. Gesture Controls Refinement ⏳
**Priority:** Low
**Effort:** ~2-3 hours

**Description:**
Improve hand gesture recognition for AR mode.

**Tasks:**
- [ ] Pinch gesture for picking up files (currently basic)
- [ ] Two-hand gestures (scale, rotate with two hands)
- [ ] Gesture feedback (visual indicators)
- [ ] Gesture sensitivity settings
- [ ] Custom gesture definitions

---

#### 6. Desktop Camera Controls ⏳
**Priority:** Low
**Effort:** ~1-2 hours

**Description:**
Better camera controls for simulated mode.

**Tasks:**
- [ ] Orbit controls (currently basic)
- [ ] Zoom with mouse wheel (implement properly)
- [ ] Pan with middle mouse button
- [ ] Reset camera button
- [ ] Camera presets (top-down, side view, etc.)
- [ ] Smooth camera transitions

**Files to modify:**
- `src/app/SimulatedMode.tsx` - Add OrbitControls

---

## 📋 Technical Debt

### 1. Type Safety Improvements ⏳
**Priority:** Medium

**Issues:**
- Some `any` types remain in codebase
- Missing type definitions for some props
- FileEntry type could be more specific

**Tasks:**
- [ ] Remove all `any` types
- [ ] Add strict TypeScript config
- [ ] Add prop type validation

---

### 2. Code Organization ⏳
**Priority:** Low

**Issues:**
- Some components are getting large (ARMode.tsx, SimulatedMode.tsx)
- Boundary enforcement logic is duplicated
- Content preview logic could be abstracted

**Tasks:**
- [ ] Extract BoundaryEnforcer to shared utility
- [ ] Split large components into smaller ones
- [ ] Create shared hooks for common logic

---

### 3. Testing ⏳
**Priority:** Medium

**Issues:**
- No unit tests
- No integration tests
- No E2E tests

**Tasks:**
- [ ] Set up Vitest for unit tests
- [ ] Add tests for stores (Zustand)
- [ ] Add tests for utilities (oauth, tokenStorage)
- [ ] Set up Playwright for E2E tests
- [ ] Test OAuth flow
- [ ] Test AR mode initialization

---

## 🐛 Known Issues

### 1. iOS WebXR Support Limited
**Impact:** High for iOS users
**Workaround:** None, waiting for Apple to improve WebXR support

Apple's WebXR implementation is incomplete as of iOS 17.4. Features may not work as expected.

---

### 2. Hand Tracking Requires Newer Devices
**Impact:** Medium
**Workaround:** Falls back to controller/pointer input

Hand tracking requires ARCore Depth API, which is only available on newer Android devices.

---

### 3. Physics Performance with 100+ Files
**Impact:** Medium
**Workaround:** Limit files displayed or optimize boundary enforcement

Rapier physics engine may struggle with 100+ rigid bodies on mobile devices.

---

### 4. Blob URL Memory Management
**Impact:** Low
**Status:** Partially addressed

Blob URLs created for file content should be revoked after use to prevent memory leaks.

**Current handling:**
- ContentObject revokes blob URL on unmount
- May need more aggressive cleanup for many files

---

### 5. Token Refresh Not Implemented
**Impact:** Medium
**Workaround:** User must sign in again after 4 hours

Dropbox tokens expire after 4 hours. App requires re-authentication instead of using refresh tokens.

**Why not implemented:**
- OAuth 2.0 PKCE doesn't support refresh tokens by design
- Would require server-side component to securely store refresh tokens
- Current approach (sessionStorage) is more secure for client-only app

---

## 📊 Project Statistics

**Total Files Created:** 50+
**Total Lines of Code:** ~8,000+
**Commits:** 10+
**Development Time:** ~3-4 weeks (estimated)

**File Breakdown:**
- Components: 20+ files
- Stores: 4 files (appStore, fileStore, contentStore, authStore)
- Utilities: 5 files
- Types: 1 file
- Documentation: 3 files (README, AR_TESTING, TROUBLESHOOTING_AR, PROGRESS)

---

## 🎓 Key Learnings

### 1. WebXR Development
- Canvas `events` prop is for pointer events, NOT for XR store
- XR component connection timing is unpredictable (React 18 concurrent rendering)
- User-triggered actions more reliable than auto-timing
- Always test on real devices, not just emulators
- WebXR requires HTTPS (use ngrok for local testing)

### 2. OAuth Implementation
- PKCE is essential for client-side OAuth
- State parameter prevents CSRF attacks
- sessionStorage better than localStorage for tokens (clears on tab close)
- Never log tokens to console
- 5-minute expiration buffer prevents API call failures

### 3. Physics Engine
- Boundary enforcement is expensive (runs every frame)
- Too many rigid bodies (100+) can cause performance issues
- Collision detection settings matter (collision groups, filters)
- Physics timestep affects simulation accuracy vs performance

### 4. React Three Fiber
- useFrame runs every frame (60fps) - be careful with expensive operations
- Refs are the way to access Three.js objects from React
- Canvas props need to be stable (use useMemo for objects)
- R3F and Rapier work well together but require understanding both

---

## 🚀 Next Steps Recommendations

### Immediate Priority (1-2 weeks)
1. **Test on iOS devices** - Verify AR mode works on Safari 17.4+
2. **Test on Meta Quest** - Verify Quest Browser compatibility
3. **Implement hit testing** - Better AR surface placement
4. **Performance optimization** - Profile and optimize boundary enforcement
5. **Error handling** - Add proper error boundaries and fallbacks

### Medium Priority (2-4 weeks)
1. **Folder support** - Allow navigation into folders
2. **Thumbnail generation** - Use Dropbox API for real thumbnails
3. **File search/filter** - Improve file discovery
4. **Multi-select** - Select multiple files at once
5. **Testing suite** - Add unit and E2E tests

### Future Enhancements (1-3 months)
1. **File upload** - Upload files to Dropbox
2. **Collaborative features** - Multi-user support
3. **Gesture refinement** - Better hand tracking gestures
4. **Desktop camera controls** - Better orbit controls
5. **Additional file providers** - Google Drive, OneDrive support

---

## 📖 Documentation

### Existing Documentation
- **README.md** - Project overview and setup
- **AR_TESTING.md** - Mobile testing guide with ngrok
- **TROUBLESHOOTING_AR.md** - AR debugging guide
- **PROGRESS.md** (this file) - Complete project progress

### Missing Documentation
- Architecture overview diagram
- API documentation
- Component documentation
- Deployment guide
- Contributing guide

---

## 🎯 Project Maturity

**Current State:** MVP Complete ✅

The project has reached MVP (Minimum Viable Product) status with:
- ✅ Working 3D file desktop
- ✅ Physics-based interactions
- ✅ AR mode with WebXR
- ✅ Real file integration (Dropbox)
- ✅ Content previews (images, videos, audio, text)
- ✅ Mode switching (Simulated ↔ AR)
- ✅ OAuth authentication
- ✅ Mobile testing setup

**What's needed for Production:**
- Testing on all target devices
- Error handling and edge cases
- Performance optimization
- Production deployment setup
- User documentation
- Support for empty states

**What's needed for Scale:**
- Additional file providers
- Folder support
- File operations (upload, delete, rename)
- Multi-user support
- Analytics and monitoring

---

## 💡 Ideas for Future

### Integration Ideas
- **Google Drive** - Similar to Dropbox provider
- **OneDrive** - Microsoft cloud integration
- **Local File System API** - Access local files (Chrome only)
- **iCloud** - Apple cloud integration (if API available)

### Feature Ideas
- **Piles** - Group files into piles (like original BumpTop)
- **Walls** - Vertical surfaces for more space
- **Sticky notes** - Add notes in 3D space
- **Web bookmarks** - Show browser bookmarks as 3D objects
- **Photo frame mode** - Display photos in AR as frames on wall
- **Music visualizer** - 3D audio visualization
- **Mini-games** - Simple physics-based games with files

### AR-Specific Ideas
- **Persistence** - Remember desk placement between sessions
- **Multiple desks** - Different desks in different rooms
- **Spatial anchors** - Use ARCore Cloud Anchors for shared spaces
- **Object recognition** - Place desk on detected real desk
- **Occlusion** - Hide virtual objects behind real objects

---

## 📞 Questions for Future

1. **Should we support file editing?** - Edit text files, crop images, etc.
2. **Should we support file sharing?** - Share files with other users
3. **Should we make it a PWA?** - Installable on mobile devices
4. **Should we add analytics?** - Track usage, errors, performance
5. **Should we monetize?** - Premium features, subscriptions
6. **Should we open source?** - Contribute back to community

---

## 🏁 Conclusion

BumpTop WebXR has successfully implemented core functionality with both AR mode and real file integration. The project is at MVP stage and ready for broader testing and refinement.

**Major achievements:**
1. ✅ Fully functional 3D desktop with physics
2. ✅ WebXR AR mode working on mobile
3. ✅ Real file integration with Dropbox OAuth
4. ✅ Content preview system for all file types
5. ✅ Comprehensive documentation

**Next milestone:**
Complete Phase 5 remaining tasks (hit testing, device testing) and begin Phase 7 polish & hardening.

---

*Last updated: 2025-12-23*
*Project started: ~2024-12 (estimated)*
*Current phase: Post-MVP refinement*
