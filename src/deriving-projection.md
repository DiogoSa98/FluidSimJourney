# Deriving the Projection Method

_Reference: [Projection_method_(fluid*dynamics)](https://en.wikipedia.org/wiki/Projection_method*(fluid*dynamics))*

For the pressure/incompressibility part, Equation (2.10), we’ll develop
an algorithm called project(∆t,u) that calculates and applies just the
right pressure to make u divergence-free and also enforces the solid wall
boundary conditions.

When we move fluid around and want it to conserve volume,
the velocity field we are moving it in must be divergence-free: we covered
that already in Chapter 1. So we want to make sure we only run advect()
with the output of project():

We still haven’t explained why this routine is called project. You can
skip over this section if you’re not interested.
If you recall from your linear algebra, a projection is a special type of
linear operator such that if you apply it twice, you get the same result
as applying it once. For example, a matrix P is a projection if P2 = P.
It turns out that our transformation from u to un+1 is indeed a linear
projection.
If you want, you can trace through the steps to establish the linearity:
the entries of b are linear combinations of the entries of u, the pressures
p =A−1b are linear combinations of the entries of d, and the new velocities
un+1 are linear combinations of u and p.
Physically, it’s clear that this transformation has to be a projection.
The resulting velocity field, un+1, has discrete divergence equal to zero.
So if we repeated the pressure step with this as input, we’d first evaluate
b =0, which would give constant pressures and no change to the velocity.
