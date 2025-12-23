# BumpTop WebXR - TODO List

**Last Updated:** 2025-12-23

Quick reference for pending tasks. See [PROGRESS.md](./PROGRESS.md) for detailed progress and context.

---

## 🔥 High Priority

### AR Mode - Device Testing
- [ ] Test on iPhone with ARKit (iOS 17.4+ Safari)
- [ ] Test on Meta Quest Browser
- [ ] Test on iPad Pro with LiDAR
- [x] Test on Android phone with ARCore (Chrome) - **Working!**

**Why:** Need to verify cross-platform compatibility before considering AR mode complete.

---

### Error Handling & Edge Cases
- [ ] Handle empty /Desktop folder (show empty state message)
- [ ] Handle Dropbox folder doesn't exist error (clear message + instructions)
- [ ] Add retry mechanism for failed API calls (network errors)
- [ ] Handle network offline state (show offline indicator)
- [ ] Handle large files (>50MB) with warning
- [ ] Add React error boundaries

**Why:** Production-ready app needs graceful error handling.

---

### Performance Optimization
- [ ] Profile physics performance with 100+ files
- [ ] Optimize boundary enforcement (currently runs every 16ms)
- [ ] Add loading states for heavy operations
- [ ] Optimize texture loading

**Why:** Mobile devices may struggle with many files.

---

## 🎯 Medium Priority

### AR Mode - Hit Testing (Surface Placement)
- [ ] Implement WebXR hit testing API
- [ ] Add reticle indicator for placement
- [ ] Allow user to tap to place desk
- [ ] Add "reposition desk" option

**Effort:** ~2-3 hours
**File:** `src/app/ARMode.tsx`, new `src/hooks/useHitTest.ts`

**Why:** Better AR experience with real-world surface detection.

---

### User Experience Improvements
- [ ] Add file search/filter functionality
- [ ] Add file sorting options (name, date, size, type)
- [ ] Add multi-select (shift+click, ctrl+click)
- [ ] Add file count indicator
- [ ] Add tooltips for buttons
- [ ] Add keyboard shortcuts documentation

**Why:** Makes the app more usable with many files.

---

### Thumbnail Generation
- [ ] Use Dropbox `get_thumbnail_batch` API
- [ ] Cache thumbnails in memory
- [ ] Fallback to generic icon if thumbnail fails

**Effort:** ~3-4 hours
**File:** `src/fs/DropboxProvider.ts`

**Why:** Better visual experience than generic file type icons.

---

## 📝 Low Priority

### Folder Support
- [ ] Modify FileEntry type to support folders
- [ ] Add folder icon and visual
- [ ] Double-click to enter folder
- [ ] Breadcrumb navigation
- [ ] Back button to parent folder
- [ ] Update Dropbox provider

**Effort:** ~4-6 hours

---

### File Upload
- [ ] Add upload button to UI
- [ ] File picker dialog
- [ ] Upload progress indicator
- [ ] Call Dropbox upload API
- [ ] Refresh file list after upload

**Effort:** ~3-4 hours

---

### Accessibility
- [ ] Add keyboard navigation
- [ ] Add screen reader support
- [ ] Add high contrast mode
- [ ] Add focus indicators
- [ ] Add ARIA labels

**Effort:** ~2 hours

---

### Desktop Camera Controls
- [ ] Add OrbitControls to SimulatedMode
- [ ] Zoom with mouse wheel
- [ ] Pan with middle mouse button
- [ ] Reset camera button
- [ ] Camera presets

**Effort:** ~1-2 hours

---

### Gesture Controls Refinement
- [ ] Better pinch gesture recognition
- [ ] Two-hand gestures (scale, rotate)
- [ ] Gesture feedback (visual indicators)
- [ ] Gesture sensitivity settings

**Effort:** ~2-3 hours

---

## 🧹 Technical Debt

### Type Safety
- [ ] Remove all `any` types
- [ ] Add strict TypeScript config
- [ ] Add prop type validation

---

### Code Organization
- [ ] Extract BoundaryEnforcer to shared utility (currently duplicated)
- [ ] Split large components (ARMode.tsx, SimulatedMode.tsx)
- [ ] Create shared hooks for common logic

---

### Testing
- [ ] Set up Vitest for unit tests
- [ ] Add tests for stores (Zustand)
- [ ] Add tests for utilities (oauth, tokenStorage)
- [ ] Set up Playwright for E2E tests
- [ ] Test OAuth flow
- [ ] Test AR mode initialization

---

## 🐛 Known Issues

### 1. Token Refresh Not Implemented
**Impact:** Medium
**Workaround:** User must sign in again after 4 hours

Dropbox tokens expire after 4 hours. Would require server-side component to implement refresh tokens securely.

---

### 2. Blob URL Memory Leaks
**Impact:** Low
**Status:** Partially addressed

Blob URLs should be revoked aggressively with many files. Currently only revoked on unmount.

---

### 3. iOS WebXR Limited Support
**Impact:** High for iOS users
**Workaround:** None - waiting for Apple

Apple's WebXR implementation incomplete as of iOS 17.4.

---

### 4. Physics Performance with 100+ Files
**Impact:** Medium
**Workaround:** Limit files or optimize

May need object pooling or LOD system for many files.

---

## 💡 Future Ideas (Backlog)

### Integration Ideas
- Google Drive provider
- OneDrive provider
- Local File System API (Chrome only)
- iCloud (if API available)

### Feature Ideas
- Piles (group files like original BumpTop)
- Walls (vertical surfaces)
- Sticky notes in 3D space
- Web bookmarks as 3D objects
- Photo frame mode in AR
- Music visualizer
- Mini-games with physics

### AR-Specific Ideas
- Persistent desk placement (remember position)
- Multiple desks in different rooms
- Spatial anchors (ARCore Cloud Anchors)
- Object recognition (place on real desk)
- Occlusion (hide behind real objects)

---

## 📊 Progress Summary

**Phases Completed:**
- ✅ Phase 1: Foundation
- ✅ Phase 2: File System Abstraction
- ✅ Phase 3: File Objects in 3D Space
- ✅ Phase 4: Content Preview System
- ✅ Phase 5: AR Mode Implementation (mostly)
- ✅ Phase 6: Dropbox Integration

**Current Phase:**
- 🚧 Phase 5: AR Mode - Remaining tasks (hit testing, device testing)
- 🚧 Phase 7: Polish & Hardening

**MVP Status:** ✅ Complete
**Production Ready:** 🚧 Needs testing and error handling
**Scale Ready:** ❌ Needs additional features

---

## 🎯 Suggested Next Steps

1. **This Week:**
   - [ ] Test on iOS device (if available)
   - [ ] Test on Meta Quest (if available)
   - [ ] Add error handling for empty folder
   - [ ] Add error boundaries

2. **Next Week:**
   - [ ] Implement hit testing for AR
   - [ ] Add loading states
   - [ ] Profile and optimize performance
   - [ ] Add file search/filter

3. **Next Month:**
   - [ ] Folder support
   - [ ] Thumbnail generation
   - [ ] File upload
   - [ ] Testing suite

---

*See [PROGRESS.md](./PROGRESS.md) for detailed context and explanations.*
