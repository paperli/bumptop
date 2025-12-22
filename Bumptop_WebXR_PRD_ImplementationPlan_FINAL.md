# BumpTop WebXR Desktop — PRD + Implementation Plan

**Product**: BumpTop (web XR/AR “virtual desktop” for files)  
**Doc owner**: Product/Eng  
**Last updated**: December 22, 2025  
**Status**: ✅ Finalized for vibe-coding (based on your answers)

---

## 0. Decision log (locked for MVP)

These are the constraints we will treat as **requirements** unless you explicitly change them later:

1. **Cloud provider (v1)**: **Dropbox** ✅  
2. **Permissions (v1)**: **Read-only** ✅ (browse + preview; no rename/move/delete/upload)  
3. **Folder navigation (MVP)**: **No** ✅  
   - We will read from a **single fixed folder** (e.g., “Desktop”) and design the provider layer so we can later let users choose a folder / browse folders.
4. **Content object placement**: Spawn **near the file object**, but always **inside the desktop boundary** and **movable** ✅  
5. **Layout/persistence**:
   - **Joyful 3D interactions are required** (drag/throw/scale). ✅  
   - **Content object internal layout can be fixed** for MVP. ✅  
   - **Future-ready**: later we can adapt content layout based on content scale + user distance.  
   - **Transform persistence across sessions is NOT required for MVP** (we’ll keep it easy to add).
6. **Simulated mode**: **User-facing** ✅  
   - On non‑WebXR devices/browsers (iPhone/Mac Safari/Chrome), the app should still work in a “simulated desktop” mode.

---

## 1. Executive summary

BumpTop is a **WebXR-first** AR/XR web app that renders a user’s files as **interactive 3D objects** on a virtual desktop aligned to their real-world desk. Users can **drag, throw, and scale** file objects and **open** them to spawn a 3D “content object” for preview (images/videos/audio/text).

We start with:
- **v0 (MVP / POC)**: Mock file system + core 3D/physics interactions + AR mode (WebXR-enabled Android) + **user-facing simulated mode** (non‑WebXR browsers).
- **v1**: Dropbox integration (read-only), reading a single fixed folder path, showing real files as 3D objects with preview.

---

## 2. Target users & use cases

### 2.1 Target users
- Early adopters with **XR headsets / AR phones** who want a playful way to browse files.
- Developers/designers who want to test MR interactions frequently via **simulated mode**.

### 2.2 Primary use cases (MVP)
- “I want to **see files floating on my desk** and playfully organize them.”
- “I want to **tap a file** and preview its contents without leaving the MR experience.”
- “I’m on a device without WebXR; I still want to **use the app in a simulated 3D desktop**.”

---

## 3. Goals & success metrics

### 3.1 MVP goals (v0)
- **Delightful interactions**: drag, throw, bounce, scale feel natural and stable.
- **WebXR AR mode** on WebXR-enabled Android phone (immersive-ar).
- **Simulated mode** works in standard browsers (including iOS Safari).
- **Mock filesystem** that supports: images, videos, audio, text.
- A content preview system: open file → spawn content object near file, movable, constrained within boundary.

### 3.2 v1 goals
- **Dropbox sign-in** (OAuth) and **read-only** file listing from a fixed folder.
- Preview of supported file types fetched from Dropbox.
- Basic performance + reliability polish.

### 3.3 Success metrics (practical + measurable)
- **Stability**: No “lost objects” (objects leaving boundary permanently) in a 5-minute session.
- **Interaction quality**: Drag/throw/scale feels responsive (no noticeable lag > ~100ms input-to-response).
- **Performance**: Smooth interaction on target Android device (goal ~60fps, acceptable ~45fps in heavy scenes).
- **Reliability**: Open/close preview works consistently; errors are surfaced with clear UI.
- **Cross-browser**: Sim mode runs on iOS Safari + desktop Chrome/Safari.

---

## 4. Scope

### 4.1 In scope (v0 / MVP)
- Two run modes:
  - **AR Mode**: WebXR `immersive-ar` (Android Chrome/ARCore).
  - **Simulated Mode**: standard WebGL 3D scene with desktop plane + touch/mouse controls.
- Desktop plane placement (AR) + adjustable desk boundary.
- Physics-based file objects:
  - Collide with desk boundary and bounce.
  - Interact via tap/select, drag, throw, scale.
- Content object:
  - Spawn near file, constrained to boundary, movable.
  - Render: image/video/audio/text.
- Mock filesystem with seed data + thumbnails.

