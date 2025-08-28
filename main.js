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
  // 爱心整体垂直偏移（CSS像素，负值向上，正值向下）
  const HEART_VERTICAL_SHIFT = -40;
  // 生日设定（8月=8）
  const BIRTHDAY_MONTH = 8;
  const BIRTHDAY_DAY = 29;
  const BIRTHDAY_TRIGGER_WINDOW_MS = 20000; // 触发窗口 20s

  // 彩纸屑与气泡
  const confettiPieces = [];
  const bubbles = [];
  // 烟花与火花
  const fireworks = [];
  const sparks = [];
  let birthdayTriggered = false;

  function isBirthdayMoment(now) {
    const y = now.getFullYear();
    const target = new Date(y, BIRTHDAY_MONTH - 1, BIRTHDAY_DAY, 0, 0, 0, 0);
    const diff = now - target;
    return diff >= 0 && diff < BIRTHDAY_TRIGGER_WINDOW_MS;
  }

  function isBirthdayDay(now) {
    return now.getMonth() + 1 === BIRTHDAY_MONTH && now.getDate() === BIRTHDAY_DAY;
  }

  function spawnConfettiBurst() {
    const num = 160;
    for (let i = 0; i < num; i++) {
      const angle = Math.random() * Math.PI - Math.PI / 2; // 向上半球
      const speed = 3 + Math.random() * 4;
      confettiPieces.push({
        x: centerX + (Math.random() - 0.5) * 80,
        y: centerY - Math.min(width, height) * 0.2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        g: 0.08 + Math.random() * 0.06,
        size: 3 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        vr: (-0.2 + Math.random() * 0.4),
        color: randomConfettiColor(),
        life: 90 + Math.random() * 60
      });
    }
  }

  function randomConfettiColor() {
    const palette = ['#ff6b81', '#ffd166', '#70e000', '#4dabf7', '#845ef7', '#ff922b'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  function updateAndDrawConfetti() {
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const p = confettiPieces[i];
      p.vy += p.g;
      p.x += p.vx * dpr;
      p.y += p.vy * dpr;
      p.rot += p.vr;
      p.life -= 1;
      if (p.life <= 0 || p.y > height + 20) {
        confettiPieces.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 60));
      ctx.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
      ctx.restore();
    }
  }

  // 烟花
  function spawnFireworks(count = 3) {
    for (let i = 0; i < count; i++) {
      const x = centerX + (Math.random() - 0.5) * Math.min(width, height) * 0.6;
      const y = height + 10;
      const targetY = centerY - Math.min(width, height) * (0.25 + Math.random() * 0.25);
      fireworks.push({ x, y, vx: (-0.6 + Math.random() * 1.2) * dpr, vy: -(3.6 + Math.random() * 1.6) * dpr, ay: 0.045 * dpr, targetY, color: randomConfettiColor(), life: 180 });
    }
  }

  function explodeAt(x, y, baseColor) {
    const n = 80 + Math.floor(Math.random() * 60);
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (1.2 + Math.random() * 2.2) * dpr;
      sparks.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, g: 0.03 * dpr, drag: 0.992, life: 70 + Math.random() * 40, color: baseColor });
    }
  }

  function updateAndDrawFireworks() {
    // 火箭
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const f = fireworks[i];
      f.vy += f.ay;
      f.x += f.vx;
      f.y += f.vy;
      f.life -= 1;
      const explode = f.y <= f.targetY || f.life <= 0;
      ctx.save();
      ctx.strokeStyle = f.color;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x - f.vx * 4, f.y - f.vy * 4);
      ctx.stroke();
      ctx.restore();
      if (explode) {
        explodeAt(f.x, f.y, f.color);
        fireworks.splice(i, 1);
      }
    }
    // 火花
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.vy += s.g;
      s.vx *= s.drag; s.vy *= s.drag;
      s.x += s.vx; s.y += s.vy;
      s.life -= 1;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.save();
      const alpha = Math.max(0, Math.min(1, s.life / 60));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.6 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 庆祝序列：立即触发一次，随后多次间隔触发
  function celebrateSequence(rounds = 2, intervalMs = 2500) {
    spawnConfettiBurst();
    spawnFireworks(4);
    for (let i = 1; i <= rounds; i++) {
      setTimeout(() => { spawnConfettiBurst(); spawnFireworks(3); }, i * intervalMs);
    }
  }

  function maybeSpawnBubbles() {
    if (bubbles.length < 20 && Math.random() < 0.2) {
      const r = 3 + Math.random() * 6;
      bubbles.push({
        x: centerX + (Math.random() - 0.5) * Math.min(width, height) * 0.6,
        y: height + 10,
        r,
        vy: 0.6 + Math.random() * 0.6,
        drift: (-0.3 + Math.random() * 0.6)
      });
    }
  }

  function updateAndDrawBubbles() {
    maybeSpawnBubbles();
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.y -= b.vy * dpr;
      b.x += b.drift * dpr * 0.5;
      if (b.y < -20) {
        bubbles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
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
    centerY = height / 2 + (20 * dpr) + HEART_VERTICAL_SHIFT * dpr;
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
    // 柔和外发光
    ctx.shadowColor = 'rgba(255,77,109,0.35)';
    ctx.shadowBlur = 18 * dpr;
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
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
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
      const baseOffset = 36 * dpr;
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
    // 优化指针：带阴影、渐变、尖头与配重
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;

    const minAngle = (minutes + seconds / 60) * (Math.PI * 2 / 60) - Math.PI / 2;
    const hourAngle = (hours + minutes / 60) * (Math.PI * 2 / 12) - Math.PI / 2;

    const minuteLen = Math.min(width, height) * 0.34;
    const hourLen = minuteLen * 0.7;

    function drawHand(angle, length, baseWidth, colorStart, colorEnd, counterWeight = true) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      // 阴影
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowOffsetY = 2 * dpr;

      // 渐变
      const grad = ctx.createLinearGradient(0, 0, length, 0);
      grad.addColorStop(0, colorStart);
      grad.addColorStop(1, colorEnd);
      ctx.fillStyle = grad;

      const tipLen = baseWidth * 1.3;
      const backLen = Math.max(baseWidth * 1.2, 10 * dpr);
      const half = baseWidth / 2;

      // 形状：后端圆角矩形 + 前端三角尖
      ctx.beginPath();
      // 后端圆角
      ctx.moveTo(-backLen, -half);
      ctx.arcTo(-backLen, half, -backLen + half, half, half);
      // 侧边到尖端
      ctx.lineTo(length - tipLen, half);
      ctx.lineTo(length, 0);
      ctx.lineTo(length - tipLen, -half);
      // 返回后端
      ctx.lineTo(-backLen + half, -half);
      ctx.arcTo(-backLen, -half, -backLen, half, half);
      ctx.closePath();
      ctx.fill();

      // 细描边提升锐利度
      ctx.lineWidth = Math.max(1, baseWidth * 0.18);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();

      // 配重（后端小圆）
      if (counterWeight) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.arc(-backLen - half * 0.6, 0, half * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 分针（纤细、偏粉）
    drawHand(minAngle, minuteLen, 5.0 * dpr, '#ff7aa0', '#c41d7f', true);
    // 时针（更粗、偏深）
    drawHand(hourAngle, hourLen, 7.0 * dpr, '#6b6b6b', '#262626', true);
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
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    // 背景上浮气泡（在爱心后面）
    updateAndDrawBubbles();
    drawHeartPath();
    drawTicks();
    drawHands(now);

    const progress = getProgress(now); // 0..1
    const t = progress * Math.PI * 2;
    drawTurtle(t);
    // 生日触发彩纸屑
    if (isBirthdayMoment(now) && !birthdayTriggered) {
      birthdayTriggered = true;
      celebrateSequence(2, 2800);
    }
    updateAndDrawConfetti();
    updateAndDrawFireworks();
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

    // 生日祝福光效字样（生日当天更明显）
    if (isBirthdayDay(now)) {
      ctx.save();
      ctx.font = `${Math.floor(Math.min(width, height) * 0.06)}px 'Segoe UI', system-ui, -apple-system`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = '生日快乐';
      const glow = 12 * dpr;
      ctx.shadowColor = 'rgba(255, 105, 180, 0.7)';
      ctx.shadowBlur = glow;
      ctx.fillStyle = 'rgba(255, 77, 109, 0.95)';
      ctx.fillText(text, centerX, centerY - Math.min(width, height) * 0.32);
      ctx.restore();
    }
  }

  function loop() {
    drawFrame();
    requestAnimationFrame(loop);
  }

  resize();
  loop();
  // 绑定“立即庆祝”按钮
  const celebrateBtn = document.getElementById('celebrateBtn');
  if (celebrateBtn) {
    celebrateBtn.addEventListener('click', () => {
      celebrateSequence(2, 2800);
    });
  }
  // 背景音乐播放控制（需用户手势触发以通过浏览器策略）
  const bgm = document.getElementById('bgm');
  const musicBtn = document.getElementById('musicBtn');
  const volumeRange = document.getElementById('volumeRange');
  const volumeLabel = document.getElementById('volumeLabel');
  if (musicBtn && bgm) {
    // 默认降低音量（0.0 ~ 1.0）
    try {
      bgm.volume = 0.25;
      bgm.muted = false;
      bgm.setAttribute('playsinline', '');
      bgm.setAttribute('webkit-playsinline', '');
    } catch(_) {}
    let playing = false;
    musicBtn.addEventListener('click', async () => {
      try {
        if (!playing) {
          await bgm.play();
          playing = true;
          musicBtn.textContent = '❚❚ 暂停音乐';
          musicBtn.classList.add('playing');
        } else {
          bgm.pause();
          playing = false;
          musicBtn.textContent = '♪ 播放音乐';
          musicBtn.classList.remove('playing');
        }
      } catch (e) {
        console.warn('音乐播放被阻止：', e);
        // 提示用户再次点击或与页面交互
        try {
          const note = document.querySelector('.music-controls .note, .celebrate .tip');
          if (note && !note.dataset.hintShown) {
            note.dataset.hintShown = '1';
            note.textContent = '音乐播放被浏览器阻止，请再点击一次或与页面交互';
          }
        } catch(_) {}
      }
    });
  }
  if (volumeRange && volumeLabel && bgm) {
    const syncLabel = () => { volumeLabel.textContent = `${Math.round(bgm.volume * 100)}%`; };
    volumeRange.addEventListener('input', () => {
      const v = Math.max(0, Math.min(1, parseFloat(volumeRange.value)));
      bgm.volume = v;
      syncLabel();
    });
    // 首次同步显示
    try { volumeRange.value = String(bgm.volume); } catch(_) {}
    syncLabel();
  }
})();


