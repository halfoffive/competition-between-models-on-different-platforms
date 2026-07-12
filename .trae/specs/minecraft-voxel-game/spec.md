# Minecraft 风格体素沙盒游戏 - Product Requirement Document

## Overview
- **Summary**: 一个基于 Vue 3 + Vite + Three.js 开发的浏览器端体素沙盒游戏，灵感来自《我的世界》(Minecraft)。玩家可以在程序化生成的 3D 体素世界中自由探索、放置和破坏方块，体验第一人称视角的建造与探索乐趣。
- **Purpose**: 提供一个可在浏览器中直接运行的轻量级体素游戏体验，无需安装即可享受建造和探索的核心玩法。
- **Target Users**: 休闲游戏玩家、体素游戏爱好者、前端技术学习者。

## Goals
- 实现流畅的 3D 体素世界渲染（60 FPS 目标）
- 提供第一人称视角的完整移动控制（WASD + 鼠标）
- 实现方块的放置与破坏核心机制
- 程序化生成自然地形（山脉、洞穴、树木）
- 提供多种方块类型和物品栏系统
- 实现基础物理系统（重力、碰撞、跳跃）
- 支持响应式布局，适配不同屏幕尺寸
- 提供创造模式下的无限方块访问

## Non-Goals (Out of Scope)
- 完整的红石电路系统（复杂度极高，浏览器端不适合）
- 多人在线联机功能（需要后端服务器支持）
- 复杂的生物 AI 系统（怪物、动物行为，仅做基础占位）
- 完整的生存模式机制（生命值、饥饿度、合成系统仅做简化）
- 无限世界生成（使用固定大小的有限世界，128×64×128 区块）
- Mod 支持和插件系统
- 官方 Minecraft 的所有方块和物品（实现核心 15-20 种方块）

## Background & Context
- **技术栈**: Vue 3 (Composition API) + Vite 5.x (最新稳定版) + Three.js (3D渲染)
- **渲染优化**: 使用 Greedy Meshing（贪心网格合并）或 InstancedMesh 优化渲染性能
- **目标目录**: `/workspace/trae-work-cn/doubao-seed-2-1-pro`
- **浏览器环境**: 仅支持现代浏览器（Chrome、Firefox、Safari、Edge 最新版本），需要 WebGL 2.0 支持
- **输入方式**: 键盘（WASD、空格、Shift、数字键）+ 鼠标（视角控制、左右键操作）

## Functional Requirements
- **FR-1**: 3D 世界渲染
  - 程序化生成自然地形，包含草地、泥土、石头、沙子、树木等元素
  - 正确的面剔除（只渲染可见的方块面）以优化性能
  - 天空盒渲染，模拟天空颜色
  - 基础光照系统（环境光 + 方向光）
  
- **FR-2**: 第一人称控制
  - WASD 键控制前后左右移动
  - 鼠标移动控制视角（Pointer Lock API）
  - 空格键跳跃，Shift 键加速/下降
  - 重力和地面碰撞检测
  - 玩家不能穿过方块

- **FR-3**: 方块交互
  - 鼠标左键破坏方块
  - 鼠标右键放置方块
  - 方块高亮显示（瞄准线/轮廓）
  - 支持选择不同方块类型

- **FR-4**: 物品栏系统
  - 屏幕底部显示热键栏（Hotbar），包含 9 个物品槽
  - 数字键 1-9 快速切换选中方块
  - 鼠标滚轮切换选中方块
  - 显示当前选中方块的视觉反馈

- **FR-5**: 方块类型
  - 草方块（Grass）
  - 泥土（Dirt）
  - 石头（Stone）
  - 橡木木板（Oak Planks）
  - 橡木原木（Oak Log）
  - 树叶（Leaves）
  - 沙子（Sand）
  - 玻璃（Glass）
  - 砖块（Bricks）
  - 圆石（Cobblestone）
  - Bedrock（基岩，不可破坏）
  - 水（简化版）
  - 至少 12 种方块类型

- **FR-6**: 世界生成
  - 使用柏林噪声（Perlin/Simplex Noise）生成高度图
  - 自动生成树木（树干 + 树叶）
  - 简单的洞穴/隧道生成
  - 沙滩和水域生成

- **FR-7**: 用户界面
  - 开始界面（开始游戏按钮、操作说明）
  - 游戏内 HUD（十字准星、热键栏）
  - 暂停/菜单界面（ESC 键触发）
  - 移动端触控适配（可选，作为增强）

- **FR-8**: 游戏状态
  - 创造模式（默认，无限方块，可飞行）
  - 简单的世界重置功能
  - 基本的性能统计显示（FPS、坐标）

