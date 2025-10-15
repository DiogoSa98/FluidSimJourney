# Diffuse Good

Pretty cool right! But if you tried bumping up the diffuse coefficient you'll notice the simulation freaks the fuck out and some weird patterns start to appear.

Wtf is going on? I don't really know myself but from the paper ". For large diffusion rates a the density values start to oscillate, become negative
and finally diverge, making the simulation useless. This behavior is a general problem that
plagues unstable methods. For these reasons we consider a stable method for the diffusion
step. The basic idea behind our method is to find the densities which when diffused backward
in time yield the densities we started with. In code:"

<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script src="scripts/density-sketch.js"></script>
<div id="diffusion-good" class="sketch-container"></div>
<script>
  createDiffusionSim("diffusion-good");
</script>

## TODO go look at the background in numerical integration of ODEs and explain how/why the forward euler integration method is unstable and the backwards isn't!!!
