# Diffuse Good

In the last section we got a minimal diffusion simulation up and running. Pretty cool right?!  
But if you tried bumping up the diffusion coefficient, you probably noticed the simulation freaks out — densities start to oscillate, blow up and form weird flickering patterns.

As Stam says in his paper:

> “For large diffusion rates the density values start to oscillate, become negative and finally diverge, making the simulation useless. This behavior is a general problem that plagues unstable methods.”

Stam is specifically referring to the fact that the **Forward Euler** method for numerically integrating the diffusion equation is _unstable_. What that means is, in the scheme:

$$
x(t + \Delta t) = x(t) + \Delta t \frac{dx(t)}{dt}
$$

for a large enough time step $\Delta t$, the values of $x$ will eventually blow up — growing to infinity.

For the diffusion equation $f(x) = k \nabla^2 x$, this instability happens because each update depends _entirely_ on the previous state. Small numerical errors get amplified over time, especially when $\Delta t$ or $k$ (the diffusion rate) is large.

In theory, we could just reduce $\Delta t$ until it stabilizes, but that would mean doing many more iterations per frame — not very practical if we want smooth, real-time behavior. It’s like trying to stop a car from skidding by driving painfully slow; sure, it works, but it’s not exactly efficient.

Actually explaining _why_ the method is unstable is a bit technical, and you can read more about it in the **Numerical Integration of ODEs** section (TODO: actually study and write this).

## Backward Euler to the rescue

To solve this problem, Stam switches from **Forward Euler** to **Backward Euler**, which is an _implicit_ method.

Instead of estimating the future state using the derivative of the _current_ state, Backward Euler uses the derivative of the _future_ state — the one we’re trying to compute.

$$
\frac{dx(t+\Delta t)}{dt} \approx \frac{x(t+\Delta t) - x(t)}{\Delta t}
$$

Rearranging:

$$
x(t + \Delta t) = x(t) + \Delta t \frac{dx(t+\Delta t)}{dt}
$$

This is what makes the method **implicit** — the future value $x(t + \Delta t)$ appears on both sides of the equation. We can’t just compute it directly; we have to **solve** for it.

That might sound like extra work (and it is), but the big advantage is stability: implicit methods like Backward Euler remain stable no matter how large $\Delta t$ is. You can take huge time steps, crank up the diffusion coefficient, and the simulation will still behave.

Let’s see what Backward Euler looks like when applied to the diffusion equation.

The continuous diffusion equation can be written as:

$$
\frac{dx}{dt} = k \nabla^2 x
$$

If we apply Backward Euler, we replace the derivative term using the future value $x(t + \Delta t)$:

$$
x(t + \Delta t) = x(t) + \Delta t k \nabla^2 x(t + \Delta t)
$$

Rearranging:

$$
x(t) = x(t + \Delta t) - \Delta t  k \nabla^2 x(t + \Delta t)
$$

And this is exactly what Stam writes in his code (just in discrete form):

```c
x0[IX(i,j)] = x[IX(i,j)] - a * (x[IX(i-1,j)] + x[IX(i+1,j)] + x[IX(i,j-1)] + x[IX(i,j+1)]
                                - 4 * x[IX(i,j)]
);
```

Remember $a = \Delta t * k * N^2$ is the scaled diffusion strength.

Because $x(t + \Delta t)$ appears on both sides of the equation — directly and inside the Laplacian — this is an **implicit equation**. In other words, we can’t just “plug and chug” like before; we have to _rearrange_ and _solve_ for $x(t + \Delta t)$ itself.

## Solving the system of equations

What we're dealing with here is a **linear system of equations** — we have one equation per cell of our grid.  
We can express the problem in matrix form:

$$
A x = b
$$

or, more specifically for our diffusion step,

$$
(I - \Delta t  k  L)  x^{n+1} = x^{n}
$$

where:

- $b = x^{n}$ is a vector containing our previous density grid values,
- $x = x^{n+1}$ is the vector of unknowns (the new densities we want to compute), and
- $A = (I - \Delta t k L)$ is our **matrix of coefficients**, with $L$ being the **discrete Laplacian matrix**.

If we were to solve this explicitly, we’d write:

$$
x = A^{-1} b
$$

This is what Stam refers to in his paper:

> “This is a linear system for the unknowns $x[IX(i,j)]$. We could build the matrix for this linear system and then call a standard matrix inversion routine. However, this is overkill for this problem because the matrix is very sparse: only very few of its elements are non-zero. Consequently, we can use a simpler iterative technique to invert the matrix.”

