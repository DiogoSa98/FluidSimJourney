// function createDiffusionSim(containerId, options = {}) {
//   const config = {
//     canvasSize: options.canvasSize || 400,
//     numberOfCells: options.numberOfCells || 20,
//     useDiffuseBad: options.useDiffuseBad || false,
//     useVelocityField: options.useVelocityField || false,
//     useVelocityStep: options.useVelocityStep || false,
//   };

//   // Create DOM structure inside this container
//   const container = document.querySelector(`#${containerId}`);
//   container.innerHTML = `
//     <div class="sketch-container">
//       <div class="sketch-canvas-container">
//         <div class="sketch-buttons-container"></div>
//       </div>
//       <div class="sketch-parameters-container"></div>
//     </div>
//   `;

//   // Create p5 instance scoped to this simulation
//   let pSim = new p5((p) => {
//     let N = config.numberOfCells - 2; // number of interior cells along one dimension
//     let dens = [];
//     let dens_prev = [];
//     let canvasSize = config.canvasSize;
//     let cellSize = canvasSize / config.numberOfCells;
//     let simPlaying = false;

//     let playBtn, diffSlider;
//     // let diffuse = 0.001;
//     let diffuse = 0.0;
//     // let visc = 0.00001;
//     let visc = 0.0;
//     let diffValue;

//     let isMousePressed = false;

//     let velX = [];
//     let velY = [];
//     let velX_prev = [];
//     let velY_prev = [];
//     let maxVelMag = 0;

//     p.setup = function () {
//       let cnv = p.createCanvas(canvasSize, canvasSize);
//       // cnv.parent("sketch-canvas-container");
//       cnv.parent(
//         document.querySelector(`#${container.id} .sketch-canvas-container`)
//       );
//       cnv.mouse;
//       p.frameRate(30);

//       reset_cells();
//       // Create simulation controls
//       var buttonsParent = document.querySelector(
//         `#${container.id} .sketch-buttons-container`
//       );
//       playBtn = p
//         .createButton('<i class="bi bi-play-fill"></i>')
//         .parent(buttonsParent)
//         .mousePressed(togglePlay);
//       p.createButton('<i class="bi bi-skip-forward-fill"></i>')
//         .parent(buttonsParent)
//         .mousePressed(sim_loop_step);
//       p.createButton('<i class="bi bi-arrow-repeat"></i>')
//         .parent(buttonsParent)
//         .mousePressed(reset_cells);

//       let diffContainer = p
//         .createDiv()
//         .parent(
//           document.querySelector(
//             `#${container.id} .sketch-parameters-container`
//           )
//         );

//       p.createSpan("Diffuse:").parent(diffContainer);
//       diffSlider = p
//         .createSlider(0, 0.03, diffuse, 0.001)
//         .class("slider")
//         .parent(diffContainer);
//       diffValue = p.createSpan(p.nf(diffuse, 1, 3)).parent(diffContainer);

//       /*p.createSpan("Visc:").parent(diffContainer);
//       diffSlider = p
//         .createSlider(0, 0.1, visc, 0.0001)
//         .class("slider")
//         .parent(diffContainer);
//       diffValue = p.createSpan(p.nf(visc, 1, 3)).parent(diffContainer);*/
//     };

//     function togglePlay() {
//       simPlaying = !simPlaying;
//       if (simPlaying) {
//         playBtn.html('<i class="bi bi-pause-fill"></i>');
//       } else {
//         playBtn.html('<i class="bi bi-play-fill"></i>');
//       }
//     }

//     p.mousePressed = function () {
//       isMousePressed = true;
//     };
//     p.mouseReleased = function () {
//       isMousePressed = false;
//     };

//     function AddDensityOnCellClick() {
//       let cellI = Math.floor(p.mouseX / cellSize);
//       let cellJ = Math.floor(p.mouseY / cellSize);
//       // console.log(`i ${cellI} j ${cellJ}`);
//       // allow adding density on the interior cells 1..N
//       if (cellI > 0 && cellI <= N && cellJ > 0 && cellJ <= N) {
//         dens[cellI][cellJ] = 1;
//       }
//     }

