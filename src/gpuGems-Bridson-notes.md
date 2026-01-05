https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-30-real-time-simulation-and-rendering-3d-fluids

The chapter consists of two parts:

    Section 30.2 covers simulation, including smoke, water, fire, and interaction with solid obstacles, as well as performance and memory considerations.
    Section 30.3 discusses how to render fluid phenomena and how to seamlessly integrate fluid rendering into an existing rasterization-based framework.

As in Harris 2004, we store all quantities at cell centers for pedagogical simplicity, though a staggered MAC-style grid yields more-robust finite differences and can make it easier to define boundary conditions. (See Harlow and Welch 1965 for details.)

## TODO make the sim using a MAC-style grid!!! check the book

In a GPU implementation, cell attributes (velocity, pressure, and so on) are stored in several 3D textures. At each simulation step, we update these values by running computational kernels over the grid. A kernel is implemented as a pixel shader that executes on every cell in the grid and writes the results to an output texture. However, because GPUs are designed to render into 2D buffers, we must run kernels once for each slice of a 3D volume.

compute shaders... duh

i don't get how their math is correct at Example 30-1. Simulation Kernels

## Improving Detail

**TODO improve semi-Lagrangian advection** cause introduces a lot of unwanted numerical smoothing, causing for example smoke to loose a lot of detail. check book for this or use their solution

we use a MacCormack scheme that performs two intermediate semi-Lagrangian advection steps

## 30.2.4 Solid-Fluid Interaction, TODO, this is very doable i think

**TODO apply velocity forces from implicit surfaces?**
apply velocity and smoke density coming from grayscale texture?

**TODO handle dynamic obstacles, see book**

In our implementation, obstacles are represented using an inside-outside voxelization. In addition, we keep a voxelized representation of the obstacle's velocity in solid cells adjacent to the domain boundary. This information is stored in a pair of 3D textures that are updated whenever an obstacle moves or deforms (we cover this later in this section).At solid-fluid boundaries, we want to impose a **free-slip boundary condition**, which says that the velocities of the fluid and the solid are the same in the direction normal to the boundary:

Voxelization used for complex (mesh based) geometry might be overkill for what I want, seems heavy and not too useful, would rather attach an sdf to some transform i think, how would that work for skinned meshes ?

30.2.5 Smoke

we must keep track of additional quantities that are pushed around by the fluid. For instance, we can keep track of density and temperature to obtain the appearance of smoke (Fedkiw et al. 2001). For each additional quantity , we must allocate an additional texture with the same dimensions as our grid. The evolution of values in this texture is governed by the same advection equation used for velocity:

To get a more physically plausible appearance, we must make sure that hot smoke rises and cool smoke falls. To do so, we need to keep track of the fluid temperature T (which again is advected by u). Unlike color, temperature values have an influence on the dynamics of the fluid. This influence is described by the buoyant force:

0659equ01.jpg

where P is pressure, m is the molar mass of the gas, g is the acceleration due to gravity, and R is the universal gas constant. In practice, all of these physical constants can be treated as a single value and can be tweaked to achieve the desired visual appearance. The value T 0 is the ambient or "room" temperature, and T represents the temperature values being advected through the flow. z is the normalized upward-direction vector. The buoyant force should be thought of as an "external" force and should be added to the velocity field immediately following velocity advection.

## fire also seems fairly easy

## water

requires representing interface between air and liquid for interesting behaviour

level set method (Sethian 1999) is a popular representation of a liquid surface and is particularly well suited to a GPU implementation because it requires only a scalar value at each grid cell

Bridson also talks about level set method...

## 30.2.8 Performance Considerations and 30.2.9 (TODO also breakdown the storage requirements of my simulation) - very good info for when actually implementing on GPU

WHERE WOULD A FLIP SIMULATION ENTER HERE???

## 30.3 rendering

render box cube and raymarch in the pixel shader, shows nice implementation details

---

# THE BOOK

