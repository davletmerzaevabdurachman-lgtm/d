import { useSwipe } from '../hooks/useSwipe'

export function HomeIndicator({ onHome, label }: { onHome: () => void; label: string }) {
  const swipe = useSwipe('up', onHome, 24)
  return (
    <button type="button" className="home-indicator" aria-label={label} onClick={onHome} {...swipe}>
      <span className="home-indicator__bar" aria-hidden />
    </button>
  )
}
