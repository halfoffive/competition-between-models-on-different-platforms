# Minecraft 风格体素沙盒游戏 - Verification Checklist

## 项目构建与配置
- [x] Checkpoint 1: 项目目录 `/workspace/trae-work-cn/doubao-seed-2-1-pro` 已创建
- [x] Checkpoint 2: 使用 Vite 初始化 Vue 3 项目成功
- [x] Checkpoint 3: 所有依赖（three, simplex-noise）安装成功
- [x] Checkpoint 4: `npm run dev` 启动开发服务器，无编译错误
- [x] Checkpoint 5: `npm run build` 成功构建生产版本

## 世界生成
- [ ] Checkpoint 6: 世界数据结构正确初始化（128×64×128）
- [ ] Checkpoint 7: 地形有自然起伏（使用噪声生成），不是平坦平面
- [ ] Checkpoint 8: 地形分层正确（草、泥土、石头、基岩）
- [ ] Checkpoint 9: 世界中分布有树木（树干+树叶结构）
- [ ] Checkpoint 10: 低海拔区域有水/沙滩
- [x] Checkpoint 11: 至少12种方块类型已定义，颜色可区分

## 3D 渲染
- [ ] Checkpoint 12: Three.js 场景、相机、渲染器正确初始化
- [ ] Checkpoint 13: 天空可见（天空颜色/背景）
- [ ] Checkpoint 14: 光照系统工作（环境光+方向光）
- [ ] Checkpoint 15: 体素世界正确渲染，可见地形
- [ ] Checkpoint 16: 面剔除工作正常（隐藏面不渲染）
- [ ] Checkpoint 17: 窗口大小变化时渲染画布自适应

## 玩家控制
- [ ] Checkpoint 18: 点击画面可锁定鼠标（Pointer Lock）
- [ ] Checkpoint 19: 鼠标移动控制视角旋转（平滑）
- [ ] Checkpoint 20: 视角俯仰角有限制，不会完全翻转
- [ ] Checkpoint 21: WASD 键控制前后左右移动
- [ ] Checkpoint 22: 移动方向与视角方向一致

## 物理系统
- [ ] Checkpoint 23: 重力生效，玩家在空中会下落
- [ ] Checkpoint 24: 玩家落到方块上会停止，不会穿过
- [ ] Checkpoint 25: 空格键可跳跃，高度合理
- [ ] Checkpoint 26: 玩家无法穿过墙壁
- [ ] Checkpoint 27: 玩家可以走上1格高的台阶
- [ ] Checkpoint 28: 玩家不会掉出世界底部（有边界限制）

## 方块交互
- [ ] Checkpoint 29: 准星指向方块时显示高亮/线框
- [ ] Checkpoint 30: 鼠标左键破坏目标方块
- [ ] Checkpoint 31: 鼠标右键放置方块（当前选中类型）
- [ ] Checkpoint 32: 不能在玩家位置放置方块
- [ ] Checkpoint 33: 基岩无法被破坏
- [ ] Checkpoint 34: 放置/破坏后方块正确更新显示

## UI 系统
- [ ] Checkpoint 35: 屏幕中心有十字准星
- [ ] Checkpoint 36: 屏幕底部热键栏显示9个槽位
- [ ] Checkpoint 37: 数字键1-9切换选中槽位，有高亮
- [ ] Checkpoint 38: 鼠标滚轮切换选中槽位
- [ ] Checkpoint 39: FPS 显示在屏幕上并实时更新
- [ ] Checkpoint 40: 页面加载时显示开始界面
- [ ] Checkpoint 41: 点击"开始游戏"进入游戏
- [ ] Checkpoint 42: ESC 键显示暂停菜单，鼠标解锁
- [ ] Checkpoint 43: 暂停菜单可继续游戏

## 性能与体验
- [ ] Checkpoint 44: 游戏运行流畅，FPS ≥ 40
- [ ] Checkpoint 45: 放置/破坏方块后无明显卡顿
- [ ] Checkpoint 46: 移动和视角控制响应及时，无延迟
- [ ] Checkpoint 47: 整体游戏体验稳定，无崩溃
