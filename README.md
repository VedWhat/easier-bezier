### easier-bézier

A <b>*SUPER*</b> straight-forward implementation of a bezier curve editor.

#### What it is:
- A html canvas that supports bezier curve editing for orders n=>1 to n<10
- A SVG exporter, so you can take home your art 😄

#### What it isn't:
- A replacement to anything, it's honestly super easy and just a curiosity itch
- A way to have super accurate drawings

#### How it works:
- Ref: https://en.wikipedia.org/wiki/B%C3%A9zier_curve
- Bezier curves are super cool in that ONE equation gets you beautiful curves

For order n<=3 we have straight forward html canvas functions to draw them but for higher order beziers it's just straight lines for now but approximating the curve.

