// src/pages/GatePass.jsx
// The review modal has moved into GatePasses.jsx (opened inline when a row's
// Review button is clicked). This file redirects to /passes so any old
// bookmarks / links don't 404.

import { Navigate } from 'react-router'
export default function GatePass() { return <Navigate to="/passes" replace /> }
