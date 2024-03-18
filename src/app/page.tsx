'use client';

import React, { useRef, useEffect, useState } from 'react';
import useBall from '@/hooks/useBall';

type BallType = ReturnType<typeof useBall>;

function checkCollision(ball1: BallType, ball2: BallType) {
  const dx = ball1.position.x - ball2.position.x;
  const dy = ball1.position.y - ball2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (ball1.radius + ball2.radius);
}

function resolveCollision(ball1: BallType, ball2: BallType) {
  const dx = ball2.position.x - ball1.position.x;
  const dy = ball2.position.y - ball1.position.y;

  // Расстояние между шарами
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Нормализация вектора столкновения
  const nx = (dx / distance);
  const ny = (dy / distance);

  // Разница скоростей
  const dvx = ball1.velocity.x - ball2.velocity.x;
  const dvy = ball1.velocity.y - ball2.velocity.y;

  // Скалярное произведение разности скоростей на нормализованный вектор столкновения
  // (это позволяет нам определить, движутся ли шары навстречу друг другу)
  const dot = dvx * nx + dvy * ny;

  // Не обрабатываем случаи, когда шары движутся в одном направлении
  if (dot > 0) {
    return;
  }

  // Коэффициент восстановления (упругость столкновения)
  const restitution = 1; // Полностью упругое столкновение

  // Вычисление скорости столкновения
  const impulse = (2 * dot) / (ball1.radius ** 2 + ball2.radius ** 2);

  // Изменение скоростей после столкновения
  ball1.setVelocity({
    x: ball1.velocity.x - impulse * ball2.radius ** 2 * nx * restitution,
    y: ball1.velocity.y - impulse * ball2.radius ** 2 * ny * restitution,
  });

  ball2.setVelocity({
    x: ball2.velocity.x + impulse * ball1.radius ** 2 * nx * restitution,
    y: ball2.velocity.y + impulse * ball1.radius ** 2 * ny * restitution,
  });
}




const getWH = () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  ? [window.innerWidth * 0.85, window.innerHeight * 0.85]
  : [window.innerHeight, window.innerWidth];

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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingBall) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    draggingBall.setDragPosition({ x, y });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    balls.forEach((ball) => {
      const distance = Math.sqrt(
        (mouseX - ball.position.x) ** 2 + (mouseY - ball.position.y) ** 2
      );
      if (distance <= ball.radius) {
        ball.setIsDragging(true);
        setDraggingBall(ball);
      }
    });
  };

  const handleMouseUp = () => {
    if (draggingBall) {
      draggingBall.setIsDragging(false);
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
          if (checkCollision(balls[i], balls[j])) {
            resolveCollision(balls[i], balls[j]);
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
