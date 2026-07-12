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