Indeed, a quick search shows that most matrix inversion algorithms have a complexity of $O(n^3)$ for an $n \times n$ matrix — which is way too costly for large grids.  
Stam instead takes advantage of the **structure and sparsity** of our coefficient matrix to solve the equations in a much more **straightforward and efficient** manner.

### 1D diffusion

For simplicity's sake let's suppose instead of a **2D grid** we are working with a **1D** rod with only 4 cells.

For 1D, the **discrete Laplacian** is:

$$
\nabla^2 x_i = x_{i-1} + x_{i+1} - 2x_i
$$

Substituting this into the **Backward Euler** equation (to avoid filling the screen with math notation I'll say $x^{n+1} = x$):

$$
x^n_i = x_i - a(x_{i-1} + x_{i+1} - 2x_i)
$$

Expanding terms:

$$
x^n_i = (1 + 2a)x_i - a x_{i-1} - a x_{i+1}
$$

In matrix form:

$$
\begin{bmatrix} 1+2a & -a & 0 & 0 \\\\ -a & 1+2a & -a & 0 \\\\ 0 & -a & 1+2a & -a \\\\ 0 & 0 & -a & 1+2a \end{bmatrix} \begin{bmatrix} x_0 \\\\ x_1 \\\\ x_2 \\\\ x_3 \end{bmatrix} = \begin{bmatrix} x^n_0 \\\\ x^n_1 \\\\ x^n_2 \\\\ x^n_3 \end{bmatrix}
$$

which matches the general form:

$$
(I - \Delta t k L) x^{n+1} = x^{n}
$$

At the **boundaries**, I'm assuming cells outside our domain (like $x_{-1}$ or $x_4$) have value 0. Boundaries are at the edge of my procupations, I'll leave it for future me to go more in depth on how different boundary conditions affect the problem.

#### Observing the Matrix

Looking at matrix $A$, we can note the following:

1.  As Stam said, **it’s very sparse** — most coefficients are zero (TODO CHECK -> formally, a sparse matrix is one where the majority of elements are zero).
2.  **It’s diagonally dominant** — since $a > 0$, the diagonal entries $(1 + 2a)$ are larger than the sum of the magnitudes of the other entries in each row.

This diagonal dominance is why the **Gauss-Seidel relaxation method** works here — it’s an iterative technique that approximates the solutions for diagonally dominant systems.  
(See the _Background: Numerical Solvers for Linear Systems_ section for more detail.)

#### Solving with Gauss-Seidel

Let’s rewrite each equation to isolate $x_i$:

$$
\begin{aligned} x_0 &= \frac{x^n_0 + ax_1 + 0x_2 + 0x_3}{1 + 2a} \\\\ x_1 &= \frac{x^n_1 + ax_0 + ax_2 + 0x_3}{1 + 2a} \\\\ x_2 &= \frac{x^n_2 + 0x_0 + ax_1 + ax_3}{1 + 2a} \\\\ x_3 &= \frac{x^n_3 + 0x_0 + 0x_1 + a x_2}{1 + 2a} \end{aligned}
$$

We initialize all $x_i = 0$ as our initial guess.  
In practice, this is already done at the start of the simulation — at frame 0 we start with all densities at 0, and in subsequent frames, we use the previous frame’s values as our initial guess.

Then we iteratively update each $x_i$ using the most recent values available — this is the **Gauss-Seidel** idea.  
(If we used only old values from the previous iteration, that would be **Jacobi**.)

A key detail is that we don’t need to sum across the entire row of the matrix. We already know that only the **immediate neighbors** contribute non-zero terms (this is why Stam enfasises the sparsity nature of the matrix), and we know their coefficient values (−a).

##### Pseudocode for 1D Diffusion with Gauss-Seidel

```c
for (k = 0; k < maxIterations; k++) {
  for (i = 1; i < N; i++) {
    x[i] = (x0[i] + a * (x[i-1] + x[i+1])) / (1 + 2*a);
  }
}
```

### 2D diffusion

The concept generallizes easily to 2D and 3D. The core differences are:

1. The discretization of the Laplacian changes to include the 4 (in 2D) or 6 (in 3D) neighboring cells.
2. We need to find a way to map our multidimensional indices (i, j) or (i, j, k) into a 1D array so we can fill our coefficient matrix and term vectors.

For the 2D case, we already know the discrete form of the Laplacian in the Backward Euler update rule:

$$
x_0(i,j) = x(i,j) - a \left( x(i-1,j) + x(i+1,j) + x(i,j-1) + x(i,j+1) - 4x(i,j) \right)
$$

We can rearrange this to solve for $x(i,j)$:

$$
x(i,j) = \frac{x_0(i,j) + a \left( x(i-1,j) + x(i+1,j) + x(i,j-1) + x(i,j+1) \right)}{1 + 4a}
$$

This gives us the update rule used by the Gauss–Seidel method for diffusion, which is exactly what Stam implements in his code:

```c
void diffuse (int N, int b, float *x, float *x0, float diff, float dt) {
    int i, j, k;
    float a = dt * diff * N * N;
    for (k = 0; k < 20; k++) {
        for (i = 1; i <= N; i++) {
            for (j = 1; j <= N; j++) {
                x[IX(i,j)] = (x0[IX(i,j)] + a * (
                    x[IX(i-1,j)] + x[IX(i+1,j)] +
                    x[IX(i,j-1)] + x[IX(i,j+1)]
                )) / (1 + 4 * a);
            }
        }
        set_bnd(N, b, x);
    }
}
```

That said, I still want to show how the problem looks when expressed in matrix form, so we can see how its sparsity and diagonal dominance extend to multiple dimensions.

Below is the **fully expanded $\(9\times9\)$** matrix system $\(A\mathbf{x}=\mathbf{b}\)$ for a $\(3\times3\)$ grid (so $\(N=n^2=9\)$ unknowns). I used the usual row-major indexing:

$$
m = \text{index}(i,j) = i + 3j \quad\text{for}\quad i,j\in\{0,1,2\}
$$

The grid would look something like (each cell is indexed $x_{i,j}^{m}$)

$$
\begin{bmatrix}
x_{0,0}^{0} & x_{1,0}^{1} & x_{2,0}^{2} \\\\
x_{0,1}^{3} & x_{1,1}^{4} & x_{2,1}^{5} \\\\
x_{0,2}^{6} & x_{1,2}^{7} & x_{2,2}^{8}
\end{bmatrix}
$$

Matrix A:

$$
\begin{bmatrix}
1+4a & -a & 0 & -a & 0 & 0 & 0 & 0 & 0 \\\\
-a & 1+4a & -a & 0 & -a & 0 & 0 & 0 & 0 \\\\
0 & -a & 1+4a & 0 & 0 & -a & 0 & 0 & 0 \\\\
-a & 0 & 0 & 1+4a & -a & 0 & -a & 0 & 0 \\\\
0 & -a & 0 & -a & 1+4a & -a & 0 & -a & 0 \\\\
0 & 0 & -a & 0 & -a & 1+4a & 0 & 0 & -a \\\\
0 & 0 & 0 & -a & 0 & 0 & 1+4a & -a & 0 \\\\
0 & 0 & 0 & 0 & -a & 0 & -a & 1+4a & -a \\\\
0 & 0 & 0 & 0 & 0 & -a & 0 & -a & 1+4a
\end{bmatrix}
$$

**Important note about boundaries:**  
The matrix shown above assumes that **every cell has 4 neighbors**, meaning the discrete Laplacian always uses all four surrounding values. Under this assumption, every diagonal entry is $1 + 4a$.

This is exactly how Stam treats the problem in his paper and implementation — the solver itself doesn’t worry about missing neighbors or special boundary handling. Instead, **all cells are treated uniformly**, and any boundary conditions are enforced afterward through the `set_bnd()` function, which directly modifies the edge values after each relaxation step.

If we were to remove that assumption — i.e., **not include any ghost contributions** outside the grid — then boundary cells would have fewer valid neighbors. Corners would have only 2 neighbors, edges 3, and interior cells 4. In that case, each corresponding diagonal term would change to $1 + (\text{number of neighbors})*a$, so corners become $1 + 2a$, edges $1 + 3a$, and only interior cells remain $1 + 4a$.

## Closing thoughts

To me, it's amazing how a few apparently simple lines of code carry so much mathematical depth and careful reasoning.

I'm hoping in the future I get to explore other methods for improving the approximation of the derivative (I've heard of **Runge-Kutta** method which is basically backwards euler but with more steps) and more accurate, faster solvers for the resulting linear systems (a little bird told me that **Conjugate Gradient** with some tricks is the way to go).

I should also dive deeper into boundary conditions and study how different types (Dirichlet, Neumann, periodic, etc.) influence the simulation.

Another thing Stam doesn’t really touch on in this paper is how many iterations of the Gauss–Seidel relaxation to use. He defaults to 20, and I currently do the same, but ideally, I should measure the residual error at each iteration and determine the minimum number needed for a visually stable and accurate result.

Anyway, those are future adventures. For now, here’s our implicit diffusion solver in action — try bumping up the diffusion coefficient and see how beautifully stable it remains:

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<div id="diffusion-good" class="sketch-container"></div>
<script src="scripts/density-sketch.js"></script>
<script>
  createDiffusionSim("diffusion-good");
</script>
