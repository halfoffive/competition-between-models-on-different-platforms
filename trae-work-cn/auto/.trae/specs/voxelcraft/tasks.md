# VoxelCraft - 实施计划（任务分解与优先级）

## [x] Task 1: 项目初始化与基础架构搭建
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 使用 Vite 初始化 Vue 3 项目
  - 安装 Three.js、simplex-noise 等核心依赖
  - 配置项目结构（src 目录组织：components、game、utils、assets）
  - 配置 vite.config.js，确保 Three.js 等正确打包
  - 创建基础 App.vue 组件和样式重置
- **Acceptance Criteria Addressed**: [AC-10, AC-11]
- **Test Requirements**:
  - `programmatic` TR-1.1: 执行 `npm install` 成功，无依赖错误
  - `programmatic` TR-1.2: 执行 `npm run build` 构建成功
  - `programmatic` TR-1.3: 执行 `npm run dev` 开发服务器启动成功
  - `human-judgement` TR-1.4: 项目目录结构清晰，模块化合理
- **Notes**: 使用最新稳定版 Vite 5 和 Vue 3

## [x] Task 2-6: 核心游戏功能增强（方块系统+地形+渲染+玩家控制+方块交互）
- **Priority**: high
- **Depends On**: [Task 1]
- **Description**:
  - 定义方块类型枚举（草、泥土、石头、木头、树叶、沙子、水、玻璃、工作台等 10+ 种）
  - 实现 World 类管理方块数据（3D 数组或 Map 存储）
  - 实现方块增删改查方法（getBlock、setBlock、removeBlock）
  - 实现方块可见面计算（隐藏面剔除）
  - 实现程序化像素纹理生成（Canvas 动态生成方块贴图）
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-2.1: World 类可以正确存储和读取方块数据
  - `programmatic` TR-2.2: setBlock 和 removeBlock 方法正确更新世界状态
  - `programmatic` TR-2.3: 可见面计算正确（被包围的方块不渲染面）
  - `human-judgement` TR-2.4: 方块纹理风格统一，像素风格清晰可辨
- **Notes**: 纹理使用 Canvas 程序化生成，不依赖外部图片资源

## [ ] Task 3: 地形生成系统
- **Priority**: high
- **Depends On**: [Task 2]
- **Description**:
  - 集成 simplex-noise 实现 2D 高度噪声
  - 实现多层地形生成（顶层草、中间泥土、底层石头）
  - 实现水域生成（低于某高度的区域填充水）
  - 实现树木生成（随机位置生成树干和树叶）
  - 实现沙地生物群系（根据噪声参数变化地表材质）
  - 世界大小可配置（默认 64x64 水平范围，32 高度）
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-3.1: 地形生成函数返回有效的方块数据结构
  - `human-judgement` TR-3.2: 地形看起来自然，有起伏、水域、树木
  - `programmatic` TR-3.3: 世界生成时间在可接受范围内（< 5 秒）
  - `human-judgement` TR-3.4: 地形各层结构合理（草-泥土-石头）
- **Notes**: 可调噪声参数（频率、振幅、八度）以获得最佳效果

## [ ] Task 4: Three.js 渲染引擎
- **Priority**: high
- **Depends On**: [Task 3]
- **Description**:
  - 初始化 Three.js 场景、相机、渲染器
  - 实现基于 InstancedMesh 的方块渲染（按材质分组）
  - 实现光照系统（环境光 + 方向光）
  - 实现天空盒/背景色
  - 实现网格合并或分块渲染优化
  - 实现方块高亮边框（Raycaster 选中指示）
- **Acceptance Criteria Addressed**: [AC-1, AC-3, AC-4]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 3D 世界渲染正确，方块清晰可见
  - `programmatic` TR-4.2: 渲染循环正常运行，帧率可测
  - `human-judgement` TR-4.3: 光照效果自然，方块有立体感
  - `human-judgement` TR-4.4: 选中的方块有明显的高亮边框
- **Notes**: 使用 InstancedMesh 而非逐个 Mesh 以优化性能

## [ ] Task 5: 第一人称控制器
- **Priority**: high
- **Depends On**: [Task 4]
- **Description**:
  - 实现 Pointer Lock 指针锁定控制视角
  - 实现相机俯仰角限制（不能完全翻转）
  - 实现 WASD 移动（相对相机方向）
  - 实现重力系统（玩家持续下落）
  - 实现 AABB 碰撞检测（与方块碰撞）
  - 实现跳跃（空格）
  - 实现加速（Shift 冲刺）
  - 实现飞行模式切换（双击空格）
- **Acceptance Criteria Addressed**: [AC-2, AC-6, AC-7]
- **Test Requirements**:
  - `human-judgement` TR-5.1: WASD 移动流畅，方向正确
  - `human-judgement` TR-5.2: 鼠标视角控制自然，无漂移
  - `human-judgement` TR-5.3: 重力和碰撞正常，不会穿墙或卡墙
  - `human-judgement` TR-5.4: 跳跃手感良好，飞行模式切换正常
  - `programmatic` TR-5.5: 碰撞检测函数能正确判断方块碰撞
- **Notes**: 玩家碰撞盒尺寸约 0.6x1.8x0.6（宽高深）

