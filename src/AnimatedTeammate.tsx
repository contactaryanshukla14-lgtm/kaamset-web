import { useEffect, useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-canvas';

RuntimeLoader.setWasmUrl('/rive/rive.wasm');
RuntimeLoader.setWasmFallbackUrl('/rive/rive_fallback.wasm');

export default function AnimatedTeammate({ id, state = 'idle' }: { id: string; state?: string }) {
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { rive, RiveComponent } = useRive({
    src: `/crew/${id}.riv`,
    autoplay: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: () => { setFailed(true); setPlaying(false); },
  });

  useEffect(() => {
    if (!rive || failed) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPlayback = () => {
      const shouldPlay = state === 'working' && !motion.matches && !document.hidden
        && rive.animationNames.includes('Sparkle');
      if (shouldPlay) rive.play('Sparkle');
      else rive.pause();
      setPlaying(shouldPlay);
    };
    syncPlayback();
    motion.addEventListener('change', syncPlayback);
    document.addEventListener('visibilitychange', syncPlayback);
    return () => {
      motion.removeEventListener('change', syncPlayback);
      document.removeEventListener('visibilitychange', syncPlayback);
      rive.pause();
    };
  }, [rive, state, failed]);

  return <div className={`pixel-avatar pixel-${state}`} role="img" aria-label={`${id}, ${state.replaceAll('_', ' ')}`}>
    <img className={`pixel-still${playing ? ' is-hidden' : ''}`} src={`/crew/${id}.png`} alt=""
      onError={event => { if (!event.currentTarget.src.endsWith('/crew/tara.png')) event.currentTarget.src = '/crew/tara.png'; }} />
    {!failed && <RiveComponent className={`pixel-rive${playing ? ' is-playing' : ''}`} aria-hidden="true" />}
  </div>;
}
