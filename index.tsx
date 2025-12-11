import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import type { ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { XR, ARButton, useXR, useHitTest, Interactive } from '@react-three/xr';
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon';
import { Text, Html, TorusKnot, Icosahedron, Box, RoundedBox, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          color: '#fff',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <h2>⚠️ Error Loading App</h2>
          <p style={{ margin: '10px 0', fontSize: '14px' }}>
            {this.state.error?.message || 'Unknown error'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
          <details style={{ marginTop: '20px', fontSize: '12px', maxWidth: '90%' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Error Details</summary>
            <pre style={{ 
              background: '#222', 
              padding: '10px', 
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '10px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Types & Mock Data ---

type FileType = 'image' | 'text' | 'audio' | 'model' | 'video';

interface FileData {
  id: string;
  name: string;
  type: FileType;
  color: string;
  scale: [number, number, number];
}

const MOCK_FILES: FileData[] = [
  { id: '1', name: 'vacation.jpg', type: 'image', color: '#FF6B6B', scale: [1, 1, 0.1] },
  { id: '2', name: 'report.docx', type: 'text', color: '#4ECDC4', scale: [0.8, 1, 0.2] },
  { id: '3', name: 'project_alpha.obj', type: 'model', color: '#FFE66D', scale: [0.8, 0.8, 0.8] },
  { id: '4', name: 'meeting_notes.txt', type: 'text', color: '#F7FFF7', scale: [0.8, 1, 0.1] },
  { id: '5', name: 'demo_reel.mp4', type: 'video', color: '#1A535C', scale: [1.5, 1, 0.1] },
  { id: '6', name: 'song_idea.mp3', type: 'audio', color: '#FF9F1C', scale: [0.5, 0.5, 0.5] },
  { id: '7', name: 'sculpture_v2.glb', type: 'model', color: '#C2F9BB', scale: [0.7, 0.7, 0.7] },
];

// --- Utilities ---

function useGeneratedTexture(text: string, color: string) {
  return useMemo(() => {
    // Access document directly via window
    const canvas = window.document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(10, 10, 236, 236);
      ctx.fillStyle = '#333';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.toUpperCase(), 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, [text, color]);
}

// --- Components ---

const DesktopBoundaries = ({ width = 1.5, depth = 1.0 }) => {
  usePlane(() => ({ position: [0, 0, -depth / 2], rotation: [0, 0, 0] }));
  usePlane(() => ({ position: [0, 0, depth / 2], rotation: [0, Math.PI, 0] }));
  usePlane(() => ({ position: [-width / 2, 0, 0], rotation: [0, Math.PI / 2, 0] }));
  usePlane(() => ({ position: [width / 2, 0, 0], rotation: [0, -Math.PI / 2, 0] }));
  return null;
};

// Shared file object visuals (used by both AR and Desktop modes)
const FileObjectVisuals: React.FC<{ file: FileData; meshRef: React.RefObject<THREE.Group> }> = ({ file, meshRef }) => {
  const texture = useGeneratedTexture(file.type, file.color);

  return (
    <group ref={meshRef}>
      {file.type === 'model' ? (
        <group>
           <Icosahedron args={[0.3, 0]} castShadow>
              <meshStandardMaterial color={file.color} roughness={0.2} metalness={0.8} />
           </Icosahedron>
           <TorusKnot args={[0.2, 0.05, 64, 8]} position={[0,0,0]} castShadow>
              <meshStandardMaterial color="white" />
           </TorusKnot>
        </group>
      ) : file.type === 'video' ? (
         <RoundedBox args={[file.scale[0], file.scale[1], file.scale[2]]} radius={0.05} castShadow>
           <meshStandardMaterial color="#222" />
           <mesh position={[0,0,file.scale[2]/2 + 0.001]}>
              <planeGeometry args={[file.scale[0]*0.9, file.scale[1]*0.9]} />
              <meshBasicMaterial color="black" />
           </mesh>
           <Text position={[0,0,file.scale[2]/2 + 0.01]} fontSize={0.2} color="white">▶ PLAY</Text>
         </RoundedBox>
      ) : (
        <Box args={[file.scale[0], file.scale[1], file.scale[2]]} castShadow>
          <meshStandardMaterial map={texture} />
        </Box>
      )}
    </group>
  );
};

// AR Mode FileObject (uses Interactive from @react-three/xr)
const ARFileObject: React.FC<{ file: FileData; position: [number, number, number] }> = ({ file, position }) => {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: file.scale,
    linearDamping: 0.5,
    angularDamping: 0.5,
  }));

  const [hovered, setHover] = useState(false);
  const [activeController, setActiveController] = useState<any>(null);
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Model Animation
    if (file.type === 'model' && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }

    // Drag Logic using standard spring physics towards controller
    if (activeController) {
       const controller = activeController;
       const controllerPos = new THREE.Vector3();
       controller.getWorldPosition(controllerPos);

       const currentPos = new THREE.Vector3();
       ref.current!.getWorldPosition(currentPos);

       const direction = controllerPos.clone().sub(currentPos);
       const dist = direction.length();
       const targetVel = direction.normalize().multiplyScalar(dist * 12);
       
       api.velocity.set(targetVel.x, targetVel.y, targetVel.z);
    }
  });

  const onSelectStart = (e: any) => {
    setActiveController(e.target);
    api.wakeUp();
  };

  const onSelectEnd = (e: any) => {
    if (e.target === activeController) {
      setActiveController(null);
    }
  };

  return (
    <Interactive
      onSelectStart={onSelectStart}
      onSelectEnd={onSelectEnd}
      onHover={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <group ref={ref}>
        {hovered && (
           <mesh>
             <boxGeometry args={[file.scale[0] + 0.05, file.scale[1] + 0.05, file.scale[2] + 0.05]} />
             <meshBasicMaterial color="white" wireframe />
           </mesh>
        )}
        <FileObjectVisuals file={file} meshRef={meshRef} />
        <group position={[0, file.scale[1] / 2 + 0.2, 0]}>
          <Text
            fontSize={0.1}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {file.name}
          </Text>
        </group>
      </group>
    </Interactive>
  );
};

// Desktop Mode FileObject (uses standard Three.js events, no XR dependency)
const DesktopFileObject: React.FC<{ file: FileData; position: [number, number, number] }> = ({ file, position }) => {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: file.scale,
    linearDamping: 0.5,
    angularDamping: 0.5,
  }));

  const [hovered, setHover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const meshRef = useRef<THREE.Group>(null);
  const { raycaster, camera, gl } = useThree();

  useFrame((state, delta) => {
    // Model Animation
    if (file.type === 'model' && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }

    // Desktop drag logic (simplified - just for visual feedback)
    if (isDragging && ref.current) {
      // Could implement mouse drag here if needed
    }
  });

  const handlePointerOver = () => {
    setHover(true);
  };

  const handlePointerOut = () => {
    setHover(false);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    api.wakeUp();
    // Apply a small impulse for visual feedback
    api.velocity.set(
      (Math.random() - 0.5) * 2,
      Math.random() * 2,
      (Math.random() - 0.5) * 2
    );
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <group 
      ref={ref}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {hovered && (
         <mesh>
           <boxGeometry args={[file.scale[0] + 0.05, file.scale[1] + 0.05, file.scale[2] + 0.05]} />
           <meshBasicMaterial color="white" wireframe />
         </mesh>
      )}
      <FileObjectVisuals file={file} meshRef={meshRef} />
      <group position={[0, file.scale[1] / 2 + 0.2, 0]}>
        <Text
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {file.name}
        </Text>
      </group>
    </group>
  );
};

// Main FileObject component - chooses AR or Desktop version
const FileObject: React.FC<{ file: FileData; position: [number, number, number]; isDesktop?: boolean }> = ({ file, position, isDesktop = false }) => {
  if (isDesktop) {
    return <DesktopFileObject file={file} position={position} />;
  }
  return <ARFileObject file={file} position={position} />;
};

const VirtualDesktop = ({ position }: { position: THREE.Vector3 }) => {
  usePlane(() => ({ 
    position: [position.x, position.y, position.z], 
    rotation: [-Math.PI / 2, 0, 0],
    material: { friction: 0.1, restitution: 0.5 } 
  }));

  return (
    <group position={position}>
      <DesktopBoundaries />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.5, 1.0]} />
        <meshStandardMaterial 
          color="#aaddff" 
          transparent 
          opacity={0.3} 
          metalness={0.5} 
          roughness={0.1}
        />
      </mesh>
      <gridHelper args={[1.5, 15, 0xffffff, 0xffffff]} position={[0, 0.001, 0]} />
    </group>
  );
};

