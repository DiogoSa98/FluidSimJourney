# Pressure as an Enforcer of Incompressibility

## Why a velocity field can fail to be “mass conserving” even in continuum math

Start from the incompressible Navier–Stokes momentum equation (written schematically):

$$
\frac{\partial \mathbf{u}}{\partial t} = -(\mathbf{u}\cdot\nabla)\mathbf{u} + \nu \nabla^2 \mathbf{u} + \mathbf{f} - \frac{1}{\rho}\nabla p.
$$

And the incompressibility (mass conservation) constraint:

$$
\nabla\cdot\mathbf{u} = 0.
$$

Those two together fully describe the dynamics. **But** notice: the momentum equation contains the pressure gradient $-\frac{1}{\rho}\nabla p$. Pressure is not a “given” field — it is the unknown that enforces $\nabla\cdot\mathbf{u}=0$. Put another way:

- The momentum equation _alone_ (the left side and the first three RHS terms) prescribes how velocity would change if pressure didn’t exist.
- The incompressibility condition then **constrains** the allowable velocity fields; pressure must adjust so that the resulting $\mathbf{u}$ satisfies $\nabla\cdot\mathbf{u}=0$.

So a velocity field computed from the other terms (advection + viscosity + external forces) will generally **not** be divergence-free. That’s not a discretization error — it’s a consequence of the fact that the pressure term must be chosen to enforce the constraint.

---

## The usual projection derivation (compact)

Take a time-splitting viewpoint (how most solvers present it). Compute a tentative velocity $\mathbf{u}^*$ from advection/viscosity/forces **ignoring pressure**:

$$
\mathbf{u}^* = \mathbf{u}^n + \Delta t\big(-(\mathbf{u}\cdot\nabla)\mathbf{u} + \nu\nabla^2\mathbf{u} + \mathbf{f}\big).
$$

But the actual next-step velocity must satisfy

$$
\mathbf{u}^{n+1} = \mathbf{u}^* - \frac{\Delta t}{\rho}\nabla p^{n+1}, \qquad\text{with}\quad \nabla\cdot\mathbf{u}^{n+1}=0.
$$

Take divergence of the update and require zero divergence:

$$
0 = \nabla\cdot\mathbf{u}^{n+1} = \nabla\cdot\mathbf{u}^* - \frac{\Delta t}{\rho}\nabla^2 p^{n+1}.
$$

So pressure must solve the Poisson equation

$$
\nabla^2 p^{n+1} = \frac{\rho}{\Delta t}\,\nabla\cdot\mathbf{u}^*.
$$

Once you solve that for $p^{n+1}$, you subtract its gradient and get a velocity $\mathbf{u}^{n+1}$ that **by construction** satisfies $\nabla\cdot\mathbf{u}^{n+1}=0$.

---

## Intuition in plain words

- Think of the momentum update (advection + viscosity + forces) as stirring and nudging the fluid. That stirring generates a raw velocity field $\mathbf{u}^*$.
- But you also insist that “fluid parcels don’t compress/expand” (incompressibility). That requirement is an additional constraint the velocity must satisfy.
- **Pressure** is the field you choose so that, after you subtract its gradient, the velocity meets that constraint. Pressure acts like a Lagrange multiplier enforcing $\nabla\cdot\mathbf{u}=0$.
- So a velocity field _can_ imply local mass creation/destruction (i.e. nonzero divergence) unless the pressure term is set appropriately. That’s true in the continuous PDEs — not only because of numerics.

---

## Bottom line (brief)

- Stam’s phrase “force the velocity to be mass conserving” means: **choose the pressure so the velocity satisfies the incompressibility constraint**.
- This is a fundamental part of the PDE system, not merely a correction for discrete error. The projection step (solve Poisson, subtract gradient) is the practical way to enforce that constraint after updating momentum from the other terms.
