/** Minimal ComfyUI extension: tint NSFWDirectorStudio so it stands out. */
import { app } from "../../scripts/app.js";

app.registerExtension({
  name: "nsfw.prompt.director",
  async nodeCreated(node) {
    if (node?.comfyClass === "NSFWDirectorStudio") {
      node.color = "#4a2030";
      node.bgcolor = "#6b3048";
      if (!node.title || node.title === "NSFWDirectorStudio") {
        node.title = "NSFW H3 导演台";
      }
    }
    if (node?.comfyClass === "NSFWBrickCatalog") {
      node.color = "#2a3040";
      node.bgcolor = "#3a4558";
    }
  },
});
