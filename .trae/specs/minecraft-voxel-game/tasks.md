# Tasks

## 阶段 1：项目骨架

- [x] Task 1: 初始化 vite + vue 3 项目
  - [x] 在 `trae-work-cn/glm-5-2` 下用 `npm create vite@latest . -- --template vue` 初始化项目
  - [x] 安装依赖：three、simplex-noise、pinia
  - [x] 配置 `vite.config.js`（路径别名 `@` 指向 `src`）
  - [x] 验证：`npm run dev` 可启动，`npm run build` 可构建

- [x] Task 2: 搭建整体架构与入口
  - [x] 创建 `src/game/` 目录存放 Three.js 引擎代码，`src/components/` 存放 Vue UI 组件，`src/stores/` 存放 Pinia 状态
  - [x] 实现 `src/game/Game.js` 引擎主类：管理 scene、camera、renderer、游戏循环
  - [x] 实现 `src/App.vue` 根组件：挂载全屏 canvas 容器与 UI 覆盖层
  - [x] 实现 `src/stores/game.js` Pinia store：游戏状态（running、paused、playerPos、selectedSlot、timeOfDay 等）
  - [x] 验证：浏览器显示全屏 Three.js 画布，控制台无错误

## 阶段 2：体素世界核心

- [x] Task 3: 定义方块类型与纹理图集
  - [x] 创建 `src/game/blocks.js`：定义方块 ID（AIR=0, GRASS, DIRT, STONE, SAND, LOG, LEAVES, WATER, COAL_ORE, IRON_ORE, PLANKS, COBBLESTONE, GLASS 等）及属性（名称、是否实体、是否透明、硬度、纹理坐标）
  - [x] 创建 `src/game/textures.js`：用 Canvas 程序化生成方块纹理（每块 16×16 像素风格），打包成纹理图集
  - [x] 验证：可导入方块定义并按 ID 查询属性，纹理图集成功生成

- [x] Task 4: 实现区块数据结构与网格生成
  - [x] 创建 `src/game/Chunk.js`：16×16×128 区块，用 `Uint8Array` 存储方块 ID
  - [x] 实现面剔除网格生成：遍历方块，仅对暴露面（邻居为 AIR 或透明方块）生成顶点/UV/法线
  - [x] 合并为单个 `BufferGeometry`，使用纹理图集材质
  - [x] 验证：手动填充测试方块后能渲染出可见面，被遮挡面不渲染

- [x] Task 5: 实现世界管理与区块动态加载
  - [x] 创建 `src/game/World.js`：管理区块 Map（key 为 `cx,cz`）、生成、加载、卸载
  - [x] 实现玩家周围渲染距离（默认 6 区块半径）的区块加载/卸载
  - [x] 实现区块网格重建队列，避免单帧卡顿
  - [x] 验证：玩家移动时新区块加载、旧区块卸载，FPS 稳定

## 阶段 3：地形生成

- [x] Task 6: 实现程序化地形生成
  - [x] 创建 `src/game/Terrain.js`：基于 simplex-noise 生成高度图、生物群系图、湿度图
  - [x] 实现至少 3 种生物群系：草原（草+偶有树）、森林（密集树木）、沙漠（沙+仙人掌）
  - [x] 实现地表/地下分层（草→土→石）、矿石分布（按 Y 深度概率）、水体（低于海平面填充水）
  - [x] 实现树木生成（树干原木+树叶球）
  - [x] 验证：固定种子生成一致的地形，可见不同生物群系特征

## 阶段 4：玩家与交互

- [x] Task 7: 实现第一人称控制器
  - [x] 创建 `src/game/PlayerController.js`：Pointer Lock 鼠标视角（pitch/yaw）、WASD 移动、Shift 冲刺、空格跳跃、双击空格飞行切换
  - [x] 实现 AABB 碰撞检测：玩家视为 0.6×1.8×0.6 盒子，与实体方块做轴向碰撞解析
  - [x] 实现重力与跳跃速度计算
  - [x] 验证：玩家可走动、跳跃、不能穿墙、掉落有重力

- [x] Task 8: 实现方块交互（拾取/破坏/放置）
  - [x] 实现射线投射（DDA 体素遍历，最大距离 5）定位目标方块与邻接面
  - [x] 左键破坏方块（设为 AIR），右键在邻接位置放置当前选中方块
  - [x] 对目标方块绘制线框高亮（`LineSegments` 包围盒）
  - [x] 修改方块后触发所在区块（及邻居）网格重建
  - [x] 验证：能准确破坏与放置方块，网格即时更新

