
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, CountryData, NewsEvent } from './types';
import { BASE_TAX_RATE, GAME_TICK_MS, INITIAL_MONEY, MILITARY_MAINTENANCE_COST, COUNTRIES_GEO_URL } from './constants';
import WorldMap from './components/WorldMap';
import TopBar from './components/TopBar';
import CountryPanel from './components/CountryPanel';
import NewsTicker from './components/NewsTicker';
import { generateGlobalNews } from './services/geminiService';
import { Maximize2, Search, Globe } from 'lucide-react';
import { feature } from 'topojson-client';

// قائمة الدول المحددة ببيانات دقيقة (سيتم استخدامها كمرجع والباقي يولد تلقائياً)
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

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerCountryId: null,
    selectedCountryId: null,
    money: INITIAL_MONEY,
    researchTotal: 0,
    day: 1,
    isPaused: true,
    news: [
      { id: '1', message: "نظام المحاكاة العالمي جاهز. اختر دولتك لقيادة العالم.", type: 'world', timestamp: Date.now() }
    ]
  });

  const [countries, setCountries] = useState<Record<string, CountryData>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const gameStateRef = useRef(gameState);
  const countriesRef = useRef(countries);

  useEffect(() => {
    gameStateRef.current = gameState;
    countriesRef.current = countries;
  }, [gameState, countries]);

  // تهيئة شاملة لجميع الدول من ملف الخريطة
  useEffect(() => {
    const initializeAllCountries = async () => {
      try {
        const response = await fetch(COUNTRIES_GEO_URL);
        const data = await response.json();
        const worldFeatures = (feature(data, data.objects.countries) as any).features;
        
        const initialData: Record<string, CountryData> = {};
        
        worldFeatures.forEach((f: any) => {
          const id = f.id;
          const geoName = f.properties.name;
          
          const preDefined = PREDEFINED_COUNTRIES.find(c => c.id === id);
          
          if (preDefined) {
            initialData[id] = {
              id: id,
              name: preDefined.name,
              population: preDefined.pop,
              gdp: preDefined.gdp * 1000000,
              militaryPower: preDefined.mil,
              stability: 80 + Math.floor(Math.random() * 15),
              researchPoints: 0,
              isPlayer: false,
              color: '#64748b',
              ownerId: id,
              territoryPaths: []
            };
          } else {
            // توليد منطقي لبقية العالم (توزيع عشوائي منحاز للواقع)
            // استخدام "قانون القوة" لتوزيع السكان والناتج المحلي
            const powerLaw = Math.pow(Math.random(), 2);
            const randomPop = Math.floor(powerLaw * 50000000) + 100000;
            const randomGDPPerCapita = 2000 + (Math.random() * 40000);
            const randomGDP = (randomPop * randomGDPPerCapita);
            const randomMil = Math.floor(randomPop * (0.001 + Math.random() * 0.01)); 
            
            initialData[id] = {
              id: id,
              name: geoName,
              population: randomPop,
              gdp: randomGDP,
              militaryPower: randomMil,
              stability: 60 + Math.floor(Math.random() * 30),
              researchPoints: 0,
              isPlayer: false,
              color: '#64748b',
              ownerId: id,
              territoryPaths: []
            };
          }
        });

        setCountries(initialData);
        setIsInitialized(true);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    initializeAllCountries();
  }, []);

  // حلقة اللعبة الزمنية
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current.isPaused || !gameStateRef.current.playerCountryId) return;

      const playerCountry = countriesRef.current[gameStateRef.current.playerCountryId!];
      if (!playerCountry) return;

      const dailyIncome = (playerCountry.gdp * BASE_TAX_RATE) / 365;
      const maintenance = (playerCountry.militaryPower * MILITARY_MAINTENANCE_COST);
      const netProfit = dailyIncome - maintenance;

      // توليد أخبار كل 10 أيام
      if (gameStateRef.current.day % 10 === 0) {
        generateGlobalNews(gameStateRef.current, playerCountry).then(newNews => {
          const formattedNews: NewsEvent[] = newNews.map((n: any, i: number) => ({
            id: `news-${gameStateRef.current.day}-${i}`,
            message: n.message,
            type: n.type,
            timestamp: Date.now()
          }));
          setGameState(prev => ({
            ...prev,
            news: [...prev.news, ...formattedNews].slice(-15)
          }));
        });
      }

      setGameState(prev => ({
        ...prev,
        day: prev.day + 1,
        money: prev.money + netProfit,
        researchTotal: prev.researchTotal + (playerCountry.population / 2e7)
      }));

      // تحديث إحصائيات العالم (نمو بسيط)
      setCountries(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          const c = next[id];
          next[id] = {
            ...c,
            population: Math.floor(c.population * (1 + 0.00005 / 365)),
            gdp: c.gdp * (1 + 0.015 / 365)
          };
        });
        return next;
      });

    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, []);

  const handleSelectCountry = useCallback((id: string) => {
    const target = countriesRef.current[id];
    if (!target) return;

    if (!gameStateRef.current.playerCountryId) {
      setGameState(prev => ({
        ...prev,
        playerCountryId: id,
        isPaused: false,
        news: [...prev.news, { 
          id: `start-${Date.now()}`, 
          message: `أنت الآن تقود ${target.name}. الهدف: السيطرة العالمية الشاملة.`, 
          type: 'world', 
          timestamp: Date.now() 
        }]
      }));
    } else {
      setGameState(prev => ({ ...prev, selectedCountryId: id }));
    }
  }, []);

  const handleAction = useCallback((action: string, id: string) => {
    const playerCountryId = gameStateRef.current.playerCountryId;
    if (!playerCountryId) return;

    setCountries(prev => {
      const next = { ...prev };
      const target = next[id];
      const player = next[playerCountryId];
      if (!target || !player) return prev;

      switch(action) {
        case 'INVEST':
          if (gameStateRef.current.money < 1e8) return prev;
          setGameState(g => ({ ...g, money: g.money - 1e8 }));
          next[id] = { ...target, gdp: target.gdp + 5e8, stability: Math.min(100, target.stability + 1) };
          break;
        case 'MILITARY_BOOST':
          if (gameStateRef.current.money < 2e8) return prev;
          setGameState(g => ({ ...g, money: g.money - 2e8 }));
          next[id] = { ...target, militaryPower: target.militaryPower + 40000 };
          break;
        case 'INVADE':
          const attackerPower = player.militaryPower;
          const defenderPower = target.militaryPower;

          if (attackerPower > defenderPower) {
            next[id] = { 
              ...target, 
              ownerId: playerCountryId, 
              stability: 50, 
              militaryPower: Math.floor(target.militaryPower * 0.3) 
            };
            next[playerCountryId] = {
              ...player,
              militaryPower: Math.floor(player.militaryPower - (defenderPower * 0.35))
            };
            setGameState(prev => ({
              ...prev,
              news: [...prev.news, {
                id: `war-${Date.now()}`,
                message: `سقوط العاصمة! ${player.name} تبسط سيطرتها على ${target.name}.`,
                type: 'war',
                timestamp: Date.now()
              }]
            }));
          } else {
            next[playerCountryId] = {
              ...player,
              militaryPower: Math.floor(player.militaryPower * 0.6),
              stability: Math.max(0, player.stability - 15)
            };
            setGameState(prev => ({
              ...prev,
              news: [...prev.news, {
                id: `war-${Date.now()}`,
                message: `فشل عسكري! قوات ${player.name} تتراجع أمام مقاومة ${target.name} الشرسة.`,
                type: 'war',
                timestamp: Date.now()
              }]
            }));
          }
          break;
      }
      return next;
    });
  }, []);

  // تصفية الدول للبحث
  const filteredCountries = useMemo(() => {
    return Object.values(countries)
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.population - a.population);
  }, [countries, searchQuery]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-blue-400 font-bold text-xl animate-pulse font-['Cairo'] tracking-widest">
          جارٍ تحليل 195 دولة...
        </div>
      </div>
    );
  }

  const playerCountry = gameState.playerCountryId ? countries[gameState.playerCountryId] : null;
  const selectedCountry = gameState.selectedCountryId ? countries[gameState.selectedCountryId] : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-100 selection:bg-blue-500/30 font-['Cairo']">
      <TopBar 
        gameState={gameState} 
        playerCountry={playerCountry} 
        onTogglePause={() => setGameState(p => ({ ...p, isPaused: !p.isPaused }))} 
      />
      
      <div className="flex-1 flex relative">
        <WorldMap 
          countries={countries}
          selectedCountryId={gameState.selectedCountryId}
          playerCountryId={gameState.playerCountryId}
          onSelectCountry={handleSelectCountry}
        />
        
        <NewsTicker news={gameState.news} />

        {selectedCountry && (
          <div className="absolute top-0 left-0 h-full z-40">
            <CountryPanel 
              country={selectedCountry}
              playerCountryId={gameState.playerCountryId}
              money={gameState.money}
              onClose={() => setGameState(p => ({ ...p, selectedCountryId: null }))}
              onAction={handleAction}
            />
          </div>
        )}

        {!gameState.playerCountryId && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-4xl p-8 rounded-[3rem] border border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col gap-6 animate-in fade-in zoom-in duration-700">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 flex items-center justify-center shadow-lg shadow-blue-900/40">
                  <Globe size={32} className="text-white animate-pulse" />
                </div>
                <h1 className="text-4xl font-black text-white mb-2">الدولة رقم 196؟</h1>
                <p className="text-slate-400 text-lg max-w-xl">اختر مهد إمبراطوريتك. جميع دول العالم متاحة لقيادتك، من العمالقة إلى الدول الصغيرة.</p>
              </div>

              {/* محرك البحث */}
              <div className="relative group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="ابحث عن دولتك (مثلاً: مصر، السعودية، البرازيل...)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pr-12 pl-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[50vh]">
                {filteredCountries.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCountry(c.id)}
                    className="group relative p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all text-sm font-bold shadow-md border border-slate-700 hover:border-blue-500/50 flex flex-col gap-1 items-start overflow-hidden"
                  >
                    <span className="relative z-10 text-slate-100 group-hover:text-blue-400 truncate w-full text-right">{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{(c.population / 1e6).toFixed(1)}M POP</span>
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="col-span-full py-10 text-slate-500 italic">لا توجد نتائج لمطابقة بحثك...</div>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 uppercase tracking-widest font-bold">
                <span>إصدار الهيمنة v0.7.5</span>
                <span>العالم بين يديك</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
