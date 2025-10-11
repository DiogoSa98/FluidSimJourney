# Numerical Differentiation
Numerical differentiation is a technique for approximating the derivative of a function using finite differences between points, rather than computing the derivative analytically. This approach is essential when an analytical derivative is difficult or impossible to obtain, or when we only have discrete data points. It allows us to estimate the rate of change of a function by approximating the slope of a tangent line using a small step size $h$.

The most common finite difference methods are:

-   **Forward difference:** uses the function value at a point and a point ahead.
    
-   **Backward difference:** uses the function value at a point and a point behind.
    
-   **Central difference:** averages forward and backward differences for higher accuracy.
    

These methods differ in their accuracy and how the error scales with the step size $h$.

## Approximating the Derivative

Suppose we have a function $f(x)$ for which we cannot compute the derivative analytically, or we are working with a discrete set of data points. How can we approximate $f'(x)$?

Starting from the definition of the derivative:

$$
f'(x) = \lim_{h \to 0} \frac{f(x+h)-f(x)}{h},
$$

we can replace the limit with a small, finite $h$ to obtain an approximation. This leads to the **forward difference** formula:

$$
f'(x) \approx \frac{f(x+h)-f(x)}{h}.
$$

Similarly, we can look backward instead of forward:

$$
f'(x) \approx \frac{f(x) - f(x-h)}{h},
$$

which gives the **backward difference** formula.

We can also combine both forward and backward differences to improve accuracy, giving the **central difference**:
Now, looking at these two, one might think "Why not combine them? Maybe if we average the forward and backward slopes, we get something better.” And indeed, that leads us to the **central difference**:

$$
f'(x) \approx \frac{f(x+h) - f(x-h)}{2h}.
$$

I guess one could come up with a bunch of ways to approximate the derivative at a point, but maybe more importantly we should be thinking how good is any given approximation?

# TODO GRAPH THESE 3 BAD BOYS

## Understanding the Error

To analyze how accurate these approximations are, we can use a Taylor series expansion.

The Taylor expansion of $f(x+h)$ around $x$ is:

$$
f(x+h) = f(x) + h f'(x) + \frac{h^2}{2} f''(x) + \frac{h^3}{6} f^{(3)}(x) + \cdots
$$

where $f^{(n)}(x)$ is the $n$\-th derivative of $f$ at $x$, and the terms continue indefinitely. The notation $o(h^n)$ refers to terms that scale like $h^n$ or smaller, which become negligible as $h \to 0$.

### Forward Difference Error

Substitute the Taylor expansion into the forward difference formula:

$$
\frac{f(x+h) - f(x)}{h}.
$$

$$
\frac{f(x+h) - f(x)}{h} = \color{aquamarine}{f'(x)} \color{#ff7faa}+ {\frac{h}{2} f''(x) + \frac{h^2}{6} f^{(3)}(x) + \cdots}
$$

-   The **first term** $\color{aquamarine}{f'(x)}$ is exactly what we want: the derivative at $x$.
    
-   The **remaining terms** $\color{#ff7faa}{\frac{h}{2} f''(x) + \frac{h^2}{6} f^{(3)}(x) + \cdots}$ are the **error** introduced by the finite difference approximation.
    

We usually summarize this error using the **leading order term**, which is $\mathcal{O}(h)$ here. Intuitively, this means the discrepancy between the true derivative and our approximation scales with $h$.

In other words:

-   If you want the error to be 10 times smaller, you roughly need to make $h$ 10 times smaller.
    
-   The higher-order terms (like $h^2, h^3, \dots$) quickly become negligible as $h$ gets small.
    
-   Essentially, $h$ “dominates” the error. For example: if $h = 0.1$, then $h^2 = 0.01$ and $h^3 = 0.001$, so the first term in the error really dictates how accurate our approximation is.

### Backward Difference Error

Similarly, for the backward difference:

$$
f'(x) \approx \frac{f(x) - f(x-h)}{h},
$$

expand $f(x-h)$ using Taylor:

$$
f(x-h) = f(x) - h f'(x) + \frac{h^2}{2} f''(x) - \frac{h^3}{6} f^{(3)}(x) + \cdots
$$

Then:

$$
\frac{f(x) - f(x-h)}{h} = \frac{f(x) - \big(f(x) - h f'(x) + \frac{h^2}{2} f''(x) - \cdots \big)}{h} = \color{aquamarine}f'(x) \color{#ff7faa}- \frac{h}{2} f''(x) + \frac{h^2}{6} f^{(3)}(x) - \cdots
$$

-   The leading order error is again $\mathcal{O}(h)$, but with opposite sign compared to the forward difference.
    

### A Better Way to Think About the Central Difference

So far, we saw that both the forward and backward difference approximations introduce an error term that comes from the **second derivative** in the Taylor expansion.

That might get you wondering — *is there a way to make that error smaller?*

Well, since we know where the error comes from (the second derivative term), maybe we can arrange our approximations in such a way that those error terms **cancel each other out**.

Let’s look again at the Taylor expansions of $f(x+h)$ and $f(x-h)$:

$$
\begin{aligned} f(x+h) &= f(x) + h f'(x) + \frac{h^2}{2!} f''(x) + \frac{h^3}{3!} f^{(3)}(x) + \cdots,\end{aligned}
$$
$$
\begin{aligned} f(x-h) &= f(x) - h f'(x) + \frac{h^2}{2!} f''(x) - \frac{h^3}{3!} f^{(3)}(x) + \cdots. \end{aligned}
$$

Notice how the **even-order terms** (those with $f''(x), f^{(4)}(x), \dots$) have the same sign, while the **odd-order terms** (those with $f'(x), f^{(3)}(x), \dots$) flip signs.

Now, if we *subtract* these two equations, the even terms (and thus our second derivative error) cancel out perfectly:

$$
f(x+h) - f(x-h) = 2h f'(x) + \frac{2h^3}{3!} f^{(3)}(x) + \cdots
$$

Dividing both sides by $2h$ gives:

$$
\frac{f(x+h) - f(x-h)}{2h} = \color{aquamarine}f'(x) \color{#ff7faa}+ \frac{h^2}{3!} f^{(3)}(x) + \cdots
$$

There it is — the **central difference formula**.

$$
\boxed{f'(x) \approx \frac{f(x+h) - f(x-h)}{2h}}
$$

The key insight here is that we didn’t just “average” two estimates.  
We *canceled* their dominant errors by exploiting symmetry.

This gives us a **much more accurate** approximation — the leading error term is now $\mathcal{O}(h^2)$.

That means if you make $h$ 10× smaller, your error gets roughly **100× smaller!**

This same logic — using Taylor expansions to cancel higher-order terms - is the foundation of more advanced finite difference schemes, if you’d like to explore that, look up **higher-order finite difference formulas**

# TODO NUMERICAL DIFFERENTIATION OF SECOND DERIVATIVE