# Voxel Craft — 浏览器体素沙盒游戏

基于 Vite + Vue 3 + Three.js 的类 Minecraft 浏览器体素沙盒游戏。程序化生成地形，支持方块破坏与放置、第一人称物理碰撞、昼夜循环、合成系统与存档读档。

## 技术栈

- **Vite** — 构建工具与开发服务器
- **Vue 3** — UI 框架（`<script setup>` SFC）
- **Three.js** — WebGL 3D 渲染引擎
- **simplex-noise** — 程序化地形噪声
- **Pinia** — 全局状态管理

## 运行方式

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建产物
```

## 操作说明

| 按键 | 功能 |
| --- | --- |
| WASD | 移动 |
| 鼠标 | 视角（点击画面锁定指针） |
| 空格 | 跳跃 / 双击切换飞行模式 |
| Shift | 冲刺 / 飞行下降 |
| 左键 | 破坏方块 |
| 右键 | 放置方块 |
| 1-9 / 滚轮 | 切换快捷栏槽位 |
| E | 打开/关闭物品栏与合成 |
| ESC | 暂停游戏 |

## 功能列表

- 程序化地形生成，包含 3 种生物群系（平原、森林、沙漠）
- 方块破坏与放置（DDA 体素射线检测）
- 第一人称物理（重力、跳跃、飞行）
- AABB 逐轴碰撞检测
- 昼夜循环（太阳/月亮、光照与天空色渐变）
- 合成系统（3x3 网格配方匹配）
- 存档与读档（localStorage 持久化修改过的区块）
- 动态区块加载与卸载
- 雾效隐藏远处加载边界
- 视锥剔除优化

## 项目结构

```
src/
├── game/                  # 游戏引擎核心
│   ├── Game.js            # 引擎主类：场景、相机、渲染器、渲染循环
│   ├── World.js           # 世界管理：区块动态加载/卸载、网格重建
│   ├── Chunk.js           # 区块：方块数据存储与网格生成
│   ├── Terrain.js         # 程序化地形生成（噪声、生物群系、植被）
│   ├── PlayerController.js# 玩家控制器：视角、移动、碰撞、射线、交互
│   ├── SkyCycle.js        # 昼夜循环：天体、光照、天空色
│   ├── Storage.js         # 存档/读档系统
│   ├── blocks.js          # 方块定义（ID、属性、海平面）
│   ├── textures.js        # 程序化纹理图集
│   └── recipes.js         # 合成配方
├── components/            # Vue UI 组件
│   ├── Hud.vue            # 游戏内 HUD（准星、调试信息、快捷栏）
│   ├── MainMenu.vue       # 主菜单
│   ├── PauseMenu.vue      # 暂停菜单
│   └── Inventory.vue      # 物品栏与合成界面
├── stores/
│   └── game.js            # Pinia 全局状态
├── App.vue                # 根组件
├── main.js                # 应用入口
└── style.css              # 全局样式
```
