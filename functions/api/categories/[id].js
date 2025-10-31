// PUT update category (support nested structure)
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = Number(params.id);
  
  try {
    const body = await request.json();
    const { name, parent_id, position } = body;
    
    const existing = await env.DB.prepare(
      'SELECT id, parent_id, depth, position FROM categories WHERE id = ?'
    ).bind(id).first();
    
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 处理 parent_id 更新
    let newParentId = existing.parent_id;
    let newDepth = existing.depth;
    const parentProvided = Object.prototype.hasOwnProperty.call(body, 'parent_id');
    if (parentProvided) {
      if (parent_id === id) {
        return new Response(JSON.stringify({ error: 'Category cannot be its own parent' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (parent_id === null || parent_id === undefined) {
        newParentId = null;
        newDepth = 0;
      } else {
        const parent = await env.DB.prepare(
          'SELECT id, parent_id, depth FROM categories WHERE id = ?'
        ).bind(parent_id).first();
        
        if (!parent) {
          return new Response(JSON.stringify({ error: 'Parent category not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // 检查循环引用
        let currentParentId = parent.parent_id;
        while (currentParentId !== null && currentParentId !== undefined) {
          if (currentParentId === id) {
            return new Response(JSON.stringify({ error: 'Cannot set descendant as parent' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          const ancestor = await env.DB.prepare(
            'SELECT parent_id FROM categories WHERE id = ?'
          ).bind(currentParentId).first();
          currentParentId = ancestor?.parent_id ?? null;
        }
        
        newParentId = parent_id;
        newDepth = parent.depth + 1;
        
        if (newDepth > 5) {
          return new Response(JSON.stringify({ error: 'Maximum nesting depth (5) exceeded' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    // 处理 position
    let newPosition = existing.position;
    const positionProvided = Object.prototype.hasOwnProperty.call(body, 'position');
    if (positionProvided && typeof position === 'number') {
      newPosition = position;
    } else if (parentProvided && newParentId !== existing.parent_id) {
      const whereClause = newParentId ? 'WHERE parent_id = ?' : 'WHERE parent_id IS NULL';
      const query = `SELECT COALESCE(MAX(position), -1) as position FROM categories ${whereClause}`;
      const { position: maxPosition } = newParentId
        ? await env.DB.prepare(query).bind(newParentId).first()
        : await env.DB.prepare(query).first();
      newPosition = (maxPosition || -1) + 1;
    }
    
    await env.DB.prepare(
      'UPDATE categories SET name = ?, parent_id = ?, depth = ?, position = ? WHERE id = ?'
    ).bind(name, newParentId || null, newDepth, newPosition, id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE category (cascade delete bookmarks)
export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = params.id;
  
  try {
    // D1支持外键级联删除
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

