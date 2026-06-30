use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseInfo {
  pub tag_name: String,
  pub name: String,
  pub html_url: String,
  pub published_at: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![check_update])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn check_update() -> Result<ReleaseInfo, String> {
  let client = reqwest::Client::new();
  let url = "https://api.github.com/repos/sh3boo6/moe-noor/releases/latest";

  let res = client
    .get(url)
    .header("User-Agent", "moe-noor-data-app")
    .send()
    .await
    .map_err(|e| e.to_string())?;

  if !res.status().is_success() {
    return Err(format!("GitHub API error: {}", res.status()));
  }

  let release: ReleaseInfo = res
    .json()
    .await
    .map_err(|e| e.to_string())?;

  Ok(release)
}
