"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { Group } from "three";

export interface ComboBarDatum {
  label: string;
  net: number;
  index: number;
}

function cssVarColor(name: string): string {
  if (typeof document === "undefined") return "#4066c4";
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !value) return "#4066c4";
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const data = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
}

function Bars({ data, colors }: { data: ComboBarDatum[]; colors: string[] }) {
  const group = useRef<Group>(null);
  const max = Math.max(1, ...data.map((d) => Math.abs(d.net)));
  const gap = 1.25;
  const width = 0.85;
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.12;
  });
  return (
    <group ref={group} rotation={[0.1, -0.5, 0]}>
      {data.map((d, i) => {
        const height = Math.max(0.08, (Math.abs(d.net) / max) * 2.6);
        const x = (i - (data.length - 1) / 2) * gap;
        return (
          <mesh key={d.label} position={[x, height / 2, 0]}>
            <boxGeometry args={[width, height, width]} />
            <meshStandardMaterial
              color={colors[i % colors.length]}
              roughness={0.55}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function ComboBars3D({ data }: { data: ComboBarDatum[] }) {
  const [colors, setColors] = useState<string[]>([]);
  useEffect(() => {
    setColors([
      cssVarColor("--chart-a"),
      cssVarColor("--success"),
      cssVarColor("--warning"),
      cssVarColor("--chart-b"),
    ]);
  }, []);

  const prepared = useMemo(() => data.slice(0, 6), [data]);

  if (!colors.length || !prepared.length) {
    return (
      <div className="three-fallback">
        {prepared.length ? "Preparing 3D view…" : "No combinations to visualise for these filters."}
      </div>
    );
  }

  return (
    <Canvas
      dpr={1}
      camera={{ position: [0, 2.4, 6], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 8, 6]} intensity={1.8} />
      <Environment resolution={64}>
        <Lightformer intensity={1} position={[0, 5, 0]} scale={[10, 10, 1]} />
      </Environment>
      <Bars data={prepared} colors={colors} />
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={11}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}
