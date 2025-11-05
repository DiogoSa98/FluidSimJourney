# Following Velocity

The final term of the density solver is the **advection term** (sometimes also called _convection_ or _transport_):

$$
-(\mathbf{u} \cdot \nabla)\rho
$$

It describes how the density is **transported along the velocity field**. In Stam’s equation, for a constant velocity field **u** and no diffusion or sources, we can write:

$$
\frac{d\rho}{dt} = -(\mathbf{u} \cdot \nabla)\rho
$$

or equivalently,

$$
\frac{d\rho}{dt} + (\mathbf{u} \cdot \nabla)\rho = 0
$$

This just means that the density is moving around due to the velocity field, but the total amount of density in the scene stays the same — it’s just being carried along.

## Understanding the advection term

The operator $(\mathbf{u} \cdot \nabla)$ takes the gradient of a scalar field and dots it with **u**.  
In multivariable calculus, this is known as the **directional derivative** — it measures the rate of change of a function along some direction.

While the gradient gives the rate of change in the direction of the coordinate axes, the directional derivative gives the rate of change along an arbitrary vector.
In our case, that vector is the **velocity field**, which literally defines _how the density moves_ in space.

So $(\mathbf{u} \cdot \nabla)\rho$ tells us how the scalar $\rho$ (our density) changes as we move along the flow defined by **u**. In 2D, it expands as:

$$
(\mathbf{u}\cdot\nabla)\rho = u_x \frac{\partial p}{\partial x} + u_y \frac{\partial \rho}{\partial y}.
$$

## Deriving an update rule (Forward Euler)

Let’s start simple.  
Assume the velocity field **u** is constant and known (we’re defining it).  
We want an update rule that gives us $\rho^{n+1}$ (density at time $t+\Delta t$) from $\rho^n$ (density at time $t$).

Just like in the diffusion step, we can start with the **Forward Euler** integration scheme:

$$
\rho^{n+1} = \rho^n + \Delta t\\, f(\rho^n)
$$

where $f(\rho)$ approximates $\frac{d\rho}{dt}$.

Here,

$$
f(\rho) = -(\mathbf{u}\cdot\nabla)\rho.
$$

Let’s approximate the spatial derivatives using **forward differences** (just for now, the simplest possible):

$$
\frac{\partial \rho}{\partial x} \approx \frac{\rho_{i+1,j} - \rho_{i,j}}{h}, \quad \frac{\partial \rho}{\partial y} \approx \frac{\rho_{i,j+1} - \rho_{i,j}}{h}.
$$

Plugging into our equation:

$$
\rho_{i,j}^{n+1} = \rho^n_{i,j} - \Delta t \left( u_x \frac{\rho^n_{i+1,j} - \rho^n_{i,j}}{h} + u_y \frac{\rho^n_{i,j+1} - \rho^n_{i,j}}{h} \right).
$$

This is a simple, explicit, and easy-to-implement update rule.  
However, as we’ve already seen in the diffusion step, **explicit schemes** can become unstable for large enough time steps.  
In this case, the “effective timestep” is related to the **CFL number**:

$$
\nu = \frac{|\mathbf{u}|\Delta t}{h}.
$$

If $\nu > 1$, the update becomes unstable — the simulation starts to blow up or oscillate wildly. (TODO: actually stuy, derive and test the CFL condition for this scheme.)

## Trying the backward (implicit) approach

Let’s try something more stable.  
We’ll use **Backward Euler** as the time integration scheme, and a **central difference** to approximate the spatial derivative.

In 1D, the advection equation becomes:

$$
\frac{\partial \rho}{\partial t} = -u \frac{\partial \rho}{\partial x}.
$$

Using **Backward Euler** in time:

$$
\frac{\rho_i^{n+1} - \rho_i^n}{\Delta t} = -u \frac{\rho_{i+1}^{n+1} - \rho_{i-1}^{n+1}}{2h}.
$$

Rearranging terms:

$$
-\frac{u\Delta t}{2h}\\, \rho_{i-1}^{n+1} + \rho^{n+1}_i + \frac{u\Delta t}{2h}\\, \rho_{i+1}^{n+1} = \rho^n_i.
$$

Letting $a = \frac{u\Delta t}{2h}$, this becomes:

