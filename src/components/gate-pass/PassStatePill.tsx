import { PASS_STATE_CLASS, passState } from '../../lib/api/gates/gate-pass-format'
import type { GatePass } from '../../lib/api/gates/types'

export default function PassStatePill({ pass }: { pass: Pick<GatePass, 'status' | 'overdue' | 'isReturnable'> }) {
  const state = passState(pass)
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${PASS_STATE_CLASS[state]}`}>
      {state}
    </span>
  )
}
