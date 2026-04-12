import { X } from "lucide-react";

type AddIconDialogHeaderProps = {
  titleId: string;
  onClose: () => void;
};

export function AddIconDialogHeader({ titleId, onClose }: AddIconDialogHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/30 px-5 py-3.5">
      <h2 id={titleId} className="text-base font-semibold text-white/95">
        添加图标
      </h2>
      <button
        type="button"
        aria-label="关闭对话框"
        className="rounded-full p-2 text-white/90 hover:bg-white/20"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
    </header>
  );
}
