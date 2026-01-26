import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS_CONFIG } from '../constants';
import { soundManager } from './SoundManager';
import { LEVELS } from './levels';


export interface PlayerBody extends Matter.Body {
  colorName: string;
  colorHex: string;
  symbol: string;
}

export class PhysicsEngine {
  private engine: Matter.Engine;
  private runner: Matter.Runner;
  private render: Matter.Render | null = null;
  private onWin: (colorName: string) => void;
  private isRaceActive = false;
  private winner: string | null = null;

  private risingFloor: Matter.Body | null = null;
  private raceStartTime: number = 0;
  private config = {
    floorEnabled: true,
    floorSpeed: 0.5,
    floorDelay: 5000,
    targetSpeed: 7,
    raceTitle: 'FOOD BATTLE',
    activeLevel: 'high_flow'
  };

  constructor(sceneElement: HTMLElement, onWin: (colorName: string) => void) {
    this.onWin = onWin;
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = 0;
    this.engine.gravity.x = 0;

    this.render = Matter.Render.create({
      element: sceneElement,
      engine: this.engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false,
        background: 'transparent'
      }
    });

    this.runner = Matter.Runner.create();
    this.setupWorld();
    this.setupEvents();
    
    Matter.Render.run(this.render);
    Matter.Runner.run(this.runner, this.engine);
  }

  public updateConfig(newConfig: Partial<typeof this.config>) {
    const levelChanged = newConfig.activeLevel && newConfig.activeLevel !== this.config.activeLevel;
    this.config = { ...this.config, ...newConfig };
    
    if (levelChanged && !this.isRaceActive) {
      this.setupWorld();
    }
  }

  private setupWorld() {
    const { world } = this.engine;
    Matter.World.clear(world, false);
    
    const wallOptions = { 
      isStatic: true, 
      restitution: 1, 
      friction: 0,
      render: { fillStyle: '#00cc00', strokeStyle: '#ffffff', lineWidth: 2 } 
    };

    // Paredes base comunes para todos los mapas
    const circuitWalls = [
      Matter.Bodies.rectangle(5, GAME_HEIGHT / 2, 10, GAME_HEIGHT, wallOptions),
      Matter.Bodies.rectangle(GAME_WIDTH - 5, GAME_HEIGHT / 2, 10, GAME_HEIGHT, wallOptions),
      Matter.Bodies.rectangle(GAME_WIDTH / 2, 5, GAME_WIDTH, 10, wallOptions),
    ];

    // Cargar partes dinámicas del nivel seleccionado
    const levelDef = LEVELS[this.config.activeLevel] || LEVELS.high_flow;
    const levelParts = levelDef.parts(wallOptions);

    // --- LAVA MASIVA (Ahora es un SENSORE para evitar expulsiones bruscas) ---
    this.risingFloor = Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 600, GAME_WIDTH * 2, 1200, {
      isStatic: true,
      isSensor: true, // Esto evita que "aplaste" y "patee" los objetos a través de paredes
      label: 'lava',
      render: { fillStyle: '#ff3300', opacity: 0.95 }
    });

    const finishLine = Matter.Bodies.rectangle(GAME_WIDTH / 2, 45, 120, 40, {
      isStatic: true,
      isSensor: true,
      label: 'finishLine',
      render: { 
        fillStyle: 'rgba(0, 255, 100, 0.2)',
        strokeStyle: '#00ff00', 
        lineWidth: 3 
      }
    });

    Matter.World.add(world, [...circuitWalls, ...levelParts, this.risingFloor, finishLine]);
  }

  private setupEvents() {
    Matter.Events.on(this.engine, 'beforeUpdate', () => {
      this.updateObstacles();
      this.updateRisingFloor();
      
      const floorTop = (this.risingFloor?.position.y || 0) - 600;
      
      if (!this.isRaceActive) return;
      
      const bodies = this.engine.world.bodies;
      bodies.forEach(body => {
        if ((body as any).colorName) {
          // --- EMPUJE MANUAL DE LA LAVA ---
          // Si el objeto está tocando o dentro de la lava, le aplicamos una fuerza hacia arriba
          // Pero si está atascado contra una pared, la lava simplemente lo cubrirá
          if (body.position.y > floorTop - 20) {
              const upwardPush = 0.05; // Empuje suave
              Matter.Body.applyForce(body, body.position, { x: 0, y: -upwardPush });
          }

          const velocity = body.velocity;
          const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
          if (speed !== 0) {
            const scale = this.config.targetSpeed / speed;
            Matter.Body.setVelocity(body, {
              x: velocity.x * scale,
              y: velocity.y * scale
            });
          }
        }
      });
    });

    // Custom rendering for emojis, Watermark and Title
    Matter.Events.on(this.render!, 'afterRender', () => {
      const context = this.render!.context;
      const bodies = this.engine.world.bodies;
      
      // --- BACKGROUND GRID (Para videos de alta calidad) ---
      context.save();
      context.strokeStyle = 'rgba(255,255,255,0.05)';
      context.lineWidth = 1;
      const gridSize = 40;
      for(let x=0; x<GAME_WIDTH; x+=gridSize) {
        context.beginPath(); context.moveTo(x,0); context.lineTo(x,GAME_HEIGHT); context.stroke();
      }
      for(let y=0; y<GAME_HEIGHT; y+=gridSize) {
        context.beginPath(); context.moveTo(0,y); context.lineTo(GAME_WIDTH,y); context.stroke();
      }
      context.restore();

      // --- Watermark ---
      context.save();
      context.globalAlpha = 0.15;
      context.font = 'bold 36px Arial';
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.fillText('BOUNCE MANIA', GAME_WIDTH / 2, GAME_HEIGHT / 2);
      context.restore();

      // --- Race Title (Bajado para no tapar la meta) ---
      context.save();
      context.fillStyle = '#00ff00'; // Verde tipo marcador neon
      context.font = 'black 32px Arial';
      context.textAlign = 'center';
      context.shadowBlur = 10;
      context.shadowColor = '#00ff00';
      context.fillText(this.config.raceTitle.toUpperCase(), GAME_WIDTH / 2, 130);
      context.restore();


      // --- Status / Phases ---
      const elapsed = Date.now() - this.raceStartTime;
      const remaining = this.config.floorDelay - elapsed;
      
      context.save();
      context.textAlign = 'center';
      if (remaining > 2000) {
        context.fillStyle = 'rgba(255,255,255,0.4)';
        context.font = 'bold 14px Arial';
        context.fillText('PHASE 1: THE RACE', GAME_WIDTH / 2, 100);
      } else if (remaining > 0) {
        // Warning parpadeante
        const flash = Math.floor(Date.now() / 200) % 2 === 0;
        context.fillStyle = flash ? '#ff3300' : '#ffffff';
        context.font = 'bold 20px Arial';
        context.fillText('⚠️ WARNING: FLOOR RISING ⚠️', GAME_WIDTH / 2, 105);
      } else if (this.config.floorEnabled) {
        context.fillStyle = '#ff3300';
        context.font = 'black 16px Arial';
        context.fillText('SURVIVAL MODE ACTIVE', GAME_WIDTH / 2, 100);
      }
      context.restore();

      // --- Emojis y Efectos Especiales ---
      bodies.forEach(body => {
        // --- Efecto Agujero Negro (Shrinkers) ---
        if (body.label === 'portal-shrink') {
          context.save();
          context.translate(body.position.x, body.position.y);
          const time = Date.now() * 0.002;
          
          // Círculos concéntricos vivos
          for (let i = 1; i <= 3; i++) {
            context.beginPath();
            context.arc(0, 0, 15 + i * 8 + Math.sin(time + i) * 3, 0, Math.PI * 2);
            context.strokeStyle = `rgba(255, 255, 255, ${0.1 * i})`;
            context.lineWidth = 1;
            context.stroke();
          }

          // Líneas radiales ("Horizonte de sucesos")
          context.rotate(time);
          for (let i = 0; i < 8; i++) {
            context.beginPath();
            context.moveTo(10, 0);
            context.lineTo(30, 0);
            context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            context.lineWidth = 2;
            context.stroke();
            context.rotate(Math.PI / 4);
          }
          context.restore();
        }

        // --- Render de Emojis ---
        if ((body as PlayerBody).symbol) {
          context.font = '32px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText((body as PlayerBody).symbol, body.position.x, body.position.y);
        }
      });
    });

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as any;
        const bodyB = pair.bodyB as any;

        if (bodyA.colorName || bodyB.colorName) {
          const player = bodyA.colorName ? bodyA : bodyB;
          const other = bodyA.colorName ? bodyB : bodyA;

          // --- LÓGICA DE PORTALES DE TAMAÑO ---
          if (other.label === 'portal-shrink' && !player.isShrinked) {
             Matter.Body.scale(player, 0.6, 0.6);
             player.isShrinked = true;
             soundManager.playCollision(10); // Sonido fuerte para el efecto
          } else if (other.label === 'portal-grow' && player.isShrinked) {
             Matter.Body.scale(player, 1.666, 1.666);
             player.isShrinked = false;
             soundManager.playCollision(10);
          }

          soundManager.playCollision(pair.collision.depth || 5);
        }


        if (bodyA.label === 'finishLine' || bodyB.label === 'finishLine') {
          const winnerBody = bodyA.label === 'finishLine' ? bodyB : bodyA;
          if (winnerBody.colorName && this.isRaceActive && !this.winner) {
            this.handleWin(winnerBody.colorName);
          }
        }
      });
    });
  }

  private updateObstacles() {
    const time = this.engine.timing.timestamp;
    const spinners = this.engine.world.bodies.filter(b => b.label?.startsWith('spinner'));
    const floorY = this.risingFloor?.position.y || Infinity;
    const floorTop = floorY - 600;

    spinners.forEach((spinner, index) => {
      if (spinner.position.y > floorTop) {
        Matter.World.remove(this.engine.world, spinner);
        return;
      }
      const direction = index === 0 ? 1 : -1;
      Matter.Body.setAngle(spinner, time * 0.005 * direction);
    });

    const mapParts = this.engine.world.bodies.filter(b => b.label === 'map-part');
    mapParts.forEach(part => {
      if (part.position.y > floorTop + 20) {
        Matter.World.remove(this.engine.world, part);
      }
    });

    // --- ELIMINACIÓN DE JUGADORES (Tragados al 75%) ---
    const players = this.engine.world.bodies.filter(b => (b as any).colorName);
    players.forEach(player => {
      // Obtenemos el radio actual (considerando si está encogido)
      const radius = (player as any).circleRadius || 20;
      
      // La lava se lo "traga" cuando cubre el 75% de su altura (2R)
      // Matemáticamente: Posición Y >= floorTop + (Radio * 0.5)
      if (player.position.y > floorTop + (radius * 0.5)) {
        Matter.World.remove(this.engine.world, player);
        // Opcional: Sonido de eliminación
        soundManager.playCollision(2); 
      }
    });

  }


  private updateRisingFloor() {
    if (!this.isRaceActive || !this.risingFloor || !this.config.floorEnabled) return;

    const elapsed = Date.now() - this.raceStartTime;
    if (elapsed > this.config.floorDelay) {
      const newY = this.risingFloor.position.y - this.config.floorSpeed;
      if (newY > 300) {
        Matter.Body.setPosition(this.risingFloor, {
          x: this.risingFloor.position.x,
          y: newY
        });
      }
    }
  }

  private handleWin(colorName: string) {
    this.isRaceActive = false;
    this.winner = colorName;
    this.onWin(colorName);
  }

  spawnPlayers(colors: readonly any[]) {
    this.isRaceActive = true;
    this.winner = null;
    this.raceStartTime = Date.now();
    
    // Re-configurar mundo para limpiar objetos eliminados en la ronda anterior
    this.setupWorld();

    const { world } = this.engine;
    
    // Resetear posición de la pared de cierre (ya se hace en setupWorld pero aseguramos)
    if (this.risingFloor) {
      Matter.Body.setPosition(this.risingFloor, { x: GAME_WIDTH / 2, y: GAME_HEIGHT + 600 });
    }

    const toRemove = world.bodies.filter(b => (b as any).colorName);
    Matter.World.remove(world, toRemove);

    const startY = GAME_HEIGHT - 60;
    const spacing = 75; // Un poco más juntos
    const startXOffset = (450 - (colors.length - 1) * spacing) / 2;

    // --- FAIRNESS: Shuffling the colors array so positions are random each time ---
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

    shuffledColors.forEach((color, index) => {
      const size = PHYSICS_CONFIG.playerSize;
      // Añadimos un pequeño "jitter" aleatorio a la X para que no sea una línea perfecta
      const jitterX = (Math.random() - 0.5) * 15;
      const player = Matter.Bodies.circle(startXOffset + index * spacing + jitterX, startY, size / 2, {
        restitution: 0.9,
        friction: 0.001,
        frictionAir: 0,
        inertia: Infinity,
        label: `player-${color.name}`,
        render: { 
          fillStyle: color.hex,
          strokeStyle: '#ffffff',
          lineWidth: 3,
          opacity: 0.8 
        }
      }) as PlayerBody;

      player.colorName = color.name;
      player.colorHex = color.hex;
      player.symbol = color.symbol;
      
      const baseAngle = -Math.PI / 2; 
      const randomVar = (Math.random() - 0.5) * 0.4;
      const finalAngle = baseAngle + randomVar;

      Matter.Body.setVelocity(player, {
        x: Math.cos(finalAngle) * this.config.targetSpeed,
        y: Math.sin(finalAngle) * this.config.targetSpeed
      });
      
      Matter.World.add(world, player);
    });
  }

  // Compatibility methods for page.tsx
  getGeneration() { return 1; }

  destroy() {
    Matter.Render.stop(this.render!);
    Matter.Engine.clear(this.engine);
    this.render!.canvas.remove();
  }
}
