
import React from 'react';

const TronGrid: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-tron-dark">
      {/* Horizon Glow */}
      <div className="absolute top-0 left-0 w-full h-[40%] bg-gradient-to-b from-black to-transparent z-10"></div>
      
      {/* The Grid Floor */}
      <div className="absolute bottom-0 left-[-50%] right-[-50%] h-[60vh] origin-[50%_0%] transform perspective-[400px] rotate-x-[60deg] z-0">
          <div className="w-full h-[200%] bg-[linear-gradient(transparent_95%,_rgba(0,243,255,0.4)_95%),_linear-gradient(90deg,_transparent_95%,_rgba(0,243,255,0.4)_95%)] bg-[size:40px_40px] animate-grid-flow"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Ambient Particles */}
      <div className="absolute inset-0 z-10 opacity-30">
           <div className="absolute top-[20%] left-[20%] w-1 h-1 bg-tron-cyan shadow-[0_0_10px_#00f3ff] animate-pulse"></div>
           <div className="absolute top-[50%] right-[30%] w-2 h-2 bg-tron-orange shadow-[0_0_15px_#ff9e00] animate-pulse delay-700"></div>
      </div>
    </div>
  );
};

export default TronGrid;
