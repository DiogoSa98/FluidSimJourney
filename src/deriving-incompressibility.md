# Deriving the Incompressibility Constraint

_Reference: [Fluid Simulation for Computer Games, Second Edition - Robert Bridson, Appendix B]()_

This section is taken straight out of Bridson's work.
We begin with the **principle of mass conservation**. If no fluid is entering or leaving a given region of space there should be no gain/loss of mass along time, the total mass inside that region must remain constant.

### Total mass in a region

Let’s consider some fixed region of space, denoted by $\Omega$.
So, because $\rho = m / V$ we can think of the total mass in the region as adding up infinitesmly small bits of density multiplied by the tiny volume $d\Omega$, that is integrating the density field $\rho(\mathbf{x}, t)$ over the volume:

$$
M(t) = \iiint_{\Omega} \rho \, d\Omega
$$

### Rate of change of mass

The rate of change of mass with respect to time only changes as fluid enters or leaves the region. Since mass cannot be created or destroyed inside $\Omega$, the only way $M$ changes is through **flux across its boundary**$\partial\Omega$. This is basically just Flux from multivariable calculus; which equates to breaking up the surface that bounds $\Omega$ into infinitesimal small pieces of surface $\partial\Omega$ and measuring how much mass is going through a piece which we can do by multiplying density with the dot product between the velocity and surface normal at that "tiny piece".

Integrating over the whole surface gives:

$$
\frac{dM}{dt} = - \iint_{\partial \Omega} \rho\, (\mathbf{u} \cdot \hat{\mathbf{n}})\, dS
$$

Note the integral is negative because $\hat{\mathbf{n}}$ is the outward-pointing normal, flow leaving means less mass in region so $M$ decreases (negative rate of change).

### Applying the divergence theorem

Then, also from multivariable calculus, we resort to the magnificent divergence theorem which states that adding up all the little bits of outward flow in a volume using a triple integral of divergence gives the total outward flow from that volume, as measured by the flux through its surface.

$$
\iint_{\partial \Omega} \rho\, (\mathbf{u} \cdot \hat{\mathbf{n}})\, dS = \iiint_{\Omega} \nabla \cdot (\rho \mathbf{u})\, d\Omega
$$

Substituting into the mass rate equation:

$$
\frac{dM}{dt} = - \iiint_{\Omega} \nabla \cdot (\rho \mathbf{u})\, d\Omega
$$

### Expressing $dM/dt$ as a volume integral

On the other hand, from the definition of $M(t)$:

$$
M(t) = \iiint_{\Omega} \rho\, d\Omega
$$

we can take the time derivative (assuming $\Omega$ is fixed in space) and move the derivative inside the integral:

$$
\frac{dM}{dt} = \iiint_{\Omega} \frac{\partial \rho}{\partial t}\, d\Omega
$$

_(We can safely move the derivative inside because both the region and the limits of integration are constant — only the integrand, the density, changes with time.)_

### Equating both expressions for $dM/dt$

Now we have two equivalent expressions for the rate of change of mass:

$$
\iiint_{\Omega} \frac{\partial \rho}{\partial t}\, d\Omega = - \iiint_{\Omega} \nabla \cdot (\rho \mathbf{u})\, d\Omega
$$

Since this equality must hold for **any** region $\Omega$, the integrands themselves must be equal.  
This gives the **continuity equation**:

$$
\frac{\partial \rho}{\partial t} + \nabla \cdot (\rho \mathbf{u}) = 0
$$

From here we could simply state that for our fluid to be incompressible we want density to remain constant (non-zero and unchanging) by definition. So $\frac{\partial \rho}{\partial t} = 0$ and pull $\rho$ out of $\nabla \cdot (\rho \mathbf{u})$ yielding the incompressible condition $\nabla \cdot \mathbf{u} = 0$

However, this explanation skips over an important idea — how density changes as a fluid moves.
To understand that properly, we need to introduce the **material derivative**.

### The Material Derivative

Before moving forward, let's clarify what we mean when we talk about properties of “moving particles” in a fluid.  
In most texts (including Bridson’s), when we refer to a _particle_ of fluid, we’re not talking about a literal molecule, but rather an infinitesimally small “chunk” or “tagged bit” of fluid — small enough to assume uniform properties inside it, but large enough to contain many molecules.

This particle can have a density, temperature, pressure, etc. — those quantities describe **the fluid contained in that moving element**, not a single molecule.  
So when we say “the density of a particle changes,” we mean the density of that small moving volume of fluid — not the density of matter itself (which indeed stays constant for an incompressible fluid).

It might be easier to picture this idea with temperature, suppose you have a pan of water over a fire:

- The fluid could cool down over time as the sun sets (a time-dependent change).
- Or, as the particle moves into a different region of the fluid where the temperature is higher or lower (a spatial change).

Both effects together describe the _total_ rate of change experienced by that moving particle.

That total rate of change is captured mathematically by the **material derivative**.

Let $f(t, \mathbf{x}(t))$ represent some property of the fluid (like density, temperature, etc.) at time $t$ and position $\mathbf{x}(t) = (x(t), y(t))$, the current position of a moving fluid particle.

By the chain rule:

$$
\frac{Df}{Dt} = \frac{\partial f}{\partial t} + \frac{\partial f}{\partial x}\frac{dx}{dt} + \frac{\partial f}{\partial y}\frac{dy}{dt}
$$

Here $\frac{dx}{dt} = u_x$ and $\frac{dy}{dt} = u_y$ are the components of the velocity vector $\mathbf{u} = (u_x, u_y)$.

We can compactly express this as:

$$
\frac{Df}{Dt} = \frac{\partial f}{\partial t} + \mathbf{u} \cdot \nabla f
$$

where $\nabla = (\partial_x, \partial_y)$ is the del (gradient) operator.  
This second term $\mathbf{u} \cdot \nabla f$ represents the **directional derivative** of $f$ along the direction of motion given by velocity $\mathbf{u}$ — how much $f$ changes as the particle moves through space.

In short, the material derivative tells us _how a quantity changes for a specific moving bit of fluid_, combining both the explicit change in time and the change due to motion.

### Finalizing the Incompressibility Constraint

From the principle of mass conservation we arrived at the **continuity equation**:

$$
\frac{\partial \rho}{\partial t} + \nabla \cdot (\rho \mathbf{u}) = 0
$$

We can expand the divergence term using the **product rule for divergence**:

$$
\nabla \cdot (\rho \mathbf{u}) = \rho\\, (\nabla \cdot \mathbf{u}) + \mathbf{u} \cdot \nabla \rho
$$

Substituting that into the **continuity equation** gives:

$$
\frac{\partial \rho}{\partial t} + \mathbf{u} \cdot \nabla \rho + \rho\\, (\nabla \cdot \mathbf{u}) = 0
$$

Now notice that the first two terms together are exactly the **material derivative of density**:

$$
\frac{D\rho}{Dt} = \frac{\partial \rho}{\partial t} + \mathbf{u} \cdot \nabla \rho
$$

So we can rewrite the equation as:

$$
\frac{D\rho}{Dt} + \rho\\, (\nabla \cdot \mathbf{u}) = 0
$$

Finally, if we assume the fluid is **incompressible**, that means each fluid parcel maintains constant density as it moves, $\frac{D\rho}{Dt} = 0$, plugging that in:

$$
\rho\\, (\nabla \cdot \mathbf{u}) = 0
$$

and since $\rho \neq 0$, we arrive at the **incompressibility condition**:

$$
\nabla \cdot \mathbf{u} = 0
$$
