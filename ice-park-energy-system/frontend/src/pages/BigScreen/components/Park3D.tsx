import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Box, Cylinder, Sphere, Environment } from '@react-three/drei'
import * as THREE from 'three'

// 冰雕模型
function IceSculpture({ position, scale = 1, health = 'good' }: { position: [number, number, number]; scale?: number; health?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const color = health === 'good' ? '#88ccff' : health === 'warning' ? '#ffcc00' : '#ff6666'
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <coneGeometry args={[0.5 * scale, 1.5 * scale, 6]} />
        <meshPhysicalMaterial 
          color={color}
          transparent
          opacity={0.8}
          roughness={0.1}
          metalness={0.1}
          transmission={0.5}
        />
      </mesh>
      <pointLight position={[0, 1, 0]} intensity={0.5} color={color} />
    </group>
  )
}

// 制冷机组
function CoolingUnit({ position, isRunning = true }: { position: [number, number, number]; isRunning?: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (fanRef.current && isRunning) {
      fanRef.current.rotation.y += 0.1
    }
  })

  return (
    <group position={position}>
      <Box args={[1, 0.8, 0.6]} castShadow>
        <meshStandardMaterial color={isRunning ? '#4a90d9' : '#666666'} />
      </Box>
      <mesh ref={fanRef} position={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {isRunning && (
        <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#00ff00" />
      )}
    </group>
  )
}

// 地面
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a3a5c" />
    </mesh>
  )
}

// 能量流动粒子
function EnergyParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const positions = new Float32Array(100 * 3)
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = Math.random() * 3
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < 100; i++) {
        positions[i * 3 + 1] += 0.02
        if (positions[i * 3 + 1] > 3) {
          positions[i * 3 + 1] = 0
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00d4ff" transparent opacity={0.6} />
    </points>
  )
}

// 园区边界
function ParkBoundary() {
  return (
    <group>
      {/* 围栏 */}
      {[-5, 5].map((x) => (
        <Box key={`x${x}`} args={[0.1, 1, 10]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#2a4a6a" transparent opacity={0.5} />
        </Box>
      ))}
      {[-5, 5].map((z) => (
        <Box key={`z${z}`} args={[10, 1, 0.1]} position={[0, 0, z]}>
          <meshStandardMaterial color="#2a4a6a" transparent opacity={0.5} />
        </Box>
      ))}
    </group>
  )
}

// 区域标签
function AreaLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Text
      position={position}
      fontSize={0.3}
      color="#00d4ff"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  )
}

// 主场景
function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00d4ff" />
      
      <Ground />
      <ParkBoundary />
      <EnergyParticles />
      
      {/* A区 - 主展区 */}
      <IceSculpture position={[-2, 0.5, -2]} scale={1.5} health="good" />
      <IceSculpture position={[-3, 0.3, -1]} scale={0.8} health="good" />
      <AreaLabel position={[-2.5, 2, -2]} text="A区-主展区" />
      
      {/* B区 - 互动区 */}
      <IceSculpture position={[2, 0.4, -2]} scale={1} health="warning" />
      <IceSculpture position={[3, 0.3, -1]} scale={0.7} health="good" />
      <AreaLabel position={[2.5, 2, -2]} text="B区-互动区" />
      
      {/* C区 - 餐饮区 */}
      <IceSculpture position={[0, 0.3, 2]} scale={0.9} health="danger" />
      <AreaLabel position={[0, 2, 2]} text="C区-餐饮区" />
      
      {/* 制冷机组 */}
      <CoolingUnit position={[-4, 0, 4]} isRunning={true} />
      <CoolingUnit position={[-2, 0, 4]} isRunning={true} />
      <CoolingUnit position={[0, 0, 4]} isRunning={false} />
      <AreaLabel position={[-2, 1.5, 4]} text="制冷机房" />
      
      <OrbitControls 
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export default function Park3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 6, 8], fov: 50 }}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  )
}
