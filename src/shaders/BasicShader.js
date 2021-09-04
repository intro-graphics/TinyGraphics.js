import {Matrix, Shader} from "../TinyGraphics.js";
import basicVert from "./GLSL/basic_vert.glsl.js";
import basicFrag from "./GLSL/basic_frag.glsl.js";

/**
 * **Basic_Shader** is nearly the simplest example of a subclass of Shader, which stores and
 * manages a GPU program.  Basic_Shader is a trivial pass-through shader that applies a
 * shape's matrices and then simply samples literal colors stored at each vertex.
 */
class BasicShader extends Shader {
    /**
     * Defining how to synchronize our JavaScript's variables to the GPU's:
     * @param context
     * @param gpuAddresses
     * @param graphicsState
     * @param model_transform
     * @param material
     */
    updateGpu(context, gpuAddresses, graphicsState, model_transform, material) {
        const [P, C, M] = [graphicsState.projectionTransform, graphicsState.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpuAddresses.projection_camera_modelTransform, false,
            Matrix.flatten2dTo1D(PCM.transposed()));
    }

    vertexGlslCode() {
        return basicVert;
    }

    fragmentGlslCode() {
        return basicFrag;
    }
}

export {BasicShader};
