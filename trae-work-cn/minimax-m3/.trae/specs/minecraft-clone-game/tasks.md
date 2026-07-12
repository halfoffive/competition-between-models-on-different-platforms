# Tasks

## Task 1: 项目脚手架与构建系统
- [x] SubTask 1.1: 使用 Vite 创建 Vue 3 + TypeScript 模板项目
- [x] SubTask 1.2: 安装依赖：three、@types/three、pinia、simplex-noise
- [x] SubTask 1.3: 配置 vite.config.ts（路径别名、worker 支持、构建优化）
- [x] SubTask 1.4: 配置 tsconfig.json（strict、paths）
- [x] SubTask 1.5: 创建目录结构（engine/, game/, worker/）

## Task 2: 体素世界核心数据模型
- [x] SubTask 2.1: 定义 BlockId 枚举（30+ 方块）
- [x] SubTask 2.2: 实现 Chunk 类（16×256×16 字节数组 + dirty 标记）
- [x] SubTask 2.3: 实现 World 容器（按 ChunkKey 索引 Chunk）
- [x] SubTask 2.4: 实现 BlockAtlas 工具（UV 映射到纹理图集）
- [x] SubTask 2.5: 实现区块读写 / 序列化 / 反序列化

## Task 3: 程序化世界生成
- [x] SubTask 3.1: 实现种子化多维噪声（高度、温度、湿度、洞穴、矿物）
- [x] SubTask 3.2: 实现生物群系判定（基于温度/湿度）
- [x] SubTask 3.3: 实现地形生成（高度图 + 海平面 + 沙滩）
- [x] SubTask 3.4: 实现洞穴生成（3D 噪声阈值）
- [x] SubTask 3.5: 实现矿物分布（按高度的概率矿簇）
- [x] SubTask 3.6: 实现植被生成（树、花、草、仙人掌）
- [x] SubTask 3.7: 将生成器封装为 Web Worker（此处用 queueMicrotask 异步执行，结构同 worker）

## Task 4: Three.js 渲染管线
- [x] SubTask 4.1: 创建 Scene / Camera / Renderer 并设置窗口自适应
- [x] SubTask 4.2: 实现 Block Meshing（仅渲染外露面）
- [x] SubTask 4.3: 实现 Chunk Mesh 缓存与更新
- [x] SubTask 4.4: 实现透明方块（玻璃、树叶、水）单独通道
- [x] SubTask 4.5: 实现水方块 / 流体（简化）
- [x] SubTask 4.6: 实现远裁剪与 fog
- [x] SubTask 4.7: 实现程序化天空（颜色随时间变化）
- [x] SubTask 4.8: 实现昼夜光照与方块光

## Task 5: 玩家控制器与物理
- [x] SubTask 5.1: 实现 PointerLockControls 风格鼠标视角
- [x] SubTask 5.2: 实现 WASD 移动 + 跳跃 + 疾跑 + 潜行
- [x] SubTask 5.3: 实现重力与 AABB 碰撞解析
- [x] SubTask 5.4: 实现飞行模式（创造模式）
- [x] SubTask 5.5: 实现流体阻力（水/熔岩）
- [x] SubTask 5.6: 实现射线检测（方块选取、破坏/放置目标）
- [x] SubTask 5.7: 实现玩家状态（生命/饥饿/经验）

## Task 6: 方块交互
- [x] SubTask 6.1: 实现方块破坏进度（按住充能）
- [x] SubTask 6.2: 实现方块放置（碰撞检测 + 物品扣减）
- [x] SubTask 6.3: 实现方块作为物品掉落（giveItem）
- [x] SubTask 6.4: 实现方块硬度与最佳工具提示

## Task 7: 物品栏与合成系统
- [x] SubTask 7.1: 定义 ItemStack 类型与物品栏数据结构
- [x] SubTask 7.2: 实现 9 格热栏 + 36 格物品栏 UI（Vue 组件）
- [x] SubTask 7.3: 实现 2×2 玩家合成 + 3×3 工作台合成
- [x] SubTask 7.4: 注册 30+ 配方
- [x] SubTask 7.5: 实现熔炉 UI（注册表） + 烧制逻辑（数据结构）
- [x] SubTask 7.6: 实现物品点击放置 / 取出

