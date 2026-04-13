import { CalendarDays } from "lucide-react";

/**
 * 日历组件占位实现：先保证可添加可见，后续在 widget 重构中替换为真实日历逻辑。
 */
export function CalendarCard() {
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="flex h-full w-full flex-col justify-between p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500">日历</p>
          <p className="mt-1 text-xl font-semibold text-gray-800">{monthLabel}</p>
        </div>
        <CalendarDays className="h-7 w-7 text-indigo-500" strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-xl border border-white/50 bg-white/40 p-3 text-sm text-gray-700">
        已添加日历组件（占位）
      </div>
    </div>
  );
}
