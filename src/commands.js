export function createCommands(apps, stateManager) {
  function focusOnId(pointId) {
    if (!pointId) return;
    console.log('Focusing on', pointId);
    apps.forEach(a => {
      if (a.isReady) a.object.focusOn(pointId);
    });
  }

  function pickRandomCommonId() {
    const ready = apps.filter(a => a.isReady);
    if (ready.length === 0) return null;
    const sets = ready.map(a => new Set(a.object.getIds()));
    const [first, ...rest] = sets;
    const common = [...first].filter(id => rest.every(s => s.has(id)));
    if (common.length === 0) {
      console.warn('No ids in common across datasets');
      return null;
    }
    return common[Math.floor(Math.random() * common.length)];
  }

  function setState(payload) {
    if (!payload?.name) return;
    stateManager.goTo(payload.name, { duration: payload.duration });
  }

  return { focusOnId, pickRandomCommonId, setState };
}
