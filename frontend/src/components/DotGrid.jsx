import { useRef, useEffect, useCallback, useMemo } from 'react';
import gsap from 'gsap';

const throttle = (func, limit) => {
    let lastCall = 0;
    return function (...args) {
        const now = performance.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            func.apply(this, args);
        }
    };
};

function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 255, g: 255, b: 255 };
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}

const DotGrid = ({
    dotSize = 3,
    gap = 35,
    baseColor = '#334155',
    activeColor = '#60a5fa',
    proximity = 180,
    speedTrigger = 100,
    shockRadius = 250,
    shockStrength = 5,
    maxSpeed = 5000,
    returnDuration = 1.2,
    className = '',
    style
}) => {
    const canvasRef = useRef(null);
    const dotsRef = useRef([]);
    const pointerRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 });

    const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
    const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

    const initGrid = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);

        const cell = dotSize + gap;
        const cols = Math.ceil(width / cell) + 1;
        const rows = Math.ceil(height / cell) + 1;

        const startX = (width - (cell * (cols - 1) - gap)) / 2;
        const startY = (height - (cell * (rows - 1) - gap)) / 2;

        const dots = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                dots.push({
                    cx: startX + x * cell,
                    cy: startY + y * cell,
                    xOffset: 0,
                    yOffset: 0,
                    active: false
                });
            }
        }
        dotsRef.current = dots;
    }, [dotSize, gap]);

    useEffect(() => {
        let rafId;
        const drawingCanvas = canvasRef.current;
        if (!drawingCanvas) return;
        const ctx = drawingCanvas.getContext('2d');
        const proxSq = proximity * proximity;

        const draw = () => {
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            const { x: px, y: py } = pointerRef.current;

            for (const dot of dotsRef.current) {
                const ox = dot.cx + dot.xOffset;
                const oy = dot.cy + dot.yOffset;
                const dx = dot.cx - px;
                const dy = dot.cy - py;
                const dsq = dx * dx + dy * dy;

                if (dsq <= proxSq) {
                    const dist = Math.sqrt(dsq);
                    const t = 1 - dist / proximity;
                    const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
                    const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
                    const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.4 + 0.6 * t})`;
                } else {
                    ctx.fillStyle = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, 0.25)`;
                }

                ctx.beginPath();
                ctx.arc(ox, oy, dotSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            rafId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(rafId);
    }, [proximity, baseRgb, activeRgb, dotSize]);

    useEffect(() => {
        initGrid();
        window.addEventListener('resize', initGrid);
        return () => window.removeEventListener('resize', initGrid);
    }, [initGrid]);

    useEffect(() => {
        const onMove = e => {
            const now = performance.now();
            const pr = pointerRef.current;
            const dt = pr.lastTime ? now - pr.lastTime : 16;
            const dx = e.clientX - pr.lastX;
            const dy = e.clientY - pr.lastY;
            let vx = (dx / (dt || 1)) * 1000;
            let vy = (dy / (dt || 1)) * 1000;
            let speed = Math.hypot(vx, vy);

            if (speed > maxSpeed) {
                const scale = maxSpeed / speed;
                vx *= scale;
                vy *= scale;
                speed = maxSpeed;
            }

            pr.lastTime = now;
            pr.lastX = e.clientX;
            pr.lastY = e.clientY;
            pr.x = e.clientX;
            pr.y = e.clientY;

            const proxSq = proximity * proximity;
            for (const dot of dotsRef.current) {
                const dsq = (dot.cx - pr.x) ** 2 + (dot.cy - pr.y) ** 2;
                if (speed > speedTrigger && dsq < proxSq && !dot.active) {
                    dot.active = true;
                    gsap.killTweensOf(dot);
                    gsap.to(dot, {
                        xOffset: (dot.cx - pr.x) * 0.4 + vx * 0.015,
                        yOffset: (dot.cy - pr.y) * 0.4 + vy * 0.015,
                        duration: 0.2,
                        onComplete: () => {
                            gsap.to(dot, {
                                xOffset: 0,
                                yOffset: 0,
                                duration: returnDuration,
                                ease: 'elastic.out(1, 0.75)',
                                onComplete: () => { dot.active = false; }
                            });
                        }
                    });
                }
            }
        };

        const throttledMove = throttle(onMove, 16);
        window.addEventListener('mousemove', throttledMove);
        return () => window.removeEventListener('mousemove', throttledMove);
    }, [maxSpeed, speedTrigger, proximity, returnDuration]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 pointer-events-none ${className}`}
            style={{ ...style, zIndex: -1 }}
        />
    );
};

export default DotGrid;
