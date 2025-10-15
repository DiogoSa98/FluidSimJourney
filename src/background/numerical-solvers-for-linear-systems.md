# Numerical Solvers for Linear Systems

_Reference: [GeeksForGeeks – Jacobi Method](https://www.geeksforgeeks.org/engineering-mathematics/jacobian-method/)_

Given a system of linear equations, i.e.:

$$
\begin{cases} a_{11}x_1 + a_{12}x_2 = b_1 \\ a_{21}x_1 + a_{22}x_2 = b_2 \end{cases}
$$

or in matrix form:

$$
A\mathbf{x} = \mathbf{b} \quad \text{where} \quad A = \begin{bmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{bmatrix}, \quad \mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \end{bmatrix}, \quad \mathbf{b} = \begin{bmatrix} b_1 \\ b_2 \end{bmatrix}
$$

We know how to solve these directly using methods like Gaussian elimination. Unfortunately, those methods tend to be computationally expensive for large systems, so very smart people came up with **iterative methods** that approximate the solution efficiently.

## Jacobi Iterative Method

A specific implementation of the Jacobi method requires the following assumptions:

1.  The system of linear equations can be written in the form $A\mathbf{x} = \mathbf{b}$, where:

    - $A$ is the coefficients matrix
    - $\mathbf{x}$ is the vector of unknowns
    - $\mathbf{b}$ is the vector of constants

2.  The system of linear equations has a **unique solution**.  
    _Why?_ Because if multiple solutions exist, there’s no single point for the method to “converge” to — it could just oscillate between possibilities.
3.  The coefficient matrix $A$ has **no zeroes on its main diagonal**.  
    _Why?_ Because each iteration involves dividing by the diagonal element $a_{ii}$. If any of these are zero, the formula breaks.
4.  The system is **diagonally dominant**, meaning:

    $$
    |a_{ii}| \ge \sum_{j \ne i} |a_{ij}|
    $$

    for every row, and for at least one row the inequality is strict.

    _Why?_ This ensures the method converges — roughly speaking, it means each variable “mostly depends on itself” rather than its neighbors, which prevents the iterations from diverging or oscillating.

### The Algorithm

1.  Rewrite each equation to isolate its variable:

    $$
    x_i = \frac{1}{a_{ii}} \left(b_i - \sum_{j \ne i} a_{ij}x_j \right)
    $$

2.  Make an initial guess for $\mathbf{x}$, typically using zeroes unless we have better prior information.
3.  Compute the first approximation $\mathbf{x}^{(1)}$ by substituting the initial guess into the rewritten equations.
4.  Repeat step 3 using the most recent approximation to get the next one:

    $$
    x_i^{(k+1)} = \frac{1}{a_{ii}} \left(b_i - \sum_{j \ne i} a_{ij}x_j^{(k)} \right)
    $$

    until the error between iterations becomes small enough.

### Example

Consider the system of linear equations:

$$
\begin{cases} 2x + y + z = 6 \\\\ x + 3y - z = 0 \\\\ -x + y + 2z = 3 \end{cases}
$$

Checking if the equations are diagonally dominant:

$$
|2| \ge |1| + |1| = 2 \quad \text{(true)}
$$

$$
|3| \ge |1| + |-1| = 2 \quad \text{(true)}
$$

$$
|2| \ge |-1| + |1| = 2 \quad \text{(true)}
$$

Rewriting the system in Jacobi form:

$$
\begin{cases} x = \frac{6 - y - z}{2} \\ y = \frac{-x + z}{3} \\ z = \frac{3 + x - y}{2} \end{cases}
$$

Starting with the initial guess $\mathbf{p}^{(0)} = (0, 0, 0)$:

**Iteration 1**

$$
x^{(1)} = \frac{6 - 0 - 0}{2} = 3
$$

$$
y^{(1)} = \frac{-0 + 0}{3} = 0
$$

$$
z^{(1)} = \frac{3 + 0 - 0}{2} = 1.5
$$

**Iteration 2**, using $\mathbf{p}^{(1)} = (3, 0, 1.5)$:

$$
x^{(2)} = \frac{6 - 0 - 1.5}{2} = 2.25
$$

$$
y^{(2)} = \frac{-3 + 1.5}{3} = -0.5
$$

$$
z^{(2)} = \frac{3 + 3 - 0}{2} = 3
$$

**Iteration 3**, using $\mathbf{p}^{(2)} = (2.25, -0.5, 3)$:

$$
x^{(3)} = \frac{6 + 0.5 - 3}{2} = 1.75
$$

$$
y^{(3)} = \frac{-2.25 + 3}{3} = 0.25
$$

$$
z^{(3)} = \frac{3 + 2.25 + 0.5}{2} = 2.875
$$

**Iteration 4**, using $\mathbf{p}^{(3)} = (1.75, 0.25, 2.875)$:

$$
x^{(4)} = \frac{6 - 0.25 - 2.875}{2} = 1.4375
$$

$$
y^{(4)} = \frac{0 - 1.75 + 2.875}{3} = 0.375
$$

$$
z^{(4)} = \frac{3 + 1.75 - 0.25}{2} = 2.25
$$

After more iterations, the results will get closer to the exact solution.

We can check the error by plugging the results into the equations and seeing how close the residuals are to 0. At iteration 4:

$$
x = \frac{6 - y - z}{2} \Rightarrow 0 = \frac{6 - y - z}{2} - x \Rightarrow \frac{6 - 0.375 - 2.25}{2} - 1.4375 = 0.25
$$

$$
y = \frac{-x + z}{3} \Rightarrow 0 = \frac{-x + z}{3} - y \Rightarrow \frac{-1.4375 + 2.25}{3} - 0.375 = -0.0625
$$

$$
z = \frac{3 + x - y}{2} \Rightarrow 0 = \frac{3 + x - y}{2} - z \Rightarrow \frac{3 + 1.4375 - 0.375}{2} - 2.25 = 0.03125
$$

<h2>Jacobi Iteration Visualizer</h2>
<label>Matrix A:</label><br>
<textarea id="Ainput" rows="3" cols="50">[[2,1,1],[1,3,-1],[-1,1,2]]</textarea><br>
<label>Vector b:</label><br>
<input id="binput" value="[6,0,3]" size="50"><br>
<label>Number of iterations N:</label><br>
<input id="Ninput" type="number" value="10"><br>
<button onclick="runJacobi()">Run Jacobi</button>
<div id="plot"></div>
<div id="jacobiPlot">
</div>

<script src="https://cdn.plot.ly/plotly-3.1.1.min.js" charset="utf-8"></script>
<script>
function jacobi(A, b, N) {
    const n = A.length;
    let x = Array(n).fill(0); // initial guess 0
    let xn = Array(n).fill(0);
    const history = Array.from({ length: n }, () => []);
    for (let k = 0; k < N; k++) { // jacobi iterations
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j) sum += A[i][j] * x[j]; // sum of matrix coefficients times the current guess
            }
            xn[i] = (b[i] - sum) / A[i][i]; // compute next guess value
        }
        for (let i = 0; i < n; i++) {
            history[i].push(xn[i]);
            x[i] = xn[i]; // update guess value for next iteration
        }
    }
    return history;
}
function plotJacobi(A, b, N) {
    const result = jacobi(A, b, N);
    const data = result.map((vals, i) => ({
        x: Array.from({ length: vals.length }, (_, k) => k + 1),
        y: vals,
        type: "scatter",
        mode: "lines+markers",
        name: `x${i + 1}`
    }));
    const layout = {
        title: "Jacobi Iteration Convergence",
        xaxis: { title: "Iteration" },
        yaxis: { title: "Value" },
        margin: { t: 40 }
    };
    Plotly.newPlot("jacobiPlot", data, layout);
}
    function runJacobi() {
        try {
            const A = JSON.parse(document.getElementById("Ainput").value);
            const b = JSON.parse(document.getElementById("binput").value);
            const N = parseInt(document.getElementById("Ninput").value);
            plotJacobi(A, b, N);
        } catch (e) {
            alert("Error parsing input. Make sure A and b are valid JSON arrays. Jacobi");
        }
    }
    // run at start with default inputs
    runJacobi()
