# Following Velocity

The final term of the density solver is the **advection term** (sometimes also called _convection_ or _transport_):

$$
-(\mathbf{u} \cdot \nabla)p
$$

It describes how the density is **transported along the velocity field**. In Stam’s equation, for a constant velocity field **u** and no diffusion or sources, we can write:

$$
\frac{dp}{dt} = -(\mathbf{u} \cdot \nabla)p
$$

or equivalently,

$$
\frac{dp}{dt} + (\mathbf{u} \cdot \nabla)p = 0
$$

This just means that the density is moving around due to the velocity field, but the total amount of density in the scene stays the same — it’s just being carried along.

## Understanding the advection term

The operator $(\mathbf{u} \cdot \nabla)$ takes the gradient of a scalar field and dots it with **u**.  
In multivariable calculus, this is known as the **directional derivative** — it measures the rate of change of a function along some direction.

While the gradient gives the rate of change in the direction of the coordinate axes, the directional derivative gives the rate of change along an arbitrary vector.
In our case, that vector is the **velocity field**, which literally defines _how the density moves_ in space.

So $(\mathbf{u} \cdot \nabla)p$ tells us how the scalar $p$ (our density) changes as we move along the flow defined by **u**. In 2D, it expands as:

$$
(\mathbf{u}\cdot\nabla)p = u_x \frac{\partial p}{\partial x} + u_y \frac{\partial p}{\partial y}.
$$

## Deriving an update rule (Forward Euler)

Let’s start simple.  
Assume the velocity field **u** is constant and known (we’re defining it).  
We want an update rule that gives us $p^{n+1}$ (density at time $t+\Delta t$) from $p^n$ (density at time $t$).

Just like in the diffusion step, we can start with the **Forward Euler** integration scheme:

$$
p^{n+1} = p^n + \Delta t\, f(p^n)
$$

where $f(p)$ approximates $\frac{dp}{dt}$.

Here,

$$
f(p) = -(\mathbf{u}\cdot\nabla)p.
$$

Let’s approximate the spatial derivatives using **forward differences** (just for now, the simplest possible):

$$
\frac{\partial p}{\partial x} \approx \frac{p_{i+1,j} - p_{i,j}}{h}, \quad \frac{\partial p}{\partial y} \approx \frac{p_{i,j+1} - p_{i,j}}{h}.
$$

Plugging into our equation:

$$
p_{i,j}^{n+1} = p^n_{i,j} - \Delta t \left( u_x \frac{p^n_{i+1,j} - p^n_{i,j}}{h} + u_y \frac{p^n_{i,j+1} - p^n_{i,j}}{h} \right).
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
\frac{\partial p}{\partial t} = -u \frac{\partial p}{\partial x}.
$$

Using **Backward Euler** in time:

$$
\frac{p_i^{n+1} - p_i^n}{\Delta t} = -u \frac{p_{i+1}^{n+1} - p_{i-1}^{n+1}}{2h}.
$$

Rearranging terms:

$$
-\frac{u\Delta t}{2h}\, p_{i-1}^{n+1} + p^{n+1}_i + \frac{u\Delta t}{2h}\, p_{i+1}^{n+1} = p^n_i.
$$

Letting $a = \frac{u\Delta t}{2h}$, this becomes:

$$
-a\,p^{n+1}_{i-1} + p^{n+1}_i + a\,p^{n+1}_{i+1} = p^n_i.
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
p^{n+1}_1\\\\
p^{n+1}_2\\\\
 p^{n+1}_3\\\\
  p^{n+1}_4\\\\
   p^{n+1}_5
   \end{bmatrix} =
   \begin{bmatrix}
   p^n_1\\\\ p^n_2\\\\ p^n_3\\\\ p^n_4\\\\ p^n_5 \end{bmatrix}.
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

## Lagrangian Advection

moving densities would be easy to solve if the density
were modeled as a set of particles.
In this case we would simply have to trace the particles
though the velocity field

For example, we could pretend that each grid cell’s center is a
particle and trace it through the velocity field as shown in Figure 6 (b)
he problem is that we
then have to convert these particles back to grid values. - not obvious

better method is to find the particles which over a single time step end
up exactly at the grid cell’s centers as shown in Figure 6

WRITE TODO

finish this part with:

- explain the idea behind lagrangian advection (explain why it's semi-lagrangian (only thinking about a particle based scheme not actually using particles))

- explain why forward tracing is bad, possible solutions

- explain backwards tracing

- explain why bilinear interpolation is bad, possible solutions

- create the p5 js visualization with option to toggle on off velocity field arrows and input velocity field equations

evolving velocities:
explain the core ideas
explain each term mathematically and physical meaning
explain how we can use the same routines here
explain the project step all the way

boundary conditions:
fully explain the one used
implement a wrap around boundary condition and show it as the "final p5.js sketch" with an option to switch between boundary conditions.

review everything:
dont write stuff you dont know,
write density as "ro" not p in math

read the 1999 paper Stable Fluids
review everything in light of it and write another chapter with the main differences and takeaways

write the missing chapters on the background:
mostly numerical integration of ODEs (likely skip the stability analysis), likely poisson equation and stuff for project routine

Proceed with the Fluid simulation for computer graphics book; dont study everything just find out the core improvements, write about and improve the 2D simulation

after that start writing the 3d simulation in unity

once its done make 3 cool feature inspired by returnal:

1. show how you can write to the simulation shooting and the bullets affect the velocity field or air part of the simulation or whatever
2. show how grass (instanced im guessing go rewatch ghost of tsushima / horizon method) can sway according to the velocity field
3. voxelize/raymarch some smoke density and afterwards a blob thingy like they do in returnal
4. show how shooting moves that smoke or blob thingy
5. do the raymarch of a skeletal mesh and again show how its affected on the velocity field...

continue reading the book see what other features would be cool to implement??
