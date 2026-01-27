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
    floorEnabled: false,
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
      render: { fillStyle: 'transparent', strokeStyle: 'transparent', lineWidth: 0 } 
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

    // Handle Finish Line (Default if none in custom level)
    const hasCustomFinish = this.customLevel?.objects.some(o => o.type === 'finish');
    let defaultFinish: Matter.Body | null = null;
    
    if (!hasCustomFinish && !(!this.customLevel && (LEVELS[this.config.activeLevel] as any)?.objects?.some((o:any) => o.type === 'finish'))) {
        defaultFinish = Matter.Bodies.rectangle(GAME_WIDTH / 2, 45, 120, 40, {
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

    const bodiesToAdd = [...circuitWalls, ...levelParts, this.risingFloor];
    if (defaultFinish) bodiesToAdd.push(defaultFinish);

    Matter.World.add(world, bodiesToAdd);
  }

  private createBodyFromObject(obj: LevelObject): Matter.Body {
      const common = {
          friction: 0,
          frictionAir: 0,
          restitution: 1,
          angle: ((obj.rotation || 0) * Math.PI) / 180,
          render: {
              fillStyle: obj.properties?.color || '#ffffff',
              strokeStyle: 'transparent',
              lineWidth: 0
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
              objectData: obj, // Added for renderer
              render: { fillStyle: 'transparent', opacity: 0 }
          } as any);
      }
      
      if (obj.type === 'crate-dynamic') {
          return Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 45, obj.height || 45, {
              ...bodyOptions,
              isStatic: false,
              friction: 0.1,
              frictionAir: 0.02,
              restitution: 0.5,
              label: 'crate-dynamic'
          });
      }

      if (obj.type === 'finish') {
          const body = Matter.Bodies.rectangle(obj.x, obj.y, obj.width || 200, obj.height || 40, {
              isStatic: true,
              isSensor: true,
              label: 'finishLine',
              objectData: obj,
              render: { fillStyle: 'transparent', opacity: 0 }
          } as any);
          (body as any).originalWidth = obj.width || 200;
          (body as any).originalHeight = obj.height || 40;
          return body;
      }

      if (obj.type === 'triangle' || obj.type === 'triangle-right') {
          const w = obj.width || 60;
          const h = obj.height || 60;
          let vertices;
          let centroidOffset = { x: 0, y: 0 };
          
          if (obj.type === 'triangle') {
              vertices = [
                { x: 0, y: -h / 2 },
                { x: w / 2, y: h / 2 },
                { x: -w / 2, y: h / 2 }
              ];
              centroidOffset = { x: 0, y: h / 6 };
          } else {
              vertices = [
                { x: -w / 2, y: -h / 2 },
                { x: w / 2, y: h / 2 },
                { x: -w / 2, y: h / 2 }
              ];
              centroidOffset = { x: -w / 6, y: h / 6 };
          }

          const angle = ((obj.rotation || 0) * Math.PI) / 180;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          // Important: Rotate the centroid offset to match world-space placement
          const rotatedOffsetX = centroidOffset.x * cos - centroidOffset.y * sin;
          const rotatedOffsetY = centroidOffset.x * sin + centroidOffset.y * cos;

          const body = Matter.Bodies.fromVertices(obj.x + rotatedOffsetX, obj.y + rotatedOffsetY, [vertices], {
              ...bodyOptions,
              isStatic: true,
              label: obj.type,
              render: { ...bodyOptions.render, fillStyle: 'transparent', strokeStyle: 'transparent' }
          });
          
          if (body) {
              // Re-enforce position and angle because fromVertices might shift it
              Matter.Body.setAngle(body, angle);
              Matter.Body.setPosition(body, { x: obj.x + rotatedOffsetX, y: obj.y + rotatedOffsetY });
              (body as any).objectData = obj; // Ensure renderer has it
          }
          return body || Matter.Bodies.rectangle(obj.x, obj.y, w, h, bodyOptions);
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
          
          // Use custom color if set in editor, else white
          const data = (finishLine as any).objectData as LevelObject;
          const customColor = data?.properties?.color || '#ffffff';
          
          context.translate(-w/2, -h/2);

          // Background
          context.fillStyle = customColor;
          context.fillRect(0, 0, w, h);
          
          // Border logic based on luminosity or just white/gold
          context.strokeStyle = customColor;
          context.globalAlpha = 0.5;
          context.lineWidth = 1;
          context.strokeRect(0, 0, w, h);
          context.globalAlpha = 1.0;
          
          // Pattern overlay (optional, but keep it clean)
          context.fillStyle = 'rgba(255,255,255,0.2)';
          const squareSize = 10;
          for(let i=0; i<w; i+=squareSize*2) {
              for(let j=0; j<h; j+=squareSize*2) {
                  context.fillRect(i, j, squareSize, squareSize);
                  context.fillRect(i+squareSize, j+squareSize, squareSize, squareSize);
              }
          }

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
           context.shadowBlur = 0;
        } 
         else if (data.type === 'breakable' || data.type === 'crate-dynamic') {
            const w = data.width || 45;
            const h = data.height || 45;
            context.fillStyle = data.properties?.color || '#8b4513';
            context.fillRect(-w/2, -h/2, w, h);
            
            // Wooden crate texture
            context.strokeStyle = 'rgba(0,0,0,0.3)';
            context.lineWidth = 2;
            context.strokeRect(-w/2 + 2, -h/2 + 2, w - 4, h - 4);
            context.beginPath();
            context.moveTo(-w/2, -h/2); context.lineTo(w/2, h/2);
            context.moveTo(w/2, -h/2); context.lineTo(-w/2, h/2);
            context.stroke();
         }
         else if (data.type === 'triangle' || data.type === 'triangle-right') {
            const w = data.width || 60;
            const h = data.height || 60;
            context.fillStyle = data.properties?.color || (data.type === 'triangle' ? '#3b82f6' : '#ef4444');
            context.beginPath();
            
            if (data.type === 'triangle') {
                context.moveTo(0, -2*h/3);
                context.lineTo(w/2, h/3);
                context.lineTo(-w/2, h/3);
            } else {
                context.moveTo(-w/3, -2*h/3);
                context.lineTo(2*w/3, h/3);
                context.lineTo(-w/3, h/3);
            }
            
            context.closePath();
            context.fill();
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
        }
         else if (data.type.startsWith('teleport') || data.type.startsWith('size') || data.type.startsWith('speed')) {
            const w = data.width || 60;
            const h = data.height || 60;
            const time = Date.now() * 0.003;
            const isTeleportIn = data.type === 'teleport-in';
            const isTeleportOut = data.type === 'teleport-out';
            
            // Get effective color from properties or default definition
            const defColor = OBJECT_DEFINITIONS[data.type]?.defaultProps?.properties?.color || '#ffffff';
            const color = data.properties?.color || defColor;
            
            // Background Glow with pulsing transparency
            context.globalAlpha = 0.2 + Math.sin(time * 2) * 0.1;
            context.fillStyle = color;
            context.beginPath();
            if (context.roundRect) context.roundRect(-w/2, -h/2, w, h, 10);
            else context.rect(-w/2, -h/2, w, h);
            context.fill();
            
            // Ring Animations
            context.lineWidth = 2;
            for(let i=0; i<3; i++) {
              let s;
              const progress = ((time*0.5 + i*0.4) % 1.2) / 1.2; 
              
              if (isTeleportIn) {
                // IN: Rings close into the center (Converge)
                s = 1.2 - progress; 
                context.strokeStyle = color;
                context.globalAlpha = progress; // Fades as it reaches center
              } else if (isTeleportOut) {
                // OUT: Rings expand from the center (Diverge)
                s = progress;
                context.strokeStyle = color;
                context.globalAlpha = 1 - progress; // Fades as it expands
              } else {
                // Other pads: Simple pulse
                s = 0.5 + Math.sin(time + i) * 0.2;
                context.strokeStyle = color;
                context.globalAlpha = 0.5;
              }
              
              const rw = w * s;
              const rh = h * s;
              context.beginPath();
              if (context.roundRect) context.roundRect(-rw/2, -rh/2, rw, rh, 5);
              else context.strokeRect(-rw/2, -rh/2, rw, rh);
              context.stroke();
            }
            context.globalAlpha = 1.0;

            // Small clarifying label
            if (isTeleportIn || isTeleportOut) {
                context.font = 'bold 10px Inter, sans-serif';
                context.fillStyle = '#ffffff';
                context.textAlign = 'center';
                context.fillText(isTeleportIn ? 'ENTRY' : 'EXIT', 0, h/2 + 12);
            }
         }

        // 2. Dibujar ICONO (Emoji) si está habilitado
        if (data.properties?.showIcon) {
           const icon = OBJECT_DEFINITIONS[data.type]?.icon || '?';
           context.font = '28px Arial';
           context.textAlign = 'center';
           context.textBaseline = 'middle';
           
           context.shadowBlur = 8;
           context.shadowColor = 'rgba(0,0,0,0.8)';
           
           context.save();
           context.rotate(-body.angle);
           
           context.fillText(icon, 0, 0);
           context.restore();
           context.shadowBlur = 0;
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
            strokeStyle: 'transparent',
            lineWidth: 0,
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
