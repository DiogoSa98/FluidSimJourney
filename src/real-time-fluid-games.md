# Real-Time Fluid Dynamics for Games

TODO improve this, do some more research and actually read the 1999 paper

Before this paper, Jos Stam had already shaken up computer graphics with his 1999 paper Stable Fluids. That’s the big, original one — the method behind most of the fluid effects you see in older movies, early real-time demos, even modern games like Returnal reference it (a big reason why I jumped in this rabbit whole in the first place).

The 2003 paper Real-Time Fluid Dynamics for Games is basically the “lite” version of Stable Fluids, at least from what I can gather, it looks much more straightforward and less math heavy. It’s Stam taking the same core ideas — solving the Navier–Stokes equations in a way that’s fast, stable, and good-looking — and packaging them for game developers. In other words, this is the practical, “you can code this yourself” version.

The goal isn’t complete scientific accuracy. Stam says it straight: he’s not trying to simulate aerodynamics — he’s trying to make smoke swirl and fluids flow convincingly in real time. The paper is short, easy to read (in theory…), and includes all the C code you need to get something on the screen.

That’s why I’m starting here. Trying to get something up and running fairly quickly while having each step of the solver explained in a way that I can dig into the math at my own pace.

## Navier-Stokes equations

The big bad wolf. The million-dollar equation (literally — there’s a Millennium Prize for anyone who can solve the Navier–Stokes existence and smoothness problem).

Stam writes, in the most compact vector form, the equation for the **velocity** :

$$
\frac{\partial \mathbf{u}}{\partial t} = -(\mathbf{u} \cdot \nabla)\mathbf{u} + \nu \nabla^2 \mathbf{u} + \mathbf{f}
$$

// TODO CONFIRM THIS
Here $\\mathbf{u}$ is the velocity field — a vector field telling you the velocity of the fluid at each point in space. The way I see it, this equation is kind of saying: _the change in velocity over time_ (the left side) comes from three main things: how the fluid moves itself around, how it diffuses or spreads out due to viscosity ($\\nu \\nabla^2 \\mathbf{u}$ term), and whatever external forces are acting on it ($\\mathbf{f}$).

The second equation describes how a **density field** (like a continuous smoke density cause we are not modeling every particle) moves through the velocity field.

$$
\frac{\partial \rho}{\partial t} = -(\mathbf{u} \cdot \nabla)\rho + \kappa \nabla^2 \rho + S
$$

The main idea is that the density $\\rho$ gets carried around by the velocity field (first term), it diffuses with some diffusion constant $\\kappa$, and there might be sources $S$ that add more density (like smoke being emitted).

In _Fluid Simulation for Computer Graphics_, Bridson phrases the Navier-Stokes equations like so:

// TODO CONFIRM THE QUOTE

> "Most fluid flow is governed by the **incompressible Navier–Stokes equations**. Partial differential equations that should hold throughout the fluid."

**Momentum Equation:**

$$
\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla)\mathbf{u} = -\frac{1}{\rho} \nabla p + \mathbf{g} + \nu \nabla^2 \mathbf{u}
$$

- $\\mathbf{u}$ — velocity of the fluid
- $p$ — pressure (force per unit area that the fluid exerts on anything)
- $\\rho$ — density of the fluid (mass per unit volume $kg/m^3$)
- $\\mathbf{g}$ — gravity and any additional external forces
- $\\nu$ — kinematic viscosity (how “thick” or resistant to stirring the fluid is)

**Incompressibility Condition:**

$$
\nabla \cdot \mathbf{u} = 0
$$

// TODO CONFIRM THIS

This expresses that the fluid is incompressible — its volume doesn’t change, and there’s no net gain or loss of fluid at any point.

So, depending on what assumptions you make — incompressible vs. compressible flow, constant viscosity, ignoring temperature, etc. — you can write these equations in a bunch of different ways. The ones Stam uses are simplified for **real-time visual simulation**: he’s not trying to simulate airplane aerodynamics, just something that _looks_ like smoke or water moving naturally.

For now, I’m not worrying about all the physics behind them — like where exactly they come from or what all the simplifications mean. I just want to understand how the equations turns into the little C code blocks in Stam’s paper.

## Solver Basic Structure

The discrete representation is a 2D grid where each cell stores quantities like velocity and density. Values are assumed to be constant within each cell and represented at the center (later Bridson explains methods where storing at the center is not such a good idea TODO confirm/write note).

> Bridson calls this Eulerian Viewpoint TODO continue

We surround our grid simulation region with an aditional layer of cells that act as a buffer region to handle boundary conditions. In practice we can store everything in a one dimensional grid $size = (N+2)*(N+2)$, the paper describes how.

Our solver begins with an initial state for both velocity and density fields, then updates them based on interactions over time. In practice, this means we repeatedly take the current state of the fluid, apply forces, inject new densities, and step the simulation forward by a small time interval $dt$ which in our case will be our frame rate.
