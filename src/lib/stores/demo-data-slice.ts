import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type {
  GateLogEntry,
  GatePass,
  GatePassStatus,
  Ticket,
} from '../types/types'

export interface ProfilePreferences {
  name: string
  email: string
  phone: string
  office: string
  language: string
  timezone: string
}

export interface NotificationPreferences {
  ticketAtRisk: boolean
  ticketBreaches: boolean
  newGatePass: boolean
  stockMinimum: boolean
  weeklyReport: boolean
}

interface DemoDataState {
  submittedTickets: Ticket[]
  submittedPasses: GatePass[]
  gatePassStatusUpdates: Record<string, GatePassStatus>
  gateEvents: GateLogEntry[]
  profiles: Record<string, ProfilePreferences>
  notificationPreferences: NotificationPreferences
}

const initialState: DemoDataState = {
  submittedTickets: [],
  submittedPasses: [],
  gatePassStatusUpdates: {},
  gateEvents: [],
  profiles: {},
  notificationPreferences: {
    ticketAtRisk: true,
    ticketBreaches: true,
    newGatePass: true,
    stockMinimum: true,
    weeklyReport: false,
  },
}

const demoDataSlice = createSlice({
  name: 'demoData',
  initialState,
  reducers: {
    addSubmittedTicket(state, action: PayloadAction<Ticket>) {
      state.submittedTickets.push(action.payload)
    },
    addSubmittedPass(state, action: PayloadAction<GatePass>) {
      state.submittedPasses.push(action.payload)
    },
    setGatePassStatus(
      state,
      action: PayloadAction<{ passId: string; status: GatePassStatus }>,
    ) {
      state.gatePassStatusUpdates[action.payload.passId] = action.payload.status
    },
    addGateEvents(state, action: PayloadAction<GateLogEntry[]>) {
      state.gateEvents.unshift(...action.payload)
    },
    saveProfilePreferences(
      state,
      action: PayloadAction<{ userId: string; profile: ProfilePreferences }>,
    ) {
      state.profiles[action.payload.userId] = action.payload.profile
    },
    setNotificationPreference(
      state,
      action: PayloadAction<{ key: keyof NotificationPreferences; value: boolean }>,
    ) {
      state.notificationPreferences[action.payload.key] = action.payload.value
    },
  },
})

export const {
  addSubmittedTicket,
  addSubmittedPass,
  setGatePassStatus,
  addGateEvents,
  saveProfilePreferences,
  setNotificationPreference,
} = demoDataSlice.actions

export default demoDataSlice.reducer
