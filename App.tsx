import React from 'react';
import MinionBattle from './components/MinionBattle';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-b from-[#1e3a8a] to-[#020617]">
      <MinionBattle />
    </div>
  );
};

export default App;