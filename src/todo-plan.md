# High-level recommendation (short)

1.  **Keep it practical & iterative.** Prototype and validate in 2D first, then move to 3D.
2.  **Switch to a MAC (staggered) grid next.** The payoff for projection, divergence/gradients and boundary handling is huge.
3.  **Upgrade advection next (RK2/MacCormack + better interpolation).** That fixes most visual-smearing issues.
4.  **Measure, don’t guess.** Add residual/divergence/energy diagnostics and use them to compare algorithms (Gauss-Seidel vs PCG vs multigrid).
5.  **When stable and reasonably fast in CPU/JS, port bottlenecks to GPU (compute shaders or Unity compute).**

---

# Why that order?

- **MAC grid** fixes many subtle discretization problems (pressure/grad/divergence accuracy) and makes boundaries much easier to specify correctly. It will reduce the kind of “mysterious” behavior you’ve been chasing.
- **Better advection** (RK2 / MacCormack with cubic interpolation) directly reduces numerical diffusion — the main visual complaint for smoke — and is relatively simple to implement & test on top of MAC.
- **Projection solver improvements** (stop/compare GS, SOR, PCG) are important, but PCG or multigrid are bigger changes. Start with GS/SOR while you verify your MAC grid and advection are doing what you expect.

---

# Concrete roadmap & experiments (step-by-step)

## Phase A — Sanity & verification (2D)

1.  **Add unit diagnostics everywhere**

    - Track `energy = Σ(u²+v²)`, `max_div = max|div|`, and `pressure_residual = ||b - A p||` after your Poisson solver iterations.
    - Log them from every major stage: after advection, after diffusion, after project (pre/post boundary). Use these to make charts over frames.

2.  **Implement MAC (staggered) grid (2D)**

    - Store `p[i][j]` at cell centers, `u[i+1/2][j]` at vertical faces, `v[i][j+1/2]` at horizontal faces.
    - Implement consistent divergence: `div_i_j = (u[i+1/2,j]-u[i-1/2,j] + v[i,j+1/2]-v[i,j-1/2]) / h`.
    - Implement gradient of pressure to subtract from face velocities using centered differences at faces.
    - Re-run your project-only tests (constant velocity, analytic divergence free fields). `max_div` should start near the roundoff of calculations, not large.

3.  **Controlled analytic tests**

    - Test with constant fields (u=1 everywhere), swirl fields, and sin/cos fields. For each case check energy & divergence before/after `project`.
    - Use _both_ periodic and solid-wall boundary cases; make sure you know expected behaviors.

4.  **Add RK2 backtrace advection**

    - Replace simple semi-Lagrangian backtrace with RK2 (midpoint). Keep linear interpolation at first.
    - Clamp dt by CFL: `Δt ≤ C * Δx / umax` with C ~ 0.5 to start. Optionally do local substepping in high-velocity spots.
    - Test advection-only: advect a sharp bump and check for distortion / smearing.

5.  **Add MacCormack (optional after RK2)**

    - MacCormack greatly reduces diffusion (two-step predictor / corrector + limiter to avoid overshoots). Implement if RK2 still softens features too much.

6.  **Upgrade interpolation**

    - Implement cubic (or cubic Catmull-Rom) interpolation for sampling grid values. Compare linear vs cubic for a transported sharp triangle. Expect far less smoothing.

## Phase B — Pressure solve & boundaries

7.  **Make a residual monitor in Poisson solver**

    - Compute residual `r = b - A p` and `norm(r)` each iteration. Stop either by iterations or target residual (e.g. `norm(r)/norm(b) < 1e-6`).
    - Compare Gauss-Seidel (GS) vs SOR (tune ω) vs Preconditioned Conjugate Gradient (PCG). For small grids GS/SOR is fine; for larger, PCG/multigrid wins.

8.  **Boundary conditions**

    - Implement **ghost-cell** boundary handling carefully for MAC. For solid walls enforce `u·n = usolid·n` at face centers (so face velocities on boundary are set accordingly). For pressure, set Neumann or Dirichlet depending on solid/free-surface.
    - Test boundaries in isolation: start with an analytic divergence-free field and apply boundary-conditions functions — check that they do not introduce divergence in interior (compute `max_div` before/after set_bnd).

9.  **Compare with known implementation**

    - Use the `stam-stable-fluids` library you found as a ground truth: run the same init + step and compare snapshot arrays (or L2 error) for density and velocity after N steps.

## Phase C — Stability & performance, then GPU/Unity

10. **If everything is stable & matching, profile hotspots**


    -   Which routines dominate? (advection sampling, Poisson solves, boundary updates)


11. **If targeting Unity/GPU**


    -   Move advection and diffusion kernels to compute-shaders (ping-pong textures / RWTextures). Use 2D/3D textures for volume.

    -   For 3D, store face velocities in appropriately shaped textures (u,v,w), be careful with memory layout and halo cells.


