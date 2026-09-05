import React from 'react';
import { Text, Billboard } from '@react-three/drei';
import type { DamageNumberData3D } from '../../engine/dynasty3dEngine';

interface DamageNumbers3DProps {
  damageNumbers: DamageNumberData3D[];
}

export const DamageNumbers3D: React.FC<DamageNumbers3DProps> = ({ damageNumbers }) => {
  return (
    <group>
      {damageNumbers.map((dn) => {
        const progress = dn.life / dn.maxLife;
        const opacity = Math.max(0, 1 - progress);
        const yOffset = progress * 1.6;
        const scale = dn.isCrit ? 1.4 : 1.0;

        return (
          <Billboard
            key={dn.id}
            position={[dn.position.x, dn.position.y + 1.2 + yOffset, dn.position.z]}
          >
            <Text
              fontSize={0.8 * scale}
              color={dn.color}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.08}
              outlineColor="#09090b"
              fillOpacity={opacity}
              outlineOpacity={opacity}
            >
              {dn.value}
            </Text>
          </Billboard>
        );
      })}
    </group>
  );
};
