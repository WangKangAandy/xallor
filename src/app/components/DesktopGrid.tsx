import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DndProvider, useDrop, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DesktopGridItem, Favicon, EditableLabel } from './DesktopGridItem';
import { GridItemType, GridShape, SiteItem, FolderItem, GRID_CELL_SIZE, GRID_GAP } from './DesktopGridTypes';

const INITIAL_ITEMS: GridItemType[] = [
  { id: 'w1', type: 'widget', widgetType: 'weather', shape: { cols: 2, rows: 2 } },
  { id: 's1', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'YouTube', domain: 'youtube.com', url: 'https://youtube.com' } },
  { id: 's2', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'Gmail', domain: 'gmail.com', url: 'https://mail.google.com' } },
  { id: 'f1', type: 'folder', shape: { cols: 2, rows: 2 }, name: '社交', colorFrom: 'rgba(249,168,212,0.75)', colorTo: 'rgba(251,113,133,0.75)', sites: [
    { name: 'X / Twitter', domain: 'twitter.com', url: 'https://twitter.com' },
    { name: 'Instagram', domain: 'instagram.com', url: 'https://instagram.com' },
    { name: 'Discord', domain: 'discord.com', url: 'https://discord.com' },
    { name: 'Telegram', domain: 'telegram.org', url: 'https://web.telegram.org' },
    { name: 'TikTok', domain: 'tiktok.com', url: 'https://tiktok.com' },
    { name: 'Reddit', domain: 'reddit.com', url: 'https://reddit.com' },
  ]},
  { id: 's3', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'Spotify', domain: 'open.spotify.com', url: 'https://open.spotify.com' } },
  { id: 's4', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'Notion', domain: 'notion.so', url: 'https://notion.so' } },
  { id: 's5', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'GitHub', domain: 'github.com', url: 'https://github.com' } },
  { id: 'f2', type: 'folder', shape: { cols: 2, rows: 2 }, name: '开发', colorFrom: 'rgba(147,197,253,0.75)', colorTo: 'rgba(99,102,241,0.75)', sites: [
    { name: 'Figma', domain: 'figma.com', url: 'https://figma.com' },
    { name: 'Vercel', domain: 'vercel.com', url: 'https://vercel.com' },
    { name: 'Stack Overflow', domain: 'stackoverflow.com', url: 'https://stackoverflow.com' },
    { name: 'MDN', domain: 'developer.mozilla.org', url: 'https://developer.mozilla.org' },
    { name: 'Linear', domain: 'linear.app', url: 'https://linear.app' },
    { name: 'CodePen', domain: 'codepen.io', url: 'https://codepen.io' },
  ]},
  { id: 's6', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'Netflix', domain: 'netflix.com', url: 'https://netflix.com' } },
  { id: 'f3', type: 'folder', shape: { cols: 2, rows: 2 }, name: '资讯', colorFrom: 'rgba(252,211,77,0.75)', colorTo: 'rgba(251,146,60,0.75)', sites: [
    { name: 'Hacker News', domain: 'news.ycombinator.com', url: 'https://news.ycombinator.com' },
    { name: 'Product Hunt', domain: 'producthunt.com', url: 'https://producthunt.com' },
    { name: 'The Verge', domain: 'theverge.com', url: 'https://theverge.com' },
    { name: 'Wired', domain: 'wired.com', url: 'https://wired.com' },
  ]},
  { id: 's7', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'Slack', domain: 'slack.com', url: 'https://slack.com' } },
  { id: 's8', type: 'site', shape: { cols: 1, rows: 1 }, site: { name: 'Twitch', domain: 'twitch.tv', url: 'https://twitch.tv' } },
];