### 4.2 In scope (v1)
- Dropbox provider (read-only):
  - Auth (OAuth 2.0 + PKCE).
  - List files in **one fixed Dropbox folder path** (configurable).
  - Fetch file contents for preview (image/video/audio/text).
- Minimal caching (memory + optional IndexedDB for thumbnails / small text).

### 4.3 Explicitly out of scope (MVP + v1)
- Folder browsing/navigation UI (no nested folders browsing in MVP)
- Write operations (upload, rename, move, delete)
- Local Mac/PC agent or OS-level “desktop mirroring”
- Multi-cloud beyond Dropbox
- Multi-user shared spaces, real-time collaboration
- Hand tracking/controllers (we can architect for it, but not required)
- Advanced “preview-on-scale” or “preview-when-close-to-eyes” interactions (future exploration)

---

## 5. UX flows

### 5.1 Entry & mode selection
**Auto-detect** capabilities:
- If WebXR `immersive-ar` is supported: show **“Enter AR”** button.
- Otherwise: land directly in **Simulated Mode** (with a clear “Simulated Mode” label).

### 5.2 v0 content flow (mock files)
1. User sees desktop plane + boundary.
2. Mock file objects spawn on the plane.
3. User drags/throws/scales file objects.
4. User double-taps (or single-taps if safe) a file → content object spawns near it.
5. User drags content object within boundary; closes it when done.

### 5.3 v1 Dropbox flow
1. User enters app (AR or Sim).
2. If not authenticated: “Connect Dropbox” CTA.
3. Sign in (OAuth).
4. App loads files from configured folder path.
5. User interacts with file objects and opens previews.

---

## 6. Functional requirements (with acceptance criteria)

### 6.1 Desktop boundary & placement

**Requirement**
- Treat the “desktop boundary” as the virtual interaction boundary.
- Objects should **bounce off** boundary edges like invisible walls.
- Boundary must feel stable:
  - In AR: anchored to placed plane.
  - In Sim: stable in world coordinates.

**Acceptance criteria**
- A thrown object hitting boundary edges rebounds predictably (restitution configurable).
- Objects do not tunnel through the boundary at typical throw speeds (use CCD or smaller timesteps).
- Boundary size defaults to “reasonable desk” (e.g., ~1.2m x 0.7m), adjustable in settings.

---

### 6.2 File objects (3D representations)

**Requirement**
- Each file becomes a 3D object on the desk plane:
  - Thumbnail or type icon
  - Filename label
  - Simple collider (box/cylinder)
- Supported types (MVP):
  - Images: `.jpg .png .webp`
  - Videos: `.mp4 .webm` (best-effort; browser dependent)
  - Audio: `.mp3 .wav .m4a` (browser dependent)
  - Text: `.txt .md .json` (render as plain text in MVP)

**Acceptance criteria**
- At least 20 objects can be spawned and manipulated smoothly on target Android device.
- Labels remain readable at typical distance (30–70cm in AR). Provide “hover/selected” enlarged label if needed.

---

### 6.3 Interactions (core “joy”)

We want **playful physics** that still feels controllable.

#### 6.3.1 Select
- Single tap selects a file (highlight).

#### 6.3.2 Drag
- Press/hold and move drags object along the desk plane (kinematic during drag).

#### 6.3.3 Throw
- Releasing after a drag applies velocity/impulse based on pointer velocity.

#### 6.3.4 Scale
- Pinch-to-scale on touch devices (two pointers).
- Mouse/trackpad fallback in sim mode: e.g., scroll-wheel scale when selected (or UI slider).

#### 6.3.5 Open content
- Default gesture: **double tap** to open content (safer to avoid drag conflicts).
- Optional: single tap to open only if we can confidently detect “tap vs drag” (see gesture rules below).

**Gesture conflict rules**
- If pointer moves beyond a small threshold during press, treat as drag (not tap).
- If two pointers present, treat as scale (not drag/tap).
- Only treat as “tap” if down→up occurs within a short window and movement is below threshold.
- Double tap opens content only if both taps are on the same object within interval.

**Acceptance criteria**
- Dragging feels continuous and stable (no “teleport” jitter).
- Throwing applies believable momentum and respects boundary bounces.
- Scaling does not cause unstable physics explosions (cap min/max scale; recompute collider or use discrete scale steps).
- Opening content works reliably without accidental triggers while dragging.

---

### 6.4 Content object (preview)