//     function reset_cells() {
//       // initialize cells at color/density 0
//       // we need arrays indexed 0..N+1, so inner arrays must have length N+2
//       dens = new Array(N + 2);
//       dens_prev = new Array(N + 2);
//       for (let i = 0; i <= N + 1; i++) {
//         dens[i] = new Array(N + 2).fill(0);
//         dens_prev[i] = new Array(N + 2).fill(0);
//       }

//       // also reset velocity field
//       // computeVelocityField();
//     }

//     p.draw = function () {
//       /*p.background(0);

//       if (isMousePressed) {
//         AddDensityOnCellClick(); // writes on dens
//       }
//       if (simPlaying) {
//         sim_loop_step();
//       }

//       // update sketch parameters
//       diffuse = diffSlider.value();
//       diffValue.html(p.nf(diffuse, 1, 3));

//       // draw the density cells
//       p.noStroke();
//       for (let i = 0; i <= N + 1; i++) {
//         for (let j = 0; j <= N + 1; j++) {
//           let fillC = p.lerp(0, 255, dens[i][j]);
//           p.fill(fillC, fillC, fillC);
//           p.rect(i * cellSize, j * cellSize, cellSize, cellSize);
//         }
//       }

//       // draw grid lines
//       p.stroke(120); // gray lines
//       p.strokeWeight(0.7);
//       for (let i = 0; i <= N + 2; i++) {
//         p.line(i * cellSize, 0, i * cellSize, canvasSize); // vertical lines
//         p.line(0, i * cellSize, canvasSize, i * cellSize); // horizontal lines
//       }

//       if (config.useVelocityField) {
//         p.strokeWeight(0);
//         drawVelocityField(velX, velY, maxVelMag);
//       }*/
//     };

//     function sim_loop_step(dt) {
//       // get from UI u_prev, v_prev, dens_prev, visc, diffuse
//       // dt = p.deltaTime * 0.001; // convert ms to seconds
//       // dt = Math.min(dt, 0.02);

//       if (config.useVelocityStep) {
//         vel_step(visc, dt);
//       }

//       dens_step(velX, velY, diffuse, dt);
//       // draw dens after
//     }

//     function computeEnergy(u, v) {
//       let e = 0;
//       for (let i = 1; i <= N; i++)
//         for (let j = 1; j <= N; j++) e += u[i][j] * u[i][j] + v[i][j] * v[i][j];
//       return e;
//     }
//     function computeMaxDivergence(u, v) {
//       const h = 1.0 / N;
//       let maxd = 0;
//       for (let i = 1; i <= N; i++) {
//         for (let j = 1; j <= N; j++) {
//           const d =
//             (u[i + 1][j] - u[i - 1][j] + v[i][j + 1] - v[i][j - 1]) / (2 * h);
//           if (Math.abs(d) > maxd) maxd = Math.abs(d);
//         }
//       }
//       return maxd;
//     }

//     function vel_step(visc, dt) {
//       add_source(u, u0, dt);
//       add_source(v, v0, dt);

//       [velX_prev, velX] = [velX, velX_prev];
//       diffuse_good(1, velX, velX_prev, visc, dt);
//       [velY_prev, velY] = [velY, velY_prev];
//       diffuse_good(2, velY, velY_prev, visc, dt);

//       console.log("energy before proj 111111111", computeEnergy(velX, velY));
//       project(velX, velY, velX_prev, velY_prev);
//       console.log("energy after proj", computeEnergy(velX, velY));

//       [velX_prev, velX] = [velX, velX_prev];
//       [velY_prev, velY] = [velY, velY_prev];
//       advect(1, velX, velX_prev, velX_prev, velY_prev, dt);
//       advect(2, velY, velY_prev, velX_prev, velY_prev, dt);

