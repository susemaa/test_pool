'use client';

import {
  useRef, useEffect, useState, useCallback, useMemo,
} from 'react';
import useBall from '@/hooks/useBall';
import type { BallProps, BallType } from '@/hooks/useBall';
import { Position } from '@/types';
import ColorModal from '@/components/ColorModal/ColorModal';

type optionsType = {
  radius: number,
  offset: number,
  ref: React.RefObject<HTMLCanvasElement>,
}

const getWH = (): [number, number] => {
  if (typeof window !== 'undefined') {
    return (window.innerWidth > window.innerHeight
      ? [window.innerWidth * 0.85, window.innerHeight * 0.85]
      : [window.innerHeight, window.innerWidth]);
  }

  return [0, 0];
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingBall, setDraggingBall] = useState<BallType | null>(null);
  const [selectedBall, setSelectedBall] = useState<BallType | null>(null);
  const [width, height] = useMemo(() => getWH(), []);
  const offset = 20;

  const ball1 = useBall({
    initialPosition: { x: width / 4, y: height / 2 },
    radius: 15,
    // color: 'white',
    color: '#ffffff',
    ref: canvasRef,
    offset,
  });

  const generateBallProps = (
    number: number,
    row: number,
    positionInRow: number,
    color: string,
    options : optionsType,
  ): BallProps => {
    const step = options.radius * 2;
    const stepX = options.radius + (options.radius * (Math.sqrt(3) / 2));

    const x = width * (3 / 4) + (row * stepX);
    const y = height / 2 + (positionInRow - (row / 2)) * step;

    return {
      number,
      color,
      initialPosition: { x, y },
      ...options,
    };
  };

  // red === ff0000
  // blue === 0000ff
  // black === 000000

  const defaultBallProps = [
    (id: number, options: optionsType) => generateBallProps(1, 0, 0, '#ff0000', options),

    (id: number, options: optionsType) => generateBallProps(2, 1, 0, '#0000ff', options),
    (id: number, options: optionsType) => generateBallProps(3, 1, 1, '#ff0000', options),

    (id: number, options: optionsType) => generateBallProps(4, 2, 0, '#ff0000', options),
    (id: number, options: optionsType) => generateBallProps(8, 2, 1, '#000000', options),
    (id: number, options: optionsType) => generateBallProps(5, 2, 2, '#0000ff', options),

    (id: number, options: optionsType) => generateBallProps(6, 3, 0, '#0000ff', options),
    (id: number, options: optionsType) => generateBallProps(7, 3, 1, '#0000ff', options),
    (id: number, options: optionsType) => generateBallProps(9, 3, 2, '#ff0000', options),
    (id: number, options: optionsType) => generateBallProps(10, 3, 3, '#ff0000', options),

    (id: number, options: optionsType) => generateBallProps(11, 4, 0, '#ff0000', options),
    (id: number, options: optionsType) => generateBallProps(12, 4, 1, '#0000ff', options),
    (id: number, options: optionsType) => generateBallProps(13, 4, 2, '#ff0000', options),
    (id: number, options: optionsType) => generateBallProps(14, 4, 3, '#0000ff', options),
    (id: number, options: optionsType) => generateBallProps(15, 4, 4, '#0000ff', options),
  ];

  const balls = useMemo(() => [
    ball1,
  ], [ball1]);
  for (let i = 0; i < 15; i += 1) {
    const generator = defaultBallProps[i];
    const options: optionsType = {
      radius: 16,
      offset,
      ref: canvasRef,
    };
    /* eslint-disable-next-line react-hooks/rules-of-hooks */
    balls.push(useBall(generator(i + 1, options)));
  }

  const drawField = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // const [width, height] = getWH();
    const transform = window.innerWidth > window.innerHeight ? '' : 'rotate(-90deg)';

    /* eslint-disable no-param-reassign */
    canvas.width = width;
    canvas.height = height;
    canvas.style.transform = transform;
    /* eslint-enable no-param-reassign */

    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'green';
    ctx.fillRect(offset, offset, width - offset * 2, height - offset * 2);
  }, [width, height]);

  const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>): Position => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    return { x: mouseX, y: mouseY };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingBall) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    draggingBall.setDragPosition({ x, y });
  }, [draggingBall]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePosition = getMousePosition(e);

    balls.forEach((ball) => {
      const distance = ball.getDistance(mousePosition);
      if (distance <= ball.radius) {
        ball.setIsDragging(true);
        setDraggingBall(ball);
      }
    });
  }, [balls]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePosition = getMousePosition(e);

    if (draggingBall) {
      draggingBall.setIsDragging(false);
      if (draggingBall.getDistance(mousePosition) <= draggingBall.radius) {
        setSelectedBall(draggingBall);
      }
      setDraggingBall(null);
    }
  }, [draggingBall]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawField(ctx, canvas);

      for (let i = 0; i < balls.length; i += 1) {
        for (let j = i + 1; j < balls.length; j += 1) {
          if (balls[i].checkCollision(balls[j])) {
            balls[i].resolveCollision(balls[j]);
          }
        }
      }

      balls.forEach((ball) => ball.drawBall());
    };

    render();

    const animationId = requestAnimationFrame(render);
    // eslint-disable-next-line consistent-return
    return () => cancelAnimationFrame(animationId);
  }, [balls, drawField]);

  return (
    <>
      <div className="center-items">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          // eslint-disable-next-line
          onMouseOut={handleMouseUp}
        />
      </div>
      {selectedBall && <ColorModal selectedBall={selectedBall} setSelectedBall={setSelectedBall} />}
    </>
  );
}
