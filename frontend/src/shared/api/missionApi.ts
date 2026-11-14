export type CrewStatus = 'safe' | 'at-risk' | 'critical'

export type MissionState = {
  turnIndex: number
  batteryCharge: number
  foodReserve: number
  cropProgress: number
  harvestTotal: number
  radiationScore: number
  crewStatus: CrewStatus
}

export type MissionTurn = {
  illumination: 'sunlight' | 'shadow'
  illuminationAtUtc: string
  radiationEventId?: string
}

export type Mission = {
  id: string
  title: string
  briefing: string
  initialState: MissionState
  turns: MissionTurn[]
  batteryCapacity: number
  sunlightPower: number
  lifeSupportCost: number
  greenhouseCost: number
  harvestTarget: number
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export async function getMission(missionId: string): Promise<Mission> {
  const response = await fetch(`${apiBaseUrl}/missions/${missionId}`)

  if (!response.ok) {
    throw new Error(`Mission request failed (${response.status})`)
  }

  return response.json() as Promise<Mission>
}