//       console.log("energy before proj 22222222", computeEnergy(velX, velY));
//       console.log(
//         "max div before",
//         computeMaxDivergence(velX, velY).toFixed(6)
//       );

//       project(velX, velY, velX_prev, velY_prev);

//       console.log("energy after proj", computeEnergy(velX, velY));
//       // console.log("max div after", computeMaxDivergence(velX, velY).toFixed(6));
//     }

//     function add_source(x, s, dt) {
//       for (let i = 0; i <= N + 1; i++) {
//         for (let j = 0; j <= N + 1; j++) {
//           x[i][j] += dt * s[i][j];
//         }
//       }
//     }
//     function dens_step(u, v, diff, dt) {
//       add_source(x, x0, dt);

//       [dens_prev, dens] = [dens, dens_prev];

//       if (config.useDiffuseBad) {
//         diffuse_bad(0, dens, dens_prev, diff, dt);
//       } else {
//         diffuse_good(0, dens, dens_prev, diff, dt);
//       }

//       if (config.useVelocityField) {
//         [dens_prev, dens] = [dens, dens_prev];
//         advect(0, dens, dens_prev, u, v, dt);
//       }
//     }

//     function SanityCheck(x0) {
//       for (let i = 0; i <= N + 1; i++) {
//         for (let j = 0; j <= N + 1; j++) {
//           let x = x0[i][j];
//           if (x < 0 || x > 1) console.log("wtf at ", i, j, x);
//           if (!isFinite(x)) {
//             console.error("Non-finite at", i, j, x);
//             return true;
//           }
//         }
//       }
//       return false;
//     }

//     function diffuse_bad(b, x, x0, diff, dt) {
//       let a = dt * diff * N * N;
//       for (let i = 1; i <= N; i++) {
//         for (let j = 1; j <= N; j++) {
//           x[i][j] =
//             x0[i][j] +
//             a *
//               (x0[i - 1][j] +
//                 x0[i + 1][j] +
//                 x0[i][j - 1] +
//                 x0[i][j + 1] -
//                 4 * x0[i][j]);
//         }
//       }
//       set_bnd(b, x);
//     }

//     function diffuse_good(b, x, x0, diff, dt) {
//       let a = dt * diff * N * N;
//       for (let k = 0; k < 20; k++) {
//         for (let i = 1; i <= N; i++) {
//           for (let j = 1; j <= N; j++) {
//             x[i][j] =
//               (x0[i][j] +
//                 a * (x[i - 1][j] + x[i + 1][j] + x[i][j - 1] + x[i][j + 1])) /
//               (1 + 4 * a);
//           }
//         }
//         set_bnd(b, x);
//         // set_bnd_divFree(x);
//         // set_bnd_periodic(x);
//       }
//     }

//     // we assume that grid bounds are walls, no fluid should exit them
//     // assume continuity for density along the borders of the grid
//     // the routines in the simulator (like diffuse) never write on the borders i.e i = 0 / N+1
//     // we just say that the values are the same as what's inside
//     // other boundary conditions are of course possible
//     function set_bnd(b, x) {
//       for (let i = 1; i <= N; i++) {
//         x[0][i] = b == 1 ? -x[1][i] : x[1][i]; // all values in first row are the same as the second row
//         x[N + 1][i] = b == 1 ? -x[N][i] : x[N][i]; // values in last row are the same as the penultimum row
//         x[i][0] = b == 2 ? -x[i][1] : x[i][1]; // values in first column are the same as the second column
//         x[i][N + 1] = b == 2 ? -x[i][N] : x[i][N]; // values in last column are the same as the penultimum column
//       }

