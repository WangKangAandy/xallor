import React, { useState, useRef, useEffect, useCallback, PointerEvent as ReactPointerEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDrag, useDrop } from 'react-dnd';
import { GridItemType, GridShape, SiteItem, FolderItem, WidgetItem, GRID_CELL_SIZE, GRID_GAP, GRID_STEP } from './DesktopGridTypes';
import { WeatherCard } from './WeatherCard';
import { FaviconIcon } from './shared/FaviconIcon';
import { computeResizedShape } from './folderResizeRules';
import { buildFolderPreviewItemStyle } from './folderPreviewStyle';
import { computeResizePreviewSize, shapeToPixels } from './resizePreview';
import {
  computeDrawerContentShape,
  computeFolderContentLayout,
  computeFolderResizeAnchors,
  getFolderPreviewDecorationScale,
  getPreviewCountForShape,
  normalizeFolderPreviewGrid,
  shouldActivateResizeAnchor,
  type FolderPreviewTier,
} from './folderPreviewLayout';

// ─── Favicon helper ──────────────────────────────────────────────────────────────

export function Favicon({ domain, name, size = 44 }: { domain: string; name: string; size?: number }) {
  return (
    <FaviconIcon
      domain={domain}
      name={name}
      size={size}
      className="object-contain drop-shadow-sm"
      style={{ borderRadius: size * 0.2 }}
    />
  );
}

function FolderPreviewItem({ site, folderId, maxIconSize, innerBorderRadius, faviconSize }: { site: SiteItem, folderId: string, maxIconSize: number, innerBorderRadius: number, faviconSize: number }) {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'ITEM',
    item: () => ({ id: `folder-item-${folderId}-${site.url}`, type: 'folder-site', sourceFolderId: folderId, site }),
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  });

  return (
    <div
      ref={drag}
      onClick={(e) => { e.stopPropagation(); window.open(site.url, '_blank'); }} 
      style={buildFolderPreviewItemStyle({ maxIconSize, innerBorderRadius, isDragging })}
      className="hover:bg-white/80 cursor-grab active:cursor-grabbing"
    >
      <div ref={dragPreview}>
        <Favicon domain={site.domain} name={site.name} size={faviconSize} />
      </div>
    </div>
  );
}

// ─── EditableLabel helper ────────────────────────────────────────────────────────
export function EditableLabel({ 
  initialName, 
  onRename, 
  showLabels = true,
  className = "",
  inputClassName = "",
  style = {},
  inputStyle = {},
  autoWidth = false
}: { 
  initialName: string; 
  onRename: (newName: string) => void; 
  showLabels?: boolean;
  className?: string;
  inputClassName?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  autoWidth?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      savedRef.current = false;
    }
  }, [isEditing]);

  const handleSave = () => {
    if (savedRef.current) return;
    savedRef.current = true;
    setIsEditing(false);
    if (value.trim() !== "" && value.trim() !== initialName) {
      onRename(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      savedRef.current = true;
      setIsEditing(false);
    }
  };

  if (!showLabels && !isEditing) return null;

  if (isEditing) {
    if (autoWidth) {
      return (
        <div className="relative inline-flex items-center justify-center min-w-[40px] max-w-full">
          <span 
            className={`${inputClassName} pointer-events-none whitespace-pre`}
            style={{ 
              ...inputStyle, 
              visibility: 'hidden',
              color: 'transparent',
              position: 'relative',
              zIndex: -1
            }}
          >
            {value || initialName}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            placeholder={initialName}
            maxLength={15}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              background: 'transparent', outline: 'none', border: 'none',
              ...inputStyle
            }}
            className={`focus:ring-0 ${inputClassName}`}
          />
        </div>
      );
    }

    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={initialName}
        maxLength={15}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          background: 'transparent',
          outline: 'none', border: 'none',
          ...( { fieldSizing: 'content' } as any ),
          ...inputStyle
        }}
        className={`focus:ring-0 ${inputClassName}`}
      />
    );
  }

  return (
    <span 
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setValue("");
        setIsEditing(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        cursor: 'text', pointerEvents: 'auto',
        ...style
      }}
      className={className}
    >
      {initialName}
    </span>
  );
}

// ─── DesktopGridItem component ─────────────────────────────────────────────────

