import React from 'react'
import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <h1 className="text-6xl font-bold text-[#0F2259]">404</h1>
      <p className="text-gray-500 text-lg">Page not found.</p>
      <Link to="/" className="text-[#0F2259] underline hover:opacity-70">
        Go back home
      </Link>
    </div>
  )
}
