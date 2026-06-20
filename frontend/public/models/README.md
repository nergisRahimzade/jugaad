# Drop your 3D model here

Place a `.glb` or `.gltf` file (e.g. `jugaad.glb`) in this folder.

Then update `src/components/ModelCanvas.tsx` to load it with `@react-three/drei`'s `useGLTF`:

```tsx
import { useGLTF } from "@react-three/drei";

function YourModel() {
  const { scene } = useGLTF("/models/jugaad.glb");
  return <primitive object={scene} scale={1.5} />;
}
```

The hero currently shows a placeholder orb with orbiting agent nodes until you swap in your asset.
