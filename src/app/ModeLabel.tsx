/**
 * Mode Label Component
 * Shows the current app mode (AR or Simulated)
 */

import { useAppStore } from '../store/appStore'
import './ModeLabel.css'

export function ModeLabel() {
  const mode = useAppStore((state) => state.mode)
  const capabilities = useAppStore((state) => state.capabilities)

  const modeText = mode === 'ar' ? 'AR Mode' : 'Simulated Mode'
  const subtitle = !capabilities.supportsImmersiveAR
    ? '(WebXR not supported on this device)'
    : mode === 'simulated'
      ? '(Click "Enter AR" to use AR mode)'
      : '(AR session active)'

  return (
    <div className="mode-label">
      <div className="mode-label-text">{modeText}</div>
      <div className="mode-label-subtitle">{subtitle}</div>
    </div>
  )
}
