import { useEffect, useRef } from 'react';
import { createRuntime, type Quality } from './runtime';
import { useJunenStore } from './store';
import { JunenHeader } from './ui/JunenHeader';
import { JunenObjective } from './ui/JunenObjective';
import { JunenVitals } from './ui/JunenVitals';
import { JunenIntro } from './ui/JunenIntro';
import { JunenModal } from './ui/JunenModal';
import { JunenPhotoInspect } from './ui/JunenPhotoInspect';
import { JunenTouchControls } from './ui/JunenTouchControls';

export function JunenFighterGame() {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<ReturnType<typeof createRuntime> | null>(null);

  const status = useJunenStore((s) => s.snapshot.status);
  const photoView = useJunenStore((s) => s.photoView);
  const quality = useJunenStore((s) => s.quality);
  const error = useJunenStore((s) => s.error);
  const reloadCount = useJunenStore((s) => s.reloadCount);

  const setSnapshot = useJunenStore((s) => s.setSnapshot);
  const setReady = useJunenStore((s) => s.setReady);
  const setError = useJunenStore((s) => s.setError);
  const setQuality = useJunenStore((s) => s.setQuality);
  const setPhotoView = useJunenStore((s) => s.setPhotoView);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');

    try {
      if (!host.current) return;
      runtime.current = createRuntime(
        host.current,
        (snapshot) => {
          if (!cancelled) setSnapshot(snapshot);
        },
        (err) => {
          if (!cancelled) setError(err);
        },
      );
      runtime.current.quality(quality);
      runtime.current.inspect(photoView);

      runtime.current.ready.then(
        () => {
          if (!cancelled) setReady(true);
        },
        () => {
          if (!cancelled) setError('The neighborhood textures could not load. Reload the scene to retry.');
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'WebGL could not start on this device.');
    }

    return () => {
      cancelled = true;
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, [reloadCount]);

  const handleStart = () => {
    runtime.current?.start();
    (document.activeElement as HTMLElement)?.blur();
  };

  const handlePause = () => {
    runtime.current?.pause();
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleRestart = () => {
    runtime.current?.restart();
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleInspect = (index: number | null) => {
    setPhotoView(index);
    runtime.current?.inspect(index);
  };

  const handleQualityChange = (next: Quality) => {
    setQuality(next);
    runtime.current?.quality(next);
  };

  const handleAction = (action: 'punch' | 'kick' | 'counter' | 'dodge') => {
    runtime.current?.action(action);
  };

  const handleMove = (x: number, z: number) => {
    runtime.current?.move(x, z);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-stone-900 text-stone-100 select-none font-sans">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={host} className="absolute inset-0 [&>canvas]:block [&>canvas]:w-full [&>canvas]:h-full [&>canvas]:touch-none" />

      {/* Top Header */}
      <JunenHeader onPause={handlePause} onQualityChange={handleQualityChange} />

      {/* Intro Landing Screen */}
      {status === 'intro' && photoView === null && !error && (
        <JunenIntro onStart={handleStart} onInspect={handleInspect} />
      )}

      {/* Reference Photo Inspector View */}
      {photoView !== null && !error && (
        <JunenPhotoInspect onInspect={handleInspect} />
      )}

      {/* Active Battle HUD */}
      {status !== 'intro' && !error && (
        <>
          <JunenObjective />
          <JunenVitals />
          <JunenTouchControls onMove={handleMove} onAction={handleAction} />
        </>
      )}

      {/* Modals for Pause, Victory, Loss, or Error */}
      <JunenModal onResume={handlePause} onRestart={handleRestart} />
    </div>
  );
}

export default JunenFighterGame;
