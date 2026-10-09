// Shared fixed world-space model anchors, also used by the main FX renderer.
export { SHOT_HEIGHT, bodyZ, bodyPoint } from '../worldAnchors.js';

/** World height just above a unit's feet (where shells land). */
const feetZ = (v) => (v.z || 0) + (v.hover || 0) + 0.2;

/** Cheap fingerprint of a camera's framing (the damage-number layout cache is reused only while it is unchanged). */
const camKey = (c) => (c ? c.tx + c.ty * 1e3 + c.tz * 1e6 + c.tilt * 7.13 + c.dist * 1e4 + c.scale * 3.7e-2 + c.cx * 1.1e-5 + c.cy * 1.3e-8 : 0);

export { feetZ, camKey };
