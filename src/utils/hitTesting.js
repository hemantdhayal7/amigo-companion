import { invoke } from '@tauri-apps/api/core';

export const isTauri = () =>
  typeof window !== 'undefined' &&
  Boolean(
    window.__TAURI_INTERNALS__ ||
    window.__TAURI__ ||
    window.__TAURI_METADATA__ ||
    window.__IS_DESKTOP__ ||
    navigator.userAgent.includes('Tauri')
  );

/**
 * Updates the native Tauri window hit-test regions so that clicks on
 * transparent or invisible areas fall through to background applications,
 * while clicks on the visible widgets and modals are fully handled.
 */
export function updateInteractiveRegions() {
  if (!isTauri()) return;

  const elements = document.querySelectorAll('[data-amigo-interactive="true"]');
  const regions = [];

  elements.forEach((el) => {
    // Check if element is attached and visible
    if (!el || el.offsetParent === null && el.offsetWidth === 0 && el.offsetHeight === 0) {
      // In case offsetParent is null due to fixed positioning, check rect directly
    }

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

  // Fallback if no specific data-amigo-interactive items are rendered yet
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
    // Silently ignore if invoked during app unload
    console.debug('[HitTest] set_interactive_regions:', err);
  });
}

/**
 * Temporarily locks the window in interactive mode (e.g. during drag or modal opening)
 */
export function setForceInteractive(force) {
  if (!isTauri()) return;
  invoke('set_force_interactive', { force }).catch(() => {});
}

/**
 * Directly toggle window cursor ignore events
 */
export function setIgnoreCursorEvents(ignore) {
  if (!isTauri()) return;
  invoke('set_ignore_cursor_events', { ignore }).catch(() => {});
}

/**
 * Native desktop window hide/show for System Tray / Menu Bar Mode
 */
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

/**
 * Dynamically resize window for screen sharing modes: 'fullscreen', 'theater', 'compact'
 */
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

/**
 * Automatically observes the DOM and syncs interactive regions on resize,
 * mutations, and periodic animations.
 */
export function setupHitTestSync() {
  if (!isTauri()) return () => {};

  // Immediate initial sync
  updateInteractiveRegions();

  // Sync on window resize
  const onResize = () => updateInteractiveRegions();
  window.addEventListener('resize', onResize);

  // Release forced interactivity on global mouse up (e.g. drag released)
  const onMouseUp = () => setForceInteractive(false);
  window.addEventListener('mouseup', onMouseUp);

  // ResizeObserver on body / container
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

  // MutationObserver on floating container
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

  // Periodic heartbeat sync (e.g. during dial expansion/collapse CSS transitions)
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
