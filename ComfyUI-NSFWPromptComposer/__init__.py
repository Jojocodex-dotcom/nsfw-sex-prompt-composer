"""
ComfyUI-NSFWPromptComposer
Custom nodes for adult (21+) fictional NSFW video/image prompt composition.
"""

from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]

# ComfyUI web directory hook (optional; no extra UI assets yet)
WEB_DIRECTORY = "./web"
