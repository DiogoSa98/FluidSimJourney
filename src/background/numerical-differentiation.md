# Numerical Differentiation

Numerical differentiation is a technique for approximating the derivative of a function using finite differences between points, rather than computing the derivative analytically. This approach is essential when an analytical derivative is difficult or impossible to obtain, or when we only have discrete data points. It allows us to estimate the rate of change of a function by approximating the slope of a tangent line using a small step size $h$.

The most common finite difference methods are:

- **Forward difference:** uses the function value at a point and a point ahead.
- **Backward difference:** uses the function value at a point and a point behind.
- **Central difference:** averages forward and backward differences for higher accuracy.

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

- The **first term** $\color{aquamarine}{f'(x)}$ is exactly what we want: the derivative at $x$.
- The **remaining terms** $\color{#ff7faa}{\frac{h}{2} f''(x) + \frac{h^2}{6} f^{(3)}(x) + \cdots}$ are the **error** introduced by the finite difference approximation.

We usually summarize this error using the **leading order term**, which is $\mathcal{O}(h)$ here. Intuitively, this means the discrepancy between the true derivative and our approximation scales with $h$.

In other words:

- If you want the error to be 10 times smaller, you roughly need to make $h$ 10 times smaller.
- The higher-order terms (like $h^2, h^3, \dots$) quickly become negligible as $h$ gets small.
- Essentially, $h$ “dominates” the error. For example: if $h = 0.1$, then $h^2 = 0.01$ and $h^3 = 0.001$, so the first term in the error really dictates how accurate our approximation is.

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

- The leading order error is again $\mathcal{O}(h)$, but with opposite sign compared to the forward difference.

### A Better Way to Think About the Central Difference

So far, we saw that both the forward and backward difference approximations introduce an error term that comes from the **second derivative** in the Taylor expansion.

That might get you wondering — _is there a way to make that error smaller?_

Well, since we know where the error comes from (the second derivative term), maybe we can arrange our approximations in such a way that those error terms **cancel each other out**.

Let’s look again at the Taylor expansions of $f(x+h)$ and $f(x-h)$:

$$
\begin{aligned} f(x+h) &= f(x) + h f'(x) + \frac{h^2}{2!} f''(x) + \frac{h^3}{3!} f^{(3)}(x) + \cdots,\end{aligned}
$$

$$
\begin{aligned} f(x-h) &= f(x) - h f'(x) + \frac{h^2}{2!} f''(x) - \frac{h^3}{3!} f^{(3)}(x) + \cdots. \end{aligned}
$$

Notice how the **even-order terms** (those with $f''(x), f^{(4)}(x), \dots$) have the same sign, while the **odd-order terms** (those with $f'(x), f^{(3)}(x), \dots$) flip signs.

Now, if we _subtract_ these two equations, the even terms (and thus our second derivative error) cancel out perfectly:

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
We _canceled_ their dominant errors by exploiting symmetry.

This gives us a **much more accurate** approximation — the leading error term is now $\mathcal{O}(h^2)$.

That means if you make $h$ 10× smaller, your error gets roughly **100× smaller!**

This same logic — using Taylor expansions to cancel higher-order terms - is the foundation of more advanced finite difference schemes, if you’d like to explore that, look up **higher-order finite difference formulas**

### Numerical Differentiation of the Second Derivative

What about the _second_ derivative?

Formally, we can define it as:

$$
f''(x) = \frac{f'(x+h) - f'(x)}{h}.
$$

At first glance, you might think: “Okay, I already have formulas for the first derivative — I’ll just plug those in here.” That would probably _work_, but it tends to introduce more numerical error? (though honestly i haven't checked this, it might be a fun exerciset)

Instead, let’s stick with the idea we used before — start from the Taylor series and see if we can combine terms to isolate the the second derivative while canceling as much of the rest as possible.

Looking back at the Taylor expansions for $f(x + h)$ and $f(x - h)$:

$$
\begin{aligned} f(x+h) &= f(x) + h f'(x) + \frac{h^2}{2!} f''(x) + \frac{h^3}{3!} f^{(3)}(x) + \cdots,\end{aligned}
$$

$$
\begin{aligned} f(x-h) &= f(x) - h f'(x) + \frac{h^2}{2!} f''(x) - \frac{h^3}{3!} f^{(3)}(x) + \cdots. \end{aligned}
$$

We can see that if we **add** these two equations together the first derivative and all other _odd_ terms cancel out, leaving only even-order terms:

$$
f(x + h) + f(x - h) = 2f(x) + h^2 f''(x) + \frac{h^4}{12} f^{(4)}(x) + \mathcal{O}(h^6).
$$

So to finish isolating the second derivative we just have to subtract $2f(x)$ and divide by $h^2$

$$
f''(x) = \frac{f(x + h) - 2f(x) + f(x - h)}{h^2} + \mathcal{O}(h^2).
$$

And there we have it — the **central difference formula for the second derivative**.

## Numerical roundoff error

Given all of this, one might think: _“Well, we can just make $h$ really, really small and get a super accurate derivative!”_  
But one would be wrong — because computers can’t store all decimal numbers exactly.

In **double-precision floating point** format (IEEE 754), we use **64 bits** of memory, divided as follows:

- 1 bit for the **sign**,
- 11 bits for the **exponent**, and
- 52 bits for the **mantissa** (plus one **implicit** bit).

This gives us about $53 \times \log_{10}(2) \approx 15.955$ digits of precision — roughly **16 decimal digits**.

That means that for a number with an infinite fractional part, such as $\sqrt{2}$, adding anything smaller than $10^{-16}$ won’t change its stored value:

$$
\sqrt{2} + 10^{-16}/2 = \sqrt{2}.
$$

This is important because when performing **millions of operations**, these tiny rounding errors accumulate.

Let’s look at the **central difference** formula again and account for rounding error.  
Each sample of $f$ will introduce a small roundoff error $\varepsilon_r$.

$$
\frac{df}{dx} \approx \frac{f(x+h) - f(x-h) + 2\varepsilon_r}{2h} + \mathcal{O}(h^2)
$$

If we separate the error contributions, the total error $E$ can be approximated as

$$
E \leq \frac{\varepsilon_r}{h} + \frac{m}{6}h^2,
$$

where:

- $\varepsilon_r$ is the **roundoff error**,
- the $\frac{m}{6}h^2$ term comes from the Taylor expansion ($3! = 6$).
- $m = \max |f^{(3)}(x)|$ for $x \in [x-h, x+h]$ (a constant bounding the third derivative),

Notice what happens as $h$ changes:

- As $h \to 0$, the **roundoff term** $\varepsilon_r / h$ → ∞.
- As $h \to \infty$, the **truncation term** $(m/6)h^2$ → ∞.

So there must be a **sweet spot** — a minimum total error at some optimal $h$.

To find it, we minimize $E(h)$:

$$
\frac{dE}{dh} = 0 \quad \Rightarrow \quad -\frac{\varepsilon_r}{h^2} + \frac{m}{3}h = 0
$$

$$
\Rightarrow \quad h_{\text{opt}} = \sqrt[3]{\frac{3\varepsilon_r}{m}}.
$$

If we assume $m$ is roughly of order 1 (not too large or small), and $\varepsilon_r \approx 10^{-16}$ for double precision, then:

$$
h_{\text{opt}} \approx \sqrt[3]{3 \times 10^{-16}} \approx 10^{-5}.
$$

So in practice, an $h$ value around **10⁻⁵** is near-optimal for central differences in double precision.  
Of course, in more advanced or sensitive simulations, computing this value adaptively can be worthwhile.
