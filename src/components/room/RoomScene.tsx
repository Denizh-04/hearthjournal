import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Feel constants
const SPEED = 2.2;
const LOOK = 0.004;
const BOUNDS = { x: 2.6, zMin: -0.6, zMax: 3.2 };
const EYE = 1.55;
const JOURNAL_POS = new THREE.Vector3(0, 0.82, -1.2);

function woodTexture(base: string, line: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = line; g.fillRect(0, i * 32, 256, 2);
    for (let k = 0; k < 40; k++) { g.globalAlpha = 0.08; g.fillRect(Math.random() * 256, i * 32 + Math.random() * 30, 40 + Math.random() * 60, 1); }
    g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function wallTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e9d6bd"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#dcc4a6";
  for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 10, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Player({ onNear }: { onNear: (near: boolean) => void }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(-0.25);
  const pos = useRef(new THREE.Vector3(0, EYE, 2.6));
  const wasNear = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    let dragging = false; let lx = 0; let ly = 0;
    const el = gl.domElement;
    const pd = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; };
    const pm = (e: PointerEvent) => {
      if (!dragging) return;
      yaw.current -= (e.clientX - lx) * LOOK; pitch.current = THREE.MathUtils.clamp(pitch.current - (e.clientY - ly) * LOOK, -0.8, 0.5);
      lx = e.clientX; ly = e.clientY;
    };
    const pu = () => (dragging = false);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    el.addEventListener("pointerdown", pd); window.addEventListener("pointermove", pm); window.addEventListener("pointerup", pu);
    return () => {
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      el.removeEventListener("pointerdown", pd); window.removeEventListener("pointermove", pm); window.removeEventListener("pointerup", pu);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;
    const f = (k["KeyW"] || k["ArrowUp"] ? 1 : 0) - (k["KeyS"] || k["ArrowDown"] ? 1 : 0);
    const s = (k["KeyD"] ? 1 : 0) - (k["KeyA"] ? 1 : 0);
    if (k["ArrowLeft"]) yaw.current += 1.6 * dt;
    if (k["ArrowRight"]) yaw.current -= 1.6 * dt;
    const fwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    pos.current.addScaledVector(fwd, f * SPEED * dt).addScaledVector(right, s * SPEED * dt);
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -BOUNDS.x, BOUNDS.x);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, BOUNDS.zMin, BOUNDS.zMax);
    pos.current.y = EYE + Math.sin(performance.now() / 300) * 0.01 * (f || s ? 1 : 0);
    camera.position.copy(pos.current);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    const near = pos.current.distanceTo(JOURNAL_POS) < 2.2;
    if (near !== wasNear.current) { wasNear.current = near; onNear(near); }
  });
  return null;
}

function Journal({ onOpen }: { onOpen: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = JOURNAL_POS.y + 0.03 + Math.sin(clock.elapsedTime * 2) * 0.012;
  });
  useEffect(() => { document.body.style.cursor = hover ? "pointer" : "auto"; return () => { document.body.style.cursor = "auto"; }; }, [hover]);
  return (
    <group ref={ref} position={JOURNAL_POS} rotation={[0, 0.3, 0]}
      onClick={(e) => { e.stopPropagation(); onOpen(); }}
      onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
      <RoundedBox args={[0.42, 0.06, 0.32]} radius={0.015}>
        <meshStandardMaterial color="#8a3b2c" roughness={0.6} emissive="#ff9a4a" emissiveIntensity={hover ? 0.35 : 0.1} />
      </RoundedBox>
      <mesh position={[0.012, 0, 0]}><boxGeometry args={[0.4, 0.045, 0.3]} /><meshStandardMaterial color="#f5ead3" /></mesh>
      <mesh position={[0.12, 0.031, 0]}><boxGeometry args={[0.02, 0.002, 0.33]} /><meshStandardMaterial color="#d8a94a" metalness={0.6} roughness={0.3} /></mesh>
      <pointLight position={[0, 0.3, 0]} intensity={hover ? 1.2 : 0.5} distance={1.2} color="#ffb070" />
    </group>
  );
}