//       // values in the corner of the grid are the average between what's in the adjacent cells row/column
//       x[0][0] = 0.5 * (x[1][0] + x[0][1]);
//       x[0][N + 1] = 0.5 * (x[1][N + 1] + x[0][N]);
//       x[N + 1][0] = 0.5 * (x[N][0] + x[N + 1][1]);
//       x[N + 1][N + 1] = 0.5 * (x[N][N + 1] + x[N + 1][N]);
//     }
//     function set_bnd_periodic(x) {
//       for (let i = 1; i <= N; i++) {
//         x[0][i] = x[N][i];
//         x[N + 1][i] = x[1][i];
//         x[i][0] = x[i][N];
//         x[i][N + 1] = x[i][1];
//       }
//       x[0][0] = x[N][N];
//       x[0][N + 1] = x[N][1];
//       x[N + 1][0] = x[1][N];
//       x[N + 1][N + 1] = x[1][1];
//     }
//     // I don't see why this is div free actually....
//     function set_bnd_divFree(x) {
//       // Simply copy interior values to the boundaries
//       for (let i = 1; i <= N; i++) {
//         x[0][i] = x[1][i]; // bottom row
//         x[N + 1][i] = x[N][i]; // top row
//         x[i][0] = x[i][1]; // left column
//         x[i][N + 1] = x[i][N]; // right column
//       }
//       // corners
//       x[0][0] = x[1][1];
//       x[0][N + 1] = x[1][N];
//       x[N + 1][0] = x[N][1];
//       x[N + 1][N + 1] = x[N][N];
//     }
//     function computeVelocityField() {
//       velX = new Array(N + 2);
//       velY = new Array(N + 2);
//       velX_prev = new Array(N + 2);
//       velY_prev = new Array(N + 2);
//       maxVelMag = 0;
//       for (let i = 0; i <= N + 1; i++) {
//         velX[i] = new Array(N + 2).fill(0);
//         velY[i] = new Array(N + 2).fill(0);
//         velX_prev[i] = new Array(N + 2).fill(0);
//         velY_prev[i] = new Array(N + 2).fill(0);
//       }
//       // set velocity field values;
//       // offset so that center of grid is at (0,0)
//       // divide by N so velocity magnitudes are in [0,1]
//       // i.e 0.2 means covering 20% of domain per second
//       let halfN = Math.ceil(config.numberOfCells / 2);
//       for (let i = 0; i <= N + 1; i++) {
//         for (let j = 0; j <= N + 1; j++) {
//           // periodic vel field so periodic boundary doesn't introduce divergence.
//           // velX[i][j] =
//           //   Math.sin((2 * Math.PI * i) / config.numberOfCells) *
//           //   Math.sin((2 * Math.PI * j) / config.numberOfCells) *
//           //   1.1;
//           // velY[i][j] =
//           //   Math.cos((2 * Math.PI * i) / config.numberOfCells) *
//           //   Math.cos((2 * Math.PI * j) / config.numberOfCells) *
//           //   1.1;
//           // circular vel field
//           // velX[i][j] = 0.5 * (i - halfN) + 0.01;
//           // velY[i][j] = -0.5 * (j - halfN) + 0.01;
//           if (i > 5 && i < N - 5 && j > 5 && j < N - 5) {
//             velX[i][j] = (0.5 * (i - halfN) + 0.01) * 50;
//             velY[i][j] = (-0.5 * (j - halfN) + 0.01) * 50;
//           } else {
//             velX[i][j] = 0.0001;
//             velY[i][j] = 0.0001;
//           }

//           // velX[i][j] = 1; // positive x goes from top to bottom cause i is rows i = 0 is top row i = N+1 is bottom row
//           // velY[i][j] = 0; // positive y goes from left to right cause j = 0 is leftmost column j = N+1 is rightmost column
//         }
//       }
//       for (let i = 0; i <= N + 1; i++) {
//         for (let j = 0; j <= N + 1; j++) {
//           let velMag = Math.sqrt(
//             velX[i][j] * velX[i][j] + velY[i][j] * velY[i][j]
//           );
//           if (velMag > maxVelMag) maxVelMag = velMag;
//         }
//       }
//     }

