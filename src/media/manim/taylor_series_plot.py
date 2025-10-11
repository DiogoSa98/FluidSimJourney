from manim import *
import math

class TaylorSeriesPlot(Scene):
    def construct(self):
        # Config
        ax = Axes(
            x_range=[-3, 3, 1],
            y_range=[-2, 4, 2],
            axis_config={"color": GREY_B},
            x_axis_config={"include_numbers": False, "include_ticks": False},
            y_axis_config={"include_numbers": False, "include_ticks": False},
            tips=False
        )
        labels = ax.get_axis_labels()
        self.add(ax, labels)

        # Define function
        f = lambda x: x + x**2 + np.exp(x)
        f_graph = ax.plot(f, color=YELLOW, use_smoothing=True, stroke_width=3)
        f_label = ax.get_graph_label(f_graph, label='f(x)', x_val=-3.8, direction=DOWN)
        self.add(f_graph, f_label)

        # Colors for each approximation
        colors = [BLUE, GREEN, RED, ORANGE, PURPLE]
        # Derivatives at 0
        f0 = 1                 # f(0) = 1
        f1 = 1 + 0 + 1            # f'(x) = 1 + 2x + e^x, f'(0) = 2
        f2 = 2 + 1                # f''(x) = 2 + e^x, f''(0) = 3
        f3 = 1                     # f'''(x) = e^x, f'''(0) = 1
        f4 = 1                     # f''''(x) = e^x, f''''(0) = 1


        p0 = lambda x: 1
        p1 = lambda x: f0 + f1*x
        p2 = lambda x: f0 + f1*x + f2*x**2/2
        p3 = lambda x: f0 + f1*x + f2*x**2/2 + f3*x**3/6
        p4 = lambda x: f0 + f1*x + f2*x**2/2 + f3*x**3/6 + f4*x**4/24


        polys = [p0, p1, p2, p3, p4]
        colors = [BLUE, GREEN, TEAL, ORANGE, RED]

        # Plot all Taylor polynomials
        labels = VGroup()
        for i, p in enumerate(polys):
            graph = ax.plot(p, color=colors[i], use_smoothing=True, stroke_width=1.5)
            # Slightly stagger label positions so they don't overlap
            label = Tex(f"p{i}").scale(0.5).set_color(colors[i])
            label.next_to(ax.coords_to_point(3, i*0.5+2), RIGHT + UP * (0.3 * (i - 2)))
            self.add(graph)
            labels.add(label)

        self.add(labels)

        title = Tex("Taylor Series approximation of $f(x) = x + x^2 + e^x$")
        title.scale(0.8) 
        title.to_corner(DR)
        self.add(title)
        