</script>

## Gauss-Seidel Iterative Method

The Gauss–Seidel method builds upon the Jacobi method.  
The core idea is simple: within each iteration, we immediately use any newly computed values as soon as they are available, instead of waiting for the next iteration.

In the Jacobi method, all updates are done based on the previous iteration $x^{(k)}$:

$$
x_i^{(k+1)} = \frac{1}{a_{ii}} \left( b_i - \sum_{j \ne i} a_{ij} x_j^{(k)} \right)
$$

In the Gauss–Seidel method, however, as soon as we compute a new $x_i^{(k+1)}$, we reuse it in the same iteration for computing later components $x_j^{(k+1)}$ (where $j > i$):

$$
x_i^{(k+1)} = \frac{1}{a_{ii}} \left( b_i - \sum_{j < i} a_{ij} x_j^{(k+1)} - \sum_{j > i} a_{ij} x_j^{(k)} \right)
$$

This usually yields faster convergence because each iteration immediately benefits from the most recent updates.

### Example

Consider again the system:

$$
\begin{cases} 2x + y + z = 6 \\\\ x + 3y - z = 0 \\\\ -x + y + 2z = 3 \end{cases}
$$

Rewriting in Gauss–Seidel form:

$$
\begin{aligned} x &= \frac{6 - y - z}{2} \\ y &= \frac{0 - x + z}{3} \\ z &= \frac{3 + x - y}{2} \end{aligned}
$$