## 阶段 5：UI 界面

- [x] Task 9: 实现 HUD（准星、快捷栏、调试信息）
  - [x] 创建 `src/components/Hud.vue`：中心准星、底部 9 格快捷栏（方块图标 + 选中高亮）、左上调试信息（FPS、XYZ、朝向、生物群系）
  - [x] 数字键 1-9 与滚轮切换快捷栏选中槽
  - [x] 从 store 读取/更新选中槽与调试数据
  - [x] 验证：HUD 正确显示，按键切换响应

- [x] Task 10: 实现主菜单与暂停菜单
  - [x] 创建 `src/components/MainMenu.vue`：开始新游戏（含种子输入框）、继续游戏（若有存档）、设置（渲染距离滑块）
  - [x] 创建 `src/components/PauseMenu.vue`：继续、保存、设置、退出到主菜单
  - [x] ESC 键触发暂停：释放指针锁定、显示暂停菜单、暂停游戏循环
  - [x] 验证：菜单流程完整，ESC 暂停/恢复正确

- [x] Task 11: 实现物品栏与合成界面
  - [x] 创建 `src/components/Inventory.vue`：背包网格 + 合成区（3×3）+ 输出槽
  - [x] 创建 `src/game/recipes.js`：定义若干配方（原木→4 木板、4 木板→4 木棍、8 圆石→熔炉、4 木板→工作台等）
  - [x] 按 E 键打开/关闭物品栏，打开时释放指针锁定
  - [x] 实现拖拽放置与合成结果取出
  - [x] 验证：合成配方可正确识别并产出

## 阶段 6：游戏玩法

- [x] Task 12: 实现昼夜循环
  - [x] 创建 `src/game/SkyCycle.js`：可配置周期（默认 10 分钟/天），更新太阳/月亮位置、天空渐变色、环境光强度、方向光
  - [x] 夜晚降低光照并切换天空色，白天恢复
  - [x] 从 store 同步 `timeOfDay` 供 UI 显示
  - [x] 验证：天空与光照随时间平滑变化

- [x] Task 13: 实现存档与读档
  - [x] 创建 `src/game/Storage.js`：将修改过的区块（脏区块）压缩写入 localStorage、玩家位置、时间、背包
  - [x] 主菜单"继续游戏"读取存档恢复世界
  - [x] 暂停菜单"保存"触发写入
  - [x] 验证：保存后刷新页面/重开可恢复世界与玩家状态

## 阶段 7：优化与收尾

- [x] Task 14: 性能优化与体验打磨
  - [x] 启用 Three.js 视锥剔除与 `frustumCulled` 标记
  - [x] 区块网格重建分帧执行，避免卡顿
  - [x] 添加雾效隐藏远处区块加载边界
  - [x] 调整渲染距离默认值平衡性能与视野
  - [x] 验证：中等配置下维持 40+ FPS，无明显卡顿

- [x] Task 15: 整合测试与文档
  - [x] 完整走查：新建世界→探索→破坏放置→合成→保存→继续游戏全流程
  - [x] 修复整合阶段发现的 bug
  - [x] 在 `trae-work-cn/glm-5-2/README.md` 写明运行方式（npm install / npm run dev）
  - [x] 验证：`npm run build` 成功，构建产物可正常预览

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3、Task 4 可并行，均依赖 Task 2
- Task 5 依赖 Task 4
- Task 6 依赖 Task 3、Task 4
- Task 7 依赖 Task 5
- Task 8 依赖 Task 7
- Task 9 依赖 Task 2、Task 3
- Task 10 依赖 Task 2
- Task 11 依赖 Task 2、Task 3
- Task 12 依赖 Task 2
- Task 13 依赖 Task 5、Task 7
- Task 14 依赖 Task 5、Task 8、Task 12
- Task 15 依赖所有前置任务
## 阶段 1: 项目初始化与基础设施

- [x] Task 1: 初始化 Vite + Vue 3 项目
  - [x] 1.1 使用 Vite 创建 Vue 3 项目
  - [x] 1.2 安装 Three.js 依赖
  - [x] 1.3 配置项目结构（src/game, src/components, src/assets）
  - [x] 验证: `npm run dev` 启动成功，显示默认 Vue 页面

- [x] Task 2: 搭建 Three.js 渲染引擎基础
  - [x] 2.1 创建 GameEngine 类，封装 Three.js Scene、Camera、Renderer
  - [x] 2.2 实现渲染循环（requestAnimationFrame）
  - [x] 2.3 集成到 Vue 应用（App.vue 挂载 Canvas）
  - [x] 验证: 浏览器显示黑色 Canvas，控制台无错误

