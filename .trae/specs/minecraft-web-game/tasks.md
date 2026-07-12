# Tasks

- [x] Task 1: 项目初始化与依赖安装
  - [x] 在 `trae-work-cn/deepseek-v4-pro/` 下使用 Vite + Vue 3 模板创建项目
  - [x] 安装 Three.js 依赖
  - [x] 配置 Vite 开发服务器
  - [x] 清理默认模板代码

- [x] Task 2: 3D 场景与渲染引擎搭建
  - [x] 创建 Three.js 场景、摄像机、渲染器
  - [x] 实现渲染循环
  - [x] 实现窗口自适应缩放
  - [x] 添加方向光与环境光
  - [x] 设置天空颜色背景

- [x] Task 3: 方块系统实现
  - [x] 定义方块类型枚举（草、泥土、石头、木头、树叶、沙子、水）
  - [x] 实现单一方块的 Three.js Mesh 创建（使用 BoxGeometry + 不同颜色/纹理）
  - [x] 为每种方块类型配置不同颜色

- [x] Task 4: 区块（Chunk）系统
  - [x] 定义 Chunk 数据结构（16x16x128），存储方块类型
  - [x] 实现 Chunk 的 Three.js Mesh 生成（合并几何体优化性能）
  - [x] 实现 Chunk 管理器：加载/卸载玩家周围区块

- [x] Task 5: 程序化地形生成
  - [x] 实现 Perlin Noise 生成器（或使用简化噪声算法）
  - [x] 实现高度图地形生成（草地层、泥土层、石头层）
  - [x] 实现树木生成（树干 + 树冠）
  - [x] 实现沙子在低洼/水边生成

- [x] Task 6: 第一人称控制器
  - [x] 实现 WASD 移动控制
  - [x] 实现鼠标视角旋转（PointerLock API）
  - [x] 实现空格跳跃
  - [x] 实现重力与碰撞检测（AABB vs 方块）
  - [x] 实现准星 UI

- [x] Task 7: 方块交互
  - [x] 实现射线检测（Raycaster）选中方块
  - [x] 实现选中方块高亮边框
  - [x] 实现鼠标左键破坏方块（修改 Chunk 数据 + 重建 Mesh）
  - [x] 实现鼠标右键放置方块

- [x] Task 8: 背包 UI（Vue 组件）
  - [x] 创建 Hotbar 快捷栏 Vue 组件
  - [x] 实现方块类型切换（数字键 1-9 + 滚轮）
  - [x] 实现选中高亮显示
  - [x] 将 Vue 组件挂载到游戏页面

- [x] Task 9: 整合与优化
  - [x] 创建主 Game.vue 组件整合 3D 渲染与 UI
  - [x] 优化区块渲染性能（视锥剔除、合并几何体）
  - [x] 添加游戏启动提示（点击开始）

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
- Task 5 依赖 Task 4
- Task 6 依赖 Task 2
- Task 7 依赖 Task 4, Task 6
- Task 8 依赖 Task 1
- Task 9 依赖 Task 5, Task 7, Task 8