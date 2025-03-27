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
  let backgroundImage = null;

  const factorials = [
    1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600,
    6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000,
    6402373705728000,
  ];

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.innerText = message;
    toast.className =
      "fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded shadow z-50 opacity-90 transition-opacity duration-300";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 1000);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawCanvas();
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      tempPoints = [];
      incompleteCurve = false;
      updateStack();
      redrawCanvas();
    }
    if (e.key === "z" && e.ctrlKey) {
      if (undoStack.length > 1) {
        undoStack.pop();
        const prevState = undoStack[undoStack.length - 1];
        points = deepClone(prevState.points);
        tempPoints = deepClone(prevState.tempPoints);
        curveCollection = deepClone(prevState.curveCollection);
        incompleteCurve = prevState.incompleteCurve;
        redrawCanvas();
        showToast("Undo");
      }
    }
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
      let newPoint = clickedPoint || { x: mouseX, y: mouseY };
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

  function handleMouseUp() {
    if (dragging) {
      dragging = false;
      draggedPoint = null;
      recalculateBezierCurves();
      updateStack();
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
    let bezierCurve = [points[0]];
    for (let t = 0; t <= 1; t += d) {
      let x = 0,
        y = 0;
      for (let i = 0; i <= order; i++) {
        const coeff =
          factorials[order] / (factorials[i] * factorials[order - i]);
        const term = Math.pow(1 - t, order - i) * Math.pow(t, i);
        x += coeff * term * points[i].x;
        y += coeff * term * points[i].y;
      }
      bezierCurve.push({ x, y });
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
    curveCollection = curveCollection.map((c) => {
      const points = [c.startPoint, ...c.supportPoints, c.endPoint];
      const curve = calculateSingleBezierCurve(points, c.order);
      return {
        curve,
        supportPoints: points.slice(1, -1),
        startPoint: points[0],
        endPoint: points[points.length - 1],
        order: c.order,
      };
    });
  }

  function updateStack() {
    if (undoStack.length > 10) undoStack.shift();
    undoStack.push({
      points: deepClone(points),
      tempPoints: deepClone(tempPoints),
      curveCollection: deepClone(curveCollection),
      incompleteCurve,
    });
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage)
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.setLineDash([]);

    points.forEach((p) => {
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    tempPoints.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "green";
      ctx.fill();
      ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
      ctx.strokeStyle = "black";
      ctx.stroke();
    });

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

    curveCollection.forEach((c) => {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(c.curve[0].x, c.curve[0].y);
      for (let i = 1; i < c.curve.length; i++) {
        ctx.lineTo(c.curve[i].x, c.curve[i].y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.setLineDash([5, 15]);
      ctx.moveTo(c.startPoint.x, c.startPoint.y);
      c.supportPoints.forEach((p) => {
        ctx.lineTo(p.x, p.y);
        ctx.moveTo(p.x, p.y);
      });
      ctx.lineTo(c.endPoint.x, c.endPoint.y);
      ctx.stroke();
    });
  }

  window.setCurveOrder = () => {
    const val = parseInt(document.getElementById("curve-order").value, 10);
    if (val >= 1 && val <= 18) currentCurveOrder = val;
    else alert("Please enter a number between 1 and 18 for the curve order.");
  };

  window.setDelta = () => {
    const val = parseFloat(document.getElementById("delta").value);
    if (val > 0 && val <= 1) d = val;
    else
      alert("Anything below zero and above one makes zero sense. Do better.");
    recalculateBezierCurves();
    redrawCanvas();
  };

  window.clearCanvas = () => {
    points = [];
    tempPoints = [];
    curveCollection = [];
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

  window.uploadBackground = function (event) {
    const file = event.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = function () {
      backgroundImage = img;
      redrawCanvas();
    };
    img.src = URL.createObjectURL(file);
  };

  redrawCanvas();
});
