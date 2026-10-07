// Clicked UI buttons should not retain focus or consume the next Enter press.
// Preserve text-input focus that the click handler deliberately moves elsewhere.
export function installButtonFocusRelease(root = document) {
  const onClick = event => {
    const button = event.target?.closest?.('button, [role="button"]');
    if (!button) return;
    queueMicrotask(() => {
      if (root.activeElement === button || button.contains?.(root.activeElement)) root.activeElement?.blur?.();
    });
  };
  root.addEventListener('click', onClick, true);
  return () => root.removeEventListener('click', onClick, true);
}
