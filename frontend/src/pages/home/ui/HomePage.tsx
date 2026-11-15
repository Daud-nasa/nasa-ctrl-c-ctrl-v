import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  forecastTurn,
  getMission,
  resolveTurn,
  type Mission,
  type MissionState,
  type PlayerChoice,
  type ForecastResponse,
} from '@shared/api/missionApi'
import { Welcome } from '@widgets/welcome'

const missionId = 'lunar-south-pole-01'
const savedStateKey = `lunar-shift:${missionId}:state`
const defaultChoice: PlayerChoice = {
  powerLifeSupport: true,
  powerGreenhouse: false,
  shelterCrew: false,
}

type ChatMessage = {
  id: string
  role: 'player' | 'system'
  text: string
}

type MissionOutcome = 'success' | 'failure' | null

type SavedMissionProgress = {
  state: MissionState
  outcome: MissionOutcome
  reasons: string[]
}

function isMissionState(value: unknown): value is MissionState {
  if (typeof value !== 'object' || value === null) return false

  const state = value as Partial<MissionState>
  return Number.isInteger(state.turnIndex)
    && Number.isInteger(state.batteryCharge)
    && Number.isInteger(state.oxygenReserve)
    && Number.isInteger(state.foodReserve)
    && Number.isInteger(state.cropProgress)
    && Number.isInteger(state.harvestTotal)
    && Number.isInteger(state.radiationScore)
    && (state.crewStatus === 'safe' || state.crewStatus === 'at-risk' || state.crewStatus === 'critical')
}

function isSavedMissionProgress(value: unknown): value is SavedMissionProgress {
  if (typeof value !== 'object' || value === null) return false

  const progress = value as Partial<SavedMissionProgress>
  return isMissionState(progress.state)
    && (progress.outcome === null || progress.outcome === 'success' || progress.outcome === 'failure')
    && Array.isArray(progress.reasons)
    && progress.reasons.every((reason) => typeof reason === 'string')
}

