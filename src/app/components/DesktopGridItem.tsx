import React, { useState, useRef, useEffect, useCallback, PointerEvent as ReactPointerEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDrag, useDrop } from 'react-dnd';
import { GridItemType, GridShape, SiteItem, FolderItem, WidgetItem, GRID_CELL_SIZE, GRID_GAP, GRID_STEP } from './DesktopGridTypes';
import { WeatherCard } from './WeatherCard';

// ─── Favicon helper ──────────────────────────────────────────────────────────────

export function Favicon({ domain, name, size = 44 }: { domain: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div
        className="flex items-center justify-center font-bold text-gray-700 shadow-sm bg-white/40"
        style={{ width: size, height: size, borderRadius: size * 0.25, fontSize: size * 0.45 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
      alt={name}
      width={size}
      height={size}
      className="object-contain drop-shadow-sm"
      style={{ borderRadius: size * 0.2 }}
      onError={() => setErr(true)}
      draggable={false}
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
      style={{ 
        width: '100%', height: '100%', 
        maxWidth: maxIconSize, maxHeight: maxIconSize, 
        borderRadius: innerBorderRadius, 
        background: 'rgba(255,255,255,0.5)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
        transition: 'background 0.2s',
        opacity: isDragging ? 0 : 1
      }} 
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

  const startResize = (e: ReactPointerEvent, dir: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCols = item.shape.cols;
    const startRows = item.shape.rows;

    const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newCols = startCols;
        let newRows = startRows;

        if (dir.includes('right')) {
            newCols = startCols + Math.round(deltaX / GRID_STEP);
        } else if (dir.includes('left')) {
            newCols = startCols - Math.round(deltaX / GRID_STEP);
        }
        
        if (dir.includes('bottom')) {
            newRows = startRows + Math.round(deltaY / GRID_STEP);
        } else if (dir.includes('top')) {
            newRows = startRows - Math.round(deltaY / GRID_STEP);
        }

        // Constrain limits
        newCols = Math.max(1, Math.min(newCols, 4));
        newRows = Math.max(1, Math.min(newRows, 4));

        if (item.type === 'folder') {
          const count = item.sites.length;
          
          let maxCols = 3;
          let maxRows = 3;
          
          if (count <= 4) {
              maxCols = 2; maxRows = 2;
          } else if (count <= 6) {
              if (newCols >= 3 && newRows >= 3) {
                  if (startCols >= 3) newRows = 2;
                  else newCols = 2;
              }
              maxCols = 3; maxRows = 3;
          }
          
          newCols = Math.min(newCols, maxCols);
          newRows = Math.min(newRows, maxRows);
          
          if (count <= 6 && newCols === 3 && newRows === 3) {
              newRows = 2; 
          }
        }

        if (newCols !== item.shape.cols || newRows !== item.shape.rows) {
            onResize(item.id, { cols: newCols, rows: newRows });
        }
    };

    const onPointerUp = () => {
        setIsResizing(false);
        setIsBorderHovered(false);
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
    const isLarge = item.shape.cols > 1 || item.shape.rows > 1;

    // Determine grid layout for preview based on shape
    let gridCols = 2;
    let gridRows = 2;
    let previewCount = 4;

    if (item.shape.cols === 1 && item.shape.rows === 1) {
       gridCols = 2; gridRows = 2; previewCount = 4;
    } else {
       gridCols = item.shape.cols;
       gridRows = item.shape.rows;
       if (gridCols === 4 && gridRows === 1) { previewCount = 4; }
       else if (gridCols === 1 && gridRows === 4) { previewCount = 4; }
       else { previewCount = gridCols * gridRows; }
    }

    const previewSites = item.sites.slice(0, previewCount);

    // Adjust icon size dynamically
    const maxIconSize = isLarge ? 64 : 32;
    const innerBorderRadius = isLarge ? 20 : 12;
    const faviconSize = isLarge ? 40 : 20;

    content = (
      <div className="relative flex flex-col w-full h-full pointer-events-auto cursor-pointer group/folder" onClick={(e) => { e.stopPropagation(); onOpenFolder?.(item.id); }} style={{ borderRadius: 36, backdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.35)', border: isMergeTarget ? '3px solid #3b82f6' : '1px solid rgba(255,255,255,0.65)', padding: isLarge ? 20 : 12, transition: 'transform 0.2s', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}>
        {/* We need to arrange them based on shape! */}
        <div style={{
          display: 'grid', width: '100%', height: '100%',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: isLarge ? 12 : 6, placeItems: 'center'
        }}>
          {previewSites.map((site, i) => (
            <FolderPreviewItem 
              key={i}
              site={site}
              folderId={item.id}
              maxIconSize={maxIconSize}
              innerBorderRadius={innerBorderRadius}
              faviconSize={faviconSize}
            />
          ))}
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
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity, scale: isMergeTarget ? 1.05 : 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ gridColumn, gridRow, zIndex, cursor: isDragging ? 'grabbing' : 'grab' }}
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
