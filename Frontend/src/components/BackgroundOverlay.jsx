import React from 'react';

export function BackgroundOverlay({ className = '' }) {
  return (
    // use fixed so it covers the viewport even if parent isn't full-height
    <div className={`fixed inset-0 z-0 pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-indigo-950"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-40"></div>
    </div>
  );
}

export default BackgroundOverlay;
