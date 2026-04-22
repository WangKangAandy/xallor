import type { CSSProperties, ReactNode } from "react";
import { EditableLabel } from "./DesktopGridItemPrimitives";

export type GridItemLabelProps = {
  placement: "bottom" | "inside";
  /** 为 true 时需提供 onRename；为 false 时底部标签只读展示（若实现） */
  editable: boolean;
  initialName: string;
  onRename?: (name: string) => void;
  showLabels?: boolean;
  /** placement=inside 且内容由业务自绘时（如天气标题区） */
  children?: ReactNode;
};

const BOTTOM_LABEL_STYLE: CSSProperties = {
  position: "absolute",
  bottom: "calc(-1 * var(--grid-label-offset-y, 28px))",
  fontSize: 13,
  color: "rgba(255,255,255,0.95)",
  maxWidth: 100,
  left: "50%",
  transform: "translateX(-50%)",
  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
  fontWeight: 500,
};

const BOTTOM_INPUT_STYLE: CSSProperties = {
  position: "absolute",
  bottom: "calc(-1 * var(--grid-label-offset-y, 28px) - 2px)",
  width: "120%",
  left: "-10%",
  fontSize: 13,
  color: "rgba(255,255,255,0.95)",
  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
  fontWeight: 500,
};

/**
 * 网格项标题：站点/文件夹用 bottom + 可编辑；大组件可 inside + 业务子节点。
 */
export function GridItemLabel({
  placement,
  editable,
  initialName,
  onRename,
  showLabels = true,
  children,
}: GridItemLabelProps) {
  if (placement === "inside") {
    return <>{children ?? null}</>;
  }

  if (editable && onRename) {
    return (
      <EditableLabel
        initialName={initialName}
        onRename={onRename}
        showLabels={showLabels}
        className="rounded px-1 transition-colors hover:bg-black/10"
        style={BOTTOM_LABEL_STYLE}
        inputClassName="text-center placeholder:text-white/60"
        inputStyle={BOTTOM_INPUT_STYLE}
      />
    );
  }

  return null;
}
