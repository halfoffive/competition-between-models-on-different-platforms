# Checklist

## 阶段 1：项目骨架
- [x] `trae-work-cn/glm-5-2` 下存在可运行的 vite + vue 3 项目
- [x] 依赖 three、simplex-noise、pinia 已安装并写入 package.json
- [x] `vite.config.js` 配置了 `@` 路径别名指向 `src`
- [x] `npm run dev` 可正常启动且无控制台错误
- [x] `npm run build` 可成功构建
- [x] `src/game/Game.js` 引擎主类管理 scene/camera/renderer 与游戏循环
- [x] `src/App.vue` 挂载全屏 canvas 与 UI 覆盖层
- [x] `src/stores/game.js` Pinia store 包含 running、paused、playerPos、selectedSlot、timeOfDay 等状态

## 阶段 2：体素世界核心
- [x] `src/game/blocks.js` 定义了至少 12 种方块及完整属性
- [x] `src/game/textures.js` 程序化生成 16×16 像素风格纹理图集
- [x] `src/game/Chunk.js` 使用 Uint8Array 存储 16×16×128 方块数据
- [x] 面剔除网格生成正确：被遮挡面不渲染
- [x] `src/game/World.js` 管理区块 Map，支持按 key 查找
- [x] 玩家周围渲染距离内区块自动加载，远离区块自动卸载
- [x] 区块网格重建分帧执行，无单帧明显卡顿

## 阶段 3：地形生成
- [x] `src/game/Terrain.js` 基于 simplex-noise 生成地形
- [x] 至少 3 种生物群系（草原、森林、沙漠）有可辨识差异
- [x] 地表/地下分层正确（草→土→石）
- [x] 矿石按 Y 深度分布
- [x] 海平面以下填充水
- [x] 树木生成（原木树干+树叶）
- [x] 固定种子生成一致地形

## 阶段 4：玩家与交互
- [x] Pointer Lock API 正确实现鼠标视角
- [x] WASD 移动、Shift 冲刺、空格跳跃、双击空格飞行切换均生效
- [x] AABB 碰撞检测：玩家不能穿墙、不踩空
- [x] 重力与跳跃速度计算正确
- [x] DDA 体素射线拾取定位目标方块（最大距离 5）
- [x] 左键破坏方块、右键放置方块
- [x] 目标方块显示线框高亮
- [x] 方块修改后所在区块与邻居网格即时重建

## 阶段 5：UI 界面
- [x] `src/components/Hud.vue` 显示准星、快捷栏、调试信息
- [x] 数字键 1-9 与滚轮切换快捷栏选中槽
- [x] `src/components/MainMenu.vue` 含开始新游戏、继续游戏、设置
- [x] `src/components/PauseMenu.vue` 含继续、保存、设置、退出
- [x] ESC 触发暂停并释放指针锁定
- [x] `src/components/Inventory.vue` 含背包网格 + 3×3 合成区 + 输出槽
- [x] `src/game/recipes.js` 定义至少 4 个合成配方
- [x] E 键打开/关闭物品栏并释放指针锁定
- [x] 拖拽放置与合成取出可用

## 阶段 6：游戏玩法
- [x] `src/game/SkyCycle.js` 实现昼夜循环
- [x] 太阳/月亮位置、天空色、光照随时间变化
- [x] store 中 timeOfDay 同步更新
- [x] `src/game/Storage.js` 实现脏区块、玩家位置、时间、背包持久化
- [x] 主菜单"继续游戏"可恢复存档
- [x] 暂停菜单"保存"可写入存档

## 阶段 7：优化与收尾
- [x] 视锥剔除启用
- [x] 雾效隐藏远处加载边界
- [x] 中等配置下维持 40+ FPS
- [x] 新建世界→探索→破坏放置→合成→保存→继续 全流程无报错
- [x] `trae-work-cn/glm-5-2/README.md` 写明运行方式
- [x] `npm run build` 成功且构建产物可预览
