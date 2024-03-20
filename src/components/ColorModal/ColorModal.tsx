import { useState, Dispatch, SetStateAction } from 'react';
import { ColorResult, SketchPicker } from 'react-color';
import { BallType } from '@/hooks/useBall';
import './ColorModal.css';

interface ColorModalProps {
  selectedBall: BallType;
  setSelectedBall: Dispatch<SetStateAction<BallType | null>>;
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

  const handleChangeColor = (color: ColorResult) => {
    setSelectedColor(color.hex);
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
            {selectedBall.color}
          </div>
        </div>
        <div className="modal-body">
          <SketchPicker color={selectedColor} onChange={handleChangeColor} />
        </div>
        <div className="modal-footer">
          <button type="button" aria-label="Подтвердить" onClick={confirmColor}>Подтвердить</button>
          <button type="button" aria-label="Отменить" onClick={closeModal}>Отменить</button>
        </div>
      </div>
    </div>
  );
}
