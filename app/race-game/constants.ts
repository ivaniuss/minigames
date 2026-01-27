export const COLORS = [
  { name: 'Yellow Duck', hex: '#FFCC00', symbol: '🦆', image: '/ducks/p1.png', glow: 'rgba(255, 204, 0, 0.5)' },
  { name: 'Blue Duck', hex: '#007AFF', symbol: '🦆', image: '/ducks/p2.png', glow: 'rgba(0, 122, 255, 0.5)' },
  { name: 'Green Duck', hex: '#4CD964', symbol: '🦆', image: '/ducks/p3.png', glow: 'rgba(76, 217, 100, 0.5)' },
  { name: 'Purple Duck', hex: '#9B59B6', symbol: '🦆', image: '/ducks/p4.png', glow: 'rgba(155, 89, 182, 0.5)' },
] as const;


export const GAME_WIDTH = 450;
export const GAME_HEIGHT = 800;

export const PHYSICS_CONFIG = {
  gravity: 0,
  friction: 0,
  frictionAir: 0,
  restitution: 1,
  playerSize: 40, 
  maxVelocity: 7, // TARGET_SPEED from example
  targetSpeed: 7,
};


