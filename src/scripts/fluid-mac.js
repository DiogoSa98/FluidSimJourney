function IX(N, i, j) {
  if (i < 0 || j < 0 || i > N + 2 || j > N + 2) {
    throw "OOB " + i + " " + j;
  }
  return i + (N + 2) * j;
}

function add_source(N, x, s, dt) {
  // const size = (N + 2) * (N + 2);
  for (let i = 0; i < x.length; i++) x[i] += dt * s[i];
}

function set_bnd(N, b, x) {
  for (let i = 1; i <= N; i++) {
    x[IX(N, 0, i)] = b == 1 ? -x[IX(N, 1, i)] : x[IX(N, 1, i)];
    x[IX(N, N + 1, i)] = b == 1 ? -x[IX(N, N, i)] : x[IX(N, N, i)];
    x[IX(N, i, 0)] = b == 2 ? -x[IX(N, i, 1)] : x[IX(N, i, 1)];
    x[IX(N, i, N + 1)] = b == 2 ? -x[IX(N, i, N)] : x[IX(N, i, N)];
  }
  x[IX(N, 0, 0)] = 0.5 * (x[IX(N, 1, 0)] + x[IX(N, 0, 1)]);
  x[IX(N, 0, N + 1)] = 0.5 * (x[IX(N, 1, N + 1)] + x[IX(N, 0, N)]);
  x[IX(N, N + 1, 0)] = 0.5 * (x[IX(N, N, 0)] + x[IX(N, N + 1, 1)]);
  x[IX(N, N + 1, N + 1)] = 0.5 * (x[IX(N, N, N + 1)] + x[IX(N, N + 1, N)]);
}
function set_bnd_stag(N, b, x) {
  for (let i = 1; i <= N; i++) {
    x[IX(N, 0, i)] = b == 1 ? -x[IX(N, 1, i)] : x[IX(N, 1, i)];
    x[IX(N, N + 1, i)] = b == 1 ? -x[IX(N, N, i)] : x[IX(N, N, i)];
    x[IX(N, i, 0)] = b == 2 ? -x[IX(N + 1, i, 1)] : x[IX(N, i, 1)];
    if (b == 1) {
      x[IX(N, i, N)] = x[IX(N, i, N - 1)];
    } else if (b == 2) {
      x[IX(N, i, N + 2)] = x[IX(N, i, N + 1)];
    }
  }

  // missing corners
  if (b == 1) {
    // for u is at j=0
    x[IX(N, 0, 0)] = -x[IX(N, 1, 0)];
    x[IX(N, N + 1, 0)] = -x[IX(N, N, 0)];
  } else if (b == 2) {
    // for v is at i=0
    x[IX(N, 0, 0)] = -x[IX(N, 0, 1)];
    x[IX(N, 0, N + 2)] = -x[IX(N, 0, N + 1)];
  }
}

function lin_solve(N, b, x, x0, a, c) {
  for (let k = 0; k < 20; k++) {
    for (let i = 1; i <= N; i++) {
      for (let j = 1; j <= N; j++) {
        x[IX(N, i, j)] =
          (x0[IX(N, i, j)] +
            a *
              (x[IX(N, i - 1, j)] +
                x[IX(N, i + 1, j)] +
                x[IX(N, i, j - 1)] +
                x[IX(N, i, j + 1)])) /
          c;
      }
    }
    set_bnd(N, b, x);
  }
}

function diffuse(N, b, x, x0, diff, dt) {
  const a = dt * diff * N * N;
  lin_solve(N, b, x, x0, a, 1 + 4 * a);
}

// generic bilinear interpolation
// assumes x,y are clamped to valid range
function bilinear_interpolate(field, N, x, y) {
  // cell indexes
  const i0 = Math.floor(x);
  const i1 = i0 + 1;
  const j0 = Math.floor(y);
  const j1 = j0 + 1;
  // fractioal parts for interpolation
  const s1 = x - i0;
  const s0 = 1 - s1;
  const t1 = y - j0;
  const t0 = 1 - t1;
  // bilinear interpolation
  return (
    s0 * (t0 * field[IX(N, i0, j0)] + t1 * field[IX(N, i0, j1)]) +
    s1 * (t0 * field[IX(N, i1, j0)] + t1 * field[IX(N, i1, j1)])
  );
}

// sample scalar field centered in cell at arbitrary (x,y)
// x,y are in cell coordinates: e.g. cell center (i, j)
function sample_scalar(field, N, x, y) {
  // clamp so we don't sample outside
  x = Math.max(0.5, Math.min(x, N + 0.5));
  y = Math.max(0.5, Math.min(y, N + 0.5));
  return bilinear_interpolate(field, N, x, y);
}

// get velocity sample at arbitrary (x,y) in cell coordinates
function sample_velocity(N, u, v, x, y) {
  return {
    x: sample_scalar(u, N + 1, x, y),
    y: sample_scalar(v, N, x, y),
  };
}