// Create a draggable inner item component
function FolderInnerItem({ site, folderId, showLabels = true, onDragStart, onDragEnd, onRename }: { site: SiteItem, folderId: string, showLabels?: boolean, onDragStart: () => void, onDragEnd: () => void, onRename: (newName: string) => void }) {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'ITEM',
    item: () => {
      onDragStart();
      return { id: `folder-item-${folderId}-${site.url}`, type: 'folder-site', sourceFolderId: folderId, site };
    },
    end: () => {
      onDragEnd();
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <a
      ref={drag}
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (isDragging) {
           e.preventDefault();
        }
      }}
      className={`flex flex-col items-center ${showLabels ? 'justify-start' : 'justify-center'} group w-[100px] ${showLabels ? 'gap-2' : 'gap-0'} cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="w-[84px] h-[84px] shrink-0 rounded-[24px] bg-white/80 border border-white/90 flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105 group-hover:bg-white pointer-events-none">
        <div ref={dragPreview}>
          <Favicon domain={site.domain} name={site.name} size={48} />
        </div>
      </div>
      <EditableLabel 
        initialName={site.name}
        onRename={onRename}
        showLabels={showLabels}
        className="text-[13px] text-gray-700 font-medium text-center truncate w-[100px] pointer-events-auto"
        inputClassName="text-gray-700 text-center"
        inputStyle={{ width: '120%', fontSize: 13, fontWeight: 500 }}
      />
    </a>
  );
}

function GridDropZone({ onDropEmpty, children }: { onDropEmpty: (item: any) => void, children: React.ReactNode }) {
  const [, drop] = useDrop({
    accept: 'ITEM',
    drop: (item, monitor) => {
      if (monitor.didDrop()) return;
      onDropEmpty(item);
    }
  });

  return <div ref={drop} className="w-full h-full min-h-[500px]">{children}</div>;
}

export function DesktopGrid() {
  const [items, setItems] = useState<GridItemType[]>(INITIAL_ITEMS);
  const [mergeIntent, setMergeIntentState] = useState<{ targetId: string; draggedId: string } | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [isFolderDragging, setIsFolderDragging] = useState(false);
  const mergeIntentRef = useRef<{ targetId: string; draggedId: string } | null>(null);

  // TODO: Add a global setting toggle interface for this state
  const [showLabels, setShowLabels] = useState(true);

  const setMergeIntent = useCallback((intent: { targetId: string; draggedId: string } | null) => {
    mergeIntentRef.current = intent;
    setMergeIntentState(intent);
  }, []);

  const handleRename = useCallback((id: string, newName: string) => {
    setItems((prev) => prev.map(item => {
      if (item.id === id) {
        if (item.type === 'site') {
          return { ...item, site: { ...item.site, name: newName } };
        } else if (item.type === 'folder') {
          return { ...item, name: newName };
        }
      }
      return item;
    }));
  }, []);

  const handleRenameInnerItem = useCallback((folderId: string, siteUrl: string, newName: string) => {
    setItems((prev) => prev.map(item => {
      if (item.type === 'folder' && item.id === folderId) {
        return {
          ...item,
          sites: item.sites.map(site => site.url === siteUrl ? { ...site, name: newName } : site)
        };
      }
      return item;
    }));
  }, []);

  // Use a ref to track if we're currently animating a reorder
  const handleReorder = useCallback((draggedId: string, hoverId: string) => {
    setItems((prev) => {
      const dragIdx = prev.findIndex(i => i.id === draggedId);
      const hoverIdx = prev.findIndex(i => i.id === hoverId);
      if (dragIdx === -1 || hoverIdx === -1 || dragIdx === hoverIdx) return prev;
      
      const newItems = [...prev];
      const [removed] = newItems.splice(dragIdx, 1);
      newItems.splice(hoverIdx, 0, removed);
      
      return newItems;
    });
  }, []);

  const handleHoverMergeIntent = useCallback((hoverId: string, draggedId: string) => {
    setMergeIntent({ targetId: hoverId, draggedId });
  }, [setMergeIntent]);

  const handleClearMergeIntent = useCallback((id?: string) => {
    setMergeIntent((prev) => {
      if (!id || prev?.targetId === id) return null;
      return prev;
    });
  }, [setMergeIntent]);

  const handleDropItem = useCallback((draggedItem: any, targetId: string, inCenterZone?: boolean) => {
    const currentIntent = mergeIntentRef.current;
    
    const isIntentActive = currentIntent && currentIntent.targetId === targetId && currentIntent.draggedId === draggedItem.id;
    
    if (draggedItem.type === 'folder-site') {
      // User dragged a site out of a folder and dropped it onto targetId
      setItems(prev => {
        const sourceFolderIdx = prev.findIndex(i => i.id === draggedItem.sourceFolderId);
        if (sourceFolderIdx === -1) return prev;
        
        const sourceFolder = prev[sourceFolderIdx] as FolderItem;
        const targetIdx = prev.findIndex(i => i.id === targetId);
        
        // Remove from source folder
        const newSites = sourceFolder.sites.filter(s => s.url !== draggedItem.site.url);
        
        const newItems = [...prev];
        
        // If folder becomes empty or has 1 item left, destructure it
        if (newSites.length === 0) {
            newItems.splice(sourceFolderIdx, 1);
        } else if (newSites.length === 1) {
            const singleItem: GridItemType = {
               id: `site-unfolded-${Date.now()}`,
               type: 'site',
               shape: { cols: 1, rows: 1 },
               site: newSites[0]
            };
            newItems[sourceFolderIdx] = singleItem;
        } else {
            newItems[sourceFolderIdx] = { ...sourceFolder, sites: newSites };
        }
        
        // Create new standalone site item
        const newSiteItem: SiteItem = {
           id: `site-${Date.now()}`,
           type: 'site',
           shape: { cols: 1, rows: 1 },
           site: draggedItem.site,
        };

        // If target is another folder and dropped in center, add to it
        const targetItem = newItems.find(i => i.id === targetId);
        if (targetItem && inCenterZone && targetItem.type === 'folder') {
            targetItem.sites.push(draggedItem.site);
            // Ignore the standalone site creation
        } else if (targetItem && inCenterZone && targetItem.type === 'site') {
            // Merge into new folder
            const newFolder: FolderItem = {
               id: `folder-${Date.now()}`,
               type: 'folder',
               shape: { cols: 2, rows: 1 },
               name: '新建文件夹',
               colorFrom: 'rgba(147,197,253,0.75)',
               colorTo: 'rgba(99,102,241,0.75)',
               sites: [targetItem.site, draggedItem.site],
            };
            const actualTargetIdx = newItems.findIndex(i => i.id === targetId);
            newItems[actualTargetIdx] = newFolder;
        } else {
            // Just insert next to targetId
            const insertIdx = targetIdx !== -1 ? targetIdx : newItems.length;
            newItems.splice(insertIdx, 0, newSiteItem);
        }

        return newItems;
      });
      setMergeIntent(null);
      return;
    }

    if (isIntentActive || inCenterZone) {
      setItems(prev => {
        const dragIdx = prev.findIndex(i => i.id === draggedItem.id);
        const targetIdx = prev.findIndex(i => i.id === targetId);
        if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return prev;

        const draggedItemData = prev[dragIdx];
        const targetItem = prev[targetIdx];

        if (draggedItemData.type !== 'site') return prev;

        const newItems = [...prev];
        let merged = false;

        if (targetItem.type === 'site') {
          const newFolder: FolderItem = {
            id: `folder-${Date.now()}`,
            type: 'folder',
            shape: { cols: 2, rows: 1 },
            name: '新建文件夹',
            colorFrom: 'rgba(147,197,253,0.75)',
            colorTo: 'rgba(99,102,241,0.75)',
            sites: [targetItem.site, draggedItemData.site],
          };
          newItems[targetIdx] = newFolder;
          merged = true;
        } else if (targetItem.type === 'folder') {
          const updatedFolder: FolderItem = {
            ...targetItem,
            sites: [...targetItem.sites, draggedItemData.site],
          };
          newItems[targetIdx] = updatedFolder;
          merged = true;
        }
        
        if (merged) {
          newItems.splice(dragIdx, 1);
        }
        return newItems;
      });
    }
    setMergeIntent(null);
  }, [setMergeIntent]);

  const handleResize = useCallback((id: string, newShape: GridShape) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, shape: newShape } : item));
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <GridDropZone onDropEmpty={(item) => handleDropItem(item, 'GRID_END', false)}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, ${GRID_CELL_SIZE}px)`,
          gridAutoRows: `${GRID_CELL_SIZE}px`,
          gap: `${GRID_GAP}px`,
          justifyContent: 'center',
          gridAutoFlow: 'dense',
          paddingBottom: '100px',
          width: '100%',
          margin: '0 auto',
          transition: 'gap 0.3s ease-in-out'
        }}>
          {items.map((item, i) => (
            <DesktopGridItem
              key={item.id}
              item={item}
              index={i}
              onReorder={handleReorder}
              onHoverMergeIntent={handleHoverMergeIntent}
              onClearMergeIntent={handleClearMergeIntent}
              onDropItem={handleDropItem}
              isMergeTarget={mergeIntent?.targetId === item.id && mergeIntent?.draggedId !== item.id}
              onResize={handleResize}
              onOpenFolder={(id) => setOpenFolderId(id)}
              showLabels={showLabels}
              onRename={handleRename}
            />
          ))}
        </div>
      </GridDropZone>

      {/* Folder Modal */}
      {openFolderId && (() => {
        const folder = items.find(i => i.id === openFolderId) as FolderItem;
        if (!folder) return null;
        return createPortal(
          <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-2xl transition-all ${isFolderDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            onClick={() => setOpenFolderId(null)}
          >
            <div
              className="bg-white/70 backdrop-blur-3xl border border-white/80 rounded-[44px] p-10 pb-12 w-[90%] max-w-[640px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] animate-in zoom-in duration-200 pointer-events-auto transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-8 mx-auto w-full max-w-[80%]">
                <EditableLabel 
                  initialName={folder.name}
                  onRename={(newName) => handleRename(folder.id, newName)}
                  className="text-center text-3xl font-semibold text-gray-800 tracking-wide cursor-text hover:bg-black/5 px-4 py-1 rounded transition-colors truncate"
                  inputClassName="text-center text-3xl font-semibold text-gray-800 tracking-wide focus:outline-none bg-black/5 px-4 py-1 rounded"
                  inputStyle={{ maxWidth: '100%' }}
                  autoWidth={true}
                />
              </div>
              <div 
                className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] justify-items-center transition-all duration-300 gap-x-6 gap-y-6"
              >
                {folder.sites.map((site, i) => (
                  <FolderInnerItem 
                    key={site.url + i} 
                    site={site} 
                    folderId={folder.id} 
                    showLabels={showLabels}
                    onRename={(newName) => handleRenameInnerItem(folder.id, site.url, newName)}
                    onDragStart={() => setIsFolderDragging(true)} 
                    onDragEnd={() => { setIsFolderDragging(false); setOpenFolderId(null); }}
                  />
                ))}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </DndProvider>
  );
}
