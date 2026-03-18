import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { 
  Coins, Users, Rocket, Sword, Calendar, Pause, Play, 
  TrendingUp, ShieldAlert, Zap, X, Bell, AlertTriangle, 
  Globe, Landmark, Plus, Minus, Maximize2, Crosshair, Search 
} from 'lucide-react';

// --- CONSTANTS ---
const GAME_TICK_MS = 2000;
const INITIAL_MONEY = 500000000;
const BASE_TAX_RATE = 0.15;
const MILITARY_MAINTENANCE_COST = 0.05;
const COUNTRIES_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const REGION_COLORS = {
  UNCLAIMED: '#334155',
  PLAYER: '#3b82f6',
  AI_NEUTRAL: '#64748b',
  AI_HOSTILE: '#ef4444',
  AI_FRIENDLY: '#10b981',
  SELECTED: '#fbbf24'
};

const PREDEFINED_COUNTRIES = [
  { id: "840", name: "الولايات المتحدة", pop: 331002651, gdp: 21433226, mil: 1200000 },
  { id: "156", name: "الصين", pop: 1439323776, gdp: 14342903, mil: 2185000 },
  { id: "643", name: "روسيا", pop: 145934462, gdp: 1699877, mil: 1013000 },
  { id: "356", name: "الهند", pop: 1380004385, gdp: 2875142, mil: 1444000 },
  { id: "076", name: "البرازيل", pop: 212559417, gdp: 1847333, mil: 334500 },
  { id: "276", name: "ألمانيا", pop: 83783942, gdp: 3861123, mil: 183650 },
  { id: "392", name: "اليابان", pop: 126476461, gdp: 5081770, mil: 247150 },
  { id: "826", name: "المملكة المتحدة", pop: 67886011, gdp: 2827113, mil: 192660 },
  { id: "250", name: "فرنسا", pop: 65273511, gdp: 2715518, mil: 203250 },
  { id: "036", name: "أستراليا", pop: 25499884, gdp: 1392681, mil: 59000 },
  { id: "682", name: "السعودية", pop: 34813871, gdp: 792966, mil: 227000 },
  { id: "818", name: "مصر", pop: 102334404, gdp: 363069, mil: 450000 },
  { id: "784", name: "الإمارات", pop: 9890400, gdp: 421142, mil: 63000 },
  { id: "012", name: "الجزائر", pop: 43851043, gdp: 145000, mil: 130000 },
  { id: "504", name: "المغرب", pop: 36910558, gdp: 114000, mil: 200000 },
  { id: "414", name: "الكويت", pop: 4270563, gdp: 105960, mil: 17500 },
  { id: "634", name: "قطر", pop: 2881060, gdp: 146401, mil: 12000 },
  { id: "512", name: "عمان", pop: 5106622, gdp: 63528, mil: 42000 },
  { id: "422", name: "لبنان", pop: 6825442, gdp: 33383, mil: 60000 },
  { id: "760", name: "سوريا", pop: 17500000, gdp: 20000, mil: 150000 },
  { id: "400", name: "الأردن", pop: 10203134, gdp: 43744, mil: 100000 },
  { id: "368", name: "العراق", pop: 40222503, gdp: 167175, mil: 200000 },
  { id: "736", name: "السودان", pop: 43849260, gdp: 26111, mil: 100000 },
  { id: "788", name: "تونس", pop: 11818618, gdp: 39235, mil: 35000 },
  { id: "434", name: "ليبيا", pop: 6871287, gdp: 25422, mil: 30000 },
  { id: "231", name: "إثيوبيا", pop: 114963583, gdp: 107645, mil: 162000 },
  { id: "710", name: "جنوب أفريقيا", pop: 59308690, gdp: 301924, mil: 66000 },
  { id: "566", name: "نيجيريا", pop: 206139587, gdp: 432294, mil: 162000 },
  { id: "360", name: "إندونيسيا", pop: 273523621, gdp: 1058424, mil: 400000 },
  { id: "702", name: "سنغافورة", pop: 5850342, gdp: 339998, mil: 72000 },
  { id: "124", name: "كندا", pop: 38005238, gdp: 1643408, mil: 68000 },
  { id: "484", name: "المكسيك", pop: 128932753, gdp: 1076163, mil: 277000 },
  { id: "032", name: "الأرجنتين", pop: 45195777, gdp: 383067, mil: 74000 },
  { id: "752", name: "السويد", pop: 10353442, gdp: 538048, mil: 30000 },
  { id: "578", name: "النرويج", pop: 5421242, gdp: 362522, mil: 23000 },
  { id: "724", name: "إسبانيا", pop: 46754778, gdp: 1281199, mil: 120000 },
  { id: "380", name: "إيطاليا", pop: 60461826, gdp: 1886445, mil: 170000 },
  { id: "792", name: "تركيا", pop: 84339067, gdp: 720101, mil: 355000 },
  { id: "364", name: "إيران", pop: 83992953, gdp: 191718, mil: 610000 },
  { id: "586", name: "باكستان", pop: 220892331, gdp: 263687, mil: 654000 }
];

