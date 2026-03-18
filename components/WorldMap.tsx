
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { COUNTRIES_GEO_URL, REGION_COLORS } from '../constants';
import { CountryData } from '../types';
import { Plus, Minus, Maximize2, Crosshair } from 'lucide-react';

interface WorldMapProps {
  countries: Record<string, CountryData>;
  selectedCountryId: string | null;
  playerCountryId: string | null;
  onSelectCountry: (id: string) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ countries, selectedCountryId, playerCountryId, onSelectCountry }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null);
  const projectionRef = useRef<d3.GeoProjection>(null);
  const [geoData, setGeoData] = useState<any>(null);

  // تحميل البيانات الجغرافية مرة واحدة
  useEffect(() => {
    fetch(COUNTRIES_GEO_URL)
      .then(res => res.json())
      .then(data => {
        const countriesFeature = (feature(data, data.objects.countries) as any).features;
        setGeoData(countriesFeature);
      });
  }, []);

  // تهيئة الخريطة والزووم مرة واحدة عند تحميل البيانات
  useEffect(() => {
    if (!geoData || !svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const projection = d3.geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2.2]);

    (projectionRef as any).current = projection;
    const path = d3.geoPath().projection(projection);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 20])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    (zoomRef as any).current = zoom;
    svg.call(zoom);

    // الرسم الأولي للحدود
    g.selectAll('path')
      .data(geoData)
      .enter()
      .append('path')
      .attr('d', path as any)
      .attr('class', 'country-path transition-all duration-300 ease-in-out')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => {
        onSelectCountry(d.id);
        event.stopPropagation();
      })
      .on('mouseover', function() {
        d3.select(this).raise().attr('stroke-width', 1.5).attr('stroke', '#fff');
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-width', 0.5).attr('stroke', '#0f172a');
      });

    // إعادة ضبط العرض في البداية
    svg.call(zoom.transform, d3.zoomIdentity);

    // معالجة تغيير حجم النافذة
    const handleResize = () => {
      const w = svgRef.current?.clientWidth || 0;
      const h = svgRef.current?.clientHeight || 0;
      projection.scale(w / 5.5).translate([w / 2, h / 2.2]);
      g.selectAll('path').attr('d', path as any);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [geoData]); // نعتمد فقط على geoData لعدم تدمير الزووم

  // تحديث الألوان فقط عند تغيير الحالة (بدون إعادة رسم المسارات)
  useEffect(() => {
    if (!geoData || !gRef.current) return;
    const g = d3.select(gRef.current);

    g.selectAll('path')
      .transition()
      .duration(200)
      .attr('fill', (d: any) => {
        const id = d.id;
        if (id === selectedCountryId) return REGION_COLORS.SELECTED;
        if (id === playerCountryId) return REGION_COLORS.PLAYER;
        
        const country = countries[id];
        if (country?.ownerId === playerCountryId) return REGION_COLORS.PLAYER;
        
        return REGION_COLORS.UNCLAIMED;
      });
  }, [countries, selectedCountryId, playerCountryId]);

  // ميزة الـ Fly-to: التركيز على الدولة المختارة
  useEffect(() => {
    if (!selectedCountryId || !geoData || !svgRef.current || !zoomRef.current || !projectionRef.current) return;

    const selectedFeature = geoData.find((d: any) => d.id === selectedCountryId);
    if (selectedFeature) {
      const svg = d3.select(svgRef.current);
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      
      const path = d3.geoPath().projection(projectionRef.current);
      const bounds = path.bounds(selectedFeature);
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const x = (bounds[0][0] + bounds[1][0]) / 2;
      const y = (bounds[0][1] + bounds[1][1]) / 2;
      
      const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
      const translate = [width / 2 - scale * x, height / 2 - scale * y];

      svg.transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
    }
  }, [selectedCountryId]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.scaleBy, 1.6);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.scaleBy, 0.6);
    }
  };

  const handleReset = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(
        zoomRef.current.transform,
        d3.zoomIdentity
      );
    }
  };

  const focusOnPlayer = () => {
    if (playerCountryId) {
      // إجبار النظام على الانتقال إلى دولة اللاعب عبر إعادة تعيين المعرف المحدد
      onSelectCountry(playerCountryId);
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full outline-none touch-none">
        <g ref={gRef} />
      </svg>

      {/* أزرار التحكم الجانبية */}
      <div className="absolute left-6 bottom-6 flex flex-col gap-2 z-30">
        <button 
          onClick={handleZoomIn}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-white shadow-xl transition-all active:scale-90 backdrop-blur-md group"
          title="تقريب"
        >
          <Plus size={22} className="group-hover:text-blue-400 transition-colors" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-white shadow-xl transition-all active:scale-90 backdrop-blur-md group"
          title="تبعيد"
        >
          <Minus size={22} className="group-hover:text-blue-400 transition-colors" />
        </button>
        <button 
          onClick={focusOnPlayer}
          className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-xl text-blue-500 shadow-xl transition-all active:scale-90 backdrop-blur-md group"
          title="تحديد موقعي"
        >
          <Crosshair size={22} className="group-hover:scale-110 transition-transform" />
        </button>
        <button 
          onClick={handleReset}
          className="p-3 bg-blue-600/90 hover:bg-blue-500 border border-blue-400 rounded-xl text-white shadow-xl transition-all active:scale-90 backdrop-blur-md"
          title="كامل الخريطة"
        >
          <Maximize2 size={22} />
        </button>
      </div>

      {/* مفتاح الألوان */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-lg text-[11px] shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
        <div className="flex items-center gap-3 group">
          <div className="w-3.5 h-3.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ backgroundColor: REGION_COLORS.PLAYER }}></div>
          <span className="font-bold text-slate-300 uppercase tracking-tighter">أراضيك الوطنية</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full animate-ping" style={{ backgroundColor: REGION_COLORS.SELECTED }}></div>
          <span className="font-bold text-slate-300 uppercase tracking-tighter">المنطقة المختارة</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full border border-slate-600" style={{ backgroundColor: REGION_COLORS.UNCLAIMED }}></div>
          <span className="font-bold text-slate-300 uppercase tracking-tighter">بقية العالم</span>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
