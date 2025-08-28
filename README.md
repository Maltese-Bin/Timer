# 爱心时钟 · 乌龟爬动

一个以爱心曲线为表盘、乌龟沿路径前进体现时间流逝的网页动画。

## 运行
- 直接用浏览器打开 `index.html`。

## 自定义
- 在 `main.js` 中修改 `getProgress` 可调整一圈时长（当前为 60 秒）。
- 在 `styles.css` 修改配色、尺寸与字体。

## 公式
- x(t) = 16 sin^3 t
- y(t) = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t