1.5
The Navier-Stokes equations without viscosity are called the Euler
equations and such an ideal fluid with no viscosity is called inviscid.
Just to make it clear what has been dropped, here are the incompressible
Euler equations using the material derivative to emphasize the simplicity:
Du
Dt + 1
ρ∇p =g,
∇·u=0.
It is these equations that we’ll mostly be using.

REALLY??? ialso that yields du/dt + u.grad u + 1/p grad p = g

1.6 boundary conditions

**solid wall boundary**
the fluid had better not be
f
lowing into the solid or out of it, thus the normal component of velocity
has to be zero:
u· ˆn = 0
if the solid itself is moving too. In
general, we need the normal component of the fluid velocity to match the
normal component of the solid’s velocity, so that the relative velocity has
zero normal component:
u· ˆn = usolid · ˆn

Also sometimes called no-stick condition since we only restrict velocity normal to the surface the rest of the velocity that is "tangent" can be there fully

### pressure at boundary

So that’s what the velocity does: how about the pressure at a solid
wall? We again go back to the idea that pressure is “whatever it takes to
make the fluid incompressible.” We’ll add to that, “and enforce the solid
wall boundary conditions.” The ∇p/ρ term in the momentum equation
applies even on the boundary, so for the pressure to control u· ˆn at a solid
wall, obviously that’s saying something about ∇p · ˆn, otherwise known as
the normal derivative of pressure: ∂p/∂ˆn.

### for viscous fluids

That’s all there is to a solid wall boundary for an inviscid fluid. If
we do have viscosity, life gets a little more complicated. In that case, the
stickiness of the solid generally influences the tangential component of the
f
luid’s velocity, forcing it to match. This is called the no-slip boundary
condition, where we simply say
u =0,
or if the solid is moving,
u =usolid

### free surface boundary condition

The other boundary condition that we’re interested in is at a free sur
face. This is where we stop modeling the fluid. For example, if we simulate
water splashing around, then the water surfaces that are not in contact
with a solid wall are free surfaces. In this case there really is another fluid,
air, but we may not want the hassle of simulating the air as well. And since
air is 700 times lighter than water, it’s not able to have that big of an effect
on the water anyhow (with a few notable exceptions like bubbles!). So in
stead we make the modeling simplification that the air can be represented
as a region with constant atmospheric pressure. In actual fact, since only
differences in pressure matter (in incompressible flow), we can set the air
pressure to be any arbitrary constant: zero is the most convenient. Thus
a free surface is one where p = 0, and we don’t control the velocity in any
particular way.

### bubbles in water

To handle this
kind of situation, you need either hacks based on adding bubble particles
to a free surface flow, or more generally a simulation of both air and wa
ter (called **two-phase flow**, because there are two phases or types of fluid
involved)

## 2. Overview of numerical simulation

That is, we’ll work out methods for solving these simpler equations:
Dq/Dt =0 (advection q is quantity), advect(u,∆t,q)
∂u/∂t =g (body forces), forward Euler u ← u +∆tg is fine
∂u/∂t + 1
ρ∇p = 0
such that ∇·u = 0. (pressure/incompressibility) project(∆t,u) that calculates and applies just the
right pressure to make u divergence-free and also enforces the solid wall
boundary conditions

### 2.3 Time steps

if we pick a candidate ∆t but find tn+∆t > tframe, then
we should clamp it to ∆t = tframe−tn and set a flag that alerts us to the fact
...
However, in some situations we may have a performance requirement
that won’t let us take lots of small time steps every frame. If we only
have time for, say, three time steps per frame, we had better make sure
∆t is at least a third of the frame time. This might be larger than the
suggested time-step sizes from each step, so we will make sure in this book
that all the methods we use can tolerate the use of larger-than-desired time
steps—they should generate plausible results in this case, even if they’re
quantitatively inaccurate

### 2.4 grids

The so-called **MAC ( marker-and-cell) grid** is a staggered grid, i.e., a grid where the
different variables are stored at different locations.

The pressure in grid cell (i,j)
is sampled at the center of the cell, indicated by pi,j. The velocity is
split into its two Cartesian components. The horizontal u-component is
sampled at the centers of the vertical cell faces, for example indicated by
ui+1/2,j for the horizontal velocity between cells (i,j) and (i + 1,j). The
vertical v-component is sampled at the centers of the horizontal cell faces,
for example indicated by vi,j+1/2 for the vertical velocity between cells (i,j)
and (i,j + 1).