// get velocity sample at cell center (i,j)
function sample_velocity_cell(N, u, v, i, j) {
  return {
    x: 0.5 * (u[IX(N + 1, i, j)] + u[IX(N + 1, i + 1, j)]),
    y: 0.5 * (v[IX(N, i, j)] + v[IX(N, i, j + 1)]),
  };
}

function advect_scalar(N, b, d, d0, u, v, dt) {
  const dt0 = dt * N;
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      // cell center coordinates in "cell units"
      let x = i;
      let y = j;
      let vel = sample_velocity_cell(N, u, v, x, y);
      // compute "particle" position at previous time step
      let x_prev = x - dt0 * vel.x;
      let y_prev = y - dt0 * vel.y;

      d[IX(N, i, j)] = sample_scalar(d0, N, x_prev, y_prev);
    }
  }
  set_bnd(N, b, d);
}
function advect_u(N, b, d, d0, u, v, dt) {
  const dt0 = dt * N;
  for (let i = 1; i <= N + 1; i++) {
    for (let j = 1; j <= N; j++) {
      // u is stored at (i-0.5, j) positions. So we map (x,y) in *cell coords* to u-grid coords.
      let x = i - 0.5;
      let y = j;
      let vel = sample_velocity(N, u, v, x, y);
      // compute "particle" position at previous time step
      let x_prev = x - dt0 * vel.x;
      let y_prev = y - dt0 * vel.y;

      d[IX(N + 1, i, j)] = sample_scalar(d0, N + 1, x_prev, y_prev);
    }
  }
  set_bnd_stag(N + 1, b, d);
}

function advect_v(N, b, d, d0, u, v, dt) {
  const dt0 = dt * N;
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N + 1; j++) {
      // v is stored at (i, j-0.5) positions. So we map (x,y) in *cell coords* to v-grid coords.
      let x = i;
      let y = j - 0.5;
      let vel = sample_velocity(N, u, v, x, y);
      // compute "particle" position at previous time step
      let x_prev = x - dt0 * vel.x;
      let y_prev = y - dt0 * vel.y;
      d[IX(N, i, j)] = sample_scalar(d0, N, x_prev, y_prev);
    }
  }
  set_bnd_stag(N, b, d);
}

function project_mac(N, u, v, p, div) {
  // compute h*div (h=1/N) of velocity field and initialize pressure field to 0
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N; j++) {
      div[IX(N, i, j)] =
        (u[IX(N + 1, i + 1, j)] - // right cell face
          u[IX(N + 1, i, j)] + // left cell face
          v[IX(N, i, j + 1)] - // bottom cell face
          v[IX(N, i, j)]) / // top cell face
        N;
      p[IX(N, i, j)] = 0;
    }
  }
  set_bnd(N, 0, div);
  set_bnd(N, 0, p);

  // solve the Poisson equation for the pressure field
  lin_solve(N, 0, p, div, 1, 4);

  // subtract pressure gradient from velocity field to get divergence-free field
  for (let i = 1; i <= N + 1; i++) {
    for (let j = 1; j <= N; j++) {
      u[IX(N + 1, i, j)] -= N * (p[IX(N, i, j)] - p[IX(N, i - 1, j)]);
    }
  }
  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= N + 1; j++) {
      v[IX(N, i, j)] -= N * (p[IX(N, i, j)] - p[IX(N, i, j - 1)]);
    }
  }

  set_bnd_stag(N + 1, 1, u);
  set_bnd_stag(N, 2, v);
}

function dens_step(N, x, x0, u, v, diff, dt) {
  add_source(N, x, x0, dt);
  diffuse(N, 0, x0, x, diff, dt);
  advect_scalar(N, 0, x, x0, u, v, dt);
}

function vel_step(N, u, v, u0, v0, visc, dt) {
  add_source(N, u, u0, dt);
  add_source(N, v, v0, dt);
  // // diffuse(N, 1, u0, u, visc, dt);
  // // diffuse(N, 2, v0, v, visc, dt);
  project_mac(N, u0, v0, u, v);
  // advect_u(N, 1, u, u0, u0, v0, dt);
  // advect_v(N, 2, v, v0, u0, v0, dt);
  // project_mac(N, u, v, u0, v0);
}

class FluidMAC {
  constructor(N, visc, diff) {
    this.N = N;
    this.visc = visc || 0;
    this.diff = diff || 0;
    this.u = new Float32Array((N + 3) * (N + 2));
    this.u0 = new Float32Array((N + 3) * (N + 2));
    this.v = new Float32Array((N + 2) * (N + 3));
    this.v0 = new Float32Array((N + 2) * (N + 3));
    this.x = new Float32Array((N + 2) * (N + 2));
    this.x0 = new Float32Array((N + 2) * (N + 2));
  }

  step(dt) {
    vel_step(this.N, this.u, this.v, this.u0, this.v0, this.visc, dt);

    dens_step(this.N, this.x, this.x0, this.u, this.v, this.diff, dt);

    this.u0.fill(0);
    this.v0.fill(0);
    this.x0.fill(0);
  }

