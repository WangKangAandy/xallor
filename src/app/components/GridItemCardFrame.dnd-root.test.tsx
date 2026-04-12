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
});
