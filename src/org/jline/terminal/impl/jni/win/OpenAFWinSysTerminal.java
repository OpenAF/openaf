package org.jline.terminal.impl.jni.win;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import com.sun.jna.Pointer;
import com.sun.jna.platform.win32.WinNT;
import org.jline.nativ.Kernel32;
import org.jline.terminal.Terminal;
import org.jline.terminal.spi.TerminalProvider;
import org.jline.terminal.spi.SystemStream;

/** Small JLine bridge: its normal Windows factory uses redirected standard handles. */
public final class OpenAFWinSysTerminal extends NativeWinSysTerminal {
    private final WinNT.HANDLE inputHandle, outputHandle;

    private OpenAFWinSysTerminal(TerminalProvider provider, WinNT.HANDLE input, int inputMode,
                                WinNT.HANDLE output, int outputMode, boolean ansi) throws IOException {
        super(provider, SystemStream.Error, new NativeWinConsoleWriter(address(output)),
            "OpenAF-interactive", ansi ? "windows-vtp" : "windows", StandardCharsets.UTF_8,
            true, Terminal.SignalHandler.SIG_DFL, address(input), inputMode, address(output), outputMode);
        inputHandle = input;
        outputHandle = output;
    }
    private static long address(WinNT.HANDLE handle) { return Pointer.nativeValue(handle.getPointer()); }

    public static OpenAFWinSysTerminal open(TerminalProvider provider) throws IOException {
        com.sun.jna.platform.win32.Kernel32 kernel = com.sun.jna.platform.win32.Kernel32.INSTANCE;
        WinNT.HANDLE input = kernel.CreateFile("CONIN$", WinNT.GENERIC_READ | WinNT.GENERIC_WRITE,
            WinNT.FILE_SHARE_READ | WinNT.FILE_SHARE_WRITE, null, WinNT.OPEN_EXISTING, 0, null);
        WinNT.HANDLE output = kernel.CreateFile("CONOUT$", WinNT.GENERIC_READ | WinNT.GENERIC_WRITE,
            WinNT.FILE_SHARE_READ | WinNT.FILE_SHARE_WRITE, null, WinNT.OPEN_EXISTING, 0, null);
        int[] inMode = new int[1], outMode = new int[1];
        boolean haveOutputMode = false;
        try {
            if (Kernel32.GetConsoleMode(address(input), inMode) == 0 ||
                Kernel32.GetConsoleMode(address(output), outMode) == 0)
                throw new IOException("No controlling Windows console is available");
            haveOutputMode = true;
            boolean ansi = Kernel32.SetConsoleMode(address(output), outMode[0] | 4) != 0;
            OpenAFWinSysTerminal terminal = new OpenAFWinSysTerminal(provider, input, inMode[0], output, outMode[0], ansi);
            terminal.resume();
            return terminal;
        } catch (IOException | RuntimeException e) {
            if (haveOutputMode) Kernel32.SetConsoleMode(address(output), outMode[0]);
            kernel.CloseHandle(input);
            kernel.CloseHandle(output);
            throw e;
        }
    }
    @Override
    protected void doClose() throws IOException {
        try { super.doClose(); }
        finally {
            com.sun.jna.platform.win32.Kernel32.INSTANCE.CloseHandle(inputHandle);
            com.sun.jna.platform.win32.Kernel32.INSTANCE.CloseHandle(outputHandle);
        }
    }
}
