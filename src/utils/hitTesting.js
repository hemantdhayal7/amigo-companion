import { invoke } from '@tauri-apps/api/core';

export const isTauri = () =>
  typeof window !== 'undefined' &&
  !window.electronAPI &&
  !navigator.userAgent.includes('Electron') &&
  Boolean(
    window.__TAURI_INTERNALS__ ||
    window.__TAURI__ ||
    window.__TAURI_METADATA__ ||
    navigator.userAgent.includes('Tauri')
  );

export const isElectron = () =>
  typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);

export function updateInteractiveRegions() {
  if (!isTauri()) return;

  const elements = document.querySelectorAll('[data-amigo-interactive="true"]');
  const regions = [];

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 2 && rect.height > 2) {
      regions.push({
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    }
  });

  if (regions.length === 0) {
    const container = document.getElementById('amigo-floating-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 2 && rect.height > 2) {
        regions.push({
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    }
  }

  invoke('set_interactive_regions', { regions }).catch((err) => {
    console.debug('[HitTest] set_interactive_regions:', err);
  });
}

export function setForceInteractive(force) {
  if (isElectron()) {
    if (force) {
      window.electronAPI.setIgnoreMouseEvents(false);
    } else {
      window.electronAPI.setIgnoreMouseEvents(true, true);
    }
    return;
  }
  if (!isTauri()) return;
  invoke('set_force_interactive', { force }).catch(() => {});
}

export function setIgnoreCursorEvents(ignore) {
  if (isElectron()) {
    window.electronAPI.setIgnoreMouseEvents(ignore, true);
    return;
  }
  if (!isTauri()) return;
  invoke('set_ignore_cursor_events', { ignore }).catch(() => {});
}

export function hideAppWindow() {
  if (typeof window !== 'undefined' && window.electronAPI?.hideWindow) {
    window.electronAPI.hideWindow();
    return;
  }
  if (!isTauri()) return;
  invoke('hide_app_window').catch(() => {});
}

export function showAppWindow() {
  if (typeof window !== 'undefined' && window.electronAPI?.showWindow) {
    window.electronAPI.showWindow();
    return;
  }
  if (!isTauri()) return;
  invoke('show_app_window').catch(() => {});
}

export function toggleAppWindowVisibility() {
  if (typeof window !== 'undefined' && window.electronAPI?.toggleWindow) {
    return window.electronAPI.toggleWindow();
  }
  if (!isTauri()) return Promise.resolve(false);
  return invoke('toggle_window_visibility').catch(() => false);
}

export function resizeWindowForScreenshare(mode) {
  if (typeof window !== 'undefined' && window.electronAPI?.resizeWindow) {
    window.electronAPI.resizeWindow(mode);
    return;
  }
  if (!isTauri()) return;
  invoke('resize_window_for_screenshare', { mode }).catch((err) => {
    console.debug('[Tauri] resize_window_for_screenshare:', err);
  });
}

function setupElectronHitTest() {
  const api = window.electronAPI;
  if (!api?.setIgnoreMouseEvents) return () => {};

  const onEnterInteractive = () => {
    api.setIgnoreMouseEvents(false);
  };

  const onLeaveInteractive = () => {
    api.setIgnoreMouseEvents(true, true);
  };

  const bindElement = (el) => {
    el.addEventListener('mouseenter', onEnterInteractive);
    el.addEventListener('mouseleave', onLeaveInteractive);
  };

  const unbindElement = (el) => {
    el.removeEventListener('mouseenter', onEnterInteractive);
    el.removeEventListener('mouseleave', onLeaveInteractive);
  };

  let boundElements = new Set();

  const syncElements = () => {
    const elements = document.querySelectorAll('[data-amigo-interactive="true"]');
    const currentSet = new Set(elements);

    boundElements.forEach((el) => {
      if (!currentSet.has(el)) {
        unbindElement(el);
        boundElements.delete(el);
      }
    });

    currentSet.forEach((el) => {
      if (!boundElements.has(el)) {
        bindElement(el);
        boundElements.add(el);
      }
    });

    if (boundElements.size === 0) {
      const container = document.getElementById('amigo-floating-container');
      if (container && !boundElements.has(container)) {
        bindElement(container);
        boundElements.add(container);
      }
    }
  };

  syncElements();

  let mutationObserver = null;
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => syncElements());
    const targetNode = document.getElementById('amigo-floating-container') || document.body;
    if (targetNode) {
      mutationObserver.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-amigo-interactive'],
      });
    }
  }

  const interval = setInterval(syncElements, 500);

  return () => {
    boundElements.forEach(unbindElement);
    boundElements.clear();
    if (mutationObserver) mutationObserver.disconnect();
    clearInterval(interval);
  };
}

export function setupHitTestSync() {
  if (isElectron()) return setupElectronHitTest();
  if (!isTauri()) return () => {};

  updateInteractiveRegions();

  const onResize = () => updateInteractiveRegions();
  window.addEventListener('resize', onResize);

  const onMouseUp = () => setForceInteractive(false);
  window.addEventListener('mouseup', onMouseUp);

  let resizeObserver = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateInteractiveRegions();
    });
    if (document.body) {
      resizeObserver.observe(document.body);
    }
    const container = document.getElementById('amigo-floating-container');
    if (container) {
      resizeObserver.observe(container);
    }
  }

  let mutationObserver = null;
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      updateInteractiveRegions();
    });
    const targetNode = document.getElementById('amigo-floating-container') || document.body;
    if (targetNode) {
      mutationObserver.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'data-amigo-interactive'],
      });
    }
  }

  const interval = setInterval(() => {
    updateInteractiveRegions();
  }, 250);

  return () => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mouseup', onMouseUp);
    if (resizeObserver) resizeObserver.disconnect();
    if (mutationObserver) mutationObserver.disconnect();
    clearInterval(interval);
  };
}
