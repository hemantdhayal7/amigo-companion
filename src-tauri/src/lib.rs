use std::sync::{Arc, Mutex};
use std::time::Duration;
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
            set_ignore_cursor_events
        ])
        .setup(move |app| {
            if let Some(win) = app.get_webview_window("main") {
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
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running StudyFloat application");
}