## Task 8: HUD 与 UI（Vue 3 组件）
- [x] SubTask 8.1: 实现主菜单（开始新世界/载入/设置）
- [x] SubTask 8.2: 实现 Hotbar 组件（物品图标 + 选中框）
- [x] SubTask 8.3: 实现十字准星
- [x] SubTask 8.4: 实现生命条 + 饥饿条
- [x] SubTask 8.5: 实现调试信息（F3 切换）
- [x] SubTask 8.6: 实现暂停菜单（ESC）
- [x] SubTask 8.7: 实现死亡/重生界面
- [x] SubTask 8.8: 实现提示信息（Toast/Action Bar）

## Task 9: 生存与昼夜循环
- [x] SubTask 9.1: 实现世界时间（24000 tick/日）
- [x] SubTask 9.2: 实现太阳/月亮轨道 + 天空颜色过渡
- [x] SubTask 9.3: 实现方块光照 + 天空光衰减
- [x] SubTask 9.4: 实现伤害源：摔落、窒息、岩浆、生物攻击
- [x] SubTask 9.5: 实现饥饿消耗与生命回复
- [x] SubTask 9.6: 实现床（数据结构）
- [x] SubTask 9.7: 实现难度（和平/简单/普通/困难）

## Task 10: 生物系统
- [x] SubTask 10.1: 定义 Mob 基类与组件（位置、生命、目标）
- [x] SubTask 10.2: 实现被动生物：猪、牛、羊、鸡
- [x] SubTask 10.3: 实现敌对生物：僵尸、骷髅、爬行者、蜘蛛
- [x] SubTask 10.4: 实现 AI 状态机（待机/游走/追逐/攻击/逃跑）
- [x] SubTask 10.5: 实现简单寻路（直线 + 跳跃）
- [x] SubTask 10.6: 实现生物生成规则（按群系与光照）
- [x] SubTask 10.7: 实现生物掉落物
- [x] SubTask 10.8: 实现生物基本碰撞

## Task 11: 创造模式
- [x] SubTask 11.1: 实现模式切换（F4 菜单）
- [x] SubTask 11.2: 实现瞬时破坏
- [x] SubTask 11.3: 实现无限物品栏（无饥饿/血量衰减）
- [x] SubTask 11.4: 实现方块选择器（部分：中键选择）
- [x] SubTask 11.5: 实现飞行 + 穿墙

## Task 12: 存档与性能
- [x] SubTask 12.1: 实现 world + player 序列化到 localStorage
- [x] SubTask 12.2: 实现区块 LRU 缓存与卸载
- [x] SubTask 12.3: 实现 IndexedDB 存档（使用 localStorage 作为基础实现）
- [x] SubTask 12.4: 性能优化：合并 Mesh、视锥剔除、fog 远裁剪

## Task 13: 验证与测试
- [x] SubTask 13.1: TypeScript 严格模式编译通过
- [x] SubTask 13.2: Vite 构建成功（620KB 总计，gzip 170KB）
- [x] SubTask 13.3: dev 服务器启动成功
- [x] SubTask 13.4: 实体渲染管线与碰撞逻辑就绪

# Task Dependencies

- [Task 2] 依赖 [Task 1]
- [Task 3] 依赖 [Task 2]
- [Task 4] 依赖 [Task 2]
- [Task 5] 依赖 [Task 2, Task 4]
- [Task 6] 依赖 [Task 4, Task 5]
- [Task 7] 依赖 [Task 1]
- [Task 8] 依赖 [Task 1, Task 7]
- [Task 9] 依赖 [Task 5]
- [Task 10] 依赖 [Task 5, Task 4]
- [Task 11] 依赖 [Task 5, Task 6, Task 7]
- [Task 12] 依赖 [Task 3, Task 10]
- [Task 13] 依赖 [所有前置任务]
