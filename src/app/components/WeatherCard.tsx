import { Cloud, Sun, CloudRain, CloudSun } from 'lucide-react';

export function WeatherCard() {
  return (
    <div className="backdrop-blur-md bg-white/40 rounded-[36px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 w-full h-full flex flex-col justify-between transition-transform duration-200 hover:bg-white/50 cursor-pointer group">
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
    </div>
  );
}
