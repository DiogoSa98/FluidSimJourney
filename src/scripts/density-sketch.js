function createDiffusionSim(containerId, options = {}) {
  const config = {
    canvasSize: options.canvasSize || 400,
    numberOfCells: options.numberOfCells || 20,
    useDiffuseBad: options.useDiffuseBad || false,
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
    let N = config.numberOfCells - 2; // number of interior cells along one dimension
    let dens = [];
    let dens_prev = [];
    let canvasSize = config.canvasSize;
    let cellSize = canvasSize / config.numberOfCells;
    let simPlaying = false;

    let playBtn, diffSlider;
    let diffuse = 0.001;
    let diffValue;

    let isMousePressed = false;

    let velX = [];
    let velY = [];
    let maxVelMag = 0;

    p.setup = function () {
      let cnv = p.createCanvas(canvasSize, canvasSize);
      // cnv.parent("sketch-canvas-container");
      cnv.parent(
        document.querySelector(`#${container.id} .sketch-canvas-container`)
      );
      cnv.mouse;
      p.frameRate(30);

      computeVelocityField();
      reset_cells();
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
        .mousePressed(step_once);
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

    function AddDensityOnCellClick() {
      let cellI = Math.floor(p.mouseX / cellSize);
      let cellJ = Math.floor(p.mouseY / cellSize);
      // console.log(`i ${cellI} j ${cellJ}`);
      // allow adding density on the interior cells 1..N
      if (cellI > 0 && cellI <= N && cellJ > 0 && cellJ <= N) {
        dens[cellI][cellJ] = 1;
      }
    }

    function reset_cells() {
      // initialize cells at color/density 0
      // we need arrays indexed 0..N+1, so inner arrays must have length N+2
      dens = new Array(N + 2);
      dens_prev = new Array(N + 2);
      for (let i = 0; i <= N + 1; i++) {
        dens[i] = new Array(N + 2).fill(0);
        dens_prev[i] = new Array(N + 2).fill(0);
      }
    }

    p.draw = function () {
      p.background(0);

      if (isMousePressed) AddDensityOnCellClick(); // writes on dens
      if (simPlaying) {
        [dens_prev, dens] = swap(dens_prev, dens);
        step_diffuse();
        [dens_prev, dens] = swap(dens_prev, dens);
        advect();
      }

      // update sketch parameters
      diffuse = diffSlider.value();
      diffValue.html(p.nf(diffuse, 1, 3));

      // draw the density cells
      p.noStroke();
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          let fillC = p.lerp(0, 255, dens[i][j]);
          p.fill(fillC, fillC, fillC);
          p.rect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }

      // draw grid lines
      p.stroke(150); // gray lines
      p.strokeWeight(1);
      for (let i = 0; i <= N + 2; i++) {
        p.line(i * cellSize, 0, i * cellSize, canvasSize); // vertical lines
        p.line(0, i * cellSize, canvasSize, i * cellSize); // horizontal lines
      }

      p.strokeWeight(0);
      drawVelocityField(velX, velY, maxVelMag);
    };

    function step_once() {
      [dens_prev, dens] = swap(dens_prev, dens);
      step_diffuse();
      [dens_prev, dens] = swap(dens_prev, dens);
      advect();
    }

    function swap(a, b) {
      return [b, a];
    }

    function step_diffuse() {
      // update density diffusion step
      if (config.useDiffuseBad) {
        diffuse_bad(N, dens, dens_prev, diffuse, p.deltaTime * 0.001);
      } else {
        diffuse_good(N, dens, dens_prev, diffuse, p.deltaTime * 0.001);
      }

      // SanityCheck(dens);
    }

    function SanityCheck(x0) {
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          let x = x0[i][j];
          if (x < 0 || x > 1) console.log("wtf at ", i, j, x);
          if (!isFinite(x)) {
            console.error("Non-finite at", i, j, x);
            return true;
          }
        }
      }
      return false;
    }

    function diffuse_bad(N, x, x0, diff, dt) {
      let a = dt * diff * N * N;
      for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= N; j++) {
          x[i][j] =
            x0[i][j] +
            a *
              (x0[i - 1][j] +
                x0[i + 1][j] +
                x0[i][j - 1] +
                x0[i][j + 1] -
                4 * x0[i][j]);
        }
      }
      set_bnd(N, x);
    }

    function diffuse_good(N, x, x0, diff, dt) {
      let a = dt * diff * N * N;
      for (let k = 0; k < 20; k++) {
        for (let i = 1; i <= N; i++) {
          for (let j = 1; j <= N; j++) {
            x[i][j] =
              (x0[i][j] +
                a * (x[i - 1][j] + x[i + 1][j] + x[i][j - 1] + x[i][j + 1])) /
              (1 + 4 * a);
          }
        }
        set_bnd(N, x);
      }
    }

    // we assume that grid bounds are walls, no fluid should exit them
    // assume continuity for density along the borders of the grid
    // the routines in the simulator (like diffuse) never write on the borders i.e i = 0 / N+1
    // we just say that the values are the same as what's inside
    // other boundary conditions are of course possible
    function set_bnd(N, x) {
      for (let i = 1; i <= N; i++) {
        x[0][i] = x[1][i]; // all values in first row are the same as the second row
        x[N + 1][i] = x[N][i]; // values in last row are the same as the penultimum row
        x[i][0] = x[i][1]; // values in first column are the same as the second column
        x[i][N + 1] = x[i][N]; // values in last column are the same as the penultimum column
      }

      // values in the corner of the grid are the average between what's in the adjacent cells row/column
      x[0][0] = 0.5 * (x[1][0] + x[0][1]);
      x[0][N + 1] = 0.5 * (x[1][N + 1] + x[0][N]);
      x[N + 1][0] = 0.5 * (x[N][0] + x[N + 1][1]);
      x[N + 1][N + 1] = 0.5 * (x[N][N + 1] + x[N + 1][N]);
    }

    function computeVelocityField() {
      velX = new Array(N + 2);
      velY = new Array(N + 2);
      maxVelMag = 0;
      for (let i = 0; i <= N + 1; i++) {
        velX[i] = new Array(N + 2).fill(0);
        velY[i] = new Array(N + 2).fill(0);
      }
      // set velocity field values;
      // offset so that center of grid is at (0,0)
      // divide by N so velocity magnitudes are in [0,1]
      // i.e 0.2 means covering 20% of domain per second
      let halfN = Math.ceil(config.numberOfCells / 2);
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          // velX[i][j] = 0.1 * (i - halfN) + 0.01;
          // velY[i][j] = 0;
          velX[i][j] = 0.5 * (i - halfN) + 0.01;
          velY[i][j] = -0.5 * (j - halfN) + 0.01;
          // velX[i][j] = 1; // positive x goes from top to bottom cause i is rows i = 0 is top row i = N+1 is bottom row
          // velY[i][j] = 0; // positive y goes from left to right cause j = 0 is leftmost column j = N+1 is rightmost column
        }
      }
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          let velMag = Math.sqrt(
            velX[i][j] * velX[i][j] + velY[i][j] * velY[i][j]
          );
          if (velMag > maxVelMag) maxVelMag = velMag;
        }
      }
    }

    function advect() {
      let dt = p.deltaTime * 0.001;
      for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= N; j++) {
          // compute "particle" position at previous time step
          let x = i - dt * velY[i][j];
          let y = j - dt * velX[i][j];
          // console.log(
          //   `i ${i} j ${j} vx ${velX[i][j].toFixed(3)} vy ${velY[i][j].toFixed(
          //     3
          //   )}`
          // );
          // enforce bounds, so no interpolation goes outside grid
          if (x < 0.5) x = 0.5;
          if (x > N + 0.5) x = N + 0.5;
          if (y < 0.5) y = 0.5;
          if (y > N + 0.5) y = N + 0.5;
          // cell indexes
          let i0 = Math.floor(x);
          let j0 = Math.floor(y);
          let i1 = i0 + 1; // right cell index
          let j1 = j0 + 1; // upper cell index

          // fractioal parts for interpolation
          let s1 = x - i0;
          let s0 = 1 - s1;
          let t1 = y - j0;
          let t0 = 1 - t1;

          // bilinear interpolation
          dens[i][j] =
            s0 * (t0 * dens_prev[i0][j0] + t1 * dens_prev[i0][j1]) +
            s1 * (t0 * dens_prev[i1][j0] + t1 * dens_prev[i1][j1]);
        }
      }
      set_bnd(N, dens);
    }
    function drawVelocityField(velX, velY, maxVelMag) {
      let h = cellSize;
      for (let i = 0; i <= N + 1; i++) {
        for (let j = 0; j <= N + 1; j++) {
          let velMag = Math.sqrt(
            velX[i][j] * velX[i][j] + velY[i][j] * velY[i][j]
          );
          // avoid divide-by-zero when maxVelMag is 0
          let t = maxVelMag > 0 ? velMag / maxVelMag : 0;
          let triangleColor = p.lerpColor(
            p.color(84, 241, 243),
            p.color(243, 86, 84),
            t
          );
          p.fill(triangleColor);

          // center of the cell: xi = i*h + h/2, yi = j*h + h/2
          let cx = i * h + h / 2;
          let cy = j * h + h / 2;

          // base triangle pointing "up" (local coordinates)
          let x1 = cx - h / 6,
            y1 = cy + h / 3; // left-bottom
          let x2 = cx + h / 6,
            y2 = cy + h / 3; // right-bottom
          let x3 = cx,
            y3 = cy - h / 3; // top

          // do atan x,y rather than y,x cause x is i going from top to bottom and y is j going from left to right
          let angle = Math.atan2(velX[i][j], velY[i][j]) + Math.PI / 2; // +90 degrees cause we defined initial triangle pointing up
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
        }
      }
    }
  });
}