## 阶段 2: 核心游戏系统

- [x] Task 3: 实现区块与方块数据结构
  - [x] 3.1 定义 Block 类型枚举（grass, dirt, stone, wood, leaves, sand, water, coal_ore, iron_ore, diamond_ore, bedrock, planks, cobblestone, glass）
  - [x] 3.2 实现 Chunk 类（16x256x16），存储方块数据
  - [x] 3.3 实现 World 类，管理多个 Chunk
  - [x] 验证: 可以创建 World 并添加/查询方块

- [x] Task 4: 实现程序化地形生成
  - [x] 4.1 集成 Simplex Noise 库
  - [x] 4.2 实现地形高度图生成（基于噪声）
  - [x] 4.3 实现方块分布逻辑（表层草方块、下层泥土、深层石头）
  - [x] 4.4 实现简单洞穴系统（3D 噪声）
  - [x] 验证: 生成地形并渲染，显示起伏的地形

- [x] Task 5: 实现区块网格生成与渲染
  - [x] 5.1 实现贪心网格合并算法或 InstancedMesh
  - [x] 5.2 为每个面生成 UV 坐标
  - [x] 5.3 创建纹理图集（程序化生成或加载）
  - [x] 5.4 实现区块网格构建与添加到场景
  - [x] 验证: 渲染出带有纹理的 3D 地形

- [x] Task 6: 实现第一人称控制器
  - [x] 6.1 实现 PointerLockControls 鼠标视角控制
  - [x] 6.2 实现 WASD 键盘移动
  - [x] 6.3 实现空格跳跃
  - [x] 6.4 实现 Shift 疾跑
  - [x] 验证: 可以用鼠标环顾，WASD 移动，空格跳跃

- [x] Task 7: 实现物理系统（重力与碰撞）
  - [x] 7.1 实现玩家 AABB 包围盒
  - [x] 7.2 实现重力加速度
  - [x] 7.3 实现方块碰撞检测（X/Y/Z 轴分离）
  - [x] 验证: 玩家受重力下落，落地停止，无法穿墙

## 阶段 3: 方块交互与 UI

- [x] Task 8: 实现方块射线检测
  - [x] 8.1 从摄像机发射射线
  - [x] 8.2 检测射线与方块相交
  - [x] 8.3 返回相交方块坐标与法向量
  - [x] 验证: 准星指向方块时能正确识别

- [x] Task 9: 实现方块破坏与放置
  - [x] 9.1 左键点击破坏方块（从世界数据移除）
  - [x] 9.2 右键点击放置方块（在目标面相邻位置添加）
  - [x] 9.3 实现方块破坏粒子效果
  - [x] 验证: 可以破坏和放置方块，世界数据更新

- [x] Task 10: 实现物品栏 / 快捷栏 UI
  - [x] 10.1 创建 Vue 组件 Hotbar.vue
  - [x] 10.2 显示 9 个物品槽
  - [x] 10.3 实现 1-9 键切换选中槽
  - [x] 10.4 实现鼠标滚轮切换
  - [x] 10.5 高亮显示当前选中槽
  - [x] 验证: 可以切换物品栏，UI 响应正确

- [x] Task 11: 实现游戏 UI 覆盖层
  - [x] 11.1 创建准星组件（十字）
  - [x] 11.2 创建调试信息组件（F3 切换）
  - [x] 11.3 显示坐标、FPS、区块数量
  - [x] 验证: 准星显示在屏幕中央，F3 显示调试信息

## 阶段 4: 高级功能

- [x] Task 12: 实现昼夜循环
  - [x] 12.1 实现游戏时间系统
  - [x] 12.2 调整 directional light 强度与颜色
  - [x] 12.3 调整天空颜色（背景色）
  - [x] 验证: 天空颜色随时间变化，光照强度变化

- [x] Task 13: 实现区块动态加载与卸载
  - [x] 13.1 根据玩家位置计算可见区块
  - [x] 13.2 异步加载新区块（避免卡顿）
  - [x] 13.3 卸载远离玩家的区块
  - [x] 验证: 移动时新区块加载，旧区块卸载，内存稳定

- [x] Task 14: 实现世界保存与加载
  - [x] 14.1 序列化修改过的区块数据到 localStorage
  - [x] 14.2 游戏启动时从 localStorage 加载
  - [x] 14.3 实现自动保存（每 5 分钟）
  - [x] 验证: 修改世界后刷新页面，修改保留

