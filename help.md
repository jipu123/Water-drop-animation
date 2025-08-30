# 水滴动画系统 (Water Drop Animation System)

一个轻量级、高性能的 Canvas 水滴动画库，支持物理碰撞、分裂效果和响应式设计。

## ✨ 特性

- 🎨 **逼真的物理效果** - 重力下落、碰撞检测、弹跳分裂
- 🎯 **智能碰撞系统** - 自动检测页面元素并产生碰撞效果
- 📱 **响应式设计** - 基于 Bootstrap 断点的自适应控制
- 🎮 **交互式体验** - 点击画布生成水滴
- ⚡ **性能优化** - 可配置的性能选项，适配移动端
- 🛠️ **高度可定制** - 丰富的配置选项和公共 API

## 📦 安装

### 直接引入

```html
<script src="index.min.js"></script>
```

### 或使用未压缩版本（用于开发调试）

```html
<script src="index.js"></script>
```

## 🚀 快速开始

### 基础使用 - 纯水滴动画

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; overflow: hidden; }
        #canvas { position: fixed; top: 0; left: 0; z-index: -1; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script src="index.min.js"></script>
    <script>
        // 一行代码即可启动水滴动画
        new WaterDropSystem();
    </script>
</body>
</html>
```

### 进阶使用 - 添加碰撞元素

系统会自动检测页面中带有 `.obstacle` 类名的元素作为碰撞物体：

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; overflow: hidden; }
        
        #canvas { 
            position: fixed; 
            top: 0; 
            left: 0; 
            z-index: -1; 
        }
        
        /* 自定义障碍物样式 */
        .obstacle {
            position: absolute;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10;
        }
    </style>
</head>
<body>
    <!-- 创建任意形状的障碍物 -->
    <div class="obstacle" style="
        top: 200px;
        left: 100px;
        width: 300px;
        height: 60px;
        border-radius: 30px;
    ">椭圆障碍物</div>
    
    <div class="obstacle" style="
        top: 300px;
        left: 400px;
        width: 150px;
        height: 150px;
        border-radius: 50%;
    ">圆形障碍物</div>
    
    <div class="obstacle" style="
        top: 500px;
        left: 200px;
        width: 200px;
        height: 80px;
    ">矩形障碍物</div>
    
    <canvas id="canvas"></canvas>
    <script src="index.min.js"></script>
    <script>
        new WaterDropSystem();
    </script>
</body>
</html>
```

## 🎯 碰撞系统说明

### 工作原理

- 系统自动扫描所有带有 `.obstacle` 类名的 DOM 元素
- 水滴会与这些元素产生碰撞并弹开
- 大水滴碰撞后会分裂成小水滴
- 支持多种形状的碰撞检测

### 支持的形状

1. **矩形** - 无 border-radius
2. **圆形** - 宽高相等且 border-radius: 50%
3. **圆角矩形** - 任意 border-radius 值
4. **椭圆** - 使用较大的 border-radius

### 自定义障碍物

你可以将任何 DOM 元素设置为障碍物，只需添加 `.obstacle` 类：

```html
<!-- 导航栏作为障碍物 -->
<nav class="obstacle navbar">...</nav>

<!-- 卡片作为障碍物 -->
<div class="obstacle card">...</div>

<!-- 按钮作为障碍物 -->
<button class="obstacle btn">点击我</button>
```

⚠️ **注意**：`.obstacle` 只是默认的类名标识，用于告诉系统哪些元素需要参与碰撞检测。如果页面中没有任何 `.obstacle` 元素，水滴将只与画布底部碰撞。

## ⚙️ 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `dropInterval` | Number | 200 | 水滴生成间隔（毫秒） |
| `minDropSize` | Number | 3 | 最小水滴尺寸，小于此值不再分裂 |
| `breakpoint` | String | 'sm' | 响应式断点 |
| `backgroundColor` | String | 'transparent' | 画布背景色 |
| `defaultDropColor` | Object | 浅蓝色 | 自动生成的水滴颜色 |
| `clickDropColor` | Object | 深蓝色 | 点击产生的水滴颜色 |
| `enabled` | Boolean | true | 是否启用动画 |