export function HomePage() {
  const [mission, setMission] = useState<Mission | null>(null)
  const [state, setState] = useState<MissionState | null>(null)
  const [choice, setChoice] = useState<PlayerChoice>(defaultChoice)
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [outcome, setOutcome] = useState<'success' | 'failure' | null>(null)
  const [lastReasons, setLastReasons] = useState<string[]>([])
  const [isResolving, setIsResolving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isBriefingOpen, setIsBriefingOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleStartMission() {
    setIsLoading(true)
    setError(null)

    try {
      const loadedMission = await getMission(missionId)
      const savedState = window.localStorage.getItem(savedStateKey)
      let nextState = loadedMission.initialState
      let nextOutcome: MissionOutcome = null
      let nextReasons: string[] = []

      if (savedState) {
        try {
          const savedProgress: unknown = JSON.parse(savedState)
          if (isSavedMissionProgress(savedProgress)
            && savedProgress.state.oxygenReserve <= loadedMission.oxygenCapacity
            && savedProgress.state.batteryCharge <= loadedMission.batteryCapacity) {
            nextState = savedProgress.state
            nextOutcome = savedProgress.outcome
            nextReasons = savedProgress.reasons
          } else {
            window.localStorage.removeItem(savedStateKey)
          }
        } catch {
          window.localStorage.removeItem(savedStateKey)
        }
      }

      setMission(loadedMission)
      setState(nextState)
      setOutcome(nextOutcome)
      setLastReasons(nextReasons)
      setForecast(null)
      setIsBriefingOpen(true)
      setChatMessages([])
    } catch {
      setError('The mission server is offline. Start the backend, then try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function restartMission() {
    window.localStorage.removeItem(savedStateKey)
    setMission(null)
    setState(null)
    setChoice(defaultChoice)
    setForecast(null)
    setOutcome(null)
    setLastReasons([])
    setIsBriefingOpen(false)
    setChatMessages([])
    setError(null)
  }

  if (mission && state) {
    const currentState = state
    const currentTurn = mission.turns[currentState.turnIndex]

    if (!currentTurn) {
      return outcome === 'success'
        ? <MissionSuccessModal onRestart={restartMission} />
        : <MissionDefeatModal onRestart={restartMission} reasons={lastReasons} />
    }

    const projectedFinalBattery = forecast?.status === 'within-budget'
      && currentState.turnIndex === mission.turns.length - 1
      ? Math.min(mission.batteryCapacity, forecast.availableEnergy - forecast.requiredEnergy)
      : null

    async function previewChoice() {
      setIsResolving(true)
      setError(null)
      try {
        setForecast(await forecastTurn(missionId, currentState, choice))
      } catch {
        setError('Could not preview this shift. Check that the backend is running.')
      } finally {
        setIsResolving(false)
      }
    }

    async function resolveChoice() {
      setIsResolving(true)
      setError(null)
      try {
        const result = await resolveTurn(missionId, currentState, choice)
        setForecast({ status: result.status === 'resolved' ? 'within-budget' : 'over-budget', availableEnergy: result.availableEnergy, requiredEnergy: result.requiredEnergy })
        const poweredSystems = [
          choice.powerLifeSupport ? 'life support' : null,
          choice.powerGreenhouse ? 'greenhouse' : null,
          choice.shelterCrew ? 'crew shelter' : null,
        ].filter((system): system is string => Boolean(system))
        const actionText = poweredSystems.length > 0
          ? `Action logged: ${poweredSystems.join(', ')}.`
          : 'Action logged: no systems powered.'
        const reportMessages = result.reasons?.length
          ? result.reasons.map((reason, index) => ({ id: `${Date.now()}-report-${index}`, role: 'system' as const, text: reason }))
          : [{ id: `${Date.now()}-report`, role: 'system' as const, text: 'Shift complete. No additional report.' }]
        setChatMessages((current) => [
          ...current,
          { id: `${Date.now()}-action`, role: 'player', text: actionText },
          ...reportMessages,
        ])

        const resolvedOutcome: MissionOutcome = result.outcome === 'success' || result.outcome === 'failure'
          ? result.outcome
          : null
        setOutcome(resolvedOutcome)
        const reasons = result.reasons ?? []
        setLastReasons(reasons)
        if (result.state) {
          setState(result.state)
          window.localStorage.setItem(savedStateKey, JSON.stringify({ state: result.state, outcome: resolvedOutcome, reasons }))
        }
      } catch {
        setError('Could not resolve this shift. Check that the backend is running.')
      } finally {
        setIsResolving(false)
      }
    }

    function updateChoice(key: keyof PlayerChoice) {
      setChoice((current) => ({ ...current, [key]: !current[key] }))
      setForecast(null)
    }

    return (
      <main className="game-shell" style={{ '--mission-progress': state.turnIndex / mission.turns.length } as CSSProperties}>
        <header className="game-topbar">
          <div className="game-brand"><span className="brand-dot" /> LUNAR SHIFT <small>/ COMMAND</small></div>
          <div className="game-online"><i /> Outpost online <Icon name="settings" /></div>
          <button className="game-briefing-button" onClick={() => setIsBriefingOpen(true)} aria-haspopup="dialog" aria-expanded={isBriefingOpen}>Mission briefing</button>
          <button className="game-exit" onClick={restartMission}>Restart <span>↗</span></button>
        </header>

        <div className="mission-timeline-bar">
          <div className="timeline-bar-heading"><span>MISSION TIMELINE</span><strong>{state.turnIndex + 1} / {mission.turns.length}</strong></div>
          <div className="timeline-bar-track" aria-label="Mission shifts">
            {mission.turns.map((turn, index) => (
              <div className={`timeline-step ${index < state.turnIndex ? 'timeline-step--done' : ''} ${index === state.turnIndex ? 'timeline-step--active' : ''}`} key={`top-${turn.illuminationAtUtc}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span><i />
              </div>
            ))}
          </div>
        </div>

        <div className="game-layout">
          <section className="game-panel game-panel--command">
            <div className="panel-kicker"><span>OUTPOST COMMAND VIEW</span><span>UTC {new Date(currentTurn.illuminationAtUtc).toISOString().slice(11, 16)}</span></div>
            <h1 className="mission-card-title">{currentTurn.illumination === 'shadow' ? 'Lunar Shadow' : 'Illumination Window'}</h1>
            <div className="mission-card-meta"><span><Icon name="intel" /> 89° S, 13° E</span><span><Icon name="systems" /> {currentTurn.illumination === 'sunlight' ? 'Illumination: 100%' : 'Illumination: 0%'}</span></div>
            {currentTurn.radiationEventId && <div className="radiation-alert radiation-alert--inline"><span className="alert-pulse" /> SOLAR PARTICLE EVENT DETECTED</div>}
            <div className={`shift-visual shift-visual--${currentTurn.illumination}`} key={`shift-visual-${state.turnIndex}`}>
              <div className="visual-grid" />
              <div className="moon-disc"><div className="moon-crater moon-crater--one" /><div className="moon-crater moon-crater--two" /><div className="moon-crater moon-crater--three" /></div>
              <div className="visual-orbit visual-orbit--one" /><div className="visual-orbit visual-orbit--two" />
              <div className="visual-caption"><span>SHIFT {String(state.turnIndex + 1).padStart(2, '0')}</span><strong>{currentTurn.illumination === 'sunlight' ? 'ILLUMINATION WINDOW' : 'LUNAR SHADOW'}</strong></div>
              {currentTurn.radiationEventId && <div className="radiation-alert"><span className="alert-pulse" /> SOLAR PARTICLE EVENT DETECTED</div>}
              <div className="visual-coordinate">89° S<br />13° E</div>
            </div>
          </section>

          <aside className="game-panel game-panel--resources">
            <div className="panel-kicker"><span>OUTPOST SYSTEMS</span><span className="online-label"><i /> ONLINE</span></div>
            <div className="resource-stack">
              <ResourceMeter icon="battery" label="Battery charge" value={state.batteryCharge} max={mission.batteryCapacity} display={`${state.batteryCharge} / ${mission.batteryCapacity}`} tone="blue" />
              <ResourceMeter icon="oxygen" label="Oxygen reserve" value={state.oxygenReserve} max={mission.oxygenCapacity} display={`${state.oxygenReserve} / ${mission.oxygenCapacity}`} tone="blue" />
              <ResourceMeter icon="food" label="Food reserve" value={state.foodReserve} max={Math.max(8, mission.initialState.foodReserve)} display={`${state.foodReserve} meals`} tone="green" />
              <ResourceMeter icon="crop" label="Crop growth" value={state.cropProgress} max={mission.rules.harvestThreshold} display={`${state.cropProgress} / ${mission.rules.harvestThreshold}`} tone="amber" />
              <ResourceMeter icon="radiation" label="Radiation load" value={state.radiationScore} max={mission.rules.crewCriticalRadiation} display={`${state.radiationScore} pts`} tone="red" />
            </div>
            <div className={`crew-console crew-console--${state.crewStatus}`}><span className="crew-icon">✦</span><div><span>CREW CONDITION</span><strong>{state.crewStatus.replace('-', ' ')}</strong></div><i /></div>
            <div className="harvest-target"><span>HARVEST TARGET</span><strong>{String(state.harvestTotal).padStart(2, '0')} <small>/ {String(mission.harvestTarget).padStart(2, '0')}</small></strong></div>
            <div className="harvest-target"><span>FINAL BATTERY RESERVE</span><strong>≥ {mission.minimumEndingBattery} <small>units</small></strong></div>
          </aside>

          <section className="game-panel game-panel--life-bars" aria-label="Outpost life indicators">
            <div className="panel-kicker"><span>OUTPOST STATUS</span><span>LIVE</span></div>
            <div className="resource-stack">
              <ResourceMeter icon="battery" label="Battery charge" value={state.batteryCharge} max={mission.batteryCapacity} display={`${state.batteryCharge} / ${mission.batteryCapacity}`} tone="blue" />
              <ResourceMeter icon="oxygen" label="Oxygen reserve" value={state.oxygenReserve} max={mission.oxygenCapacity} display={`${state.oxygenReserve} / ${mission.oxygenCapacity}`} tone="blue" />
              <ResourceMeter icon="food" label="Food reserve" value={state.foodReserve} max={Math.max(8, mission.initialState.foodReserve)} display={`${state.foodReserve} meals`} tone="green" />
              <ResourceMeter icon="crop" label="Crop growth" value={state.cropProgress} max={mission.rules.harvestThreshold} display={`${state.cropProgress} / ${mission.rules.harvestThreshold}`} tone="amber" />
              <ResourceMeter icon="radiation" label="Radiation load" value={state.radiationScore} max={mission.rules.crewCriticalRadiation} display={`${state.radiationScore} pts`} tone="red" />
            </div>
          </section>

          <aside className="game-panel game-panel--chat" aria-label="Mission reports chat">
            <div className="panel-kicker"><span>MISSION CHAT</span><span className="online-label"><i /> LIVE</span></div>
            <MissionChat messages={chatMessages} />
          </aside>

          <section className="game-panel game-panel--timeline">
            <div className="timeline-panel-heading"><span>MISSION TIMELINE</span><strong>{state.turnIndex + 1} / {mission.turns.length}</strong></div>
            <div className="timeline-bar-track" aria-label="Mission shifts">
              {mission.turns.map((turn, index) => (
                <div className={`timeline-step ${index < state.turnIndex ? 'timeline-step--done' : ''} ${index === state.turnIndex ? 'timeline-step--active' : ''}`} key={`grid-${turn.illuminationAtUtc}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span><i />
                </div>
              ))}
            </div>
          </section>

        <section className="game-panel game-panel--controls">
          <div className="controls-heading"><div><span className="panel-kicker">SHIFT CONFIGURATION</span><h2>Allocate your resources.</h2></div><p>Choose the systems to power. The mission engine will forecast the consequences.</p></div>
          <div className="choice-grid">
            <Choice icon="life" checked={choice.powerLifeSupport} onChange={() => updateChoice('powerLifeSupport')} title="Life support" detail={choice.powerLifeSupport ? `-${mission.lifeSupportCost} energy · maintains oxygen` : `Off · oxygen -${mission.rules.oxygenConsumptionPerTurn}`} />
            <Choice icon="greenhouse" checked={choice.powerGreenhouse} onChange={() => updateChoice('powerGreenhouse')} title="Greenhouse" detail={choice.powerGreenhouse ? `-${mission.greenhouseCost} energy · ${choice.shelterCrew ? 'growth paused in shelter' : `crop +${mission.rules.cropGrowthPerGreenhouseTurn}`}` : 'Off · no crop growth'} />
            <Choice icon="shelter" checked={choice.shelterCrew} onChange={() => updateChoice('shelterCrew')} title="Shelter crew" detail={choice.shelterCrew ? `-${mission.shelterCost} energy · ${currentTurn.radiationEventId ? 'radiation shield' : 'no event'} · pauses crop` : `Off · ${currentTurn.radiationEventId ? 'radiation exposure' : 'no event'}`} />
          </div>
          <div className="action-row">
            <button className="secondary-button" onClick={previewChoice} disabled={isResolving}><Icon name="intel" /> Preview</button>
            <button className="primary-button" onClick={resolveChoice} disabled={isResolving || forecast?.status === 'over-budget' || Boolean(outcome)}>
              <Icon name="play" /> {isResolving ? 'Calculating…' : 'Complete shift'}
            </button>
          </div>
          {forecast && <p className={`forecast forecast--${forecast.status} ${projectedFinalBattery !== null && projectedFinalBattery < mission.minimumEndingBattery ? 'forecast--reserve-low' : ''}`}>
            Energy: {forecast.availableEnergy} available / {forecast.requiredEnergy} required — {forecast.status === 'within-budget' ? 'within budget' : 'over budget'}
            {projectedFinalBattery !== null && ` · Final battery ${projectedFinalBattery} / ${mission.minimumEndingBattery} required`}
          </p>}
          {error && <p className="error-message" role="alert">{error}</p>}
        </section>
        </div>
        {isBriefingOpen && <MissionBriefing mission={mission} remainingShifts={mission.turns.length - state.turnIndex} onClose={() => setIsBriefingOpen(false)} />}
        {outcome === 'success' && <MissionSuccessModal onRestart={restartMission} />}
        {outcome === 'failure' && <MissionDefeatModal onRestart={restartMission} reasons={lastReasons} />}
      </main>
    )
  }

  return (
    <main>
      <Welcome onStart={handleStartMission} isLoading={isLoading} error={error} />
    </main>
  )
}

type IconName = 'battery' | 'oxygen' | 'food' | 'crop' | 'radiation' | 'life' | 'greenhouse' | 'shelter' | 'command' | 'outpost' | 'systems' | 'intel' | 'settings' | 'play'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    battery: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
    oxygen: 'M12 2c-3.2 4.2-5.5 7.3-5.5 10.5a5.5 5.5 0 0 0 11 0C17.5 9.3 15.2 6.2 12 2Zm-2 11.5a2 2 0 0 0 2 2',
    food: 'M5 3v8m0-4h3m-3 0H2m3 4v9m12-17c2 2 2 5 0 7m0-7v17M15 3c-2 2-2 5 0 7',
    crop: 'M12 21V10m0 5c-4 0-6-2-6-6 4 0 6 2 6 6Zm0-3c0-4 2-6 6-6 0 4-2 6-6 6Z',
    radiation: 'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 2a10 10 0 0 1 8.7 5l-4.3 2.5A5 5 0 0 0 12 7V2Zm8.7 15A10 10 0 0 1 3.3 17l4.3-2.5A5 5 0 0 0 12 17v5ZM3.3 7a10 10 0 0 1 17.4 0L16.4 9.5A5 5 0 0 0 12 7V2Z',
    life: 'M12 5a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V9a4 4 0 0 0-4-4Zm-7 7a7 7 0 0 0 14 0M12 2v3',
    greenhouse: 'M3 20h18M5 20V9l7-5 7 5v11M9 20v-5h6v5M7 11h10',
    shelter: 'M4 19h16M6 19v-7l6-5 6 5v7M9 19v-4h6v4',
    command: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
    outpost: 'M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5',
    systems: 'M4 19V10m5 9V5m5 14v-7m5 7V3',
    intel: 'M4 19V10m5 9V5m5 14v-7m5 7V3',
    settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-13v2m0 15v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6',
    play: 'm8 5 11 7-11 7V5Z',
  }
  return <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>
}

function Choice({ icon, checked, onChange, title, detail }: { icon: IconName; checked: boolean; onChange: () => void; title: string; detail: string }) {
  return <label className={`choice ${checked ? 'choice--active' : ''}`}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="choice__icon"><Icon name={icon} /></span><span><strong>{title}</strong><small>{detail}</small></span>
  </label>
}

function MissionChat({ messages }: { messages: ChatMessage[] }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0) {
      setVisibleCount(0)
      setIsTyping(false)
      return
    }

    if (visibleCount >= messages.length) return

    setIsTyping(true)
    const timer = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + 1, messages.length))
      setIsTyping(false)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [messages.length, visibleCount])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [visibleCount, isTyping])

  const nextMessage = messages[visibleCount]

  return (
    <div className="mission-chat" aria-live="polite">
      {messages.slice(0, visibleCount).map((message) => (
        <div className={`chat-bubble chat-bubble--${message.role}`} key={message.id}>{message.text}</div>
      ))}
      {isTyping && nextMessage && <div className={`chat-bubble chat-bubble--${nextMessage.role}`}>
        <span className="chat-typing" aria-label="Typing"><i /><i /><i /></span>
      </div>}
      <div ref={chatEndRef} />
    </div>
  )
}

