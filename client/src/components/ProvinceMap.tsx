import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useMemo, useEffect, useState } from "react";
import { Shape, ExtrudeGeometry } from "three";
import boundaries from "@/data/rwanda.json";
import { useDashboard } from "@/lib/dashboard-store";

function Provinces({ palette }: { palette: string[] }) {
  const { region, setRegion } = useDashboard();
  const items = useMemo(
    () =>
      boundaries.features.map((f) => {
        const shape = new Shape();
        const ring = f.geometry.coordinates[0] ?? [];
        ring.forEach((p, i) => {
          const x = ((p[0] ?? 29.9) - 29.9) * 3.7,
            y = ((p[1] ?? -2) + 2.0) * 3.7;
          if (i === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
        });
        shape.closePath();
        return {
          name: f.properties.shapeName,
          geometry: new ExtrudeGeometry(shape, { depth: 0.17, bevelEnabled: false }),
        };
      }),
    [],
  );
  useEffect(() => () => items.forEach((x) => x.geometry.dispose()), [items]);
  return (
    <group rotation={[-Math.PI / 2, 0, -0.12]}>
      {items.map((item, i) => (
        <mesh
          key={item.name}
          geometry={item.geometry}
          onClick={(e) => {
            e.stopPropagation();
            setRegion(item.name);
          }}
        >
          <meshStandardMaterial
            color={(region === item.name ? palette[5] : palette[i]) ?? palette[0] ?? ""}
            roughness={0.7}
            metalness={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}
export default function ProvinceMap() {
  const [palette, setPalette] = useState<string[]>([]);
  useEffect(() => {
    const s = getComputedStyle(document.documentElement);
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    setPalette(
      Array.from({ length: 6 }, (_, i) => {
        context.fillStyle = s.getPropertyValue(`--map-${i + 1}`).trim();
        context.fillRect(0, 0, 1, 1);
        const data = context.getImageData(0, 0, 1, 1).data;
        return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
      }),
    );
  }, []);
  if (!palette.length) return <div className="map-loading">Loading geography…</div>;
  return (
    <Canvas
      dpr={1}
      orthographic
      camera={{ position: [0, 6, 5], zoom: 49 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 8, 5]} intensity={2} />
      <Environment resolution={64}>
        <Lightformer intensity={1} position={[0, 5, 0]} scale={[10, 10, 1]} />
      </Environment>
      <Provinces palette={palette} />
      <OrbitControls
        enablePan={false}
        enableZoom
        minZoom={36}
        maxZoom={90}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={0.1}
      />
    </Canvas>
  );
}
