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
    vertex_glsl_code() {
        return phong_vert;
    }

    fragment_glsl_code() {
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
     * @param gpu_state
     * @param model_transform
     */
    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    /**
     * update_GPU(): Define how to synchronize our JavaScript's variables to GPU.  This is where the shader
     * receives ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
     * to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
     * program (which we call the "ProgramState").  Send both a material and a program state to the shaders
     * within this function, one data field at a time, to fully initialize the shader for a draw.
     * @param context
     * @param gpu_addresses
     * @param gpu_state
     * @param model_transform
     * @param material
     */
    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}

export {PhongShader}