interface DesktopGridItemProps {
  item: GridItemType;
  onReorder: (draggedId: string, hoverId: string) => void;
  onHoverMergeIntent: (hoverId: string, draggedId: string) => void;
  onClearMergeIntent: (id?: string) => void;
  onDropItem: (draggedItem: { id: string, type: string, sourceFolderId?: string, site?: SiteItem }, hoverId: string, inCenterZone?: boolean) => void;
  isMergeTarget: boolean;
  onResize: (id: string, newShape: GridShape) => void;
  onOpenFolder?: (id: string) => void;
  index: number;
  showLabels?: boolean;
  onRename?: (id: string, newName: string) => void;
}

export function DesktopGridItem({
  item, index, onReorder, onHoverMergeIntent, onClearMergeIntent, onDropItem, isMergeTarget, onResize, onOpenFolder, showLabels = true, onRename
}: DesktopGridItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isBorderHovered, setIsBorderHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreview, setResizePreview] = useState<{ width: number; height: number } | null>(null);
  const pendingShapeRef = useRef<GridShape | null>(null);
  const [activeResizeDir, setActiveResizeDir] = useState<string | null>(null);
  const resizeEngagedRef = useRef(false);
  const resizeFolderStartRef = useRef<GridShape | null>(null);
  const [resizeFolderPending, setResizeFolderPending] = useState<GridShape | null>(null);

  const startResize = (e: ReactPointerEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    resizeEngagedRef.current = false;
    if (item.type === "folder") {
      resizeFolderStartRef.current = { ...item.shape };
      setResizeFolderPending(normalizeFolderPreviewGrid(item.shape));
    }
    const startX = e.clientX;
    const startY = e.clientY;
    const startCols = item.shape.cols;
    const startRows = item.shape.rows;
    const startShape = { cols: startCols, rows: startRows };
    const lastShapeRef = { current: { cols: startCols, rows: startRows } };
    const folderSiteCount = item.type === "folder" ? item.sites.length : 0;
    const maxCols = item.type === "folder" ? (folderSiteCount <= 4 ? 2 : folderSiteCount <= 6 ? 3 : 4) : 4;
    const maxRows = item.type === "folder" ? (folderSiteCount <= 4 ? 2 : folderSiteCount <= 6 ? 3 : 4) : 4;

    const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        if (!resizeEngagedRef.current && shouldActivateResizeAnchor(deltaX, deltaY)) {
          resizeEngagedRef.current = true;
          setActiveResizeDir(dir);
        }

        const previewSize = computeResizePreviewSize({
          startCols,
          startRows,
          deltaX,
          deltaY,
          dir,
          maxCols,
          maxRows,
        });
        setResizePreview(previewSize);

        const nextShape = computeResizedShape({
          startShape,
          baseShape: lastShapeRef.current,
          deltaX,
          deltaY,
          dir,
          isFolder: item.type === 'folder',
          siteCount: folderSiteCount,
        });

        if (item.type === "folder") {
          setResizeFolderPending(nextShape);
        }

        if (nextShape.cols !== lastShapeRef.current.cols || nextShape.rows !== lastShapeRef.current.rows) {
            lastShapeRef.current = nextShape;
            pendingShapeRef.current = nextShape;
        }
    };

    const onPointerUp = () => {
        resizeEngagedRef.current = false;
        setIsResizing(false);
        setIsBorderHovered(false);
        setResizePreview(null);
        if (pendingShapeRef.current && (pendingShapeRef.current.cols !== item.shape.cols || pendingShapeRef.current.rows !== item.shape.rows)) {
          onResize(item.id, pendingShapeRef.current);
        }
        pendingShapeRef.current = null;
        setActiveResizeDir(null);
        if (item.type === "folder") {
          resizeFolderStartRef.current = null;
          setResizeFolderPending(null);
        }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    };

    setIsResizing(true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { id: item.id, type: item.type, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const mergeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasEnteredCenterRef = useRef(false);

  const [{ isOver }, drop] = useDrop({
    accept: 'ITEM',
    hover(draggedItem: { id: string, type: string, index: number, sourceFolderId?: string, site?: SiteItem }, monitor) {
      if (!ref.current) return;
      if (draggedItem.id === item.id) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      const thresholdX = hoverBoundingRect.width * 0.2;
      const thresholdY = hoverBoundingRect.height * 0.2;

      const inCenterZone = 
         hoverClientX > thresholdX && hoverClientX < hoverBoundingRect.width - thresholdX &&
         hoverClientY > thresholdY && hoverClientY < hoverBoundingRect.height - thresholdY;

      if (inCenterZone) {
         hasEnteredCenterRef.current = true;
         if (!mergeTimerRef.current) {
            mergeTimerRef.current = setTimeout(() => {
               onHoverMergeIntent(item.id, draggedItem.id);
            }, 300); // 300ms long press delay
         }
      } else {
         if (mergeTimerRef.current) {
            clearTimeout(mergeTimerRef.current);
            mergeTimerRef.current = null;
         }
         onClearMergeIntent(item.id);
         
         // Only swap if we actually entered the center zone and are now leaving it
         // This allows dragging deep to swap without accidental edge swaps
         if (hasEnteredCenterRef.current && draggedItem.type !== 'folder-site') {
            hasEnteredCenterRef.current = false;
            onReorder(draggedItem.id, item.id);
            draggedItem.index = index;
         }
      }
    },
    drop(draggedItem: { id: string, type: string, index: number, sourceFolderId?: string, site?: SiteItem }, monitor) {
      if (mergeTimerRef.current) {
        clearTimeout(mergeTimerRef.current);
        mergeTimerRef.current = null;
      }
      hasEnteredCenterRef.current = false;
      if (draggedItem.id === item.id) return;

      // Calculate center drop again
      let inCenterZone = false;
      if (ref.current) {
         const hoverBoundingRect = ref.current.getBoundingClientRect();
         const clientOffset = monitor.getClientOffset();
         if (clientOffset) {
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;
            const hoverClientX = clientOffset.x - hoverBoundingRect.left;
            const thresholdX = hoverBoundingRect.width * 0.2;
            const thresholdY = hoverBoundingRect.height * 0.2;
            inCenterZone = 
               hoverClientX > thresholdX && hoverClientX < hoverBoundingRect.width - thresholdX &&
               hoverClientY > thresholdY && hoverClientY < hoverBoundingRect.height - thresholdY;
         }
      }

      onDropItem(draggedItem, item.id, inCenterZone);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    if (!isOver) {
      if (mergeTimerRef.current) {
        clearTimeout(mergeTimerRef.current);
        mergeTimerRef.current = null;
      }
      onClearMergeIntent(item.id);
    }
  }, [isOver, item.id, onClearMergeIntent]);

  // Combine drag and drop refs
  drag(drop(ref));

  // Determine span
  const gridColumn = `span ${item.shape.cols}`;
  const gridRow = `span ${item.shape.rows}`;

  // Opacity during drag
  const opacity = isDragging ? 0.3 : 1;
  const transform = isMergeTarget ? 'scale(1.05)' : 'scale(1)';
  const zIndex = isMergeTarget ? 20 : isDragging ? 30 : 10;
  const targetSize = shapeToPixels(item.shape.cols, item.shape.rows);
  const renderSize = resizePreview ?? targetSize;

  // Let's render the inside
  let content = null;

  if (item.type === 'site') {
    content = (
      <div onClick={() => window.open(item.site.url, '_blank')} className="relative flex flex-col items-center justify-center w-full h-full pointer-events-auto cursor-pointer group/site">
        <div style={{
          width: 88, height: 88, borderRadius: 28,
          backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.4)',
          border: isMergeTarget ? '3px solid #3b82f6' : '1px solid rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isMergeTarget ? '0 0 24px rgba(59, 130, 246, 0.6)' : '0 4px 20px rgba(0,0,0,0.06)',
          transition: 'transform 0.2s',
        }} className="group-hover/site:scale-[1.03] group-hover/site:bg-white/60 group-active/site:scale-95">
          <Favicon domain={item.site.domain} name={item.site.name} size={52} />
        </div>
        <EditableLabel 
          initialName={item.site.name} 
          onRename={(newName) => onRename?.(item.id, newName)} 
          showLabels={showLabels} 
          className="hover:bg-black/10 px-1 rounded transition-colors"
          style={{
            position: 'absolute', bottom: -28, fontSize: 13, color: 'rgba(255,255,255,0.95)',
            maxWidth: 100, left: '50%', transform: 'translateX(-50%)', 
            textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontWeight: 500,
          }}
          inputClassName="placeholder:text-white/60 text-center"
          inputStyle={{
            position: 'absolute', bottom: -30, width: '120%', left: '-10%',
            fontSize: 13, color: 'rgba(255,255,255,0.95)',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontWeight: 500,
          }}
        />
      </div>
    );
  } else if (item.type === 'folder') {
    // 占多于一格时用 large 档位（与单格 1×1 小文件夹区分比例）
    const isMultiCellFolder = item.shape.cols > 1 || item.shape.rows > 1;
    const previewTier: FolderPreviewTier = isMultiCellFolder ? "large" : "small";
    const contentPadding = isMultiCellFolder ? 20 : 12;

    const committedGrid = normalizeFolderPreviewGrid(item.shape);
    const viewportWidth = Math.max(0, renderSize.width);
    const viewportHeight = Math.max(0, renderSize.height);
    const isFolderDrag =
      resizePreview !== null && resizeFolderStartRef.current !== null;

    const canvasGrid: GridShape = isFolderDrag
      ? computeDrawerContentShape({
          committedShape: committedGrid,
          dragStartShape: normalizeFolderPreviewGrid(resizeFolderStartRef.current),
          livePendingShape: resizeFolderPending,
          resizePreview,
          siteCount: item.sites.length,
        })
      : committedGrid;

    const layoutRefSize = shapeToPixels(canvasGrid.cols, canvasGrid.rows);
    const previewCount = Math.min(item.sites.length, getPreviewCountForShape(canvasGrid.cols, canvasGrid.rows));
    const previewSites = item.sites.slice(0, previewCount);

    const { iconSize, horizontalGap, verticalGap, canvasWidth, canvasHeight } = computeFolderContentLayout({
      viewportWidth: isFolderDrag ? layoutRefSize.width : viewportWidth,
      viewportHeight: isFolderDrag ? layoutRefSize.height : viewportHeight,
      contentPadding,
      cols: canvasGrid.cols,
      rows: canvasGrid.rows,
      tier: previewTier,
    });
    const { faviconMul, radiusMul } = getFolderPreviewDecorationScale(previewTier);
    const innerBorderRadius = Math.max(8, Math.round(iconSize * radiusMul));
    const faviconSize = Math.round(iconSize * faviconMul);

    const { vertical: vAnchor, horizontal: hAnchor } = computeFolderResizeAnchors({
      activeResizeDir,
      resizePreview: isFolderDrag ? resizePreview : null,
      dragStartShape: resizeFolderStartRef.current,
    });

    const transforms: string[] = [];
    if (hAnchor === "center") transforms.push("translateX(-50%)");
    if (vAnchor === "center") transforms.push("translateY(-50%)");

    const anchorStyle: React.CSSProperties = {};
    if (hAnchor === "start") {
      anchorStyle.left = contentPadding;
      anchorStyle.right = "auto";
    } else if (hAnchor === "end") {
      anchorStyle.right = contentPadding;
      anchorStyle.left = "auto";
    } else {
      anchorStyle.left = "50%";
    }

    if (vAnchor === "start") {
      anchorStyle.top = contentPadding;
      anchorStyle.bottom = "auto";
    } else if (vAnchor === "end") {
      anchorStyle.bottom = contentPadding;
      anchorStyle.top = "auto";
    } else {
      anchorStyle.top = "50%";
    }
    if (transforms.length > 0) anchorStyle.transform = transforms.join(" ");

    const gridAlignContent =
      !activeResizeDir ? "center" : vAnchor === "end" ? "end" : vAnchor === "center" ? "center" : "start";
    const gridJustifyContent =
      !activeResizeDir ? "center" : hAnchor === "end" ? "end" : hAnchor === "center" ? "center" : "start";

    content = (
      <div className="relative flex flex-col w-full h-full pointer-events-auto cursor-pointer group/folder" onClick={(e) => { e.stopPropagation(); onOpenFolder?.(item.id); }} style={{ borderRadius: 36, backdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.35)', border: isMergeTarget ? '3px solid #3b82f6' : '1px solid rgba(255,255,255,0.65)', transition: 'transform 0.2s', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
        <div className="relative w-full h-full overflow-hidden" style={{ width: viewportWidth, height: viewportHeight, borderRadius: 36 }}>
          <div
            style={{
              position: 'absolute',
              ...anchorStyle,
              width: canvasWidth,
              height: canvasHeight,
              display: 'grid',
              gridTemplateColumns: `repeat(${canvasGrid.cols}, ${iconSize}px)`,
              gridAutoRows: `${iconSize}px`,
              columnGap: horizontalGap,
              rowGap: verticalGap,
              alignContent: gridAlignContent,
              justifyContent: gridJustifyContent,
            }}
          >
            {previewSites.map((site, i) => (
              <FolderPreviewItem 
                key={site.url + i}
                site={site}
                folderId={item.id}
                maxIconSize={iconSize}
                innerBorderRadius={innerBorderRadius}
                faviconSize={faviconSize}
              />
            ))}
          </div>
        </div>
        <EditableLabel 
          initialName={item.name} 
          onRename={(newName) => onRename?.(item.id, newName)} 
          showLabels={showLabels} 
          className="hover:bg-black/10 px-1 rounded transition-colors"
          style={{
            position: 'absolute', bottom: -28, fontSize: 13, color: 'rgba(255,255,255,0.95)',
            maxWidth: 100, left: '50%', transform: 'translateX(-50%)', 
            textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontWeight: 500,
          }}
          inputClassName="placeholder:text-white/60 text-center"
          inputStyle={{
            position: 'absolute', bottom: -30, width: '120%', left: '-10%',
            fontSize: 13, color: 'rgba(255,255,255,0.95)',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)', fontWeight: 500,
          }}
        />
      </div>
    );
  } else if (item.type === 'widget') {
    if (item.widgetType === 'weather') {
      content = (
         <div className="w-full h-full overflow-hidden pointer-events-auto shadow-sm" style={{ borderRadius: 36 }}>
           <WeatherCard />
         </div>
      );
    }
  }

  // Handle Resize click (removed in favor of drag to resize)

  return (
    <motion.div
      ref={ref}
      // Animate only position to avoid non-uniform scale distortion of inner preview icons
      // during large shape changes (e.g. 4x4 -> 1x2).
      layout="position"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity, scale: isMergeTarget ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        gridColumn,
        gridRow,
        width: renderSize.width,
        height: renderSize.height,
        zIndex,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className="relative group flex items-center justify-center"
    >
      {/* Resize Overlay */}
      {(item.type === 'folder' || item.type === 'widget') && !isDragging && (
        <>
          <div 
             className={`absolute inset-0 pointer-events-none z-40 transition-all duration-200 ${isBorderHovered || isResizing ? 'border-[2px] border-white shadow-[0_0_8px_rgba(255,255,255,0.2)]' : 'border border-transparent'}`}
             style={{ borderRadius: 36 }}
          />

          <div className="absolute inset-[-4px] z-50 pointer-events-none" style={{ borderRadius: 40 }}>
            {/* Top edge */}
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'top')}
              className="absolute top-0 left-4 right-4 h-3 cursor-ns-resize pointer-events-auto flex items-center justify-center"
            >
              <div className={`w-1.5 h-1.5 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${isBorderHovered || isResizing ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            {/* Bottom edge */}
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'bottom')}
              className="absolute bottom-0 left-4 right-4 h-3 cursor-ns-resize pointer-events-auto flex items-center justify-center"
            >
              <div className={`w-1.5 h-1.5 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${isBorderHovered || isResizing ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            {/* Left edge */}
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'left')}
              className="absolute top-4 bottom-4 left-0 w-3 cursor-ew-resize pointer-events-auto flex items-center justify-center"
            >
              <div className={`w-1.5 h-1.5 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${isBorderHovered || isResizing ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            {/* Right edge */}
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'right')}
              className="absolute top-4 bottom-4 right-0 w-3 cursor-ew-resize pointer-events-auto flex items-center justify-center"
            >
              <div className={`w-1.5 h-1.5 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-opacity duration-200 ${isBorderHovered || isResizing ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Corners (invisible hit areas) */}
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'top-left')}
              className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize pointer-events-auto"
            />
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'top-right')}
              className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize pointer-events-auto"
            />
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'bottom-left')}
              className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize pointer-events-auto"
            />
            <div 
              onMouseEnter={() => setIsBorderHovered(true)} onMouseLeave={() => setIsBorderHovered(false)}
              onPointerDown={(e) => startResize(e, 'bottom-right')}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize pointer-events-auto"
            />
          </div>
        </>
      )}

      {content}
    </motion.div>
  );
}
