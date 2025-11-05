# Evolving Velocities

Now that we can move densities around a velocity field, the next step is to **evolve the velocity field itself** — to make it change over time according to the physics of fluids.

The behavior of a velocity field is governed by the **Navier–Stokes equation**:

$$
\frac{\partial \mathbf{u}}{\partial t} = -(\mathbf{u} \cdot \nabla)\mathbf{u} + \nu \nabla^2 \mathbf{u} + \mathbf{f}
$$

Each term describes a different physical process:

### External forces - $\mathbf{f}$

This term represents anything that directly pushes or pulls the fluid — **gravity**, **wind**, a **fan**, in our case, the mouse dragging through the simulation grid. It’s the easiest part to understand: you’re simply adding velocity to certain points in the field.

### Viscous diffusion - $\nu \nabla^2 \mathbf{u}$

This describes how momentum (velocity) **spreads out over time**, similar to how heat diffuses through a material.

The constant $\nu$ (nu) is the _viscosity coefficient_:

- A **high viscosity** (like honey) means the fluid resists motion — disturbances don’t spread easily.
- A **low viscosity** (like air or water) means changes in velocity diffuse quickly across the field.

Mathematically, the Laplacian $\nabla^2 \mathbf{u}$ measures how different a velocity is from its neighbors. If a cell’s velocity is much higher than the surrounding ones, this term will act to smooth it out over time.

$$
\frac{\partial \mathbf{u}}{\partial t} = \nu \nabla^2 \mathbf{u}
$$

If $\nu$ is large, then $\nu \nabla^2 \mathbf{u}$ is large — meaning the change of velocity over time is strong, and the **smoothing/spreading effect** of velocity differences happens quickly.  
That’s why the velocity field becomes more uniform: gradients and small details disappear faster.

If $\nu$ is small, then $\nu \nabla^2 \mathbf{u}$ is weak — velocity differences persist longer, and the fluid retains sharper local "structures" like vortices.  
This corresponds to _low-viscosity_ fluids (like air), where momentum isn’t diffused away as quickly and motion feels more dynamic.

### Self-advection — $-(\mathbf{u} \cdot \nabla)\mathbf{u}$

This is the trickiest part conceptually. It says that **the velocity field moves itself**.

If you imagine releasing a puff of smoke into a wind field, the smoke is carried by the wind — that’s advection. But now imagine the “wind” also carries _itself_ along — faster regions push their momentum into neighboring regions. That’s self-advection.

Physically, this is what gives fluids their swirling, chaotic behavior. Mathematically, it’s what makes the Navier–Stokes equations **nonlinear**. Read a little more about this in the linear vs nonlinear background chapter.

## Recycling Numerical Methods

It’s easy to see that the terms in the **velocity equation** resemble those in the density equation, so we can reuse most of the same routines we developed earlier to solve it. Stam explicitly states this in his paper and more or less skips re-explaining these parts and goes straight into showing the full velocity step.

```c
void vel_step ( int N, float *u, float *v, float *u0, float *v0,
                float visc, float dt )
{
    add_source ( N, u, u0, dt );
    add_source ( N, v, v0, dt );
    SWAP ( u0, u );  diffuse ( N, 1, u, u0, visc, dt );
    SWAP ( v0, v );  diffuse ( N, 2, v, v0, visc, dt );
    project ( N, u, v, u0, v0 );
    SWAP ( u0, u );  SWAP ( v0, v );
    advect ( N, 1, u, u0, u0, v0, dt );
    advect ( N, 2, v, v0, u0, v0, dt );
    project ( N, u, v, u0, v0 );
}
```

#### Adding Forces

Adding external forces is handled in the same way as before.  
In the density step, `add_source()` injected more density into a cell.  
Here, it injects **momentum** instead — that is, it modifies the velocity of a cell.

In Stam’s code, this is done via the function `get_from_UI()`, which writes user input values into `u0` and `v0`.  
He doesn’t really explain what happens inside this function, but we can infer that it takes mouse input (like dragging) and translates it into localized velocity additions.

#### Diffusion and Advection

The next two terms — **viscous diffusion** and **self-advection** — use the exact same routines we already wrote for density.  
The only distinction is that we’re now dealing with a **vector field** instead of a **scalar field**.

