# The MAC Grid

There are several places where we could start improving our fluid simulator.  
I decided to begin with **spatial discretization**, since it will lead to changes in our data structures and algorithms—and the earlier we make those changes, the better.

Our simulation ultimately solves the **incompressible Navier–Stokes equations** for velocity and pressure. The density equation is only there to render smoke; the real physics lives in the velocity and pressure solve. So first, a quick recap of the equations we care about (written in the style used in Bridson):

The **momentum equation**:

$$
\frac{\partial \mathbf{u}}{\partial t} + \mathbf{u}\cdot \nabla \mathbf{u} + \frac{1}{\rho}\nabla p = \mathbf{g} + \nu\nabla^2 \mathbf{u}
$$

Using operator splitting, we solve these subproblems individually:

- **Self-advection:**

  $$
  \frac{\partial \mathbf{u}}{\partial t} = -\mathbf{u}\cdot \nabla \mathbf{u}
  $$

- **Viscous diffusion:**

  $$
  \frac{\partial \mathbf{u}}{\partial t} = \nu\nabla^2 \mathbf{u}
  $$

The pressure term comes from the **incompressibility condition**:

$$
\nabla\cdot\mathbf{u} = 0
$$

This gives a Poisson equation:

$$
\nabla^2 p = \nabla\cdot \mathbf{u}
$$

After solving for $p$, we update velocities using $-\nabla p$.

All of this requires accurate numerical approximations of spatial derivatives:

- directional derivatives for advection (though semi-Lagrangian avoids this)
- Laplacians $\nabla^2 u$, $\nabla^2 p$
- divergence $\nabla\cdot u$
- gradient $\nabla p$

We use **central differences** because they are second-order accurate ($O(h^2)$) and unbiased, unlike forward or backward differences which are only $O(h)$ and directionally one-sided.

But central differences on a **collocated grid** hide a major problem.

## When collocated grids fail

Consider the central difference approximation of the derivative:

$$
\frac{q_{i+1} - q_{i-1}}{2h}
$$

Notice something strange: the value at $i$ never appears.  
This means certain oscillatory patterns, like $q_i = (-1)^i$, produce a numerical derivative of **zero everywhere**, even though the function is wildly varying.

Mathematically, the discretization has a **non-trivial nullspace**: many non-constant fields look like they have zero derivative or zero divergence. When computing divergence in particular, this leads to highly compressible fields being interpreted as perfectly divergence-free, which breaks the pressure projection. The result: fluid volume gain/loss, instability, and general sickness.

One of the cleanest and most widely adopted solutions to this is the **MAC grid**.

## The MAC Grid (Marker-and-Cell)

The idea is simple:  
**Instead of storing velocities at cell centers, we store them on cell faces.**

This gives us a **staggered grid**:

- Horizontal velocities $u$ live on vertical cell faces.
- Vertical velocities $v$ live on horizontal cell faces.
- Pressure remains at cell centers.

This means we need to store extra rows/columns:

- $u_{i-\frac12,j}$: size $(n_x+1)\times n_y$
- $v_{i,j-\frac12}$: size $n_x\times (n_y+1)$

With this staggering, the central difference for a first derivative aligns perfectly:

$$
\left.\frac{\partial q}{\partial x}\right|_i \approx \frac{q_{i+\frac12} - q_{i-\frac12}}{h}
$$

Note the denominator: **$h$** not **$2h$**. If you expand $q(x\pm h/2)$ in Taylor series, you get this naturally, though it's easy to see in the image why that is.

Now we must rewrite our update routines to use these staggered velocities—but as we’ll see, most parts barely change.

## Diffusion on a staggered grid

Diffusion uses a Laplacian, which remains a 5-point stencil. For the $u$\-component:

$$
u^{n+1}_{i+\frac12,j} = u^n_{i+\frac12,j} + \Delta t\,\nu\, \frac{ u^{n+1}_{i+\frac32,j} + u^{n+1}_{i-\frac12,j} + u^{n+1}_{i+\frac12,j+1} + u^{n+1}_{i+\frac12,j-1} - 4u^{n+1}_{i+\frac12,j} }{h^2}
$$

This looks more complicated, but structurally it’s the same diffusion solve—your code for diffusion barely changes.

## Projection on a staggered grid

### 1\. Solve the Poisson equation for pressure

The continuous equation is:

