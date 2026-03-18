
import React from 'react';
import { CountryData, GameState } from '../types';
import { Sword, TrendingUp, ShieldAlert, Zap, X } from 'lucide-react';

interface CountryPanelProps {
  country: CountryData | null;
  playerCountryId: string | null;
  money: number;
  onClose: () => void;
  onAction: (action: string, id: string) => void;
}

const CountryPanel: React.FC<CountryPanelProps> = ({ country, playerCountryId, money, onClose, onAction }) => {
  if (!country) return null;

  const isPlayerOwned = country.ownerId === playerCountryId || country.id === playerCountryId;

  return (
    <div className="w-80 bg-slate-900/95 border-r border-slate-700 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl backdrop-blur-md">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h2 className="font-bold text-xl text-slate-100">{country.name}</h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="space-y-4">
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">الناتج المحلي</span>
              <span className="font-mono text-green-400">${(country.gdp / 1e9).toFixed(1)} مليار</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">عدد السكان</span>
              <span className="font-mono">{country.population.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">القوة العسكرية</span>
              <span className="font-mono text-red-400">{country.militaryPower.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">الاستقرار</span>
              <span className="text-sm font-bold text-blue-400">{country.stability}%</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-1000" 
                style={{ width: `${country.stability}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">الإجراءات المتاحة</h3>
          
          {isPlayerOwned ? (
            <>
              <button 
                onClick={() => onAction('INVEST', country.id)}
                className="w-full flex items-center justify-between p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-600/40 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-green-500" />
                  <span className="text-sm font-medium">استثمار في الاقتصاد</span>
                </div>
                <span className="text-xs font-mono text-green-400">-100 مليون$</span>
              </button>
              
              <button 
                onClick={() => onAction('MILITARY_BOOST', country.id)}
                className="w-full flex items-center justify-between p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Sword size={18} className="text-red-500" />
                  <span className="text-sm font-medium">تطوير الجيش</span>
                </div>
                <span className="text-xs font-mono text-red-400">-250 مليون$</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onAction('INVADE', country.id)}
                className="w-full flex items-center justify-between p-3 bg-red-600 hover:bg-red-500 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert size={18} />
                  <span className="text-sm font-bold">بدء غزو عسكري</span>
                </div>
                <Zap size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-400 italic text-center">
                الخيارات الدبلوماسية قريباً...
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-800/50 border-t border-slate-700">
        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">الحالة</div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlayerOwned ? 'bg-blue-500' : 'bg-slate-500'}`}></div>
          <span className="text-xs">{isPlayerOwned ? 'إقليم تابع لك' : 'دولة ذات سيادة'}</span>
        </div>
      </div>
    </div>
  );
};

export default CountryPanel;
