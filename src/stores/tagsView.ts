import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';

export const useTagsViewStore = defineStore('tagsView', () => {
  // State
  const visitedViews = ref<RouteLocationNormalized[]>([]);
  const cachedViews = ref<string[]>([]);

  // Actions
  function addVisitedView(view: RouteLocationNormalized) {
    if (visitedViews.value.some(v => v.path === view.path)) return;
    
    // Add only the necessary properties to avoid circular references
    visitedViews.value.push(
      Object.assign({}, view, {
        title: view.meta?.title || 'Unknown'
      })
    );
  }

  function addCachedView(view: RouteLocationNormalized) {
    const name = view.name as string;
    if (name && !cachedViews.value.includes(name) && view.meta?.keepAlive) {
      cachedViews.value.push(name);
    }
  }

  function delVisitedView(view: RouteLocationNormalized) {
    const index = visitedViews.value.findIndex(v => v.path === view.path);
    if (index !== -1) {
      visitedViews.value.splice(index, 1);
    }
  }

  function delCachedView(view: RouteLocationNormalized) {
    const name = view.name as string;
    const index = cachedViews.value.indexOf(name);
    if (index !== -1) {
      cachedViews.value.splice(index, 1);
    }
  }

  function delOthersVisitedViews(view: RouteLocationNormalized) {
    visitedViews.value = visitedViews.value.filter(v => {
      return v.meta?.affix || v.path === view.path;
    });
  }

  function delOthersCachedViews(view: RouteLocationNormalized) {
    const name = view.name as string;
    const index = cachedViews.value.indexOf(name);
    if (index !== -1) {
      cachedViews.value = cachedViews.value.slice(index, index + 1);
    } else {
      cachedViews.value = [];
    }
  }

  function delAllVisitedViews() {
    // Keep affix tags
    visitedViews.value = visitedViews.value.filter(tag => tag.meta?.affix);
  }

  function delAllCachedViews() {
    cachedViews.value = [];
  }

  function updateVisitedView(view: RouteLocationNormalized) {
    for (let v of visitedViews.value) {
      if (v.path === view.path) {
        v = Object.assign(v, view);
        break;
      }
    }
  }

  return {
    visitedViews,
    cachedViews,
    addVisitedView,
    addCachedView,
    delVisitedView,
    delCachedView,
    delOthersVisitedViews,
    delOthersCachedViews,
    delAllVisitedViews,
    delAllCachedViews,
    updateVisitedView
  };
});