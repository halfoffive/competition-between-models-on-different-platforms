# VoxelCraft - 体素沙盒游戏产品需求文档

## Overview
- **Summary**: 基于 Vite + Vue 3 开发的浏览器端类 Minecraft 体素沙盒游戏，使用 Three.js 进行 3D 渲染，实现方块世界的探索、建造与破坏。
- **Purpose**: 提供一个可在浏览器中直接运行的体素沙盒体验，让用户无需安装即可享受创造与探索的乐趣。
- **Target Users**: 喜欢沙盒游戏、建造类游戏的休闲玩家，以及对 WebGL/3D 技术感兴趣的开发者。

## Goals
- 实现可交互的 3D 体素世界，支持第一人称探索
- 实现方块的放置与破坏核心玩法
- 实现程序化地形生成，创造多样化的自然景观
- 提供完整的游戏 UI（物品栏、准星、调试信息）
- 保证在主流浏览器中流畅运行（60fps 目标）
- 响应式设计，支持不同屏幕尺寸

## Non-Goals (Out of Scope)
- 多人联机功能
- 复杂的红石电路系统
- 完整的生存模式（饥饿值、怪物 AI、战斗系统）
- 存档/读档的云端同步
- Mod 支持
- 声音效果系统
- 复杂的合成系统
- 完整的生物群系
- 天气系统（雨雪）

## Background & Context
- 技术栈：Vite 5 + Vue 3 (Composition API) + Three.js
- 运行环境：现代浏览器（Chrome、Firefox、Safari、Edge），需支持 WebGL 2.0
- 渲染方案：使用 Three.js 的 InstancedMesh 进行体素渲染优化
- 地形生成：使用 Simplex 噪声算法生成自然地形

## Functional Requirements
- **FR-1**: 3D 体素世界渲染
  - 使用 Three.js 渲染由方块组成的 3D 世界
  - 支持多种方块类型（草方块、泥土、石头、木头、树叶、沙子、水、玻璃等）
  - 视锥体剔除与背面剔除优化
  - 隐藏面剔除（只渲染可见面）
- **FR-2**: 第一人称视角控制
  - WASD 键移动（前后左右）
  - 鼠标控制视角（Pointer Lock API）
  - 空格键跳跃
  - Shift 键加速/潜行
  - 重力与碰撞检测
  - 飞行模式切换（双击空格）
- **FR-3**: 方块交互
  - 左键破坏方块
  - 右键放置方块
  - 方块高亮显示（准星指向的方块）
  - 达到距离限制时无法交互
- **FR-4**: 物品栏系统
  - 9 格快捷栏（数字键 1-9 切换）
  - 每种方块对应一种物品
  - 当前选中物品高亮显示
  - 鼠标滚轮切换物品
- **FR-5**: 程序化地形生成
  - 使用 Simplex 噪声生成高度图
  - 多层地形结构（草、泥土、石头）
  - 树木生成
  - 水域生成
  - 世界大小可配置
- **FR-6**: 游戏 UI / HUD
  - 屏幕中心准星
  - 底部物品栏
  - 调试信息面板（FPS、坐标、方块数量）
  - 开始界面 / 暂停菜单
- **FR-7**: 昼夜循环
  - 太阳/月亮位置随时间变化
  - 天空颜色随时间变化
  - 光照强度变化
  - 时间可调节

## Non-Functional Requirements
- **NFR-1**: 性能
  - 目标帧率：60fps（在 16 渲染距离下）
  - 初始世界生成时间 < 5 秒
  - 内存占用 < 500MB
- **NFR-2**: 兼容性
  - 支持 Chrome 90+、Firefox 88+、Safari 15+、Edge 90+
  - 支持 WebGL 2.0，降级提示 WebGL 1.0
- **NFR-3**: 可维护性
  - 模块化架构，核心逻辑与 UI 分离
  - 清晰的代码结构和命名规范
- **NFR-4**: 用户体验
  - 操作响应延迟 < 50ms
  - 加载过程有进度提示
  - 清晰的操作说明