## Non-Functional Requirements
- **NFR-1**: 性能 - 在中等配置设备上保持 45+ FPS
- **NFR-2**: 加载时间 - 初始加载 ≤ 5 秒（本地资源）
- **NFR-3**: 响应式 - 适配 1024×768 及以上分辨率
- **NFR-4**: 可访问性 - 支持键盘操作，有明确的视觉反馈
- **NFR-5**: 代码质量 - 模块化结构，Vue 组件职责清晰
- **NFR-6**: 浏览器兼容 - 支持主流现代浏览器，WebGL 2.0

## Constraints
- **Technical**:
  - 必须使用 Vue 3 + Vite 最新稳定版本
  - 3D 渲染使用 Three.js
  - 纯前端实现，无后端依赖
  - 只能在 `/workspace/trae-work-cn/doubao-seed-2-1-pro` 目录下开发
- **Business**:
  - 单机游戏，无服务端组件
  - 非商业用途，学习/演示项目
- **Dependencies**:
  - Vue 3.x
  - Vite 5.x
  - Three.js
  - simplex-noise (或类似噪声库，用于地形生成)

## Assumptions
- 用户使用支持 WebGL 2.0 的现代浏览器
- 用户有键盘和鼠标（桌面端体验优先）
- 世界大小固定为 128×64×128 体素（x×y×z），足够探索且性能可控
- 不需要网络连接，完全离线运行
- 使用简单的方块纹理（程序生成或纯色+简单图案，避免外部资源依赖问题）

## Acceptance Criteria

### AC-1: 项目初始化与构建
- **Given**: 开发环境已安装 Node.js
- **When**: 运行 `npm install` 和 `npm run dev`
- **Then**: 项目成功启动，可在浏览器访问，无编译错误
- **Verification**: `programmatic`
- **Notes**: Vite 开发服务器正常运行，热更新工作

### AC-2: 3D 世界渲染
- **Given**: 游戏成功加载
- **When**: 进入游戏场景
- **Then**: 可见一个由体素方块组成的 3D 世界，有地形起伏和树木
- **Verification**: `human-judgment`
- **Notes**: 世界应该有明显的高度变化，不是完全平坦；至少有几棵树

### AC-3: 第一人称移动
- **Given**: 游戏已启动并获得鼠标锁定
- **When**: 按下 WASD 键并移动鼠标
- **Then**: 视角随鼠标平滑移动，玩家在世界中相应移动
- **Verification**: `human-judgment`
- **Notes**: 移动应流畅，无明显卡顿；W向前，S向后，A向左，D向右

### AC-4: 重力与碰撞
- **Given**: 玩家在世界中
- **When**: 走到方块边缘或跳跃后
- **Then**: 玩家受重力影响下落，落到地面时停止，不会穿过方块
- **Verification**: `human-judgment`
- **Notes**: 跳跃高度合理，碰撞检测准确

### AC-5: 方块破坏
- **Given**: 玩家在游戏中，准星对准一个方块
- **When**: 点击鼠标左键
- **Then**: 被瞄准的方块消失（被破坏）
- **Verification**: `human-judgment`
- **Notes**: 破坏后方块不再可见，玩家可以通过

### AC-6: 方块放置
- **Given**: 玩家在游戏中，热键栏选中了某个方块
- **When**: 点击鼠标右键
- **Then**: 在准星指向的位置放置一个选中类型的方块
- **Verification**: `human-judgment`
- **Notes**: 不能在玩家所在位置放置方块；放置的方块与周围正确连接

### AC-7: 热键栏切换
- **Given**: 游戏进行中
- **When**: 按下数字键 1-9 或滚动鼠标滚轮
- **Then**: 热键栏选中项相应变化，视觉上有高亮反馈
- **Verification**: `human-judgment`

### AC-8: 方块高亮
- **Given**: 玩家在游戏中
- **When**: 准星指向一个方块
- **Then**: 该方块显示轮廓/高亮效果
- **Verification**: `human-judgment`
- **Notes**: 高亮清晰可见，帮助玩家确认目标

### AC-9: 菜单系统
- **Given**: 游戏进行中
- **When**: 按下 ESC 键
- **Then**: 鼠标锁定解除，显示暂停菜单
- **Verification**: `human-judgment`
- **Notes**: 菜单提供"继续游戏"选项

### AC-10: 性能表现
- **Given**: 游戏在中等配置电脑上运行
- **When**: 正常探索和建造
- **Then**: FPS 保持在 40 以上，无明显卡顿
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要添加简单的音效（放置/破坏方块、脚步声）？
- [ ] 飞行模式如何实现（创造模式下双击空格？）？
- [ ] 方块纹理是使用纯色方块还是简单的程序生成图案？
- [ ] 是否需要实现简单的昼夜循环光照变化？