$$
\nabla^2 p = \nabla\cdot u
$$

Written in discrete form:

$$
\frac{ p_{i-1,j}+p_{i+1,j}+p_{i,j-1}+p_{i,j+1}-4p_{i,j} }{h^2} = \frac{u_{i-\frac12,j} - u_{i+\frac12,j}}{h} + \frac{v_{i,j-\frac12} - v_{i,j+\frac12}}{h}
$$

Notice everything lines up perfectly because the velocity components are already sampled at the proper faces.

### 2\. Subtract the pressure gradient to enforce incompressibility

We need $\nabla p$ **on faces**, but pressure lives at cell centers.  
Fortunately, the staggered layout makes this trivial:

$$
\left.\frac{\partial p}{\partial x}\right|_{i+\frac12,j} \approx \frac{p_{i+1,j} - p_{i,j}}{h}
$$

$$
\left.\frac{\partial p}{\partial y}\right|_{i,j+\frac12} \approx \frac{p_{i,j+1} - p_{i,j}}{h}
$$

Then the projection step becomes:

$$
u^{n+1}_{i+\frac12,j} = u_{i+\frac12,j} - \Delta t\, \frac{1}{\rho} \frac{p_{i+1,j} - p_{i,j}}{h}
$$

$$
v^{n+1}_{i,j+frac12} = v_{i,j+\frac12} - \Delta t\, \frac{1}{\rho} \frac{p_{i,j+1} - p_{i,j}}{h}
$$

That’s all the projection changes: just different indexing.

## Semi-Lagrangian advection on a staggered grid

Recall the algorithm on a collocated grid:

1.  Assume a “particle’’ begins at the cell center.
2.  Compute its backtraced position using the local velocity.
3.  Bilinearly interpolate the velocity field at that position.

On a staggered grid, the idea is the same, but we must be more careful about **where velocities are defined**.

### 1\. Getting a velocity at a cell center

If we're advecting a **cell-centered** quantity (like density), we need a velocity at the center.  
We compute it by averaging the two velocities around each face:

$$
u_{i,j} = \frac{u_{i-\frac12,j} + u_{i+\frac12,j}}{2}
$$

$$
v_{i,j} = \frac{v_{i,j-\frac12} + v_{i,j+\frac12}}{2}
$$

Then we backtrace.

### 2\. Advecting face-centered velocities

This is trickier. When advecting $u$\-velocities at a face $(i+\frac12,j)$, we need the velocity **at that face**, not the center.  
Bridson gives convenient averaging formulas:

$$
u^{\text{center}}_{i,j} = \frac{u_{i-\frac12,j} + u_{i+\frac12,j}}{2}
$$

$$
v^{\text{center}}_{i,j} = \frac{v_{i,j-\frac12} + v_{i,j+\frac12}}{2}
$$

Face-centered velocities:

$$
u\text{-face at }(i+\tfrac12,j): \quad v = \frac{ v_{i,j-\frac12} + v_{i,j+\frac12} + v_{i+1,j-\frac12} + v_{i+1,j+\frac12} }{4}
$$

$$
v\text{-face at }(i,j+\tfrac12): \quad u = \frac{ u_{i-\frac12,j} + u_{i+\frac12,j} + u_{i-\frac12,j+1} + u_{i+\frac12,j+1} }{4}
$$

These averages give a consistent, unbiased velocity at the face location.

### 3\. Adjusting the backtrace target

Because velocities live on faces, the “particle’’ representing $u_{i+\frac12,j}$ starts at:

$$
x = (i+\tfrac12)h, \qquad y = jh
$$

so after backtracing, we end up at a position that is **not** aligned to the staggered grid.

Thus we must do:

### 4\. Bilinear interpolation on a staggered grid

Interpolation is the same as before, except the samples come from a grid offset by half a cell.  
You bilinearly interpolate on the appropriate staggered array (the $u$\-grid or the $v$\-grid) using the same formula as usual; only the indexing shifts.

# TODO review accuracy with book, insert image and code blocks

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<div id="sim-mac" class="sketch-container"></div>
<script type="module">
  import { createFluidSim } from "./scripts/fluid-sketch.js";
  createFluidSim("sim-mac", 
  { useDiffuseAdvection: true, useStaticVelocityField: false, useVelocityStep: true, useFluidMAC: true });
</script>