**Requirement**
- Opening a file spawns a **content object**:
  - Spawns **near the originating file**.
  - Constrained to remain **inside desktop boundary**.
  - **Movable** (drag within boundary).
  - Supports scale (pinch) to resize.
- Content rendering by type:
  - Image: textured plane/panel with “fit” scaling
  - Video: video texture panel + play/pause UI
  - Audio: title + play/pause + progress indicator (optional waveform)
  - Text: scrollable/paged panel (MVP can be simple paging)

**Interaction note**
- Content object should not “explode” the file pile. Prefer **non-physics (UI-like)** movement:
  - Option A (recommended MVP): content object is kinematic (no collisions), but constrained and draggable.
  - Option B: lightweight physics collider with low mass and collision filters (only collides with boundary, not files).

**Acceptance criteria**
- Content spawns without leaving boundary; if spawn would exceed boundary, clamp position inward.
- User can reposition content object; it stays readable.
- Close is always available and responsive.

---

### 6.5 File system manager

#### 6.5.1 Provider abstraction (required)
We must keep file sources swappable.

```ts
export type FileKind = "image" | "video" | "audio" | "text" | "unknown";

export interface FileEntry {
  id: string;               // stable per provider
  name: string;
  kind: FileKind;
  sizeBytes?: number;
  modifiedAt?: string;      // ISO
  mimeType?: string;
  path?: string;            // provider path (v1 Dropbox)
  thumbnailUrl?: string;    // optional (may be blob: URL)
}

export interface FileContentHandle {
  // Either a blob URL (recommended), or a remote URL with proper CORS.
  url: string;
  mimeType?: string;
}

export interface FileSystemProvider {
  id: string;
  label: string;

  isAuthenticated(): boolean;
  signIn(): Promise<void>;
  signOut(): Promise<void>;

  // MVP: list fixed folder only
  listFixedFolder(): Promise<FileEntry[]>;

  // Fetch content for preview
  getFileContent(entry: FileEntry): Promise<FileContentHandle>;

  // Future (not used in MVP): listFolder(path), chooseFolder(), etc.
}
```

#### 6.5.2 v0 Mock provider
- Returns a curated list of sample files with local assets (bundled in app).
- Supports all MVP file types for testing.

#### 6.5.3 v1 Dropbox provider (read-only)
- Auth: OAuth 2.0 + PKCE.
- Scope: minimal read-only scopes (Dropbox’s current scope model; request only what we need).
- Fixed folder path:
  - Default: `"/Desktop"` (configurable)
  - If the path doesn’t exist: show a friendly error + instructions (e.g., “Create a folder named Desktop or change path in settings”).

**Content fetching approach (recommended)**
- For WebGL textures and media reliability, prefer fetching as **Blob** via Dropbox API, then:
  - `URL.createObjectURL(blob)` for image/video/audio
  - Text decoded via `blob.text()`
- This avoids many CORS + cross-origin texture pitfalls.

**Acceptance criteria**
- User can connect Dropbox and see file objects representing files in the fixed folder.
- Opening a supported file reliably previews content.
- Unsupported types show a graceful “Unsupported file type” content object.

---

### 6.6 Simulated mode (user-facing)

**Requirement**
- Works without WebXR.
- Provides a “desktop” plane and boundary in a normal browser 3D scene.
- Input mapping:
  - Touch devices (iOS): tap, drag, pinch to scale.
  - Desktop: mouse drag + scroll scale (or UI slider).
- Provide UI hint: “Simulated Mode (WebXR not supported here)”.

**Acceptance criteria**
- All MVP interactions work in simulated mode.
- Preview rendering works in simulated mode.
- No WebXR APIs required for simulated mode to load.

---

### 6.7 Settings (minimal but practical)

**MVP settings**
- Desktop boundary size (width/depth)
- Physics tuning (restitution, friction, damping) — developer-facing panel is OK in MVP
- Content panel default size
- (v1) Dropbox fixed folder path (dev setting or simple text input)

**Acceptance criteria**
- Settings changes apply without reload (where feasible).
- Safe bounds on values to prevent physics instabilities.

---

## 7. Non-functional requirements

### 7.1 Performance
- Avoid heavy shaders; keep geometry low-poly.
- Thumbnails should be small; limit concurrent video decoding.
- Use requestAnimationFrame + fixed physics timestep.
- Cap active objects (e.g., show first N files, or paginate later).

### 7.2 Compatibility
- AR Mode: Android Chrome + ARCore (WebXR `immersive-ar`).
- Sim mode: iOS Safari, desktop Chrome/Safari/Firefox (best-effort).