Starting with the initial guess $(x, y, z) = (0, 0, 0)$:

| Iteration | $x^{(k+1)}$                         | $y^{(k+1)}$                      | $z^{(k+1)}$                         |
| --------- | ----------------------------------- | -------------------------------- | ----------------------------------- |
| 1         | $x = 3.000$                         | $y = (-3 + 0)/3 = -1.000$        | $z = (3 + 3 - (-1))/2 = 3.5$        |
| 2         | $x = (6 - (-1) - 3.5)/2 = 1.75$     | $y = (-1.75 + 3.5)/3 = 0.583$    | $z = (3 + 1.75 - 0.583)/2 = 2.083$  |
| 3         | $x = (6 - 0.583 - 2.083)/2 = 1.667$ | $y = (-1.667 + 2.083)/3 = 0.139$ | $z = (3 + 1.667 - 0.139)/2 = 2.264$ |
| 4         | $x = (6 - 0.139 - 2.264)/2 = 1.798$ | $y = (-1.798 + 2.264)/3 = 0.155$ | $z = (3 + 1.798 - 0.155)/2 = 2.321$ |

<h2>Gauss–Seidel Iteration Visualizer</h2>
<label>Matrix A:</label><br>
<textarea id="AinputGaussSeidel" rows="3" cols="50">[[2,1,1],[1,3,-1],[-1,1,2]]</textarea><br>
<label>Vector b:</label><br>
<input id="binputGaussSeidel" value="[6,0,3]" size="50"><br>
<label>Number of iterations N:</label><br>
<input id="NinputGaussSeidel" type="number" value="10"><br>
<button onclick="runGaussSeidel()">Run Gauss–Seidel</button>
<div id="plot"></div>
<div id="GaussSeidelPlot">
</div>

<script src="https://cdn.plot.ly/plotly-3.1.1.min.js" charset="utf-8"></script>
<script>
function GaussSeidel(A, b, N) {
    const n = A.length;
    let x = Array(n).fill(0); // initial guess 0
    let xn = Array(n).fill(0);
    const history = Array.from({ length: n }, () => []);
    for (let k = 0; k < N; k++) { // jacobi iterations
        for (let i = 0; i < n; i++) {
            let sumPrev = 0;
            let sumNext = 0;
            for (let j = 0; j < n; j++) {
                if (i === j) continue;
                if (j < i) sumNext += A[i][j] * xn[j]; // sum of matrix coefficients times the new guess
                if (j > i) sumPrev += A[i][j] * x[j]; // sum of matrix coefficients times the current guess
            }
            xn[i] = (b[i] - sumNext - sumPrev) / A[i][i]; // compute next guess value
        }
        for (let i = 0; i < n; i++) {
            history[i].push(xn[i]);
            x[i] = xn[i]; // update guess value for next iteration
        }
    }
    return history;
}
function plotGaussSeidel(A, b, N) {
    const result = GaussSeidel(A, b, N);
    const data = result.map((vals, i) => ({
        x: Array.from({ length: vals.length }, (_, k) => k + 1),
        y: vals,
        type: "scatter",
        mode: "lines+markers",
        name: `x${i + 1}`
    }));
    const layout = {
        title: "Gauss–Seidel Iteration Convergence",
        xaxis: { title: "Iteration" },
        yaxis: { title: "Value" },
        margin: { t: 40 }
    };
    Plotly.newPlot("GaussSeidelPlot", data, layout);
}
    function runGaussSeidel() {
        try {
            const A = JSON.parse(document.getElementById("AinputGaussSeidel").value);
            const b = JSON.parse(document.getElementById("binputGaussSeidel").value);
            const N = parseInt(document.getElementById("NinputGaussSeidel").value);
            plotGaussSeidel(A, b, N);
        } catch (e) {
            alert("Error parsing input. Make sure A and b are valid JSON arrays. GaussSeidel");
        }
    }
    // run at start with default inputs
    runGaussSeidel()
</script>
