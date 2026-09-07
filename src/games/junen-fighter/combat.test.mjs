import assert from 'node:assert/strict';
import { Combat, emptyInput, ENCOUNTERS } from './combat.ts';
import { laneBounds, LANE, PROPERTIES } from './neighborhood.ts';
const step = (g, seconds, input = emptyInput()) => { for (let t = 0; t < seconds; t += 1 / 60) g.update(1 / 60, input); };
const encounter = () => { const g = new Combat(); g.start(); g.player.z = 10; g.update(1 / 60, emptyInput()); return g; };
{
  const g = new Combat(); step(g, 1, { ...emptyInput(), z: 1 }); assert.equal(g.player.z, 3);
  g.start(); step(g, 1, { ...emptyInput(), x: 1 }); assert.ok(g.player.x <= laneBounds(g.player.z)[1]);
  g.status = 'paused'; const z = g.player.z; step(g, 1, { ...emptyInput(), z: 1 }); assert.equal(g.player.z, z);
}
{
  const g = encounter(); assert.equal(g.enemies.length, 3); step(g, .2); assert.equal(g.enemies.length, 3);
  const e = g.enemies[0]; e.x = 0; e.z = g.player.z + 1.2; e.cooldown = 10;
  g.update(1 / 60, { ...emptyInput(), punch: true }); step(g, .28);
  assert.equal(e.hp, 82); step(g, .05); assert.equal(e.hp, 82, 'an attack damages once');
}
{
  const g = encounter(), e = g.enemies[0]; e.x = 0; e.z = g.player.z + 1.2;
  g.act(e, 'windup', .3); g.update(1 / 60, { ...emptyInput(), counter: true });
  assert.equal(e.hp, 58); assert.equal(g.player.hp, 100); assert.ok(g.slow > 0);
  g.act(g.player, 'dodge', .4); g.strike(g.player, 30, e); assert.equal(g.player.hp, 100);
}
{
  const g = encounter(); g.stamina = 0; g.update(1 / 60, { ...emptyInput(), kick: true }); assert.equal(g.player.action, 'idle');
  step(g, 15); assert.ok(g.player.hp < 100, 'enemy AI attacks without input');
  g.player.hp = 1; g.strike(g.player, 13, g.enemies[0]); g.update(1 / 60, emptyInput()); assert.equal(g.status, 'lost');
}
{
  const g = new Combat(); g.start();
  // Drive normal movement and timed counters through all three encounters.
  for (let i = 0; i < 60000 && g.status === 'playing'; i++) {
    const input = emptyInput(); const p = g.player;
    const alive = g.enemies.filter(e => e.hp > 0);
    if (!alive.length) input.z = 1;
    else {
      const threat = alive.find(e => e.action === 'windup' && e.timer < .4 && Math.hypot(e.x - p.x, e.z - p.z) < 2.4);
      if (threat) input.counter = true;
      else if (p.action === 'idle' && !alive.some(e => e.action === 'windup')) {
        const e = alive.sort((a,b) => Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
        const d = Math.hypot(e.x-p.x,e.z-p.z);
        if (d > 1.4) { input.x = (e.x-p.x)/d; input.z = (e.z-p.z)/d; } else input.punch = true;
      }
    }
    g.update(1 / 60, input);
  }
  assert.equal(g.status, 'won'); assert.equal(g.defeated, 9); assert.equal(g.cleared, ENCOUNTERS.length); assert.ok(g.score > 0);
  console.log(`Full combat playthrough: ${g.defeated} defeated, ${Math.round(g.elapsed)}s, ${g.player.hp} HP, score ${g.score}`);
}
console.log('Combat checks passed: bounds, pause, spawns, hit windows, counter, dodge, stamina, AI, loss, three-encounter victory.');
{
  const g = new Combat(); g.start(); g.player.z = 8.5;
  step(g, 1, { ...emptyInput(), x: -1 });
  assert.ok(g.player.x < -LANE.halfWidth, 'tank-side junction is accessible');
  const branchX = g.player.x;
  step(g, 2, { ...emptyInput(), z: 1 });
  assert.equal(g.player.x, branchX, 'hitting a branch wall must not teleport to the main lane');
  assert.ok(g.player.z <= LANE.junctionEnd - .32, 'branch wall blocks entry into the green property');
  step(g, 2, { ...emptyInput(), x: 1 });
  step(g, 1, { ...emptyInput(), z: 1 });
  assert.ok(g.player.z > LANE.junctionEnd, 'returning to the main lane permits forward movement');
  for (const side of [-1, 1]) {
    const plots = PROPERTIES.filter(p => p.side === side).sort((a, b) => a.start - b.start);
    for (let i = 1; i < plots.length; i++) assert.ok(plots[i].start >= plots[i - 1].start + plots[i - 1].width, 'property footprints must not overlap');
  }
  for (const [i, id] of ['green-tank', 'turquoise', 'pink'].entries()) {
    const plot = PROPERTIES.find(p => p.id === id);
    assert.ok(ENCOUNTERS[i] >= plot.start && ENCOUNTERS[i] <= plot.start + plot.width, 'encounter must match its named landmark');
  }
  console.log('Neighborhood checks passed: narrow bounds, junction access, property separation, encounter alignment.');
}
