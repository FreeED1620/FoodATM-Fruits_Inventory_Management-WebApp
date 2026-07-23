export function getFruitImageUrl(fruitName: string): string {
  const name = fruitName.toLowerCase().trim().replace(/\s+/g, '-');
  return `/fruit-images/${name}.png`;
}

export function getFruitIcon(fruitName: string): string {
  const name = fruitName.toLowerCase().trim();

  if (name.includes('apple')) return '🍎';
  if (name.includes('banana')) return '🍌';
  if (name.includes('orange') || name.includes('tangerine') || name.includes('citrus')) return '🍊';
  if (name.includes('grape')) return '🍇';
  if (name.includes('mango')) return '🥭';
  if (name.includes('strawberry')) return '🍓';
  if (name.includes('watermelon') || name.includes('melon')) return '🍉';
  if (name.includes('pineapple')) return '🍍';
  if (name.includes('peach')) return '🍑';
  if (name.includes('cherry')) return '🍒';
  if (name.includes('pear')) return '🍐';
  if (name.includes('lemon') || name.includes('lime')) return '🍋';
  if (name.includes('kiwi')) return '🥝';
  if (name.includes('avocado')) return '🥑';
  if (name.includes('coconut')) return '🥥';
  if (name.includes('papaya')) return '🍈';
  if (name.includes('pomegranate')) return '🍎';
  if (name.includes('blueberry') || name.includes('blueberries')) return '🫐';
  if (name.includes('tomato') || name.includes('tomatoes')) return '🍅';
  if (name.includes('dragon')) return '🐉';

  return '🧺';
}

export const WAREHOUSE_UNITS = [
  { value: 'boxes', label: 'Boxes' },
];
