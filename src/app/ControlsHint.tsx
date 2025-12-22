/**
 * Controls Hint Component
 * Shows keyboard/mouse controls for Phase 2
 */

import './ControlsHint.css'

export function ControlsHint() {
  return (
    <div className="controls-hint">
      <div className="controls-hint-title">Phase 2 Controls:</div>
      <div className="controls-hint-item">🖱️ Left Click: Select objects</div>
      <div className="controls-hint-item">🖱️ Right Click + Drag: Rotate camera</div>
      <div className="controls-hint-item">🖱️ Scroll: Zoom</div>
      <div className="controls-hint-note">
        ✨ Drag & throw coming in Phase 3!
      </div>
    </div>
  )
}