$$
-a\\,\rho^{n+1}_{i-1} + \rho^{n+1}_i + a\\,\rho^{n+1}_{i+1} = \rho^n_i.
$$

If we write this for every grid cell, we get a **tridiagonal system** with off-diagonal terms $(-a, +a)$.

In matrix form (for 5 cells, as an example):

$$
\begin{bmatrix}
 1 & a & 0 & 0 & 0\\\\
 -a & 1 & a & 0 & 0\\\\
  0 & -a & 1 & a & 0\\\\
  0 & 0 & -a & 1 & a\\\\
   0 & 0 & 0 & -a & 1
\end{bmatrix}
\begin{bmatrix}
\rho^{n+1}_1\\\\
\rho^{n+1}_2\\\\
 \rho^{n+1}_3\\\\
  \rho^{n+1}_4\\\\
   \rho^{n+1}_5
   \end{bmatrix} =
   \begin{bmatrix}
   \rho^n_1\\\\ \rho^n_2\\\\ \rho^n_3\\\\ \rho^n_4\\\\ \rho^n_5 \end{bmatrix}.
$$

This is solvable, but it’s not ideal.

To ensure Gauss–Seidel convergence, the matrix must either be **symmetric positive-definite** — which it isn’t, since the off-diagonals have opposite signs and the coefficients depend on velocity (we don't want to constrain ourselves to constant velocity) — or at least **strictly** or **irreducibly diagonally dominant** which implies:

The diagonal entry is $a_{ii} = 1$, and the sum of off-diagonal magnitudes per row is $2|a|$.  
For diagonal dominance we need:

$$
|a_{ii}| \ge \sum_{j\neq i} |a_{ij}|
$$

which gives:

$$
1 \ge 2|a| \quad \Rightarrow \quad |u|\Delta t / h \le 0.5
$$

That’s a **velocity cap** directly tied to the grid resolution and timestep — definitely not something we want to enforce in a fluid sim.  
Without it, convergence isn’t guaranteed.

And that’s just in 1D. In **2D or 3D**, the situation gets even nastier: the velocity has multiple components ($u_x, u_y, u_z$), so the matrix coefficients vary per cell and direction, breaking both symmetry and uniformity. The matrix stops having a nice constant stencil — every row can look different.

That’s what Stam refers to when he says:

> “However, the resulting linear equations would now depend on the velocity, making it trickier to solve.”

He means that since the velocity field changes every frame, the matrix coefficients change too — you’d have to rebuild a new, non-symmetric, potentially non-convergent system at each timestep.

So even though this implicit scheme avoids the usual explicit-time instability, it introduces its own headaches: asymmetric matrices, poor convergence guarantees, and a dependence on a constantly changing velocity field.

## Other ideas

Apparently, there are better ways to do this within the **Eulerian** framework.
From the Fluid Simulation for Computer Graphics book:

> “In general, biasing a finite difference to the direction that flow is coming from is called upwinding. Most advanced Eulerian schemes are upwind-biased schemes that do this with more accurate finite difference formulas.”

For now, I’m not diving into that. Let’s see how Stam solved this instead — by taking a completely different perspective on the problem.

Before jumping into that, it’s worth clarifying what this means.
So far, everything we’ve done lives in the **Eulerian viewpoint** — we look at fixed points in space and track how quantities like density and velocity change over time at those points. Each grid cell is basically a small “sensor” watching the fluid flow through it.

The **Lagrangian viewpoint**, on the other hand, treats the fluid as a swarm of individual “particles” that we follow through space and time. Each particle carries its own position, velocity, etc., and we observe how those quantities change as the particle moves.

## Semi-Lagrangian Advection

To solve the advection step, Stam takes a page from the **Lagrangian** viewpoint:

> _“The key idea behind this new technique is that moving densities would be easy to solve if the density were modeled as a set of particles. In this case we would simply have to trace the particles through the velocity field. For example, we could pretend that each grid cell’s center is a particle and trace it through the velocity field…”_

As he states, we can easily write an update rule for our particles’ positions:

$$
\mathbf{p}^{n+1} = \mathbf{p}^n + \Delta t \frac{d\mathbf{p}}{dt}
$$

where $\frac{d\mathbf{p}}{dt}$ is the velocity, given by the velocity field itself.  
This is why the method is called **Semi-Lagrangian** — we’re not truly simulating discrete particles; we’re still using a grid, but we _think_ about each cell as if it were a particle moving through the flow.

### Tracing Backwards Through the Velocity Field

If we were to trace particles _forward_, the question would arise of how to turn particles ammounts back into density values. We’d likely have to compute where each one lands and how its mass contributes to nearby cells. Apparently several techniques were developed using that idea, but Stam proposes a simpler alternative: **trace backwards**.

We know the current density field $\rho^n$. To find the density at a new time step $\rho^{n+1}$, we follow the velocity field _backward_ from each cell center to find where the density came from:

$$
\mathbf{p}^n = \mathbf{p}^{n+1} - \Delta t \\, \mathbf{u}
$$

This is the key insight: instead of pushing particles forward, we _pull density backward_ from where it came.

```js
for (let i = 1; i <= N; i++) {
  for (let j = 1; j <= N; j++) {
    let x = i - deltaT * velX[i][j];
    let y = j - deltaT * velY[i][j];
    // interpolate density at (x, y)
  }
}
```

**Note:**  
This assumes that the grid indices `(i, j)` correspond to the **center** of each cell.  
If grid coordinates represent cell corners instead, you would need to offset by half a cell width (`+h/2`) when tracing positions.

### Bilinear Interpolation

Once we have the backtraced position $(x, y)$, we convert it to grid indices. The integer part gives us the upper-left cell center (this of course depends on how you construct your grid), while the fractional part tells us the percentage offset we have in relation to nearby cells. We then use **bilinear interpolation** (weighted average of the four surrounding cells) to sample the previous density field:

```
(i0, j0)       (i0+1, j0)
   +--------------+
   |              |
   |   (x, y)     |
   |              |
   +--------------+
(i0, j0+1)     (i0+1, j0+1)
```

- $i_0 = \lfloor x \rfloor$, $i_1 = i_0 + 1$
- $j_0 = \lfloor y \rfloor$, $j_1 = j_0 + 1$
- $s = x - i_0$, $t = y - j_0$

Interpolate horizontally along the bottom row:

$$
f(x,j_0) = (1 - s)\\,\rho_{i_0,j_0} + s\\,\rho_{i_1,j_0}
$$

Interpolate horizontally along the top row:

$$
f(x,j_1) = (1 - s)\\,\rho_{i_0,j_1} + s\\,\rho_{i_1,j_1}
$$

Interpolate vertically between those two:

$$
\rho(x,y) = (1 - t)\\,f(x,j_0) + t\\,f(x,j_1)
$$

This can be written compactly as:

$$
\rho(x, y) = (1 - s)(1 - t)\rho_{i_0,j_0} + s(1 - t)\rho_{i_1,j_0} + (1 - s)t\rho_{i_0,j_1} + st\rho_{i_1,j_1}
$$

### On Numerical Diffusion

Here’s where things get tricky. Bilinear interpolation introduces **numerical diffusion**: sharp features in the density field quickly smooth out, and with coarse grids or large time steps, the density may even dissipate completely.

This diffusion isn’t physical — it’s a numerical artifact of interpolation.  
Stam acknowledges this in the paper, and many later works have explored **higher-order advection schemes** to mitigate the problem, which I hope to explore in the future.

### Quick Note on Units and Index Space

We define our domain to have a “physical” size of 1 (you can think of it as 1 meter).  
This means $x, y \in [0,1]$.

However, our grid has $N$ cells, so each cell is $1/N$ units wide.  
When we write:

$$
x = i - \Delta t_0 \\, u_x
$$

we are working in **index space**, not world space.  
If our velocity field is expressed in world units (e.g., 0.2 means “move across 20% of the domain per second”), we need to convert it to **cells per second** by multiplying by $N$.

This is why Stam defines:

$$
\text{dt0} = \Delta t \times N
$$

It’s simply converting the velocity from world-space units to cell-space units.

### Conclusion

And there we have it — densities moving smoothly along a velocity field!  
If you set the diffusion rate to zero, you’ll see how the density purely follows the flow, though over time, interpolation errors cause it to blur and fade.

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<div id="diffusion-velocity" class="sketch-container"></div>
<script type="module">
  import { createFluidSim } from "./scripts/fluid-sketch.js";
  createFluidSim("diffusion-velocity", { useDiffuseAdvection: true, useStaticVelocityField: true });
</script>
