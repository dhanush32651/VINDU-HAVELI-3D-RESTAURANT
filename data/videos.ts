// Background videos live in public/videos/ (see public/videos/README.md). Names must match exactly.
export const VIDEOS = {
  biryani: 'biryani.mp4', pizza: 'pizza.mp4', sandwich: 'sandwich.mp4', coolDrinks: 'cool-drinks.mp4', burgers: 'burgers.mp4',
  starters: 'starters.mp4', desserts: 'desserts.mp4', grilledChicken: 'grilled-chicken.mp4', interior: 'restaurant-interior.mp4', cooking: 'cooking-process.mp4',
} as const;
export type VideoKey = keyof typeof VIDEOS;

/** Which video plays behind each menu category header. */
export const CATEGORY_VIDEO: Record<string, VideoKey> = {
  biryani: 'biryani', pizzas: 'pizza', burgers: 'burgers', sandwiches: 'sandwich', desserts: 'desserts',
  'soft-drinks': 'coolDrinks', mocktails: 'coolDrinks', starters: 'starters', mains: 'grilledChicken', breads: 'cooking',
};