By definition, the vector calculus operators (like the Laplacian or directional derivative) act **component-wise** on vectors.  
This means we can compute the x and y components of velocity independently:

- The **Laplacian** simply applies to each component:

  $$
  \nabla^2 \mathbf{u} = (\nabla^2 u_x, \nabla^2 u_y)
  $$

- The **advection** step also updates each component separately, even though both components are used when computing how the velocity field moves.

This is why Stam can just call `diffuse()` and `advect()` twice — once for `u` (the x component) and once for `v` (the y component).  
The structure of the PDE allows this separation because, at this stage, there are no cross-terms that directly mix $u\_x$ and $u\_y$.

The only new function introduced here is **`project()`**, which ensures the resulting velocity field is **divergence-free** (incompressible) which we'll have to unpack

## Project - Enforcing Imcompressibility

### The Incompressibility Condition

When introducing the `project()` function, Stam writes:

> “There is, however, a new routine called `project()` which is not present in the density solver. This routine forces the velocity to be mass conserving. This is an important property of real fluids which should be enforced.”

What Stam is referring to here is the fact that, in our simulation, we assume two key physical constraints:  
**(A)** conservation of **mass**, and  
**(B)** conservation of **volume**.

#### From Conservation to Incompressibility

In real life, fluids like air and water can indeed change volume while keeping their mass constant. Those local changes in volume (and therefore density, since $\rho = m/V$) are what give rise to **sound waves** — tiny oscillations in pressure and density that propagate through the medium.

Fortunately for us, such effects are negligible for visual fluid simulation, so we make the simplifying assumption that **density remains constant everywhere**.

This means that fluid parcels neither expand nor contract — in other words, they are **incompressible**.

Under this assumption, the mathematical condition for incompressibility is beautifully simple:

$$
\nabla \cdot \mathbf{u} = 0
$$

This equation states that the **divergence** of the velocity field is zero everywhere.

#### Building Intuition

Even without going through the full derivation (which is shown in the background chapter), we can read this equation intuitively.

Imagine a box filled with fluid particles moving along the velocity field.

- If, around some point, the velocity vectors point _"more inward"_ and get shorter as they approach it, that region acts as a **sink** — it has **negative divergence**. Particles accumulate there, so the **local density increases**.
- Conversely, if the velocities point _"more outward"_ and grow in magnitude, the point behaves like a **source** — it has **positive divergence**, and the local density decreases as fluid “expands” away.

TODO INCLUDE PICTURES OF THE 3 DIFFERENT CASES OF DIVERGENCE

That behavior describes a **compressible** fluid — one where regions can locally gain or lose density.  
Setting $\nabla \cdot \mathbf{u} = 0$ ensures the opposite: **no fluid parcel expands or contracts**. The density everywhere stays constant, guaranteeing the flow is **incompressible**.

#### Edge cases

It’s important to note that this condition applies at the level of **fluid elements** — infinitesimal parcels of fluid that move and deform with the flow. Each parcel retains its volume over time, and because these parcels collectively make up the entire domain, enforcing incompressibility locally ensures it globally.

Consider two examples:

1.  **Compressing the box:**  
    Suppose we have fluid inside a sealed box and start shrinking the box. The total amount of fluid (mass) remains constant, but the space it occupies decreases. In an incompressible simulation, this doesn’t cause the fluid to shrink — instead, **pressure increases** to resist compression, as though the fluid were infinitely stiff.
2.  **Injecting more fluid:**  
    If we add more fluid into the box, we’re increasing both the total volume and total mass of the fluid, but as long as the density remains constant, this is still consistent with incompressibility. In practice, we handle this not by modifying the incompressibility equation itself, but by controlling inflow through boundary conditions — specifying where new fluid enters and with what velocity. The interior of the fluid domain still satisfies incompressibility.

---

Now that we’ve built an intuitive picture of what incompressibility means, let’s look more closely at how it emerges and how the pressure term in project() ensures the condition is satisfied

- [Deriving the Incompressibility Constraint](deriving-incompressibility.md)
- [Enforcing Incompressibility, from Pressure to Projection](role-of-pressure.md)