  addDensity(x, y, dd) {
    this.x0[IX(this.N, x, y)] += dd;
  }
  addForce(x, y, fx, fy) {
    this.u0[IX(this.N + 1, x, y)] += fx;
    this.v0[IX(this.N, x, y)] += fy;
  }

  addForceDirectly(x, y, fx, fy) {
    this.u[IX(this.N, x, y)] += fx;
    this.v[IX(this.N, x, y)] += fy;
  }

  densityAt(x, y) {
    return this.x[IX(this.N, x, y)];
  }

  prevDensityAt(x, y) {
    return this.x0[IX(this.N, x, y)];
  }

  velocityAt(x, y) {
    const ix = IX(this.N, x, y);
    return [this.u[ix], this.v[ix]];
  }

  prevVelocityAt(x, y) {
    const ix = IX(this.N, x, y);
    return [this.u0[ix], this.v0[ix]];
  }

  velocityAtCellCenter(i, j) {
    if (i < 0 || i > this.N + 2 || j < 0 || j > this.N + 2) {
      console.log("Out of bounds velocity sample at cell center:", i, j);
      return [0, 0];
    }
    let vel = sample_velocity_cell(this.N, this.u, this.v, i, j);
    return [vel.x, vel.y];
  }

  setViscosity(visc) {
    this.visc = visc;
  }
  setDiffusion(diff) {
    this.diff = diff;
  }

  clear() {
    this.u0.fill(0);
    this.v0.fill(0);
    this.x0.fill(0);
    this.u.fill(0);
    this.v.fill(0);
    this.x.fill(0);
  }
}
export { FluidMAC };

/*
using System;
					
public class Program
{
	public static int IX(int N, int i, int j) { return i+(N+2)*j; }
	public static void Main()
	{
		int N = 2;
		int Ns = N + 1;
		Console.WriteLine("\n compute DIV: ");
		for (int i = 1; i <= N; i++) 
			for (int j = 1; j <= N; j++)
			{
				Console.WriteLine("i " + i + " j " + j + " ix " + IX(N,i,j));
				Console.WriteLine("right left " +  IX(Ns,i+1,j) + " - "   + IX(Ns,i,j));
				Console.WriteLine("top bottom " +  IX(N,i,j) + " - "   + IX(N,i,j+1));
				Console.WriteLine("\n");
			}
		Console.WriteLine("\n ----- compute VEL U");
		for (int i = 1; i <= N+1; i++) {
			for (int j = 1; j <= N; j++) {
				Console.WriteLine("i " + i + " j " + j + " ix " + IX(Ns,i,j) + " p " + IX(N, i, j) + " -" + IX(N,i-1,j));
			}
		  }
		Console.WriteLine("\n -----compute VEL V");
		for (int i = 1; i <= N; i++) {
			for (int j = 1; j <= N+1; j++) {
				Console.WriteLine("i " + i + " j " + j + " ix " + IX(N,i,j) + " p " + IX(N, i, j) + " -" + IX(N,i,j-1));
			}
		  }

				Console.WriteLine("\n -----set boundary u");
		  for (int i = 1; i <= N+1; i++) {
			  Console.WriteLine("\ni " + i);
			  Console.WriteLine("IX(N, 0, i): " + IX(Ns, 0, i) + " = -" + IX(Ns, 1, i));
			  Console.WriteLine("IX(N, N + 1, i): " + IX(Ns, Ns + 1, i) + " = -" + IX(Ns, Ns, i));
			  Console.WriteLine("IX(N, i, 0): " + IX(Ns, i, 0) + " = " + IX(Ns, i, 1));
			  Console.WriteLine("IX(N, i, N + 1 + 1): " + IX(Ns, i, Ns) + " = " + IX(Ns, i, Ns-1));
		  }
		Console.WriteLine("\n -----missing corners at i=0");
		Console.WriteLine(IX(Ns, 0, 0) + " = -" + IX(Ns, 1, 0));
		Console.WriteLine(IX(Ns, Ns + 1, 0) + " = -" + IX(Ns, Ns, 0));
		
		Console.WriteLine("\n -----set boundary v");
		  for (int i = 1; i <= N+1; i++) {
			  Console.WriteLine("\ni " + i);
			  Console.WriteLine("IX(N, 0, i): " + IX(N, 0, i) + " = " + IX(N, 1, i));
			  Console.WriteLine("IX(N, N + 1, i): " + IX(N, N + 1, i) + " = " + IX(N, N, i));
			  Console.WriteLine("IX(N, i, 0): " + IX(N, i, 0) + " = -" + IX(N, i, 1));
			  Console.WriteLine("IX(N, i, N + 1 + 1): " + IX(N, i, N + 1 + 1) + " = -" + IX(N, i, N + 1));
		  }
		Console.WriteLine("\n -----missing corners at j=0");
		Console.WriteLine(IX(N, 0, 0) + " = -" + IX(N, 0, 1));
		Console.WriteLine(IX(N, 0, N+1+1) + " = -" + IX(N, 0, N+1));
	}
}

*/
