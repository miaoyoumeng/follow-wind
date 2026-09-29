/** 单窗口布局 */
export const ONE_VALUE = ['one'] as const;
export type One = (typeof ONE_VALUE)[number];

/** 上下分栏布局 */
export const HORIZONTAL_VALUE = ['top', 'bottom'] as const;
export type Horizontal = (typeof HORIZONTAL_VALUE)[number];

/** 左右分栏布局 */
export const VERTICAL_VALUE = ['left', 'right'] as const;
export type Vertical = (typeof VERTICAL_VALUE)[number];

/** 左右分栏 + 右侧上下分栏（三 pane） */
export const LEFT_THREE_PANE_VALUE = ['left', 'right-top', 'right-bottom'] as const;
export type LeftThreePane = (typeof LEFT_THREE_PANE_VALUE)[number];

/** 左右分栏 + 左侧上下分栏（三 pane） */
export const RIGHT_THREE_PANE_VALUE = ['right', 'left-top', 'left-bottom'] as const;
export type RightThreePane = (typeof RIGHT_THREE_PANE_VALUE)[number];

/** 布局名称 → 位置集合映射（所有布局校验共用） */
export const LAYOUT_MAP = {
  One: new Set(ONE_VALUE),
  Horizontal: new Set(HORIZONTAL_VALUE),
  Vertical: new Set(VERTICAL_VALUE),
  LeftThreePane: new Set(LEFT_THREE_PANE_VALUE),
  RightThreePane: new Set(RIGHT_THREE_PANE_VALUE)
};

/** layouts 模块使用的 pane 位置值 */
export type PaneLayout = One | Horizontal | Vertical | LeftThreePane | RightThreePane;
