import { type Node } from "@figma/rest-api-spec";

/**
 * 将 Figma Node 的样式属性映射为 Tailwind CSS class 和必要的 style
 * 返回 { className, style }，className 用于 Tailwind，style 用于无法 class 化的属性
 */
export function getTailwindcssRuleClassNameAndStyle(node: Node): { className: string; style: Record<string, unknown> } {
  const classNames: string[] = [];
  const style: Record<string, unknown> = {};

  // 1. 尺寸（仅部分节点有）
  if (
    'width' in node && typeof node.width === 'number' &&
    'height' in node && typeof node.height === 'number'
  ) {
    classNames.push(`w-[${node.width}px]`);
    classNames.push(`h-[${node.height}px]`);
  }

  // 2. 位置（仅部分节点有）
  if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
    classNames.push('absolute');
    style.left = node.absoluteBoundingBox.x;
    style.top = node.absoluteBoundingBox.y;
  }

  // 3. 背景色（仅部分节点有）
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      const { r, g, b, a } = fill.color;
      const rgb = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a ?? 1})`;
      style.backgroundColor = rgb;
    }
    // 渐变、图片等复杂 fill 可扩展
  }

  // 4. 圆角（仅部分节点有）
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    classNames.push(`rounded-[${node.cornerRadius}px]`);
  }

  // 5. 阴影（仅部分节点有）
  if ('effects' in node && Array.isArray(node.effects)) {
    const shadow = node.effects.find(e => e.type === 'DROP_SHADOW' && typeof e === 'object' && 'offset' in e && 'radius' in e && 'color' in e && e.visible !== false);
    if (shadow && shadow.type === 'DROP_SHADOW') {
      const s = shadow as { offset: { x: number; y: number }; radius: number; color: { a: number } };
      style.boxShadow = `${s.offset?.x ?? 0}px ${s.offset?.y ?? 0}px ${s.radius ?? 0}px rgba(0,0,0,${s.color?.a ?? 0.5})`;
    }
  }

  // 6. 字体（仅 TEXT 节点）
  if (node.type === 'TEXT' && 'style' in node && node.style) {
    if ('fontSize' in node.style && node.style.fontSize) classNames.push(`text-[${node.style.fontSize}px]`);
    if ('fontWeight' in node.style && node.style.fontWeight) classNames.push(`font-[${node.style.fontWeight}]`);
    if ('textAlignHorizontal' in node.style && node.style.textAlignHorizontal) {
      if (node.style.textAlignHorizontal === 'CENTER') classNames.push('text-center');
      if (node.style.textAlignHorizontal === 'RIGHT') classNames.push('text-right');
      if (node.style.textAlignHorizontal === 'LEFT') classNames.push('text-left');
    }
    if ('lineHeightPx' in node.style && node.style.lineHeightPx) style.lineHeight = `${node.style.lineHeightPx}px`;
    if ('letterSpacing' in node.style && node.style.letterSpacing) style.letterSpacing = `${node.style.letterSpacing}px`;
    if ('fill' in node.style && node.style.fill && typeof node.style.fill === 'object' && 'type' in node.style.fill && node.style.fill.type === 'SOLID' && 'color' in node.style.fill && node.style.fill.color) {
      const { r, g, b, a } = node.style.fill.color as { r: number; g: number; b: number; a?: number };
      style.color = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a ?? 1})`;
    }
  }

  // 7. 自动布局（Auto Layout）
  if ('layoutMode' in node && (node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL')) {
    classNames.push('flex');
    if (node.layoutMode === 'VERTICAL') classNames.push('flex-col');
    // 主轴对齐
    if ('primaryAxisAlignItems' in node) {
      if (node.primaryAxisAlignItems === 'MIN') classNames.push('justify-start');
      else if (node.primaryAxisAlignItems === 'CENTER') classNames.push('justify-center');
      else if (node.primaryAxisAlignItems === 'MAX') classNames.push('justify-end');
      else if (node.primaryAxisAlignItems === 'SPACE_BETWEEN') classNames.push('justify-between');
    }
    // 交叉轴对齐
    if ('counterAxisAlignItems' in node) {
      if (node.counterAxisAlignItems === 'MIN') classNames.push('items-start');
      else if (node.counterAxisAlignItems === 'CENTER') classNames.push('items-center');
      else if (node.counterAxisAlignItems === 'MAX') classNames.push('items-end');
    }
    // 间距
    if ('itemSpacing' in node && typeof node.itemSpacing === 'number' && node.itemSpacing > 0) {
      classNames.push(`gap-[${node.itemSpacing}px]`);
    }
    // 内边距
    if ('paddingLeft' in node && typeof node.paddingLeft === 'number' && node.paddingLeft > 0) classNames.push(`pl-[${node.paddingLeft}px]`);
    if ('paddingRight' in node && typeof node.paddingRight === 'number' && node.paddingRight > 0) classNames.push(`pr-[${node.paddingRight}px]`);
    if ('paddingTop' in node && typeof node.paddingTop === 'number' && node.paddingTop > 0) classNames.push(`pt-[${node.paddingTop}px]`);
    if ('paddingBottom' in node && typeof node.paddingBottom === 'number' && node.paddingBottom > 0) classNames.push(`pb-[${node.paddingBottom}px]`);
  }

  return {
    className: classNames.join(' '),
    style,
  };
}
