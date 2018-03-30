package openaf.plugins;

import java.io.IOException;

import jline.console.ConsoleReader;

import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import biz.source_code.utils.RawConsoleInput;

/**
 * Core Console plugin
 * OpenAF plugin to provide console features (based on jline)
 * 
 * @author Nuno Aguiar
 *
 */
public class Console extends ScriptableObject {

	/**
	 * 
	 */
	private static final long serialVersionUID = 2822583540432845379L;
	protected ConsoleReader cr;

	/**
	 * Obtain the class name
	 */
	@Override
	public String getClassName() {
		return "Console";
	}
	
	/**
	 * <odoc>
	 * <key>Console.console()</key>
	 * Creates a new instance of the object Console.
	 * </odoc>
	 */
	@JSConstructor
	public void newConsole() throws IOException {
		cr = new ConsoleReader();
	}
	
	/** 
	 * <odoc>
	 * <key>Console.readLinePrompt(aPrompt, aMaskchar) : String</key>
	 * Read a line from the console providing aPrompt. Will provide a mask
	 * for introduction of passwords if aMaskchar is provided. Returns the
	 * line read.
	 * NOTE: Use this method instead of Console.readLine if you are using a prompt
	 * </odoc>
	 */
	@JSFunction
	public String readLinePrompt(String prompt, String maskChar) throws IOException {
		Character c;
		if (maskChar != null &&
			!maskChar.equals("undefined") && 
			maskChar.length() > 0) 
			c = Character.valueOf(maskChar.charAt(0));
		else 
			return cr.readLine(prompt);
		
		return cr.readLine(prompt, c);		
	}
	
	/**
	 * <odoc>
	 * <key>Console.readLine(aMaskchar) : String</key>
	 * Read a line from the console. Will provide a mask for introduction
	 * of passwords if aMaskchar is provided. Returns the line read.
	 * NOTE: Use Console.readLinePrompt if you are using a prompt.
	 * </odoc>
	 */
	@JSFunction
	public String readLine(String maskChar) throws IOException {
		Character c;
		if (maskChar != null &&
			!maskChar.equals("undefined") && 
			maskChar.length() > 0) 
			c = Character.valueOf(maskChar.charAt(0));
		else 
			return cr.readLine();
		
		return cr.readLine(c);
	}
	
	/**
	 * <odoc>
	 * <key>Console.readChar(allowed) : char</key>
	 * Read a character from the console. If allowed is provided only the
	 * characters on the string allowed will be considered.
	 * </odoc>
	 */
	@JSFunction
	public char readChar(String allowed) throws IOException {
		char[] arrayOfChars = null;
		if (allowed != null &&
			allowed.length() > 0)
			arrayOfChars = allowed.toCharArray();
		else 
			return (char) cr.readCharacter();
		
		return (char) cr.readCharacter(arrayOfChars);
	}
	
	/**
	 * <odoc>
	 * <key>Console.readCharNB() : number</key>
	 * Low level character read from the console with no waiting. Will
	 * return -1 for EOF or -2 for No character available or the available character
	 * </odoc>
	 */
	@JSFunction
	public int readCharNB() throws IOException {
		RawConsoleInput.resetConsoleMode();
		return RawConsoleInput.read(false);
	}
	
	/**
	 * <odoc>
	 * <key>Console.readCharB() : int</key>
	 * Low level character read from console with waiting. Will return
	 * -1 - EOF or -2 - No character available or the available character
	 * </odoc>
	 */
	@JSFunction
	public int readCharB() throws IOException {
		RawConsoleInput.resetConsoleMode();
		return RawConsoleInput.read(true);
	}
	/**
	 * <odoc>
	 * <key>Console.getConsoleReader() : ConsoleReader</key>
	 * Returns the internal ConsoleReader java object.
	 * </odoc>
	 */
	@JSFunction
	public ConsoleReader getConsoleReader() {
		return cr;
	}

}
