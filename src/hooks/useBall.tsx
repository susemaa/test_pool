'use client';

import {
  useState, useEffect, Dispatch, SetStateAction,
} from 'react';
import type { Position } from '@/types';

interface BallProps {
  initialPosition: Position;
  radius: number;
  color: string;
  ref: React.RefObject<HTMLCanvasElement>;
  offset: number;
}

interface Ball extends BallProps{
  drawBall: () => void,
  getDistance: (_pointTo: Position) => number,
  checkCollision: (_ball: Ball) => boolean,
  resolveCollision: (_ball: Ball) => void,
  position: Position,
  setPosition: Dispatch<SetStateAction<Position>>,
  setDragPosition: Dispatch<SetStateAction<Position | null>>,
  setIsDragging: Dispatch<SetStateAction<boolean>>,
  isDragging: boolean,
  velocity: Position,
  setVelocity: Dispatch<SetStateAction<Position>>,
}

function calculateFriction(radius: number): number {
  const frictionLossPercent = (0.02 * radius) / 10;
  return 1 - frictionLossPercent;
}

export default function useBall(props: BallProps): Ball {
  const {
    initialPosition, radius, color, offset, ref,
  } = props;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [dragPosition, setDragPosition] = useState<Position | null>(null);
  const [velocity, setVelocity] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const friction = calculateFriction(radius);

  const getNormalized = (pointTo: Position, reversed: boolean = false): [number, number] => {
    const dx = position.x - pointTo.x;
    const dy = position.y - pointTo.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    const nx = dx / distance;
    const ny = dy / distance;
    return !reversed ? [nx, ny] : [-nx, -ny];
  };

  const getDistance = (pointTo: Position): number => {
    const dx = position.x - pointTo.x;
    const dy = position.y - pointTo.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    return distance;
  };

  // const checkCollision = (ball: Ball): boolean => getDistance(ball.position) < (radius + ball.radius);

  const checkCollision = (ball: Ball): boolean => {
    const steps = 10;
    const stepVelocity = {
      x: velocity.x / steps,
      y: velocity.y / steps,
    };
    const ballStepVelocity = {
      x: ball.velocity.x / steps,
      y: ball.velocity.y / steps,
    };

    for (let i = 0; i < steps; i += 1) {
      const nPosition = {
        x: position.x + stepVelocity.x * i,
        y: position.y + stepVelocity.y * i,
      };
      const ballNPosition = {
        x: ball.position.x + ballStepVelocity.x * i,
        y: ball.position.y + ballStepVelocity.y * i,
      };

      const dx = nPosition.x - ballNPosition.x;
      const dy = nPosition.y - ballNPosition.y;
      const nDistance = Math.sqrt(dx * dx + dy * dy);

      if (nDistance < radius + ball.radius) {
        return true;
      }
    }

    return false; // Столкновение не обнаружено
  };

  // const resolveOverlap = (ball: Ball): void => {
  //   const distance = getDistance(ball.position);
  //   const overlap = (radius + ball.radius) - distance;
  //   if (overlap < 0) return;

  //   const correctionDistance = Math.abs(overlap) > 0.01 ? overlap / 2 : 1;
  //   const angle = Math.atan2(ball.position.y - position.y, ball.position.x - position.x);

  //   const nx1 = position.x - correctionDistance * Math.cos(angle);
  //   const ny1 = position.y - correctionDistance * Math.sin(angle);
  //   const nx2 = ball.position.x - correctionDistance * Math.cos(angle);
  //   const ny2 = ball.position.y - correctionDistance * Math.sin(angle);

  //   setPosition({ x: nx1, y: ny1 });
  //   ball.setPosition({ x: nx2, y: ny2 });
  // };

  const resolveCollision = (ball: Ball): void => {
    const [nx, ny] = getNormalized(ball.position, true);

    const dvx = velocity.x - ball.velocity.x;
    const dvy = velocity.y - ball.velocity.y;

    const velocityAlongNormal = dvx * nx + dvy * ny;
    const m1 = (4 / 3) * Math.PI * radius ** 3;
    const m2 = (4 / 3) * Math.PI * ball.radius ** 3;

    const impulse = (2 * velocityAlongNormal) / (m1 + m2);
    const newVx1 = velocity.x - impulse * m2 * nx;
    const newVy1 = velocity.y - impulse * m2 * ny;
    const newVx2 = ball.velocity.x + impulse * m1 * nx;
    const newVy2 = ball.velocity.y + impulse * m1 * ny;

    console.log(newVx1, newVy1);
    console.log(newVx2, newVy2);

    // vAN < 0 === balls increasing distance between them
    if (velocityAlongNormal < 0) {
      // resolveOverlap(ball);
      return;
    }

    console.log('confirm');

    const energyTransition = 0.99;
    setVelocity({ x: newVx1 * energyTransition, y: newVy1 * energyTransition });
    ball.setVelocity({ x: newVx2 * energyTransition, y: newVy2 * energyTransition });
    // resolveOverlap(ball);
  };

  const drawCue = (ctx: CanvasRenderingContext2D) => {
    if (!dragPosition || !isDragging || getDistance(dragPosition) < radius) return;

    const dx = position.x - dragPosition.x;
    const dy = position.y - dragPosition.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    const nx = dx / distance;
    const ny = dy / distance;

    const cueEndX = position.x - nx * radius;
    const cueEndY = position.y - ny * radius;

    ctx.beginPath();

    const angle = Math.atan2(cueEndY - dragPosition.y, cueEndX - dragPosition.x);
    const headLength = 10;

    const bStartX = dragPosition.x - headLength * Math.cos(angle - Math.PI / 6);
    const bStartY = dragPosition.y - headLength * Math.sin(angle - Math.PI / 6);
    const bEndX = dragPosition.x - headLength * Math.cos(angle + Math.PI / 6);
    const bEndY = dragPosition.y - headLength * Math.sin(angle + Math.PI / 6);
    const sStartX = cueEndX - (headLength / 2) * Math.cos(angle - Math.PI / 6);
    const sStartY = cueEndY - (headLength / 2) * Math.sin(angle - Math.PI / 6);
    const sEndX = cueEndX - (headLength / 2) * Math.cos(angle + Math.PI / 6);
    const sEndY = cueEndY - (headLength / 2) * Math.sin(angle + Math.PI / 6);

    ctx.moveTo(bStartX, bStartY);
    ctx.lineTo(sStartX, sStartY);
    ctx.arc(
      (sStartX + sEndX) / 2,
      (sStartY + sEndY) / 2,
      headLength / 4,
      angle + Math.PI / 2,
      angle - Math.PI / 2,
      true,
    );
    ctx.lineTo(bEndX, bEndY);
    ctx.arc(
      (bStartX + bEndX) / 2,
      (bStartY + bEndY) / 2,
      headLength / 2,
      angle + Math.PI / 2,
      angle - Math.PI / 2,
    );
    ctx.closePath();

    ctx.fillStyle = 'brown';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

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

  useEffect(() => {
    if (!isDragging && dragPosition) {
      const distance = getDistance(dragPosition);
      if (distance > radius) {
        const [nx, ny] = getNormalized(dragPosition);
        const magnitude = 0.1;
        const vx = nx * distance * magnitude;
        const vy = ny * distance * magnitude;
        setVelocity({ x: vx, y: vy });
        console.log({ x: vx, y: vy }, radius);
      }
      setDragPosition(null);
    }
  }, [isDragging]);

  // handles slowing
  useEffect(() => {
    const baseTimeout = 10;
    const timeout = 10;
    const handle = setInterval(() => {
      setVelocity((currVelocity) => {
        const newVelocity = {
          x: Math.abs(currVelocity.x) < 0.01
            ? 0
            : currVelocity.x * friction ** (timeout / baseTimeout),
          y: Math.abs(currVelocity.y) < 0.01
            ? 0
            : currVelocity.y * friction ** (timeout / baseTimeout),
        };

        setPosition((currPosition) => ({
          x: currPosition.x + newVelocity.x,
          y: currPosition.y + newVelocity.y,
        }));

        if (newVelocity.x === 0 && newVelocity.y === 0) clearInterval(handle);

        return newVelocity;
      });
    }, timeout);

    return () => clearInterval(handle);
  }, [velocity.x, velocity.y]);

  // handles edges collision
  useEffect(() => {
    if (!velocity.x && !velocity.y) return;
    const canvas = ref.current;
    if (!canvas) return;

    if (position.x - radius - offset < 0) {
      setPosition({ x: radius + offset, y: position.y });
      setVelocity({ x: -velocity.x, y: velocity.y });
    }
    if (position.x + radius + offset > canvas.width) {
      setPosition({ x: canvas.width - radius - offset, y: position.y });
      setVelocity({ x: -velocity.x, y: velocity.y });
    }

    if (position.y - radius - offset < 0) {
      setPosition({ x: position.x, y: radius + offset });
      setVelocity({ x: velocity.x, y: -velocity.y });
    }
    if (position.y + radius + offset > canvas.height) {
      setPosition({ x: position.x, y: canvas.height - radius - offset });
      setVelocity({ x: velocity.x, y: -velocity.y });
    }
  }, [position]);

  return {
    drawBall,
    getDistance,
    checkCollision,
    resolveCollision,
    position,
    setPosition,
    setDragPosition,
    setIsDragging,
    isDragging,
    velocity,
    setVelocity,
    ...props,
  };
}
