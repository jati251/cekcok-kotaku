import React from 'react';
import { Html } from '@react-three/drei';
import type { DamageNumberData3D } from '../../engine/dynasty3dEngine';

interface DamageNumbers3DProps {
  damageNumbers: DamageNumberData3D[];
}

export const DamageNumbers3D: React.FC<DamageNumbers3DProps> = ({ damageNumbers }) => {
  return (
    <group>
      {damageNumbers.map((dn) => {
        const progress = Math.min(1, dn.life / dn.maxLife);
        const yOffset = progress * 1.8;
        const opacity = Math.max(0, 1 - progress);
        const scale = dn.isCrit ? 1.3 : 1.0;

        return (
          <group
            key={dn.id}
            position={[dn.position.x, dn.position.y + 1.2 + yOffset, dn.position.z]}
          >
            <Html center transform={false} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div
                style={{
                  opacity,
                  transform: `scale(${scale * (1 + (1 - progress) * 0.25)}) translateY(-${progress * 24}px)`,
                  color: dn.color,
                  textShadow: '0 2px 4px #000, 0 0 8px rgba(0,0,0,0.9)',
                  fontWeight: 900,
                  fontSize: dn.isCrit ? '22px' : '15px',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                {dn.isCrit ? `CRIT ${dn.value}!` : dn.value}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
