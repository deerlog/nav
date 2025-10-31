# 多级嵌套分类功能说明

## 功能概述

本系统现已支持多级嵌套的书签分类结构（树状结构），允许用户创建最多5层深度的分类层级。

## 数据库结构

### Categories 表

- `id`: 主键
- `name`: 分类名称
- `position`: 在同级分类中的位置
- `parent_id`: 父分类ID（NULL表示根分类）
- `depth`: 分类深度（0表示根分类）
- `created_at`: 创建时间

### 约束

- 同一父分类下，分类名称不能重复（UNIQUE(name, parent_id)）
- 最大嵌套深度：5层
- 支持级联删除：删除分类时，自动删除其所有子分类和书签

## API 变更

### GET /api/categories

返回所有分类（包含 `parent_id` 和 `depth` 字段），按 `depth` 和 `position` 排序。

### POST /api/categories

创建分类时可指定 `parent_id`：

```json
{
  "name": "分类名称",
  "parent_id": 1  // 可选，NULL或不提供表示根分类
}
```

### PUT /api/categories/:id

更新分类时可修改 `parent_id`：

```json
{
  "name": "新名称",
  "parent_id": 2,  // 可选，修改父分类
  "position": 0    // 可选，修改位置
}
```

系统会自动：
- 防止循环引用（分类不能成为自己的子孙分类）
- 检查嵌套深度限制
- 重新计算 `depth` 字段

## 导入功能

### 支持的浏览器格式

系统支持导入以下浏览器的书签HTML文件：

- Google Chrome
- Microsoft Edge
- Firefox
- Safari
- Opera

### HTML 格式

支持标准的 Netscape Bookmark File 格式，自动解析多级嵌套的文件夹结构：

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL>
  <DT><H3>父分类</H3>
  <DL>
    <DT><A HREF="url">书签名称</A>
    <DT><H3>子分类</H3>
    <DL>
      <DT><A HREF="url">子分类中的书签</A>
    </DL>
  </DL>
</DL>
```

### 导入逻辑

1. 自动跳过浏览器默认容器（如"书签栏"、"Bookmarks Toolbar"等）
2. 保持原有的文件夹层级结构
3. 按深度优先顺序创建分类
4. 自动跳过已存在的分类和书签
5. 限制最大深度为5层

## 导出功能

### HTML 导出

导出为标准的 Netscape Bookmark File 格式，保持完整的树状结构，可被主流浏览器识别和导入。

### JSON 导出

导出包含 `parent_id` 和 `depth` 字段的完整分类数据，可用于备份或迁移。

## 前端工具函数

提供了 `src/utils/categoryTree.js` 工具库：

- `buildCategoryTree(categories)`: 构建分类树结构
- `getCategoryPath(categoryId, categoryMap)`: 获取分类路径
- `getDescendantIds(categoryId, categoryMap)`: 获取所有后代分类
- `canMoveCategory(categoryId, targetParentId, categoryMap)`: 检查是否可移动
- `calculateDepth(parentId, categoryMap)`: 计算深度

## 迁移指南

对于现有数据库，执行以下迁移脚本：

```sql
-- 添加 parent_id 和 depth 字段
ALTER TABLE categories ADD COLUMN parent_id INTEGER DEFAULT NULL REFERENCES categories(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN depth INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_position ON categories(parent_id, position);

-- 更新 UNIQUE 约束（需要重建表）
-- 注意：SQLite 不支持直接修改约束，需要在新建数据库时使用新的 schema.sql
```

## 使用限制

1. 最大嵌套深度：5层
2. 分类移动时需避免循环引用
3. 删除父分类会级联删除所有子分类和书签（操作前会有确认提示）

## 向后兼容性

- 所有现有的根分类（没有 parent_id）自动视为根分类
- 现有的平面分类结构继续正常工作
- 不使用嵌套功能的用户不受影响
