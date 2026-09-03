import { MapProp, PropType, Entity, BattleScenario } from '../types';
import * as Constants from '../constants';

export function generateBattlefieldProps(scenario: BattleScenario): MapProp[] {
  const props: MapProp[] = [];
  let id = 1;

  for (const base of scenario.bases) {
    props.push({
      id: `torch_${id++}`,
      type: PropType.TORCH,
      x: base.x - 45,
      y: base.y - 35,
      width: 10,
      height: 35,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `torch_${id++}`,
      type: PropType.TORCH,
      x: base.x + 45,
      y: base.y - 35,
      width: 10,
      height: 35,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `barricade_${id++}`,
      type: PropType.BARRICADE,
      x: base.x - 70,
      y: base.y + 30,
      width: 40,
      height: 20,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `barricade_${id++}`,
      type: PropType.BARRICADE,
      x: base.x + 70,
      y: base.y + 30,
      width: 40,
      height: 20,
      scale: 1,
      variant: 0,
    });
  }

  const size = Constants.WORLD_SIZE;
  // Dense forest clusters
  for (let i = 0; i < 65; i++) {
    props.push({
      id: `tree_${id++}`,
      type: PropType.TREE,
      x: Math.random() * (size - 300) + 150,
      y: Math.random() * (size - 300) + 150,
      width: 45 + Math.random() * 30,
      height: 60,
      scale: 0.85 + Math.random() * 0.35,
      variant: Math.floor(Math.random() * 3),
    });
  }

  // Tactical Rock Formations
  for (let i = 0; i < 40; i++) {
    props.push({
      id: `rock_${id++}`,
      type: PropType.ROCK,
      x: Math.random() * (size - 300) + 150,
      y: Math.random() * (size - 300) + 150,
      width: 28 + Math.random() * 25,
      height: 22,
      scale: 1,
      variant: 0,
    });
  }

  // Fortified Outpost Buildings & Watchtowers
  for (let i = 0; i < 14; i++) {
    props.push({
      id: `bld_${id++}`,
      type: PropType.BUILDING,
      x: Math.random() * (size - 500) + 250,
      y: Math.random() * (size - 500) + 250,
      width: 80,
      height: 70,
      scale: 0.9,
      variant: 0,
    });
  }

  // Roadside Barricades & Torches
  for (let i = 0; i < 22; i++) {
    props.push({
      id: `barricade_field_${id++}`,
      type: PropType.BARRICADE,
      x: Math.random() * (size - 400) + 200,
      y: Math.random() * (size - 400) + 200,
      width: 45,
      height: 22,
      scale: 1,
      variant: 0,
    });
    props.push({
      id: `torch_field_${id++}`,
      type: PropType.TORCH,
      x: Math.random() * (size - 400) + 200,
      y: Math.random() * (size - 400) + 200,
      width: 10,
      height: 35,
      scale: 1,
      variant: 0,
    });
  }

  return props;
}

export function resolvePropCollisions(entities: Entity[], props: MapProp[]) {
  for (const e of entities) {
    if (e.isDead) continue;
    for (const p of props) {
      if (p.type === PropType.ROCK) {
        const cy = p.y - 6;
        const dx = e.position.x - p.x;
        const dy = e.position.y - cy;
        const dist = Math.hypot(dx, dy);
        const minDist = e.radius + (p.width * 0.48);
        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          e.position.x += (dx / dist) * overlap;
          e.position.y += (dy / dist) * overlap;
        }
      } else if (p.type === PropType.TREE) {
        // Tree trunk collision
        const cy = p.y - 12;
        const dx = e.position.x - p.x;
        const dy = e.position.y - cy;
        const dist = Math.hypot(dx, dy);
        const minDist = e.radius + 12;
        if (dist < minDist && dist > 0.001) {
          const overlap = minDist - dist;
          e.position.x += (dx / dist) * overlap;
          e.position.y += (dy / dist) * overlap;
        }
      } else if (p.type === PropType.BUILDING) {
        // Full footprint and structure collision box
        const cy = p.y - 50;
        const halfW = 54 + e.radius;
        const halfH = 50 + e.radius;
        const dx = e.position.x - p.x;
        const dy = e.position.y - cy;
        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
          const ox = halfW - Math.abs(dx);
          const oy = halfH - Math.abs(dy);
          if (ox < oy) {
            e.position.x += dx > 0 ? ox : -ox;
          } else {
            e.position.y += dy > 0 ? oy : -oy;
          }
        }
      } else if (p.type === PropType.BARRICADE) {
        const cy = p.y - 8;
        const halfW = 28 + e.radius;
        const halfH = 14 + e.radius;
        const dx = e.position.x - p.x;
        const dy = e.position.y - cy;
        if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
          const ox = halfW - Math.abs(dx);
          const oy = halfH - Math.abs(dy);
          if (ox < oy) {
            e.position.x += dx > 0 ? ox : -ox;
          } else {
            e.position.y += dy > 0 ? oy : -oy;
          }
        }
      }
    }
  }
}
