import Matter from 'matter-js';
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS_CONFIG } from '../constants';
import { soundManager } from './SoundManager';
import { LEVELS } from './levels';
import { LevelData, LevelObject, ObjectType, OBJECT_DEFINITIONS } from './LevelTypes';


export interface PlayerBody extends Matter.Body {
  colorName: string;
  colorHex: string;
  symbol: string;
  imagePath?: string;
  currentSpeedMult?: number;
  speedTimer?: number;
  isShrinked?: boolean;
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
  private duckImages: Map<string, HTMLImageElement> = new Map();
  private config = {
    floorEnabled: true,
    floorSpeed: 0.5,
    floorDelay: 5000,
    targetSpeed: 7,
    playerSize: 40,
    raceTitle: 'DUCK RACE!',
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

    // Load duck images
    this.loadDuckImages();

    this.runner = Matter.Runner.create();
    this.setupWorld();
    this.setupEvents();
    
    Matter.Render.run(this.render);
    Matter.Runner.run(this.runner, this.engine);
  }

  private loadDuckImages() {
    const imagePaths = [
      '/ducks/p1.png',
      '/ducks/p2.png',
      '/ducks/p3.png',
      '/ducks/p4.png'
    ];

    imagePaths.forEach(path => {
      if (!this.duckImages.has(path)) {
        const img = new Image();
        img.onload = () => {
          console.log(`Loaded image: ${path}`);
          this.duckImages.set(path, img);
        };
        img.onerror = () => {
          console.error(`Error loading image: ${path}`);
        };
        img.src = path;
        // Also set immediately, though it might not be loaded yet
        this.duckImages.set(path, img);
      }
    });
  }

  public updateConfig(newConfig: Partial<typeof this.config>) {
    const levelChanged = newConfig.activeLevel && newConfig.activeLevel !== this.config.activeLevel;
    this.config = { ...this.config, ...newConfig };
    
    if (levelChanged && !this.isRaceActive) {
      this.setupWorld();
    }
  }

  private customLevel: LevelData | null = null;

  public loadLevel(levelData: LevelData) {
    this.customLevel = levelData;
    this.config.activeLevel = 'custom';
    this.setupWorld();
  }

  private setupWorld() {
    const { world } = this.engine;
    Matter.World.clear(world, false);
    
    const wallOptions = { 
      isStatic: true, 
      restitution: 1, 
      friction: 0,
      render: { fillStyle: '#00f7ff', strokeStyle: '#ffffff', lineWidth: 1 } 
    };

    // Walls
    const circuitWalls = [
      Matter.Bodies.rectangle(5, GAME_HEIGHT / 2, 10, GAME_HEIGHT, wallOptions),
      Matter.Bodies.rectangle(GAME_WIDTH - 5, GAME_HEIGHT / 2, 10, GAME_HEIGHT, wallOptions),
      Matter.Bodies.rectangle(GAME_WIDTH / 2, 5, GAME_WIDTH, 10, wallOptions),
    ];

    let levelParts: Matter.Body[] = [];

    if (this.customLevel) {
       levelParts = this.customLevel.objects.map(obj => this.createBodyFromObject(obj));
    } else {
       const levelDef = LEVELS[this.config.activeLevel] || LEVELS.high_flow;
       levelParts = levelDef.parts(wallOptions);
    }

    // --- LAVA (Rising Floor) ---
    this.risingFloor = Matter.Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + 600, GAME_WIDTH * 2, 1200, {
      isStatic: true,
      isSensor: true,
      label: 'lava',
      render: { fillStyle: '#ff0055', opacity: 0.8 } 
    });

    // Finish Line (made transparent, rendered custom)
    let finishLine: Matter.Body;
    
    if (this.customLevel && this.customLevel.objects.some(o => o.type === 'finish')) {
        finishLine = Matter.Bodies.rectangle(0, -1000, 0, 0, { isStatic: true }); // Dummy if exists in level
    } else {
        finishLine = Matter.Bodies.rectangle(GAME_WIDTH / 2, 45, 120, 40, {
            isStatic: true,
            isSensor: true,
            label: 'finishLine',
            render: { 
                fillStyle: 'transparent',
                strokeStyle: 'transparent', 
                lineWidth: 0 
            }
        });
    }