// --- TYPES ---
interface CountryData {
  id: string;
  name: string;
  population: number;
  gdp: number;
  militaryPower: number;
  stability: number;
  researchPoints: number;
  isPlayer: boolean;
  color: string;
  ownerId: string;
  territoryPaths: any[];
}

interface GameState {
  playerCountryId: string | null;
  selectedCountryId: string | null;
  money: number;
  researchTotal: number;
  day: number;
  isPaused: boolean;
  news: NewsEvent[];
}

interface NewsEvent {
  id: string;
  message: string;
  type: 'war' | 'economy' | 'diplomacy' | 'world';
  timestamp: number;
}

// --- GEMINI SERVICE ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generateGlobalNews(gameState: GameState, playerCountry: CountryData | null) {
  try {
    const prompt = `أنت راوٍ للعبة استراتيجية كبرى مثل Dummynation.
    اللاعب يتحكم في دولة: ${playerCountry?.name || 'دولة ما'}.
    يوم اللعبة الحالي هو: ${gameState.day}.
    قم بتوليد 3 عناوين أخبار عالمية قصيرة وواقعية باللغة العربية تعكس التوترات الدولية، التحولات الاقتصادية، أو أحداث عالمية عشوائية.
    يجب أن تكون الاستجابة بصيغة JSON كمصفوفة من الكائنات تحتوي على 'message' و 'type' (economy, war, diplomacy, or world).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ['message', 'type']
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini News Error:", error);
    return [
      { message: "استقرار الأسواق العالمية مع إعادة فتح طرق التجارة.", type: "economy" },
      { message: "استئناف المحادثات الدبلوماسية في المنطقة المحايدة.", type: "diplomacy" }
    ];
  }
}

// --- COMPONENTS ---

const TopBar: React.FC<{ gameState: GameState, playerCountry: CountryData | null, onTogglePause: () => void }> = ({ gameState, playerCountry, onTogglePause }) => {
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
    <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center px-6 justify-between z-10 shadow-lg font-['Cairo']">
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

const NewsTicker: React.FC<{ news: NewsEvent[] }> = ({ news }) => {
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
    <div className="absolute top-20 right-6 w-72 pointer-events-none space-y-2 z-10 font-['Cairo']">
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

const CountryPanel: React.FC<{ country: CountryData | null, playerCountryId: string | null, money: number, onClose: () => void, onAction: (action: string, id: string) => void }> = ({ country, playerCountryId, money, onClose, onAction }) => {
  if (!country) return null;
  const isPlayerOwned = country.ownerId === playerCountryId || country.id === playerCountryId;

  return (
    <div className="w-80 h-full bg-slate-900/95 border-l border-slate-700 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl backdrop-blur-md font-['Cairo']">
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
              <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${country.stability}%` }}></div>
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
              <div className="p-3 bg-slate-800 rounded-lg text-xs text-slate-400 italic text-center">الخيارات الدبلوماسية قريباً...</div>
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