### 响应式断点值

- `'xs'`: 0px - 始终显示动画
- `'sm'`: ≥576px - 小屏幕以上显示
- `'md'`: ≥768px - 中等屏幕以上显示
- `'lg'`: ≥992px - 大屏幕以上显示
- `'xl'`: ≥1200px - 超大屏幕以上显示
- `'xxl'`: ≥1400px - 超超大屏幕以上显示

## 🎨 主题定制示例

### 海洋主题

```javascript
new WaterDropSystem({
    backgroundColor: 'linear-gradient(to bottom, #e0f7fa, #006064)',
    defaultDropColor: {
        main: 'rgba(0, 188, 212, ',
        shadow: 'rgba(0, 151, 167, 0.6)',
        highlight: 'rgba(178, 235, 242, 0.8)'
    },
    clickDropColor: {
        main: 'rgba(0, 96, 100, ',
        shadow: 'rgba(0, 77, 64, 0.6)',
        highlight: 'rgba(128, 203, 196, 0.8)'
    }
});
```

### 紫色梦幻

```javascript
new WaterDropSystem({
    backgroundColor: 'linear-gradient(to bottom, #f3e5f5, #4a148c)',
    defaultDropColor: {
        main: 'rgba(156, 39, 176, ',
        shadow: 'rgba(123, 31, 162, 0.6)',
        highlight: 'rgba(225, 190, 231, 0.8)'
    },
    clickDropColor: {
        main: 'rgba(74, 20, 140, ',
        shadow: 'rgba(49, 27, 146, 0.6)',
        highlight: 'rgba(179, 157, 219, 0.8)'
    }
});
```

## 📖 API 文档

### 构造函数

```javascript
const waterDrop = new WaterDropSystem(options);
```

### 实例方法

#### `updateConfig(newConfig)`
动态更新配置
```javascript
waterDrop.updateConfig({
    dropInterval: 100,
    backgroundColor: 'linear-gradient(45deg, #667eea, #764ba2)'
});
```

#### `pause()`
暂停动画
```javascript
waterDrop.pause();
```

#### `resume()`
恢复动画
```javascript
waterDrop.resume();
```

#### `clear()`
清空所有水滴
```javascript
waterDrop.clear();
```

#### `destroy()`
销毁实例，清理资源
```javascript
waterDrop.destroy();
```

## 📱 性能优化建议

### 移动端配置

```javascript
new WaterDropSystem({
    dropInterval: 500,      // 降低生成频率
    minDropSize: 5,         // 增大最小尺寸，减少分裂
    breakpoint: 'lg'        // 只在大屏幕显示
});
```

### 高性能模式

```javascript
new WaterDropSystem({
    dropInterval: 1000,     // 大幅降低生成频率
    minDropSize: 10,        // 禁止小水滴分裂
    breakpoint: 'xl'        // 只在超大屏幕显示
});
```

## 🌐 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- 移动端浏览器（建议测试性能后调整配置）

## ⚠️ 重要说明

1. **Canvas 元素必需**：页面必须包含 `id="canvas"` 的 canvas 元素
2. **颜色格式要求**：`main` 颜色属性必须以 `'rgba(r, g, b, '` 格式结尾（注意逗号和空格）
3. **障碍物可选**：`.obstacle` 类是可选的，不添加任何障碍物时水滴只与底部碰撞
4. **z-index 层级**：确保 canvas 的 z-index 低于页面内容
5. **字符编码问题**：源代码中的注释存在编码问题，但不影响功能使用

## 📄 文件说明

```
water-drop-system/
├── index.html       # 完整示例页面（包含障碍物示例）
├── index.js         # 未压缩源代码
├── index.min.js     # 生产环境压缩版
├── help.md          # 详细配置文档
└── README.md        # 项目说明文档
```

## 💡 使用场景

- 网站背景动画
- 加载页面效果
- 交互式演示
- 创意展示页面
- 节日主题效果

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📜 许可证

MIT License