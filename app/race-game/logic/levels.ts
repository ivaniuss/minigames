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
      // Zona 3: EL MINI AGUJERO NEGRO (Reduce tamaño)
      Matter.Bodies.circle(GAME_WIDTH / 2, 300, 35, { 
        isStatic: true, 
        label: 'portal-shrink', 
        render: { fillStyle: '#000000', strokeStyle: '#ffffff', lineWidth: 2 } 
      }),
      // Zona 4 (Barreras cerradas de nuevo, forzando el uso del portal)
      Matter.Bodies.rectangle(100, 160, 200, 15, { ...wallOptions, angle: 0.4, label: 'map-part' }),
      Matter.Bodies.rectangle(350, 160, 200, 15, { ...wallOptions, angle: -0.4, label: 'map-part' }),


    ]
  },
  the_gauntlet: {
    name: 'The Gauntlet (Portals)',
    parts: (wallOptions) => [
      // Paredes zig-zag
      Matter.Bodies.rectangle(150, 680, 250, 15, { ...wallOptions, angle: 0.2, label: 'map-part' }),
      
      // Portal Achicador (AZUL) - Justo antes de un pasillo estrecho
      Matter.Bodies.rectangle(350, 600, 80, 10, { 
        isStatic: true, label: 'portal-shrink', 
        render: { fillStyle: '#0066ff', strokeStyle: '#ffffff', lineWidth: 4 } 
      }),

      Matter.Bodies.rectangle(300, 520, 300, 15, { ...wallOptions, angle: -0.2, label: 'map-part' }),
      
      // Portal Agrandador (NARANJA) - Para recuperar tamaño
      Matter.Bodies.rectangle(100, 400, 80, 10, { 
        isStatic: true, label: 'portal-grow', 
        render: { fillStyle: '#ff9900', strokeStyle: '#ffffff', lineWidth: 4 } 
      }),

      Matter.Bodies.rectangle(150, 320, 250, 15, { ...wallOptions, angle: 0.2, label: 'map-part' }),
      Matter.Bodies.rectangle(GAME_WIDTH/2, 180, 120, 10, { ...wallOptions, label: 'spinner-1', render: { fillStyle: '#ff00ff' } }),
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
