// The example registry.  index.html lists these, grouped, in its scene list and loads one with ?scene=Name.
// Each entry says which idea the example teaches and which group it is listed under, so you can find the one you need.
import {defs} from '../common.js';
import {Axes_Viewer_Test_Scene} from './axes-viewer.js';
import {Collision_Demo, Inertia_Demo} from './collisions-demo.js';
import {Many_Lights_Demo} from './many-lights-demo.js';
import {Obj_File_Demo} from './obj-file-demo.js';
import {Scene_To_Texture_Demo} from './scene-to-texture-demo.js';
import {Surfaces_Demo} from './surfaces-demo.js';
import {Text_Demo} from './text-demo.js';
import {Transforms_Sandbox} from './transforms-sandbox.js';

export const examples = {
    Minimal_Webgl_Demo: {group: "Start", scene: defs.Minimal_Webgl_Demo, teaches: "The smallest complete program: one shape, one shader, one draw call."},
    Transforms_Sandbox: {group: "Transforms", scene: Transforms_Sandbox, teaches: "Hierarchical modeling: building a model matrix step by step with translation, rotation and scale."},
    Axes_Viewer_Test_Scene: {group: "Transforms", scene: Axes_Viewer_Test_Scene, teaches: "Seeing the coordinate frame at each level of a transformation hierarchy."},
    Surfaces_Demo: {group: "Shapes", scene: Surfaces_Demo, teaches: "Parametric surfaces, surfaces of revolution, compound shapes, and editing vertices every frame."},
    Obj_File_Demo: {group: "Shapes", scene: Obj_File_Demo, teaches: "Loading an .obj model file; texture mapping versus a fake bump map."},
    Text_Demo: {group: "Light & texture", scene: Text_Demo, teaches: "Drawing text in 3D with a font texture atlas and changing texture coordinates."},
    Many_Lights_Demo: {group: "Light & texture", scene: Many_Lights_Demo, teaches: "Faking many lights with a shader that only knows two, by moving lights between draws."},
    Scene_To_Texture_Demo: {group: "Light & texture", scene: Scene_To_Texture_Demo, teaches: "Multi-pass rendering: draw into a Render_Target, then use it as a texture."},
    Inertia_Demo: {group: "Motion", scene: Inertia_Demo, teaches: "Physics-based motion with a fixed simulation time step."},
    Collision_Demo: {group: "Motion", scene: Collision_Demo, teaches: "Collision detection by testing points against a unit sphere or cube in another body's frame."},
};
