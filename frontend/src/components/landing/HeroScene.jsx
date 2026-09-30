import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerformanceMonitor, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { usePointerRef } from './hooks.js';
import { makeGlowTexture, mulberry32 } from './sceneUtils.js';

/* ------------------------------------------------------------------ */
/* Deterministic layout helpers                                        */
/* ------------------------------------------------------------------ */

const STUDENT_COLOR = '#7dd3fc';
const ATTENTION_COLOR = '#fbbf24';
const MENTOR_ZERO = new THREE.Vector3(0, 0, 0);

/** Students spread over a sphere (Fibonacci lattice); a few are flagged "needs attention". */
const buildNodes = (count) => {
  const rand = mulberry32(11);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const attention = new Set([3, 9, 14].filter((i) => i < count));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const radius = 2.4 + rand() * 1.0;
    return {
      base: new THREE.Vector3(Math.cos(theta) * ring, y * 0.85, Math.sin(theta) * ring).multiplyScalar(radius),
      phase: rand() * Math.PI * 2,
      speed: 0.4 + rand() * 0.5,
      size: 0.1 + rand() * 0.06,
      attention: attention.has(i),
    };
  });
};

/** Every student connects to the mentor; a handful also connect to their nearest peer. */
const buildLinks = (nodes) => {
  const links = nodes.map((_, i) => ({ a: -1, b: i }));
  const seen = new Set();
  const maxPeers = Math.round(nodes.length * 0.45);
  for (let i = 0; i < nodes.length && seen.size < maxPeers; i += 2) {
    let nearest = -1;
    let best = Infinity;
    for (let j = 0; j < nodes.length; j += 1) {
      if (j === i) continue;
      const d = nodes[i].base.distanceToSquared(nodes[j].base);
      if (d < best) {
        best = d;
        nearest = j;
      }
    }
    const key = i < nearest ? `${i}-${nearest}` : `${nearest}-${i}`;
    if (nearest >= 0 && !seen.has(key)) {
      seen.add(key);
      links.push({ a: i, b: nearest });
    }
  }
  return links;
};

/* ------------------------------------------------------------------ */
/* Scene parts                                                         */
/* ------------------------------------------------------------------ */

/** Slow spin + gentle pointer parallax on the whole network and the camera. */
const Rig = ({ reduced, pointerRef, children }) => {
  const group = useRef();
  useFrame((state, delta) => {
    if (reduced || !group.current) return;
    const pointer = pointerRef.current;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, pointer.y * 0.22, 3, delta);
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, pointer.x * 0.9, 3, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, pointer.y * 0.6, 3, delta);
    state.camera.lookAt(0, 0, 0);
  });
  return <group ref={group}>{children}</group>;
};

