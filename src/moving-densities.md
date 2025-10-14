# Moving Densities

Stam starts by focusing on the simpler of the two equations — the one describing how a **density field** moves through a fixed **velocity field** (i.e., assuming the velocity doesn’t change with time).

The density equation:

$$
\frac{\partial \rho}{\partial t} = -(\mathbf{u} \cdot \nabla)\rho + k \nabla^2 \rho + S
$$

Each term on the right-hand side contributes differently to how the density evolves:

- The first term means the density follows the velocity field — it gets _advected_.
- The second term represents _diffusion_, how density spreads out over time.
- The third term adds _sources_, meaning new density gets introduced into the system.

![Density Solver](images/stam-density-solver.png)

Stam’s solver tackles these three effects every time step, but in reverse order:  
first adding sources, then diffusing, and finally advecting the density through the velocity field.

The source term is the simplest to handle — for each cell, the new density is increased by the amount added by sources during the time step $dt$; In my implementation I simply set the density at the clicked grid cell to 1.

That’s the first building block — adding density into the world. The interesting behavior comes next, when the density starts to move and spread.

- [Diffusion Bad](diffusion-bad.md)
- [Diffusion Good]
- [Following Velocity]

# Navier-Stokes in 2D

Here's the core equation:

$$ \frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u}\cdot\nabla)\mathbf{u} = -\nabla p + \nu \nabla^2 \mathbf{u} $$

```cpp
// simple semi-Lagrangian advection step
vec2 backtrace(vec2 pos, vec2 velocity, float dt) {
    return pos - velocity * dt;
}
```

<details>

<summary>How Taylor series is used here</summary> The derivative of a function can be approximated by expanding it in a Taylor series... 
# test

</details>

<div id="plot"></div>     <script src="https://cdn.plot.ly/plotly-3.1.1.min.js" charset="utf-8"></script> <script> const x = Array.from({length:100},(_,i)=>i/10); const y = x.map(v=>Math.sin(v)); Plotly.newPlot('plot',[{x,y,type:'scatter'}]); </script>

Pretty cool right! But if you tried bumping up the diffuse coefficient you'll notice the simulation freaks the fuck out and some weird patterns start to appear.

Wtf is going on? I don't really know myself but from the paper ". For large diffusion rates a the density values start to oscillate, become negative
and finally diverge, making the simulation useless. This behavior is a general problem that
plagues unstable methods. For these reasons we consider a stable method for the diffusion
step. The basic idea behind our method is to find the densities which when diffused backward
in time yield the densities we started with. In code:"

<div id="diffusion-good" class="sketch-container"></div>
<script>
  createDiffusionSim("diffusion-good");
</script>

## TODO go look at the background in numerical integration of ODEs and explain how/why the forward euler integration method is unstable and the backwards isn't!!!
