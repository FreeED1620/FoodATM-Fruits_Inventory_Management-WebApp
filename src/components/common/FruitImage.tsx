import React, { useState, useEffect } from 'react';
import { getFruitIcon } from '../../utils/formatters';
import { FruitImageService } from '../../services/fruitImageService';

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  const emoji = getFruitIcon(fruitName);

  useEffect(() => {
    if (!fruitName || !fruitName.trim()) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setImgFailed(false);

    FruitImageService.getUrlByName(fruitName)
      .then(url => {
        if (!cancelled) {
          setImageUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn(`[FruitImage] Failed to get URL for "${fruitName}":`, err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fruitName]);

  if (!fruitName.trim() || (!imageUrl && !loading)) {
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

  if (loading || !imageUrl || imgFailed) {
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

  return (
    <img
      src={imageUrl}
      alt={fruitName}
      className={className}
      loading="lazy"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        ...style,
      }}
      onError={() => setImgFailed(true)}
    />
  );
};
