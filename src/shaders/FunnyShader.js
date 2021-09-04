import {Shader} from "./Shader.js";
import funny_vert from "./GLSL/funny_vert.glsl.js";
import funny_frag from "./GLSL/funny_frag.glsl.js";

/**
 * A simple "procedural" texture shader, with
 * texture coordinates but without an input image.
 */
class FunnyShader extends Shader {
    updateGPU(context, gpuAddresses, programState, model_transform, material) {
        // updateGPU():  Define how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [programState.projectionTransform, programState.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpuAddresses.projection_camera_modelTransform, false, Mat.flatten2dTo1D(PCM.transposed()));
        context.uniform1f(gpuAddresses.animationTime, programState.animationTime / 1000);
    }

    vertexGlslCode() {
        // ********* VERTEX SHADER *********
        return funny_vert;
    }

    fragmentGlslCode() {
        // ********* FRAGMENT SHADER *********
        return funny_frag;
    }
}

export {FunnyShader};