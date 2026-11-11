import GateStationKiosk from './GateStationKiosk'

export default function GateStation({ kiosk = false }) {
  return <GateStationKiosk kiosk={kiosk} />
}
