'use client';

import { useState, useEffect } from 'react';
import type { Position } from '@/types';

interface BallProps {
  initialPosition: Position;
  radius: number;
  color: string;
  ref: React.RefObject<HTMLCanvasElement>;
  offset: number;
}

const calculateFriction = (radius: number) => {
  const baseRadius = 10;
  const baseFriction = 0.98;
  return baseFriction * (baseRadius / radius);
};

export default function useBall(props: BallProps) {
  const {
    initialPosition, radius, color, offset, ref
  } = props;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [dragPosition, setDragPosition] = useState<Position | null>(null);
  const [velocity, setVelocity] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const friction = calculateFriction(radius);

  const drawBall = () => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawCue(ctx);
  };

  const drawCue = (ctx: CanvasRenderingContext2D) => {
    if (!dragPosition || !isDragging) return;

    const dx = position.x - dragPosition.x;
    const dy = position.y - dragPosition.y;

    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    const unitVectorX = dx / distance;
    const unitVectorY = dy / distance;

    const cueEndX = position.x - unitVectorX * radius;
    const cueEndY = position.y - unitVectorY * radius;

    ctx.beginPath();
    ctx.moveTo(dragPosition.x, dragPosition.y);
    ctx.lineTo(cueEndX, cueEndY);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (!isDragging && dragPosition) {
      const dx = dragPosition.x - position.x;
      const dy = dragPosition.y - position.y;
      setVelocity({ x: -dx * 0.1, y: -dy * 0.1 });
      setDragPosition(null);
    }
  }, [isDragging]);

  useEffect(() => {
    const handle = setInterval(() => {
      setVelocity((currVelocity) => {
        const newVelocity = {
          x: Math.abs(currVelocity.x) < 0.01 ? 0 : currVelocity.x * friction,
          y: Math.abs(currVelocity.y) < 0.01 ? 0 : currVelocity.y * friction,
        };

        setPosition((currPosition) => ({
          x: currPosition.x + newVelocity.x,
          y: currPosition.y + newVelocity.y,
        }));

        if (newVelocity.x === 0 && newVelocity.y === 0)
          clearInterval(handle);

        return newVelocity;
      });
    }, 10);

    return () => clearInterval(handle);
  }, [velocity.x, velocity.y]);

  useEffect(() => {
    if (!velocity.x && !velocity.y) return ;
    const canvas = ref.current;
    if (!canvas) return ;

    if (position.x - radius - offset < 0) {
      setPosition({x: radius + offset, y: position.y});
      setVelocity({ x: -velocity.x, y: velocity.y });
    }
    if (position.x + radius + offset > canvas.width) {
      setPosition({x: canvas.width - radius - offset, y: position.y});
      setVelocity({ x: -velocity.x, y: velocity.y });
    }

    if (position.y - radius - offset < 0) {
      setPosition({x: position.x, y: radius + offset});
      setVelocity({ x: velocity.x, y: -velocity.y });
    }
    if (position.y + radius + offset > canvas.height) {
      setPosition({x: position.x, y: canvas.height - radius - offset});
      setVelocity({ x: velocity.x, y: -velocity.y });
    }

  }, [position]);

  return {
    drawBall,
    drawCue,
    position,
    setDragPosition,
    setIsDragging,
    isDragging,
    velocity,
    setVelocity,
    ...props,
  };
}
