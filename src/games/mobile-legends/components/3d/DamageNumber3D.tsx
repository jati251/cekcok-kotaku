import React from 'react';
import type { FloatingText } from '../../types/combat';

interface DamageNumber3DProps {
  texts: FloatingText[];
}

export const DamageNumber3D: React.FC<DamageNumber3DProps> = ({ texts }) => {
  return (
    <group>
      {texts.map((ft) => (
        <group key={ft.id} position={[ft.position.x, ft.position.y, ft.position.z]}>
          {/* Subtle text aura plane for combat numbers */}
          <mesh>
            <planeGeometry args={[1.2 * ft.scale, 0.5 * ft.scale]} />
            <meshBasicMaterial color={ft.color} transparent opacity={ft.opacity * 0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
