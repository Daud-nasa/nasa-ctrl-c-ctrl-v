import { useState } from 'react'
import { getMission, type Mission } from '@shared/api/missionApi'
import { Welcome } from '@widgets/welcome'

export function HomePage() {
  const [mission, setMission] = useState<Mission | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStartMission() {
    setIsLoading(true)
    setError(null)

    try {
      setMission(await getMission('lunar-south-pole-01'))
    } catch {
      setError('The mission server is offline. Start the backend, then try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (mission) {
    const state = mission.initialState
    const currentTurn = mission.turns[state.turnIndex]

    return (
      <main className="mission-shell">
        <header className="mission-header">
          <div>
            <p className="eyebrow">Lunar Shift · Mission control</p>
            <h1>{mission.title}</h1>
          </div>
          <button className="secondary-button" onClick={() => setMission(null)}>
            Back to briefing
          </button>
        </header>

        <section className="mission-grid" aria-label="Mission overview">
          <article className="mission-card mission-card--briefing">
            <span className="card-label">Current shift</span>
            <div className="shift-heading">
              <strong>Shift {state.turnIndex + 1}</strong>
              <span className={`status-pill status-pill--${currentTurn.illumination}`}>
                {currentTurn.illumination}
              </span>
            </div>
            <p>{mission.briefing}</p>
            <div className="turn-track" aria-label="Six mission shifts">
              {mission.turns.map((turn, index) => (
                <span
                  className={`turn-dot ${index === state.turnIndex ? 'turn-dot--active' : ''}`}
                  key={`${turn.illuminationAtUtc}-${index}`}
                  title={`Shift ${index + 1}: ${turn.illumination}`}
                >
                  {index + 1}
                </span>
              ))}
            </div>
          </article>

          <article className="mission-card">
            <span className="card-label">Outpost status</span>
            <div className="resource-list">
              <Resource label="Battery" value={`${state.batteryCharge} / ${mission.batteryCapacity}`} />
              <Resource label="Food reserve" value={`${state.foodReserve} meals`} />
              <Resource label="Crop progress" value={`${state.cropProgress} units`} />
              <Resource label="Radiation" value={`${state.radiationScore} points`} />
            </div>
            <div className={`crew-status crew-status--${state.crewStatus}`}>
              Crew status: {state.crewStatus.replace('-', ' ')}
            </div>
          </article>
        </section>

        <section className="mission-card mission-card--next-step">
          <div>
            <span className="card-label">Next step</span>
            <h2>Choose how to spend this shift.</h2>
            <p>Power life support, grow food, and shelter the crew when radiation strikes.</p>
          </div>
          <button className="primary-button" disabled>
            Configure shift
          </button>
        </section>
      </main>
    )
  }

  return (
    <main>
      <Welcome onStart={handleStartMission} isLoading={isLoading} error={error} />
    </main>
  )
}

function Resource({ label, value }: { label: string; value: string }) {
  return (
    <div className="resource-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
