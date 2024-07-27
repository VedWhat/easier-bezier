document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  let points = [];
  let selectedPoints = [];
  let tempPoints = [];
  let curves = [];
  let curveType = "line";
  let curveOrder = 2;
  let isDragging = false;
  let draggedPoint = null;
  let isShiftPressed = false;
  let undoStack = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    redrawCanvas();
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Shift") isShiftPressed = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Shift") isShiftPressed = false;
  });

  function saveState() {
    undoStack.push({
      points: JSON.parse(JSON.stringify(points)),
      curves: curves.map((curve) => ({
        ...curve,
        points: curve.points.map((p) => ({ x: p.x, y: p.y })),
      })),
    });
  }

  function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedPoint = points.find(
      (point) => Math.abs(point.x - x) < 5 && Math.abs(point.y - y) < 5
    );

    if (clickedPoint) {
      isDragging = true;
      draggedPoint = clickedPoint;
      if (!isShiftPressed) {
        saveState();
        selectPoint(clickedPoint);
      }
    } else if (!isShiftPressed) {
      saveState();
      const newPoint = { x, y };
      points.push(newPoint);
      selectPoint(newPoint);
    }
    redrawCanvas();
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isOverPoint = points.some(
      (point) => Math.abs(point.x - x) < 5 && Math.abs(point.y - y) < 5
    );

    canvas.style.cursor = isOverPoint ? "pointer" : "default";

    if (isDragging && draggedPoint) {
      draggedPoint.x = x;
      draggedPoint.y = y;
      updateCurves();
    } else if (selectedPoints.length > 0 && !isShiftPressed) {
      const requiredPoints = getRequiredPoints();
      if (selectedPoints.length === requiredPoints - 1) {
        tempPoints = [...selectedPoints, { x, y }];
      } else {
        tempPoints = [...selectedPoints];
      }
    }
    redrawCanvas();
  }

  function handleMouseUp() {
    if (isDragging) {
      saveState();
    }
    isDragging = false;
    draggedPoint = null;
  }

  function selectPoint(point) {
    if (!selectedPoints.includes(point)) {
      selectedPoints.push(point);
    }
    tempPoints = [...selectedPoints];
    if (selectedPoints.length === getRequiredPoints()) {
      createCurve();
      selectedPoints = [];
      tempPoints = [];
    }
  }

  function getRequiredPoints() {
    switch (curveType) {
      case "line":
        return 2;
      case "quadratic":
        return 3;
      case "cubic":
        return 4;
      case "higher":
        return curveOrder + 1;
      default:
        return 2;
    }
  }

  function createCurve() {
    saveState();
    curves.push({
      type: curveType,
      points: selectedPoints.map(
        (p) => points.find((point) => point.x === p.x && point.y === p.y) || p
      ),
      order: curveOrder,
    });
  }

  function updateCurves() {
    curves.forEach((curve) => {
      curve.points = curve.points.map(
        (p) =>
          points.find(
            (point) => point === p || (point.x === p.x && point.y === p.y)
          ) || p
      );
    });
  }

  function drawPoint(point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  function drawCurve(curve) {
    ctx.beginPath();
    ctx.moveTo(curve.points[0].x, curve.points[0].y);

    switch (curve.type) {
      case "line":
        ctx.lineTo(curve.points[1].x, curve.points[1].y);
        break;
      case "quadratic":
        ctx.quadraticCurveTo(
          curve.points[1].x,
          curve.points[1].y,
          curve.points[2].x,
          curve.points[2].y
        );
        break;
      case "cubic":
        ctx.bezierCurveTo(
          curve.points[1].x,
          curve.points[1].y,
          curve.points[2].x,
          curve.points[2].y,
          curve.points[3].x,
          curve.points[3].y
        );
        break;
      case "higher":
        drawHigherOrderBezier(curve.points);
        break;
    }

    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(curve.points[0].x, curve.points[0].y);
    for (let i = 1; i < curve.points.length; i++) {
      ctx.lineTo(curve.points[i].x, curve.points[i].y);
    }
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "black";
  }

  function drawHigherOrderBezier(points) {
    for (let t = 0; t <= 1; t += 0.01) {
      const point = getPointOnBezierCurve(points, t);
      ctx.lineTo(point.x, point.y);
    }
  }

  function getPointOnBezierCurve(points, t) {
    if (points.length === 1) return points[0];
    const newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      newPoints.push({
        x: (1 - t) * points[i].x + t * points[i + 1].x,
        y: (1 - t) * points[i].y + t * points[i + 1].y,
      });
    }
    return getPointOnBezierCurve(newPoints, t);
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    curves.forEach(drawCurve);

    const requiredPoints = getRequiredPoints();
    if (tempPoints.length === requiredPoints) {
      drawCurve({ type: curveType, points: tempPoints, order: curveOrder });
    }

    points.forEach(drawPoint);

    selectedPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.strokeStyle = "blue";
      ctx.stroke();
    });

    tempPoints.slice(selectedPoints.length).forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });

    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
  }

  function curvesToSVGPath(curves) {
    let path = "";
    curves.forEach((curve) => {
      const [start, ...points] = curve.points;
      path += `M${start.x},${start.y}`;
      switch (curve.type) {
        case "line":
          path += `L${points[0].x},${points[0].y}`;
          break;
        case "quadratic":
          path += `Q${points[0].x},${points[0].y} ${points[1].x},${points[1].y}`;
          break;
        case "cubic":
          path += `C${points[0].x},${points[0].y} ${points[1].x},${points[1].y} ${points[2].x},${points[2].y}`;
          break;
        case "higher":
          const segments = 10;
          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = getPointOnBezierCurve(curve.points, t);
            path +=
              i === 0 ? `M${point.x},${point.y}` : `L${point.x},${point.y}`;
          }
          break;
      }
    });
    return path;
  }

  function exportSVG() {
    const svgPath = curvesToSVGPath(curves);
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <path d="${svgPath}" fill="none" stroke="black" />
      </svg>
    `;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curves.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function undo() {
    if (undoStack.length > 0) {
      const lastState = undoStack.pop();
      points = lastState.points;
      curves = lastState.curves;

      curves.forEach((curve) => {
        curve.points = curve.points.map(
          (p) => points.find((point) => point.x === p.x && point.y === p.y) || p
        );
      });

      selectedPoints = [];
      tempPoints = [];
      redrawCanvas();
    }
  }

  window.setLineMode = () => {
    curveType = "line";
    selectedPoints = [];
    tempPoints = [];
    redrawCanvas();
  };
  window.setQuadraticMode = () => {
    curveType = "quadratic";
    selectedPoints = [];
    tempPoints = [];
    redrawCanvas();
  };
  window.setCubicMode = () => {
    curveType = "cubic";
    selectedPoints = [];
    tempPoints = [];
    redrawCanvas();
  };
  window.setHigherOrderMode = () => {
    const orderInput = document.getElementById("curve-order");
    const order = parseInt(orderInput.value, 10);
    if (order >= 4 && order <= 10) {
      curveType = "higher";
      curveOrder = order;
      selectedPoints = [];
      tempPoints = [];
      redrawCanvas();
    } else {
      alert("Please enter a number between 4 and 10 for the curve order.");
    }
  };
  window.clearCanvas = () => {
    points = [];
    selectedPoints = [];
    tempPoints = [];
    curves = [];
    redrawCanvas();
  };
  window.exportSVG = exportSVG;
  window.undo = undo;
});
