import { Button } from '@shared/ui/Button'

type WelcomeProps = {
  onStart: () => void
  isLoading: boolean
  error: string | null
}

export function Welcome({ onStart, isLoading, error }: WelcomeProps) {
  return (
    <section className="welcome" aria-label="Lunar Shift mission briefing">
      <div className="welcome__scanlines" />
      <div className="welcome__topbar">
        <span className="brand-mark"><i /> LUNAR SHIFT</span>
        <span className="topbar-status"><b /> SIMULATION READY</span>
      </div>

      <div className="welcome__content">
        <div className="welcome__copy">
          <p className="eyebrow">NASA mission control · 2040 / south pole</p>
          <h1>Keep the<br /><em>outpost</em> alive.</h1>
          <p className="description">
            Six shifts. One fragile base. Every decision changes what the crew can survive.
          </p>
          <Button onClick={onStart} disabled={isLoading}>
            <span>{isLoading ? 'Loading mission…' : 'Start mission'}</span>
          </Button>
          {error && <p className="error-message" role="alert">{error}</p>}
        </div>

        <div className="welcome__telemetry" aria-label="Mission telemetry">
          <div className="telemetry-heading"><span>LIVE TELEMETRY</span><span>01 / 06</span></div>
          <div className="telemetry-line"><span>LOCATION</span><strong>LUNAR SOUTH POLE</strong></div>
          <div className="telemetry-line"><span>MISSION WINDOW</span><strong>06 SHIFTS</strong></div>
          <div className="telemetry-line"><span>PRIMARY RISK</span><strong className="warning-text">SOLAR PARTICLE EVENT</strong></div>
          <div className="telemetry-bars"><i /><i /><i /><i /><i /><i /></div>
          <p>Power, shelter, and food are finite. The crew is counting on you.</p>
        </div>
      </div>

      <div className="welcome__footer"><span>MISSION TRAINER / EDUCATIONAL SIMULATION</span><span>NASA OPEN DATA · SYSTEM ONLINE</span></div>
    </section>
  )
}
