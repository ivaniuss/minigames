import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export interface LevelDefinition {
  name: string;
  parts: (options: any) => Matter.Body[];
}

export const LEVELS: Record<string, LevelDefinition> = {
  high_flow: {
    name: 'Super Highway',
    parts: (wallOptions) => [
      // Zona 1
      Matter.Bodies.rectangle(80, 650, 180, 15, { ...wallOptions, angle: 0.5, label: 'map-part' }),
      Matter.Bodies.rectangle(370, 650, 180, 15, { ...wallOptions, angle: -0.5, label: 'map-part' }),
      // Divisor inicial para balancear el centro
      Matter.Bodies.rectangle(GAME_WIDTH / 2, 600, 60, 15, { ...wallOptions, label: 'map-part' }),

      // Zona 2
      Matter.Bodies.circle(120, 480, 35, { isStatic: true, restitution: 1.3, label: 'map-part', render: { fillStyle: '#ff00ff' } }),
      Matter.Bodies.circle(330, 480, 35, { isStatic: true, restitution: 1.3, label: 'map-part', render: { fillStyle: '#ff00ff' } }),
      Matter.Bodies.rectangle(50, 350, 80, 10, { ...wallOptions, label: 'spinner-1', render: { fillStyle: '#00ffff' } }),
      Matter.Bodies.rectangle(400, 350, 80, 10, { ...wallOptions, label: 'spinner-2', render: { fillStyle: '#00ffff' } }),
      // Zona 3
      Matter.Bodies.circle(GAME_WIDTH / 2, 300, 35, { isStatic: true, restitution: 1.3, label: 'map-part', render: { fillStyle: '#ffff00' } }),
      // Zona 4 (Rediseñada para que las bolas de tamaño 40 pasen fácil)
      Matter.Bodies.rectangle(70, 160, 180, 20, { ...wallOptions, angle: 0.4, label: 'map-part' }),
      Matter.Bodies.rectangle(380, 160, 180, 20, { ...wallOptions, angle: -0.4, label: 'map-part' }),

    ]
  },
  the_gauntlet: {
    name: 'The Gauntlet',
    parts: (wallOptions) => [
      Matter.Bodies.rectangle(150, 680, 300, 20, { ...wallOptions, angle: 0.2, label: 'map-part' }),
      Matter.Bodies.rectangle(300, 550, 300, 20, { ...wallOptions, angle: -0.2, label: 'map-part' }),
      Matter.Bodies.rectangle(150, 420, 300, 20, { ...wallOptions, angle: 0.2, label: 'map-part' }),
      Matter.Bodies.rectangle(300, 290, 300, 20, { ...wallOptions, angle: -0.2, label: 'map-part' }),
      Matter.Bodies.rectangle(GAME_WIDTH/2, 180, 100, 10, { ...wallOptions, label: 'spinner-1', render: { fillStyle: '#ff00ff' } }),
    ]
  },
  plinko_madness: {
    name: 'Plinko Madness',
    parts: (wallOptions) => Array.from({ length: 12 }).map((_, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      return Matter.Bodies.circle(
        100 + col * 125 + (row % 2 === 0 ? 0 : 55), 
        200 + row * 110, 
        20, 
        { isStatic: true, restitution: 1.4, label: 'map-part', render: { fillStyle: i % 2 === 0 ? '#00ff00' : '#ff00ff' } }
      );
    })
  }
};
