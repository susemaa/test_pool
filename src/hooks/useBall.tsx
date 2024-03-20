'use client';

import {
  useState, useEffect, Dispatch, SetStateAction, RefObject,
  useCallback,
} from 'react';
import type { Position } from '@/types';

export interface BallProps {
  initialPosition: Position;
  radius: number;
  color: string;
  ref: RefObject<HTMLCanvasElement>;
  offset: number;
  number?: number;
}

export interface BallType extends BallProps{
  drawBall: () => void,
  getDistance: (_pointTo: Position) => number,
  checkCollision: (_ball: BallType) => boolean,
  resolveCollision: (_ball: BallType) => void,
  position: Position,
  setPosition: Dispatch<SetStateAction<Position>>,
  setDragPosition: Dispatch<SetStateAction<Position | null>>,
  setIsDragging: Dispatch<SetStateAction<boolean>>,
  isDragging: boolean,
  velocity: Position,
  setVelocity: Dispatch<SetStateAction<Position>>,
  setColor: Dispatch<SetStateAction<string>>,
}

function calculateFriction(radius: number): number {
  const frictionLossPercent = (0.02 * radius) / 10;
  return 1 - frictionLossPercent;
}

export default function useBall(props: BallProps): BallType {
  const {
    initialPosition, radius, color: propColor, offset, ref, number,
  } = props;

  const [position, setPosition] = useState<Position>(initialPosition);
  const [dragPosition, setDragPosition] = useState<Position | null>(null);
  const [velocity, setVelocity] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [color, setColor] = useState<string>(propColor);
  const friction: number = calculateFriction(radius);

  const getNormalized = useCallback(
    (pointTo: Position, reversed: boolean = false): [number, number] => {
      const dx = position.x - pointTo.x;
      const dy = position.y - pointTo.y;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      const nx = dx / distance;
      const ny = dy / distance;
      return !reversed ? [nx, ny] : [-nx, -ny];
    },
    [position.x, position.y],
  );

  const getDistance = useCallback((pointTo: Position): number => {
    const dx = position.x - pointTo.x;
    const dy = position.y - pointTo.y;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);
    return distance;
  }, [position.x, position.y]);

  const checkCollision = (ball: BallType): boolean => {
    // Если шар пролетает другой насквозь - увеличь число шагов интерполяции steps
    const steps = 100;
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

      if (nDistance < radius + ball.radius) return true;
    }

    return false;
  };

  // const resolveOverlap = (ball: BallType): void => {
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

  const resolveCollision = useCallback((ball: BallType): void => {
    const [nx, ny]: [number, number] = getNormalized(ball.position, true);

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

    // vAN < 0 === balls increasing distance between them
    if (velocityAlongNormal < 0) {
      return;
    }

    const energyTransition = 0.99;
    setVelocity({ x: newVx1 * energyTransition, y: newVy1 * energyTransition });
    ball.setVelocity({ x: newVx2 * energyTransition, y: newVy2 * energyTransition });
    // resolveOverlap(ball);
  }, [getNormalized, radius, velocity]);

  const drawCue = useCallback((ctx: CanvasRenderingContext2D) => {
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
    const sStartX = cueEndX - (headLength / 3) * Math.cos(angle - Math.PI / 6);
    const sStartY = cueEndY - (headLength / 3) * Math.sin(angle - Math.PI / 6);
    const sEndX = cueEndX - (headLength / 3) * Math.cos(angle + Math.PI / 6);
    const sEndY = cueEndY - (headLength / 3) * Math.sin(angle + Math.PI / 6);

    ctx.moveTo(bStartX, bStartY);
    ctx.lineTo(sStartX, sStartY);
    ctx.arc(
      (sStartX + sEndX) / 2,
      (sStartY + sEndY) / 2,
      (headLength / 2) / 3,
      angle + Math.PI / 2,
      angle - Math.PI / 2,
      true,
    );
    ctx.lineTo(bEndX, bEndY);
    ctx.arc(
      (bStartX + bEndX) / 2,
      (bStartY + bEndY) / 2,
      (headLength / 2),
      angle + Math.PI / 2,
      angle - Math.PI / 2,
    );
    ctx.closePath();

    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }, [dragPosition, getDistance, isDragging, position, radius]);

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

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      number ? number.toString() : '',
      position.x,
      position.y,
    );

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
      }
      setDragPosition(null);
    }
  }, [isDragging, dragPosition, getDistance, getNormalized, radius]);

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
  }, [velocity.x, velocity.y, friction]);

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
  }, [position, offset, radius, velocity, ref]);

  return {
    ...props,
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
    color,
    setColor,
  };
}
