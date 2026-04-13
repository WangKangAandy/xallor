import { useState } from 'react';
import { LayoutDashboard, Star, Clock, User, Settings, type LucideIcon } from 'lucide-react';
import { GlassSurface } from './shared/GlassSurface';

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
      {/* Peeking dots when collapsed */}
      <div
        className="fixed left-0 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-[6px] pl-[3px] pointer-events-none"
        style={{
          opacity: hovered ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        {MENU_ITEMS.map((item) => (
          <div key={item.label} className="h-[4px] w-[4px] rounded-full bg-white/70" />
        ))}
      </div>

      {/*
        悬停区仅限「侧栏实际占用的纵向范围」（垂直居中，与面板同高），不包含整屏左侧上下角。
        左侧细边 + 面板同一容器，mouseleave 离开整块即收起。
      */}
      <div className="pointer-events-none fixed left-0 top-1/2 z-30 -translate-y-1/2">
        <div
          data-testid="sidebar-hover-zone"
          className="pointer-events-auto flex items-stretch"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="w-4 shrink-0" aria-hidden />
          <div className="flex items-center">
            <GlassSurface
              variant="sidebar"
              rounded="3xl"
              className="p-3"
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
                    className="group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all hover:bg-white/30"
                    title={label}
                  >
                    <Icon className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
                    <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </GlassSurface>
          </div>
        </div>
      </div>
    </>
  );
}
