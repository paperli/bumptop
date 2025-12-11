# BumpTop Mixed Reality Desktop - Project Overview

## Vision

A pass-through mixed reality application that recognizes a user's desk and transforms it into a 3D virtual desktop, displaying personal files as interactive 3D objects. Users can manipulate these objects naturally—dragging, throwing, and scaling them—as if they were physical objects in the real world.

## Current Status: MVP Foundation Complete ✅

The project has a working foundation with:
- AR scene with desk placement
- 3D file objects with physics
- Basic drag and throw interactions
- Mock file system with 7 sample files

**See [CURRENT_STATE.md](./CURRENT_STATE.md) for detailed status.**

## Project Structure

```
bumptop/
├── index.html              # Entry HTML
├── index.tsx               # Main app (needs refactoring)
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── vite.config.ts          # Build config
├── metadata.json           # App metadata
├── README.md               # Setup instructions
├── MILESTONES.md           # Detailed milestone plan ⭐
├── CURRENT_STATE.md        # Current progress assessment ⭐
└── PROJECT_OVERVIEW.md     # This file ⭐
```

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **3D Graphics**: Three.js + React Three Fiber
- **AR/XR**: WebXR (@react-three/xr)
- **Physics**: @react-three/cannon
- **Build**: Vite
- **Deployment**: Web-based (runs in browser)

## Key Features (Planned)

### ✅ Implemented
- AR desk placement (hit-test)
- 3D file objects with physics
- Basic drag interaction
- Desktop boundaries
- Multiple file type visuals

### 🚧 In Progress / Planned
- Two-hand pinch-to-scale
- File content viewing (images, text, video, audio)
- 3D model loading and animation
- Real file system integration
- Cloud file system support
- Desktop recognition (ML-based)
- MR headset support

## Milestone Roadmap

**See [MILESTONES.md](./MILESTONES.md) for complete details.**

### Phase 1: Foundation (Milestones 1-2)
- File system architecture
- Enhanced interactions (two-hand gestures)

### Phase 2: Content (Milestones 3-4)
- File content viewing
- 3D model support

### Phase 3: Real Data (Milestones 5-6)
- Desktop recognition
- Real file system integration

### Phase 4: Polish (Milestones 7-9)
- Performance optimization
- Extended file types
- MR headset support

### Phase 5: Launch (Milestone 10)
- Testing & documentation
- Production deployment

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment (if needed)
# Create .env.local with GEMINI_API_KEY (if using Gemini features)

# Run development server
npm run dev

# Build for production
npm run build
```

## Development Priorities

### Immediate Next Steps
1. **Refactor code structure** - Break monolithic `index.tsx` into modules
2. **File system architecture** - Create pluggable file system provider
3. **Two-hand gestures** - Implement pinch-to-scale interaction

### Short Term (Next 2-4 weeks)
- File content viewing (images, text)
- Enhanced interactions
- Basic file system integration

### Medium Term (1-3 months)
- 3D model support
- Cloud file system providers
- Desktop recognition

### Long Term (3-6 months)
- MR headset support
- Extended file types
- Production deployment

## Key Design Decisions

1. **Web-Based**: Runs in browser for maximum compatibility
2. **Progressive Enhancement**: Works on mobile AR, expands to MR headsets
3. **Pluggable Architecture**: File system providers can be swapped
4. **Physics-Based**: Realistic interactions using physics engine
5. **Type-Safe**: Full TypeScript for reliability

## Success Metrics

- **Performance**: 60fps on target devices
- **Compatibility**: 3+ browsers, 2+ MR platforms
- **File Support**: 10+ file types
- **UX**: Intuitive, <5min learning curve
- **Reliability**: <1% error rate

## Resources

- **Inspiration**: Original BumpTop desktop app
- **WebXR Spec**: https://www.w3.org/TR/webxr/
- **Three.js Docs**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber

## Questions or Issues?

Refer to:
- [CURRENT_STATE.md](./CURRENT_STATE.md) - What's working and what's not
- [MILESTONES.md](./MILESTONES.md) - Detailed development plan

---

**Last Updated**: Based on code review of current codebase
**Version**: 0.0.0 (MVP Foundation)


