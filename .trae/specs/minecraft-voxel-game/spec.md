# 类似 Minecraft 的体素游戏 Spec

## Why
用户希望基于 vite + vue（最新稳定版）开发一个类似我的世界（Minecraft）的 3D 体素沙盒游戏，在浏览器中实现原版可落地的核心玩法：程序化地形、方块破坏与放置、第一人称物理移动、物品栏、昼夜循环与存档。该项目将在 `trae-work-cn/glm-5-2` 目录下开发，所有代码与资源仅限该目录。

## What Changes
- 新建 vite + vue 3 项目骨架（位于 `trae-work-cn/glm-5-2`）
- 集成 Three.js 作为 3D 渲染引擎，Vue 负责 UI 覆盖层（HUD、菜单、物品栏）
- 实现基于区块（Chunk）的体素世界与高效网格生成（面剔除）
- 实现基于 simplex noise 的程序化地形生成（含生物群系、树木、矿石、水）
- 实现第一人称控制（指针锁定 + 鼠标视角 + WASD + 跳跃 + 冲刺 + 飞行）
- 实现玩家物理（重力、AABB 碰撞检测）
- 实现方块交互（射线拾取、破坏、放置、高亮选中）
- 实现多种方块类型（草、土、石、沙、木、叶、水、矿石等）与纹理
- 实现 HUD（准星、快捷栏、坐标调试信息）
- 实现物品栏界面与方块选择
- 实现主菜单与暂停菜单
- 实现昼夜循环（天空颜色、太阳/月亮、光照变化）
- 实现基础合成（工作台 UI 与配方）
- 实现存档/读档（localStorage 持久化世界数据）
- 实现性能优化（视锥剔除、区块动态加载/卸载）

## Impact
- 受影响目录：`trae-work-cn/glm-5-2`（全新项目，无既有代码冲突）
- 技术栈：Vite（最新稳定）、Vue 3（最新稳定）、Three.js、simplex-noise、Pinia
- 浏览器目标：现代桌面浏览器（支持 WebGL2 + Pointer Lock API）

## ADDED Requirements

### Requirement: 项目骨架
系统 SHALL 在 `trae-work-cn/glm-5-2` 下提供可运行的 vite + vue 3 项目，包含 Three.js 渲染管线与 Vue UI 覆盖层的整合架构。

#### Scenario: 启动开发服务器
- **WHEN** 在项目目录执行 `npm run dev`
- **THEN** 浏览器打开后显示全屏 3D 画布与 Vue UI 覆盖层，无控制台错误

### Requirement: 体素世界渲染
系统 SHALL 以区块（默认 16×16×256 或裁剪高度）组织方块数据，并通过面剔除生成合并网格以高效渲染。

#### Scenario: 区块网格生成
- **WHEN** 玩家进入世界
- **THEN** 周围区块生成可见方块网格，被相邻方块完全遮挡的面不渲染

### Requirement: 程序化地形生成
系统 SHALL 使用 simplex noise 生成含高度起伏的地形，并支持至少 3 种生物群系（草原、森林、沙漠）、树木、矿石分布与水体。

#### Scenario: 地形多样性
- **WHEN** 使用固定种子生成世界
- **THEN** 不同区域呈现不同生物群系特征（地表方块、植被、高度差异）

### Requirement: 第一人称玩家控制
系统 SHALL 通过 Pointer Lock API 实现鼠标视角，WASD 移动，空格跳跃，Shift 冲刺，并提供飞行模式切换。

#### Scenario: 玩家移动
- **WHEN** 玩家按下 WASD 与空格
- **THEN** 玩家在地面移动并可跳跃，受重力影响，与方块发生碰撞

### Requirement: 方块交互
系统 SHALL 支持射线拾取定位目标方块，左键破坏，右键放置，并对当前目标方块显示高亮线框。

#### Scenario: 破坏与放置
- **WHEN** 玩家准星对准方块并左键
- **THEN** 该方块被移除且网格更新
- **WHEN** 玩家右键
- **THEN** 在目标方块邻接位置放置当前选中的方块

### Requirement: HUD 与物品栏
系统 SHALL 显示准星、底部快捷栏（含方块图标与选中态）及调试信息（FPS、坐标、朝向）。

#### Scenario: 快捷栏选择
- **WHEN** 玩家按数字键 1-9 或滚动滚轮
- **THEN** 快捷栏选中项切换，影响右键放置的方块类型

### Requirement: 菜单系统
系统 SHALL 提供主菜单（开始游戏、种子输入、设置）与暂停菜单（继续、保存、退出），按 ESC 触发暂停并释放指针锁定。

#### Scenario: 暂停
- **WHEN** 游戏中按 ESC
- **THEN** 指针锁定释放，显示暂停菜单，游戏循环可暂停

### Requirement: 昼夜循环
系统 SHALL 实现可配置周期的昼夜循环，天空颜色、太阳与月亮位置、环境光照随时间变化。

#### Scenario: 时间流逝
- **WHEN** 游戏运行
- **THEN** 天空从白天过渡到夜晚再回到白天，光照强度随之变化

### Requirement: 基础合成
系统 SHALL 提供工作台合成界面，包含至少若干合成配方（如木板→木棍、原木→木板），并支持合成结果取出。

#### Scenario: 合成
- **WHEN** 玩家打开合成界面并按配方摆放材料
- **THEN** 输出槽显示合成产物，可取出

### Requirement: 存档与读档
系统 SHALL 将世界区块数据、玩家位置与时间持久化到 localStorage，并支持在主菜单读取存档继续游戏。

