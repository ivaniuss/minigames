export const COLORS = [
  { name: 'Burger', hex: '#FF3B30', symbol: '🍔', glow: 'rgba(255, 59, 48, 0.5)' },
  { name: 'Salad', hex: '#4CD964', symbol: '🥗', glow: 'rgba(76, 217, 100, 0.5)' },
  { name: 'Ice Cream', hex: '#007AFF', symbol: '🍦', glow: 'rgba(0, 122, 255, 0.5)' },
  { name: 'Banana', hex: '#FFCC00', symbol: '🍌', glow: 'rgba(255, 204, 0, 0.5)' },
  { name: 'Pizza', hex: '#AF52DE', symbol: '🍕', glow: 'rgba(175, 82, 222, 0.5)' },
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


