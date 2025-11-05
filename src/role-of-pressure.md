# Enforcing Incompressibility, from Pressure to Projection

_Reference: [Projection_method_(fluid*dynamics)](https://en.wikipedia.org/wiki/Projection_method*(fluid*dynamics))*

When Stam writes the equation for velocity he isn't actually giving the usual Navier-Stokes equations; The incompressible Navier-Stokes equations are usually written as:

**Momentum equation:**

$$
\frac{\partial \mathbf{u}}{\partial t} = -(\mathbf{u}\cdot\nabla)\mathbf{u} + \nu \nabla^2 \mathbf{u} + \mathbf{f} - \frac{1}{\rho}\nabla p
$$

**Incompressibility constraint:**

$$
\nabla\cdot\mathbf{u} = 0
$$

Compare that to what Stam writes:

$$
\frac{\partial \mathbf{u}}{\partial t} = -(\mathbf{u}\cdot\nabla)\mathbf{u} + \nu \nabla^2 \mathbf{u} + \mathbf{f}
$$

He omits both the incompressibility constraint and the term $- \frac{1}{\rho}\nabla p$, although he doesn't explicitly talk about these in the paper they are in fact solved for and taken into account in the project() function.

In reality, the first three terms of the momentum equation don't guarantee a divergence free velocity field, the core of the project function is precisely finding the term $- \frac{1}{\rho}\nabla p$ that constraints $u$ to be divergente free. I have yet to derive the Navier-Stokes momentum equation and therefore I don't really understand where this term comes from and why it looks the way it does. Fortunately for us we can abstract it away and just say we want to find some vector field $w$ that when subtracted from the current velocity $\mathbf{u}^*$ yields a divergent free vector field:

$$
\mathbf{u}^{n+1}=\mathbf{u}^* - w
$$

## Deriving Projection

To do this, we start of, as Stam does, with something called **Helmholtz-Hodge Decomposition** following the work written in the book _A Mathematical introduction to fluid mechanics_ (Chorin and Marsden’s) (Got this part from his 1999 _Stable Fluids_ paper not _Real-Time Fluid Dynamics for Games_). **Helmholtz-Hodge Decomposition** states that **any** vector field can be written as the sum of a divergent-free field and the gradient of some scalar valued function:

$$
\mathbf{u}^* = \mathbf{u}^{n+1} + \nabla q
$$

Taking the divergence of both sides gives:

$$
\nabla\cdot \mathbf{u}^* = \nabla\cdot(\mathbf{u}^{n+1} + \nabla q)
$$

Since divergence distributes over addition and $\\nabla\\cdot\\mathbf{u}^{n+1}=0$ (by definition of incompressibility), we get:

$$
\nabla\cdot \mathbf{u}^* = \nabla\cdot\nabla q = \nabla^2 q
$$

This is a **Poisson equation** for the scalar field $q$.

Once we solve this equation for $q$, we can subtract its gradient from the intermediate velocity:

$$
\mathbf{u}^{n+1} = \mathbf{u}^* - \nabla q
$$

By construction, the resulting field $\mathbf{u}^{n+1}$ satisfies $\nabla\cdot\mathbf{u}^{n+1} = 0$.

This process — first computing an intermediate velocity field $\mathbf{u}^*$ ignoring the pressure term, and then projecting it onto the space of divergence-free fields — is known as **Chorin’s projection method**.

## Computing Projection

Now that we’ve seen how pressure enforces incompressibility conceptually, let’s look at **how to actually compute it** — i.e., how the `project()` step works in practice.

From Chorin’s projection method, we know we want to find a scalar field $q$ (which corresponds to the pressure term) such that:

$$
\nabla \cdot \mathbf{u}^* = \nabla^2 q
$$

Once we solve for $q$, we subtract its gradient from the intermediate velocity field $\mathbf{u}^*$ to get our divergence-free velocity $\mathbf{u}^{n+1}$:

$$
\mathbf{u}^{n+1} = \mathbf{u}^* - \nabla q
$$

So the `project()` function can be divided into two main parts:

1.  **Solve the Poisson equation** $\nabla^2 q = \nabla \cdot \mathbf{u}^*$
2.  **Compute** $\mathbf{u}^{n+1} = \mathbf{u}^* - \nabla q$

### Solving the Poisson Equation

#### Computing Divergence

Let’s start with the left-hand side. We already have $\mathbf{u}^*$, so we can compute its divergence:

$$
\nabla \cdot \mathbf{u}^{} = \frac{\partial u_{x}^{}}{\partial x} + \frac{\partial u_{y}^{*}}{\partial y}
$$

In discrete form, we approximate derivatives using **central differences**:

$$
\nabla \cdot \mathbf{u}^{} \approx \frac{u^{*}(x + h, y) - u^*(x - h, y)}{2h} + \frac{v^*(x, y + h) - v^*(x, y - h)}{2h}
$$

Stam’s code:

```c
h = 1.0 / N;
for (i = 1; i <= N; i++) {
    for (j = 1; j <= N; j++) {
        div[IX(i, j)] = -0.5 * h * (
            u[IX(i+1, j)] - u[IX(i-1, j)] +
            v[IX(i, j+1)] - v[IX(i, j-1)]
        );
    }
}
```

Notice how Stam's `div` array doesn't actually store $\nabla \cdot \mathbf{u}^*$ but instead $-h^2\\,\nabla \cdot \mathbf{u}^{*}$. We can see this because he is multiplying everything by $-0.5$ (same as divinding by $2$ and multiplying by $-1$) and multiplying by $h$ whereas he should be multiplying by $1/h$, and $h = h^2 \* 1/h$
He does this so he doesn't have to go through extra computation in the next steps, as we will see.

#### Discritizing the laplacian

We’ve already seen how to discretize the Laplacian in the diffusion step:

$$
\nabla^2 q \approx \frac{q(x+h, y) + q(x-h, y) + q(x, y+h) + q(x, y-h) - 4q(x, y)}{h^2}
$$

(where $1/h^2 = N*N$)

Given our Poisson equation $\nabla^2 q = \nabla \cdot \mathbf{u}^*$, this gives us a system of linear equations of the form:

$$
Aq = b
$$

where:

- $A$ is the matrix representing the discrete Laplacian operator,
- $q$ is the vector of unknowns (the pressure at each grid cell),
- $b$ is the divergence of $\mathbf{u}^*$ we just computed.

#### Solving the system of linear equations

As previously done when solving the diffusion equation using the Backwards Euler method of integration we can approximate a solution for this linear system of equations by resorting to the **Gauss-Seidel iteration** method

Solving the discretized Poisson equation for $q(x,y)$ gives us the update rule for the Gauss-Seidel iteration:

Using the discrete Laplacian we’ve seen before, we can write this as:

$$
\frac{ q(x+h, y) + q(x-h, y) + q(x, y+h) + q(x, y-h) - 4q(x, y) }{h^2} = (\nabla \cdot \mathbf{u}^*)(x, y)
$$

Let’s rearrange this equation to isolate $q(x, y)$:

$$
-4q(x, y) = h^2 (\nabla \cdot \mathbf{u}^*)(x, y) - (\\,q(x+h, y) + q(x-h, y) + q(x, y+h) + q(x, y-h)\\,)
$$

and then divide both sides by $-4$:

$$
q(x, y) = \frac{ q(x+h, y) + q(x-h, y) + q(x, y+h) + q(x, y-h) - h^2 (\nabla \cdot \mathbf{u}^*)(x, y) }{4}
$$

In Stam's code he just adds `div[IX(i, j)]` because it's already storing $- h^2 (\nabla \cdot \mathbf{u}^*)$:

```c
for (k = 0; k < 20; k++) {
    for (i = 1; i <= N; i++) {
        for (j = 1; j <= N; j++) {
            p[IX(i, j)] = (div[IX(i, j)] +
                p[IX(i-1, j)] + p[IX(i+1, j)] +
                p[IX(i, j-1)] + p[IX(i, j+1)]) / 4;
        }
    }
    set_bnd(N, 0, p);
}
```

### Computing the Divergence-Free Velocity

Finally, we can compute the divergence-free velocity field:

$$
\mathbf{u}^{n+1} = \mathbf{u}^* - \nabla q
$$

We again use central differences to approximate the gradient:

$$
\frac{\partial q}{\partial x} \approx \frac{q(x+h, y) - q(x-h, y)}{2h}, \qquad \frac{\partial q}{\partial y} \approx \frac{q(x, y+h) - q(x, y-h)}{2h}
$$

Stam implements this step as:

```c
for (i = 1; i <= N; i++) {
    for (j = 1; j <= N; j++) {
        u[IX(i, j)] -= 0.5 * (p[IX(i+1, j)] - p[IX(i-1, j)]) / h;
        v[IX(i, j)] -= 0.5 * (p[IX(i, j+1)] - p[IX(i, j-1)]) / h;
    }
}
```

The result is a velocity field that **by construction** satisfies the incompressibility condition:

$$
\nabla \cdot \mathbf{u}^{n+1} = 0
$$

And as always, don’t forget to apply boundary conditions after each step.

### Projecting Twice??

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

Looking at Stam’s code, we can see the projection step is called **twice** — once after diffusion and once after advection. From our derivation, it’s not immediately obvious why this is necessary, and Stam only briefly says: _“We do this because the advect() routine behaves more accurately when the velocity field is mass conserving.”_

That’s really the key point: **advection assumes the velocity field is divergence-free.** When the fluid moves itself around, it needs to do so in a way that doesn’t create or destroy volume. As Bridson puts it, _“When we move fluid around and want it to conserve volume, the velocity field we are moving it in must be divergence-free... the sequence of our splitting matters a lot!”_ So we first project after diffusion to ensure advection starts with a valid, mass-conserving velocity field.

Why not project even earlier, right after the user input? The reason is that it wouldn’t help much — the diffusion step that follows is not self-referenced and would immediately break incompressibility again, wasting computation. So instead, Stam waits until diffusion is done and fixes all accumulated divergence in one go.

Finally, a second projection is needed after advection, since the numerical advection step itself can introduce divergence errors. The result is that we end up projecting exactly twice — the minimal number of times needed to keep the simulation both **accurate and efficient**. This is my understanding of the subject at the moment, in the future probably would be valuable to plot divergence errors inbetween steps to get some actual data on the subject.

### Conclusion

Finally densities moving along a velocity field that's diffusing and advecting itself and stays (mostly) divergent-free.

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<div id="velocity-sim" class="sketch-container"></div>
<script type="module">
  import { createFluidSim } from "./scripts/fluid-sketch.js";
  createFluidSim("velocity-sim", 
  { useDiffuseAdvection: true, useStaticVelocityField: false, useVelocityStep: true });
</script>
