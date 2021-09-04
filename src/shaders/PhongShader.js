/**
 * **Phong_Shader** is a subclass of Shader, which stores and maanges a GPU program.
 * Graphic cards prior to year 2000 had shaders like this one hard-coded into them
 * instead of customizable shaders.  "Phong-Blinn" Shading here is a process of
 * determining brightness of pixels via vector math.  It compares the normal vector
 * at that pixel with the vectors toward the camera and light sources.
 */
import {Shader} from "./Shader.js";
import phong_vert from "./GLSL/phong_vert.glsl.js";
import phong_frag from "./GLSL/phong_frag.glsl.js";
import {color} from "../math/Color.js";
import {Matrix, vec4} from "../TinyGraphics.js";

class PhongShader extends Shader {
    vertexGlslCode() {
        return phong_vert;
    }

    fragmentGlslCode() {
        return phong_frag;
    }

    /**
     * Send the desired shape-wide material qualities to the
     * graphics card, where they will tweak the Phong lighting formula.
     * @param gl
     * @param gpu
     * @param material
     */
    send_material(gl, gpu, material) {
        // send_material():
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    /**
     * Send the state of our whole drawing context to the GPU.
     * @param gl
     * @param gpu
     * @param gpuState
     * @param model_transform
     */
    sendGpuState(gl, gpu, gpuState, model_transform) {
        const orig = vec4(0, 0, 0, 1), camera_center = gpuState.cameraTransform.times(orig).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r));
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpuState.projectionTransform.times(gpuState.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten2dTo1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_modelTransform, false, Matrix.flatten2dTo1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpuState.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpuState.lights.length; i++) {
            light_positions_flattened.push(gpuState.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpuState.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpuState.lights.map(l => l.attenuation));
    }

    /**
     * updateGpu(): Define how to synchronize our JavaScript's variables to GPU.  This is where the shader
     * receives ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
     * to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
     * program (which we call the "ProgramState").  Send both a material and a program state to the shaders
     * within this function, one data field at a time, to fully initialize the shader for a draw.
     * @param context
     * @param gpuAddresses
     * @param gpuState
     * @param model_transform
     * @param material
     */
    updateGpu(context, gpuAddresses, gpuState, model_transform, material) {
        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpuAddresses, material);
        this.sendGpuState(context, gpuAddresses, gpuState, model_transform);
    }
}

export {PhongShader};