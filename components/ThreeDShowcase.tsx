'use client';
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { BOWL_COLORS, SIGNATURE } from '@/data/dishes';
import { Dish } from '@/types/restaurant';
import { useStore } from '@/store/cartStore';
import Spice from './Spice';
const R = 4.2; const STEP = (Math.PI * 2) / SIGNATURE.length;

// Brass biryani handi-style bowl built from a lathe profile, filled with a rice dome and garnish.
function Bowl({ dish, angle, onClick }: { dish: Dish; angle: number; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const profile = useMemo(() => [[0, 0], [0.45, 0], [0.7, 0.12], [1.0, 0.45], [1.15, 0.75], [1.2, 0.85], [1.12, 0.85], [1.05, 0.7], [0.85, 0.4], [0.55, 0.2], [0, 0.18]].map(([x, y]) => new THREE.Vector2(x, y)), []);
  useFrame((st, dt) => {
    const g = ref.current; if (!g || !g.parent) return;
    const front = (Math.cos(angle + g.parent.rotation.y) + 1) / 2;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 0.55 + 0.6 * front * front, 0.15));
    g.position.y = Math.sin(st.clock.elapsedTime * 1.2 + angle) * 0.05 * front; g.rotation.y += dt * 0.25;
  });
  const rice = BOWL_COLORS[dish.id] ?? '#E0A94B';
  return (
    <group position={[Math.sin(angle) * R, 0, Math.cos(angle) * R]}>
      <group ref={ref} onClick={onClick}>
        <mesh><latheGeometry args={[profile, 48]} /><meshStandardMaterial color="#C9973F" metalness={1} roughness={0.25} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.16, 0.045, 12, 64]} /><meshStandardMaterial color="#F2D69C" metalness={1} roughness={0.15} /></mesh>
        <mesh position={[0, 0.62, 0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.9, 48, 32]} /><meshStandardMaterial color={rice} roughness={0.85} /></mesh>
        {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[Math.sin(i * 0.7) * (0.15 + (i % 3) * 0.12), 1.1 - (i % 3) * 0.03, Math.cos(i * 0.7) * (0.15 + (i % 3) * 0.12)]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color={['#6b3a1a', '#2f6b2f', '#E8632B'][i % 3]} /></mesh>)}
      </group>
    </group>
  );
}
function Ring() {
  const ref = useRef<THREE.Group>(null); const sel = useStore((s) => s.selected); const select = useStore((s) => s.select);
  useFrame(() => { if (!ref.current) return; let d = -sel * STEP - ref.current.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); ref.current.rotation.y += d * 0.08; });
  return <group ref={ref}>{SIGNATURE.map((d, i) => <Bowl key={d.id} dish={d} angle={i * STEP} onClick={() => select(i)} />)}</group>;
}
export default function ThreeDShowcase() {
  const sel = useStore((s) => s.selected); const select = useStore((s) => s.select); const add = useStore((s) => s.add);
  const drag = useRef<number | null>(null); const lock = useRef(false);
  const go = (d: number) => select((sel + d + SIGNATURE.length) % SIGNATURE.length); const dish = SIGNATURE[sel];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="panel relative h-[460px] touch-pan-y cursor-grab overflow-hidden md:h-[560px]"
        onPointerDown={(e) => (drag.current = e.clientX)}
        onPointerUp={(e) => { if (drag.current !== null && Math.abs(e.clientX - drag.current) > 50) go(e.clientX < drag.current ? 1 : -1); drag.current = null; }}
        onWheel={(e) => { if (lock.current) return; lock.current = true; go(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1); setTimeout(() => (lock.current = false), 450); }}>
        <Canvas gl={{ alpha: true }} camera={{ position: [0, 3.4, R + 5], fov: 42 }} onCreated={({ camera }) => camera.lookAt(0, 0.6, R)}>
          <ambientLight intensity={0.6} color="#F4E8CB" />
          <spotLight position={[0, 8, R + 2]} angle={0.5} penumbra={0.8} intensity={150} color="#FFE2A8" />
          <pointLight position={[-5, 3, 0]} intensity={25} color="#D6AD65" /><pointLight position={[5, 3, 2]} intensity={15} color="#fff" />
          <Ring /><Sparkles count={50} scale={[14, 5, 14]} size={3} speed={0.3} color="#D6AD65" />
          <ContactShadows position={[0, -0.02, R]} opacity={0.5} scale={10} blur={2.4} far={3} />
        </Canvas>
        <button aria-label="Previous dish" onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-gold/50 bg-charcoal/80 p-2.5 text-champagne"><ChevronLeft /></button>
        <button aria-label="Next dish" onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-gold/50 bg-charcoal/80 p-2.5 text-champagne"><ChevronRight /></button>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">{SIGNATURE.map((d, i) => <button key={d.id} aria-label={d.name} onClick={() => select(i)} className={`h-2 rounded-full transition-all ${i === sel ? 'w-8 bg-gold' : 'w-2 bg-taupe/50'}`} />)}</div>
      </div>
      <aside className="panel flex flex-col justify-center gap-4 p-7">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">Signature {sel + 1} / {SIGNATURE.length}</p>
        <h3 className="font-serif text-3xl leading-tight">{dish.name}</h3><Spice level={dish.spice} /><p className="text-taupe">{dish.description}</p>
        <p className="font-serif text-4xl text-champagne">₹{dish.price}</p><button className="btn-gold" onClick={() => add(dish)}><Plus size={16} />Add to Cart</button>
      </aside>
    </div>
  );
}
