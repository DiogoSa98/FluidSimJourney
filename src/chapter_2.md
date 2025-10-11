# Moving Densities

The paper starts by describing the solver for density field assuming a fixed velocity field.
Let's break down the terms of the density equation and solve them one by one

p/dt = -(u\*lambda)ro + k laplacian p + s
density follows velociy function
density may diffuse at a certain rate
density increases due to sources

## diffusion

- diffusion equation

-- laplacian operator
-- descritization of the laplacian
--- Numerical Differentiation
---- taylor series
--- numerical integration of ODEs

### following velocity field

### adding sources

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

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<!-- <script src="scripts/density-sim.js"></script>
<div id="sketch-container" class="sketch-container">
<div id="sketch-canvas-container" class="sketch-canvas-container">
<div id="sketch-buttons-container" class="sketch-buttons-container"></div>
</div>
<div id="sketch-parameters-container" class="sketch-parameters-container"></div>
</div> -->
<div id="diffusion-bad" class="sketch-container"></div>
<script src="scripts/density-sketch.js"></script>
<script>
  createDiffusionSim("diffusion-bad", { useDiffuseBad: true });
</script>

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

## TODO figure out why the stable diffuse diffuses much much quicker than the previous method
