// The authored sprites occupy a fixed plane tilted 30 degrees from the ground.
// Its vertical axis is fixed in world space; camera framing never changes it.
export const MODEL_UP = Object.freeze({ y: Math.cos(Math.PI / 6), z: Math.sin(Math.PI / 6) });
export const SHOT_HEIGHT = Object.freeze({ launch: .45, aim: .5 });
export const MODEL_WORLD_HEIGHT = MODEL_UP.z;
export function modelPoint(view, height, dx = 0) {
  return {
    x: view.x + (view.bossArea?.dx || 0) + dx,
    y: view.y + height * MODEL_UP.y,
    z: (view.z || 0) + (view.hover || 0) + (view.lift || 0) + (view.waterSink || 0) + height * MODEL_UP.z,
  };
}
export function bodyPoint(_camera, view, fraction) {
  return modelPoint(view, (view._headTiles || 1.2) * fraction);
}
export function bodyZ(camera, view, fraction) { return bodyPoint(camera, view, fraction).z; }
