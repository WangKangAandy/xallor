export type SelectionPoint = { x: number; y: number };

export type SelectionRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function buildSelectionRect(start: SelectionPoint, end: SelectionPoint): SelectionRect {
  return {
    left: Math.min(start.x, end.x),
    top: Math.min(start.y, end.y),
    right: Math.max(start.x, end.x),
    bottom: Math.max(start.y, end.y),
  };
}

export function intersectsRect(a: SelectionRect, b: SelectionRect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function rectFromDomRect(rect: DOMRect): SelectionRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}

