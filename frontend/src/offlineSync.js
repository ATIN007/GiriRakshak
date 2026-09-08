const STORAGE_KEY = 'girirakshak_offline_reports';

export function getLocalReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading localStorage:", e);
    return [];
  }
}

export function saveLocalReport(report) {
  try {
    const current = getLocalReports();
    const newEntry = {
      ...report,
      id: 'offline-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      synced: false,
      created_at: new Date().toISOString(),
      is_local_queue: true
    };
    current.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('girirakshak_storage_updated'));
    return newEntry;
  } catch (e) {
    console.error("Error saving to localStorage:", e);
    return report;
  }
}

export async function syncLocalReports(apiBase) {
  const localReports = getLocalReports();
  const unSynced = localReports.filter(r => !r.synced);

  if (unSynced.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const updatedLocal = [...localReports];

  for (let i = 0; i < updatedLocal.length; i++) {
    const item = updatedLocal[i];
    if (!item.synced) {
      try {
        const payload = {
          zone_id: item.zone_id || null,
          reporter_name: item.reporter_name,
          description: `[${item.hazard_type ? item.hazard_type.toUpperCase() : 'HAZARD'}] ${item.description}`,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          synced: true
        };

        const res = await fetch(`${apiBase}/hazard-reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          updatedLocal[i].synced = true;
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.warn("Sync failed for item (offline):", err);
        failedCount++;
      }
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLocal));
  window.dispatchEvent(new Event('girirakshak_storage_updated'));
  return { syncedCount, failedCount };
}
