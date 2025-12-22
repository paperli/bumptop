# AR Mode Troubleshooting Guide

This document captures critical findings and lessons learned during AR mode implementation.

## Critical Bug: Canvas `events` Prop

### The Problem

When implementing AR mode, the application would fail with this error:

```
Failed to enter AR: not connected to three.js. You either might be missing
the <XR> component or the canvas is not yet loaded?
```

This occurred even though:
- The `<XR>` component was present in the Canvas
- The Canvas was mounted and rendering
- We tried multiple timing strategies (delays, retries, etc.)

### The Root Cause

**Line 183 in ARMode.tsx had this INCORRECT code:**

```typescript
<Canvas
  events={store as any}  // ❌ WRONG - This breaks XR!
>
  <XR store={store}>
    {/* scene content */}
  </XR>
</Canvas>
```

### Why This Broke Everything

The `events` prop in React Three Fiber (R3F) is designed for configuring **pointer and touch event handling**, NOT for passing the XR store.

What happens internally:
1. The `<XR>` component uses `useThree()` hook to access the R3F context
2. It calls `store.setWebXRManager(webXRManager)` to connect the WebXR manager to the store
3. When `events` prop is set incorrectly, it interferes with R3F's internal state
4. This prevents the XR component from properly accessing the Three.js scene
5. Result: `store.enterAR()` fails because the store never got connected

### The Solution

**Simply remove the `events` prop:**

```typescript
<Canvas
  style={{ width: '100vw', height: '100vh' }}
  gl={{ alpha: true }}  // Transparent background for AR
>
  <XR store={store}>
    {/* scene content */}
  </XR>
</Canvas>
```

The XR component handles the store connection internally. You just need to:
1. Create the store: `const xrStore = useMemo(() => createXRStore(), [])`
2. Pass it to the XR component: `<XR store={xrStore}>`
3. Call `xrStore.enterAR()` when ready

## Race Condition: Timing Issues

### The Problem

Even with the correct Canvas setup, calling `store.enterAR()` immediately after mounting the Canvas can fail because:
- React 18 uses concurrent rendering (async, non-deterministic timing)
- The XR component needs time to initialize and connect the store
- Mobile devices are especially unpredictable

### Failed Approaches

We tried many timing-based solutions that all failed:

1. **Auto-trigger with 100ms setTimeout** - Too fast
2. **Auto-trigger with 500ms + requestAnimationFrame** - Still unreliable
3. **Subscribe to store state changes** - State wasn't a reliable indicator
4. **Increase wait to 2-3 seconds** - STILL failed on device
5. **Retry with exponential backoff** - Fundamental timing approach was flawed

### The Working Solution: Two-Step Process

Instead of guessing the right timing, we implemented a deliberate two-step process:

**Step 1: User clicks "Enter AR"**
- Switches mode to 'ar'
- Mounts ARMode component with Canvas and XR

**Step 2: Show StartARButton overlay**
- Waits 1 second after Canvas mount
- Shows "Ready for AR" overlay with "Start AR Session" button
- User clicks button → Calls `store.enterAR()`

**Why This Works:**
- Gives Canvas/XR guaranteed time to initialize
- User control is better UX than mysterious auto-delays
- Clear feedback at each stage
- Retry mechanism available if something fails

### Implementation

```typescript
// ARMode.tsx - Just mount the Canvas
export function ARMode({ store }: ARModeProps) {
  return (
    <Canvas gl={{ alpha: true }}>
      <XR store={store}>
        {/* scene content */}
      </XR>
    </Canvas>
  )
}

// App.tsx - Show overlay when in AR mode but session not active
{mode === 'ar' && !isARSessionActive && <StartARButton store={xrStore} />}

// StartARButton.tsx - Wait 1 second, then enable button
useEffect(() => {
  const timer = setTimeout(() => {
    setIsReady(true)
  }, 1000)
  return () => clearTimeout(timer)
}, [store])
```

## Common Errors and Solutions

### "Failed to enter AR: not connected to three.js"

**Cause**: Canvas `events` prop interfering with XR component
**Solution**: Remove the `events` prop from Canvas

### "WebXR not supported"

**Causes**:
- Not using HTTPS (WebXR requires secure context)
- Browser doesn't support WebXR (check https://caniuse.com/webxr)
- Device doesn't have AR capability

**Solutions**:
- Use ngrok for HTTPS tunnel: `npm run dev:tunnel`
- Test on supported browser (Chrome 90+, Safari 15.4+)
- Check Settings panel for WebXR debug info

### Canvas is black screen in AR

**Cause**: Canvas background not transparent
**Solution**: Add `gl={{ alpha: true }}` to Canvas props

### Objects not appearing in AR

**Possible causes**:
- Objects spawned outside camera view
- Lighting too dark
- Objects too small/large

**Debug**:
- Check object positions with `console.log()`
- Increase ambient light intensity
- Verify object scale

## Testing Checklist

Before considering AR mode complete:

- [ ] AR session starts without errors
- [ ] Hand tracking works (if device supports it)
- [ ] Objects visible and interactive in AR
- [ ] Exit AR button works and returns to simulated mode
- [ ] Session cleanup happens properly on exit
- [ ] Error messages are clear and actionable
- [ ] Works on both Android Chrome and iOS Safari (if possible)
- [ ] HTTPS works via ngrok or production deployment

## Key Learnings

1. **Never pass XR store via Canvas events prop** - This is for pointer events only
2. **Timing-based solutions are fragile** - User-triggered actions are more reliable
3. **WebXR requires HTTPS** - Always test via ngrok or production
4. **React 18 concurrent rendering** - Makes timing completely unpredictable
5. **Debug panel is essential** - Shows WebXR support, secure context, session state
6. **XR component handles store internally** - Don't try to manually manage the connection

## Useful Resources

- [@react-three/xr documentation](https://github.com/pmndrs/react-three-xr)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [WebXR compatibility](https://caniuse.com/webxr)
- [React Three Fiber Events](https://docs.pmnd.rs/react-three-fiber/api/events)

## Questions to Ask When Debugging

1. Is the app running on HTTPS? (Check Settings → WebXR Debug Info)
2. Does the browser support WebXR? (Check Settings → WebXR API)
3. Does the device support immersive-ar? (Check Settings → Immersive AR)
4. Is the Canvas mounted before calling enterAR()?
5. Is the XR component receiving the correct store prop?
6. Are there any Canvas props that might interfere? (especially `events`)
7. What does the browser console show? (Look for WebXR-specific errors)

## Emergency Debug Steps

If AR completely stops working:

1. Check git history: `git log --oneline`
2. Look for changes to ARMode.tsx, especially Canvas props
3. Verify XR store is created with useMemo
4. Check if someone added `events` prop to Canvas (common mistake!)
5. Test on known-working device to isolate device vs code issues
6. Check Settings panel for WebXR debug info
7. Try on different network (some corporate networks block WebXR)