### 7.3 Security & privacy
- Dropbox OAuth tokens must not be logged.
- Store tokens minimally; prefer in-memory.
- If persistent login is desired, store refresh token carefully (IndexedDB) and document risks.
- No file content uploaded to our servers (unless later architecture changes).

---

## 8. Technical architecture

### 8.1 Suggested stack
- **Frontend**: React + TypeScript + Vite
- **3D**: React Three Fiber (R3F) + three.js
- **XR**: `@react-three/xr` (or equivalent)
- **Physics**: `@react-three/cannon` (cannon-es) or Rapier (either works; choose one and standardize)
- **State**: Zustand (or similar lightweight store)
- **Testing**: Vitest + Playwright (sim mode), plus manual device testing for AR

### 8.2 Core modules
- `scene/`  
  - `DeskBoundary` (plane + boundary colliders)
  - `FileObject` (render + collider + label)
  - `ContentObject` (render + movable constraints)
- `input/`
  - `GestureInterpreter` (tap/double-tap/drag/pinch state machine)
  - `PointerVelocityTracker`
- `fs/`
  - `FileSystemProvider` interface
  - `MockProvider`
  - `DropboxProvider`
- `app/`
  - Mode detection (AR vs Sim)
  - UI shell (connect Dropbox, settings panel, errors)

### 8.3 Gesture interpreter (recommended MVP approach)
A small state machine:
- `idle`
- `pressing` (tap candidate)
- `dragging`
- `pinching`
- `released` (detect double tap window)

This reduces accidental opens.

### 8.4 Boundary constraints
- Physics boundary walls for file objects.
- Additional **soft clamp** in logic for content object:
  - `contentPosition = clampToBoundary(contentPosition, margin)`

---

## 9. Implementation plan (vibe-coding friendly)

> Note: No time estimates. This is an ordered checklist you can implement incrementally.

### Milestone A — App shell & mode detection
- [ ] Vite + React + TS project structure (or align with existing foundation repo)
- [ ] Capability detection:
  - [ ] `navigator.xr` existence
  - [ ] `isSessionSupported('immersive-ar')`
- [ ] UI:
  - [ ] “Enter AR” button when supported
  - [ ] Auto fall back to Simulated Mode otherwise
- [ ] Basic settings panel (dev-friendly)

**Exit criteria**
- App runs on desktop + iOS Safari in Sim mode and shows a desk plane.

---

### Milestone B — Desk boundary + physics foundation
- [ ] Desk plane mesh (visual)
- [ ] Boundary walls as static colliders
- [ ] Physics timestep stabilization (fixed step, clamped dt)
- [ ] Debug toggle to show boundary extents

**Exit criteria**
- A test cube can be thrown and bounces within boundary without tunneling.

---

### Milestone C — File objects + joyful interactions (MVP core)
- [ ] `MockProvider` returns 20–50 sample entries
- [ ] Spawn file objects with:
  - [ ] thumbnail/icon
  - [ ] label
  - [ ] collider + rigid body
- [ ] Implement interactions via gesture interpreter:
  - [ ] select
  - [ ] drag (kinematic)
  - [ ] throw (impulse)
  - [ ] scale (pinch / wheel)
- [ ] Boundary bounce tuning (restitution, friction, damping)

**Exit criteria**
- File objects feel fun and controllable in Sim mode.

---

### Milestone D — Content object previews (MVP)
- [ ] Double tap detection on selected file object
- [ ] Spawn content object near file:
  - [ ] clamp to boundary
  - [ ] movable drag inside boundary
  - [ ] scale
- [ ] Render preview types from mock assets:
  - [ ] image
  - [ ] video
  - [ ] audio
  - [ ] text
- [ ] Close control + cleanup (dispose textures, stop video/audio)

**Exit criteria**
- All supported file types preview correctly using mocked content.

---

### Milestone E — AR Mode (WebXR) integration
- [ ] AR session start/stop
- [ ] Desk placement flow:
  - [ ] place desk plane on detected surface (or allow manual placement)
  - [ ] lock boundary to placed plane
- [ ] Ensure gesture mapping works in AR (screen touch controls)
- [ ] Verify scale feels “realistic” (meters)

**Exit criteria**
- On Android WebXR device, the desk appears stable and interactions work.

---

### Milestone F — Dropbox v1 (read-only, fixed folder)
- [ ] Implement `DropboxProvider`:
  - [ ] OAuth 2.0 + PKCE flow
  - [ ] Store access token securely (memory-first)
  - [ ] `listFixedFolder()` reads configured path
  - [ ] `getFileContent()` fetches file as blob
