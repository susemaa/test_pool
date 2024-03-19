'use client';

import React, { useRef, useEffect, useState } from 'react';
import useBall from '@/hooks/useBall';
import { Position } from '@/types';

type BallType = ReturnType<typeof useBall>;

const getWH = (): [number, number] => (window.innerWidth > window.innerHeight
  ? [window.innerWidth * 0.85, window.innerHeight * 0.85]
  : [window.innerHeight, window.innerWidth]);

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingBall, setDraggingBall] = useState<BallType | null>(null);
  const [width, height] = getWH();
  const offset = 20;

  const ball1 = useBall({
    initialPosition: { x: width / 4, y: height / 2 },
    radius: 10,
    color: 'white',
    ref: canvasRef,
    offset,
  });
  const ball2 = useBall({
    initialPosition: { x: width * 3 / 4, y: height / 2 },
    radius: 10,
    color: 'black',
    ref: canvasRef,
    offset,
  });
  const balls = [ball1, ball2];

  const drawField = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const [width, height] = getWH();
    const transform = window.innerWidth > window.innerHeight ? '' : 'rotate(-90deg)';
    canvas.width = width;
    canvas.height = height;
    canvas.style.transform = transform;

    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'green';
    ctx.fillRect(offset, offset, width - offset * 2, height - offset * 2);
  };

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>): Position => {
    const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
    
    return { x: mouseX, y: mouseY}
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingBall) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    draggingBall.setDragPosition({ x, y });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePosition = getMousePosition(e);

    balls.forEach((ball) => {
      const distance = ball.getDistance(mousePosition);
      if (distance <= ball.radius) {
        ball.setIsDragging(true);
        setDraggingBall(ball);
      }
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePosition = getMousePosition(e);

    if (draggingBall) {
      draggingBall.setIsDragging(false);
      if (draggingBall.getDistance(mousePosition) <= draggingBall.radius) {
        alert('show');
      }
      setDraggingBall(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawField(ctx, canvas);

      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          if (balls[i].checkCollision(balls[j])) {
            balls[i].resolveCollision(balls[j]);
          }
        }
      }

      balls.forEach((ball) => ball.drawBall());
    };

    render();

    const animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [balls]);

  return (
    <div className="center-items">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseUp}
      />
    </div>
  );
}
