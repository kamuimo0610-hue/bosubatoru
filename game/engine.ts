import { GameCallbacks, GameState } from "../types";
import { SfxType } from "./sound";

// Colors - Evil Minion Palette
const C_PLAYER = '#FFD700'; // Gold/Yellow Minion
const C_BOSS_MAIN = '#9D00FF'; // Brighter/More Vivid Purple (was #663399)
const C_BOSS_OVERALL = '#222222'; // Black/Dark Grey Overalls
const C_BOSS_ACCENT = '#DDDDDD'; // Goggle Silver (Brighter)
const C_MAGIC_ORB = '#FF00FF'; // Magenta Projectiles
const C_STAR_1 = '#00FFFF';
const C_STAR_2 = '#FF69B4';

const PLAYER_MAX_HP = 100;
const BOSS_MAX_HP = 600;

class BgItem {
  x: number = 0;
  y: number = 0;
  z: number = 0;
  speed: number = 0;
  size: number = 0;
  type: 'star' | 'cloud' | 'line' = 'star';
  color: string = '';
  width: number = 0;
  height: number = 0;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.init(true);
    this.x = Math.random() * w;
  }

  init(firstRun = false) {
    this.x = firstRun ? Math.random() * this.width : this.width + 100;
    this.y = Math.random() * this.height;
    this.z = Math.random() * 2 + 1;
    this.speed = (Math.random() * 2 + 1) * this.z; 
    
    const rand = Math.random();
    if (rand < 0.6) {
        this.type = 'star';
        this.size = (Math.random() * 2 + 1) * this.z;
        this.color = Math.random() > 0.8 ? '#00FFFF' : '#FFFFFF';
    } else if (rand < 0.9) {
        this.type = 'line';
        this.size = (Math.random() * 50 + 20) * this.z;
        this.color = 'rgba(255,255,255,0.2)';
    } else {
        this.type = 'cloud';
        this.size = (Math.random() * 100 + 50) * this.z;
        // Changed to blue-ish tint to match new background, instead of purple
        this.color = 'rgba(100, 200, 255, 0.15)'; 
    }
  }

  update(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.x -= this.speed;
    if (this.x < -200) this.init();
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    
    if (this.type === 'star') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'line') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + this.size, this.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class Bullet {
  x: number;
  y: number;
  v: number = 22;
  del: boolean = false;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.color = Math.random() > 0.5 ? '#FFFF00' : '#FFF';
  }

  update(width: number) {
    this.x += this.v;
    if (this.x > width + 50) this.del = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

type JunkType = 'slow' | 'normal' | 'fast' | 'wobbly' | 'falling';

class Junk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  s: number;
  del: boolean = false;
  r: number = 0;
  rotSpeed: number = 0;
  type: JunkType;
  color: string;
  initialY: number;

  constructor(x: number, y: number, type: JunkType) {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.type = type;
    this.s = Math.random() * 20 + 20;
    this.rotSpeed = (Math.random() - 0.5) * 0.2;
    
    const colors = [C_MAGIC_ORB, C_STAR_1, C_STAR_2, '#FFFFFF'];
    this.color = colors[Math.floor(Math.random() * colors.length)];

    if (type === 'falling') {
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = 5 + Math.random() * 5;
      this.g = 0;
      this.s += 10;
    } else {
      this.vy = (Math.random() - 0.5) * 2;
      this.g = 0;
      
      switch (type) {
        case 'slow':
          this.vx = -4 - Math.random() * 2; 
          this.s += 15;
          break;
        case 'normal':
          this.vx = -8 - Math.random() * 3; 
          break;
        case 'fast':
          this.vx = -12 - Math.random() * 4; 
          this.color = '#FF0055'; 
          break;
        case 'wobbly':
          this.vx = -6 - Math.random() * 2; 
          this.color = '#00FF00';
          break;
        default:
          this.vx = -9;
      }
    }
  }

  update(height: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.g;
    this.r += this.rotSpeed;

    if (this.type === 'wobbly') {
      this.y = this.initialY + Math.sin(this.x * 0.03) * 60;
    }

    if (this.x < -100 || this.y > height + 100) this.del = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.r);
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    
    if (this.type === 'normal' || this.type === 'falling') {
        this.drawStar(ctx, 0, 0, 5, this.s/2, this.s/4);
    } else if (this.type === 'fast') {
        ctx.beginPath();
        ctx.moveTo(this.s, 0);
        ctx.lineTo(-this.s/2, this.s/3);
        ctx.lineTo(-this.s/2, -this.s/3);
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(0, 0, this.s/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(0, 0, this.s/4, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
  }

  drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rot) * outerRadius;
          y = cy + Math.sin(rot) * outerRadius;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerRadius;
          y = cy + Math.sin(rot) * innerRadius;
          ctx.lineTo(x, y);
          rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  l: number; 
  c: string; 
  s: number; 
}

class Player {
  x: number = -100;
  y: number = 0;
  radius: number = 30;
  hp: number = PLAYER_MAX_HP;
  lastShot: number = 0;
  tilt: number = 0;

  constructor(height: number) {
    this.y = height / 2;
  }

  update(
    gameState: GameState, 
    mouse: {x: number, y: number}, 
    width: number, 
    height: number, 
    frame: number, 
    fireCallback: (x: number, y: number) => void
  ) {
    if (this.hp <= 0) return;

    if (gameState === 'cleared') {
      this.x += (width / 2 - this.x) * 0.1;
      this.y = height / 2 + Math.sin(frame * 0.2) * 50;
      this.tilt = Math.sin(frame * 0.1) * 0.2;
      return;
    }

    const tx = (gameState === 'playing') ? Math.min(mouse.x, width * 0.5) : 150;
    const ty = (gameState === 'playing') ? mouse.y : height / 2 + Math.sin(frame * 0.05) * 40;

    this.x += (tx - this.x) * 0.15;
    this.y += (ty - this.y) * 0.15;
    this.tilt = (ty - this.y) * 0.04;

    if (gameState === 'playing') {
      this.y = Math.max(30, Math.min(height - 30, this.y));
      if (Date.now() - this.lastShot > 130) {
        fireCallback(this.x + 35, this.y);
        this.lastShot = Date.now();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, gameState: GameState, mouse: {x: number, y: number}, frame: number) {
    if (this.hp <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    // Minion Body (Yellow Pill)
    ctx.fillStyle = C_PLAYER;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
    this.drawPill(ctx, -25, -35, 50, 70);
    ctx.shadowBlur = 0;

    // Overalls
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.arc(0, 10, 26, 0.2, Math.PI - 0.2);
    ctx.lineTo(-26, 5);
    ctx.lineTo(26, 5);
    ctx.fill();

    // Straps
    ctx.strokeStyle = '#1E90FF';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-20, 5); ctx.lineTo(-20, -15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, 5); ctx.lineTo(20, -15); ctx.stroke();

    // Victory Pose Arms
    if (gameState === 'cleared') {
        ctx.strokeStyle = C_PLAYER; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-25, 0); ctx.lineTo(-50, Math.sin(frame * 0.5) * 20 - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(50, Math.cos(frame * 0.5) * 20 - 20); ctx.stroke();
    }

    // Goggles Strap
    ctx.fillStyle = '#333';
    ctx.fillRect(-28, -20, 56, 10);

    // Goggle
    ctx.fillStyle = '#DDD'; ctx.beginPath(); ctx.arc(0, -15, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(0, -15, 13, 0, Math.PI * 2); ctx.fill();

    // Eye Pupil
    let lx = 0, ly = 0;
    if (gameState === 'playing') {
        lx = (mouse.x - this.x) * 0.06;
        ly = (mouse.y - this.y) * 0.06;
        const d = Math.hypot(lx, ly);
        if (d > 6) { lx = lx / d * 6; ly = ly / d * 6; }
    }
    ctx.fillStyle = '#654321'; ctx.beginPath(); ctx.arc(lx, -15 + ly, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(lx, -15 + ly, 2, 0, Math.PI * 2); ctx.fill();
    
    ctx.restore();
  }

  private drawPill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = w / 2;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + r, y + h - r, r, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }
}

type BossActionState = 'idle' | 'charge_up' | 'dashing' | 'recovering';

class Boss {
  x: number = 0;
  y: number = 0;
  hp: number = BOSS_MAX_HP;
  radius: number = 70;
  t: number = 0;
  atkTimer: number = 0;
  
  // Floating Hands (Long Arms for evil minion)
  leftHand = { x: 0, y: 0, ox: -70, oy: 60 };
  rightHand = { x: 0, y: 0, ox: 70, oy: 60 };

  baseY: number = 0;
  rotation: number = 0;
  
  actionState: BossActionState = 'idle';
  stateTimer: number = 0;
  dashTargetX: number = 0;
  dashTargetY: number = 0;

  constructor(width: number, height: number) {
    this.x = width + 200;
    this.y = height / 2;
    this.baseY = height / 2;
  }

  update(width: number, height: number, gameState: GameState, player: Player, spawnJunk: (x: number, y: number, type: JunkType) => void) {
    if (this.hp <= 0) {
      this.y += 5;
      this.x += 2;
      this.rotation += 0.1;
      return;
    }

    if (gameState === 'intro') {
      this.x += (width - 150 - this.x) * 0.05;
      this.updateHands();
      return;
    }

    this.t += 0.05;
    const rage = 1 - (this.hp / BOSS_MAX_HP);

    // --- State Machine ---
    
    if (this.actionState === 'idle') {
        this.x += (width - 200 - this.x) * 0.05;
        const fastWobble = Math.sin(this.t * 3) * 10;
        const slowWave = Math.sin(this.t * 0.5) * 150;
        const ty = this.baseY + slowWave + fastWobble;
        this.y += (ty - this.y) * 0.1;
        this.y = Math.max(80, Math.min(height - 80, this.y));
        this.rotation = Math.sin(this.t) * 0.05;

        if (gameState === 'playing' && rage > 0.5 && Math.random() < 0.003) {
            this.actionState = 'charge_up';
            this.stateTimer = 0;
        } 
        else if (gameState === 'playing') {
            this.atkTimer++;
            if (this.atkTimer > (50 - rage * 20) + Math.random() * 20) {
                const rand = Math.random();
                let type: JunkType = 'normal';
                if (rand < 0.3) type = 'slow';
                else if (rand < 0.7) type = 'normal';
                else if (rand < 0.85) type = 'fast';
                else type = 'wobbly';

                let burst = 1;
                if (rage > 0.4) burst = Math.random() > 0.7 ? 2 : 1; 
                if (rage > 0.75) burst = Math.random() > 0.6 ? 3 : 2;

                for (let i = 0; i < burst; i++) {
                    const spawnX = Math.random() > 0.5 ? this.leftHand.x : this.rightHand.x;
                    const spawnY = Math.random() > 0.5 ? this.leftHand.y : this.rightHand.y;
                    spawnJunk(spawnX, spawnY + (i * 20 - (burst-1)*10), type);
                }
                this.atkTimer = 0;
            }
        }
    } 
    else if (this.actionState === 'charge_up') {
        this.stateTimer++;
        this.rotation = Math.sin(this.stateTimer * 0.8) * 0.3;
        this.x += (Math.random() - 0.5) * 15;
        this.y += (Math.random() - 0.5) * 15;
        
        this.dashTargetX = -300; 
        this.dashTargetY = player.y;

        if (this.stateTimer > 90) {
            this.actionState = 'dashing';
            this.stateTimer = 0;
        }
    }
    else if (this.actionState === 'dashing') {
        this.x += (this.dashTargetX - this.x) * 0.1; 
        this.y += (this.dashTargetY - this.y) * 0.1;
        this.rotation += 0.8; 

        if (this.x < 0) {
             this.actionState = 'recovering';
             this.stateTimer = 0;
        }
    }
    else if (this.actionState === 'recovering') {
        this.stateTimer++;
        const targetX = width - 200;
        const targetY = height / 2;
        
        this.x += (targetX - this.x) * 0.03;
        this.y += (targetY - this.y) * 0.03;
        this.rotation *= 0.9;

        if (Math.abs(this.x - targetX) < 50) {
            this.actionState = 'idle';
            this.baseY = Math.random() * (height - 200) + 100;
        }
    }

    this.updateHands();
  }

  private updateHands() {
      const float = Math.sin(this.t * 2) * 10;
      
      if (this.actionState === 'dashing') {
          this.leftHand.x += (this.x + 50 - this.leftHand.x) * 0.2;
          this.rightHand.x += (this.x + 50 - this.rightHand.x) * 0.2;
          this.leftHand.y += (this.y - this.leftHand.y) * 0.2;
          this.rightHand.y += (this.y - this.rightHand.y) * 0.2;
      } else {
          this.leftHand.x += (this.x + this.leftHand.ox - this.leftHand.x) * 0.1;
          this.leftHand.y += (this.y + this.leftHand.oy + float - this.leftHand.y) * 0.1;
          
          this.rightHand.x += (this.x + this.rightHand.ox - this.rightHand.x) * 0.1;
          this.rightHand.y += (this.y + this.rightHand.oy + float - this.rightHand.y) * 0.1;
      }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Aura/Glow
    ctx.shadowBlur = 40;
    ctx.shadowColor = C_BOSS_MAIN;

    // Draw Dash Trail
    if (this.actionState === 'dashing') {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * -2);
        ctx.fillStyle = 'rgba(100,0,200,0.5)';
        ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    
    // Draw Body + Hands
    ctx.translate(this.x, this.y);
    if (this.rotation) ctx.rotate(this.rotation);

    if (this.actionState === 'dashing') {
        ctx.scale(1.2, 0.8);
    } else if (this.actionState === 'charge_up') {
        const s = 1 + Math.sin(this.stateTimer * 0.5) * 0.1;
        ctx.scale(s, s);
    } else {
        ctx.scale(1 + Math.cos(this.t * 4) * 0.05, 1 - Math.cos(this.t * 4) * 0.05);
    }

    // -- EVIL MINION DRAWING --
    
    // White Outline for visibility against dark backgrounds
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    
    // Body Outline
    this.drawPillOutline(ctx, -70, -90, 140, 180);
    
    // Arms Outline (Rough approximation for visibility)
    ctx.beginPath(); 
    ctx.moveTo(-65, 0); ctx.quadraticCurveTo(-90, 20, this.leftHand.x - this.x, this.leftHand.y - this.y); 
    ctx.moveTo(65, 0); ctx.quadraticCurveTo(90, 20, this.rightHand.x - this.x, this.rightHand.y - this.y); 
    ctx.stroke();

    // 1. Purple Body (Pill Shape)
    ctx.fillStyle = C_BOSS_MAIN;
    this.drawPill(ctx, -70, -90, 140, 180);
    ctx.shadowBlur = 0;

    // 2. Black Overalls
    ctx.fillStyle = C_BOSS_OVERALL;
    ctx.beginPath();
    ctx.arc(0, 40, 72, 0.2, Math.PI - 0.2); // Bottom curve matching body
    ctx.lineTo(-72, 20);
    ctx.lineTo(72, 20);
    ctx.fill();
    // Straps
    ctx.strokeStyle = C_BOSS_OVERALL;
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(-50, 20); ctx.lineTo(-40, -30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(50, 20); ctx.lineTo(40, -30); ctx.stroke();

    // 3. Crazy Hair
    ctx.strokeStyle = C_BOSS_MAIN;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 15; i++) {
        const angle = (Math.PI / 15) * i - Math.PI/2 - 0.5;
        const len = 40 + Math.random() * 30;
        const sx = Math.cos(angle) * 60;
        const sy = Math.sin(angle) * 60 - 50;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(angle + (Math.random()-0.5)) * len, sy - len);
    }
    ctx.stroke();

    // 4. Arms (Long & Lanky) - draw relative to body center
    ctx.strokeStyle = C_BOSS_MAIN;
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    // Left Arm
    ctx.beginPath(); 
    ctx.moveTo(-65, 0); 
    ctx.quadraticCurveTo(-90, 20, this.leftHand.x - this.x, this.leftHand.y - this.y); 
    ctx.stroke();
    // Right Arm
    ctx.beginPath(); 
    ctx.moveTo(65, 0); 
    ctx.quadraticCurveTo(90, 20, this.rightHand.x - this.x, this.rightHand.y - this.y); 
    ctx.stroke();

    // Hands (Gloves)
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(this.leftHand.x - this.x, this.leftHand.y - this.y, 20, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.rightHand.x - this.x, this.rightHand.y - this.y, 20, 0, Math.PI*2); ctx.fill();

    // 5. Face
    // Big Eye (Cyclops or two eyes? Let's do one big crazy eye)
    ctx.fillStyle = '#444'; // Strap
    ctx.fillRect(-75, -45, 150, 15);
    
    // Goggle Frame
    ctx.fillStyle = C_BOSS_ACCENT;
    ctx.beginPath(); ctx.arc(0, -35, 40, 0, Math.PI * 2); ctx.fill();
    // White
    ctx.fillStyle = '#FFF';
    ctx.beginPath(); ctx.arc(0, -35, 30, 0, Math.PI * 2); ctx.fill();
    // Pupil (Small and crazy)
    const rage = 1 - (this.hp / BOSS_MAX_HP);
    const pupilSize = 5 + rage * 5;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(Math.sin(this.t*5)*3, -35 + Math.cos(this.t*3)*3, pupilSize, 0, Math.PI * 2); ctx.fill();
    
    // Eyelid (Lower half heavy)
    ctx.fillStyle = C_BOSS_MAIN; // Purple
    ctx.beginPath();
    ctx.moveTo(-40, -35);
    ctx.quadraticCurveTo(0, -20 + rage*10, 40, -35);
    ctx.quadraticCurveTo(0, -60, -40, -35);
    ctx.fill();

    // Mouth (Underbite)
    ctx.fillStyle = '#400040'; // Dark mouth
    ctx.beginPath();
    ctx.ellipse(0, 25, 30, 15 + Math.sin(this.t * 10)*5, 0, 0, Math.PI*2);
    ctx.fill();
    
    // Teeth
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    // Bottom teeth sticking up
    ctx.moveTo(-20, 30);
    ctx.lineTo(-10, 15);
    ctx.lineTo(0, 30);
    ctx.lineTo(10, 15);
    ctx.lineTo(20, 30);
    ctx.fill();

    ctx.restore();
  }
  
  private drawPill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = w / 2;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + r, y + h - r, r, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
  }

  private drawPillOutline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const r = w / 2;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + r, y + h - r, r, 0, Math.PI);
    ctx.closePath();
    ctx.stroke();
  }

  private drawAngryEye(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
      // Not used in new design but kept for compatibility if needed
  }
  private drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
      // Not used in new design
  }
}

