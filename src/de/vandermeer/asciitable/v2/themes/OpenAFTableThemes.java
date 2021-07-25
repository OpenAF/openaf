package de.vandermeer.asciitable.v2.themes;

public enum OpenAFTableThemes {

	OPENAF_UTF_LIGHT(
			OpenAFRowThemes.OPENAF_UTF_LIGHT_TOP,
			OpenAFRowThemes.OPENAF_UTF_LIGHT_MID,
			OpenAFRowThemes.OPENAF_UTF_LIGHT_BOTTOM,
			OpenAFRowThemes.OPENAF_UTF_LIGHT_CONTENT,
			"UTF-8 light (single) lines vertically and horizontally"
	);

	/** Local theme. */
	V2_TableTheme theme;

	OpenAFTableThemes(OpenAFRowThemes top, OpenAFRowThemes mid, OpenAFRowThemes bottom, OpenAFRowThemes content, String description){
		this.theme = new AbstractTableTheme(top.get(), mid.get(), bottom.get(), content.get(), description);
		ThemeValidator.validateTableTheme(this.theme);
	}

	OpenAFTableThemes(OpenAFRowThemes top, OpenAFRowThemes topStrong, OpenAFRowThemes mid, OpenAFRowThemes midStrong, OpenAFRowThemes bottom, OpenAFRowThemes bottomStrong, OpenAFRowThemes content, String description){
		this.theme = new AbstractTableTheme(top.get(), topStrong.get(), mid.get(), midStrong.get(), bottom.get(), bottomStrong.get(), content.get(), description);
		ThemeValidator.validateTableTheme(this.theme);
	}

	public V2_TableTheme get(){
		return this.theme;
	}

}