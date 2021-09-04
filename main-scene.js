// import {defs, tiny} from './examples/common.js';
// import {defs} from './examples/common.js';
import {AxesViewerTestScene} from "./examples/axesViewer.js";
// import {CollisionDemo, InertiaDemo} from "./examples/collisionsDemo.js"
import {ManyLightsDemo} from "./examples/manyLightsDemo.js"
import {ObjFileDemo} from "./examples/objFileDemo.js"
// import {Scene_To_Texture_Demo} from "./examples/scene-to-texture-demo.js"
// import {Surfaces_Demo} from "./examples/surfaces-demo.js"
// import {Text_Demo} from "./examples/textDemo.js"
// Pull these names into this module's scope for convenience:
import {widgets} from "./src/widgets.js";
import {TransformsSandbox} from "./examples/transformsSandbox.js";

const {
    CanvasWidget, CodeWidget, TextWidget
} = widgets;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and common.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// ******************** Extra step only for when executing on a local machine:
//                      Load any more files in your directory and copy them into "defs."
//                      (On the web, a server should instead just pack all these as well
//                      as common.js into one file for you, such as "dependencies.js")

// const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;

// Object.assign(widgets,
//     // {AxesViewer, AxesViewerTestScene},
//     //         {InertiaDemo, CollisionDemo},
//     //         {ManyLightsDemo},
//     //         {ObjFileDemo},
//     //         {Scene_To_Texture_Demo},
//     //         {Surfaces_Demo},
//     //         {Text_Demo},
//             {TransformsSandbox});

// ******************** End extra step

// (Can define Main_Scene's class here)

const Main_Scene = ObjFileDemo;
const Additional_Scenes = [];

export {Main_Scene, Additional_Scenes, CanvasWidget, CodeWidget, TextWidget}