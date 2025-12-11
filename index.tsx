import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { XR, ARButton, useXR, useHitTest, Interactive } from '@react-three/xr';
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

const FileObject: React.FC<{ file: FileData; position: [number, number, number] }> = ({ file, position }) => {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: file.scale,
    linearDamping: 0.5,
    angularDamping: 0.5,
  }));

  const texture = useGeneratedTexture(file.type, file.color);
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
       // In XR v5, the event target is the controller object (Group)
       const controller = activeController;
       
       const controllerPos = new THREE.Vector3();
       const controllerRot = new THREE.Quaternion();
       
       controller.getWorldPosition(controllerPos);
       controller.getWorldQuaternion(controllerRot);

       const currentPos = new THREE.Vector3();
       ref.current!.getWorldPosition(currentPos);

       const direction = controllerPos.clone().sub(currentPos);
       const dist = direction.length();
       const targetVel = direction.normalize().multiplyScalar(dist * 12);
       
       api.velocity.set(targetVel.x, targetVel.y, targetVel.z);
       // Optional: Match rotation
       // api.rotation.set(controllerRot.x, controllerRot.y, controllerRot.z);
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
    </Interactive>
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
  
  // Use v5 useHitTest
  useHitTest((hitMatrix) => {
    if (!deskPosition && hitTestRef.current) {
      hitTestRef.current.visible = true;
      hitMatrix.decompose(
        hitTestRef.current.position,
        hitTestRef.current.quaternion,
        hitTestRef.current.scale
      );
    }
  });

  const { controllers } = useXR();

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

const App = () => {
  return (
    <>
      <ARButton sessionInit={{ requiredFeatures: ['hit-test'] }} />
      <Canvas shadows>
        <XR>
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

const root = createRoot(window.document.getElementById('root')!);
root.render(<App />);