12. **Rendering**


    -   For smoke: render density volumes by raymarching (post-process shader using same 3D texture). For liquid: use level-set + mesh extraction (Marching Cubes) or raymarched surface from level-set.


---

# Specific choices & pros/cons you mentioned

- **NVIDIA GPU Gems (old but pragmatic)**

  - Pros: detailed GPU pragmatics, recipes that work in real-time. Good for getting a GPU pipeline running quickly.
  - Cons: uses older advection/filters; may be visually less accurate than Bridson/modern approaches unless you swap in MacCormack/less-diffusive schemes.

- **Bridson / Fluid Simulation Book** (theory-heavy)

  - Pros: best practice algorithms (MAC, staggered grid details, PCG/IC, FLIP/PIC explanation). Better long-term foundation.
  - Cons: denser math, longer to implement.

**My suggestion:** use the Bridson book as your algorithmic reference (MAC, RK, MacCormack, level sets, FLIP concepts) and use Nvidia for GPU implementation tips once you port.

---

# Obstacles & SDFs / dynamic meshes / skinned meshes

- For _static_ obstacles: voxelize once into the grid or compute SDF on CPU/GPU into your grid (fast-sweep).
- For _moving_ or _skinned_ meshes:

  - Option A (simple): approximate moving surface with simple primitives (boxes/spheres/ capsules) or joint-based SDFs.
  - Option B (accurate): rasterize/voxelize mesh each frame into grid using GPU (triangle rasterization -> 3D stencil). This is what GPU Gems authors do; it’s more work, but doable with compute shaders.
  - Option C (hybrid): represent nearest obstacle as a set of SDFs or use particles for interactions near moving skin.

- For learning, **start with simple moving boxes / SDF primitives**, then move to voxelization if needed.

---

# Pressure solver: quick practical guidance

- Start with Gauss-Seidel (20–80 relaxations) and measure residual.
- If you want faster convergence for larger grids, implement **PCG** (conjugate gradient) with **Jacobi** preconditioner first (simple), then try IC(0) preconditioning or use an existing numeric library.
- Multigrid is the fastest but a bigger implementation effort; consider offloading this to a library or implement at a later stage.

---

# FLIP / PIC hybrids

- FLIP avoids overdamping and preserves small-scale features by transferring velocity increments between particles and grid. It's more complex but standard for artist-friendly liquid sims (Houdini).
- If your interest becomes liquids / splashes, look into **FLIP + level-set** (Bridson book has details). For smoke, Eulerian advection improvements + MacCormack + cubic interpolation are usually enough.

---

# Debugging checklist (when things go wrong)

1.  **Check units & h/dt consistency** (you already did this — keep it!).
2.  **Make tiny analytic tests** (constant field, sine field): divergence should be near-zero after project.
3.  **Compare pre/post boundary `max_div`.** If boundary application changes divergence drastically, the boundary routine is wrong. On MAC, face-centered velocities are easiest to enforce `u·n`.
4.  **Residual trace** inside Poisson solver: log `||r||` each iteration — does it reduce? If not, A is wrong or boundary handling in p is wrong.
5.  **Visualize p, div, grad(p), and intermediate arrays** as heatmaps. Often the pattern reveals flipping signs or index shifts.
6.  **Check indexing and which direction is u/v in your arrays** (i vs j). Off-by-one or swapped axes manifest exactly like you describe (direction unchanged, magnitude decays).
7.  **Test advection in isolation**: advect a single scalar bump with zero velocity — it should stay put. If not, the backtrace or sample interpolation is wrong.

---

# Quick implementation tips / gotchas from your past issues

- When using periodic boundaries, make sure the _ghost_ cells are set exactly consistent with interior indexing — corners especially are easy to mess up (you saw that).
- In MAC grid, don't store a single velocity array where you index faces at centers — make separate arrays for u and v with their own sizes (u: (Nx+1)xNy, v: N x (Ny+1)).
- In advection backtrace use velocities _interpolated at the right staggered locations_ (when advecting a center-stored scalar you need `u` and `v` at cell centers — average the four face values).
- Keep `dt` clamped and consider local substeps for advection trace.

---

# Practical minimal next tasks for you to pick (pick 2–3)

- Implement MAC grid (2D), rewire projection to face-centered velocities, and re-run your energy/divergence tests.
- Add RK2 backtrace advection + cubic interpolation for scalar & velocity advection.
- Add residual logging in Poisson solver and compare GS vs SOR vs PCG on the same test case.
- Do a unit test harness that runs `stam-stable-fluids` and your sim with identical initialization and asserts L2 error < threshold after N steps.

---

# Resources to prioritize (quick list)

- Bridson — _Fluid Simulation for Computer Graphics_ (chapters on MAC, advection, projection, FLIP).
- GPU Gems chapter (you already have) — great for GPU kernels & rendering.
- Papers/notes on MacCormack and cubic interpolation for semi-Lagrangian advection.
- Small numerical recipes on PCG / preconditioners (for implementation guidance).