#### Scenario: 保存与恢复
- **WHEN** 玩家暂停并选择保存
- **THEN** 世界与玩家状态写入 localStorage
- **WHEN** 重新进入主菜单选择继续
- **THEN** 世界与玩家状态恢复至保存时状态

### Requirement: 性能优化
系统 SHALL 根据玩家位置动态加载/卸载区块，启用视锥剔除，确保在中等配置下维持可玩帧率。

#### Scenario: 区块动态加载
- **WHEN** 玩家移动至区块边界外
- **THEN** 新区块加载生成，远离玩家的区块卸载释放内存
# 类 Minecraft 体素游戏 Spec

## Why
在浏览器中实现一个类似 Minecraft 的体素沙盒游戏，让玩家能够探索程序化生成的 3D 世界、采集资源、建造结构。使用现代 Web 技术栈（Vite + Vue 3 + Three.js）实现。

## What Changes
- 新建完整的 Vite + Vue 3 项目
- 实现 3D 体素渲染引擎（基于 Three.js）
- 实现程序化地形生成
- 实现第一人称控制器
- 实现方块交互系统
- 实现物品栏 UI
- 实现昼夜循环
- 实现区块加载系统

## Impact
- Affected specs: 无（全新项目）
- Affected code: /workspace/trae-work-cn/qwen-3-7-plus/

## ADDED Requirements

### Requirement: 项目初始化
系统 SHALL 使用 Vite + Vue 3（最新稳定版）初始化项目，集成 Three.js 作为 3D 渲染引擎。

#### Scenario: 项目启动
- **WHEN** 运行 `npm run dev`
- **THEN** 开发服务器启动，浏览器显示游戏主界面

### Requirement: 3D 渲染引擎
系统 SHALL 使用 Three.js 实现体素渲染，支持分块（chunk）加载与卸载，使用 InstancedMesh 或合并几何体优化性能。

#### Scenario: 渲染体素世界
- **WHEN** 游戏运行时
- **THEN** 以 60fps 渲染可见区块的体素方块

#### Scenario: 区块卸载
- **WHEN** 玩家远离某区块
- **THEN** 该区块的网格从场景移除，释放内存

### Requirement: 程序化地形生成
系统 SHALL 使用 Simplex/Perlin 噪声生成地形，包含平原、山丘、山地等地形特征，以及洞穴系统。

#### Scenario: 生成地形
- **WHEN** 新区块需要加载
- **THEN** 基于种子和噪声函数生成该区块的地形高度和方块分布

### Requirement: 第一人称控制器
系统 SHALL 实现第一人称视角控制，支持 WASD 移动、空格跳跃、鼠标锁定视角、Shift 疾跑。

#### Scenario: 玩家移动
- **WHEN** 玩家按下 WASD 键
- **THEN** 摄像机在对应方向移动，受碰撞检测约束

#### Scenario: 视角控制
- **WHEN** 玩家移动鼠标
- **THEN** 摄像机 yaw/pitch 相应旋转

### Requirement: 方块交互系统
系统 SHALL 支持方块的放置与破坏，左键破坏、右键放置，支持射线检测确定目标方块。

#### Scenario: 破坏方块
- **WHEN** 玩家左键点击方块
- **THEN** 该方块从世界中移除，触发粒子效果

#### Scenario: 放置方块
- **WHEN** 玩家右键点击方块表面
- **THEN** 在目标面相邻位置放置当前选中方块

### Requirement: 方块类型系统
系统 SHALL 支持多种方块类型，每种有独立纹理和属性：草方块、泥土、石头、木头、树叶、沙子、水、煤炭矿石、铁矿矿石、钻石矿石、基岩、木板、圆石、玻璃。

#### Scenario: 方块纹理
- **WHEN** 渲染方块
- **THEN** 根据方块类型显示对应纹理（使用程序化生成纹理或纹理图集）

### Requirement: 物品栏 / 快捷栏
系统 SHALL 实现底部快捷栏 UI（1-9 键切换），显示当前持有方块，支持鼠标滚轮切换。

#### Scenario: 切换物品
- **WHEN** 玩家按下 1-9 数字键或滚动鼠标滚轮
- **THEN** 快捷栏高亮移动，当前选中方块更新

### Requirement: 物理系统
系统 SHALL 实现重力、碰撞检测（AABB），玩家受重力影响并可与地形碰撞。

#### Scenario: 重力与碰撞
- **WHEN** 玩家在空中
- **THEN** 玩家下落，落地后停止

### Requirement: 昼夜循环
系统 SHALL 实现昼夜循环，天空颜色随时间变化，光照强度相应调整。

#### Scenario: 昼夜变化
- **WHEN** 游戏时间推进
- **THEN** 天空从蓝色渐变到橙色再到深蓝/黑色， directional light 强度相应变化

### Requirement: 世界保存
系统 SHALL 支持将世界数据序列化到 localStorage，下次打开时恢复。

#### Scenario: 保存与加载
- **WHEN** 玩家触发保存
- **THEN** 修改过的区块数据存入 localStorage
- **WHEN** 游戏重新加载
- **THEN** 从 localStorage 恢复修改过的区块

### Requirement: 游戏 UI
系统 SHALL 实现准星、快捷栏、调试信息（F3 显示坐标/FPS）等 UI 元素，使用 Vue 组件渲染在 Canvas 之上。

#### Scenario: 显示准星
- **WHEN** 游戏运行时
- **THEN** 屏幕中央显示十字准星

#### Scenario: 调试信息
- **WHEN** 玩家按下 F3
- **THEN** 显示坐标、FPS、区块数量等信息