//     function advect(b, d, d0, u, v, dt) {
//       for (let i = 1; i <= N; i++) {
//         for (let j = 1; j <= N; j++) {
//           // compute "particle" position at previous time step
//           let x = i - dt * u[i][j];
//           let y = j - dt * v[i][j];
//           // console.log(
//           //   `i ${i} j ${j} vx ${velX[i][j].toFixed(3)} vy ${velY[i][j].toFixed(
//           //     3
//           //   )}`
//           // );
//           // enforce bounds, so no interpolation goes outside grid
//           if (x < 0.5) x = 0.5;
//           if (x > N + 0.5) x = N + 0.5;
//           if (y < 0.5) y = 0.5;
//           if (y > N + 0.5) y = N + 0.5;
//           // cell indexes
//           let i0 = Math.floor(x);
//           let j0 = Math.floor(y);
//           let i1 = i0 + 1; // right cell index
//           let j1 = j0 + 1; // upper cell index

//           // fractioal parts for interpolation
//           let s1 = x - i0;
//           let s0 = 1 - s1;
//           let t1 = y - j0;
//           let t0 = 1 - t1;

//           // bilinear interpolation
//           d[i][j] =
//             s0 * (t0 * d0[i0][j0] + t1 * d0[i0][j1]) +
//             s1 * (t0 * d0[i1][j0] + t1 * d0[i1][j1]);
//         }
//       }
//       // set_bnd(b, d);
//       // set_bnd_divFree(d);
//       set_bnd_periodic(d);
//     }
//     function drawVelocityField(velX, velY, maxVelMag) {
//       let h = cellSize;
//       for (let i = 0; i <= N + 1; i++) {
//         for (let j = 0; j <= N + 1; j++) {
//           let velMag = Math.sqrt(
//             velX[i][j] * velX[i][j] + velY[i][j] * velY[i][j]
//           );
//           // avoid divide-by-zero when maxVelMag is 0
//           let t = maxVelMag > 0 ? velMag / maxVelMag : 0;
//           let triangleColor = p.lerpColor(
//             p.color(84, 241, 243),
//             p.color(243, 86, 84),
//             t
//           );
//           p.fill(triangleColor);

//           // center of the cell: xi = i*h + h/2, yi = j*h + h/2
//           let cx = i * h + h / 2;
//           let cy = j * h + h / 2;

//           // base triangle pointing "up" (local coordinates)
//           let x1 = cx - h / 6,
//             y1 = cy + h / 3; // left-bottom
//           let x2 = cx + h / 6,
//             y2 = cy + h / 3; // right-bottom
//           let x3 = cx,
//             y3 = cy - h / 3; // top

//           let angle = Math.atan2(velY[i][j], velX[i][j]) + Math.PI / 2; // +90 degrees cause we defined initial triangle pointing up
//           let c = Math.cos(angle),
//             s = Math.sin(angle);
//           function rot(px, py) {
//             let dx = px - cx,
//               dy = py - cy;
//             return [cx + dx * c - dy * s, cy + dx * s + dy * c];
//           }
//           let [rx1, ry1] = rot(x1, y1);
//           let [rx2, ry2] = rot(x2, y2);
//           let [rx3, ry3] = rot(x3, y3);
//           p.triangle(rx1, ry1, rx2, ry2, rx3, ry3);
//         }
//       }
//     }

//     function project(u, v, p, div) {
//       h = 1 / N;
//       // compute -h^2 div of velocity field and initialize pressure field to 0
//       for (let i = 1; i <= N; i++) {
//         for (let j = 1; j <= N; j++) {
//           div[i][j] =
//             -0.5 * h * (u[i + 1][j] - u[i - 1][j] + v[i][j + 1] - v[i][j - 1]);
//           p[i][j] = 0;
//           // console.log("divergence", div[i][j].toFixed(6));
//         }
//       }
//       // set_bnd(0, div);
//       // set_bnd(0, p);
//       // set_bnd_divFree(div);
//       // set_bnd_divFree(p);
//       set_bnd_periodic(div);
//       set_bnd_periodic(p);