function MissionSuccessModal({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <section className="success-modal__card">
        <span className="success-modal__signal">OUTPOST STABLE</span>
        <h2 id="success-title">Mission complete</h2>
        <p>The crew finished safely, harvested enough food, and saved the required battery reserve.</p>
        <button className="primary-button" type="button" onClick={onRestart}>Replay mission</button>
      </section>
    </div>
  )
}

function MissionBriefing({ mission, remainingShifts, onClose }: { mission: Mission; remainingShifts: number; onClose: () => void }) {
  const radiationSource = mission.radiationEvents ? Object.values(mission.radiationEvents)[0] : undefined

  return (
    <div className="briefing-modal" role="dialog" aria-modal="true" aria-labelledby="briefing-title" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="briefing-modal__card">
        <div className="briefing-modal__header">
          <div>
            <span className="panel-kicker">MISSION BRIEFING</span>
            <h2 id="briefing-title">Mission directive</h2>
          </div>
          <button className="briefing-modal__close" type="button" onClick={onClose} aria-label="Close mission briefing">×</button>
        </div>
        <p className="briefing-modal__text">{mission.briefing}</p>
        <div className="briefing-modal__stat"><strong>{remainingShifts}</strong><span>SHIFTS<br />REMAINING</span></div>
        {mission.illuminationSource && <div className="briefing-modal__sources">
          <span className="briefing-modal__sources-title">NASA DATA SOURCES</span>
          <a href={mission.illuminationSource.sourceUrl} target="_blank" rel="noreferrer">Lunar south pole illumination · NASA SVS</a>
          {radiationSource && <a href={radiationSource.sourceUrl} target="_blank" rel="noreferrer">Solar particle event · NASA DONKI</a>}
          <small>{mission.illuminationSource.credits.join(' · ')}</small>
        </div>}
      </section>
    </div>
  )
}