    Matter.World.add(world, [...circuitWalls, ...levelParts, this.risingFloor, finishLine]);
  }

  private createBodyFromObject(obj: LevelObject): Matter.Body {
      const common = {
          friction: 0,
          frictionAir: 0,
          restitution: 1,
          angle: ((obj.rotation || 0) * Math.PI) / 180,
          render: {
              fillStyle: obj.properties?.color || '#ffffff',
              strokeStyle: '#ffffff',
              lineWidth: 2
          }
      };

      // Store a reference to the source object data for rendering and properties
      const bodyOptions: any = { ...common, objectData: obj };

      if (obj.type === 'wall') {
        return Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 100, obj.height || 20, {
            ...bodyOptions,
            isStatic: true,
            label: 'wall'
        });
      }

      if (obj.type === 'bouncer') {
        const radius = obj.radius || 25;
        const body = Matter.Bodies.circle(obj.x, obj.y, radius, {
            ...bodyOptions,
            isStatic: true,
            restitution: 1.5, // Super bouncy
            label: 'bouncer'
        });
        (body as any).originalRadius = radius;
        return body;
      }

      if (obj.type === 'hazard') {
          return Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 40, obj.height || 40, {
              ...bodyOptions,
              isStatic: true,
              isSensor: true,
              label: 'hazard'
          });
      }

      if (obj.type === 'size-grow' || obj.type === 'size-shrink') {
          return Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 60, obj.height || 60, {
              ...bodyOptions,
              isStatic: true,
              isSensor: true,
              label: obj.type,
              render: { ...bodyOptions.render, opacity: 0.5 }
          });
      }

      if (obj.type === 'teleport-in' || obj.type === 'teleport-out') {
          return Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 50, obj.height || 70, {
              ...bodyOptions,
              isStatic: true,
              isSensor: true,
              label: obj.type,
              render: { ...bodyOptions.render, opacity: 0.4 }
          });
      }

      if (obj.type === 'breakable') {
          const body = Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 40, obj.height || 40, {
              ...bodyOptions,
              isStatic: true,
              label: 'breakable'
          });
          (body as any).health = obj.properties?.health || 3;
          (body as any).maxHealth = obj.properties?.health || 3;
          return body;
      }

      if (obj.type === 'speed-booster' || obj.type === 'speed-slow') {
          const body = Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 50, obj.height || 50, {
              ...bodyOptions,
              isStatic: true,
              isSensor: true,
              label: obj.type,
              render: { ...bodyOptions.render, opacity: 0.6 }
          });
          (body as any).speedMult = obj.properties?.speedMult || (obj.type === 'speed-booster' ? 1.5 : 0.6);
          return body;
      }

      if (obj.type === 'spinner') {
          const body = Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 150, obj.height || 15, {
              ...bodyOptions,
              isStatic: true,
              label: 'spinner',
              render: { ...bodyOptions.render, fillStyle: 'transparent' }
          });
          (body as any).originalWidth = obj.width || 150;
          (body as any).originalHeight = obj.height || 15;
          (body as any).spinDirection = 1;
          return body;
      }
      
      if (obj.type === 'start') {
          return Matter.Bodies.rectangle(obj.x, obj.y, 1, 1, {
              isStatic: true,
              isSensor: true,
              label: 'start-line-dummy',
              render: { fillStyle: 'transparent', opacity: 0 }
          });
      }
      
      if (obj.type === 'finish') {
          const body = Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 200, obj.height || 40, {
              isStatic: true,
              isSensor: true,
              label: 'finishLine',
              render: { fillStyle: 'transparent', opacity: 0 }
          });
          (body as any).originalWidth = obj.width || 200;
          (body as any).originalHeight = obj.height || 40;
          return body;
      }

      return Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 40, obj.height || 40, { isStatic: true, objectData: obj } as any);
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
          const player = body as PlayerBody;
          
          // --- LÓGICA DE VELOCIDAD VARIABLE ---
          // Decaimiento del multiplicador (vuelve a 1.0)
          if ((player.currentSpeedMult || 1) !== 1) {
            const diff = (player.currentSpeedMult || 1) - 1;
            player.currentSpeedMult = (player.currentSpeedMult || 1) - (diff * 0.02);
            if (Math.abs((player.currentSpeedMult || 1) - 1) < 0.01) player.currentSpeedMult = 1;
          }

          // --- EMPUJE MANUAL DE LA LAVA ---
          if (body.position.y > floorTop - 20) {
              const upwardPush = 0.05;
              Matter.Body.applyForce(body, body.position, { x: 0, y: -upwardPush });
          }

          const velocity = body.velocity;
          const speed = Matter.Vector.magnitude(velocity);
          if (speed !== 0) {
            // La velocidad objetivo ahora considera el multiplicador del booster/slower
            const currentTarget = this.config.targetSpeed * (player.currentSpeedMult || 1);
            const scale = currentTarget / speed;
            
            // Aplicar escala suavemente para que los rebotes se sientan físicos pero controlados
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
      
      // --- Render Finish Line ---
      const finishLine = bodies.find(b => b.label === 'finishLine');
      if (finishLine) {
          context.save();
          context.translate(finishLine.position.x, finishLine.position.y);
          context.rotate(finishLine.angle);
          
          // Use stored original dimensions for exact rendering
          const w = (finishLine as any).originalWidth || 200;
          const h = (finishLine as any).originalHeight || 40;
          
          context.translate(-w/2, -h/2);

          // Solid white background
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, w, h);
          
          // Yellow/gold border for finish line feel
          context.strokeStyle = '#FFD700';
          context.lineWidth = 4;
          context.strokeRect(0, 0, w, h);
          
          // Inner orange border for depth
          context.strokeStyle = '#FFA500';
          context.lineWidth = 2;
          context.strokeRect(2, 2, w - 4, h - 4);

          context.restore();
      }

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

      // --- Render de Objetos y Efectos ---
      bodies.forEach(body => {
        const data = (body as any).objectData as LevelObject;
        if (!data) return;

        context.save();
        context.translate(body.position.x, body.position.y);
        context.rotate(body.angle);

        // 1. Renderizar el cuerpo según el tipo si requiere dibujo especial
        if (data.type === 'bouncer') {
           const radius = (body as any).originalRadius || 25;
           // Sombra/Brillo neón
           context.shadowBlur = 15;
           context.shadowColor = data.properties?.color || '#ffff00';
           context.fillStyle = data.properties?.color || '#ffff00';
           context.beginPath();
           context.arc(0, 0, radius, 0, Math.PI * 2);
           context.fill();
           context.strokeStyle = '#ffffff';
           context.lineWidth = 3;
           context.stroke();
           context.shadowBlur = 0;
        } 
        else if (data.type === 'spinner') {
           const w = (body as any).originalWidth || 150;
           const h = (body as any).originalHeight || 15;
           context.fillStyle = data.properties?.color || '#d946ef';
           context.fillRect(-w/2, -h/2, w, h);
           // Rayas de advertencia móviles
           context.fillStyle = 'rgba(0,0,0,0.3)';
           const stripeW = 20;
           const offset = (Date.now() / 20) % (stripeW * 2);
           for(let x = -w/2 - stripeW*2; x < w/2; x += stripeW * 2) {
             const drawX = Math.max(-w/2, x + offset);
             const drawW = Math.min(stripeW, w/2 - drawX);
             if (drawW > 0) context.fillRect(drawX, -h/2, drawW, h);
           }
           context.strokeStyle = '#ffffff';
           context.strokeRect(-w/2, -h/2, w, h);
        }
         else if (data.type.startsWith('teleport') || data.type.startsWith('size') || data.type.startsWith('speed')) {
            const w = data.width || 60;
            const h = data.height || 60;
            const time = Date.now() * 0.003;
            const isTeleportIn = data.type === 'teleport-in';
            const isTeleportOut = data.type === 'teleport-out';
            
            // Background Glow
            context.globalAlpha = 0.3;
            context.fillStyle = data.properties?.color || '#ffffff';
            context.fillRect(-w/2, -h/2, w, h);
            
            // Distinct Portal Animations
            context.strokeStyle = '#ffffff';
            context.lineWidth = 2;
            
            for(let i=0; i<2; i++) {
              let s;
              if (isTeleportIn) {
                s = 0.3 + ((time + i*0.5) % 1) * 0.7; // Converging
                context.globalAlpha = 1 - (s - 0.3) / 0.7;
              } else if (isTeleportOut) {
                s = 1.0 - (((time + i*0.5) % 1) * 0.7); // Diverging
                context.globalAlpha = 1 - (1 - s) / 0.7;
              } else {
                s = 0.5 + Math.sin(time + i) * 0.2;
                context.globalAlpha = 0.6;
              }
              context.strokeRect(-w*s/2, -h*s/2, w*s, h*s);
            }
            context.globalAlpha = 1.0;
         }

        // 2. Dibujar ICONO (Emoji) si está habilitado
        if (data.properties?.showIcon) {
           const icon = OBJECT_DEFINITIONS[data.type]?.icon || '?';
           context.font = '30px Arial';
           context.textAlign = 'center';
           context.textBaseline = 'middle';
           // Pequeño drop shadow para el emoji
           context.shadowBlur = 4;
           context.shadowColor = 'rgba(0,0,0,0.5)';
           context.rotate(-body.angle); // Mantener el emoji derecho
           context.fillText(icon, 0, 0);
        }

        context.restore();
      });

      // --- Render de Patos (Players) ---
      bodies.forEach(body => {
        if ((body as any).colorName) {
           const player = body as PlayerBody;
           const imagePath = player.imagePath;
           
           if (imagePath && this.duckImages.has(imagePath)) {
             const img = this.duckImages.get(imagePath)!;
             const size = body.circleRadius ? body.circleRadius * 2 : 40;
             
             context.save();
             context.translate(body.position.x, body.position.y);
             context.rotate(body.angle);
             context.drawImage(img, -size/2, -size/2, size, size);
             context.restore();
           } else {
             context.font = '32px Arial';
             context.textAlign = 'center';
             context.textBaseline = 'middle';
             context.fillText(player.symbol, body.position.x, body.position.y);
           }
        }
      });
    });

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA as any;
        const bodyB = pair.bodyB as any;

        if (bodyA.colorName || bodyB.colorName) {
          const player = (bodyA.colorName ? bodyA : bodyB) as PlayerBody;
          const other = (bodyA.colorName ? bodyB : bodyA) as any;

          // --- 🦆 COLISIÓN ENTRE PATOS (Ducks) ---
          if (bodyA.colorName && bodyB.colorName) {
             soundManager.playCollision(2);
             return;
          }

          // --- 🌌 LÓGICA DE TELETRANSPORTE (Portales) ---
          if (other.label === 'teleport-in') {
             // Buscar el portal de salida más cercano
             const exits = this.engine.world.bodies.filter(b => b.label === 'teleport-out');
             if (exits.length > 0) {
                // Encontrar el más cercano a este portal de entrada
                const nearest = exits.reduce((prev, curr) => {
                   const dC = Matter.Vector.magnitude(Matter.Vector.sub(curr.position, other.position));
                   const dP = Matter.Vector.magnitude(Matter.Vector.sub(prev.position, other.position));
                   return dC < dP ? curr : prev;
                });
                
                // Mover jugador a la salida con un pequeño offset para evitar bucles
                Matter.Body.setPosition(player, { x: nearest.position.x, y: nearest.position.y });
                soundManager.playPortal();
                return;
             }
          }

          // --- 📏 LÓGICA DE TAMAÑO ---
          if (other.label === 'size-shrink' && !player.isShrinked) {
             Matter.Body.scale(player, 0.6, 0.6);
             player.isShrinked = true;
             soundManager.playWarp(true);
          } else if (other.label === 'size-grow' && player.isShrinked) {
             Matter.Body.scale(player, 1.666, 1.666);
             player.isShrinked = false;
             soundManager.playWarp(false);
          }

          // --- ⚡ LÓGICA DE VELOCIDAD ---
          if (other.label === 'speed-booster' || other.label === 'speed-slow') {
             const mult = other.speedMult || (other.label === 'speed-booster' ? 1.5 : 0.6);
             // Establecer multiplicador temporal (el decay ocurre en beforeUpdate)
             player.currentSpeedMult = mult;
             soundManager.playSpeedPad(mult > 1);
          }

          // --- 💀 LÓGICA DE PELIGRO ---
          if (other.label === 'hazard') {
             Matter.World.remove(this.engine.world, player);
             soundManager.playHazardHit();
             return;
          }

          // --- 📦 LÓGICA DE CAJAS ROMPIBLES ---
          if (other.label === 'breakable') {
             other.health = (other.health || 0) - 1;
             
             // Feedback visual: Flash blanco y opacidad segun vida
             const opacity = other.health / (other.maxHealth || 3);
             other.render.opacity = Math.max(0.3, opacity);
             
             if (other.health <= 0) {
                Matter.World.remove(this.engine.world, other);
                soundManager.playBreakCrate();
             } else {
                soundManager.playCollision(3);
             }
          }

          // --- 🧱 COLISIÓN GENÉRICA (Paredes, etc) ---
          if (other.label === 'wall' || other.label === 'spinner') {
             soundManager.playCollision(0.5); // Softer, more "solid" sound
          }
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
      
      const data = (spinner as any).objectData as LevelObject;
      const initialAngle = ((data?.rotation || 0) * Math.PI) / 180;
      const spinSpeed = data?.properties?.speed || 0.05; // Default speed if not set
      
      const direction = index % 2 === 0 ? 1 : -1;
      Matter.Body.setAngle(spinner, initialAngle + (time * spinSpeed * 0.02 * direction));
    });

    const mapParts = this.engine.world.bodies.filter(b => b.label === 'map-part' || b.label === 'crate');
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

    // Find start object from custom level or use default position
    let startX = GAME_WIDTH / 2;
    let startY = GAME_HEIGHT - 60;
    let startWidth = GAME_WIDTH * 0.8;
    let startHeight = 50;

    if (this.customLevel) {
      const startObj = this.customLevel.objects.find(o => o.type === 'start');
      if (startObj) {
        startX = startObj.x;
        startY = startObj.y;
        startWidth = startObj.width || 400;
        startHeight = startObj.height || 50;
      }
    }

    // Calculate spacing based on available width
    const spacing = Math.min(75, startWidth / colors.length);
    const startXOffset = startX - (startWidth / 2) + (spacing / 2);

    // --- FAIRNESS: Shuffling the colors array so positions are random each time ---
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);

    shuffledColors.forEach((color, index) => {
      const size = this.config.playerSize;
      // Position within the start area
      const xPos = startXOffset + (index * spacing);
      // Add small random jitter
      const jitterX = (Math.random() - 0.5) * 10;
      const jitterY = (Math.random() - 0.5) * (startHeight / 2);
      
      const player = Matter.Bodies.circle(
        xPos + jitterX, 
        startY + jitterY, 
        size / 2, 
        {
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
        }
      ) as PlayerBody;

      player.colorName = color.name;
      player.colorHex = color.hex;
      player.symbol = color.symbol;
      player.imagePath = (color as any).image; // Store image path for rendering
      
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

  cleanup() {
    if (this.render) {
      Matter.Render.stop(this.render);
      this.render.canvas.remove();
    }
    Matter.Engine.clear(this.engine);
  }
}