## 阶段 5: 优化与完善

- [x] Task 15: 性能优化
  - [x] 15.1 实现视锥剔除（frustum culling）
  - [x] 15.2 优化区块网格生成（只生成可见面）
  - [x] 15.3 使用纹理图集减少 draw call
  - [x] 验证: 在中等配置设备上保持 60fps

- [x] Task 16: 完善游戏体验
  - [x] 16.1 添加方块破坏进度显示
  - [x] 16.2 添加方块放置/破坏音效（可选）
  - [x] 16.3 优化 UI 样式（像素风格）
  - [x] 验证: 游戏体验流畅，UI 美观

## 任务依赖关系

- [Task 2] 依赖 [Task 1]
- [Task 3] 依赖 [Task 2]
- [Task 4] 依赖 [Task 3]
- [Task 5] 依赖 [Task 3, Task 4]
- [Task 6] 依赖 [Task 2]
- [Task 7] 依赖 [Task 3, Task 6]
- [Task 8] 依赖 [Task 5, Task 6]
- [Task 9] 依赖 [Task 7, Task 8]
- [Task 10] 依赖 [Task 9]
- [Task 11] 依赖 [Task 6]
- [Task 12] 依赖 [Task 5]
- [Task 13] 依赖 [Task 5, Task 7]
- [Task 14] 依赖 [Task 3]
- [Task 15] 依赖 [Task 5, Task 13]
- [Task 16] 依赖 [Task 9, Task 10, Task 11]

## 阶段 6: 验证修复任务

- [ ] Fix 1: 实现方块破坏粒子效果
  - 问题: BlockInteraction.breakBlock() 中无任何粒子系统，破坏方块时没有视觉反馈
  - 修复: 在 breakBlock() 中创建粒子效果（使用 THREE.Points 或多个小 Mesh 模拟碎片飞散），粒子应使用对应方块的颜色，带有重力和衰减效果
  - 验证: 破坏方块时看到对应颜色的粒子飞散效果

- [ ] Fix 2: 区块异步加载（避免卡顿）
  - 问题: GameEngine.generateChunk() 完全同步执行，大量区块同时生成时会导致帧率下降
  - 修复: 将区块地形生成改为异步处理（使用 requestIdleCallback 或分帧处理），每帧只生成有限数量的区块
  - 验证: 移动时新区块加载不会导致明显卡顿

- [ ] Fix 3: 内存使用稳定（区块卸载时完全释放）
  - 问题: GameEngine.updateChunkLoading() 卸载区块时只 dispose 了 mesh 的 geometry/material，但 Chunk 对象（含 Uint8Array 方块数据）从未从 world.chunks Map 中删除
  - 修复: 在卸载区块时，除了 dispose mesh，还应从 world.chunks Map 中删除 Chunk 对象（保留修改过的区块数据用于保存）
  - 验证: 长时间游玩后内存使用保持稳定

- [ ] Fix 4: 实现方块破坏进度显示
  - 问题: 当前左键点击瞬间破坏方块，无进度跟踪，无覆盖层显示
  - 修复: 实现按住左键持续破坏机制 - 添加破坏进度跟踪（0-100%），在目标方块面上显示裂纹覆盖层（使用半透明叠加纹理），达到 100% 时才真正破坏方块
  - 验证: 按住左键时看到裂纹逐渐增多，达到 100% 后方块破坏

- [ ] Fix 5: 修复 Hotbar 与 BlockInteraction 的选择同步问题
  - 问题: Hotbar.vue 派发 `hotbarSelectionChanged` 事件但 BlockInteraction 不监听该事件；两者各自独立处理 keydown/wheel 事件，虽然 blockTypeChanged 事件使 BlockInteraction 的变更能同步到 Hotbar，但 Hotbar 主动变更时 BlockInteraction 不响应
  - 修复: 在 BlockInteraction 中添加对 `hotbarSelectionChanged` 事件的监听，同步更新 selectedBlockType
  - 验证: 通过 1-9 键或滚轮切换时，Hotbar 高亮和实际放置的方块类型始终一致

- [ ] Fix 6: 实际设备性能测试与优化
  - 问题: 无法在沙箱环境中验证中等配置设备是否能保持 60fps
  - 修复: 在目标设备上实际测试，根据性能数据进一步优化（可能需要调整渲染距离、优化网格生成算法等）
  - 验证: 在中等配置设备上稳定 60fps
