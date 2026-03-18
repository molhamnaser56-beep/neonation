
import React from 'react';
import { NewsEvent } from '../types';
import { Bell, AlertTriangle, Globe, Landmark } from 'lucide-react';

interface NewsTickerProps {
  news: NewsEvent[];
}

const NewsTicker: React.FC<NewsTickerProps> = ({ news }) => {
  const latestNews = [...news].reverse().slice(0, 5);

  const getIcon = (type: string) => {
    switch(type) {
      case 'war': return <AlertTriangle size={14} className="text-red-500" />;
      case 'economy': return <Landmark size={14} className="text-green-500" />;
      case 'diplomacy': return <Globe size={14} className="text-blue-500" />;
      default: return <Bell size={14} className="text-slate-400" />;
    }
  };

  return (
    // Moved to right-6 for RTL
    <div className="absolute top-20 right-6 w-72 pointer-events-none space-y-2 z-10">
      {latestNews.map((n, i) => (
        <div 
          key={n.id}
          className="flex items-start gap-3 bg-slate-900/90 border border-slate-700/50 p-3 rounded-lg backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-right duration-500"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="mt-0.5">{getIcon(n.type)}</div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {n.message}
          </p>
        </div>
      ))}
    </div>
  );
};

export default NewsTicker;
