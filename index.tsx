import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { XR, ARButton, useXR, createXRStore } from '@react-three/xr';
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon';
import { Text, Html, TorusKnot, Icosahedron, Box, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

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

// --- Store ---
const store = createXRStore({ hitTest: true });

// --- Utilities ---

// Helper hook to replace removed useHitTest
const useHitTest = (callback: (matrix: THREE.Matrix4) => void) => {
  const { gl } = useThree();
  const session = useXR((state) => state.session);
  const hitTestSource = useRef<XRHitTestSource | null>(null);

  useEffect(() => {
    if (!session) {
      hitTestSource.current = null;
      return;
    }
    
    const requestHitTestSource = async () => {
      try {
        const space = await session.requestReferenceSpace('viewer');
        const source = await session.requestHitTestSource({ space });
        hitTestSource.current = source;
      } catch (e) {
        console.error('Hit test request failed', e);
      }
    };
    
    requestHitTestSource();
    
    return () => {
      hitTestSource.current?.cancel();
      hitTestSource.current = null;
    };
  }, [session]);

  useFrame((state, delta, frame) => {
    if (hitTestSource.current && frame) {
      const results = frame.getHitTestResults(hitTestSource.current);
      if (results.length > 0) {
        const referenceSpace = gl.xr.getReferenceSpace();
        if (referenceSpace) {
          const pose = results[0].getPose(referenceSpace);
          if (pose) {
            const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
            callback(matrix);
          }
        }
      }
    }
  });
};

// Helper hook to access controllers like in older @react-three/xr versions
const useXRControllers = () => {
  const { gl } = useThree();
  const [controllers, setControllers] = useState<any[]>([]);

  useEffect(() => {
    const list: any[] = [];
    const update = () => setControllers([...list]);

    const onConnected = (e: any) => {
      // Identify controller index
      let index = -1;
      if (e.target === gl.xr.getController(0)) index = 0;
      else if (e.target === gl.xr.getController(1)) index = 1;

      if (index !== -1) {
        const controller = gl.xr.getController(index);
        const grip = gl.xr.getControllerGrip(index);
        
        // Remove duplicate if exists (reconnection)
        const existingIdx = list.findIndex(c => c.controller === controller);
        if (existingIdx !== -1) list.splice(existingIdx, 1);

        list.push({ controller, grip, inputSource: e.data });
        update();
      }
    };
    
    const onDisconnected = (e: any) => {
       const idx = list.findIndex(c => c.controller === e.target);
       if (idx !== -1) {
         list.splice(idx, 1);
         update();
       }
    };

    const c0 = gl.xr.getController(0);
    const c1 = gl.xr.getController(1);

    c0.addEventListener('connected', onConnected);
    c0.addEventListener('disconnected', onDisconnected);
    c1.addEventListener('connected', onConnected);
    c1.addEventListener('disconnected', onDisconnected);

    return () => {
      c0.removeEventListener('connected', onConnected);
      c0.removeEventListener('disconnected', onDisconnected);
      c1.removeEventListener('connected', onConnected);
      c1.removeEventListener('disconnected', onDisconnected);
    };
  }, [gl]);

  return controllers;
};

function useGeneratedTexture(text: string, color: string) {
  return useMemo(() => {
    // Fix: Use window.document to avoid 'Cannot find name document' error
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

const FileObject = ({ file, position }: { file: FileData; position: [number, number, number] }) => {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: file.scale,
    linearDamping: 0.5,
    angularDamping: 0.5,
  }));

  const texture = useGeneratedTexture(file.type, file.color);
  const [hovered, setHover] = useState(false);
  const [grabbingController, setGrabbingController] = useState<any>(null);
  
  // Fix: Use custom hook for controllers
  const controllers = useXRControllers();
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // Model Animation
    if (file.type === 'model' && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }

    // Drag Logic
    if (grabbingController) {
      const controller = grabbingController;
      
      // Check if still pressing (gamepad button 0)
      const isPressed = controller.inputSource?.gamepad?.buttons[0]?.pressed;
      
      if (isPressed) {
        const controllerPos = new THREE.Vector3();
        const controllerRot = new THREE.Quaternion();
        
        // Use grip space (position of hand)
        controller.grip.getWorldPosition(controllerPos);
        controller.grip.getWorldQuaternion(controllerRot);

        const currentPos = new THREE.Vector3();
        ref.current!.getWorldPosition(currentPos);

        // Spring force
        const direction = controllerPos.clone().sub(currentPos);
        const dist = direction.length();
        const targetVel = direction.normalize().multiplyScalar(dist * 12); // Speed
        
        api.velocity.set(targetVel.x, targetVel.y, targetVel.z);
        api.rotation.set(controllerRot.x, controllerRot.y, controllerRot.z);
      } else {
        // Released
        setGrabbingController(null);
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    // Wake physics
    api.wakeUp();

    // Find which controller triggered this
    const activeController = controllers.find(c => c.inputSource?.gamepad?.buttons[0]?.pressed);
    
    if (activeController) {
      setGrabbingController(activeController);
    }
  };

  return (
    <group 
      ref={ref} 
      onPointerDown={handlePointerDown}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      {/* Selection Highlight */}
      {hovered && (
         <mesh>
           <boxGeometry args={[file.scale[0] + 0.05, file.scale[1] + 0.05, file.scale[2] + 0.05]} />
           <meshBasicMaterial color="white" wireframe />
         </mesh>
      )}

      {/* Visuals */}
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

      {/* Label */}
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

const ARScene = () => {
  const [deskPosition, setDeskPosition] = useState<THREE.Vector3 | null>(null);
  const hitTestRef = useRef<THREE.Group>(null);
  
  // Fix: Use custom hit test hook
  useHitTest((hitMatrix: THREE.Matrix4) => {
    if (!deskPosition && hitTestRef.current) {
      hitTestRef.current.visible = true;
      hitMatrix.decompose(
        hitTestRef.current.position,
        hitTestRef.current.quaternion,
        hitTestRef.current.scale
      );
    }
  });

  // Fix: Use custom hook for controllers
  const controllers = useXRControllers();

  // Manual select listener for desk placement
  useEffect(() => {
    const onSelect = () => {
      if (!deskPosition && hitTestRef.current && hitTestRef.current.visible) {
        const pos = new THREE.Vector3();
        hitTestRef.current.getWorldPosition(pos);
        setDeskPosition(pos);
      }
    };
    
    // Attach listener to all available controllers
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

const App = () => {
  return (
    <>
      <ARButton store={store} />
      <Canvas shadows>
        <XR store={store}>
          <ARScene />
        </XR>
      </Canvas>
      
      <div style={{
        position: 'absolute', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        color: 'white', 
        background: 'rgba(0,0,0,0.5)', 
        padding: '10px 20px', 
        borderRadius: '20px',
        pointerEvents: 'none',
        textAlign: 'center',
        fontFamily: 'sans-serif'
      }}>
        <h2>Mixed Reality Desktop</h2>
        <p>1. Scan floor/table to find reticle.</p>
        <p>2. Tap to create desktop.</p>
        <p>3. Drag & Throw files!</p>
      </div>
    </>
  );
};

// Fix: Use window.document to avoid 'Cannot find name document' error
const root = createRoot(window.document.getElementById('root')!);
root.render(<App />);