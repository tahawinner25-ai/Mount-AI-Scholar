import React, { useEffect, useRef, useState } from 'react';

const FREQUENCIES = [196.00, 261.63, 293.66, 392.00, 440.00, 523.25, 587.33, 783.99]; 
const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

export default function IoCountdown({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engineRunning, setEngineRunning] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const rocketsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const fluidBlobsRef = useRef<any[]>([]);
  
  const initEngine = () => {
    if (engineRunning) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtxRef.current = new AudioContextClass();
    masterGainRef.current = audioCtxRef.current.createGain();
    masterGainRef.current.gain.value = 0.25;

    const delay = audioCtxRef.current.createDelay();
    delay.delayTime.value = 0.45;
    const feedback = audioCtxRef.current.createGain();
    feedback.gain.value = 0.4;
    
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGainRef.current);
    
    masterGainRef.current.connect(audioCtxRef.current.destination);
    masterGainRef.current.connect(delay);

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    setEngineRunning(true);
  };

  const playSynthChord = (colorIndex: number, yRatio: number) => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    
    const baseIndex = colorIndex * 2 + Math.floor(yRatio * 3);
    const freq1 = FREQUENCIES[baseIndex % FREQUENCIES.length];
    const freq2 = FREQUENCIES[(baseIndex + 2) % FREQUENCIES.length];

    [freq1, freq2].forEach(freq => {
        if (!audioCtxRef.current || !masterGainRef.current) return;
        const osc = audioCtxRef.current.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);

        const gain = audioCtxRef.current.createGain();
        gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioCtxRef.current.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(masterGainRef.current);
        
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 1.8);
    });
  };

  const scheduleNextExplosion = () => {
    rocketsRef.current.push(new Rocket());
    setTimeout(() => {
        if (canvasRef.current) {
            scheduleNextExplosion();
        }
    }, Math.random() * 1700 + 800);
  };

  class Rocket {
    x: number; y: number; targetY: number; speed: number; colorIndex: number; color: string; radius: number; dead: boolean;
    constructor() {
        this.x = window.innerWidth * 0.2 + Math.random() * (window.innerWidth * 0.6);
        this.y = window.innerHeight + 10;
        this.targetY = window.innerHeight * 0.1 + Math.random() * (window.innerHeight * 0.5);
        this.speed = Math.random() * 6 + 8;
        this.colorIndex = Math.floor(Math.random() * GOOGLE_COLORS.length);
        this.color = GOOGLE_COLORS[this.colorIndex];
        this.radius = 6;
        this.dead = false;
    }
    
    update() {
        this.y -= this.speed;
        particlesRef.current.push(new Particle(this.x, this.y, (Math.random()-0.5)*1.5, Math.random()*2, this.color, 4, 0.05));
        
        if (this.y <= this.targetY) {
            this.explode();
            this.dead = true;
        }
    }

    explode() {
        playSynthChord(this.colorIndex, this.targetY / window.innerHeight);

        const particleCount = Math.floor(Math.random() * 40 + 40);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = Math.random() * 12 + 2;
            const vx = Math.cos(angle) * spd;
            const vy = Math.sin(angle) * spd;
            const pRadius = Math.random() * 20 + 10; // larger for fluid effect
            particlesRef.current.push(new Particle(this.x, this.y, vx, vy, this.color, pRadius, 0.015));
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
  }

  class Particle {
    x: number; y: number; vx: number; vy: number; color: string; radius: number; life: number; decay: number; gravity: number;
    constructor(x: number, y: number, vx: number, vy: number, color: string, radius: number, decay: number) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.color = color;
        this.radius = radius;
        this.life = 1;
        this.decay = decay;
        this.gravity = 0.15; 
    }
    update() {
        this.vx *= 0.94; 
        this.vy *= 0.94;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.radius *= 0.96; 
    }
    draw(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life > 1 ? 1 : Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
  }

  class FluidBlob {
    originX: number; originY: number; x: number; y: number; radius: number; color: string; angle: number; speed: number; orbitRadius: number;
    constructor(x: number, y: number) {
        this.originX = x; this.originY = y; this.x = x; this.y = y;
        this.color = GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)];
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.005 + 0.001;
        this.orbitRadius = Math.random() * 300 + 100;
        this.radius = Math.random() * 300 + 150; 
    }
    
    update() {
        this.angle += this.speed;
        this.x = this.originX + Math.cos(this.angle) * this.orbitRadius;
        this.y = this.originY + Math.sin(this.angle) * this.orbitRadius;
    }
    
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      ctx.fillStyle = '#0b132b';
      ctx.fillRect(0, 0, width, height);
    };
    window.addEventListener('resize', resize);
    resize();

    // Create the ambient fluid blobs in the background
    for(let i=0; i<6; i++) {
        fluidBlobsRef.current.push(new FluidBlob(
            width/2 + (Math.random()-0.5)*width*0.3, 
            height/2 + (Math.random()-0.5)*height*0.3
        ));
    }

    scheduleNextExplosion();

    let animationFrameId: number;
    const render = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(11, 19, 43, 0.2)'; // Fluid trail fading
        ctx.fillRect(0, 0, width, height);

        // Draw background fluids in source-over so they don't blow out to white
        for (let i = fluidBlobsRef.current.length - 1; i >= 0; i--) {
            fluidBlobsRef.current[i].update();
            fluidBlobsRef.current[i].draw(ctx);
        }

        ctx.globalCompositeOperation = 'lighter'; // Rockets glow and mix nicely

        // Draw rockets
        for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
            rocketsRef.current[i].update();
            rocketsRef.current[i].draw(ctx);
            if (rocketsRef.current[i].dead) rocketsRef.current.splice(i, 1);
        }

        // Draw explosion particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            particlesRef.current[i].update();
            particlesRef.current[i].draw(ctx);
            // Delete if dead
            if (particlesRef.current[i].life <= 0 || particlesRef.current[i].radius < 0.5) {
                particlesRef.current.splice(i, 1);
            }
        }

        animationFrameId = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0b132b] overflow-hidden select-none z-50" onClick={initEngine}>
        <canvas 
            id="ioCanvas" 
            ref={canvasRef}
            className="block absolute top-0 left-0 w-full h-full z-[1] blur-[40px] scale-[1.2]"
        />
        
        {/* Le 1 au centre avec motion pour un leger mouvement de flottaison */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none mix-blend-overlay flex items-center justify-center">
            <span 
                className="text-white font-[900] leading-none drop-shadow-[0_10px_40px_rgba(0,0,0,0.4)] animate-float" 
                style={{ fontSize: '85vh', opacity: 0.9, fontFamily: '"Google Sans", sans-serif' }}
            >
                1
            </span>
        </div>



        <button 
            onClick={onBack}
            className="absolute top-8 left-8 z-20 text-white/50 hover:text-white border-b border-white/20 pb-1 font-mono text-xs tracking-widest uppercase transition-colors"
        >
            ← Retour Mount AI
        </button>
    </div>
  );
}
