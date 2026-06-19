import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

function CarMesh({ paintColor }: { paintColor: string }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: paintColor,
    metalness: 0.85,
    roughness: 0.18,
    envMapIntensity: 1.2,
  }), [paintColor]);

  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#88ccff',
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.45,
  }), []);

  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#111',
    metalness: 0.6,
    roughness: 0.4,
  }), []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Body */}
      <mesh material={bodyMat} position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.8, 0.35, 4]} />
      </mesh>
      {/* Cabin */}
      <mesh material={glassMat} position={[0, 0.65, -0.2]} castShadow>
        <boxGeometry args={[1.4, 0.3, 1.8]} />
      </mesh>
      {/* Hood */}
      <mesh material={bodyMat} position={[0, 0.42, 1.2]} castShadow>
        <boxGeometry args={[1.6, 0.15, 1.2]} />
      </mesh>
      {/* Spoiler */}
      <mesh material={darkMat} position={[0, 0.55, -1.9]}>
        <boxGeometry args={[1.6, 0.05, 0.3]} />
      </mesh>
      {/* Wheels */}
      {[[-0.9, 0.15, 1.2], [0.9, 0.15, 1.2], [-0.9, 0.15, -1.2], [0.9, 0.15, -1.2]].map((pos, i) => (
        <mesh key={i} material={darkMat} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.2, 16]} />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[-0.6, 0.35, 2.05]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fffde7" emissive="#ffffaa" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.6, 0.35, 2.05]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fffde7" emissive="#ffffaa" emissiveIntensity={2} />
      </mesh>
      {/* Taillights */}
      {[-0.6, 0.6].map(x => (
        <mesh key={x} position={[x, 0.35, -2.05]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ff1744" emissive="#ff1744" emissiveIntensity={3} />
        </mesh>
      ))}
    </group>
  );
}

interface Props {
  paintColor?: string;
}

export function CarViewer3D({ paintColor = '#00e5ff' }: Props) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1020] via-[#060a14] to-[#0d0818] z-0" />
      <Canvas
        shadows
        camera={{ position: [5, 3, 6], fov: 45 }}
        className="relative z-10"
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#060a14']} />
        <fog attach="fog" args={['#060a14', 8, 20]} />
        <ambientLight intensity={0.3} />
        <spotLight position={[8, 10, 5]} angle={0.3} penumbra={0.5} intensity={80} castShadow color="#00e5ff" />
        <spotLight position={[-6, 8, -4]} angle={0.4} intensity={40} color="#ff6d00" />
        <pointLight position={[0, 2, 0]} intensity={5} color="#2979ff" />

        <CarMesh paintColor={paintColor} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[20, 20]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={512}
            mixBlur={1}
            mixStrength={0.5}
            roughness={0.8}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0a0e18"
            metalness={0.6}
            mirror={0.4}
          />
        </mesh>

        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={12} blur={2.5} far={4} color="#000" />
        <Environment preset="night" />

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={4}
          maxDistance={12}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
        />
      </Canvas>

      <div className="absolute bottom-3 left-0 right-0 text-center text-[8px] tracking-[0.25em] text-white/25 uppercase z-20">
        Pinch to zoom · Drag to rotate
      </div>
    </div>
  );
}