const WorldMap: React.FC<{ countries: Record<string, CountryData>, selectedCountryId: string | null, playerCountryId: string | null, onSelectCountry: (id: string) => void }> = ({ countries, selectedCountryId, playerCountryId, onSelectCountry }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null);
  const projectionRef = useRef<d3.GeoProjection>(null);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch(COUNTRIES_GEO_URL).then(res => res.json()).then(data => {
      setGeoData((feature(data, data.objects.countries) as any).features);
    });
  }, []);

  useEffect(() => {
    if (!geoData || !svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const projection = d3.geoNaturalEarth1().scale(width / 5.5).translate([width / 2, height / 2.2]);
    (projectionRef as any).current = projection;
    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.8, 20]).on('zoom', (event) => g.attr('transform', event.transform));
    (zoomRef as any).current = zoom;
    svg.call(zoom);

    g.selectAll('path').data(geoData).enter().append('path').attr('d', path as any)
      .attr('class', 'country-path transition-all duration-300').attr('stroke', '#0f172a').attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => { onSelectCountry(d.id); event.stopPropagation(); })
      .on('mouseover', function() { d3.select(this).raise().attr('stroke-width', 1.5).attr('stroke', '#fff'); })
      .on('mouseout', function() { d3.select(this).attr('stroke-width', 0.5).attr('stroke', '#0f172a'); });

    svg.call(zoom.transform, d3.zoomIdentity);
    const handleResize = () => {
      const w = svgRef.current?.clientWidth || 0; const h = svgRef.current?.clientHeight || 0;
      projection.scale(w / 5.5).translate([w / 2, h / 2.2]); g.selectAll('path').attr('d', path as any);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [geoData]);

  useEffect(() => {
    if (!geoData || !gRef.current) return;
    d3.select(gRef.current).selectAll('path').transition().duration(200).attr('fill', (d: any) => {
      const id = d.id;
      if (id === selectedCountryId) return REGION_COLORS.SELECTED;
      if (id === playerCountryId || countries[id]?.ownerId === playerCountryId) return REGION_COLORS.PLAYER;
      return REGION_COLORS.UNCLAIMED;
    });
  }, [countries, selectedCountryId, playerCountryId]);

  useEffect(() => {
    if (!selectedCountryId || !geoData || !svgRef.current || !zoomRef.current || !projectionRef.current) return;
    const feat = geoData.find((d: any) => d.id === selectedCountryId);
    if (feat) {
      const w = svgRef.current.clientWidth, h = svgRef.current.clientHeight;
      const path = d3.geoPath().projection(projectionRef.current);
      const b = path.bounds(feat);
      const dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1], x = (b[0][0] + b[1][0]) / 2, y = (b[0][1] + b[1][1]) / 2;
      const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / w, dy / h)));
      d3.select(svgRef.current).transition().duration(1000).call(zoomRef.current.transform, d3.zoomIdentity.translate(w / 2 - scale * x, h / 2 - scale * y).scale(scale));
    }
  }, [selectedCountryId]);

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden font-['Cairo']">
      <svg ref={svgRef} className="w-full h-full outline-none touch-none"><g ref={gRef} /></svg>
      <div className="absolute left-6 bottom-6 flex flex-col gap-2 z-30">
        <button onClick={() => d3.select(svgRef.current!).transition().call(zoomRef.current!.scaleBy, 1.6)} className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white backdrop-blur-md hover:bg-slate-800"><Plus size={22} /></button>
        <button onClick={() => d3.select(svgRef.current!).transition().call(zoomRef.current!.scaleBy, 0.6)} className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white backdrop-blur-md hover:bg-slate-800"><Minus size={22} /></button>
        <button onClick={() => playerCountryId && onSelectCountry(playerCountryId)} className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-blue-500 backdrop-blur-md hover:bg-slate-800"><Crosshair size={22} /></button>
        <button onClick={() => d3.select(svgRef.current!).transition().call(zoomRef.current!.transform, d3.zoomIdentity)} className="p-3 bg-blue-600/90 border border-blue-400 rounded-xl text-white backdrop-blur-md hover:bg-blue-500"><Maximize2 size={22} /></button>
      </div>
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-lg text-[11px] shadow-2xl">
        <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: REGION_COLORS.PLAYER }}></div><span className="font-bold text-slate-300">أراضيك الوطنية</span></div>
        <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-full animate-ping" style={{ backgroundColor: REGION_COLORS.SELECTED }}></div><span className="font-bold text-slate-300">المنطقة المختارة</span></div>
        <div className="flex items-center gap-3"><div className="w-3.5 h-3.5 rounded-full border border-slate-600" style={{ backgroundColor: REGION_COLORS.UNCLAIMED }}></div><span className="font-bold text-slate-300">بقية العالم</span></div>
      </div>
    </div>
  );
};

