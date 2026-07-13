/* ============================================================
   記録の永続化レイヤー
   - ローカル/GitHub Pages では localStorage を使用
   - App.jsx 側は async API のまま呼び出す（将来バックエンドに
     差し替えるときもこのファイルだけ変更すればよい）
   ============================================================ */
const KEY = "svn-dojo:data";

export async function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("storage load failed", e);
  }
  return { history: {} };
}

export async function saveData(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.error("storage save failed", e);
  }
}

/* 記録のエクスポート／インポート（バックアップ用の予備API） */
export function exportJSON() {
  return localStorage.getItem(KEY) ?? '{"history":{}}';
}
export function importJSON(json) {
  JSON.parse(json); // 妥当性チェック（不正なら例外）
  localStorage.setItem(KEY, json);
}
