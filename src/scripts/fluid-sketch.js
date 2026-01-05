import { Fluid } from "./fluid.js";
import { FluidMAC } from "./fluid-mac.js";

export function createFluidSim(containerId, options = {}) {
  const config = {
    canvasSize: options.canvasSize || 400,
    numberOfCells: options.numberOfCells || 20,
    useDiffuseBad: options.useDiffuseBad || false,
    useDiffuseAdvection: options.useDiffuseAdvection || false,
    useStaticVelocityField: options.useStaticVelocityField || false,
    useVelocityStep: options.useVelocityStep || false,
    useFluidMAC: options.useFluidMAC || false,
  };

  // Create DOM structure inside this container
  const container = document.querySelector(`#${containerId}`);
  container.innerHTML = `
    <div class="sketch-container">
      <div class="sketch-canvas-container">
        <div class="sketch-buttons-container"></div>
      </div>
      <div class="sketch-parameters-container"></div>
    </div>
  `;

  // Create p5 instance scoped to this simulation
  new p5((p) => {
    let N = config.numberOfCells - 2; // interior cells
    let canvasSize = config.canvasSize;
    let cellSize = canvasSize / config.numberOfCells;
    let simPlaying = false;

    let playBtn, diffSlider, viscSlider;
    let diffuse = 0.0; // 0.001
    let visc = 0.0; // 0.00001;
    let diffValue;
    let viscValue;

    let isMousePressed = false;

    let maxVelMag = 0;
    let fluid;

    let prevMousePos = [-1, -1];

    p.setup = function () {
      let cnv = p.createCanvas(canvasSize, canvasSize);
      cnv.parent(
        document.querySelector(`#${container.id} .sketch-canvas-container`)
      );

      p.frameRate(30);

      // Create simulation controls
      var buttonsParent = document.querySelector(
        `#${container.id} .sketch-buttons-container`
      );
      playBtn = p
        .createButton('<i class="bi bi-play-fill"></i>')
        .parent(buttonsParent)
        .mousePressed(togglePlay);
      p.createButton('<i class="bi bi-skip-forward-fill"></i>')
        .parent(buttonsParent)
        .mousePressed(sim_loop_step);
      p.createButton('<i class="bi bi-arrow-repeat"></i>')
        .parent(buttonsParent)
        .mousePressed(reset_cells);

      let diffContainer = p
        .createDiv()
        .parent(
          document.querySelector(
            `#${container.id} .sketch-parameters-container`
          )
        );

      p.createSpan("Diffuse:").parent(diffContainer);
      diffSlider = p
        .createSlider(0, 0.03, diffuse, 0.001)
        .class("slider")
        .parent(diffContainer);
      diffValue = p.createSpan(p.nf(diffuse, 1, 3)).parent(diffContainer);

      if (config.useVelocityStep) {
        p.createSpan("Visc:").parent(diffContainer);
        viscSlider = p
          .createSlider(0, 0.1, visc, 0.0001)
          .class("slider")
          .parent(diffContainer);
        viscValue = p.createSpan(p.nf(visc, 1, 3)).parent(diffContainer);
      }

      // initalize fluid solver
      fluid = new Fluid(
        N, // interior cells
        visc,
        diffuse,
        config.useDiffuseBad,
        config.useDiffuseAdvection,
        config.useVelocityStep
      );
      if (config.useFluidMAC) {
        fluid = new FluidMAC(
          N, // interior cells
          visc,
          diffuse
        );
      }

      reset_cells();
    };

    function togglePlay() {
      simPlaying = !simPlaying;
      if (simPlaying) {
        playBtn.html('<i class="bi bi-pause-fill"></i>');
      } else {
        playBtn.html('<i class="bi bi-play-fill"></i>');
      }
    }

    p.mousePressed = function () {
      isMousePressed = true;
    };
    p.mouseReleased = function () {
      isMousePressed = false;
    };

    function reset_cells() {
      fluid.clear();

      // also reset velocity field
      if (config.useStaticVelocityField) computeVelocityField();
    }

    p.draw = function () {
      p.background(0);

      // process mouse input
      let cellI = Math.floor(p.mouseX / cellSize);
      let cellJ = Math.floor(p.mouseY / cellSize);
      if (cellI >= 0 && cellI < N + 2 && cellJ >= 0 && cellJ < N + 2) {
        if (isMousePressed) fluid.addDensity(cellI, cellJ, 20);

        if (config.useVelocityStep) {
          let dx = (p.mouseX - prevMousePos[0]) / canvasSize;
          let dy = (p.mouseY - prevMousePos[1]) / canvasSize;
          fluid.addForce(cellI, cellJ, dx * 1200, dy * 1200);
          prevMousePos = [p.mouseX, p.mouseY];
        }
      }

      if (simPlaying) {
        sim_loop_step();
      }

      // update sketch parameters
      diffuse = diffSlider.value();
      diffValue.html(p.nf(diffuse, 1, 3));
      fluid.setDiffusion(diffuse);
      if (config.useVelocityStep) {
        visc = viscSlider.value();
        viscValue.html(p.nf(visc, 1, 3));
        fluid.setViscosity(visc);
      }

      // draw the density cells
      p.noStroke();
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          let d = simPlaying
            ? fluid.densityAt(i, j)
            : fluid.prevDensityAt(i, j);
          let fillC = p.lerp(0, 255, d);
          if (d > 1) fillC = 255;
          p.fill(fillC, fillC, fillC);
          p.rect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }

      // draw grid lines
      p.stroke(120); // gray lines
      p.strokeWeight(0.7);
      for (let i = 0; i <= N + 2; i++) {
        p.line(i * cellSize, 0, i * cellSize, canvasSize); // vertical lines
        p.line(0, i * cellSize, canvasSize, i * cellSize); // horizontal lines
      }

      // draw velocity arrows
      if (!config.useStaticVelocityField) {
        // maxVelMag is given by the mouse interaction
        // a bit arbitrary but lets say
        maxVelMag = 0.2;
      }
      p.strokeWeight(0);
      drawVelocityField(maxVelMag);
    };

    function sim_loop_step() {
      let dt = p.deltaTime * 0.001; // convert ms to seconds
      // dt = Math.min(dt, 0.034);
      fluid.step(dt);
    }

    function computeVelocityField() {
      maxVelMag = 0;
      // set velocity field values;
      // offset so that center of grid is at (0,0)
      // divide by N so velocity magnitudes are in [0,1]
      // i.e 0.2 means covering 20% of domain per second
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          // periodic vel field so periodic boundary doesn't introduce divergence.
          let velX =
            Math.sin((2 * Math.PI * i) / config.numberOfCells) *
            Math.sin((2 * Math.PI * j) / config.numberOfCells) *
            1;
          let velY =
            Math.cos((2 * Math.PI * i) / config.numberOfCells) *
            Math.cos((2 * Math.PI * j) / config.numberOfCells) *
            1;
          // circular vel field
          // velX[i][j] = 0.5 * (i - Math.ceil(config.numberOfCells / 2)) + 0.01;
          // velY[i][j] = -0.5 * (j - Math.ceil(config.numberOfCells / 2)) + 0.01;

          // velX[i][j] = 1; // positive x goes from top to bottom cause i is rows i = 0 is top row i = N+1 is bottom row
          // velY[i][j] = 0; // positive y goes from left to right cause j = 0 is leftmost column j = N+1 is rightmost column

          let velMag = Math.sqrt(velX * velX + velY * velY);
          if (velMag > maxVelMag) maxVelMag = velMag;

          // in this case we are showing a static velocity field therefore
          // we have to set current velocity field for the sim to work
          fluid.addForceDirectly(i, j, velX, velY);
        }
      }
    }

    function drawVelocityField(maxVelMag) {
      let h = cellSize;
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          let vel = config.useFluidMAC
            ? fluid.velocityAtCellCenter(i, j)
            : fluid.velocityAt(i, j);

          let velX = vel[0];
          let velY = vel[1];
          let velMag = Math.sqrt(velX * velX + velY * velY);

          // if magnitude small enough skip drawing
          if (velMag < 0.01) continue;

          // avoid divide-by-zero when maxVelMag is 0
          let t = maxVelMag > 0 ? velMag / maxVelMag : 0;
          let triangleColor = p.lerpColor(
            p.color(84, 241, 243),
            p.color(243, 86, 84),
            t
          );

          p.push();
          let scale = Math.min(Math.max(t, 0), 1);
          p.scale(scale); // sclae arrows, make sure it's clamped

          p.fill(triangleColor);

          // center of the cell: xi = i*h + h/2, yi = j*h + h/2
          let cx = i * h + h / 2;
          let cy = j * h + h / 2;
          cx /= scale;
          cy /= scale;
          // base triangle pointing "up" (local coordinates)
          let x1 = cx - h / 6,
            y1 = cy + h / 3; // left-bottom
          let x2 = cx + h / 6,
            y2 = cy + h / 3; // right-bottom
          let x3 = cx,
            y3 = cy - h / 3; // top

          let angle = Math.atan2(velY, velX) + Math.PI / 2; // +90 degrees cause we defined initial triangle pointing up
          let c = Math.cos(angle),
            s = Math.sin(angle);
          function rot(px, py) {
            let dx = px - cx,
              dy = py - cy;
            return [cx + dx * c - dy * s, cy + dx * s + dy * c];
          }
          let [rx1, ry1] = rot(x1, y1);
          let [rx2, ry2] = rot(x2, y2);
          let [rx3, ry3] = rot(x3, y3);
          p.triangle(rx1, ry1, rx2, ry2, rx3, ry3);
          p.translate(cx / scale, cx / scale);
          p.pop();
        }
      }
    }
  });
}