// --- APP COMPONENT ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerCountryId: null, selectedCountryId: null, money: INITIAL_MONEY,
    researchTotal: 0, day: 1, isPaused: true, news: [{ id: '1', message: "نظام المحاكاة العالمي جاهز. اختر دولتك لقيادة العالم.", type: 'world', timestamp: Date.now() }]
  });
  const [countries, setCountries] = useState<Record<string, CountryData>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const gameStateRef = useRef(gameState);
  const countriesRef = useRef(countries);

  useEffect(() => { gameStateRef.current = gameState; countriesRef.current = countries; }, [gameState, countries]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(COUNTRIES_GEO_URL); const data = await res.json();
        const worldFeatures = (feature(data, data.objects.countries) as any).features;
        const initialData: Record<string, CountryData> = {};
        worldFeatures.forEach((f: any) => {
          const id = f.id, geoName = f.properties.name, pre = PREDEFINED_COUNTRIES.find(c => c.id === id);
          if (pre) {
            initialData[id] = { id, name: pre.name, population: pre.pop, gdp: pre.gdp * 1e6, militaryPower: pre.mil, stability: 80 + Math.floor(Math.random() * 15), researchPoints: 0, isPlayer: false, color: '#64748b', ownerId: id, territoryPaths: [] };
          } else {
            const power = Math.pow(Math.random(), 2);
            const pop = Math.floor(power * 5e7) + 1e5, gdp = pop * (2000 + Math.random() * 40000), mil = Math.floor(pop * (0.001 + Math.random() * 0.01));
            initialData[id] = { id, name: geoName, population: pop, gdp, militaryPower: mil, stability: 60 + Math.floor(Math.random() * 30), researchPoints: 0, isPlayer: false, color: '#64748b', ownerId: id, territoryPaths: [] };
          }
        });
        setCountries(initialData); setIsInitialized(true);
      } catch (err) { console.error(err); }
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current.isPaused || !gameStateRef.current.playerCountryId) return;
      const pc = countriesRef.current[gameStateRef.current.playerCountryId!]; if (!pc) return;
      const profit = (pc.gdp * BASE_TAX_RATE / 365) - (pc.militaryPower * MILITARY_MAINTENANCE_COST);
      if (gameStateRef.current.day % 10 === 0) {
        generateGlobalNews(gameStateRef.current, pc).then(news => {
          setGameState(p => ({ ...p, news: [...p.news, ...news.map((n: any, i: number) => ({ id: `n-${p.day}-${i}`, message: n.message, type: n.type, timestamp: Date.now() }))].slice(-15) }));
        });
      }
      setGameState(p => ({ ...p, day: p.day + 1, money: p.money + profit, researchTotal: p.researchTotal + (pc.population / 2e7) }));
      setCountries(p => {
        const next = { ...p };
        Object.keys(next).forEach(id => { next[id] = { ...next[id], population: Math.floor(next[id].population * 1.0000001), gdp: next[id].gdp * 1.00004 }; });
        return next;
      });
    }, GAME_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCountry = useCallback((id: string) => {
    const t = countriesRef.current[id]; if (!t) return;
    if (!gameStateRef.current.playerCountryId) {
      setGameState(p => ({ ...p, playerCountryId: id, isPaused: false, news: [...p.news, { id: `s-${Date.now()}`, message: `أنت الآن تقود ${t.name}. الهدف: السيطرة العالمية الشاملة.`, type: 'world', timestamp: Date.now() }] }));
    } else { setGameState(p => ({ ...p, selectedCountryId: id })); }
  }, []);

  const handleAction = useCallback((action: string, id: string) => {
    const pid = gameStateRef.current.playerCountryId; if (!pid) return;
    setCountries(p => {
      const next = { ...p }; const t = next[id]; const pl = next[pid]; if (!t || !pl) return p;
      if (action === 'INVEST' && gameStateRef.current.money >= 1e8) { setGameState(g => ({ ...g, money: g.money - 1e8 })); next[id] = { ...t, gdp: t.gdp + 5e8, stability: Math.min(100, t.stability + 1) }; }
      if (action === 'MILITARY_BOOST' && gameStateRef.current.money >= 2e8) { setGameState(g => ({ ...g, money: g.money - 2e8 })); next[id] = { ...t, militaryPower: t.militaryPower + 40000 }; }
      if (action === 'INVADE') {
        if (pl.militaryPower > t.militaryPower) {
          next[id] = { ...t, ownerId: pid, stability: 50, militaryPower: Math.floor(t.militaryPower * 0.3) };
          next[pid] = { ...pl, militaryPower: Math.floor(pl.militaryPower - (t.militaryPower * 0.35)) };
          setGameState(g => ({ ...g, news: [...g.news, { id: `w-${Date.now()}`, message: `سقوط العاصمة! ${pl.name} تبسط سيطرتها على ${t.name}.`, type: 'war', timestamp: Date.now() }] }));
        } else {
          next[pid] = { ...pl, militaryPower: Math.floor(pl.militaryPower * 0.6), stability: Math.max(0, pl.stability - 15) };
          setGameState(g => ({ ...g, news: [...g.news, { id: `w-${Date.now()}`, message: `فشل عسكري! قوات ${pl.name} تتراجع أمام مقاومة ${t.name} الشرسة.`, type: 'war', timestamp: Date.now() }] }));
        }
      }
      return next;
    });
  }, []);

  const filtered = useMemo(() => Object.values(countries).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => b.population - a.population), [countries, searchQuery]);

  if (!isInitialized) return <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-6"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><div className="text-blue-400 font-bold text-xl animate-pulse font-['Cairo'] tracking-widest">جارٍ تحليل 195 دولة...</div></div>;

  const pc = gameState.playerCountryId ? countries[gameState.playerCountryId] : null;
  const sc = gameState.selectedCountryId ? countries[gameState.selectedCountryId] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-100 selection:bg-blue-500/30 font-['Cairo']">
      <TopBar gameState={gameState} playerCountry={pc} onTogglePause={() => setGameState(p => ({ ...p, isPaused: !p.isPaused }))} />
      <div className="flex-1 flex relative">
        <WorldMap countries={countries} selectedCountryId={gameState.selectedCountryId} playerCountryId={gameState.playerCountryId} onSelectCountry={handleSelectCountry} />
        <NewsTicker news={gameState.news} />
        {sc && <div className="absolute top-0 left-0 h-full z-40"><CountryPanel country={sc} playerCountryId={gameState.playerCountryId} money={gameState.money} onClose={() => setGameState(p => ({ ...p, selectedCountryId: null }))} onAction={handleAction} /></div>}
        {!gameState.playerCountryId && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-4xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-700">
              <div className="flex flex-col items-center text-center"><div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 flex items-center justify-center shadow-lg"><Globe size={32} className="text-white animate-pulse" /></div><h1 className="text-4xl font-black text-white mb-2">الدولة رقم 196؟</h1><p className="text-slate-400 text-lg">اختر مهد إمبراطوريتك من بين جميع دول العالم.</p></div>
              <div className="relative group"><Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} /><input type="text" placeholder="ابحث عن دولتك..." className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-blue-500 text-lg font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[50vh] custom-scrollbar">
                {filtered.map(c => <button key={c.id} onClick={() => handleSelectCountry(c.id)} className="group relative p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-sm font-bold shadow-md border border-slate-700 flex flex-col gap-1 items-start overflow-hidden"><span className="relative z-10 text-slate-100 group-hover:text-blue-400 truncate w-full text-right">{c.name}</span><span className="text-[10px] text-slate-500 font-mono">{(c.population / 1e6).toFixed(1)}M POP</span><div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div></button>)}
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-widest"><span>إصدار الهيمنة v0.8.0</span><span>العالم بين يديك</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- RENDER ---
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}
