/**
 * Settings Panel
 * Dev-friendly panel to adjust desk boundary, physics, and UI settings
 */

import { useAppStore } from '../store/appStore'
import { getDeviceInfo } from '../utils/xrHelpers'
import './Settings.css'

export function Settings() {
  const showSettings = useAppStore((state) => state.showSettings)
  const toggleSettings = useAppStore((state) => state.toggleSettings)
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)
  const capabilities = useAppStore((state) => state.capabilities)
  const mode = useAppStore((state) => state.mode)
  const isARSessionActive = useAppStore((state) => state.isARSessionActive)

  if (!showSettings) {
    // Show settings toggle button
    return (
      <button className="settings-toggle" onClick={toggleSettings} title="Open Settings">
        ⚙️
      </button>
    )
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="settings-close" onClick={toggleSettings}>
          ✕
        </button>
      </div>

      <div className="settings-content">
        {/* WebXR Debug Info */}
        <section className="debug-section">
          <h3>WebXR Debug Info</h3>
          <div className="debug-info">
            <div className="debug-row">
              <span className="debug-label">Device:</span>
              <span className="debug-value">{getDeviceInfo()}</span>
            </div>
            <div className="debug-row">
              <span className="debug-label">Secure Context:</span>
              <span className={`debug-value ${window.isSecureContext ? 'success' : 'error'}`}>
                {window.isSecureContext ? '✓ Yes (HTTPS)' : '✗ No (HTTP)'}
              </span>
            </div>
            <div className="debug-row">
              <span className="debug-label">WebXR API:</span>
              <span className={`debug-value ${capabilities.supportsWebXR ? 'success' : 'error'}`}>
                {capabilities.supportsWebXR ? '✓ Available' : '✗ Not Available'}
              </span>
            </div>
            <div className="debug-row">
              <span className="debug-label">Immersive AR:</span>
              <span className={`debug-value ${capabilities.supportsImmersiveAR ? 'success' : 'error'}`}>
                {capabilities.supportsImmersiveAR ? '✓ Supported' : '✗ Not Supported'}
              </span>
            </div>
            <div className="debug-row">
              <span className="debug-label">Current Mode:</span>
              <span className="debug-value">{mode === 'ar' ? 'AR Mode' : 'Simulated Mode'}</span>
            </div>
            <div className="debug-row">
              <span className="debug-label">AR Session:</span>
              <span className={`debug-value ${isARSessionActive ? 'success' : ''}`}>
                {isARSessionActive ? '✓ Active' : 'Inactive'}
              </span>
            </div>
            <div className="debug-row">
              <span className="debug-label">Browser:</span>
              <span className="debug-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                {navigator.userAgent.split(' ').slice(0, 3).join(' ')}...
              </span>
            </div>
          </div>
        </section>

        {/* Desk Boundary */}
        <section>
          <h3>Desk Boundary</h3>
          <label>
            Width (m): {settings.deskWidth.toFixed(2)}
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={settings.deskWidth}
              onChange={(e) => updateSettings({ deskWidth: parseFloat(e.target.value) })}
            />
          </label>
          <label>
            Height (m): {settings.deskHeight.toFixed(2)}
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={settings.deskHeight}
              onChange={(e) => updateSettings({ deskHeight: parseFloat(e.target.value) })}
            />
          </label>
        </section>

        {/* Physics (for Phase 2) */}
        <section>
          <h3>Physics (Phase 2)</h3>
          <label>
            Restitution: {settings.restitution.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.restitution}
              onChange={(e) => updateSettings({ restitution: parseFloat(e.target.value) })}
            />
          </label>
          <label>
            Friction: {settings.friction.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.friction}
              onChange={(e) => updateSettings({ friction: parseFloat(e.target.value) })}
            />
          </label>
        </section>

        {/* UI Options */}
        <section>
          <h3>UI Options</h3>
          <label>
            <input
              type="checkbox"
              checked={settings.showDebugInfo}
              onChange={(e) => updateSettings({ showDebugInfo: e.target.checked })}
            />
            Show Debug Info
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.showBoundaryWireframe}
              onChange={(e) => updateSettings({ showBoundaryWireframe: e.target.checked })}
            />
            Show Boundary Wireframe
          </label>
        </section>
      </div>
    </div>
  )
}
