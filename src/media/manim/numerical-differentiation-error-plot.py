from manim import *
import math

class NumDiffErrorPlot(Scene):
    def construct(self):
        # Config
        ax = Axes(
            x_range=[0, 0.7, 0.01],
            y_range=[0, 0.4, 0.01],
            axis_config={"color": GREY_B},
            x_axis_config={"include_numbers": False, "include_ticks": False},
            y_axis_config={"include_numbers": False, "include_ticks": False},
            tips=False
        )
        # labels = ax.get_axis_labels()
        self.add(ax)

        # # Define function
        E = lambda x: 0.01/x + x**2 / 6
        e_graph = ax.plot(E, x_range=(0.01, 0.7), color=YELLOW, use_smoothing=True, stroke_width=3)
        e_label = ax.get_graph_label(e_graph, label='E(h)', x_val=0.1, direction=UP+RIGHT)
        self.add(e_graph, e_label)
                
        Ex = lambda x: 0.01/x
        # Plot Ex only on a domain that excludes 0 to avoid singularities and huge samples
        Ex_graph = ax.plot(Ex, x_range=(0.01, 0.7), color=ORANGE, use_smoothing=True, stroke_width=3)
        Ex_label = ax.get_graph_label(Ex_graph, label=r'\frac{\varepsilon_r}{h}', x_val=0.7, direction=RIGHT)
        self.add(Ex_graph, Ex_label)

        Et = lambda x: x**2 / 6
        Et_graph = ax.plot(Et, color=TEAL, use_smoothing=True, stroke_width=3)
        Et_label = ax.get_graph_label(Et_graph, label=r'\frac{m}{6} h^{2}', x_val=0.8, direction=RIGHT)
        self.add(Et_graph, Et_label)


        title = Tex(r"Suggestive example of error function $E(h) = \frac{10^{-2}}{h} + \frac{m}{6} h^{2}$")
        title.scale(0.8)
        title.to_corner(UR)
        self.add(title)
        