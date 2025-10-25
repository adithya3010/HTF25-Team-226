import React from 'react'
import Beams from './Beams';
import Navbar from './Navbar';

const LandingPage = () => {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Background beams - absolute, full-viewport, behind content */}
      <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <div class="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
      </div>
              <h1 className='z-1'>CHAT ROOM</h1>

      {/* Foreground content - centered and above beams */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%',  color: 'white',  padding: '2rem' }}>
        <h1 className='text-4xl font-bold'>CHAT ROOM</h1>
        <p className='mt-2 text-lg'>Join the conversation and connect with others!</p>
      </div>
    </div>
  )
}

export default LandingPage
