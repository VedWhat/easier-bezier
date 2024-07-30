document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const points = [];
  let tempCurve = [];
  let tempPoints = [];
  let curves = [];
  let currentCurveOrder = 9;
  let mousePos;
  let incompleteCurve = false;
  const d = 0.1;

  let curveCollection = [];
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

  function calculateBezierForGeneralCurve(tempCurve, n) {
    // Formula for bezier = Σ(nCk)*(1-t)^(n-i)t^iPi
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
    curveCollection.push({
      curve: bezierCurve,
      supportPoints: tempCurve.slice(1, -1),
      startPoint: tempCurve[0],
      endPoint: tempCurve[tempCurve.length - 1],
    });
    curves.push(bezierCurve);
    tempCurve = [];
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (mousePos && incompleteCurve) {
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.arc(mousePos.x, mousePos.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.setLineDash([5, 15]);

      for (let i = 0; i < tempPoints.length - 1; i++) {
        ctx.moveTo(tempPoints[i].x, tempPoints[i].y);
        ctx.lineTo(tempPoints[i + 1].x, tempPoints[i + 1].y);
      }
      ctx.moveTo(
        tempPoints[tempPoints.length - 1].x,
        tempPoints[tempPoints.length - 1].y
      );
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    curveCollection.forEach((c) => {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(c.curve[0].x, c.curve[0].y);
      for (i = 1; i < c.curve.length; i++) {
        ctx.lineTo(c.curve[i].x, c.curve[i].y);
      }
      ctx.stroke();
    });

    curveCollection.forEach((c) => {
      const startPoint = c.startPoint;
      const endPoint = c.endPoint;
      const supportPoints = c.supportPoints;
      ctx.beginPath();
      ctx.setLineDash([5, 15]);
      ctx.moveTo(startPoint.x, startPoint.y);
      for (let i = 0; i < supportPoints.length; i++) {
        let point = supportPoints[i];
        ctx.lineTo(point.x, point.y);
        ctx.moveTo(point.x, point.y);
        ctx.stroke();
      }
      ctx.lineTo(endPoint.x, endPoint.y);
      ctx.stroke();
    });
  }
  redrawCanvas();
});