/** Glowing mentor at the centre: faceted core, wireframe shell, two orbit rings, soft halo. */
const MentorCore = ({ reduced }) => {
  const core = useRef();
  const shell = useRef();
  const rings = useRef();
  const glow = useMemo(() => makeGlowTexture('147,197,253'), []);
  useEffect(() => () => glow.dispose(), [glow]);

  useFrame((_, delta) => {
    if (reduced) return;
    core.current.rotation.y += delta * 0.4;
    shell.current.rotation.y -= delta * 0.25;
    shell.current.rotation.x += delta * 0.1;
    rings.current.rotation.z += delta * 0.18;
  });

  return (
    <group>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshStandardMaterial color="#2563eb" emissive="#3b82f6" emissiveIntensity={1.15} roughness={0.3} metalness={0.5} flatShading />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.02, 1]} />
        <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.3} />
      </mesh>
      <group ref={rings}>
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.45, 0.007, 8, 96]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 1.7, 0.5, 0]}>
          <torusGeometry args={[1.85, 0.006, 8, 96]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
        </mesh>
      </group>
      <sprite scale={[7, 7, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
};

/**
 * Students (instanced spheres + halos), mentor/peer links (one LineSegments),
 * and data pulses travelling from mentor to students (instanced). All motion is
 * computed in a single useFrame, with no allocations per frame.
 */
const StudentNetwork = ({ count, reduced }) => {
  const invalidate = useThree((s) => s.invalidate);
  const nodesRef = useRef();
  const haloRef = useRef();
  const pulsesRef = useRef();

  const nodes = useMemo(() => buildNodes(count), [count]);
  const links = useMemo(() => buildLinks(nodes), [nodes]);
  const current = useMemo(() => nodes.map(() => new THREE.Vector3()), [nodes]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pulseCount = count > 12 ? 9 : 5;

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(links.length * 6), 3));
    const colors = new Float32Array(links.length * 6);
    links.forEach((link, k) => {
      const strength = link.a < 0 ? 1 : 0.32; // student-to-student links are quieter
      for (let v = 0; v < 2; v += 1) {
        colors.set([0.38 * strength, 0.66 * strength, 1 * strength], k * 6 + v * 3);
      }
    });
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [links]);
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry]);

  useLayoutEffect(() => {
    const color = new THREE.Color();
    nodes.forEach((node, i) => {
      nodesRef.current.setColorAt(i, color.set(node.attention ? ATTENTION_COLOR : STUDENT_COLOR));
      haloRef.current.setColorAt(i, color.set(node.attention ? '#f59e0b' : '#3b82f6'));
    });
    nodesRef.current.instanceColor.needsUpdate = true;
    haloRef.current.instanceColor.needsUpdate = true;
    invalidate();
  }, [nodes, invalidate]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const m = reduced ? 0 : 1;

    for (let i = 0; i < count; i += 1) {
      const n = nodes[i];
      current[i].set(
        n.base.x + Math.sin(t * n.speed + n.phase) * 0.14 * m,
        n.base.y + Math.cos(t * n.speed * 0.8 + n.phase) * 0.18 * m,
        n.base.z + Math.sin(t * n.speed * 0.6 + n.phase * 1.3) * 0.12 * m
      );
      const pulse = 1 + 0.18 * Math.sin(t * 2 + n.phase) * m;
      dummy.position.copy(current[i]);
      dummy.scale.setScalar(n.size * pulse);
      dummy.updateMatrix();
      nodesRef.current.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(n.size * 3.4 * pulse);
      dummy.updateMatrix();
      haloRef.current.setMatrixAt(i, dummy.matrix);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
    haloRef.current.instanceMatrix.needsUpdate = true;

    const positions = lineGeometry.attributes.position.array;
    for (let k = 0; k < links.length; k += 1) {
      const a = links[k].a < 0 ? MENTOR_ZERO : current[links[k].a];
      const b = current[links[k].b];
      positions[k * 6] = a.x;
      positions[k * 6 + 1] = a.y;
      positions[k * 6 + 2] = a.z;
      positions[k * 6 + 3] = b.x;
      positions[k * 6 + 4] = b.y;
      positions[k * 6 + 5] = b.z;
    }
    lineGeometry.attributes.position.needsUpdate = true;

    // Pulses: small packets leaving the mentor toward a student, fading in and out.
    const stride = Math.max(1, Math.floor(count / pulseCount));
    for (let p = 0; p < pulseCount; p += 1) {
      const target = current[(p * stride) % count];
      const phase = reduced ? 0.55 : (t * 0.32 + p / pulseCount) % 1;
      const eased = phase * phase * (3 - 2 * phase);
      dummy.position.copy(target).multiplyScalar(eased);
      dummy.scale.setScalar(0.055 * Math.sin(Math.PI * phase) + 0.001);
      dummy.updateMatrix();
      pulsesRef.current.setMatrixAt(p, dummy.matrix);
    }
    pulsesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <lineSegments geometry={lineGeometry} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <instancedMesh ref={haloRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial transparent opacity={0.13} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>

      <instancedMesh ref={nodesRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial />
      </instancedMesh>

      <instancedMesh ref={pulsesRef} args={[undefined, undefined, pulseCount]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#e0f2fe" />
      </instancedMesh>
    </group>
  );
};

const makeAcademicMaterials = () => ({
  cover: new THREE.MeshStandardMaterial({ color: '#1d4ed8', emissive: '#1e40af', emissiveIntensity: 0.55, roughness: 0.45 }),
  pages: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.8 }),
  spine: new THREE.MeshStandardMaterial({ color: '#22d3ee', emissive: '#0891b2', emissiveIntensity: 0.6 }),
  capBase: new THREE.MeshStandardMaterial({ color: '#0f1f4d', emissive: '#1e3a8a', emissiveIntensity: 0.5, roughness: 0.5 }),
  capBoard: new THREE.MeshStandardMaterial({ color: '#111c45', emissive: '#2563eb', emissiveIntensity: 0.35, roughness: 0.4 }),
  gold: new THREE.MeshStandardMaterial({ color: '#fbbf24', emissive: '#f59e0b', emissiveIntensity: 0.7 }),
  violet: new THREE.MeshStandardMaterial({ color: '#8b5cf6', emissive: '#7c3aed', emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.3, flatShading: true }),
});

const Book = ({ mats, speed, ...props }) => (
  <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.7}>
    <group {...props}>
      <mesh material={mats.cover} position={[0, 0, 0.075]}><boxGeometry args={[0.6, 0.82, 0.03]} /></mesh>
      <mesh material={mats.cover} position={[0, 0, -0.075]}><boxGeometry args={[0.6, 0.82, 0.03]} /></mesh>
      <mesh material={mats.pages} position={[0.015, 0, 0]}><boxGeometry args={[0.55, 0.78, 0.12]} /></mesh>
      <mesh material={mats.spine} position={[-0.29, 0, 0]}><boxGeometry args={[0.05, 0.82, 0.18]} /></mesh>
    </group>
  </Float>
);

