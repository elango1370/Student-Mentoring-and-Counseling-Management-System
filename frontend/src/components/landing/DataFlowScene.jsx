import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePointerRef } from './hooks.js';
import { makeGlowTexture } from './sceneUtils.js';
import { FLOW_STEPS } from './flowSteps.js';

const STEP_SECONDS = 0.75; // time to draw one connection
const TUBE_SEGMENTS = 40;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => t * t * (3 - 2 * t);
const easeOutBack = (t) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

// Nodes wind down a shallow helix so the chain reads as 3D but stays top-to-bottom.
const POSITIONS = FLOW_STEPS.map((_, i) => new THREE.Vector3(Math.sin(i * 1.25) * 1.3, 2.4 - i * 0.96, Math.cos(i * 1.25) * 0.95));

/** A small glyph per step, so each stage is recognisable without labels. */
const Glyph = ({ id, material }) => {
  switch (id) {
    case 'mentor':
      return (
        <group>
          <mesh material={material}><icosahedronGeometry args={[0.36, 1]} /></mesh>
          <mesh><icosahedronGeometry args={[0.52, 1]} /><meshBasicMaterial color="#93c5fd" wireframe transparent opacity={0.35} /></mesh>
        </group>
      );
    case 'students':
      return (
        <group>
          {[[0, 0.26, 0], [0.27, -0.12, 0.1], [-0.27, -0.12, 0.1], [0.05, -0.1, -0.28], [0, 0, 0.02]].map((p, i) => (
            <mesh key={i} position={p} material={material}><sphereGeometry args={[i === 4 ? 0.13 : 0.11, 14, 14]} /></mesh>
          ))}
        </group>
      );
    case 'academic':
      return (
        <group>
          {[0.22, 0.4, 0.62].map((h, i) => (
            <mesh key={h} position={[(i - 1) * 0.24, h / 2 - 0.3, 0]} material={material}><boxGeometry args={[0.17, h, 0.17]} /></mesh>
          ))}
        </group>
      );
    case 'attendance':
      return (
        <group rotation={[0.3, 0, 0]}>
          <mesh material={material}><torusGeometry args={[0.32, 0.07, 12, 40, Math.PI * 1.6]} /></mesh>
          <mesh material={material}><sphereGeometry args={[0.09, 12, 12]} /></mesh>
        </group>
      );
    case 'counseling':
      return (
        <group>
          <mesh position={[-0.12, 0.08, 0]} material={material}><sphereGeometry args={[0.26, 16, 16]} /></mesh>
          <mesh position={[0.2, -0.14, 0.08]} material={material}><sphereGeometry args={[0.17, 16, 16]} /></mesh>
        </group>
      );
    default:
      return <mesh material={material}><octahedronGeometry args={[0.4, 0]} /></mesh>;
  }
};