function Furniture() {
  const tableWood = useMemo(() => woodTexture("#7a4a2c", "#5c361e"), []);
  return (
    <group>
      {/* Table */}
      <mesh position={[0, 0.76, -1.2]} castShadow receiveShadow><boxGeometry args={[1.6, 0.06, 0.9]} /><meshStandardMaterial map={tableWood} roughness={0.7} /></mesh>
      {[[-0.72, -0.8], [0.72, -0.8], [-0.72, -1.6], [0.72, -1.6]].map(([x = 0, z = 0], i) => (
        <mesh key={i} position={[x, 0.37, z]} castShadow><cylinderGeometry args={[0.035, 0.03, 0.74]} /><meshStandardMaterial map={tableWood} /></mesh>
      ))}
      {/* Mug */}
      <mesh position={[-0.45, 0.85, -1.15]} castShadow><cylinderGeometry args={[0.05, 0.045, 0.12, 20]} /><meshStandardMaterial color="#5e8c7a" roughness={0.4} /></mesh>
      {/* Desk lamp */}
      <group position={[0.55, 0.79, -1.45]}>
        <mesh><cylinderGeometry args={[0.08, 0.1, 0.03]} /><meshStandardMaterial color="#2f2a26" /></mesh>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.012, 0.012, 0.4]} /><meshStandardMaterial color="#2f2a26" /></mesh>
        <mesh position={[0, 0.42, 0]}><coneGeometry args={[0.13, 0.15, 24, 1, true]} /><meshStandardMaterial color="#e8c48a" side={THREE.DoubleSide} emissive="#ffcf8a" emissiveIntensity={0.4} /></mesh>
        <pointLight position={[0, 0.36, 0]} intensity={4} distance={4} color="#ffc27a" castShadow />
      </group>
      {/* Chair */}
      <group position={[0, 0, -0.45]}>
        <mesh position={[0, 0.46, 0]} castShadow><boxGeometry args={[0.5, 0.05, 0.48]} /><meshStandardMaterial map={tableWood} /></mesh>
        <mesh position={[0, 0.78, 0.22]} castShadow><boxGeometry args={[0.5, 0.6, 0.05]} /><meshStandardMaterial map={tableWood} /></mesh>
        {[[-0.21, -0.2], [0.21, -0.2], [-0.21, 0.2], [0.21, 0.2]].map(([x = 0, z = 0], i) => (
          <mesh key={i} position={[x, 0.22, z]}><boxGeometry args={[0.04, 0.44, 0.04]} /><meshStandardMaterial map={tableWood} /></mesh>
        ))}
      </group>
      {/* Bookshelf */}
      <group position={[-2.6, 0, -1.6]}>
        <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[0.9, 2, 0.35]} /><meshStandardMaterial color="#5a3a24" /></mesh>
        {[0.45, 0.95, 1.45].map((y, row) => (
          <group key={y} position={[0, y, 0.05]}>
            {Array.from({ length: 7 }).map((_, i) => (
              <mesh key={i} position={[-0.33 + i * 0.105, 0.13 + ((i + row) % 3) * 0.015, 0]}>
                <boxGeometry args={[0.08, 0.28 + ((i * 7 + row) % 4) * 0.03, 0.22]} />
                <meshStandardMaterial color={["#b5523b", "#d9a648", "#4f7d6a", "#e8d9b8", "#6b4f8a", "#c97b54", "#36506b"][(i + row * 2) % 7] ?? "#b5523b"} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      {/* Plant */}
      <group position={[2.5, 0, -1.6]}>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.2, 0.15, 0.44, 20]} /><meshStandardMaterial color="#c4654a" /></mesh>
        {[[0, 0.75, 0, 0.32], [0.18, 0.62, 0.05, 0.22], [-0.16, 0.66, -0.04, 0.24], [0.02, 1.0, 0.04, 0.2]].map(([x = 0, y = 0, z = 0, r = 0.2], i) => (
          <mesh key={i} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={i % 2 ? "#5f8a4e" : "#4a7340"} flatShading /></mesh>
        ))}
      </group>
      {/* Rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.6]} receiveShadow><circleGeometry args={[1.5, 48]} /><meshStandardMaterial color="#b9705a" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0.6]}><ringGeometry args={[1.15, 1.25, 48]} /><meshStandardMaterial color="#e8c48a" /></mesh>
      {/* Window */}
      <group position={[1.4, 1.6, -2.48]}>
        <mesh><planeGeometry args={[1.2, 1]} /><meshStandardMaterial color="#2c3e6b" emissive="#3a5a9a" emissiveIntensity={0.6} /></mesh>
        <mesh position={[0.25, 0.2, 0.01]}><circleGeometry args={[0.09, 24]} /><meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={1.5} /></mesh>
        <mesh position={[0, 0, 0.02]}><boxGeometry args={[1.28, 0.06, 0.05]} /><meshStandardMaterial color="#f2e6d0" /></mesh>
        <mesh position={[0, 0, 0.02]}><boxGeometry args={[0.06, 1.08, 0.05]} /><meshStandardMaterial color="#f2e6d0" /></mesh>
        <mesh position={[0, 0.52, 0.02]}><boxGeometry args={[1.3, 0.06, 0.06]} /><meshStandardMaterial color="#f2e6d0" /></mesh>
        <mesh position={[0, -0.54, 0.06]}><boxGeometry args={[1.4, 0.06, 0.16]} /><meshStandardMaterial color="#f2e6d0" /></mesh>
      </group>
      {/* String lights */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-2.7 + i * 0.49, 2.55 - Math.sin((i / 11) * Math.PI) * 0.18, -2.4]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#ffd27a" emissive="#ffb84a" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

function Room() {
  const floor = useMemo(() => { const t = woodTexture("#a8754a", "#8a5a36"); t.repeat.set(3, 3); return t; }, []);
  const wall = useMemo(wallTexture, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6.4, 6.4]} /><meshStandardMaterial map={floor} roughness={0.8} /></mesh>
      <mesh position={[0, 1.5, -2.5]} receiveShadow><planeGeometry args={[6.4, 3]} /><meshStandardMaterial map={wall} /></mesh>
      <mesh position={[-3.2, 1.5, 0.7]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[6.4, 3]} /><meshStandardMaterial map={wall} /></mesh>
      <mesh position={[3.2, 1.5, 0.7]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[6.4, 3]} /><meshStandardMaterial map={wall} /></mesh>
      <mesh position={[0, 1.5, 3.9]} rotation={[0, Math.PI, 0]}><planeGeometry args={[6.4, 3]} /><meshStandardMaterial map={wall} /></mesh>
      <mesh position={[0, 3, 0.7]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[6.4, 6.4]} /><meshStandardMaterial color="#d9c2a3" /></mesh>
      <Furniture />
    </group>
  );
}

export function RoomScene({ onOpen }: { onOpen: () => void }) {
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "KeyE" && near) onOpen(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [near, onOpen]);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "" : undefined}>
      <Canvas shadows camera={{ fov: 62, near: 0.05, far: 30 }} onCreated={() => setTimeout(() => setReady(true), 300)}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
        <color attach="background" args={["#1d1712"]} />
        <fog attach="fog" args={["#2a1e15", 6, 14]} />
        <ambientLight intensity={0.35} color="#ffd9b0" />
        <hemisphereLight args={["#ffe2bd", "#5a3a24", 0.5]} />
        <Environment resolution={64}>
          <Lightformer intensity={1.2} position={[0, 4, 0]} scale={[8, 8, 1]} color="#ffd9a8" />
          <Lightformer intensity={0.6} color="#7f9bd6" position={[3, 1.5, -2]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
        </Environment>
        <Room />
        <Journal onOpen={onOpen} />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={8} blur={2.5} far={2} />
        <Player onNear={setNear} />
        {near && (
          <Html position={[0, 1.15, -1.2]} center>
            <div className="pointer-events-none whitespace-nowrap rounded-full bg-card px-3 py-1 text-xs font-semibold text-card-foreground shadow-lg animate-rise">
              Click the journal or press E
            </div>
          </Html>
        )}
      </Canvas>
    </div>
  );
}
