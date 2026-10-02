import { lazy, Suspense, useEffect, useState } from 'react';

const Animated = lazy(() => import('./AnimatedTeammate'));

export default function PixelTeammate({ id, name, state = 'idle' }: { id: string; name?:string; state?: string }) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motion.matches);
    updateMotion();
    motion.addEventListener('change', updateMotion);
    return () => motion.removeEventListener('change', updateMotion);
  }, []);

  const still = <div className={`pixel-avatar pixel-${state}`} role="img" aria-label={`${name||id}, ${state.replaceAll('_', ' ')}`}>
    <img src={`/crew/${id}.png`} alt=""
      onError={event => { if (!event.currentTarget.src.endsWith('/crew/tara.png')) event.currentTarget.src = '/crew/tara.png'; }} />
  </div>;

  return state === 'working' && !reducedMotion
    ? <Suspense fallback={still}><Animated key={id} id={id} name={name} state={state} /></Suspense>
    : still;
}
