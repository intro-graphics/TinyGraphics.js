import {GraphicsAddresses, GraphicsCardObject} from "../utils.js";

/**
 * **Shader** loads a GLSL shader program onto your graphics card, starting from a JavaScript string.
 * To use it, make subclasses of Shader that define these strings of GLSL code.  The base class will
 * command the GPU to receive, compile, and run these programs.  In WebGL 1, the shader runs once per
 * every shape that is drawn onscreen.
 *
 * Extend the class and fill in the abstract functions, some of which define GLSL strings, and others
 * (updateGPU) which define the extra custom JavaScript code needed to populate your particular shader
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
        const initialGpuRepresentation = {
            program: undefined, gpuAddresses: undefined,
            vertShdr: undefined, fragShdr: undefined,
        };
        // Our object might need to register to multiple GPU contexts in the case of
        // multiple drawing areas.  If this is a new GPU context for this object,
        // copy the object to the GPU.  Otherwise, this object already has been
        // copied over, so get a pointer to the existing instance.
        const gpuInstance = super.copyOntoGraphicsCard(context, initialGpuRepresentation);

        const gl = context;
        const program = gpuInstance.program || context.createProgram();
        const vertShdr = gpuInstance.vertShdr || gl.createShader(gl.VERTEX_SHADER);
        const fragShdr = gpuInstance.fragShdr || gl.createShader(gl.FRAGMENT_SHADER);

        if (gpuInstance.vertShdr) gl.detachShader(program, vertShdr);
        if (gpuInstance.fragShdr) gl.detachShader(program, fragShdr);
        gl.shaderSource(vertShdr, this.vertexGlslCode());
        gl.compileShader(vertShdr);
        if (!gl.getShaderParameter(vertShdr, gl.COMPILE_STATUS))
            throw "Vertex shader compile error: " + gl.getShaderInfoLog(vertShdr);

        gl.shaderSource(fragShdr, this.fragmentGlslCode());
        gl.compileShader(fragShdr);
        if (!gl.getShaderParameter(fragShdr, gl.COMPILE_STATUS))
            throw "Fragment shader compile error: " + gl.getShaderInfoLog(fragShdr);

        gl.attachShader(program, vertShdr);
        gl.attachShader(program, fragShdr);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw "Shader linker error: " + gl.getProgramInfoLog(this.program);

        Object.assign(gpuInstance, {
            program,
            vertShdr,
            fragShdr,
            gpuAddresses: new GraphicsAddresses(program, gl),
        });
        return gpuInstance;
    }

    /**
     * Selects this Shader in GPU memory so the next shape draws using it.
     * @param context
     * @param bufferPointers
     * @param programState
     * @param model_transform
     * @param material
     */
    activate(context, bufferPointers, programState, model_transform, material) {
        const gpuInstance = super.activate(context);

        context.useProgram(gpuInstance.program);

        // --- Send over all the values needed by this particular shader to the GPU: ---
        this.updateGPU(context, gpuInstance.gpuAddresses, programState, model_transform, material);

        // --- Turn on all the correct attributes and make sure they're pointing to the correct ranges in GPU memory. ---
        for (let [attrName, attribute] of Object.entries(gpuInstance.gpuAddresses.shader_attributes)) {
            if (!attribute.enabled) {
                if (attribute.index >= 0) context.disableVertexAttribArray(attribute.index);
                continue;
            }
            context.enableVertexAttribArray(attribute.index);
            context.bindBuffer(context.ARRAY_BUFFER, bufferPointers[attrName]);
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
    vertexGlslCode() {
    }

    fragmentGlslCode() {
    }

    updateGPU() {
    }

    // *** How those four functions work (and how GPU shader programs work in general):
    // vertexGlslCode() and fragmentGlslCode() should each return strings that contain
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

    // You must define an updateGPU() function that includes the extra custom JavaScript code
    // needed to populate your particular shader program with all the data values it is expecting.
}

export {Shader};