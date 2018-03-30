package openaf.jline;

import jline.console.completer.ArgumentCompleter.AbstractArgumentDelimiter;

public class OpenAFArgumentDelimiter extends AbstractArgumentDelimiter {
	protected String[] argumentList;
	
	public OpenAFArgumentDelimiter(String s[]) {
		argumentList = s;
	}
	
	@Override
	public boolean isDelimiterChar(CharSequence buffer, int pos) {
		CharSequence c;
		String sbuffer = buffer.subSequence(0, pos+1).toString();
		boolean is = false;
		for(String sc : argumentList) {
			if(sbuffer.matches(sc)) return true;
		}
		return is;
	}

}
