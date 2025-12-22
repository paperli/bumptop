/**
 * Controls Hint Component
 * Shows keyboard/mouse controls for Phase 2
 */

import './ControlsHint.css'

export function ControlsHint() {
  return (
    <div className="controls-hint">
      <div className="controls-hint-title">Phase 3 Controls:</div>
      <div className="controls-hint-item">🖱️ Click: Select/deselect file</div>
      <div className="controls-hint-item">🖱️ Click + Drag: Move file</div>
      <div className="controls-hint-item">🖱️ Drag + Release: Throw file</div>
      <div className="controls-hint-item">🖱️ Right Click + Drag: Rotate camera</div>
      <div className="controls-hint-item">🖱️ Scroll: Zoom camera</div>
      <div className="controls-hint-note">
        ✨ Try dragging and throwing files around!
      </div>
    </div>
  )
}
