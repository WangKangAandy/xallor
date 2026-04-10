import { useState } from 'react';
import { LayoutDashboard, Star, Clock, User, Settings, type LucideIcon } from 'lucide-react';

interface MenuItem {
  Icon: LucideIcon;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { Icon: LayoutDashboard, label: 'Dashboard' },
  { Icon: Star,            label: 'Favorites' },
  { Icon: Clock,           label: 'Recent' },
  { Icon: User,            label: 'Profile' },
  { Icon: Settings,        label: 'Settings' },
];

export function Sidebar() {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Invisible hover trigger zone on the far left edge */}
      <div
        className="fixed left-0 top-0 h-full w-4 z-30"
        onMouseEnter={() => setHovered(true)}
      />

      {/* Peeking dots when collapsed */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-[6px] pl-[3px] pointer-events-none"
        style={{
          opacity: hovered ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        {MENU_ITEMS.map((item) => (
          <div key={item.label} className="w-[4px] h-[4px] rounded-full bg-white/70" />
        ))}
      </div>

      {/* Actual sidebar */}
      <div
        className="fixed left-0 top-1/2 z-20 flex items-center"
        style={{ transform: 'translateY(-50%)' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="backdrop-blur-md bg-white/20 rounded-3xl p-3 shadow-lg border border-white/40"
          style={{
            transform: hovered ? 'translateX(12px)' : 'translateX(-62px)',
            opacity: hovered ? 1 : 0,
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
            pointerEvents: hovered ? 'auto' : 'none',
          }}
        >
          <div className="flex flex-col gap-4">
            {MENU_ITEMS.map(({ Icon, label }) => (
              <button
                key={label}
                className="w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all group relative"
                title={label}
              >
                <Icon className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                <span className="absolute left-full ml-3 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
