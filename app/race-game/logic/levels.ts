import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export const LEVELS: Record<string, { name: string, parts: (wallOptions: any) => Matter.Body[] }> = {
  high_flow: {
    name: 'High Flow',
    parts: (wallOptions: any) => [
      // Central obstacles
      Matter.Bodies.rectangle(GAME_WIDTH * 0.25, GAME_HEIGHT * 0.3, 150, 20, { ...wallOptions, angle: 0.5 }),
      Matter.Bodies.rectangle(GAME_WIDTH * 0.75, GAME_HEIGHT * 0.3, 150, 20, { ...wallOptions, angle: -0.5 }),
      Matter.Bodies.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.5, 120, 20, { ...wallOptions, angle: 1.57 }),
      
      // Bouncers
      Matter.Bodies.circle(GAME_WIDTH * 0.2, GAME_HEIGHT * 0.7, 30, wallOptions),
      Matter.Bodies.circle(GAME_WIDTH * 0.8, GAME_HEIGHT * 0.7, 30, wallOptions),
      Matter.Bodies.circle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.2, 35, wallOptions),

      // Spinners
      Matter.Bodies.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.4, 180, 15, { 
        ...wallOptions,
        label: 'spinner',
        render: { fillStyle: '#D946EF', strokeStyle: '#fff', lineWidth: 2 }
      }),
      Matter.Bodies.rectangle(GAME_WIDTH * 0.5, GAME_HEIGHT * 0.6, 180, 15, { 
        ...wallOptions,
        label: 'spinner',
        render: { fillStyle: '#D946EF', strokeStyle: '#fff', lineWidth: 2 }
      }),
    ]
  },
  basic: {
    name: 'Basic',
    parts: (wallOptions: any) => [
      Matter.Bodies.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50, wallOptions),
      Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 4, 200, 20, wallOptions),
      Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 200, 20, wallOptions),
    ]
  }
};