const Flow = ({ active, reduced, compact, runId, onStep }) => {
  const total = FLOW_STEPS.length;
  const group = useRef();
  const progress = useRef(reduced ? total - 1 : 0);
  const reported = useRef(-2);
  const nodeRefs = useRef([]);
  const tubeRefs = useRef([]);
  const dotsRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pointerRef = usePointerRef(!reduced && !compact);
  const invalidate = useThree((s) => s.invalidate);

  const radial = compact ? 5 : 8;
  const dotCount = compact ? 0 : 10;

  const curves = useMemo(
    () =>
      POSITIONS.slice(0, -1).map((a, i) => {
        const b = POSITIONS[i + 1];
        const bulge = new THREE.Vector3(i % 2 ? -0.45 : 0.45, 0, i % 2 ? -0.3 : 0.3);
        return new THREE.QuadraticBezierCurve3(a, a.clone().add(b).multiplyScalar(0.5).add(bulge), b);
      }),
    []
  );
  const tubes = useMemo(() => curves.map((c) => new THREE.TubeGeometry(c, TUBE_SEGMENTS, 0.028, radial, false)), [curves, radial]);
  const tubeMaterials = useMemo(
    () => FLOW_STEPS.slice(1).map((s) => new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })),
    []
  );
  const nodeMaterials = useMemo(
    () => FLOW_STEPS.map((s) => new THREE.MeshStandardMaterial({ color: s.color, emissive: s.color, emissiveIntensity: 0.75, roughness: 0.35, metalness: 0.3, flatShading: true })),
    []
  );
  const glowTextures = useMemo(() => FLOW_STEPS.map((s) => makeGlowTexture(`${parseInt(s.color.slice(1, 3), 16)},${parseInt(s.color.slice(3, 5), 16)},${parseInt(s.color.slice(5, 7), 16)}`)), []);

  useEffect(
    () => () => {
      tubes.forEach((t) => t.dispose());
      tubeMaterials.forEach((m) => m.dispose());
      nodeMaterials.forEach((m) => m.dispose());
      glowTextures.forEach((t) => t.dispose());
    },
    [tubes, tubeMaterials, nodeMaterials, glowTextures]
  );

  // "Replay": start the chain again from the beginning.
  useEffect(() => {
    progress.current = reduced ? total - 1 : 0;
    reported.current = -2;
    invalidate();
  }, [runId, reduced, total, invalidate]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (active && !reduced) progress.current = Math.min(total - 1, progress.current + delta / STEP_SECONDS);
    const p = progress.current;

    // Connections draw themselves one after another.
    for (let i = 0; i < total - 1; i += 1) {
      const mesh = tubeRefs.current[i];
      if (!mesh) continue;
      const segments = Math.floor(easeInOut(clamp01(p - i)) * TUBE_SEGMENTS);
      mesh.geometry.setDrawRange(0, segments * radial * 6);
      mesh.visible = segments > 0;
    }

    // Each node pops in as the connection into it finishes.
    let revealed = -1;
    for (let i = 0; i < total; i += 1) {
      const appear = i === 0 ? clamp01(p / 0.4) : clamp01((p - (i - 1) - 0.6) / 0.4);
      const node = nodeRefs.current[i];
      if (node) {
        node.visible = appear > 0;
        node.scale.setScalar(Math.max(0.0001, easeOutBack(appear)));
        node.rotation.y = reduced ? 0.3 : Math.sin(t * 0.6 + i) * 0.55; // gentle sway keeps flat glyphs (rings) facing the camera
      }
      if (appear > 0.6) revealed = i;
    }
    if (revealed !== reported.current) {
      reported.current = revealed;
      onStep(revealed);
    }

    // Small packets flowing along finished connections.
    if (dotsRef.current) {
      for (let d = 0; d < dotCount; d += 1) {
        const link = d % (total - 1);
        const u = reduced ? 0.5 : (t * 0.22 + d / dotCount) % 1;
        const done = p >= link + 1;
        dummy.position.copy(curves[link].getPoint(u));
        dummy.scale.setScalar(done ? 0.06 * Math.sin(Math.PI * u) + 0.001 : 0.0001);
        dummy.updateMatrix();
        dotsRef.current.setMatrixAt(d, dummy.matrix);
      }
      dotsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (group.current && !reduced) {
      const pointer = pointerRef.current;
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, Math.sin(t * 0.3) * 0.3 + pointer.x * 0.25, 3, delta);
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * 0.12, 3, delta);
    }
  });

  return (
    <group ref={group}>
      {tubes.map((geometry, i) => (
        <mesh key={i} ref={(el) => { tubeRefs.current[i] = el; }} geometry={geometry} material={tubeMaterials[i]} visible={false} frustumCulled={false} />
      ))}

      {FLOW_STEPS.map((step, i) => (
        <group key={step.id} ref={(el) => { nodeRefs.current[i] = el; }} position={POSITIONS[i]} visible={false}>
          <Glyph id={step.id} material={nodeMaterials[i]} />
          <sprite scale={[2.1, 2.1, 1]}>
            <spriteMaterial map={glowTextures[i]} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      ))}

      {dotCount > 0 && (
        <instancedMesh ref={dotsRef} args={[undefined, undefined, dotCount]} frustumCulled={false}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#e0f2fe" />
        </instancedMesh>
      )}
    </group>
  );
};

/**
 * @param active   the section has entered the viewport: start drawing the chain
 * @param visible  the section is currently on screen: when false the render loop is paused
 * @param runId    increment to replay the animation
 * @param onStep   called with the index of the last revealed node (-1 = none yet)
 */
const DataFlowScene = ({ active, visible = true, reduced = false, compact = false, runId = 0, onStep }) => (
  <Canvas
    flat
    dpr={compact ? [1, 1.25] : [1, 1.75]}
    frameloop={reduced ? 'demand' : visible ? 'always' : 'never'}
    camera={{ position: [0, 0, compact ? 11.5 : 10.5], fov: 40, near: 0.1, far: 40 }}
    gl={{ antialias: !compact, alpha: true }}
    onCreated={({ gl }) => {
      gl.setClearColor(0x000000, 0);
      gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());
    }}
  >
    <ambientLight intensity={0.8} />
    <directionalLight position={[4, 5, 5]} intensity={1.5} />
    <Flow active={active} reduced={reduced} compact={compact} runId={runId} onStep={onStep} />
  </Canvas>
);

export default DataFlowScene;
