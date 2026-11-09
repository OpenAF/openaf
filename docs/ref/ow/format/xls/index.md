# ow.format.xls

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.format](../index.md) / [ow.format.xls](index.md)

<a id="api-ow-format-xls-autofilter-151ba3b1"></a>

## ow.format.xls.autoFilter

### ow.format.xls.autoFilter(aXLS, aXLSSheet, aRange)

Applies a auto filter on the provided `aXLS` and `aXLSSheet` object (from XLS.getSheet) to `aRange`.

Example:

```javascript
ow.format.xls.autoFilter(sheet, "A1:D1");
```

Sources:

- js/owrap.format.js:6313

<a id="api-ow-format-xls-getstyle-684feb5b"></a>

## ow.format.xls.getStyle

### ow.format.xls.getStyle(aXLS, aStyleMap)

Creates a cell styler object, for the `aXLS` object (XLS plugin object instance), given the provided `aStyleMap`.
The `aStyleMap` can have the following keys to define a style:

- `bold` (boolean)
- `italic` (boolean)
- `underline` (boolean)
- `strikeout` (boolean)
- `fontPoints` (number)
- `fontName` (string)
- `fontColor` (string)
- `wrapText` (boolean)
- `shrinkToFit` (boolean)
- `backgroundColor` (string)
- `foregroundColor` (string)
- `borderBottom` (string)
- `borderLeft` (string)
- `borderRight` (string)
- `borderTop` (string)
- `borderLeftColor` (string)
- `borderRightColor` (string)
- `borderTopColor` (string)
- `borderBottomColor` (string)
- `rotation` (number)
- `indention` (number)
- `valign` ("top", "bottom", "center", "justify")
- `align` ("center", "centerSelection", "fill", "general", "justify", "left", "right")

Color names:

`aqua`, `auto`, `black`, `blue`, `blue_grey`, `bright_green`, `brown`, `coral`, `cornflower_blue`, `dark_blue`, `dark_green`, `dark_red`, `dark_teal`, `dark_yellow`, `gold`, `green`, `grey25`, `grey40`, `grey50`, `grey80`, `indigo`, `lavender`, `lemon_chiffon`, `light_blue`, `light_cornflower_blue`, `light_green`, `light_orange`, `light_turquoise`, `light_yellow`, `lime`, `maroon`, `olive_green`, `orange`, `orchid`, `pale_blue`, `pink`, `plum`, `red`, `rose`, `royal_blue`, `sea_green`, `sky_blue`, `tan`, `teal`, `turquoise`, `violet`, `white`, `yellow`

Border names:

`dash_dot`, `dash_dot_dot`, `dashed`, `dotted`, `double`, `hair`, `medium`, `medium_dash_dot`, `medium_dash_dot_dot`, `medium_dashed`, `none`, `slanted_dash_dot`, `thick`, `thin`

Fill patterns:

`solid_foreground`

Sources:

- js/owrap.format.js:6198

<a id="api-ow-format-xls-settable-d320282f"></a>

## ow.format.xls.setTable

### ow.format.xls.setTable(aXLS, aSheet, aColumn, aRow, anArray, shouldAutoFilter, headerStyle, linesStyle)

Shortcut for xls.setTable that given aXLS object, a corresponding aSheet object will try to set the contents of  anArray of maps starting in aColumn and aRow performing auto size for all columns. If shouldAutoFilter = true is will also add an autofilter to all columns. It's possible also to customize the headerStyle and linesStyle.

Sources:

- js/owrap.format.js:6419