function MissionDefeatModal({ onRestart, reasons }: { onRestart: () => void; reasons: string[] }) {
  return (
    <div className="defeat-modal" role="dialog" aria-modal="true" aria-labelledby="defeat-title">
      <section className="defeat-modal__card">
        <span className="defeat-modal__signal">MISSION SIGNAL LOST</span>
        <h2 id="defeat-title">Mission failed</h2>
        <p>The outpost could not meet its mission requirements. Review the shift report and try again.</p>
        {reasons.length > 0 && <ul className="defeat-modal__reasons">{reasons.slice(-3).map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}</ul>}
        <button className="primary-button" type="button" onClick={onRestart}>Replay mission</button>
      </section>
    </div>
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

function ResourceMeter({ icon, label, value, max, display, tone }: { icon: IconName; label: string; value: number; max: number; display: string; tone: 'blue' | 'green' | 'amber' | 'red' }) {
  const percentage = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))
  return <div className="resource-meter"><div className="resource-meter__icon"><Icon name={icon} /></div><div className="resource-meter__body"><div className="resource-meter__label"><span>{label}</span><strong>{display}</strong></div><div className="resource-meter__track"><i className={`resource-meter__fill resource-meter__fill--${tone}`} style={{ width: `${percentage}%` }} /></div></div></div>
}
