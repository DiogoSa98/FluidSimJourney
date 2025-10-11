const N = 20;
let size = N * N;
let dens = [];
let dens_prev = [];
let canvasSize = 300;
let cellSize = canvasSize / N;
let simPlaying = false;

let playBtn, diffSlider;
let diffuse = 0.001;
let slider;

function setup() {
  let cnv = createCanvas(canvasSize, canvasSize);
  cnv.parent("sketch-canvas-container");
  cnv.mouse;
  frameRate(30);

  reset_cells();

  // Create simulation controls
  playBtn = createButton('<i class="bi bi-play-fill"></i>')
    .parent("sketch-buttons-container")
    .mousePressed(togglePlay);
  createButton('<i class="bi bi-skip-forward-fill"></i>')
    .parent("sketch-buttons-container")
    .mousePressed(step_diffuse);
  createButton('<i class="bi bi-arrow-repeat"></i>')
    .parent("sketch-buttons-container")
    .mousePressed(reset_cells);

  let diffContainer = createDiv().parent("sketch-parameters-container");

  createSpan("Diffuse:").parent(diffContainer);
  diffSlider = createSlider(0, 0.01 * 4, diffuse, 0.001)
    .class("slider")
    .parent(diffContainer);
  diffValue = createSpan(nf(diffuse, 1, 3)).parent(diffContainer);
}

function togglePlay() {
  simPlaying = !simPlaying;
  if (simPlaying) {
    playBtn.html('<i class="bi bi-pause-fill"></i>');
  } else {
    playBtn.html('<i class="bi bi-play-fill"></i>');
  }
}

function mouseDragged() {
  AddDensityOnCellClick();
}

function AddDensityOnCellClick() {
  cellI = Math.floor(mouseX / cellSize);
  cellJ = Math.floor(mouseY / cellSize);
  if (cellI > 0 && cellI < N - 1 && cellJ > 0 && cellJ < N - 1) {
    dens[cellI][cellJ] = 1;
  }
}

function reset_cells() {
  // initialize cells at color/density 0
  for (let i = 1; i < N - 1; i++) {
    dens[i] = Array(N - 1).fill(0);
    dens_prev[i] = Array(N - 1).fill(0);
  }
}

function draw() {
  background(0);
  if (simPlaying) step_diffuse();

  // update sketch parameters
  diffuse = diffSlider.value();
  diffValue.html(nf(diffuse, 1, 3));

  // draw the density cells
  noStroke();
  for (let i = 1; i < N - 1; i++) {
    for (let j = 1; j < N - 1; j++) {
      let fillC = lerp(0, 255, dens[i][j]);
      fill(fillC, fillC, fillC);
      rect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }

  // draw grid lines
  stroke(150); // gray lines
  strokeWeight(1);
  for (let i = 0; i <= N; i++) {
    line(i * cellSize, 0, i * cellSize, canvasSize); // vertical lines
    line(0, i * cellSize, canvasSize, i * cellSize); // horizontal lines
  }
}

function step_diffuse() {
  // update density diffusion step
  diffuse_bad(N, 0, dens, dens_prev, diffuse, deltaTime * 0.001);

  // swap for the next iteration
  dens_prev = dens;
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
    for (let i = 1; i < N; i++) {
      for (let j = 1; j < N; j++) {
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
