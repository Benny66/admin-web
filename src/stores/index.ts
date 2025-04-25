import { createPinia } from 'pinia';

// Import all stores
import { useUserStore } from './user';
import { useTagsViewStore } from './tagsView';
import { useSidebarStore } from './sidebar';
// Import other stores as needed

const pinia = createPinia();

export {
  pinia,
  useUserStore,
  useTagsViewStore,
  useSidebarStore
  // Export other stores as needed
};