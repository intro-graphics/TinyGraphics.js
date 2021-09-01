import {GraphicsAddresses, GraphicsCardObject} from "../utils.js";

/**
 * **Shader** loads a GLSL shader program onto your graphics card, starting from a JavaScript string.
 * To use it, make subclasses of Shader that define these strings of GLSL code.  The base class will
 * command the GPU to receive, compile, and run these programs.  In WebGL 1, the shader runs once per
 * every shape that is drawn onscreen.
 *
 * Extend the class and fill in the abstract functions, some of which define GLSL strings, and others
 * (update_GPU) which define the extra custom JavaScript code needed to populate your particular shader
 * program with all the data values it is expecting, such as matrices.  The shader pulls these values
 * from two places in your JavaScript:  A Material object, for values pertaining to the current shape
 * only, and a ProgramState object, for values pertaining to your entire Scene or program.
 */
class Shader extends GraphicsCardObject {
    /**
     * Called automatically as needed to load the
     * shader program onto one of your GPU contexts for its first time.
     * @param context
     * @returns {*}
     */
    copyOntoGraphicsCard(context) {
        // Define what this object should store in each new WebGL Context:
        const initial_gpu_representation = {
            program: undefined, gpu_addresses: undefined,
            vertShdr: undefined, fragShdr: undefined
        };
        // Our object might need to register to multiple GPU contexts in the case of
        // multiple drawing areas.  If this is a new GPU context for this object,
        // copy the object to the GPU.  Otherwise, this object already has been
        // copied over, so get a pointer to the existing instance.
        const gpu_instance = super.copyOntoGraphicsCard(context, initial_gpu_representation);

        const gl = context;
        const program = gpu_instance.program || context.createProgram();
        const vertShdr = gpu_instance.vertShdr || gl.createShader(gl.VERTEX_SHADER);
        const fragShdr = gpu_instance.fragShdr || gl.createShader(gl.FRAGMENT_SHADER);

        if (gpu_instance.vertShdr) gl.detachShader(program, vertShdr);
        if (gpu_instance.fragShdr) gl.detachShader(program, fragShdr);
        gl.shaderSource(vertShdr, this.vertex_glsl_code());
        gl.compileShader(vertShdr);
        if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS))
            throw "Vertex shader compile error: " + gl.getShaderInfoLog(vertShdr);

        gl.shaderSource(fragShdr, this.fragment_glsl_code());
        gl.compileShader(fragShdr);
        if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS))
            throw "Fragment shader compile error: " + gl.getShaderInfoLog(fragShdr);

        gl.attachShader(program, vertShdr);
        gl.attachShader(program, fragShdr);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw "Shader linker error: " + gl.getProgramInfoLog(this.program);

        Object.assign(gpu_instance, {
            program,
            vertShdr,
            fragShdr,
            gpu_addresses: new GraphicsAddresses(program, gl)
        });
        return gpu_instance;
    }

    /**
     * Selects this Shader in GPU memory so the next shape draws using it.
     * @param context
     * @param buffer_pointers
     * @param program_state
     * @param model_transform
     * @param material
     */
    activate(context, buffer_pointers, program_state, model_transform, material) {
        const gpu_instance = super.activate(context);

        context.useProgram(gpu_instance.program);

        // --- Send over all the values needed by this particular shader to the GPU: ---
        this.update_GPU(context, gpu_instance.gpu_addresses, program_state, model_transform, material);

        // --- Turn on all the correct attributes and make sure they're pointing to the correct ranges in GPU memory. ---
        for (let [attr_name, attribute] of Object.entries(gpu_instance.gpu_addresses.shader_attributes)) {
            if (!attribute.enabled) {
                if (attribute.index >= 0) context.disableVertexAttribArray(attribute.index);
                continue;
            }
            context.enableVertexAttribArray(attribute.index);
            context.bindBuffer(context.ARRAY_BUFFER, buffer_pointers[attr_name]);
            // Activate the correct buffer.
            context.vertexAttribPointer(attribute.index, attribute.size, attribute.type,
                attribute.normalized, attribute.stride, attribute.pointer);
            // Populate each attribute
            // from the active buffer.
        }
    }

    // /**
    //  * Read the glsl shaders as string
    //  * @param shaderFile
    //  */
    // read_from_file(shaderFile) {
    //     const response =  fetch(shaderFile);
    //     return await response.text();
    // }


    // Your custom Shader has to override the following functions:
    vertex_glsl_code() {
    }

    fragment_glsl_code() {
    }

    update_GPU() {
    }

    // *** How those four functions work (and how GPU shader programs work in general):
    // vertex_glsl_code() and fragment_glsl_code() should each return strings that contain
    // code for a custom vertex shader and fragment shader, respectively.

    // The "Vertex Shader" is code that is sent to the graphics card at runtime, where on each
    // run it gets compiled and linked there.  Thereafter, all of your calls to draw shapes will
    // launch the vertex shader program, which runs every line of its code upon every vertex
    // stored in your buffer simultaneously (each instruction executes on every array index at
    // once).  Any GLSL "attribute" variables will appear to refer to some data field of just
    // one vertex, but really they affect all the stored vertices at once in parallel.

    // The purpose of this vertex shader program is to calculate the final resting place of
    // vertices in screen coordinates.  Each vertex starts out in local object coordinates
    // and then undergoes a matrix transform to land somewhere onscreen, or else misses the
    // drawing area and is clipped (cancelled).  One this has program has executed on your whole
    // set of vertices, groups of them (three if using triangles) are connected together into
    // primitives, and the set of pixels your primitive overlaps onscreen is determined.  This
    // launches an instance of the "Fragment Shader", starting the next phase of GPU drawing.

    // The "Fragment Shader" is more code that gets sent to the graphics card at runtime.  The
    // fragment shader runs after the vertex shader on a set of pixels (again, executing in
    // parallel on all pixels at once that were overlapped by a primitive).  This of course can
    // only happen once the final onscreen position of a primitive is known, which the vertex
    // shader found.

    // The fragment shader fills in (shades) every pixel (fragment) overlapping where the triangle
    // landed.  It retrieves different values (such as vectors) that are stored at three extreme
    // points of the triangle, and then interpolates the values weighted by the pixel's proximity
    // to each extreme point, using them in formulas to determine color.  GLSL variables of type
    // "varying" appear to have come from a single vertex, but are actually coming from all three,
    // and are computed for every pixel in parallel by interpolated between the different values of
    // the variable stored at the three vertices in this fashion.

    // The fragment colors may or may not become final pixel colors; there could already be other
    // triangles' fragments occupying the same pixels.  The Z-Buffer test is applied to see if the
    // new triangle is closer to the camera, and even if so, blending settings may interpolate some
    // of the old color into the result.  Finally, an image is displayed onscreen.

    // You must define an update_GPU() function that includes the extra custom JavaScript code
    // needed to populate your particular shader program with all the data values it is expecting.
}

export {Shader}