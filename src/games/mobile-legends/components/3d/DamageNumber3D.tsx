import React from 'react';
import { Text, Billboard } from '@react-three/drei';
import type { FloatingText } from '../../types/combat';

interface DamageNumber3DProps {
  texts: FloatingText[];
}

export const DamageNumber3D: React.FC<DamageNumber3DProps> = ({ texts }) => {
  return (
    <group>
      {texts.map((ft) => (
        <Billboard key={ft.id} position={[ft.position.x, ft.position.y, ft.position.z]}>
          <Text
            fontSize={0.65 * ft.scale}
            color={ft.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.07}
            outlineColor="#0f172a"
            fillOpacity={ft.opacity}
            outlineOpacity={ft.opacity}
          >
            {ft.text}
          </Text>
        </Billboard>
      ))}
    </group>
  );
};