- [ ] Basic errors:
  - [ ] not signed in
  - [ ] folder missing
  - [ ] file too large (optional size cap)
  - [ ] unsupported type
- [ ] Optional caching:
  - [ ] thumbnails / small blobs in memory
  - [ ] optional IndexedDB cache for thumbnails

**Exit criteria**
- Real Dropbox files appear and open in preview reliably.

---

### Milestone G — Polish & hardening
- [ ] Performance:
  - [ ] cap max objects
  - [ ] lazy-load thumbnails/content
  - [ ] dispose textures/videos properly
- [ ] Usability:
  - [ ] clear mode label
  - [ ] onboarding hint overlays
- [ ] Error UX:
  - [ ] toasts/panels with actionable messages
- [ ] Telemetry hooks (optional, privacy-safe)

**Exit criteria**
- App feels stable for repeated demos and iteration.

---

## 10. Testing plan

### 10.1 Device/browser matrix (minimum)
**AR Mode**
- Android Chrome (WebXR + ARCore)

**Simulated Mode**
- iPhone Safari (no WebXR)
- Mac Safari + Chrome
- Windows Chrome (optional)

### 10.2 Unit tests (Vitest)
- Gesture interpreter:
  - tap vs drag vs pinch
  - double tap window
- Boundary math:
  - clampToBoundary correctness
- Provider abstraction:
  - Mock provider returns stable IDs/types
  - Dropbox provider path handling and type inference

### 10.3 Integration tests (Playwright) — simulated mode
- Load app → confirm Sim mode UI
- Spawn files → drag/throw one → verify transform changes
- Open content → verify content object appears → close

> Note: WebXR AR mode is usually not automatable in standard CI; treat AR as manual testing.

### 10.4 Manual test scripts (repeatable)
- “Physics torture”: throw objects repeatedly into corners, verify no tunneling.
- “Gesture torture”: rapid taps vs drags, ensure no accidental opens.
- “Media stress”: open/close multiple videos; verify memory doesn’t explode.
- “Dropbox sign-in”: sign in/out; handle expired tokens; missing folder error.

### 10.5 Performance checks
- Use Chrome Performance panel:
  - confirm stable frame times during dragging
  - check memory allocations after repeated open/close
- On Android:
  - verify thermal throttling doesn’t break interactions in short sessions

### 10.6 Security/privacy checks
- Ensure no tokens in console logs or error reporting.
- Confirm scopes are minimal.
- Confirm content is not uploaded anywhere.

---

## 11. Things to be cautious about (high-risk areas)

### 11.1 WebXR reality
- WebXR AR support is fragmented and requires:
  - HTTPS / secure context
  - ARCore support on Android
- iOS Safari: no WebXR (hence Sim mode must remain first-class).

### 11.2 Gesture conflicts on touch screens
- Tap/drag/pinch are easy to mis-detect.
- Use a state machine + thresholds; default to double tap for open.

### 11.3 Physics stability
- Large dt spikes can cause tunneling/instability.
- Use fixed timesteps + clamp dt; consider CCD if available.
- Avoid scaling colliders continuously; consider discrete scale steps or rebuild collider safely.

### 11.4 Media in WebGL
- Video textures can be heavy and buggy across browsers.
- Always provide fallback UI if a format fails to play.
- Dispose textures and stop playback when closing previews.

### 11.5 Dropbox API details
- Token storage is security-sensitive.
- Blob fetching large files is expensive; consider size caps and progressive enhancements later.

### 11.6 “Realistic” AR scale
- Use meters consistently.
- Keep file objects at “real” sizes (e.g., 6–10cm) so they don’t feel like toy dots or giant slabs.

---

## 12. Future roadmap (post v1)

- Folder selection UI (choose which Dropbox folder to show)
- Folder navigation (folders as 3D objects)
- Preview-on-scale / preview-when-close-to-eyes experiments
- Layout persistence (save object transforms per folder)
- Multi-cloud providers (Drive/OneDrive/iCloud via feasible APIs)
- Local Mac/PC connector agent for true desktop mirroring scenario
- Hand tracking / controller interactions for headsets

---

## Appendix A — Recommended defaults

- Desktop boundary: **1.2m x 0.7m**
- File object size: **0.08m x 0.08m x 0.02m**
- Content object size: **0.45m x 0.30m x 0.02m**
- Physics:
  - restitution: 0.4–0.7 (tune for fun)
  - linear damping: 0.2–0.5
  - angular damping: 0.3–0.6


