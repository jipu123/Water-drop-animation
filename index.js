class WaterDropSystem {
    constructor(options = {}) {
        // 默认配置
        const defaultConfig = {
            // 水滴生成间隔（毫秒）
            dropInterval: 200,
            // 最小水滴尺寸，小于此值不再分裂
            minDropSize: 3,
            // 响应式断点配置
            breakpoint: 'sm', // 可选: 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'
            // 背景颜色配置
            backgroundColor: 'transparent', // 可以是任何有效的CSS颜色值
            // 默认水滴颜色配置
            defaultDropColor: {
                main: 'rgba(135, 206, 235, ',      // 浅蓝色
                shadow: 'rgba(135, 206, 235, 0.5)',
                highlight: 'rgba(255, 255, 255, 0.6)'
            },
            // 点击产生的水滴颜色配置
            clickDropColor: {
                main: 'rgba(30, 60, 120, ',        // 深蓝色
                shadow: 'rgba(30, 60, 120, 0.5)',
                highlight: 'rgba(100, 150, 255, 0.6)'
            },
            // 是否启用动画
            enabled: true
        };

        // 合并用户配置和默认配置
        this.config = { ...defaultConfig, ...options };

        // Bootstrap断点映射
        this.breakpoints = {
            xs: 0,
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200,
            xxl: 1400
        };

        // 获取Canvas元素
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            console.error('Canvas element with id "canvas" not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.obstacles = [];
        this.resizeTimer = null;
        this.animationPaused = false;
        this.lastTime = 0;
        this.lastDropTime = 0;
        this.animationEnabled = this.config.enabled;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.updateObstacles();
        this.bindEvents();
        this.checkBreakpoint(); // 初始检查断点
        
        // 应用背景颜色
        this.applyBackgroundColor();
        
        // 只有在启用动画时才开始动画循环
        if (this.animationEnabled) {
            this.animate();
        }
    }

    applyBackgroundColor() {
        // 如果不是透明背景，则设置canvas的背景色
        if (this.config.backgroundColor !== 'transparent') {
            this.canvas.style.background = this.config.backgroundColor;
        }
        // 如果原本HTML中有背景设置，这里可以覆盖它
    }

    checkBreakpoint() {
        const windowWidth = window.innerWidth;
        const breakpointWidth = this.breakpoints[this.config.breakpoint];
        
        // 判断是否应该启用动画
        const shouldEnable = windowWidth >= breakpointWidth;
        
        if (shouldEnable !== this.animationEnabled) {
            this.animationEnabled = shouldEnable;
            
            if (!this.animationEnabled) {
                // 禁用动画时清空水滴
                this.drops = [];
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        // 窗口大小调整事件
        window.addEventListener('resize', () => {
            this.animationPaused = true;
            clearTimeout(this.resizeTimer);

            this.resizeTimer = setTimeout(() => {
                this.resizeCanvas();
                this.updateObstacles();
                this.checkBreakpoint(); // 检查是否需要启用/禁用动画
                this.animationPaused = false;
            }, 1000);
        });

        // 点击事件
        this.canvas.addEventListener('click', (e) => {
            // 只有在动画启用时才响应点击
            if (this.animationEnabled) {
                this.handleClick(e);
            }
        });
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 检查点击位置是否有遮挡
        if (!this.isPositionBlocked(x, y)) {
            // 在点击位置创建使用配置的点击水滴颜色
            const clickDrop = this.createDrop(
                x,           // x位置
                y,           // y位置
                15,          // 初始大小
                0,           // x速度
                0,           // y速度
                [],          // 受影响的障碍物
                false,       // 底部弹跳标记
                this.config.clickDropColor  // 使用配置的点击水滴颜色
            );
            this.drops.push(clickDrop);
        }
    }

    isPositionBlocked(x, y) {
        // 检查给定位置是否被任何障碍物遮挡
        for (let obstacle of this.obstacles) {
            if (x >= obstacle.x &&
                x <= obstacle.x + obstacle.width &&
                y >= obstacle.y &&
                y <= obstacle.y + obstacle.height) {

                // 如果有圆角，需要更精确的检测
                if (obstacle.radius > 0) {
                    // 检查四个圆角
                    const corners = [
                        { cx: obstacle.x + obstacle.radius, cy: obstacle.y + obstacle.radius },
                        { cx: obstacle.x + obstacle.width - obstacle.radius, cy: obstacle.y + obstacle.radius },
                        { cx: obstacle.x + obstacle.radius, cy: obstacle.y + obstacle.height - obstacle.radius },
                        { cx: obstacle.x + obstacle.width - obstacle.radius, cy: obstacle.y + obstacle.height - obstacle.radius }
                    ];

                    // 检查是否在圆角外的死角区域
                    let inCornerArea = false;
                    if (x < obstacle.x + obstacle.radius) {
                        if (y < obstacle.y + obstacle.radius) {
                            // 左上角
                            const dx = x - corners[0].cx;
                            const dy = y - corners[0].cy;
                            inCornerArea = dx * dx + dy * dy > obstacle.radius * obstacle.radius;
                        } else if (y > obstacle.y + obstacle.height - obstacle.radius) {
                            // 左下角
                            const dx = x - corners[2].cx;
                            const dy = y - corners[2].cy;
                            inCornerArea = dx * dx + dy * dy > obstacle.radius * obstacle.radius;
                        }
                    } else if (x > obstacle.x + obstacle.width - obstacle.radius) {
                        if (y < obstacle.y + obstacle.radius) {
                            // 右上角
                            const dx = x - corners[1].cx;
                            const dy = y - corners[1].cy;
                            inCornerArea = dx * dx + dy * dy > obstacle.radius * obstacle.radius;
                        } else if (y > obstacle.y + obstacle.height - obstacle.radius) {
                            // 右下角
                            const dx = x - corners[3].cx;
                            const dy = y - corners[3].cy;
                            inCornerArea = dx * dx + dy * dy > obstacle.radius * obstacle.radius;
                        }
                    }

                    if (!inCornerArea) {
                        return true; // 被遮挡
                    }
                } else {
                    return true; // 被矩形遮挡
                }
            }
        }
        return false; // 没有被遮挡
    }

    updateObstacles() {
        this.obstacles = [];
        const elements = document.querySelectorAll('.obstacle');

        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);
            const borderRadius = styles.borderRadius;

            // 解析border-radius
            let radius = 0;
            if (borderRadius && borderRadius !== '0px') {
                radius = parseFloat(borderRadius);
            }

            this.obstacles.push({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                radius: radius,
                id: element.id || Math.random().toString()
            });
        });
    }

    // 创建水滴，使用配置的颜色
    createDrop(x = null, y = null, size = null, vx = 0, vy = 0, affectedObstacles = [], hasBouncedBottom = false, color = null) {
        // 如果没有指定颜色，使用配置的默认水滴颜色
        const dropColor = color || this.config.defaultDropColor;

        return {
            x: x !== null ? x : Math.random() * this.canvas.width,
            y: y !== null ? y : -20,  // 如果没有指定 y，则从顶部开始
            size: size !== null ? size : 12 + Math.random() * 8,
            vx: vx,
            vy: vy,
            gravity: 0.15,
            affectedObstacles: [...affectedObstacles],
            opacity: 0.6 + Math.random() * 0.4,
            maxSpeed: 8,
            hasBouncedBottom: hasBouncedBottom,
            color: dropColor  // 保存颜色信息
        };
    }

    // 获取碰撞点的法线
    getCollisionNormal(drop, obstacle, collisionPoint) {
        if (!obstacle) {
            // 底部碰撞，法线向上
            return { x: 0, y: -1, type: 'flat' };
        }

        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleBottom = obstacle.y + obstacle.height;
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;

        // 判断是否为圆形（宽高相等且圆角为半径）
        const isCircle = obstacle.width === obstacle.height &&
            obstacle.radius >= obstacle.width / 2;

        if (isCircle) {
            // 圆形碰撞，法线从圆心指向碰撞点
            const dx = collisionPoint.x - centerX;
            const dy = collisionPoint.y - centerY;
            const length = Math.sqrt(dx * dx + dy * dy);
            return {
                x: dx / length,
                y: dy / length,
                type: 'curved'
            };
        }

        // 判断碰撞位置
        const tolerance = 5;

        // 检查是否在圆角区域
        if (obstacle.radius > 0) {
            const corners = [
                { x: obstacle.x + obstacle.radius, y: obstacle.y + obstacle.radius },
                { x: obstacleRight - obstacle.radius, y: obstacle.y + obstacle.radius },
                { x: obstacle.x + obstacle.radius, y: obstacleBottom - obstacle.radius },
                { x: obstacleRight - obstacle.radius, y: obstacleBottom - obstacle.radius }
            ];

            for (let corner of corners) {
                const dx = collisionPoint.x - corner.x;
                const dy = collisionPoint.y - corner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= obstacle.radius + tolerance) {
                    // 在圆角区域，法线从圆角中心指向碰撞点
                    return {
                        x: dx / dist,
                        y: dy / dist,
                        type: 'curved'
                    };
                }
            }
        }

        // 平面碰撞
        if (Math.abs(collisionPoint.y - obstacle.y) < tolerance) {
            // 顶部碰撞
            return { x: 0, y: -1, type: 'flat' };
        } else if (Math.abs(collisionPoint.y - obstacleBottom) < tolerance) {
            // 底部碰撞
            return { x: 0, y: 1, type: 'flat' };
        } else if (Math.abs(collisionPoint.x - obstacle.x) < tolerance) {
            // 左侧碰撞
            return { x: -1, y: 0, type: 'flat' };
        } else if (Math.abs(collisionPoint.x - obstacleRight) < tolerance) {
            // 右侧碰撞
            return { x: 1, y: 0, type: 'flat' };
        }

        // 默认向上
        return { x: 0, y: -1, type: 'flat' };
    }

    checkCollisionDetailed(drop) {
        // 如果已经在底部弹跳过，就不再检测底部碰撞
        if (!drop.hasBouncedBottom && drop.y + drop.size >= this.canvas.height) {
            return {
                type: 'bottom',
                obstacle: null,
                point: { x: drop.x, y: this.canvas.height - drop.size }
            };
        }

        // 检查障碍物碰撞
        for (let obstacle of this.obstacles) {
            if (drop.affectedObstacles.includes(obstacle.id)) {
                continue;
            }

            const collision = this.getCollisionPoint(drop, obstacle);
            if (collision) {
                return {
                    type: 'obstacle',
                    obstacle: obstacle,
                    point: collision
                };
            }
        }

        return null;
    }

    getCollisionPoint(drop, obstacle) {
        const dropLeft = drop.x - drop.size;
        const dropRight = drop.x + drop.size;
        const dropTop = drop.y - drop.size;
        const dropBottom = drop.y + drop.size;

        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleBottom = obstacle.y + obstacle.height;

        // 边界框检查
        if (dropRight < obstacle.x || dropLeft > obstacleRight ||
            dropBottom < obstacle.y || dropTop > obstacleBottom) {
            return null;
        }

        // 更精确的碰撞点计算
        let collisionX = drop.x;
        let collisionY = drop.y;

        // 根据水滴位置调整碰撞点
        if (drop.x < obstacle.x) {
            collisionX = obstacle.x;
        } else if (drop.x > obstacleRight) {
            collisionX = obstacleRight;
        }

        if (drop.y < obstacle.y) {
            collisionY = obstacle.y;
        } else if (drop.y > obstacleBottom) {
            collisionY = obstacleBottom;
        }

        return { x: collisionX, y: collisionY };
    }

    handleCollision(drop, collision) {
        const normal = this.getCollisionNormal(drop, collision.obstacle, collision.point);
        const shouldSplit = drop.size > this.config.minDropSize;

        // 随机弹起力度
        const minBounce = 4;
        const maxBounce = 8;
        const bounceForce = minBounce + Math.random() * (maxBounce - minBounce);

        // 添加当前碰撞的障碍物到已影响列表
        const newAffectedObstacles = [...drop.affectedObstacles];
        if (collision.obstacle) {
            newAffectedObstacles.push(collision.obstacle.id);
        }

        // 如果是底部碰撞，标记已经弹跳过
        const isBottomCollision = collision.type === 'bottom';

        // 计算分裂位置（在碰撞点附近）
        const splitX = collision.point.x;
        const splitY = collision.point.y;

        if (normal.type === 'flat') {
            // 平面碰撞
            if (shouldSplit) {
                // 分裂成两个，45度角弹开
                const angle = Math.PI / 4; // 45度
                const newSize = drop.size * 0.7;

                // 根据法线方向确定弹射方向
                let leftVx, leftVy, rightVx, rightVy;
                let leftOffsetX = 0, leftOffsetY = 0;
                let rightOffsetX = 0, rightOffsetY = 0;

                if (Math.abs(normal.y) > Math.abs(normal.x)) {
                    // 水平面碰撞（顶部或底部）
                    // 向左上和右上45度弹起
                    leftVx = -Math.cos(angle) * bounceForce;
                    leftVy = -Math.abs(Math.sin(angle) * bounceForce); // 始终向上（负值）
                    rightVx = Math.cos(angle) * bounceForce;
                    rightVy = -Math.abs(Math.sin(angle) * bounceForce); // 始终向上（负值）

                    // 设置偏移，避免立即再次碰撞
                    leftOffsetX = -drop.size * 0.5;
                    rightOffsetX = drop.size * 0.5;
                    // 向上偏移，确保不会立即再次碰撞
                    if (normal.y < 0) {
                        // 顶部碰撞，向上移动
                        leftOffsetY = -drop.size * 2;
                        rightOffsetY = -drop.size * 2;
                    } else {
                        // 底部碰撞，向上移动
                        leftOffsetY = -drop.size * 2;
                        rightOffsetY = -drop.size * 2;
                    }
                } else {
                    // 垂直面碰撞（左侧或右侧）
                    // 向外上方45度弹起
                    const outwardDirection = Math.sign(normal.x); // 向外的方向
                    leftVx = outwardDirection * Math.cos(angle) * bounceForce;
                    leftVy = -Math.abs(Math.sin(angle) * bounceForce); // 向上弹
                    rightVx = outwardDirection * Math.cos(angle) * bounceForce;
                    rightVy = -Math.abs(Math.sin(angle) * bounceForce * 0.7); // 稍微不同的角度

                    // 设置偏移
                    leftOffsetX = normal.x * drop.size * 2;
                    rightOffsetX = normal.x * drop.size * 2;
                    leftOffsetY = -drop.size * 1;
                    rightOffsetY = -drop.size * 0.5;
                }

                // 创建分裂的水滴，保留原本的颜色
                return [
                    this.createDrop(
                        splitX + leftOffsetX,
                        splitY + leftOffsetY,
                        newSize,
                        leftVx,
                        leftVy,
                        newAffectedObstacles,
                        isBottomCollision,
                        drop.color  // 保留原本的颜色
                    ),
                    this.createDrop(
                        splitX + rightOffsetX,
                        splitY + rightOffsetY,
                        newSize,
                        rightVx,
                        rightVy,
                        newAffectedObstacles,
                        isBottomCollision,
                        drop.color  // 保留原本的颜色
                    )
                ];
            } else {
                // 不分裂，随机选择左右45度弹起
                const angle = Math.PI / 4;
                const direction = Math.random() > 0.5 ? 1 : -1;

                let newVx, newVy;
                if (Math.abs(normal.y) > Math.abs(normal.x)) {
                    // 水平面碰撞 - 向斜上方弹起
                    newVx = direction * Math.cos(angle) * bounceForce;
                    newVy = -Math.abs(Math.sin(angle) * bounceForce); // 始终向上
                } else {
                    // 垂直面碰撞 - 向外上方弹起
                    newVx = Math.sign(normal.x) * Math.cos(angle) * bounceForce; // 向外弹
                    newVy = -Math.abs(Math.sin(angle) * bounceForce); // 向上弹
                }

                // 稍微调整位置，避免卡在障碍物内
                drop.x += normal.x * (drop.size + 2);
                drop.y += normal.y * (drop.size + 2);

                // 更新现有水滴的速度和受影响列表
                drop.vx = newVx;
                drop.vy = newVy;
                drop.affectedObstacles = newAffectedObstacles;

                // 如果是底部碰撞，标记已弹跳
                if (isBottomCollision) {
                    drop.hasBouncedBottom = true;
                }

                return null; // 不创建新水滴
            }
        } else {
            // 曲面碰撞（圆形或圆角）
            // 计算反射向量
            const dotProduct = drop.vx * normal.x + drop.vy * normal.y;
            const reflectVx = drop.vx - 2 * dotProduct * normal.x;
            const reflectVy = drop.vy - 2 * dotProduct * normal.y;

            // 确保向上弹起
            const absReflectVy = Math.abs(reflectVy);
            const finalVy = -absReflectVy; // 始终为负值（向上）

            // 归一化反射向量并应用随机弹力
            const reflectLength = Math.sqrt(reflectVx * reflectVx + absReflectVy * absReflectVy);
            const normalizedVx = reflectLength > 0 ? reflectVx / reflectLength : 0;
            const normalizedVy = reflectLength > 0 ? -absReflectVy / reflectLength : -1; // 确保向上

            if (shouldSplit) {
                // 分裂，稍微偏离反射角度
                const newSize = drop.size * 0.7;
                const deviation = 0.3; // 偏离角度

                // 沿法线方向偏移，避免卡在障碍物内
                const offsetDistance = drop.size + 2;

                // 创建分裂的水滴，保留原本的颜色
                return [
                    this.createDrop(
                        splitX + normal.x * offsetDistance,
                        splitY + normal.y * offsetDistance,
                        newSize,
                        normalizedVx * bounceForce - normal.y * deviation * bounceForce,
                        normalizedVy * bounceForce + normal.x * deviation * bounceForce,
                        newAffectedObstacles,
                        isBottomCollision,
                        drop.color  // 保留原本的颜色
                    ),
                    this.createDrop(
                        splitX + normal.x * offsetDistance,
                        splitY + normal.y * offsetDistance,
                        newSize,
                        normalizedVx * bounceForce + normal.y * deviation * bounceForce,
                        normalizedVy * bounceForce - normal.x * deviation * bounceForce,
                        newAffectedObstacles,
                        isBottomCollision,
                        drop.color  // 保留原本的颜色
                    )
                ];
            } else {
                // 不分裂，按反射角度弹起
                // 稍微调整位置，避免卡在障碍物内
                drop.x += normal.x * (drop.size + 2);
                drop.y += normal.y * (drop.size + 2);

                drop.vx = normalizedVx * bounceForce;
                drop.vy = normalizedVy * bounceForce;
                drop.affectedObstacles = newAffectedObstacles;

                // 如果是底部碰撞，标记已弹跳
                if (isBottomCollision) {
                    drop.hasBouncedBottom = true;
                }

                return null;
            }
        }
    }

    updateDrops() {
        if (!this.animationEnabled) return;

        const newDrops = [];

        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];

            // 更新速度和位置
            drop.vy += drop.gravity;

            // 限制最大下落速度
            if (drop.vy > drop.maxSpeed) {
                drop.vy = drop.maxSpeed;
            }

            drop.x += drop.vx;
            drop.y += drop.vy;

            // 横向速度衰减
            drop.vx *= 0.98;

            // 检查碰撞
            const collision = this.checkCollisionDetailed(drop);

            if (collision) {
                const splitDrops = this.handleCollision(drop, collision);
                if (splitDrops) {
                    // 水滴分裂了，移除原水滴，添加新水滴
                    newDrops.push(...splitDrops);
                    this.drops.splice(i, 1);
                }
                // 如果没有分裂，水滴已经被更新，继续运动
            } else if (drop.y - drop.size > this.canvas.height + 50) {
                // 掉出画布底部一定距离后移除
                this.drops.splice(i, 1);
            }
        }

        // 添加分裂产生的新水滴
        this.drops.push(...newDrops);
    }

    drawDrop(drop) {
        this.ctx.save();

        // 使用水滴的颜色绘制
        this.ctx.globalAlpha = drop.opacity;
        this.ctx.fillStyle = drop.color.main + drop.opacity + ')';
        this.ctx.shadowColor = drop.color.shadow;
        this.ctx.shadowBlur = drop.size * 0.5;

        this.ctx.beginPath();
        this.ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
        this.ctx.fill();

        // 添加高光效果
        const gradient = this.ctx.createRadialGradient(
            drop.x - drop.size * 0.3,
            drop.y - drop.size * 0.3,
            0,
            drop.x,
            drop.y,
            drop.size
        );
        gradient.addColorStop(0, drop.color.highlight);
        gradient.addColorStop(1, drop.color.main + '0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(drop.x, drop.y, drop.size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    animate(currentTime = 0) {
        if (!this.animationPaused && this.animationEnabled) {
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 生成新水滴（使用配置的默认颜色）
            if (currentTime - this.lastDropTime > this.config.dropInterval) {
                this.drops.push(this.createDrop());
                this.lastDropTime = currentTime;
            }

            // 更新和绘制水滴
            this.updateDrops();
            this.drops.forEach(drop => this.drawDrop(drop));
        }

        requestAnimationFrame((time) => this.animate(time));
    }

    // 公共方法：动态更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // 应用新的背景颜色
        if (newConfig.backgroundColor !== undefined) {
            this.applyBackgroundColor();
        }
        
        // 如果断点改变，重新检查
        if (newConfig.breakpoint !== undefined) {
            this.checkBreakpoint();
        }
        
        // 如果启用状态改变
        if (newConfig.enabled !== undefined) {
            this.animationEnabled = newConfig.enabled;
            if (!this.animationEnabled) {
                this.drops = [];
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    // 公共方法：暂停动画
    pause() {
        this.animationPaused = true;
    }

    // 公共方法：恢复动画
    resume() {
        this.animationPaused = false;
    }

    // 公共方法：清空所有水滴
    clear() {
        this.drops = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 公共方法：销毁实例
    destroy() {
        this.animationEnabled = false;
        this.clear();
        // 移除事件监听器的逻辑可以在这里添加
    }
}