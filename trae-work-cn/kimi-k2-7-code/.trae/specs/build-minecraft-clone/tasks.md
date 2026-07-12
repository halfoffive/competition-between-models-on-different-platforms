# Tasks

- [x] Task 1: 初始化 Vite + Vue 3 + TypeScript 项目并安装依赖
  - [x] SubTask 1.1: 使用 `npm create vite@latest . -- --template vue-ts` 初始化项目
  - [x] SubTask 1.2: 安装 Three.js、@types/three、simplex-noise 等运行时依赖
  - [x] SubTask 1.3: 配置 `vite.config.ts` 与 TypeScript 路径别名
  - [x] SubTask 1.4: 验证 `npm run dev` 可正常启动并显示默认 Vue 页面

- [x] Task 2: 搭建 Three.js 渲染基础与 Vue 组件
  - [x] SubTask 2.1: 创建 `GameCanvas.vue` 组件并初始化场景、相机、渲染器
  - [x] SubTask 2.2: 添加窗口大小自适应与动画循环
  - [x] SubTask 2.3: 实现天空背景与雾效

- [x] Task 3: 实现方块系统与材质管理
  - [x] SubTask 3.1: 定义方块类型枚举（草、土、石、木、叶、水、沙、玻璃、砖、钻石矿）
  - [x] SubTask 3.2: 为每种方块生成或加载纹理（Canvas 程序生成纹理）
  - [x] SubTask 3.3: 实现方块注册表与材质缓存

- [x] Task 4: 实现世界存储与地形生成
  - [x] SubTask 4.1: 设计基于 Map/对象的世界方块数据结构
  - [x] SubTask 4.2: 集成 simplex-noise 实现高度图地形
  - [x] SubTask 4.3: 实现草-土-石分层、随机树木与水潭生成
  - [x] SubTask 4.4: 实现区块（Chunk）划分与按需生成/卸载

- [x] Task 5: 实现网格构建与渲染优化
  - [x] SubTask 5.1: 基于可见面构建 InstancedMesh 或合并几何体
  - [x] SubTask 5.2: 实现区块网格的更新与回收
  - [x] SubTask 5.3: 限制渲染距离并剔除远处区块

- [x] Task 6: 实现第一人称控制器
  - [x] SubTask 6.1: 使用 Pointer Lock API 锁定鼠标并控制视角
  - [x] SubTask 6.2: 实现 WASD 移动、空格跳跃、Shift 慢走
  - [x] SubTask 6.3: 实现重力、碰撞检测（AABB）与站立地面判定
  - [x] SubTask 6.4: 处理 Esc 释放鼠标与 UI 提示

- [x] Task 7: 实现方块交互（破坏与放置）
  - [x] SubTask 7.1: 使用射线检测获取准星指向的方块
  - [x] SubTask 7.2: 左键破坏方块并更新世界与网格
  - [x] SubTask 7.3: 右键根据面朝放置当前选中方块
  - [x] SubTask 7.4: 添加选中方块高亮框与破坏粒子效果

- [x] Task 8: 实现物品栏与方块选择 UI
  - [x] SubTask 8.1: 创建底部 9 格物品栏 Vue 组件
  - [x] SubTask 8.2: 支持数字键 1-9 与滚轮切换选中
  - [x] SubTask 8.3: 在画布中心绘制十字准星

- [x] Task 9: 实现昼夜循环与光照
  - [x] SubTask 9.1: 实现时间变量与太阳/月亮轨道
  - [x] SubTask 9.2: 同步定向光强度、方向与天空颜色
  - [x] SubTask 9.3: 夜晚降低环境光并启用月亮照明

- [x] Task 10: 实现存档与读档
  - [x] SubTask 10.1: 将玩家位置、视角、物品栏序列化到 localStorage
  - [x] SubTask 10.2: 保存玩家修改过的方块数据
  - [x] SubTask 10.3: 页面加载时读取存档并恢复世界状态

- [x] Task 11: 构建、验证与优化
  - [x] SubTask 11.1: 验证 `npm run build` 成功
  - [x] SubTask 11.2: 运行游戏测试核心功能（移动、破坏、放置、切换方块、昼夜、存档）
  - [x] SubTask 11.3: 修复构建警告与运行时错误

- [x] Task 12: 修复物品栏格数为 9 格
  - [x] SubTask 12.1: 将可放置方块列表或 Hotbar 渲染限制为 9 种
  - [x] SubTask 12.2: 验证数字键 1-9 与 9 格物品栏一一对应
  - [x] SubTask 12.3: 重新运行 `npm run build` 验证无错误

# Task Dependencies
- Task 2 依赖于 Task 1
- Task 3 依赖于 Task 2
- Task 4 依赖于 Task 3
- Task 5 依赖于 Task 4
- Task 6 依赖于 Task 5
- Task 7 依赖于 Task 5 和 Task 6
- Task 8 依赖于 Task 3
- Task 9 依赖于 Task 2
- Task 10 依赖于 Task 4、Task 6、Task 8
- Task 11 依赖于 Task 7、Task 8、Task 9、Task 10
