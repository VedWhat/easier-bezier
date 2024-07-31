document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  let points = [];
  let tempPoints = [];
  let currentCurveOrder = 1;
  let mousePos;
  let incompleteCurve = false;
  let d = 0.1;
  let dragging = false;
  let draggedPoint;
  let isShiftPressed = false;

  let undoStack = [];

  let curveCollection = [];
  //0-18 stopping here because any larger and the representation of numbers gets messed up
  const factorials = [
    1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600,
    6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000,
    6402373705728000,
  ];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawCanvas();
  }
  resizeCanvas();
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      tempPoints = [];
      incompleteCurve = false;
      redrawCanvas();
      console.log("Removing element from stack");
      undoStack.pop();
      console.log(undoStack);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "z" && e.ctrlKey) {
      if (undoStack.length > 1) {
        undoStack.pop();
        const prevState = undoStack[undoStack.length - 1];
        points = prevState.points;
        tempPoints = prevState.tempPoints;
        curveCollection = prevState.curveCollection;
        incompleteCurve = prevState.incompleteCurve;
        console.log("Restoring to previous state:");
        console.log(prevState.tempPoints);

        redrawCanvas();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") isShiftPressed = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") isShiftPressed = false;
  });

  function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const clickedPoint = points.find(
      (point) =>
        Math.abs(point.x - mouseX) < 5 && Math.abs(point.y - mouseY) < 5
    );

    if (clickedPoint && isShiftPressed) {
      dragging = true;
      draggedPoint = clickedPoint;
    } else {
      incompleteCurve = true;

      let newPoint;
      if (clickedPoint) {
        newPoint = clickedPoint;
      } else {
        newPoint = {
          x: mouseX,
          y: mouseY,
        };
      }
      tempPoints.push(newPoint);
      if (tempPoints.length === currentCurveOrder + 1) {
        points.push(...tempPoints);
        calculateBezierForGeneralCurve(tempPoints, currentCurveOrder);
        tempPoints = [];
        incompleteCurve = false;
      }
    }
    updateStack();
    redrawCanvas();
  }

  function updateStack() {
    // console.log("Updating stack");
    if (undoStack.length > 10) {
      undoStack.shift();
    }
    state = {
      points: [...points],
      tempPoints: [...tempPoints],
      curveCollection: [...curveCollection],
      incompleteCurve: incompleteCurve,
    };
    undoStack.push(state);
    // console.log(state.points);
  }

  function handleMouseUp(e) {
    console.log(points);
    updateStack();
    if (dragging) {
      dragging = false;
      draggedPoint = null;
      recalculateBezierCurves();
    }
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    mousePos = { x: mouseX, y: mouseY };

    const isOverPoint = points.some(
      (point) =>
        Math.abs(point.x - mouseX) < 5 && Math.abs(point.y - mouseY) < 5
    );

    canvas.style.cursor = isOverPoint ? "pointer" : "default";

    if (dragging && draggedPoint) {
      draggedPoint.x = mouseX;
      draggedPoint.y = mouseY;
      recalculateBezierCurves();
    }

    redrawCanvas();
  }

  function calculateSingleBezierCurve(points, order) {
    let bezierCurve = [];
    bezierCurve.push(points[0]);

    for (let t = 0; t <= 1; t += d) {
      let x = 0,
        y = 0;
      for (let i = 0; i <= order; i++) {
        const combinatoricsTerm =
          factorials[order] / (factorials[order - i] * factorials[i]);
        const tPowerTerm = Math.pow(1 - t, order - i) * Math.pow(t, i);
        x += combinatoricsTerm * tPowerTerm * points[i].x;
        y += combinatoricsTerm * tPowerTerm * points[i].y;
      }
      bezierCurve.push({ x: x, y: y });
    }
    bezierCurve.push(points[points.length - 1]);

    return bezierCurve;
  }

  function calculateBezierForGeneralCurve(tempCurve, n) {
    const bezierCurve = calculateSingleBezierCurve(tempCurve, n);
    curveCollection.push({
      curve: bezierCurve,
      supportPoints: tempCurve.slice(1, -1),
      startPoint: tempCurve[0],
      endPoint: tempCurve[tempCurve.length - 1],
      order: n,
    });
  }

  function recalculateBezierCurves() {
    let newCurveCollection = [];
    for (let curve of curveCollection) {
      let curvePoints = [
        curve.startPoint,
        ...curve.supportPoints,
        curve.endPoint,
      ];
      let newBezierCurve = calculateSingleBezierCurve(curvePoints, curve.order);
      newCurveCollection.push({
        curve: newBezierCurve,
        supportPoints: curvePoints.slice(1, -1),
        startPoint: curvePoints[0],
        endPoint: curvePoints[curvePoints.length - 1],
        order: curve.order,
      });
    }
    curveCollection = newCurveCollection;
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setLineDash([]);

    // Draw all points
    points.forEach((point) => {
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    tempPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "green";
      ctx.fill();
      ctx.arc(point.x, point.y, 7, 0, 2 * Math.PI);
      ctx.strokeStyle = "black";
      ctx.stroke();
    });

    // Draw incomplete curve
    if (mousePos && incompleteCurve) {
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "blue";
      ctx.fill();
      ctx.arc(mousePos.x, mousePos.y, 7, 0, 2 * Math.PI);
      ctx.strokeStyle = "black";
      ctx.stroke();
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

    // Draw all curves
    curveCollection.forEach((c) => {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(c.curve[0].x, c.curve[0].y);
      for (let i = 1; i < c.curve.length; i++) {
        ctx.lineTo(c.curve[i].x, c.curve[i].y);
      }
      ctx.stroke();

      // Draw support lines
      ctx.beginPath();
      ctx.setLineDash([5, 15]);
      ctx.moveTo(c.startPoint.x, c.startPoint.y);
      for (let point of c.supportPoints) {
        ctx.lineTo(point.x, point.y);
        ctx.moveTo(point.x, point.y);
      }
      ctx.lineTo(c.endPoint.x, c.endPoint.y);
      ctx.stroke();
    });
  }

  window.setCurveOrder = () => {
    const orderInput = document.getElementById("curve-order");
    const order = parseInt(orderInput.value, 10);
    if (order >= 1 && order <= 18) {
      currentCurveOrder = order;
    } else {
      alert("Please enter a number between 1 and 18 for the curve order.");
    }
  };

  window.clearCanvas = () => {
    points = [];
    tempPoints = [];
    curveCollection = [];
    redrawCanvas();
  };

  window.setDelta = () => {
    const deltaInput = document.getElementById("delta");
    const delta = parseFloat(deltaInput.value);
    if (delta > 0 && delta <= 1) {
      d = delta;
    } else {
      alert("Anything below zero and above one makes zero sense. Do better.");
    }
    recalculateBezierCurves();
    redrawCanvas();
  };

  window.exportSVG = () => {
    let svg = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">`;
    curveCollection.forEach((c) => {
      svg += `<path d="M ${c.curve[0].x} ${c.curve[0].y}`;
      for (let i = 1; i < c.curve.length; i++) {
        svg += ` L ${c.curve[i].x} ${c.curve[i].y}`;
      }
      svg += `" fill="none" stroke="black" stroke-width="2"/>`;
    });
    svg += "</svg>";

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bezier.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  redrawCanvas();
});