// Desktop Scene (non-AR mode)
const DesktopScene = () => {
  const deskPosition = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    console.log('Desktop mode: Desktop placed at origin');
  }, []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 2]} intensity={1} castShadow />
      
      {/* Camera Controls for Desktop */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
        target={[0, 0, 0]}
      />

      {/* Desktop and Files */}
      <Physics gravity={[0, -9.8, 0]}>
        <VirtualDesktop position={deskPosition} />
        {MOCK_FILES.map((file, i) => (
          <FileObject 
            key={file.id} 
            file={file} 
            isDesktop={true}
            position={[
              deskPosition.x + (Math.random() - 0.5) * 0.5, 
              deskPosition.y + 0.3 + (i * 0.1),
              deskPosition.z + (Math.random() - 0.5) * 0.3
            ] as [number, number, number]} 
          />
        ))}
      </Physics>
    </>
  );
};

const ARScene = () => {
  const [deskPosition, setDeskPosition] = useState<THREE.Vector3 | null>(null);
  const [hitTestAvailable, setHitTestAvailable] = useState(true);
  const hitTestRef = useRef<THREE.Group>(null);
  
  // Use v5 useHitTest - will fail gracefully if not available (common on iOS)
  useHitTest((hitMatrix) => {
    if (!deskPosition && hitTestRef.current) {
      setHitTestAvailable(true);
      hitTestRef.current.visible = true;
      hitMatrix.decompose(
        hitTestRef.current.position,
        hitTestRef.current.quaternion,
        hitTestRef.current.scale
      );
    }
  });

  const { controllers, isPresenting } = useXR();

  // Fallback: If hit-test not working and in AR session, place desktop after delay
  useEffect(() => {
    if (isPresenting && !deskPosition) {
      console.log('AR session started, waiting for hit-test...');
      const timer = setTimeout(() => {
        // If hit-test hasn't worked after 3 seconds, place desktop at default position
        if (!deskPosition) {
          console.warn('Hit-test not available after 3s, using default desktop position');
          setDeskPosition(new THREE.Vector3(0, -1.5, -1.5));
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPresenting, deskPosition]);
  
  // Log when desktop is placed
  useEffect(() => {
    if (deskPosition) {
      console.log('Desktop placed at:', deskPosition);
    }
  }, [deskPosition]);

  useEffect(() => {
    // Manual listener for placing desk
    const onSelect = () => {
       if (!deskPosition && hitTestRef.current && hitTestRef.current.visible) {
        const pos = new THREE.Vector3();
        hitTestRef.current.getWorldPosition(pos);
        setDeskPosition(pos);
      }
    };

    controllers.forEach(c => c.controller.addEventListener('select', onSelect));
    return () => controllers.forEach(c => c.controller.removeEventListener('select', onSelect));
  }, [controllers, deskPosition]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 4, 2]} intensity={1} castShadow />

      {!deskPosition && (
        <group ref={hitTestRef} visible={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.05, 0.08, 32]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <Text 
            position={[0, 0.15, 0]} 
            fontSize={0.05} 
            color="white" 
            anchorX="center"
            outlineWidth={0.005}
          >
            Tap to Place Desktop
          </Text>
        </group>
      )}

      {deskPosition && (
        <Physics gravity={[0, -9.8, 0]}>
          <VirtualDesktop position={deskPosition} />
          {MOCK_FILES.map((file, i) => (
            <FileObject 
              key={file.id} 
              file={file} 
              position={[
                deskPosition.x + (Math.random() - 0.5) * 0.5, 
                deskPosition.y + 0.3 + (i * 0.1),
                deskPosition.z + (Math.random() - 0.5) * 0.3
              ] as [number, number, number]} 
            />
          ))}
        </Physics>
      )}
    </>
  );
};

// iOS detection utility
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// XRViewer detection
const isXRViewer = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('webxr') || ua.includes('xrviewer') || ua.includes('mozilla');
};

// WebXR support detection
const checkWebXRSupport = () => {
  if (typeof navigator !== 'undefined' && 'xr' in navigator) {
    return navigator.xr !== null;
  }
  return false;
};

// Canvas Error Handler Component
const CanvasErrorHandler = () => {
  const { gl } = useThree();
  
  useEffect(() => {
    // Check WebGL context
    if (!gl) {
      console.error('WebGL context not available');
      return;
    }

    const canvas = gl.domElement;
    
    // Check if context is lost
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.error('WebGL context lost!');
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Log WebGL info
    const debugInfo = gl.getContextAttributes();
    console.log('WebGL Context Info:', {
      alpha: debugInfo?.alpha,
      antialias: debugInfo?.antialias,
      depth: debugInfo?.depth,
      stencil: debugInfo?.stencil,
      preserveDrawingBuffer: debugInfo?.preserveDrawingBuffer,
      powerPreference: debugInfo?.powerPreference,
      failIfMajorPerformanceCaveat: debugInfo?.failIfMajorPerformanceCaveat
    });

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  return null;
};

const App = () => {
  const [webXRSupported, setWebXRSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isXRViewerApp, setIsXRViewerApp] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null);
  const [desktopMode, setDesktopMode] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  useEffect(() => {
    const ios = isIOS();
    const xrViewer = isXRViewer();
    setIsIOSDevice(ios);
    setIsXRViewerApp(xrViewer);
    
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    setWebGLAvailable(!!gl);
    
    if (!gl) {
      setCanvasError('WebGL is not supported on this device/browser');
      console.error('WebGL not available');
    }
    
    // Collect device info for debugging
    const deviceInfo = {
      userAgent: navigator.userAgent,
      isIOS: ios,
      isXRViewer: xrViewer,
      platform: navigator.platform,
      webXRAvailable: checkWebXRSupport(),
      webGLAvailable: !!gl,
      protocol: window.location.protocol,
      host: window.location.host,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio
    };
    console.log('Device Info:', deviceInfo);
    setDebugData(deviceInfo);

    if (xrViewer) {
      console.warn('⚠️ XRViewer detected - This app is outdated and may have compatibility issues');
      setError('XRViewer is outdated and may not work properly. Use desktop mode, or try an Android device for full WebXR support.');
    }
    
    // Check WebXR support
    if (checkWebXRSupport()) {
      navigator.xr!.isSessionSupported('immersive-ar').then((supported) => {
        console.log('WebXR AR support:', supported);
        setWebXRSupported(supported);
        setDebugData((prev: any) => ({ ...prev, webXRARSupported: supported }));
        if (!supported && ios) {
          setError('WebXR AR is not supported on iPhone/iPad Safari. Only Vision Pro Safari supports WebXR. Use an Android device for full WebXR support.');
        }
      }).catch((err) => {
        console.error('WebXR check failed:', err);
        setWebXRSupported(false);
        setDebugData((prev: any) => ({ ...prev, webXRARSupported: false, webXRError: err.message }));
        setError('WebXR check failed. Make sure you\'re using HTTPS or localhost.');
      });
    } else {
      console.warn('WebXR not available in this browser - enabling desktop mode');
      setWebXRSupported(false);
      setDesktopMode(true); // Enable desktop mode automatically
      setDebugData((prev: any) => ({ ...prev, webXRARSupported: false, desktopModeEnabled: true }));
      if (ios) {
        setError('WebXR is not supported on iPhone/iPad. Only Vision Pro Safari supports WebXR. Use an Android device for full WebXR support.');
      } else {
        // Desktop mode - no error, just info
        console.log('Desktop mode enabled - You can interact with the 3D scene using mouse');
      }
    }
  }, []);

  return (
    <>
      {/* AR Button - only functional if WebXR is available */}
      {!desktopMode && (
        <ARButton 
          sessionInit={{ 
            optionalFeatures: ['hit-test', 'local-floor', 'bounded-floor'],
            requiredFeatures: [] // Don't require hit-test for iOS compatibility
          }} 
        />
      )}
      <Canvas 
        shadows
        camera={{ position: [2, 2, 2], fov: 50 }}
        onCreated={({ gl, scene, camera }) => {
          console.log('Canvas created successfully');
          console.log('Scene:', scene);
          console.log('Camera:', camera);
          console.log('Renderer:', gl);
          console.log('Desktop mode:', desktopMode);
          
          // Set up error handling
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.error('WebGL context lost!');
            setCanvasError('WebGL context lost - try reloading the page');
          });
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setCanvasError(`Canvas error: ${error.message || 'Unknown error'}`);
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false
        }}
      >
        <Suspense fallback={null}>
          <CanvasErrorHandler />
          {desktopMode ? (
            <DesktopScene />
          ) : (
            <XR>
              <ARScene />
            </XR>
          )}
        </Suspense>
      </Canvas>
      
      {/* Debug Toggle Button */}
      <button
        onClick={() => setShowDebugInfo(!showDebugInfo)}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 15px',
          background: showDebugInfo ? 'rgba(255, 165, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '10px',
          cursor: 'pointer',
          fontFamily: 'sans-serif',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1001,
          transition: 'all 0.3s ease'
        }}
      >
        {showDebugInfo ? '🔍 Hide Debug' : '🔍 Show Debug'}
      </button>

      {/* Debug Info Panel */}
      {showDebugInfo && debugData && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#0f0',
          padding: '15px',
          borderRadius: '10px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 1001,
          border: '2px solid rgba(0, 255, 0, 0.3)',
          boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)'
        }}>
          <div style={{ marginBottom: '10px', borderBottom: '1px solid rgba(0, 255, 0, 0.3)', paddingBottom: '10px' }}>
            <strong style={{ color: '#0f0', fontSize: '14px' }}>🐛 DEBUG INFO</strong>
          </div>
          <div style={{ lineHeight: '1.6' }}>
            <div><strong>Platform:</strong> {debugData.platform}</div>
            <div><strong>iOS:</strong> {debugData.isIOS ? '✅ Yes' : '❌ No'}</div>
            <div><strong>XRViewer:</strong> {debugData.isXRViewer ? '⚠️ Yes' : '❌ No'}</div>
            <div><strong>WebGL:</strong> {debugData.webGLAvailable ? '✅ Available' : '❌ Not Available'}</div>
            <div><strong>WebXR:</strong> {debugData.webXRAvailable ? '✅ Available' : '❌ Not Available'}</div>
            <div><strong>WebXR AR Support:</strong> {webXRSupported === true ? '✅ Yes' : webXRSupported === false ? '❌ No' : '⏳ Checking...'}</div>
            <div><strong>Desktop Mode:</strong> {desktopMode ? '✅ Active' : '❌ Inactive'}</div>
            <div><strong>Protocol:</strong> {debugData.protocol}</div>
            <div><strong>Host:</strong> {debugData.host}</div>
            <div><strong>Screen:</strong> {debugData.screenWidth} × {debugData.screenHeight}</div>
            <div><strong>Pixel Ratio:</strong> {debugData.devicePixelRatio}</div>
            {error && (
              <div style={{ marginTop: '10px', color: '#f00', borderTop: '1px solid rgba(255, 0, 0, 0.3)', paddingTop: '10px' }}>
                <strong>Error:</strong> {error}
              </div>
            )}
            {canvasError && (
              <div style={{ marginTop: '10px', color: '#f00' }}>
                <strong>Canvas Error:</strong> {canvasError}
              </div>
            )}
            <div style={{ marginTop: '10px', fontSize: '10px', color: '#888', borderTop: '1px solid rgba(0, 255, 0, 0.3)', paddingTop: '10px' }}>
              <div><strong>User Agent:</strong></div>
              <div style={{ wordBreak: 'break-all', fontSize: '10px' }}>{debugData.userAgent}</div>
            </div>
          </div>
        </div>
      )}

      {showDebugInfo && (
        <div style={{
          position: 'absolute', 
          top: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          color: 'white', 
          background: 'rgba(0,0,0,0.7)', 
          padding: '15px 25px', 
          borderRadius: '20px',
          pointerEvents: 'none',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          maxWidth: '90%',
          zIndex: 1000
        }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Mixed Reality Desktop</h2>
        {error && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.3)',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            ⚠️ {error}
          </div>
        )}
        {isXRViewerApp && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.5)',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            ⚠️ XRViewer Detected: This app is outdated and may show a black screen. 
            Use desktop mode (automatic), or try an Android device for full WebXR support.
          </div>
        )}
        {isIOSDevice && !isXRViewerApp && (
          <div style={{
            background: 'rgba(255, 165, 0, 0.3)',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            📱 iOS Device Detected: WebXR support is limited. See console for details.
          </div>
        )}
        {canvasError && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.5)',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            🚫 {canvasError}
          </div>
        )}
        {webGLAvailable === false && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.5)',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            🚫 WebGL not available - This app requires WebGL support
          </div>
        )}
        {desktopMode && (
          <div style={{
            background: 'rgba(0, 255, 0, 0.3)',
            padding: '10px',
            borderRadius: '10px',
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            🖥️ Desktop Mode Active
            <p style={{ margin: '5px 0 0 0', fontSize: '11px' }}>
              Use mouse to orbit, zoom, and pan. Click AR button above to try AR mode.
            </p>
          </div>
        )}
        {webXRSupported === false && !error && !desktopMode && (
          <p style={{ fontSize: '12px', margin: '5px 0' }}>
            WebXR not available. Check browser console (F12) for details.
          </p>
        )}
        {!desktopMode && (
          <>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>1. Scan floor/table to find reticle.</p>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>2. Tap to create desktop.</p>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>3. Drag & Throw files!</p>
          </>
        )}
        {desktopMode && (
          <>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>🖱️ Mouse Controls:</p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>• Left Click + Drag: Rotate camera</p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>• Right Click + Drag: Pan</p>
            <p style={{ fontSize: '11px', margin: '2px 0' }}>• Scroll: Zoom in/out</p>
          </>
        )}
        </div>
      )}
    </>
  );
};

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const rootElement = window.document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}