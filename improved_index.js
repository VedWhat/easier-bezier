document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const points = [];
  let tempCurve = [];
  let tempPoints = [];
  let curves = [];
  let currentCurveOrder = 3;
  let mousePos;
  let incompleteCurve = false;
  const factorials = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawCanvas();
  }
  resizeCanvas();
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("resize", resizeCanvas);

  function handleMouseDown(e) {
    incompleteCurve = true;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    let newPoint = {
      x: mouseX - rect.left,
      y: mouseY - rect.top,
    };
    console.log(`Mouse down at ${newPoint.x} and ${newPoint.y}`);
    tempPoints.push(newPoint);
    points.push(newPoint);
    if (tempPoints.length === currentCurveOrder + 1) {
      calculateBezierForGeneralCurve(tempPoints, currentCurveOrder);
      tempPoints = [];
      incompleteCurve = false;
    }
    redrawCanvas();
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    mousePos = { x: mouseX - rect.left, y: mouseY - rect.top };

    redrawCanvas();
  }

  // function lerp(p1, p2, t) {
  //   let x1 = p1.x + (p2.x - p1.x) * t;
  //   let y1 = p1.y + (p2.y - p1.y) * t;
  //   lerpPoints.push({ x: x1, y: y1 });
  //   return { x: x1, y: y1 };
  // }

  // let delta = 0.02;
  // function caclateBezier() {
  //   p1 = points[0];
  //   p2 = points[1];
  //   sp1 = supportPoints[0];
  //   for (i = 0; i <= 1; i += delta) {
  //     tp1 = lerp(p1, sp1, i);
  //     tp2 = lerp(sp1, p2, i);
  //     fp = lerp(tp1, tp2, i);
  //     tempCurve.push(fp);
  //   }
  // }

  function calculateBezierForGeneralCurve(tempCurve, n) {
    // Formula for bezier = Σ(nCk)*(1-t)^(n-i)t^iPi
    const d = 0.1;
    let bezierCurve = [];
    bezierCurve.push(tempCurve[0]);

    for (let t = 0; t <= 1; t += d) {
      let x = 0,
        y = 0;
      for (let i = 0; i <= n; i++) {
        const combinatoricsTerm =
          factorials[n] / (factorials[n - i] * factorials[i]);
        const tPowerTerm = Math.pow(1 - t, n - i) * Math.pow(t, i);
        x += combinatoricsTerm * tPowerTerm * tempPoints[i].x;
        y += combinatoricsTerm * tPowerTerm * tempPoints[i].y;
      }
      bezierCurve.push({ x: x, y: y });
    }
    bezierCurve.push(tempCurve[tempCurve.length - 1]);
    curves.push(bezierCurve);
    console.log(tempCurve);
    tempCurve = [];
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (mousePos && incompleteCurve) {
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.lineDash = [5, 15];
      ctx.arc(mousePos.x, mousePos.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.moveTo(
        tempPoints[tempPoints.length - 1].x,
        tempPoints[tempPoints.length - 1].y
      );
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
    }

    tempCurve.forEach((curvePoint) => {
      ctx.beginPath();
      ctx.fillStyle = "green";
      ctx.arc(curvePoint.x, curvePoint.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(curvePoint.x, curvePoint.y, 10, 0, 2 * Math.PI);
      ctx.stroke();
    });

    if (tempCurve.length >= 1) {
      ctx.beginPath();
      ctx.moveTo(tempCurve[0].x, tempCurve[0].y);
      for (i = 1; i < tempCurve.length; i++) {
        ctx.lineTo(tempCurve[i].x, tempCurve[i].y);
      }
      ctx.stroke();
    }

    curves.forEach((c) => {
      ctx.beginPath();
      ctx.moveTo(c[0].x, c[0].y);
      for (i = 1; i < c.length; i++) {
        ctx.lineTo(c[i].x, c[i].y);
      }
      ctx.stroke();
    });
  }
  redrawCanvas();
});
