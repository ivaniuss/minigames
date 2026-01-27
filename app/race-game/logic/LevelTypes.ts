export type ObjectType = 
  | 'wall' 
  | 'hazard' 
  | 'bouncer' 
  | 'size-grow' 
  | 'size-shrink' 
  | 'teleport-in' 
  | 'teleport-out' 
  | 'breakable' 
  | 'speed-booster' 
  | 'speed-slow' 
  | 'spinner' 
  | 'start' 
  | 'finish';

export interface LevelObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number; // for circular objects like bouncers
  rotation?: number;
  properties?: {
    health?: number;       // For breakables
    speedMult?: number;    // For boosters
    speed?: number;        // For spinners (rotation speed)
    color?: string;        // Custom color overrides
    label?: string;        // Optional label text
    showIcon?: boolean;    // Whether to show the emoji/icon
  };
}

export interface LevelData {
  id: string;
  name: string;
  objects: LevelObject[];
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_LEVEL: LevelData = {
  id: 'new-level',
  name: 'My Custom Level',
  objects: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const OBJECT_DEFINITIONS: Record<ObjectType, { label: string, icon: string, defaultProps: Partial<LevelObject> }> = {
  'wall': {
    label: 'Wall',
    icon: '🧱',
    defaultProps: { width: 100, height: 20, rotation: 0, properties: { color: '#ffffff', showIcon: false } }
  },
  'hazard': {
    label: 'Hazard',
    icon: '☠️',
    defaultProps: { width: 40, height: 40, rotation: 0, properties: { color: '#ff0000', showIcon: true } }
  },
  'bouncer': {
    label: 'Bouncer',
    icon: '🟡',
    defaultProps: { radius: 25, properties: { color: '#ffff00', showIcon: true } }
  },
  'size-grow': {
    label: 'Size Up',
    icon: '⏫',
    defaultProps: { width: 60, height: 60, properties: { color: '#00ff00', showIcon: true } }
  },
  'size-shrink': {
    label: 'Size Down',
    icon: '⏬',
    defaultProps: { width: 60, height: 60, properties: { color: '#a020f0', showIcon: true } }
  },
  'teleport-in': {
    label: 'Portal (In)',
    icon: '🌀',
    defaultProps: { width: 50, height: 70, properties: { color: '#3b82f6', showIcon: true } }
  },
  'teleport-out': {
    label: 'Portal (Out)',
    icon: '🌀',
    defaultProps: { width: 50, height: 70, properties: { color: '#f59e0b', showIcon: true } }
  },
  'breakable': {
    label: 'Crate',
    icon: '📦',
    defaultProps: { width: 40, height: 40, properties: { health: 3, color: '#8b4513', showIcon: true } }
  },
  'speed-booster': {
    label: 'Booster',
    icon: '⚡',
    defaultProps: { width: 50, height: 50, properties: { speedMult: 1.5, color: '#10b981', showIcon: true } }
  },
  'speed-slow': {
    label: 'Slower',
    icon: '🐌',
    defaultProps: { width: 50, height: 50, properties: { speedMult: 0.6, color: '#ef4444', showIcon: true } }
  },
  'spinner': {
    label: 'Spinner',
    icon: '⚙️',
    defaultProps: { width: 140, height: 15, properties: { speed: 0.1, color: '#d946ef', showIcon: false } }
  },
  'start': {
    label: 'Start Zone',
    icon: '🏁',
    defaultProps: { width: 400, height: 50, properties: { color: '#333333', showIcon: false } }
  },
  'finish': {
    label: 'Finish Line',
    icon: '🏆',
    defaultProps: { width: 400, height: 50, properties: { color: '#ffffff', showIcon: false } }
  }
};
