
import React from 'react';
import { GameState, CountryData } from '../types';
import { Coins, Users, Rocket, Sword, Calendar, Pause, Play } from 'lucide-react';

interface TopBarProps {
  gameState: GameState;
  playerCountry: CountryData | null;
  onTogglePause: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ gameState, playerCountry, onTogglePause }) => {
  const formatMoney = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} مليار$`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون$`;
    return `${val.toLocaleString()}$`;
  };

  const formatPop = (val: number) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون`;
    return val.toLocaleString();
  };

  return (
    <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between z-10 shadow-lg">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">الدولة</span>
          <span className="text-blue-400 font-bold text-lg">{playerCountry?.name || 'جارٍ الاختيار...'}</span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <Coins size={16} className="text-yellow-500" />
            <span className="font-mono font-medium">{formatMoney(gameState.money)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <Users size={16} className="text-blue-400" />
            <span className="font-mono font-medium">{formatPop(playerCountry?.population || 0)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <Sword size={16} className="text-red-500" />
            <span className="font-mono font-medium">{(playerCountry?.militaryPower || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <Rocket size={16} className="text-purple-400" />
            <span className="font-mono font-medium">{gameState.researchTotal.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-300 bg-slate-800 px-4 py-1.5 rounded-lg border border-slate-700 font-mono text-sm">
          <Calendar size={16} />
          <span>اليوم {gameState.day}</span>
        </div>
        <button 
          onClick={onTogglePause}
          className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-md shadow-blue-900/20"
        >
          {gameState.isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>
      </div>
    </div>
  );
};

export default TopBar;
