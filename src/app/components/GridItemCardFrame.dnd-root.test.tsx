/** @vitest-environment jsdom */
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GridItemCardFrame } from "./GridItemCardFrame";
import type { FolderResizeHandle } from "./useFolderResize";

const folderResizeStub: FolderResizeHandle = {
  isBorderHovered: false,
  setIsBorderHovered: vi.fn(),
  isResizing: false,
  resizePreview: null,
  activeResizeDir: null,
  resizeFolderPending: null,
  resizeFolderStartRef: { current: null },
  startResize: vi.fn(),
};

describe("GridItemCardFrame", () => {
  let host: HTMLDivElement;

  afterEach(() => {
    host?.remove();
  });

  /**
   * 目的：react-dnd HTML5Backend 在源节点上设置 `draggable` 与 `dragstart`；该节点必须是稳定原生元素。
   * 若将 ref 挂在 `motion.div` 上，Motion 更新可能与上述 DOM 状态冲突，表现为完全无法开始拖拽。
   * 预期：ref 指向外层原生 div，且 grid 定位样式在该层上。
   */
  it("should_attach_dnd_ref_to_native_div_when_rendered", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const ref = createRef<HTMLDivElement>();
    const root = createRoot(host);
    act(() => {
      root.render(
        <GridItemCardFrame
          ref={ref}
          gridColumn="span 2"
          gridRow="span 1"
          renderSize={{ width: 120, height: 88 }}
          zIndex={3}
          opacity={1}
          isMergeTarget={false}
          isDragging={false}
          showResizeChrome={false}
          folderResize={folderResizeStub}
        >
          <span>tile</span>
        </GridItemCardFrame>,
      );
    });

    expect(ref.current).not.toBeNull();
    expect(ref.current!.tagName).toBe("DIV");
    expect(ref.current!.style.gridColumn).toBe("span 2");
    expect(ref.current!.style.gridRow).toBe("span 1");
    expect(ref.current!.firstElementChild).toBeTruthy();

    root.unmount();
  });

  /**
   * 目的：挂载右键删除能力时仍须保证 DnD ref 落在外层原生 div（与 motion/Portal 并存）。
   */
  it("should_keep_dnd_ref_on_outer_div_when_context_menu_props_provided", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const ref = createRef<HTMLDivElement>();
    const root = createRoot(host);
    act(() => {
      root.render(
        <GridItemCardFrame
          ref={ref}
          gridColumn="span 1"
          gridRow="span 1"
          renderSize={{ width: 80, height: 80 }}
          zIndex={2}
          opacity={1}
          isMergeTarget={false}
          isDragging={false}
          showResizeChrome={false}
          folderResize={folderResizeStub}
          itemId="x-1"
          onDeleteItem={vi.fn()}
        >
          <span>tile</span>
        </GridItemCardFrame>,
      );
    });

    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current?.style.gridColumn).toBe("span 1");

    root.unmount();
  });

  /**
   * 目的：整理模式下点击卡片任意区域即可切换选中，不依赖单独圆点控件。
   */
  it("should_trigger_arrange_toggle_callback_when_card_surface_clicked_in_arrange_mode", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const onArrangeToggleSelect = vi.fn();
    act(() => {
      root.render(
        <GridItemCardFrame
          gridColumn="span 1"
          gridRow="span 1"
          renderSize={{ width: 80, height: 80 }}
          zIndex={2}
          opacity={1}
          isMergeTarget={false}
          isDragging={false}
          showResizeChrome={false}
          folderResize={folderResizeStub}
          itemId="x-1"
          onDeleteItem={vi.fn()}
          isArrangeMode
          onArrangeToggleSelect={onArrangeToggleSelect}
        >
          <span>tile</span>
        </GridItemCardFrame>,
      );
    });

    const card = document.querySelector('[data-grid-item-id="x-1"]') as HTMLDivElement | null;
    expect(card).not.toBeNull();
    act(() => {
      card?.click();
    });
    expect(onArrangeToggleSelect).toHaveBeenCalledTimes(1);

    root.unmount();
  });

  /**
   * 目的：整理模式下左上叉号只执行当前项删除回调，参数为当前 itemId。
   */
  it("should_call_delete_handler_with_item_id_when_delete_x_clicked_in_arrange_mode", () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const onDeleteItem = vi.fn();
    act(() => {
      root.render(
        <GridItemCardFrame
          gridColumn="span 1"
          gridRow="span 1"
          renderSize={{ width: 80, height: 80 }}
          zIndex={2}
          opacity={1}
          isMergeTarget={false}
          isDragging={false}
          showResizeChrome={false}
          folderResize={folderResizeStub}
          itemId="x-2"
          onDeleteItem={onDeleteItem}
          isArrangeMode
          onArrangeToggleSelect={vi.fn()}
        >
          <span>tile</span>
        </GridItemCardFrame>,
      );
    });

    const deleteButton = document.querySelector('button[aria-label="删除当前图标"]') as HTMLButtonElement | null;
    expect(deleteButton).not.toBeNull();
    act(() => {
      deleteButton?.click();
    });
    expect(onDeleteItem).toHaveBeenCalledTimes(1);
    expect(onDeleteItem).toHaveBeenCalledWith("x-2");

    root.unmount();
  });
});
