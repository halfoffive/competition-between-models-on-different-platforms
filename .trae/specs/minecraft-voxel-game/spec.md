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
