package de.vandermeer.asciitable.v2.themes;

public enum OpenAFRowThemes {

	OPENAF_UTF_LIGHT_TOP					('╭', '─', '─', '┬', '╮', '─', "OpenAF UTF-8 light (single) lines vertically and horizontally for top rule"),

	OPENAF_UTF_LIGHT_MID					('├', '┴', '┼', '┬', '┤', '─', "OpenAF UTF-8 light (single) lines vertically and horizontally for mid rule"),

	OPENAF_UTF_LIGHT_BOTTOM				    ('╰', '┴', '─', '─', '╯', '─', "OpenAF UTF-8 light (single) lines vertically and horizontally for bottom rule"),

	OPENAF_UTF_LIGHT_CONTENT				('│', '│', '│', '│', '│', ' ', "OpenAF UTF-8 light (single) lines vertically and horizontally for content row")

	;

	V2_RowThemeBuilder builder = new V2_RowThemeBuilder();

	private OpenAFRowThemes(char leftBorder, char midBorderUp, char midBorderAll, char midBorderDown, char rightBorder, char mid, String description){
		this.builder
			.setDescription(description)
			.setLeftBorder(leftBorder)
			.setRightBorder(rightBorder)
			.setMid(mid)
			.setMidBorderAll(midBorderAll)
			.setMidBorderDown(midBorderDown)
			.setMidBorderUp(midBorderUp)
		;
		ThemeValidator.validateRowTheme(this.builder.build());
	}

	/**
	 * Returns the actual theme.
	 * @return the theme
	 */
	public V2_RowTheme get(){
		return this.builder.build();
	}
   
}