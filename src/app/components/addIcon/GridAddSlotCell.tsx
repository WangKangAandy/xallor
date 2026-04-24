import { GRID_CELL_SIZE } from "../desktopGridConstants";
import { Z_GRID_ITEM_BASE } from "../desktopGridLayers";
import { useAppI18n } from "../../i18n/AppI18n";
import { HoverRevealGlassAddTile } from "./HoverRevealGlassAddTile";

type GridAddSlotCellProps = {
  onOpenAdd: () => void;
  /** 空页面首屏时默认可见，作为“添加第一个图标”的明确入口。 */
  alwaysVisible?: boolean;
};

/**
 * 网格末尾「空位」：默认完全不可见；悬停整块格时渐显毛玻璃占位与中央「+」（`aria-label` 说明用途）。
 * 与站点卡片区分开，不占用 `DesktopGridItem` / DnD 链路。
 */
export function GridAddSlotCell({ onOpenAdd, alwaysVisible = false }: GridAddSlotCellProps) {
  const { t } = useAppI18n();

  return (
    <div
      style={{
        gridColumn: "span 1",
        gridRow: "span 1",
        width: GRID_CELL_SIZE,
        height: GRID_CELL_SIZE,
        zIndex: Z_GRID_ITEM_BASE,
      }}
      className="relative flex items-center justify-center pointer-events-auto"
    >
      <HoverRevealGlassAddTile
        onOpenAdd={onOpenAdd}
        alwaysVisible={alwaysVisible}
        hoverGroup="add-slot"
        sizePx={88}
        tileRoundedClass="!rounded-[28px]"
        plusClassName="h-9 w-9"
        ariaLabel={t("addIcon.dialogTitle")}
      />
    </div>
  );
}
