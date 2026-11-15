export type CrewStatus = 'safe' | 'at-risk' | 'critical'

export type MissionState = {
  turnIndex: number
  batteryCharge: number
  oxygenReserve: number
  foodReserve: number
  cropProgress: number
  harvestTotal: number
  radiationScore: number
  crewStatus: CrewStatus
}

export type MissionTurn = {
  illumination: 'sunlight' | 'shadow'
  illuminationSourceUrl?: string
  illuminationFrameNumber?: number
  illuminationAtUtc: string
  radiationEventId?: string
}

export type MissionRules = {
  oxygenConsumptionPerTurn: number
  oxygenProductionPerLifeSupportTurn: number
  cropGrowthPerGreenhouseTurn: number
  harvestThreshold: number
  crewCriticalRadiation: number
}

export type MissionIlluminationSource = {
  sourceUrl: string
  visualizationYear: number
  fieldOfView: string
  credits: string[]
}

export type MissionRadiationEvent = {
  activityId: string
  eventType: string
  observedAtUtc: string
  observatory: string
  instrument: string
  sourceUrl: string
}

export type PlayerChoice = {
  powerLifeSupport: boolean
  powerGreenhouse: boolean
  shelterCrew: boolean
}

export type ForecastResponse = {
  status: 'within-budget' | 'over-budget'
  availableEnergy: number
  requiredEnergy: number
}

export type TurnResolutionResponse = {
  status: 'resolved' | 'over-budget'
  availableEnergy: number
  requiredEnergy: number
  state?: MissionState
  outcome?: 'in-progress' | 'success' | 'failure'
  reasons?: string[]
}

export type Mission = {
  id: string
  title: string
  briefing: string
  initialState: MissionState
  turns: MissionTurn[]
  batteryCapacity: number
  oxygenCapacity: number
  sunlightPower: number
  lifeSupportCost: number
  greenhouseCost: number
  shelterCost: number
  harvestTarget: number
  minimumEndingBattery: number
  rules: MissionRules
  illuminationSource?: MissionIlluminationSource
  radiationEvents?: Record<string, MissionRadiationEvent>
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL
const apiBaseUrls = [
  configuredApiBaseUrl,
  ...(import.meta.env.DEV ? ['http://localhost:8080/api/v1', 'http://localhost:8081/api/v1'] : []),
  'https://lunar-shift-backend.onrender.com/api/v1',
  'https://nasa-ctrl-c-ctrl-v-1.onrender.com/api/v1',
].filter((url, index, urls): url is string => Boolean(url) && urls.indexOf(url) === index)

let activeApiBaseUrl = apiBaseUrls[0]

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let lastError: Error | null = null
  const candidates = [activeApiBaseUrl, ...apiBaseUrls.filter((url) => url !== activeApiBaseUrl)]

  for (const baseUrl of candidates) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8_000)

    try {
      const response = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal })
      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(`API request failed at ${baseUrl} (${response.status})`)
      }

      activeApiBaseUrl = baseUrl
      return await response.json() as T
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('API request failed')
    } finally {
      window.clearTimeout(timeout)
    }
  }

  throw lastError ?? new Error('No API endpoint is available')
}

export async function getMission(missionId: string): Promise<Mission> {
  return requestJson<Mission>(`/missions/${missionId}`)
}

async function postTurn(
  missionId: string,
  endpoint: 'forecast' | 'turns',
  state: MissionState,
  choice: PlayerChoice,
) {
  return requestJson<ForecastResponse | TurnResolutionResponse>(`/missions/${missionId}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state, choice }),
  })
}

export function forecastTurn(missionId: string, state: MissionState, choice: PlayerChoice) {
  return postTurn(missionId, 'forecast', state, choice) as Promise<ForecastResponse>
}

export function resolveTurn(missionId: string, state: MissionState, choice: PlayerChoice) {
  return postTurn(missionId, 'turns', state, choice) as Promise<TurnResolutionResponse>
}
