// Scout prep metadata already contains its bench; shared-field metadata may omit it.
// Preserve empty slots while adding only pieces not represented by the same owner.
export function observedBenchExtras(bench, units = []) {
  if (!bench) return null;
  const represented = new Set(Array.from(units).filter(u => u.ownerId === bench.playerId && u.uid != null).map(u => u.uid));
  const added = new Set();
  const filter = list => (list || []).map(piece => {
    if (!piece || represented.has(piece.uid) || added.has(piece.uid)) return null;
    added.add(piece.uid);
    return piece;
  });
  return {...bench, pieces: filter(bench.pieces), tempPieces: filter(bench.tempPieces)};
}
