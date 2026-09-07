import { useEffect, useRef, useState } from 'react';
import { createRuntime, type Snapshot, type Quality } from './runtime';
import { LANDMARK_STAGES, PHOTO_VIEWS } from './neighborhood';
import './junen.css';

const initial: Snapshot = { hp: 100, stamina: 100, defeated: 0, score: 0, chain: 0, stage: 0, x: 0, z: 3, message: '', status: 'intro', elapsed: 0, enemies: [] };
export function JunenFighterGame() {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<ReturnType<typeof createRuntime> | null>(null);
  const [state, setState] = useState(initial);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState<Quality>('cinematic');
  const [photoView, setPhotoView] = useState<number | null>(null);
  const inspect = (index: number | null) => { setPhotoView(index); runtime.current?.inspect(index); };
  useEffect(() => {
    let cancelled = false;
    setReady(false); setError('');
    try {
      runtime.current = createRuntime(host.current!, setState, setError); runtime.current.quality(quality); runtime.current.inspect(photoView);
      runtime.current.ready.then(() => { if (!cancelled) setReady(true); }, () => { if (!cancelled) setError('The neighborhood textures could not load. Reload the scene to retry.'); });
    }
    catch (e) { setError(e instanceof Error ? e.message : 'WebGL could not start on this device.'); }
    return () => { cancelled = true; runtime.current?.dispose(); runtime.current = null; };
  }, [reload]);
  const begin = () => { runtime.current?.start(); (document.activeElement as HTMLElement)?.blur(); };
  const resume = () => { runtime.current?.pause(); (document.activeElement as HTMLElement)?.blur(); };
  const restart = () => { runtime.current?.restart(); (document.activeElement as HTMLElement)?.blur(); };
  const control = (name: 'punch' | 'kick' | 'counter' | 'dodge') => runtime.current?.action(name);
  return <div className="junen-game">
    <div ref={host} className="junen-viewport" />
    <div className="junen-top">
      <div className="junen-location"><span className="junen-location-mark">J</span><div><small>JAKARTA TIMUR</small><strong>Jl. H. Junen</strong></div></div>
      <div className="junen-options"><select aria-label="Graphics quality" value={quality} onChange={e => { const next = e.target.value as Quality; setQuality(next); runtime.current?.quality(next); e.target.blur(); }}><option value="cinematic">Cinematic</option><option value="balanced">Balanced</option></select>{state.status === 'playing' && <button onClick={resume} aria-label="Pause game">Ⅱ <span>Pause</span></button>}</div>
    </div>
    {state.status === 'intro' && photoView === null && !error && <div className="junen-intro">
      <div className="junen-eyebrow">A NEIGHBORHOOD FIGHT STORY</div>
      <h1>JUNEN<span>LAST STAND</span></h1>
      <p>A familiar lane. One long evening.<br />Stand your ground, from the water tank to the pink house.</p>
      <button className="junen-primary" disabled={!ready} onClick={begin}>{ready ? 'Enter the neighborhood' : 'Building the neighborhood…'} <span>→</span></button>
      <button className="junen-text-button" disabled={!ready} onClick={() => inspect(0)}>Inspect map from photo viewpoints</button>
      <div className="junen-intro-controls"><span><kbd>W A S D</kbd> Move</span><span><kbd>J</kbd> Strike</span><span><kbd>K</kbd> Kick</span><span><kbd>E</kbd> Counter</span><span><kbd>SPACE</kbd> Dodge</span></div>
      <small className="junen-note">An original, compact combat game inspired by your neighborhood photos.</small>
    </div>}
    {photoView !== null && !error && <div className="junen-reference">
      <div><strong>Photo {PHOTO_VIEWS[photoView].photo}: {PHOTO_VIEWS[photoView].label}</strong><small>Photo-based placement · dimensions estimated</small></div>
      <button onClick={() => inspect((photoView + PHOTO_VIEWS.length - 1) % PHOTO_VIEWS.length)}>Previous view</button>
      <button onClick={() => inspect((photoView + 1) % PHOTO_VIEWS.length)}>Next view</button>
      <button onClick={() => inspect(null)}>Back</button>
    </div>}
    {state.status !== 'intro' && !error && <>
      <div className="junen-objective"><small>ENCOUNTER {Math.min(3, Math.max(1, state.stage))} / 3</small><strong>{state.message}</strong><span>{state.defeated} / 9 opponents down</span></div>
      {state.chain > 1 && <div className="junen-combo"><b>{state.chain}<i>×</i></b><span>HIT CHAIN</span></div>}
      <div className="junen-bottom">
        <div className="junen-vitals"><div><strong>YOU</strong><span>{Math.ceil(state.hp)} / 100</span></div><div className="junen-meter" role="meter" aria-label="Health" aria-valuenow={state.hp} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${state.hp}%` }} /></div><div className="junen-meter junen-stamina" role="meter" aria-label="Stamina" aria-valuenow={Math.round(state.stamina)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${state.stamina}%` }} /></div><small>STAMINA <span>{Math.round(state.stamina)}%</span></small></div>
        <div className="junen-help"><span><kbd>J</kbd> Strike <kbd>K</kbd> Kick <kbd>E</kbd> Counter <kbd>SPACE</kbd> Dodge</span><small>WASD move · Shift sprint · Hold right mouse to look · P pause</small></div>
        <div className="junen-map"><svg viewBox="0 0 64 110" aria-label="Junen lane and tank-side junction with player and opponents"><path d="M27 104V9 M37 9V88H56 M56 93H37V104" fill="none" stroke="#a7aca0" strokeWidth="1" />{LANDMARK_STAGES.map(z => <path key={z} d={`M24 ${104 - z * 1.65}h16`} stroke="#6a7166" strokeDasharray="2 2" />)}{state.enemies.map((e, i) => <circle key={i} cx={32 - e.x * 3.4} cy={104 - e.z * 1.65} r="2" fill="#ec9c5c" />)}<path d={`M${32 - state.x * 3.4} ${101 - state.z * 1.65}l-3 6h6z`} fill="#f6ebc9" /></svg><small>JUNEN</small></div>
      </div>
      <div className="junen-touch"><div className="junen-dpad">{[['↑', 0, 1], ['←', -1, 0], ['↓', 0, -1], ['→', 1, 0]].map(([label, x, z]) => <button key={label} aria-label={`Move ${label}`} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); runtime.current?.move(Number(x), Number(z)); }} onPointerUp={() => runtime.current?.move(0, 0)} onPointerCancel={() => runtime.current?.move(0, 0)}>{label}</button>)}</div><div className="junen-touch-actions">{(['punch', 'kick', 'counter', 'dodge'] as const).map(a => <button key={a} onPointerDown={() => control(a)}>{a}</button>)}</div></div>
    </>}
    {(state.status === 'paused' || state.status === 'won' || state.status === 'lost') && !error && <div className="junen-modal"><div>
      <small>JUNEN / LAST STAND</small><h2>{state.status === 'paused' ? 'Take a breath.' : state.status === 'won' ? 'The lane is yours.' : 'Back on your feet.'}</h2>
      <p>{state.status === 'paused' ? 'Counter with E when the amber marker grows. Dodge to make space, then follow with a kick.' : state.status === 'won' ? 'All three encounters cleared. The neighborhood settles into the evening.' : 'Keep an eye on stamina. Time your counters just before an opponent strikes.'}</p>
      <div className="junen-results"><span><b>{state.score.toLocaleString()}</b> SCORE</span><span><b>{state.defeated} / 9</b> DEFEATED</span><span><b>{Math.floor(state.elapsed / 60)}:{String(Math.floor(state.elapsed % 60)).padStart(2, '0')}</b> TIME</span></div>
      <button className="junen-primary" onClick={state.status === 'paused' ? resume : restart}>{state.status === 'paused' ? 'Continue' : 'Play again'} <span>→</span></button>
      {state.status === 'paused' && <button className="junen-text-button" onClick={restart}>Restart encounters</button>}
    </div></div>}
    {error && <div className="junen-modal"><div><h2>Scene unavailable</h2><p>{error}</p><button className="junen-primary" onClick={() => setReload(n => n + 1)}>Reload scene</button></div></div>}
  </div>;
}
