// import {defs, tiny} from './examples/common.js';
// import {defs} from './examples/common.js';
// import {Axes_Viewer, Axes_Viewer_Test_Scene} from "./examples/axes-viewer.js"
// import {Collision_Demo, Inertia_Demo} from "./examples/collisions-demo.js"
// import {Many_Lights_Demo} from "./examples/many-lights-demo.js"
// import {Obj_File_Demo} from "./examples/obj-file-demo.js"
// import {Scene_To_Texture_Demo} from "./examples/scene-to-texture-demo.js"
// import {Surfaces_Demo} from "./examples/surfaces-demo.js"
// import {Text_Demo} from "./examples/text-demo.js"
import {TransformsSandbox} from "./examples/transforms-sandbox.js"
import {MinimalScene} from "./src/scenes/MinimalScene.js";
// Pull these names into this module's scope for convenience:


import {widgets} from "./src/widgets.js"
const {
    Canvas_Widget, Code_Widget, Text_Widget
} = widgets;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and common.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// ******************** Extra step only for when executing on a local machine:
//                      Load any more files in your directory and copy them into "defs."
//                      (On the web, a server should instead just pack all these as well
//                      as common.js into one file for you, such as "dependencies.js")

// const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;

// Object.assign(widgets,
//     // {Axes_Viewer, Axes_Viewer_Test_Scene},
//     //         {Inertia_Demo, Collision_Demo},
//     //         {Many_Lights_Demo},
//     //         {Obj_File_Demo},
//     //         {Scene_To_Texture_Demo},
//     //         {Surfaces_Demo},
//     //         {Text_Demo},
//             {TransformsSandbox});

// ******************** End extra step

// (Can define Main_Scene's class here)

const Main_Scene = TransformsSandbox;
const Additional_Scenes = [];

export {Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget}