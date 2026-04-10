import { useState, useRef, useEffect, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { WeatherCard } from './WeatherCard';
import { Settings2, GripHorizontal, Maximize2, X, Plus } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface Site {
  name: string;
  domain: string;
  url: string;
}

export type GridShape = { cols: number; rows: number };

export const GRID_CELL_SIZE = 100;
export const GRID_GAP = 36;
export const GRID_STEP = GRID_CELL_SIZE + GRID_GAP;

export interface BaseItem {
  id: string;
  shape: GridShape;
}

export interface SiteItem extends BaseItem {
  type: 'site';
  site: Site;
}

export interface FolderItem extends BaseItem {
  type: 'folder';
  name: string;
  colorFrom: string;
  colorTo: string;
  sites: Site[];
}

export interface WidgetItem extends BaseItem {
  type: 'widget';
  widgetType: 'weather' | 'calendar';
}

export type GridItemType = SiteItem | FolderItem | WidgetItem;

const AVAILABLE_SHAPES: GridShape[] = [
  { cols: 1, rows: 1 },
  { cols: 1, rows: 2 },
  { cols: 2, rows: 1 },
  { cols: 2, rows: 2 },
  { cols: 2, rows: 4 },
  { cols: 4, rows: 1 },
  { cols: 4, rows: 2 },
];