//       // solve the Poisson equation for the pressure field
//       for (let k = 0; k < 20; k++) {
//         for (let i = 1; i <= N; i++) {
//           for (let j = 1; j <= N; j++) {
//             p[i][j] =
//               (div[i][j] +
//                 p[i - 1][j] +
//                 p[i + 1][j] +
//                 p[i][j - 1] +
//                 p[i][j + 1]) /
//               4;
//           }
//         }
//         // set_bnd(0, p);
//         // set_bnd_divFree(p);
//         set_bnd_periodic(p);

//         if (k % 20 === 0) {
//           // compute energy after applying current p (simulate subtracting grad p but cheaper: compute residual)
//           let maxP = 0;
//           for (let ii = 1; ii <= N; ii++)
//             for (let jj = 1; jj <= N; jj++)
//               maxP = Math.max(maxP, Math.abs(p[ii][jj]));
//           // console.log("poisson iter", k, "max|p|", maxP.toFixed(6));
//         }
//       }

//       // subtract pressure gradient from velocity field to get divergence-free field
//       for (let i = 1; i <= N; i++) {
//         for (let j = 1; j <= N; j++) {
//           // console.log(
//           //   "p",
//           //   p[i][j].toFixed(6),
//           //   "gradx",
//           //   ((p[i + 1][j] - p[i - 1][j]) / (2 * h)).toFixed(6),
//           //   "grady",
//           //   ((p[i][j + 1] - p[i][j - 1]) / (2 * h)).toFixed(6)
//           // );
//           u[i][j] -= (0.5 * (p[i + 1][j] - p[i - 1][j])) / h;
//           v[i][j] -= (0.5 * (p[i][j + 1] - p[i][j - 1])) / h;
//         }
//       }

//       console.log(
//         "max div after pre boundary",
//         computeMaxDivergence(u, v).toFixed(6)
//       );

//       // set_bnd(1, u);
//       // set_bnd(2, v);
//       // set_bnd_divFree(u);
//       // set_bnd_divFree(v);
//       set_bnd_periodic(u);
//       set_bnd_periodic(v);

//       console.log(
//         "max div after post boundary",
//         computeMaxDivergence(u, v).toFixed(6)
//       );
//     }

//     function addDensity(x, y, dd) {
//       this.dens_prev[x][y] += dd;
//     }
//     function addForce(x, y, fx, fy) {
//       this.velX_prev[x][y] += fx;
//       this.velY_prev[x][y] += fy;
//     }

//     function densityAt(x, y) {
//       return this.dens[x][y];
//     }

//     function velocityAt(x, y) {
//       return [velX[x][y], velY[x][y]];
//     }
//   });
// }

// // https://github.com/nornagon/stam-stable-fluids/blob/main/index.js

// /*
//   ======================================================================
//    solver03.c --- simple fluid solver
//   ----------------------------------------------------------------------
//    Author : Jos Stam (jstam@aw.sgi.com)
//    Creation Date : Jan 9 2003

//    Description:

//   This code is a simple prototype that demonstrates how to use the
//   code provided in my GDC2003 paper entitles "Real-Time Fluid Dynamics
//   for Games". This code uses OpenGL and GLUT for graphics and interface

//   =======================================================================
// */

// const size = 18;
// const f = new Fluid(size);
// for (let y = 0; y < size; y++)
//   for (let x = 0; x < size / 2; x++) f.addDensity(x, y, 10);
// for (let y = 0; y < size; y++) f.addForce(10, y, 10, 0);
// f.step(1 / 30);

// const [vx, vy] = f.velocityAt(0, 0);
// const d = f.densityAt(0, 0);

// //<script src="scripts/density-sketch.js"></script>;
// let sim = createDiffusionSim("velocity-sim", {
//   useVelocityField: true,
//   useVelocityStep: true,
// }).pSim;
// for (let y = 0; y < size; y++)
//   for (let x = 0; x < size / 2; x++) sim.addDensity(x, y, 10);
// for (let y = 0; y < size; y++) sim.addForce(10, y, 10, 0);
// sim.sim_loop_step(1 / 30);
