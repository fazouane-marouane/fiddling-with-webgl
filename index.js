window.isPdfReadyState = false;
window.isPdfReady = () => window.isPdfReadyState;

setTimeout(() => {
  window.isPdfReadyState = true;
  console.log(">>> pdf ready to be rendered");
  if (location.search) {
    // freeze
    window.requestAnimationFrame = () => {};
  }
}, 5000);

// @ts-check
window.addEventListener("DOMContentLoaded", async function() {
  "use strict";

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(
    "game-view"
  ));
  const glOptions = {
    failIfMajorPerformanceCaveat: false,
    preserveDrawingBuffer: true,
  };
  const glCtx =
    /** @type {WebGLRenderingContext} */ (canvas.getContext("webgl2", glOptions) ||
    canvas.getContext("experimental-webgl2", glOptions) ||
    canvas.getContext("webgl", glOptions) ||
    canvas.getContext("experimental-webgl", glOptions));

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: glCtx.canvas.height - 1 - (evt.clientY - rect.top)
    };
  }

  let pos = { x: 0, y: 0 };
  document.addEventListener("mousemove", evt => {
    pos = getMousePos(canvas, evt);
  });
  document.addEventListener("touchmove", evt => {
    pos = getMousePos(canvas, evt.targetTouches.item(0));
  });


  /**
   * @param {WebGLRenderingContext} gl
   */
  function init(gl) {
    console.log("gl", gl);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 0.5, 0, 0.5);
  }

  /**
   * @param {WebGLRenderingContext} gl
   */
  function init(gl) {
    console.log("gl", gl);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 0.5, 0, 0.5);
  }

  init(glCtx);

  /**
   * @param {WebGLRenderingContext} gl
   */
  async function createShaders(gl) {
    const getShaderSource = url => fetch(url).then(r => r.text());

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, await getShaderSource("shader.vert"));
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, await getShaderSource("shader.frag"));
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    return program;
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} shaderProgram
   */
  function createVertices(gl, shaderProgram) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        [].concat(...[[0, 0], [-1, -1], [-1, 1], [1, 1], [1, -1], [-1, -1]])
      ),
      gl.STATIC_DRAW
    );

    const coords = gl.getAttribLocation(shaderProgram, "coords");
    gl.vertexAttribPointer(coords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coords);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const windowSize = gl.getUniformLocation(shaderProgram, "windowSize");
    gl.uniform2f(windowSize, gl.canvas.width, gl.canvas.height);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} shaderProgram
   */
  function updateData(gl, shaderProgram, timestamp) {
    const periode = 10000;
    const progress = (timestamp % periode) / periode;
    const angle = gl.getUniformLocation(shaderProgram, "angle");
    gl.uniform1f(angle, progress);

    const mouse = gl.getUniformLocation(shaderProgram, "mouse");
    gl.uniform2f(mouse, pos.x, pos.y);

    const color = gl.getUniformLocation(shaderProgram, "color");
    gl.uniform4f(color, progress, 1.0, 1.0, 1.0);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} shaderProgram
   */
  function draw(gl, shaderProgram) {
    return timestamp => {
      //gl.clear(gl.COLOR_BUFFER_BIT);
      updateData(glCtx, shaderProgram, timestamp);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 6);
      return true;
    };
  }

  const shaderProgram = await createShaders(glCtx);
  createVertices(glCtx, shaderProgram);

  animate(draw(glCtx, shaderProgram));

  function requestAnimationFrame() {
    return new Promise(window.requestAnimationFrame);
  }

  async function animate(f) {
    const start = performance.now();
    while (f((await requestAnimationFrame()) - start));
  }
});
