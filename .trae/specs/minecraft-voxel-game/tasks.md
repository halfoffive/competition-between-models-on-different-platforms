# Minecraft 风格体素沙盒游戏 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 项目初始化与基础配置
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 创建 `/workspace/trae-work-cn/doubao-seed-2-1-pro` 目录
  - 使用 Vite 初始化 Vue 3 项目（最新稳定版）
  - 安装 Three.js、simplex-noise 等必要依赖
  - 配置项目基础结构（src 目录、组件目录、游戏逻辑目录）
  - 清理默认模板文件
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-1.1: `npm install` 成功执行，无依赖冲突
  - `programmatic` TR-1.2: `npm run dev` 启动开发服务器，可访问
  - `programmatic` TR-1.3: `npm run build` 成功构建生产版本
  - `human-judgement` TR-1.4: 项目结构清晰，模块化合理
- **Notes**: 使用 Vue 3 Composition API + `<script setup>` 语法

## [x] Task 2: 方块类型系统与常量定义
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 创建方块类型枚举/常量（至少12种方块）
  - 为每种方块定义颜色、硬度、是否透明等属性
  - 定义世界尺寸常量（128×64×128）
  - 定义方块纹理/材质生成函数（程序生成简单纹理）
- **Acceptance Criteria Addressed**: [FR-5]
- **Test Requirements**:
  - `programmatic` TR-2.1: 方块类型数量 ≥ 12
  - `programmatic` TR-2.2: 每种方块都有唯一ID和颜色定义
  - `human-judgement` TR-2.3: 方块颜色区分度好，视觉上可识别
- **Notes**: 方块ID从0开始，0表示空气（无方块）

## [ ] Task 3: 世界数据结构与地形生成
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 创建世界数据存储（3D数组或TypedArray）
  - 使用 Simplex Noise 生成高度图
  - 实现地形分层：草层、泥土层、石头层、基岩层
  - 实现树木生成算法（随机放置树干+树叶）
  - 简单的沙滩和水域生成
- **Acceptance Criteria Addressed**: [FR-6, AC-2]
- **Test Requirements**:
  - `programmatic` TR-3.1: 世界数据结构正确初始化，尺寸为128×64×128
  - `human-judgement` TR-3.2: 地形有自然起伏，不是平坦平面
  - `human-judgement` TR-3.3: 世界中分布有树木（树干+树叶结构）
  - `human-judgement` TR-3.4: 低海拔区域有水/沙滩
- **Notes**: 使用世界种子以便可复现

## [ ] Task 4: Three.js 场景初始化与基础渲染
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - 创建 Three.js 场景、相机（PerspectiveCamera）、渲染器
  - 设置天空颜色/天空盒背景
  - 添加环境光和方向光（模拟太阳）
  - 创建 Vue 组件挂载 Three.js 画布
  - 实现响应式窗口大小调整
- **Acceptance Criteria Addressed**: [FR-1, AC-1]
- **Test Requirements**:
  - `programmatic` TR-4.1: Three.js 场景正确初始化，WebGL 上下文创建成功
  - `programmatic` TR-4.2: 渲染循环正常运行
  - `human-judgement` TR-4.3: 画布占满视口，天空颜色可见
- **Notes**: 相机初始位置设置在世界上方合适位置

## [ ] Task 5: 体素网格构建（面剔除优化）
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - 实现方块可见面判断（只渲染相邻是空气的面）
  - 构建合并的几何体（将所有可见面合并到少量BufferGeometry）
  - 为每个方块面设置正确的材质颜色
  - 创建 Mesh 并添加到场景
  - 实现世界修改后的网格重建机制
- **Acceptance Criteria Addressed**: [FR-1, AC-2]
- **Test Requirements**:
  - `programmatic` TR-5.1: 几何体顶点/面数据正确生成
  - `human-judgement` TR-5.2: 3D世界正确渲染，可以看到地形和树木
  - `human-judgement` TR-5.3: 隐藏面被剔除（内部方块面不可见）
  - `programmatic` TR-5.4: 网格重建后场景正确更新
- **Notes**: 这是性能关键部分，需要高效实现

## [ ] Task 6: 第一人称相机控制与Pointer Lock
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - 实现 Pointer Lock API 集成（点击画面锁定鼠标）
  - 鼠标移动控制相机俯仰（pitch）和偏航（yaw）
  - WASD 键监听与移动方向计算
  - 实现移动速度参数
  - 添加键盘状态管理
- **Acceptance Criteria Addressed**: [FR-2, AC-3]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 点击画面后鼠标被锁定，隐藏光标
  - `human-judgement` TR-6.2: 鼠标移动控制视角，平滑旋转
  - `human-judgement` TR-6.3: WASD键分别向对应方向移动
  - `human-judgement` TR-6.4: 视角不能完全翻转（俯仰角限制）
- **Notes**: 使用欧拉角管理旋转，注意万向锁问题

## [ ] Task 7: 物理系统（重力、碰撞、跳跃）
- **Priority**: high
- **Depends On**: Task 6
- **Description**:
  - 实现玩家 AABB（轴对齐包围盒）碰撞检测
  - 重力加速度应用（每帧向下加速）
  - 地面检测：判断玩家是否站在方块上
  - 空格键跳跃（施加向上速度）
  - 碰撞响应：阻止玩家穿过方块
  - 防止玩家掉出世界底部
- **Acceptance Criteria Addressed**: [FR-2, AC-4]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 玩家在空中会下落，落到地面停止
  - `human-judgement` TR-7.2: 按空格可以跳跃，跳跃高度合理
  - `human-judgement` TR-7.3: 玩家无法穿过墙壁、地面、天花板
  - `human-judgement` TR-7.4: 玩家可以走上台阶/1格高度差
