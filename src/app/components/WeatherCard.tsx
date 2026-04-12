import { Cloud, Sun, CloudRain, CloudSun } from 'lucide-react';
import { GlassSurface } from './shared/GlassSurface';

export function WeatherCard() {
  return (
    <GlassSurface
      variant="card"
      rounded="none"
      className="group flex h-full w-full cursor-pointer flex-col justify-between rounded-[36px] p-8 transition-transform duration-200 hover:bg-white/50"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base text-gray-700 mb-2 font-medium">Tokyo, Japan</p>
          <div className="flex items-center gap-3">
            <CloudSun className="w-14 h-14 text-orange-500 drop-shadow-sm" strokeWidth={1.5} />
            <span className="text-6xl font-light text-gray-800 tracking-tight">24°</span>
          </div>
        </div>
      </div>
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2 text-base text-gray-800 font-medium">
          <Cloud className="w-5 h-5" />
          <span>Partly Cloudy</span>
        </div>
        <div className="flex gap-5 text-sm text-gray-600 font-medium">
          <span className="bg-white/50 px-2 py-0.5 rounded-md">H: 28°</span>
          <span className="bg-white/50 px-2 py-0.5 rounded-md">L: 19°</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mt-auto pt-6 border-t border-white/50">
        {[
          { day: 'Mon', icon: Sun, temp: '26°' },
          { day: 'Tue', icon: CloudSun, temp: '24°' },
          { day: 'Wed', icon: CloudRain, temp: '22°' },
          { day: 'Thu', icon: Sun, temp: '27°' },
        ].map((item) => (
          <div key={item.day} className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors group-hover:bg-white/40">
            <span className="text-sm font-medium text-gray-600">{item.day}</span>
            <item.icon className="w-6 h-6 text-orange-500 drop-shadow-sm" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-gray-800">{item.temp}</span>
          </div>
        ))}
      </div>
    </GlassSurface>
  );
}