Note that this means we aren’t storing a velocity vector
anywhere: the different components of velocity are sampled at different
locations, and can’t simply be combined into a vector. Also note that for
grid cell (i,j) we have sampled the normal component of the velocity at
the center of each of its faces: this will very naturally allow us to estimate
the amount of fluid flowing into and out of the cell.

^ Why? see chapter 5

Chapter 5, but briefly put it’s so that we can use accurate central
differences for the pressure gradient and for the divergence of the velocity
f
ield without the usual disadvantages of central differences. Proceeds to show via taylor series why staggered approximation of central differences is better than normal!!! **TODO show this in the MAC grid chapter**
also shows how to interpolate and store indices VERY IMPORTANT

### 2.5 Dynamic sparse grids

The solution to these last two, and which subsumes the first, is to use
**sparse blocked grids**. -> solve problems where fluid moves a lot and is in low volume/size compared to our grid (doesn't fully occupy it, think thin windy river or thin smoke coming out of cigarette) !! I would highly recommend sticking
to dense 3D arrays for your first fluid solver, and (as with everything in
this book!) to prototype a sparse grid simulation in 2D before doing it in
3D -> i agree

## 3. Advection yeahhh

solving the advection equation
Dq/Dt = 0.=> ∂q
∂t +u∂q
∂x = 0
qn+1 = advect(u,∆t,qn)

YES let's use Runge-Kutta!!! much better numerical solver of ODEs...

It turns out forward Euler is sometimes
adequate, but significantly better results can be obtained using a slightly
more sophisticated technique such as a higher-order Runge-Kutta method.
See Appendix A to review time integration methods. In particular, at least
a second-order Runge-Kutta method is recommended as a bare minimum,
such as
xmid = xG − 1
2∆tu( xG),
xP =xG−∆tu(xmid).
Here a half-step is taken to get an intermediate position xmid approximating
the particle’s position halfway along the trajectory. The velocity field is
interpolated from the grid at this intermediate location, and that velocity
value is used to finally get to xP. Even better results, particularly around
swirls and other rotational flow elements, can be had with a third order
method; the RK3 scheme given in the appendix is the best default to use.
Depending on how large ∆t is—see later in this chapter—it may even be
wise to split the trajectory tracing into smaller substeps for better accuracy.

Usually the addi
tional variables are stored at the grid cell centers, but the velocity compo
nents are stored at the staggered grid locations discussed in the previous
chapter. In each case, we will need to use the appropriate averaged ve
locity, given at the end of the previous chapter, to estimate the particle
trajectory

**TODO update advection to use RK2 (possible 3 and 4)**

### 3.2 Boundary Conditions

should read for boundary condition chapter

### Time step size

shows that our dt should be clamped ∆t ≤ 5∆x/umax and why; shows how to compute umax. Even with that implemented:

In some cases artifacts will still be present with a time step of this
size; one possible remedy that avoids the expense of running the entire
simulation at a smaller time step is to just trace the trajectories used in
semi-Lagrangian advection with several small substeps. If each substep is
limited to |u(x)|∆t < ∆x, i.e., so that each substep only traverses roughly
one grid cell, there is little opportunity for problems to arise. Note that
this substep restriction can be taken locally: in fast-moving regions of the
f
luid more substeps might be used than in slow-moving regions.

**TODO** after updating advection to use RK implement the ∆t constraint?? (kinda not required i think for fairly ok simulations)

#### 3.3.1 The CFL Condition

just something in general i should stufy..necessary condi
tion for convergence. Convergence means that if you repeat a simulation
with smaller and smaller ∆t and ∆x, in the limit going to zero, then your
numerical solutions should approach the exact solution (proving this for 3D gives you the million dollar prize).

∆t ≤ C∆x/|u|

Thus sometimes the CFL condition is confused with a
stability condition. In fact, there are methods that are unstable no matter
what the time-step size is, such as the forward Euler and central difference
scheme that began this chapter.3 There are also explicit methods that are
stable for arbitrary time-step sizes—however, they can’t converge to the
correct answer unless the CFL condition is met.

...
from what i gather cfl condition will yield ∆t ≤ 5∆x/umax for alpha = 5 so just stick with that

### 3.4 Diffusion

That is,
with each advection step, we are doing an averaging operation (interpolation). Averaging
tends to smooth out or blur sharp features, diffusing or dissipating them.
In signal-processing terminology, we have a low-pass filter.

Understanding the smoothing behaviour more physically. technique called **modified PDE** ; doing **backwards error analysis** (rather than compering our solution to real solution and computing error) insteadtakestheperspectivethatweare solving
aproblemexactly—it’s just theproblemwe solved isn’tquite the same
as theonewe startedoutwith, i.e., theproblemhasbeenperturbed in
someway.
We’llassume∆t<∆x/u, i.e.,thattheparticletrajectoriesspanlessthan
agridcell

Shows via taylor expansion what error we get and that error looks like
=u∆x∂2q/∂x2 which looks exactly like the diffusion term. meaning we don't have to model viscosity since we can assume it comes from this error???? this is called **numerical diffusion**

### 3.5 reducing numerical diffusion

Problem from numerical diffusion comes from linear interpolation so let's use a sharper interpolation method.

In one dimension, we do this with a cubic interpolant. If we are esti
mating the value of q at fraction s between grid points xi and xi+1, the
linear interpolant is
q ≈(1−s)xi +sxi+1.
This is the value of the linear polynomial which passes through (xi,qi)
and (xi+1,qi+1). The interpolant is exact for linear polynomials, obvi
ously; it also matches smooth functions up to the first term of their Taylor
series, but leaves a quadratic remainder term. We instead can use the cu
bic polynomial which passes through (xi−1,qi−1), (xi,qi), (xi+1,qi+1), and
(xi+2,qi+2), including an additional data point on either side, with this
formula:
q ≈ −1
3
s+1
2
s2− 1
6
s3 qi−1
+1−s2+ 1
2(s3 −s) qi

- s+1
  2(s2 −s3) qi+1
- 1
  6
  (s3 −s) qi+1.
  (3.6)
  You can double-check this is exact if q is really any cubic polynomial; it also
  matches smooth functions up to the third term of their Taylor series, leaving
  a muchtinier quartic remainder term. This is two orders of magnitude more
  accurate than linear interpolation.

**TODO expand and explain the math**

Figure3.2. is a great example showing what diffusion is doing and what should be the correct behaviour. ideally the triangle would stay a triangle and not smooth out at all but just move to the right!!!

The biggest practical issue to be aware of is that quantities which
you think should always be non-negative, such as the concentration of soot
in a smoke simulation, may end up being slightly negative after an advec
tion step: if that could cause a problem, just clamp any negative values to
zero.

## 4. Level set geometry

when is a point inside a solid? (the point may be where we traced
back to during semi-Lagrangian)
what is the closest point on the surface of some geometry?
how do we extrapolate values from one region into another?
We also more
generally want representations of geometry which play well with equations
discretized on grids, and one of the most practical answers is the **level set method**. The first query above suggests the right approach is **implicit surfaces** (sdf).

### discretizing sdf

Clearly we’re not doing ourselves
a favor by rephrasing the inside/outside geometric query as just evaluat
ing a signed distance function, if the signed distance function evaluation is
even more expensive than simply computing inside/outside (can get complicated if you look at distance to triangle and consider you have to do it for every triangle) directly from a
mesh. We also haven’t really changed the underlying geometric represen
tation: we’ve just hidden it.
This is where the level set method comes into play. Instead of com
puting signed distance analytically from some other geometric information, we will instead store values of signed distance directly on a grid, just like
any other fluid variable
Then when we need to evaluate φ(x), we in
terpolate an approximate value from the surrounding grid points. **“level set”: a signed distance function that has been sampled on a grid.**
so we can just sample φ at grid and estimate gradient via finite differences like usual.

### computing sdf

The benefit of fast sweeping over fast marching is that it is O(n), re
quires no extra data structures beyond grids, and thus is extremely simple
to implement. When computing distance across a full grid, fast sweeping
is probably the best bet.However, as mentioned earlier, a modern fluid solver will probably use
sparse tiled grids, which complicates sweeping. In this case, a hybrid ap
proach is possible. ....
.. very complicated stuff, algorithmically speaking

### 4.4 recomputing sdf

another approach for computing ... more complicated...

### 4.5 operations on level sets

more complicated stuff, the core cool part is that we can do operations like min (union), max (intersect) with sdfs normally to change the level set (might require recomputing distance afterwards)

....
ahhhh level set geometry looks really complicated

## 5. making fluids incompressible

and satisfies the solid wall boundary conditions
un+1 · ˆn = usolid · ˆn at solid boundaries,
while also respecting the free surface boundary condition that pressure be
zero there:
p =0 atfree surfaces. WHAT DOES IT MEAN how does it relate to what i've done for my boundary conditions!

TODO update projection function to use velocities from MAC grid, explain why it's better, what are the issues with the collocated grid

TODO study boundary conditions and how they affect projection, Drilech, ghost cells, neumman etc

TODO analyse the problem where we have a domain of Air (free boundary, empty), Solid, Fluid

**TODO use conjugate gradient algorithm with modified incomplete cholesky to solve poisson equation for pressure rather than Gauss-Seidel** - check why the algorithm is better. Converges faster? More efficient? etc.
In practice, when
limited to a small maximum number of iterations there are simpler algo
rithms such as Gauss-Seidel and Successive Over-Relaxation (SOR)
that tend to be much more effective than plain CG, even if they are slower
at achieving full accuracy. However, there is a trick up our sleeve that
can speed CG up immensely, called preconditioning. Preconditioned
conjugate gradient (PCG) is what we will be using.

**TODO implement residual measurement so i can accurately compute how much iterations should be required and compare different algorithms**

Ideally we would just measure the norm
of the difference between our current guess and the exact solution—but of
course that requires knowing the exact solution! So we will instead look at
a vector called the residual:
ri = b−Api.
That is, if pi is the ith guess at the true solution, the ith residual ri is
just how far away it is from satisfying the equation Ap = b. When we
hit the exact solution, the residual is exactly zero.1

Domain decomposation for incomplete cholesky cause it's bad for parallel compute

^ THIS SHIT IS REALLY COMPLICATED!!

finite volume method for handling cases where the boundaries are not "straight" i.e fit exactly within a voxelized grid .... more complicated stuffffff

## 6. Smoke

consider new variables T (temperature kelvin) and s (smoke volume concentration i.e parts-per million)
DT/Dt = 0 and Ds/Dt = 0 why equal 0???
discretize variables at cell centers; advect at same time as u
sources would be DT/Dt = rT(x)(Ttarget(x)-T) and Ds/Dt = rs(x) whatever that means (likely DtDf​=∂t∂f​+u⋅∇f implies ∂t∂f = -u⋅∇f ), r is rate at which we add heat and smoke

model those terms with laplacian cause they diffuse; heat kernel, heat equation etc

### buoyancy

We all know that hot air rises and cool air sinks; similarly it seems
plausible that air laden with heavier soot particles will be pulled downwards
by gravity. We can model this by replacing the accelerationg due to gravity
in the momentum equation with a buoyant acceleration b =[αs−β(T −Tamb)]g,

### variable density solves

Underlying the buoyancy model is the fact that fluid density is a function
of temperature and—if we treat the soot as actually dissolved in the air—
smoke concentration.

### divergence control

previous section violates conservation of mass, this section explains how to solve it... more complicated math stuff

## Particle methods

really need to investigate this, particularly FLIP methods cause seems to be where most advanced stuff lies, it's what houdini uses, need to see if these methods can be used in conjection with the previously developed methods in the Eulerian and semi-Lagrangian viewpoints; if so probably can skip some stuff explained in the previous chapters and jump straight to these methods