- **Notes**: 玩家尺寸：宽0.6，高1.8，眼高1.62

## [ ] Task 8: 射线投射与方块选择
- **Priority**: high
- **Depends On**: Task 7
- **Description**:
  - 实现射线投射（Raycaster）检测玩家看向的方块
  - 沿视线方向步进（DDA算法或类似）
  - 高亮/选中的方块显示线框轮廓
  - 确定目标方块和相邻面（放置位置）
- **Acceptance Criteria Addressed**: [FR-3, AC-8]
- **Test Requirements**:
  - `human-judgement` TR-8.1: 准星指向方块时显示高亮轮廓
  - `human-judgement` TR-8.2: 高亮准确跟随视线切换目标
  - `programmatic` TR-8.3: 射线检测距离限制在合理范围（如6格）
- **Notes**: 使用Three.js的Raycaster或自定义DDA遍历

## [ ] Task 9: 方块放置与破坏机制
- **Priority**: high
- **Depends On**: Task 8
- **Description**:
  - 鼠标左键破坏选中的方块（从世界数据中移除）
  - 鼠标右键在选中面的相邻位置放置方块
  - 放置时检查是否与玩家位置冲突
  - 操作后触发网格重建
  - 基岩不可破坏
- **Acceptance Criteria Addressed**: [FR-3, AC-5, AC-6]
- **Test Requirements**:
  - `human-judgement` TR-9.1: 左键点击，目标方块消失
  - `human-judgement` TR-9.2: 右键点击，在正确位置放置新方块
  - `human-judgement` TR-9.3: 不能在玩家身体位置放置方块
  - `human-judgement` TR-9.4: 基岩无法被破坏
- **Notes**: 放置/破坏需要即时反馈

## [ ] Task 10: 热键栏（物品栏）UI
- **Priority**: medium
- **Depends On**: Task 9
- **Description**:
  - 创建屏幕底部热键栏组件（9个槽位）
  - 显示每个槽位的方块预览（颜色方块）
  - 数字键1-9切换选中槽位
  - 鼠标滚轮切换选中槽位
  - 高亮显示当前选中的槽位
- **Acceptance Criteria Addressed**: [FR-4, AC-7]
- **Test Requirements**:
  - `human-judgement` TR-10.1: 热键栏在屏幕底部居中显示，9个槽位
  - `human-judgement` TR-10.2: 按数字键1-9切换选中，有视觉高亮
  - `human-judgement` TR-10.3: 鼠标滚轮上下滚动切换选中项
  - `human-judgement` TR-10.4: 放置方块时使用当前选中类型
- **Notes**: 使用Vue组件实现UI层，与Three.js画布叠加

## [ ] Task 11: 游戏HUD（准星、FPS、坐标）
- **Priority**: medium
- **Depends On**: Task 10
- **Description**:
  - 屏幕中心十字准星
  - FPS计数器显示（右上角）
  - 玩家坐标显示（可选）
  - 当前方块名称提示（可选）
- **Acceptance Criteria Addressed**: [FR-7]
- **Test Requirements**:
  - `human-judgement` TR-11.1: 屏幕中心有清晰的十字准星
  - `human-judgement` TR-11.2: FPS显示实时更新
- **Notes**: HUD使用HTML/CSS实现，不使用Three.js渲染

## [ ] Task 12: 开始界面与菜单系统
- **Priority**: medium
- **Depends On**: Task 11
- **Description**:
  - 开始界面：游戏标题、"开始游戏"按钮、操作说明
  - 暂停菜单（ESC键触发）：继续游戏、重新生成世界
  - 菜单界面时解除鼠标锁定
  - 游戏状态管理（菜单/游戏中/暂停）
- **Acceptance Criteria Addressed**: [FR-7, FR-8, AC-9]
- **Test Requirements**:
  - `human-judgement` TR-12.1: 页面加载时显示开始界面
  - `human-judgement` TR-12.2: 点击"开始游戏"进入游戏，锁定鼠标
  - `human-judgement` TR-12.3: 按ESC显示暂停菜单，鼠标解锁
  - `human-judgement` TR-12.4: 从菜单可重新开始游戏
- **Notes**: 使用Vue状态管理游戏状态

## [ ] Task 13: 创造模式飞行功能
- **Priority**: low
- **Depends On**: Task 12
- **Description**:
  - 双击空格切换飞行模式
  - 飞行模式下无重力
  - 空格上升，Shift下降
  - WASD水平移动
- **Acceptance Criteria Addressed**: [FR-8]
- **Test Requirements**:
  - `human-judgement` TR-13.1: 双击空格切换飞行状态
  - `human-judgement` TR-13.2: 飞行时空格上升，Shift下降
  - `human-judgement` TR-13.3: 飞行时不受重力影响
- **Notes**: 这是增强功能，核心玩法完成后添加

## [ ] Task 14: 性能优化与最终调试
- **Priority**: high
- **Depends On**: Task 12
- **Description**:
  - 优化网格重建性能（只重建修改的区块）
  - 检查内存泄漏
  - 帧率优化，确保流畅
  - 修复碰撞检测中的边界问题
  - 响应式布局调整
  - 最终体验打磨
- **Acceptance Criteria Addressed**: [AC-10, NFR-1, NFR-3]
- **Test Requirements**:
  - `human-judgement` TR-14.1: 游戏运行流畅，FPS ≥ 40
  - `human-judgement` TR-14.2: 窗口大小变化时画面正确适应
  - `human-judgement` TR-14.3: 长时间运行无明显性能下降
  - `programmatic` TR-14.4: `npm run build` 无错误
- **Notes**: 这是交付前的重要质量保证步骤
