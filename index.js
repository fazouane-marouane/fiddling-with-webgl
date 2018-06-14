document.addEventListener("DOMContentLoaded", function(event) { 

(async function() {
  "use strict";

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(
    "game-view"
  ));
  const glCtx =
    /** @type {WebGLRenderingContext} */ (canvas.getContext("webgl2") ||
    canvas.getContext("experimental-webgl2") ||
    canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl"));

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
    gl.shaderSource(vertexShader, await getShaderSource("/shader.vert"));
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, await getShaderSource("/shader.frag"));
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    return program;
  }

  function neighbors(hexagon) {
    const ne = hexagon.map(t => [t[0] + 2, t[1] + 1]);
    const n = hexagon.map(t => [t[0] + 1, t[1] + 2]);
    const nw = hexagon.map(t => [t[0] - 1, t[1] + 1]);
    const sw = hexagon.map(t => [t[0] - 2, t[1] - 1]);
    const s = hexagon.map(t => [t[0] - 1, t[1] - 2]);
    const se = hexagon.map(t => [t[0] + 1, t[1] - 1]);

    const e = hexagon.map(t => [t[0] + 6, t[1]]);

    return [s, sw, nw, n, ne, se, e];
  }

  function mix(array) {
    return _.reduce(
      _.drop(array, 1),
      (acc, current) => {
        acc.push(_.last(acc), _.head(current), ...current);
        return acc;
      },
      [..._.head(array)]
    );
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} shaderProgram
   */
  function createVertices(gl, shaderProgram) {
    const pointSize = gl.getAttribLocation(shaderProgram, "pointSize");
    gl.vertexAttrib1f(pointSize, 10.0);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const a = [1, 0];
    const b = [1, 1];
    const c = [0, 1];
    const d = [-1, 0];
    const e = [-1, -1];
    const f = [0, -1];
    const hexagon = [a, b, f, b, e, c, c, d, e];
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(
        [].concat(
          ...mix([hexagon, ...neighbors(hexagon)])
        ) /*[].concat(...hexagon, ...neighbors(hexagon))*/
      ),
      gl.STATIC_DRAW
    );

    const coords = gl.getAttribLocation(shaderProgram, "coords");
    gl.vertexAttribPointer(coords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(coords);
    //gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const windowSize = gl.getUniformLocation(shaderProgram, "windowSize");
    gl.uniform2f(windowSize, gl.canvas.width, gl.canvas.height);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} shaderProgram
   */
  function updateData(gl, shaderProgram, timestamp) {
    const periode = 5000;
    const progress = (timestamp % periode) / periode;
    const angle = gl.getAttribLocation(shaderProgram, "angle");
    gl.vertexAttrib1f(angle, progress);

    const angle2 = gl.getUniformLocation(shaderProgram, "angle2");
    gl.uniform1f(angle2, progress);

    const color = gl.getUniformLocation(shaderProgram, "color");
    gl.uniform4f(color, 0 * progress, 1.0, 1.0, 1.0);
  }

  /**
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} shaderProgram
   */
  function draw(gl, shaderProgram) {
    return timestamp => {
      //gl.clear(gl.COLOR_BUFFER_BIT);
      updateData(glCtx, shaderProgram, timestamp);
      gl.drawArrays(
        gl.TRIANGLE_STRIP,
        0,
        9 * 8 + (8 - 1) * 2 /*9 * 7*/ /*6 * 3 * 7*/
      );
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
})();

});
