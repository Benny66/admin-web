import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSidebarStore = defineStore('sidebar', () => {
  // State
  const sidebar = ref({
    opened: true,
    withoutAnimation: false
  });
  
  const device = ref('desktop');

  // Actions
  function toggleSideBar() {
    sidebar.value.opened = !sidebar.value.opened;
    sidebar.value.withoutAnimation = false;
  }

  function closeSideBar(withoutAnimation: boolean) {
    sidebar.value.opened = false;
    sidebar.value.withoutAnimation = withoutAnimation;
  }

  function openSideBar(withoutAnimation: boolean) {
    sidebar.value.opened = true;
    sidebar.value.withoutAnimation = withoutAnimation;
  }

  function toggleDevice(val: string) {
    device.value = val;
  }

  return {
    sidebar,
    device,
    toggleSideBar,
    closeSideBar,
    openSideBar,
    toggleDevice
  };
});