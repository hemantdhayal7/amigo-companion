use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, State, WebviewWindow};

#[derive(serde::Deserialize, serde::Serialize, Clone, Copy, Debug, Default)]
pub struct HitRegion {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Clone, Default)]
pub struct InteractiveState {
    pub regions: Arc<Mutex<Vec<HitRegion>>>,
    pub force_interactive: Arc<Mutex<bool>>,
    pub is_ignoring: Arc<Mutex<bool>>,
}

#[tauri::command]
fn set_interactive_regions(state: State<InteractiveState>, regions: Vec<HitRegion>) {
    if let Ok(mut lock) = state.regions.lock() {
        *lock = regions;
    }
}

#[tauri::command]
fn set_force_interactive(state: State<InteractiveState>, force: bool) {
    if let Ok(mut lock) = state.force_interactive.lock() {
        *lock = force;
    }
}

#[tauri::command]
fn set_ignore_cursor_events(
    window: WebviewWindow,
    state: State<InteractiveState>,
    ignore: bool,
) -> Result<(), String> {
    window
        .set_ignore_cursor_events(ignore)
        .map_err(|e| e.to_string())?;
    if let Ok(mut lock) = state.is_ignoring.lock() {
        *lock = ignore;
    }
    Ok(())
}

#[tauri::command]
fn toggle_window_visibility(window: WebviewWindow) -> Result<bool, String> {
    let is_visible = window.is_visible().map_err(|e| e.to_string())?;
    if is_visible {
        window.hide().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
fn show_app_window(window: WebviewWindow) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_app_window(window: WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn resize_window_for_screenshare(window: WebviewWindow, mode: String) -> Result<(), String> {
    match mode.as_str() {
        "fullscreen" => {
            let _ = window.maximize();
        }
        "theater" => {
            let _ = window.unmaximize();
            let _ = window.set_fullscreen(false);
            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                width: 1060.0,
                height: 720.0,
            }));
            let _ = window.center();
        }
        "compact" => {
            let _ = window.unmaximize();
            let _ = window.set_fullscreen(false);
            let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
                width: 420.0,
                height: 740.0,
            }));
        }
        _ => {}
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        // Fix WebKitGTK DMA-BUF renderer crash on Ubuntu / Linux Mesa & Nvidia drivers
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        // Prevent WebKitGTK sandbox crash in unprivileged user namespaces on Ubuntu 23.10 / 24.04
        if std::env::var("WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS").is_err() {
            std::env::set_var("WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS", "1");
        }
    }

    let interactive_state = InteractiveState::default();
    let regions_arc = interactive_state.regions.clone();
    let force_arc = interactive_state.force_interactive.clone();
    let is_ignoring_arc = interactive_state.is_ignoring.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(interactive_state)
        .invoke_handler(tauri::generate_handler![
            set_interactive_regions,
            set_force_interactive,
            set_ignore_cursor_events,
            toggle_window_visibility,
            show_app_window,
            hide_app_window,
            resize_window_for_screenshare
        ])
        .setup(move |app| {
            let quit_item = MenuItem::with_id(app, "quit", "Quit Amigo", true, None::<&str>)?;
            let toggle_item =
                MenuItem::with_id(app, "toggle", "Show/Hide Amigo 🥬", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&toggle_item, &quit_item])?;

            if let Some(icon) = app.default_window_icon() {
                let tray_res = TrayIconBuilder::new()
                    .menu(&tray_menu)
                    .tooltip("Amigo Study Companion 🥬")
                    .icon(icon.clone())
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| {
                        match event.id.as_ref() {
                            "quit" => {
                                app.exit(0);
                            }
                            "toggle" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    if let Ok(is_visible) = window.is_visible() {
                                        if is_visible {
                                            let _ = window.hide();
                                        } else {
                                            let _ = window.show();
                                            let _ = window.set_focus();
                                        }
                                    }
                                }
                            }
                            _ => {}
                        }
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                if let Ok(is_visible) = window.is_visible() {
                                    if is_visible {
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                        }
                    })
                    .build(app);

                if let Err(err) = tray_res {
                    eprintln!("[Tray] Notice: System tray icon skipped on this desktop environment: {}", err);
                }
            }

            // macOS only: background transparent window click-through polling thread
            // On Linux / GTK and Windows, running off-thread cursor querying causes fatal GTK crash (SIGSEGV / Gdk-FATAL)
            #[cfg(target_os = "macos")]
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_visible_on_all_workspaces(true);
                let win_clone = win.clone();
                std::thread::spawn(move || {
                    let mut currently_ignoring = false;

                    loop {
                        std::thread::sleep(Duration::from_millis(20));

                        let force = force_arc.lock().map(|f| *f).unwrap_or(false);
                        if force {
                            if currently_ignoring {
                                if win_clone.set_ignore_cursor_events(false).is_ok() {
                                    currently_ignoring = false;
                                    if let Ok(mut lock) = is_ignoring_arc.lock() {
                                        *lock = false;
                                    }
                                }
                            }
                            continue;
                        }

                        let regions = match regions_arc.lock() {
                            Ok(r) => r.clone(),
                            Err(_) => continue,
                        };

                        // If no regions are explicitly provided yet, keep window interactive
                        if regions.is_empty() {
                            if currently_ignoring {
                                if win_clone.set_ignore_cursor_events(false).is_ok() {
                                    currently_ignoring = false;
                                    if let Ok(mut lock) = is_ignoring_arc.lock() {
                                        *lock = false;
                                    }
                                }
                            }
                            continue;
                        }

                        let (cursor_phys, win_phys, scale) = match (
                            win_clone.cursor_position(),
                            win_clone.outer_position(),
                            win_clone.scale_factor(),
                        ) {
                            (Ok(c), Ok(w), Ok(s)) => (c, w, s),
                            _ => continue,
                        };

                        let logical_x = (cursor_phys.x - win_phys.x as f64) / scale;
                        let logical_y = (cursor_phys.y - win_phys.y as f64) / scale;

                        // Check if cursor is inside any registered HitRegion
                        // Provide 4px padding for comfortable edge selection
                        let is_inside = regions.iter().any(|r| {
                            logical_x >= (r.x - 4.0)
                                && logical_x <= (r.x + r.width + 4.0)
                                && logical_y >= (r.y - 4.0)
                                && logical_y <= (r.y + r.height + 4.0)
                        });

                        if is_inside {
                            if currently_ignoring {
                                if win_clone.set_ignore_cursor_events(false).is_ok() {
                                    currently_ignoring = false;
                                    if let Ok(mut lock) = is_ignoring_arc.lock() {
                                        *lock = false;
                                    }
                                }
                            }
                        } else {
                            if !currently_ignoring {
                                if win_clone.set_ignore_cursor_events(true).is_ok() {
                                    currently_ignoring = true;
                                    if let Ok(mut lock) = is_ignoring_arc.lock() {
                                        *lock = true;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            #[cfg(not(target_os = "macos"))]
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_focus();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running StudyFloat application");
}
