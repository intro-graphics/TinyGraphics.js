import {widgets} from "./src/widgets.js";
import {TextDemo} from "./examples/textDemo.js";
import {AxesViewer, AxesViewerTestScene} from "./examples/axesViewer.js";
import {CollisionDemo, InertiaDemo} from "./examples/collisionsDemo.js";
import {ManyLightsDemo} from "./examples/manyLightsDemo.js";
import {ObjFileDemo} from "./examples/objFileDemo.js";
import {SceneToTextureDemo} from "./examples/sceneToTextureDemo.js";
import {SurfacesDemo} from "./examples/surfacesDemo.js";
import {TransformsSandbox} from "./examples/transformsSandbox.js";
import {MinimalScene} from "./src/TinyGraphics.js";
import {ShadowDemo} from "./examples/shadowDemo.js";

const {
    CanvasWidget, CodeWidget, TextWidget,
} = widgets;

Object.assign(widgets,
    {AxesViewer, AxesViewerTestScene},
    {InertiaDemo, CollisionDemo},
    {ManyLightsDemo},
    {MinimalScene},
    {ObjFileDemo},
    {SceneToTextureDemo},
    {SurfacesDemo},
    {TextDemo},
    {TransformsSandbox});

// Define the MainScene's class here
const MainScene = ShadowDemo;
const AdditionalScenes = [];

export {MainScene, AdditionalScenes, CanvasWidget, CodeWidget, TextWidget};