interface GameCallbacksExtended extends GameCallbacks {
  playSfx?: (type: SfxType) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacksExtended;
  
  private width: number = 0;
  private height: number = 0;
  private frame: number = 0;
  private shake: number = 0;
  private animationId: number = 0;
  private gameState: GameState = 'intro';
  
  private player: Player;
  private boss: Boss;
  private bgItems: BgItem[] = [];
  private bullets: Bullet[] = [];
  private enemyBullets: Junk[] = [];
  private particles: Particle[] = [];
  
  private mouse = { x: 0, y: 0 };
  
  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacksExtended) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    
    this.resize();
    
    this.player = new Player(this.height);
    this.boss = new Boss(this.width, this.height);
    
    this.setupListeners();
  }

  public init() {
    this.bgItems = Array.from({ length: 60 }, () => new BgItem(this.width, this.height));
    this.loop();
  }
  
  public startGame() {
    this.setGameState('playing');
    this.player = new Player(this.height);
    this.boss = new Boss(this.width, this.height);
    this.bullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.shake = 0;
    this.callbacks.onHpUpdate(100, 100);
  }

  public destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resize);
  }

  private setGameState(state: GameState) {
    this.gameState = state;
    this.callbacks.onStateChange(state);
  }

  private setupListeners() {
    const onResize = () => this.resize();
    window.addEventListener('resize', onResize);

    const onMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      } else {
        this.mouse.x = (e as MouseEvent).clientX;
        this.mouse.y = (e as MouseEvent).clientY;
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
  }

  private resize = () => {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  private spawnParticles(x: number, y: number, c: string, n: number, sizeBase: number = 8) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        l: 1,
        c,
        s: Math.random() * sizeBase + 2
      });
    }
  }

  private loop = () => {
    this.frame++;
    if (this.shake > 0) this.shake *= 0.9;
    if (this.shake < 0.5) this.shake = 0;

    // Updates
    this.bgItems.forEach(b => b.update(this.width, this.height));
    
    this.player.update(
      this.gameState, 
      this.mouse, 
      this.width, 
      this.height, 
      this.frame,
      (x, y) => {
          this.bullets.push(new Bullet(x, y));
          this.callbacks.playSfx?.('shoot');
      }
    );

    this.boss.update(
      this.width, 
      this.height, 
      this.gameState,
      this.player,
      (x, y, type) => this.enemyBullets.push(new Junk(x, y, type))
    );

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5;
      p.l -= 0.1; 
      if (p.l <= 0) this.particles.splice(i, 1);
    }

    if (this.gameState === 'playing') {
       // Phase 2 (Falling Junk)
       if (this.boss.hp < BOSS_MAX_HP * 0.5) {
         // Tiny bit reduction: 45 -> 55 (every 55 frames)
         if (this.frame % 55 === 0) { 
           this.enemyBullets.push(new Junk(Math.random() * this.width, -50, 'falling'));
         }
       }

       // --- Collisions ---

       // 1. Boss Body vs Player (Ramming damage)
       if (this.boss.hp > 0 && this.player.hp > 0) {
           const dist = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
           if (dist < 80) {
               this.player.hp -= 2; 
               this.shake += 5;
               this.spawnParticles((this.player.x + this.boss.x)/2, (this.player.y + this.boss.y)/2, '#FF0000', 5);
               if (this.frame % 10 === 0) this.callbacks.playSfx?.('damage');
               if (this.player.hp <= 0) this.loseGame();
               this.callbacks.onHpUpdate((this.player.hp / PLAYER_MAX_HP) * 100, (this.boss.hp / BOSS_MAX_HP) * 100);
           }
       }

       // 2. Bullets vs Boss
       this.bullets.forEach((b, i) => {
         b.update(this.width);
         if (Math.hypot(b.x - this.boss.x, b.y - this.boss.y) < this.boss.radius + 10 && this.boss.hp > 0) {
           this.boss.hp -= 4;
           this.bullets.splice(i, 1);
           // Use smaller white sparks for hit effect (sizeBase 3)
           this.spawnParticles(b.x, b.y, '#FFFFFF', 8, 3);
           this.callbacks.playSfx?.('hit');
           this.shake += 2;
           if (this.boss.hp <= 0) this.winGame();
           this.callbacks.onHpUpdate((this.player.hp / PLAYER_MAX_HP) * 100, (this.boss.hp / BOSS_MAX_HP) * 100);
         } else if (b.del) {
           this.bullets.splice(i, 1);
         }
       });

       // 3. Junk vs Player
       this.enemyBullets.forEach((j, i) => {
         j.update(this.height);
         if (Math.hypot(j.x - this.player.x, j.y - this.player.y) < this.player.radius + j.s / 2 && this.player.hp > 0) {
           this.player.hp -= 10;
           this.enemyBullets.splice(i, 1);
           this.spawnParticles(this.player.x, this.player.y, C_STAR_2, 15);
           this.callbacks.playSfx?.('damage');
           this.shake += 15;
           if (this.player.hp <= 0) this.loseGame();
           this.callbacks.onHpUpdate((this.player.hp / PLAYER_MAX_HP) * 100, (this.boss.hp / BOSS_MAX_HP) * 100);
         } else if (j.del) {
           this.enemyBullets.splice(i, 1);
         }
       });
    } else {
      this.bullets = [];
      this.enemyBullets = [];
    }

    // Draw
    const ctx = this.ctx;
    ctx.save();
    
    // Shake effect
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }

    // Background
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw Space Elements
    ctx.globalCompositeOperation = 'screen';
    this.bgItems.forEach(b => b.draw(ctx));
    ctx.globalCompositeOperation = 'source-over';
    
    // Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.l;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    this.player.draw(ctx, this.gameState, this.mouse, this.frame);
    this.boss.draw(ctx);
    this.bullets.forEach(b => b.draw(ctx));
    this.enemyBullets.forEach(j => j.draw(ctx));

    if (this.gameState === 'cleared' && this.frame % 3 === 0) {
      this.spawnParticles(Math.random() * this.width, -10, '#FFFF00', 1);
    }

    ctx.restore();
    this.animationId = requestAnimationFrame(this.loop);
  }

  private winGame() {
    this.setGameState('cleared');
    this.shake = 40;
    this.callbacks.onHpUpdate(100, 0);
    this.callbacks.playSfx?.('explosion');
  }

  private loseGame() {
    this.setGameState('gameover');
    this.shake = 20;
    this.callbacks.onHpUpdate(0, (this.boss.hp / BOSS_MAX_HP) * 100);
  }
}