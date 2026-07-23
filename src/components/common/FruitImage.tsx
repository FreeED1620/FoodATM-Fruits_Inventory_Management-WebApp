import React, { useState } from 'react';
import { getFruitIcon } from '../../utils/formatters';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

interface FruitImageProps {
  fruitName: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const FruitImage: React.FC<FruitImageProps> = ({
  fruitName,
  size = 40,
  className = '',
  style = {},
}) => {
  const [extIndex, setExtIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const emoji = getFruitIcon(fruitName);
  const name = fruitName.toLowerCase().trim().replace(/\s+/g, '-');

  if (imgFailed || !fruitName.trim()) {
    return (
      <span
        className={className}
        style={{
          fontSize: size * 0.7,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          ...style,
        }}
        role="img"
        aria-label={fruitName}
      >
        {emoji}
      </span>
    );
  }

  const imgUrl = `/fruit-images/${name}.${IMAGE_EXTENSIONS[extIndex]}`;

  return (
    <img
      src={imgUrl}
      alt={fruitName}
      className={className}
      loading="lazy"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        ...style,
      }}
      onError={() => {
        if (extIndex < IMAGE_EXTENSIONS.length - 1) {
          setExtIndex(extIndex + 1);
        } else {
          setImgFailed(true);
        }
      }}
    />
  );
};
