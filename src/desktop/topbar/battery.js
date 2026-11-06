// Battery Status API is optional and can be blocked by browser policy.
export function observeBattery(deviceNavigator, onChange) {
  let disposed = false;
  let manager;
  const update = () => {
    if (disposed) return;
    const valid = Number.isFinite(manager?.level) && manager.level >= 0 && manager.level <= 1;
    onChange({ percentage: valid ? Math.round(manager.level * 100) : 0, charging: valid && manager.charging === true });
  };
  if (typeof deviceNavigator?.getBattery === 'function') {
    Promise.resolve().then(() => deviceNavigator.getBattery()).then((battery) => {
      if (disposed) return;
      manager = battery;
      update();
      manager?.addEventListener('levelchange', update);
      manager?.addEventListener('chargingchange', update);
    }).catch(() => {
      if (!disposed) onChange({ percentage: 0, charging: false });
    });
  }
  return () => {
    disposed = true;
    manager?.removeEventListener('levelchange', update);
    manager?.removeEventListener('chargingchange', update);
  };
}