## [ ] Task 6: 方块交互系统
- **Priority**: high
- **Depends On**: [Task 5]
- **Description**:
  - 实现 Raycaster 射线检测（从相机向前投射）
  - 实现左键破坏方块
  - 实现右键放置方块
  - 实现交互距离限制（默认 6 格）
  - 实现方块高亮（准星指向的方块）
  - 放置方块时检查玩家位置（不能放在自己身上）
- **Acceptance Criteria Addressed**: [AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-6.1: 左键点击可删除射线命中的方块
  - `programmatic` TR-6.2: 右键点击可在命中面放置新方块
  - `programmatic` TR-6.3: 超出交互距离时无法交互
  - `human-judgement` TR-6.4: 方块高亮清晰指示当前选中目标
- **Notes**: 放置位置 = 被击中方块位置 + 法线方向

## [x] Task 7: 物品栏 / HUD UI 组件
- **Priority**: high
- **Depends On**: [Task 6]
- **Description**:
  - 创建 Hotbar 快捷栏组件（9 格）
  - 实现数字键 1-9 切换选中格
  - 实现鼠标滚轮切换选中格
  - 实现准星组件（屏幕中心十字）
  - 实现 DebugInfo 调试面板（FPS、坐标、方块数、选中方块）
  - UI 采用像素风格设计
  - 当前选中物品高亮显示
- **Acceptance Criteria Addressed**: [AC-5, AC-9]
- **Test Requirements**:
  - `programmatic` TR-7.1: 按数字键 1-9 可切换选中物品（状态更新正确）
  - `programmatic` TR-7.2: 鼠标滚轮可循环切换物品
  - `human-judgement` TR-7.3: UI 风格统一，像素风格明显
  - `human-judgement` TR-7.4: 准星居中，不影响游戏视野
  - `human-judgement` TR-7.5: 调试信息清晰可读，可开关显示
- **Notes**: UI 使用 Vue 组件实现，覆盖在 Canvas 上层

## [x] Task 8: 昼夜循环系统
- **Priority**: medium
- **Depends On**: [Task 4]
- **Description**:
  - 实现游戏时间系统（dayTime 变量，0-1 循环）
  - 实现太阳/月亮位置随时间变化（方向光位置）
  - 实现天空颜色随时间渐变（日出、白天、日落、夜晚）
  - 实现环境光强度随时间变化
  - 调试面板中添加时间调节控件
- **Acceptance Criteria Addressed**: [AC-8]
- **Test Requirements**:
  - `human-judgement` TR-8.1: 昼夜过渡自然，颜色变化平滑
  - `programmatic` TR-8.2: 时间循环正常，一天周期可配置
  - `human-judgement` TR-8.3: 光照变化与天空颜色协调
  - `human-judgement` TR-8.4: 可通过调试面板调节时间
- **Notes**: 建议一天时长约 10 分钟（可配置）

## [x] Task 9: 开始界面与暂停菜单
- **Priority**: medium
- **Depends On**: [Task 7]
- **Description**:
  - 实现开始界面（标题、开始按钮、操作说明）
  - 实现暂停菜单（ESC 键呼出，继续、重新生成、退出）
  - 实现世界重新生成功能
  - 实现操作说明展示
- **Acceptance Criteria Addressed**: [AC-9]
- **Test Requirements**:
  - `human-judgement` TR-9.1: 开始界面美观，操作说明清晰
  - `programmatic` TR-9.2: ESC 键可呼出/关闭暂停菜单
  - `programmatic` TR-9.3: 重新生成按钮可重新生成世界
  - `human-judgement` TR-9.4: 暂停时游戏逻辑停止
- **Notes**: 暂停时指针锁定解除

## [x] Task 10: 性能优化与细节完善
- **Priority**: medium
- **Depends On**: [Task 8, Task 9]
- **Description**:
  - 实现视锥体剔除（不渲染视野外的方块）
  - 实现分块更新（只更新变化的区域）
  - 添加雾化效果（增加远近层次感）
  - 添加水的半透明/动画效果
  - 响应式适配不同屏幕尺寸
  - 减少不必要的渲染更新
- **Acceptance Criteria Addressed**: [AC-1, NFR-1]
- **Test Requirements**:
  - `programmatic` TR-10.1: 平均帧率稳定在 50fps 以上（64x64 世界）
  - `human-judgement` TR-10.2: 雾化效果自然，远景过渡平滑
  - `human-judgement` TR-10.3: 水面有动画感，半透明效果正确
  - `programmatic` TR-10.4: 窗口大小变化时画布自适应
- **Notes**: 性能优化是持续过程，先保证基础功能

## [x] Task 11: 构建验证与最终测试
- **Priority**: high
- **Depends On**: [Task 10]
- **Description**:
  - 完整测试所有功能
  - 验证生产构建无错误
  - 验证开发服务器正常运行
  - 代码整理与最终检查
- **Acceptance Criteria Addressed**: [AC-10, AC-11, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9]
- **Test Requirements**:
  - `programmatic` TR-11.1: `npm run build` 构建成功无错误
  - `programmatic` TR-11.2: `npm run dev` 服务正常启动
  - `human-judgement` TR-11.3: 所有核心功能正常工作
  - `human-judgement` TR-11.4: 整体体验流畅，无明显 bug
- **Notes**: 最终验收测试
