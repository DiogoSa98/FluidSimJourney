# Linear vs. Nonlinear Equations

The key feature that makes a PDE **nonlinear** is _self-reference_ — the dependent variable appears multiplied or composed with itself.

If we unpack the advection equation

$$
\frac{\partial u}{\partial t} = -(\mathbf{u} \cdot \nabla)\mathbf{u},
$$

we see that the rate of change of $\\mathbf{u}$ with respect to time depends on $\\mathbf{u}$ itself _and its gradient_.  
This creates a feedback loop: the velocity field modifies itself over time.

In contrast, consider the diffusion term

$$
\frac{\partial u}{\partial t} = \nu \nabla^2 u.
$$

If we scale $u$ by a constant factor $a$, the entire equation still holds with the same scaling:

$$
L(a u) = a L(u),
$$

which means the relationship is **linear**.

## **Superposition Principle**

For linear differential equations, **superposition holds**.  
If $u\_1$ and $u\_2$ are both solutions, then any linear combination

$$
\alpha u_1 + \beta u_2
$$

is also a valid solution.

Linear operators — such as gradient ($\nabla$), divergence ($\nabla \cdot$), Laplacian ($\nabla^2$), or constant multiplication — all satisfy this property:

$$
L(au_1 + bu_2) = aL(u_1) + bL(u_2)
$$

For example:

$$
L(u) = \frac{\partial u}{\partial x} \Rightarrow L(au_1 + bu_2) = a\frac{\partial u_1}{\partial x} + b\frac{\partial u_2}{\partial x}.
$$

## **Nonlinear Operator Example**

Now let’s take a nonlinear operator:

$$
L(u) = u \frac{du}{dx}.
$$

If this were linear, we should have

$$
L(au_1 + bu_2) = aL(u_1) + bL(u_2),
$$

but let’s check:

$$
L(au_1 + bu_2) = (au_1 + bu_2) \frac{d(au_1 + bu_2)}{dx} = (au_1 + bu_2)(a\frac{du_1}{dx} + b\frac{du_2}{dx}).
$$

Expanding:

$$
a^2u_1\frac{du_1}{dx} + ab\\,u_1\frac{du_2}{dx} + ab\\,u_2\frac{du_1}{dx} + b^2u_2\frac{du_2}{dx}.
$$

Compare that to:

$$
aL(u_1) + bL(u_2) = a\,u_1\frac{du_1}{dx} + b\,u_2\frac{du_2}{dx}.
$$

They are **not equal** — extra cross terms appear.  
This violates superposition, confirming that $L(u) = u \frac{du}{dx}$ is a **nonlinear** operator.

---

TODO explain further stuff
