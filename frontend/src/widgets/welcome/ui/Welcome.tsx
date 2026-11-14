import { Button } from '@shared/ui/Button'

type WelcomeProps = {
  onStart: () => void
  isLoading: boolean
  error: string | null
}

export function Welcome({ onStart, isLoading, error }: WelcomeProps) {
  return (
    <section className="welcome">
      <img
        className="welcome__banner"
        src="/assets/lunar-shift-banner.png"
        alt="Lunar Shift outpost on the Moon with the game title"
      />
      <div className="welcome__content">
        <p className="eyebrow">Lunar south pole mission trainer</p>
        <h1>Keep the outpost alive.</h1>
        <p className="description">
          Balance power, food, crops, and crew safety across six turns on the Moon.
        </p>
        <Button onClick={onStart} disabled={isLoading}>
          {isLoading ? 'Loading mission…' : 'Start mission'}
        </Button>
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
    </section>
  )
}
