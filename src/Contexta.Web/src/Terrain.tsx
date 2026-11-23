import { useEffect, useRef } from 'react';

// Project a sampled height field onto an isometric grid. Back-to-front strips
// hide the far slopes and keep the illustration sharp at different sizes.
export function Terrain() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const size = 44;
    const height = (x: number, y: number) =>
      115 * Math.exp(-((x - .58) ** 2 / .035 + (y - .50) ** 2 / .085)) +
      65 * Math.exp(-((x - .27) ** 2 / .03 + (y - .66) ** 2 / .03)) +
      52 * Math.exp(-((x - .83) ** 2 / .03 + (y - .30) ** 2 / .04));
    function project(x: number, y: number) {
      return [237 + (x - y) * 213, 75 + (x + y) * 95 - height(x, y)] as const;
    }
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 480, 300);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / size, step = 1 / size;
        const level = Math.min(1, height(u, v) / 110);
        ctx.beginPath();
        ctx.moveTo(...project(u, v));
        ctx.lineTo(...project(u + step, v));
        ctx.lineTo(...project(u + step, v + step));
        ctx.lineTo(...project(u, v + step));
        ctx.closePath();
        ctx.fillStyle = `rgb(${14 + level * 29} ${56 + level * 48} ${46 + level * 22})`;
        ctx.fill();
        ctx.lineWidth = .52;
        ctx.strokeStyle = `rgba(173, 238, 160, ${.28 + level * .62})`;
        ctx.stroke();
      }
    }
    for (const [x, y] of [[.58, .49], [.26, .66], [.83, .30]]) {
      const [px, py] = project(x, y);
      ctx.strokeStyle = '#c5f69d';
      ctx.lineWidth = .7;
      ctx.beginPath(); ctx.arc(px, py, 5.5, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillStyle = '#dbffad';
      ctx.beginPath(); ctx.arc(px, py, 2, 0, 2 * Math.PI); ctx.fill();
    }
  }, []);
  return <canvas ref={canvas} className="terrain" width="960" height="600" aria-hidden="true" />;
}
