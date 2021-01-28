// Author: Nuno Aguiar
package openaf;

import org.fusesource.jansi.Ansi;

public class JAnsiRender {
    static public String render(String aStr) {
        /*String keys = null, values = null;
        Ansi res = null;

        if (aStr != null) {
            int pos = aStr.indexOf(" ");
            keys = aStr.substring(0, pos);
            values = aStr.substring(pos+1);

            res = Ansi.ansi();
            for(String sk : keys.split(",")) {
                String k = sk.toUpperCase();
                try {
                    if (k.indexOf("(") > 0 && k.indexOf(")") > 0) {
                        String c = k.substring(k.indexOf("(") + 1, k.indexOf(")"));
                        String[] cs = c.split(";");
                        if (cs.length == 3) {
                            if (k.indexOf("FG") >= 0) {
                                res = res.fgRgb(Integer.parseInt(cs[0]), Integer.parseInt(cs[1]), Integer.parseInt(cs[2]));
                            } else if (k.indexOf("BG") >= 0) {
                                res = res.bgRgb(Integer.parseInt(cs[0]), Integer.parseInt(cs[1]), Integer.parseInt(cs[2]));
                            }
                        }
                    }
                } catch(Exception e) {
                    //throw e;
                }

                switch(k) {
                case "BLACK"  : res = res.fg(Ansi.Color.BLACK); break;
                case "RED"  : res = res.fg(Ansi.Color.RED); break;
                case "GREEN"  : res = res.fg(Ansi.Color.GREEN); break;
                case "YELLOW"  : res = res.fg(Ansi.Color.YELLOW); break;
                case "BLUE"  : res = res.fg(Ansi.Color.BLUE); break;
                case "MAGENTA"  : res = res.fg(Ansi.Color.MAGENTA); break;
                case "CYAN"  : res = res.fg(Ansi.Color.CYAN); break;
                case "WHITE"  : res = res.fg(Ansi.Color.WHITE); break;

                case "FG_BLACK"  : res = res.fg(Ansi.Color.BLACK); break;
                case "FG_RED"  : res = res.fg(Ansi.Color.RED); break;
                case "FG_GREEN"  : res = res.fg(Ansi.Color.GREEN); break;
                case "FG_YELLOW"  : res = res.fg(Ansi.Color.YELLOW); break;
                case "FG_BLUE"  : res = res.fg(Ansi.Color.BLUE); break;
                case "FG_MAGENTA"  : res = res.fg(Ansi.Color.MAGENTA); break;
                case "FG_CYAN"  : res = res.fg(Ansi.Color.CYAN); break;
                case "FG_WHITE"  : res = res.fg(Ansi.Color.WHITE); break;

                case "FG_BRIGHT_BLACK"  : res = res.fgBright(Ansi.Color.BLACK); break;
                case "FG_BRIGHT_RED"  : res = res.fgBright(Ansi.Color.RED); break;
                case "FG_BRIGHT_GREEN"  : res = res.fgBright(Ansi.Color.GREEN); break;
                case "FG_BRIGHT_YELLOW"  : res = res.fgBright(Ansi.Color.YELLOW); break;
                case "FG_BRIGHT_BLUE"  : res = res.fgBright(Ansi.Color.BLUE); break;
                case "FG_BRIGHT_MAGENTA"  : res = res.fgBright(Ansi.Color.MAGENTA); break;
                case "FG_BRIGHT_CYAN"  : res = res.fgBright(Ansi.Color.CYAN); break;
                case "FG_BRIGHT_WHITE"  : res = res.fgBright(Ansi.Color.WHITE); break;

                case "BG_WHITE": res = res.bg(Ansi.Color.WHITE); break;
                case "BG_BLACK"  : res = res.bg(Ansi.Color.BLACK); break;
                case "BG_RED"  : res = res.bg(Ansi.Color.RED); break;
                case "BG_GREEN"  : res = res.bg(Ansi.Color.GREEN); break;
                case "BG_YELLOW"  : res = res.bg(Ansi.Color.YELLOW); break;
                case "BG_BLUE"  : res = res.bg(Ansi.Color.BLUE); break;
                case "BG_MAGENTA"  : res = res.bg(Ansi.Color.MAGENTA); break;
                case "BG_CYAN"  : res = res.bg(Ansi.Color.CYAN); break;

                case "BG_BRIGHT_BLACK"  : res = res.bgBright(Ansi.Color.BLACK); break;
                case "BG_BRIGHT_RED"  : res = res.bgBright(Ansi.Color.RED); break;
                case "BG_BRIGHT_GREEN"  : res = res.bgBright(Ansi.Color.GREEN); break;
                case "BG_BRIGHT_YELLOW"  : res = res.bgBright(Ansi.Color.YELLOW); break;
                case "BG_BRIGHT_BLUE"  : res = res.bgBright(Ansi.Color.BLUE); break;
                case "BG_BRIGHT_MAGENTA"  : res = res.bgBright(Ansi.Color.MAGENTA); break;
                case "BG_BRIGHT_CYAN"  : res = res.bgBright(Ansi.Color.CYAN); break;
                case "BG_BRIGHT_WHITE"  : res = res.bgBright(Ansi.Color.WHITE); break;

                case "BOLD": res = res.bold(); break;
                case "FAINT": res = res.a(Ansi.Attribute.INTENSITY_BOLD_OFF); break;
                case "INTENSITY_BOLD": res = res.a(Ansi.Attribute.INTENSITY_BOLD); break;
                case "INTENSITY_FAINT": res = res.a(Ansi.Attribute.INTENSITY_FAINT); break;
                case "ITALIC": res = res.a(Ansi.Attribute.ITALIC); break;
                case "ITALIC_OFF": res = res.a(Ansi.Attribute.ITALIC_OFF); break;
                case "UNDERLINE": res = res.a(Ansi.Attribute.UNDERLINE); break;
                case "BLINK_SLOW": res = res.a(Ansi.Attribute.BLINK_SLOW); break;
                case "BLINK_FAST": res = res.a(Ansi.Attribute.BLINK_FAST); break;
                case "BLINK_OFF": res = res.a(Ansi.Attribute.BLINK_OFF); break;
                case "NEGATIVE_ON": res = res.a(Ansi.Attribute.NEGATIVE_ON); break;
                case "NEGATIVE_OFF": res = res.a(Ansi.Attribute.NEGATIVE_OFF); break;
                case "CONCEAL_ON": res = res.a(Ansi.Attribute.CONCEAL_ON); break;
                case "CONCEAL_OFF": res = res.a(Ansi.Attribute.CONCEAL_OFF); break;
                case "UNDERLINE_DOUBLE": res = res.a(Ansi.Attribute.UNDERLINE_DOUBLE); break;
                case "UNDERLINE_OFF": res = res.a(Ansi.Attribute.UNDERLINE_OFF); break;
                case "STRIKETHROUGH_ON": res = res.a(Ansi.Attribute.STRIKETHROUGH_ON); break;
                case "STRIKETHROUGH_OFF": res = res.a(Ansi.Attribute.STRIKETHROUGH_OFF); break;
                case "INTENSITY_BOLD_OFF": res = res.a(Ansi.Attribute.INTENSITY_BOLD_OFF); break;
                }
            }
            return res.a(values).reset().toString();
        } else {
            return null;
        }*/

        return null;
    }
}