## Constraints
- **Technical**: 
  - 必须使用 Vite + Vue 3 最新稳定版本
  - 仅限在浏览器端运行，无后端服务
  - 仅允许访问 `trae-work-cn/auto` 目录
- **Business**: 
  - 纯前端实现，无服务器成本
- **Dependencies**: 
  - three (Three.js 3D 引擎)
  - simplex-noise (噪声算法)
  - vue (UI 框架)
  - vite (构建工具)

## Assumptions
- 用户使用支持 WebGL 2.0 的现代浏览器
- 用户使用键盘鼠标操作（不考虑触屏）
- 世界大小控制在合理范围内以保证性能
- 方块材质使用程序化生成的像素纹理，无需外部图片资源

## Acceptance Criteria

### AC-1: 3D 世界可正常渲染
- **Given**: 用户打开游戏页面
- **When**: 游戏加载完成
- **Then**: 可以看到由多种方块组成的 3D 地形世界，包括草地、树木、水域等
- **Verification**: `human-judgment`
- **Notes**: 需确认渲染正常无明显错误

### AC-2: 第一人称移动控制
- **Given**: 游戏已加载，用户点击画面进入指针锁定
- **When**: 用户按下 WASD 键和移动鼠标
- **Then**: 视角跟随鼠标转动，角色按 WASD 方向移动，移动流畅无卡顿
- **Verification**: `human-judgment`
- **Notes**: 鼠标左右移动控制左右视角，鼠标上下移动控制俯仰角

### AC-3: 方块可被破坏
- **Given**: 玩家对准一个方块
- **When**: 玩家按下鼠标左键
- **Then**: 该方块被移除，世界更新渲染
- **Verification**: `programmatic` + `human-judgment`
- **Notes**: 超出交互距离时不应破坏方块

### AC-4: 方块可被放置
- **Given**: 玩家对准一个方块面，当前选中某物品
- **When**: 玩家按下鼠标右键
- **Then**: 在被点击的方块面上放置一个新方块（与选中物品对应）
- **Verification**: `programmatic` + `human-judgment`
- **Notes**: 不能放置在玩家自身位置

### AC-5: 物品栏切换
- **Given**: 游戏运行中
- **When**: 玩家按下数字键 1-9 或滚动鼠标滚轮
- **Then**: 快捷栏中对应格子被选中，高亮显示当前选中项
- **Verification**: `programmatic`

### AC-6: 重力与碰撞
- **Given**: 玩家在空中
- **When**: 没有方块支撑
- **Then**: 玩家会下落直到碰到地面；碰到墙壁时不能穿过
- **Verification**: `human-judgment`

### AC-7: 飞行模式
- **Given**: 游戏运行中
- **When**: 玩家快速双击空格键
- **Then**: 切换飞行模式；飞行模式下空格上升、Shift 下降、不受重力影响
- **Verification**: `human-judgment`

### AC-8: 昼夜循环
- **Given**: 游戏运行中
- **When**: 时间流逝
- **Then**: 太阳/月亮位置变化，天空颜色和光照随之变化，呈现昼夜交替效果
- **Verification**: `human-judgment`
- **Notes**: 可通过调试面板调节时间速度

### AC-9: UI 界面完整
- **Given**: 游戏运行中
- **When**: 查看画面
- **Then**: 屏幕中心有准星，底部有物品栏，可选显示调试信息（FPS、坐标）
- **Verification**: `human-judgment`

### AC-10: 项目可正常构建
- **Given**: 项目源代码
- **When**: 执行 `npm run build`
- **Then**: 构建成功，输出静态文件，无错误
- **Verification**: `programmatic`

### AC-11: 开发服务器可启动
- **Given**: 项目已安装依赖
- **When**: 执行 `npm run dev`
- **Then**: 开发服务器成功启动，可在浏览器中访问
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要实现保存/加载世界功能（localStorage）？
- [ ] 世界初始大小设置为多少方块？（默认建议 64x64 区域，高度 32）
- [ ] 是否需要更多游戏模式（创造/生存）切换？
- [ ] 是否需要添加动物/生物？
