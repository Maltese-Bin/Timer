// 爱心时钟 · 乌龟爬动
(() => {
  const canvas = document.getElementById('clockCanvas');
  const ctx = canvas.getContext('2d');
  const timeEl = document.getElementById('timeDisplay');

  let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let scale = 1;
  // 乌龟图片资源与抠图缓存
  const turtleImg = new Image();
  const isHttp = typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:');
  if (isHttp) {
    try { turtleImg.crossOrigin = 'anonymous'; } catch (_) {}
  }
  turtleImg.src = './image.png';
  let turtleImgReady = false;
  let turtleMaskedCanvas = null; // 预处理后的透明背景图
  let turtleMaskedCtx = null;
  const WHITE_KEY_THRESHOLD = 242; // 近白抠图阈值（0-255）
  const WHITE_DIFF_TOLERANCE = 18; // RGB 相互之间差异容忍

  function processTurtleImageToMask(img) {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0);
    let imageData;
    try {
      imageData = octx.getImageData(0, 0, w, h);
    } catch (e) {
      // 在 file:// 或跨域情况下会报安全错误，返回 null 让外层使用原图
      return null;
    }
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // 近白（带轻微色偏）判定：高亮+RGB接近
      const isNearWhite = (r > WHITE_KEY_THRESHOLD && g > WHITE_KEY_THRESHOLD && b > WHITE_KEY_THRESHOLD)
        && (Math.abs(r - g) < WHITE_DIFF_TOLERANCE)
        && (Math.abs(r - b) < WHITE_DIFF_TOLERANCE)
        && (Math.abs(g - b) < WHITE_DIFF_TOLERANCE);
      if (isNearWhite) {
        data[i + 3] = 0; // 透明
      }
    }
    octx.putImageData(imageData, 0, 0);
    return off;
  }

  turtleImg.onload = () => {
    if (isHttp) {
      turtleMaskedCanvas = processTurtleImageToMask(turtleImg);
      if (turtleMaskedCanvas) {
        turtleMaskedCtx = turtleMaskedCanvas.getContext('2d');
      }
    } else {
      // file:// 情况下避免触发跨域安全限制，直接使用原图
      turtleMaskedCanvas = null;
      turtleMaskedCtx = null;
    }
    turtleImgReady = true;
  };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.floor(rect.width * dpr);
    height = Math.floor(rect.height * dpr);
    canvas.width = width;
    canvas.height = height;
    centerX = width / 2;
    centerY = height / 2 + (20 * dpr);
    scale = Math.min(width, height) * 0.023; // 经验比例，使爱心填充画布
  }

  window.addEventListener('resize', () => {
    resize();
    drawFrame();
  });

  // 爱心参数方程（著名心形曲线）
  // x(t) = 16 sin^3 t, y(t) = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t
  function heartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return {
      x: centerX + x * scale,
      y: centerY - y * scale
    };
  }

  function drawHeartPath(strokeStyle = '#ff4d6d', lineWidth = 3 * dpr) {
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.beginPath();
    const steps = 600;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const p = heartPoint(t);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawTicks() {
    // 沿爱心轮廓布置刻度与数字
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';

    // 工具：给定 t 求外法线（指向远离中心）
    function outwardNormalAt(t) {
      const p = heartPoint(t);
      const dt = 0.001;
      const p2 = heartPoint(t + dt);
      const tx = p2.x - p.x;
      const ty = p2.y - p.y;
      const len = Math.hypot(tx, ty) || 1;
      let nx = -ty / len; // 旋转 90°
      let ny = tx / len;
      // 确保指向外侧（远离中心）
      const vx = p.x - centerX;
      const vy = p.y - centerY;
      if (nx * vx + ny * vy < 0) { nx = -nx; ny = -ny; }
      const tangentAngle = Math.atan2(ty, tx);
      return { nx, ny, p, tangentAngle };
    }

    // 刻度
    for (let i = 0; i < 60; i++) {
      const t = (i / 60) * Math.PI * 2;
      const isHour = i % 5 === 0;
      const baseOffset = isHour ? 12 * dpr : 8 * dpr; // 外移距离
      const len = isHour ? 10 * dpr : 5 * dpr;       // 刻度线长度
      const { nx, ny, p } = outwardNormalAt(t);
      const sx = p.x + nx * baseOffset;
      const sy = p.y + ny * baseOffset;
      const ex = sx + nx * len;
      const ey = sy + ny * len;
      ctx.lineWidth = isHour ? 2.4 * dpr : 1.2 * dpr;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    // 此处不再绘制数字（改为在乌龟之后叠加，避免遮挡）

    ctx.restore();
  }

  // 叠加绘制罗马数字（XII/III/VI/IX），始终正向显示，并为 VI 加大外移避免遮挡
  function drawRomanNumeralsOverlay() {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(12, Math.min(22, Math.floor(Math.min(width, height) * 0.032))) * dpr;
    ctx.font = `${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;

    function outwardNormalAt(t) {
      const p = heartPoint(t);
      const dt = 0.001;
      const p2 = heartPoint(t + dt);
      const tx = p2.x - p.x;
      const ty = p2.y - p.y;
      const len = Math.hypot(tx, ty) || 1;
      let nx = -ty / len; // 旋转 90°
      let ny = tx / len;
      const vx = p.x - centerX;
      const vy = p.y - centerY;
      if (nx * vx + ny * vy < 0) { nx = -nx; ny = -ny; }
      return { nx, ny, p };
    }

    const romanMap = { 12: 'XII', 3: 'III', 6: 'VI', 9: 'IX' };
    const positions = [12, 3, 6, 9];
    for (const n of positions) {
      const t = (n / 12) * Math.PI * 2;
      const { nx, ny, p } = outwardNormalAt(t);
      // 基础外移，底部 VI 额外再外移，减少被爱心或乌龟遮挡
      const baseOffset = 34 * dpr;
      const extra = (n === 6) ? 12 * dpr : 0;
      const x = p.x + nx * (baseOffset + extra);
      const y = p.y + ny * (baseOffset + extra);

      // 仅渲染纯文字（正向、不旋转）
      const text = romanMap[n];
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.88)';
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawHands(now) {
    // 钟表时针与分针（圆形参考），中心取画布中心
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;

    const minAngle = (minutes + seconds / 60) * (Math.PI * 2 / 60) - Math.PI / 2;
    const hourAngle = (hours + minutes / 60) * (Math.PI * 2 / 12) - Math.PI / 2;

    const baseR = Math.min(width, height) * 0.34; // 分针长度
    const hourR = baseR * 0.72; // 时针更短

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';

    // 分针
    ctx.lineWidth = 4 * dpr;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(minAngle) * baseR, centerY + Math.sin(minAngle) * baseR);
    ctx.stroke();

    // 时针
    ctx.lineWidth = 6 * dpr;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(hourAngle) * hourR, centerY + Math.sin(hourAngle) * hourR);
    ctx.stroke();

    ctx.restore();
  }

  function drawTime(now) {
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    timeEl.textContent = `${hh}:${mm}:${ss}`;
  }

  // 让乌龟一圈 = 60 秒（体现时间流逝）。
  // 使用毫秒级进度保证平滑。
  function getProgress(now) {
    const seconds = now.getSeconds();
    const ms = now.getMilliseconds();
    return (seconds + ms / 1000) / 60; // [0,1)
  }

  function drawTurtle(t) {
    // 仅使用用户提供的图片作为乌龟
    const p = heartPoint(t);
    const dt = 0.002;
    const p2 = heartPoint(t + dt);
    const angle = Math.atan2(p2.y - p.y, p2.x - p.x);
    const nowMs = performance.now();
    const breathe = 1 + Math.sin(nowMs / 1800) * 0.02;

    if (!turtleImgReady) return; // 图片未加载则不绘制

    ctx.save();
    ctx.translate(p.x, p.y);
    const angleFix = Math.PI; // 若原图朝右可改为 0
    ctx.rotate(angle + angleFix);
    const base = Math.min(width, height) * 0.085; // 调整图片大小
    const source = turtleMaskedCanvas || turtleImg;
    const ratio = (source.height || source.naturalHeight) / (source.width || source.naturalWidth);
    const w = base;
    const h = base * (ratio || 1);
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowOffsetY = 3 * dpr;
    ctx.scale(breathe, breathe);
    ctx.drawImage(source, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function clear() {
    ctx.clearRect(0, 0, width, height);
  }

  function drawFrame() {
    const now = new Date();
    drawTime(now);
    clear();
    // 柔和背景光晕
    const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, Math.max(width, height) * 0.6);
    grad.addColorStop(0, 'rgba(255,240,244,0.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    drawHeartPath();
    drawTicks();
    drawHands(now);

    const progress = getProgress(now); // 0..1
    const t = progress * Math.PI * 2;
    drawTurtle(t);
    // 叠加绘制罗马数字（避免被乌龟遮挡）
    drawRomanNumeralsOverlay();
    // 中心轴帽，盖住指针根部
    ctx.save();
    ctx.fillStyle = '#ff85a1';
    ctx.strokeStyle = '#c41d7f';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function loop() {
    drawFrame();
    requestAnimationFrame(loop);
  }

  resize();
  loop();
})();


