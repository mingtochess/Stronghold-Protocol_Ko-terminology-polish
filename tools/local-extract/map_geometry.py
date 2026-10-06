"""Unity stage UV conversion, independent of the UnityPy export loop."""


def lightmap_uv(primary, secondary=None, tiling=None):
    """Use UV0 when UV2 is absent; static batches already contain atlas ST."""
    source = secondary if secondary is not None else primary
    sx, sy, ox, oy = tiling if tiling is not None else (1, 1, 0, 0)
    return [(u * sx + ox, v * sy + oy) for u, v in source]