const Cap = ({ mats, speed, ...props }) => (
  <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
    <group {...props}>
      <mesh material={mats.capBase} position={[0, -0.14, 0]}><cylinderGeometry args={[0.3, 0.34, 0.24, 20]} /></mesh>
      <mesh material={mats.capBoard} rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[0.95, 0.05, 0.95]} /></mesh>
      <mesh material={mats.gold} position={[0.3, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.008, 0.008, 0.6, 6]} /></mesh>
      <mesh material={mats.gold} position={[0.6, -0.17, 0]}><cylinderGeometry args={[0.01, 0.01, 0.3, 6]} /></mesh>
      <mesh material={mats.gold} position={[0.6, -0.34, 0]}><sphereGeometry args={[0.045, 10, 10]} /></mesh>
    </group>
  </Float>
);

const Atom = ({ mats, speed, ...props }) => (
  <Float speed={speed} rotationIntensity={0.8} floatIntensity={0.5}>
    <group {...props}>
      <mesh material={mats.violet}><octahedronGeometry args={[0.18, 0]} /></mesh>
      <mesh material={mats.spine} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.42, 0.014, 8, 40]} /></mesh>
      <mesh material={mats.spine} rotation={[Math.PI / 3, Math.PI / 3, 0]}><torusGeometry args={[0.42, 0.014, 8, 40]} /></mesh>
    </group>
  </Float>
);

/** Small, cheap academic props built from primitives, floating around the network. */
const AcademicProps = ({ reduced, compact }) => {
  const mats = useMemo(makeAcademicMaterials, []);
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);
  const speed = reduced ? 0 : 1.3;

  return (
    <group>
      <Book mats={mats} speed={speed} position={[-3.7, 1.7, 0.6]} rotation={[0.4, 0.6, 0.35]} />
      <Book mats={mats} speed={speed} position={[3.6, -1.9, -0.6]} rotation={[-0.3, -0.7, -0.4]} scale={0.9} />
      <Cap mats={mats} speed={speed} position={[3.0, 2.4, 0.8]} rotation={[0.35, 0.3, 0.2]} />
      <Cap mats={mats} speed={speed} position={[-3.0, -2.4, 0.6]} rotation={[0.3, -0.5, -0.25]} scale={0.9} />
      {!compact && <Atom mats={mats} speed={speed} position={[0.3, 3.6, -0.8]} />}
      {!compact && <Atom mats={mats} speed={speed} position={[-0.5, -3.6, 0.9]} scale={0.85} />}
    </group>
  );
};

/** Sparse background dust. */
const Particles = ({ count, reduced }) => {
  const ref = useRef();
  const positions = useMemo(() => {
    const rand = mulberry32(5);
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 6 + rand() * 9;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      array[i * 3 + 2] = radius * Math.cos(phi) - 2;
    }
    return array;
  }, [count]);

  useFrame((_, delta) => {
    if (reduced || !ref.current) return;
    ref.current.rotation.y += delta * 0.02;
    ref.current.rotation.x += delta * 0.006;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#93c5fd" size={0.075} sizeAttenuation depthWrite={false} opacity={0.75} />
    </Points>
  );
};

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

/**
 * @param reduced  user prefers reduced motion: render a single static frame
 * @param compact  small/touch screen: fewer nodes and particles, lower pixel ratio
 * @param active   scene is on screen: when false the render loop is paused
 */
const HeroScene = ({ reduced = false, compact = false, active = true }) => {
  const pointerRef = usePointerRef(!reduced && !compact);
  const maxDpr = compact ? 1.25 : 1.75;
  const [dpr, setDpr] = useState(maxDpr);

  return (
    <Canvas
      flat
      dpr={dpr}
      frameloop={reduced ? 'demand' : active ? 'always' : 'never'}
      camera={{ position: [0, 0, compact ? 12 : 10.5], fov: 45, near: 0.1, far: 60 }}
      gl={{ antialias: !compact, alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 4]} intensity={1.6} />
      <pointLight position={[0, 0, 0]} intensity={30} color="#60a5fa" distance={14} />

      <Rig reduced={reduced} pointerRef={pointerRef}>
        <MentorCore reduced={reduced} />
        <StudentNetwork count={compact ? 10 : 18} reduced={reduced} />
        <AcademicProps reduced={reduced} compact={compact} />
      </Rig>
      <Particles count={compact ? 110 : 320} reduced={reduced} />
    </Canvas>
  );
};

export default HeroScene;