---

## Appendix B — Gesture interpreter (tap/drag/pinch) spec

This is here so implementation doesn’t devolve into “random if-statements” that are hard to tune.

### B.1 Suggested constants (tune per device)
- `TAP_MAX_MS = 220`
- `DOUBLE_TAP_MAX_MS = 320`
- `DRAG_START_PX = 8` (movement threshold before we consider it a drag)
- `PINCH_START_PX = 6` (distance delta threshold before scaling begins)
- `MAX_SCALE = 3.0`
- `MIN_SCALE = 0.5`

### B.2 State machine (high level)
- **idle**
  - on pointerDown → `pressing`
- **pressing**
  - if 2 pointers → `pinching`
  - if move > DRAG_START_PX → `dragging`
  - on pointerUp within TAP_MAX_MS & move < DRAG_START_PX → `tap`
- **dragging**
  - update object position on plane intersection
  - track velocity (for throw)
  - on pointerUp → apply impulse → `idle`
- **pinching**
  - update scale based on distance ratio
  - on pointers reduce to 1 → `idle`

### B.3 Double tap to open (recommended)
- Maintain `lastTapTime`, `lastTapTargetId`.
- If a tap occurs within `DOUBLE_TAP_MAX_MS` on same target → open content.
- Otherwise treat as select-only.

This makes “open” far less likely to happen while the user is just moving objects.

---

## Appendix C — Dropbox v1 implementation notes (read-only)

### C.1 Configuration (recommended)
Expose these as env vars (Vite-style) + optional settings UI:
- `VITE_DROPBOX_APP_KEY`
- `VITE_DROPBOX_REDIRECT_URI`
- `VITE_DROPBOX_ROOT_PATH` (default `"/Desktop"`)

### C.2 OAuth 2.0 (PKCE) outline
1. Generate `code_verifier` (random high-entropy string).
2. Compute `code_challenge = base64url(SHA256(code_verifier))`.
3. Redirect to Dropbox authorize endpoint with:
   - `response_type=code`
   - `client_id=...`
   - `redirect_uri=...`
   - `code_challenge=...`
   - `code_challenge_method=S256`
4. On redirect back, exchange `code` + `code_verifier` for tokens.
5. Store access token **in memory first**.

> If you need persistent sessions later, store refresh token in IndexedDB with clear user-facing explanation.

### C.3 API calls (minimal set)
- `files/list_folder` with `path = VITE_DROPBOX_ROOT_PATH`
  - Use pagination via `files/list_folder/continue` if needed.
- Content fetch (recommended MVP):
  - `files/download` to get bytes → Blob → `URL.createObjectURL(blob)`
  - This works consistently for WebGL textures and avoids many remote CORS issues.

### C.4 Type inference
- Prefer Dropbox file metadata if it includes MIME (may not always).
- Otherwise infer by extension:
  - Image: jpg/png/webp
  - Video: mp4/webm
  - Audio: mp3/wav/m4a
  - Text: txt/md/json
- Everything else: `unknown`

### C.5 Guardrails
- Size caps (optional but recommended):
  - if `sizeBytes > MAX_PREVIEW_BYTES`, show “Too large to preview (v1)” and do not download.
- Rate limiting:
  - backoff and surface “Try again” messaging.

---

## Appendix D — Resource cleanup checklist (avoid memory leaks)

When closing a preview or removing an object:
- Revoke any `blob:` URLs: `URL.revokeObjectURL(url)`
- Dispose textures/materials/geometries:
  - `texture.dispose()`, `material.dispose()`, `geometry.dispose()`
- Video:
  - pause
  - remove `src`
  - `video.load()` to release resource
- Audio:
  - stop playback
  - disconnect nodes (if using WebAudio)

This is especially important for repeated demos where memory climbs invisibly.

---

## Appendix E — Practical build & test notes

### E.1 Local development
- WebXR requires **secure context** in many setups.
- Prefer:
  - `https://localhost` dev server (mkcert) OR
  - a tunneling solution to serve HTTPS to a phone on the same network.

### E.2 Android AR testing
- Ensure ARCore is installed/available.
- Confirm `isSessionSupported('immersive-ar')` returns true.
- If not supported, the app must still be usable via Sim mode.

### E.3 iOS testing
- iOS Safari: Sim mode only.
- Ensure all controls are reachable with touch + pinch.

