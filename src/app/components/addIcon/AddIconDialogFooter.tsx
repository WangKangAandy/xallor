type AddIconDialogFooterProps = {
  onSaveAndExit: () => void;
  onSaveAndContinue: () => void;
};

export function AddIconDialogFooter({ onSaveAndExit, onSaveAndContinue }: AddIconDialogFooterProps) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/25 px-4 py-3 sm:px-5">
      <button
        type="button"
        className="rounded-xl border border-white/35 bg-white/12 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/20"
        onClick={onSaveAndExit}
      >
        保存并退出
      </button>
      <button
        type="button"
        className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600"
        onClick={onSaveAndContinue}
      >
        保存并继续添加
      </button>
    </footer>
  );
}
