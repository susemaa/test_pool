import { useState, Dispatch, SetStateAction } from 'react';
import { BallType } from '@/hooks/useBall';
import './ColorModal.css';

interface ColorModalProps {
  selectedBall: BallType;
  setSelectedBall: Dispatch<SetStateAction<BallType | null>>;
}

function hexToRgbValues(hexColor: string) {
  const hexValue = String(hexColor).replace(/^#/, '');
  const realHex = hexValue.length === 3
    ? hexValue.split('').map((x) => x + x).join('')
    : hexValue;

  // Конвертируем
  const r = parseInt(realHex.slice(0, 2), 16);
  const g = parseInt(realHex.slice(2, 4), 16);
  const b = parseInt(realHex.slice(4, 6), 16);

  return `${r}, ${g}, ${b}`;
}

export default function ColorModal({ selectedBall, setSelectedBall }: ColorModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>(selectedBall.color);

  if (!selectedBall) return null;

  const closeModal = () => {
    setSelectedBall(null);
  };

  const confirmColor = () => {
    if (selectedColor) {
      selectedBall.setColor(selectedColor);
      setSelectedBall(null);
    }
  };

  const handleChangeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value);
  };

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {selectedBall.number && (
            <div className="center-items">
              {'Выбранный шар: '}
              {selectedBall.number}
            </div>
          )}
          <div className="center-items">
            {'Изначальный цвет: '}
            {hexToRgbValues(selectedBall.color)}
          </div>
        </div>
        <div className="modal-body">
          <input type="color" value={selectedColor} onChange={handleChangeColor} />
        </div>
        <div className="modal-footer">
          <button type="button" aria-label="Подтвердить" onClick={confirmColor}>Подтвердить</button>
          <button type="button" aria-label="Отменить" onClick={closeModal}>Отменить</button>
        </div>
      </div>
    </div>
  );
}
