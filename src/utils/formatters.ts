/**
 * Helper to match fruit names with visual icons for quick warehouse visual reference
 */
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
  if (name.includes('papaya')) return '🥭';
  if (name.includes('pomegranate')) return '🍎';

  return '🧺'; // Default warehouse fruit crate fallback
}

/**
 * Simple fruit names suggestion list for quick selection in Add Fruit Form
 */
export const POPULAR_FRUITS = [
  'Apple',
  'Banana',
  'Orange',
  'Mango',
  'Grapes',
  'Watermelon',
  'Pineapple',
  'Strawberry',
  'Peach',
  'Pear',
  'Kiwi'
];

/**
 * Warehouse measurement units - ONLY Boxes
 */
export const WAREHOUSE_UNITS = [
  { value: 'boxes', label: 'Boxes' },
];
