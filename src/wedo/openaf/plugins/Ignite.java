package wedo.openaf.plugins;

import java.io.IOException;

import java.util.Collection;
import org.apache.ignite.IgniteLogger;
import org.apache.ignite.Ignition;
import org.apache.ignite.configuration.IgniteConfiguration;
import org.apache.ignite.logger.NullLogger;
import org.apache.ignite.logger.java.JavaLogger;
import org.apache.ignite.lang.IgniteCallable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

import wedo.openaf.AFCmdBase;

public class Ignite extends ScriptableObject {
	/**
	 * 
	 */
	private static final long serialVersionUID = -1058394978145136847L;
	protected IgniteConfiguration config = new IgniteConfiguration();
	protected org.apache.ignite.Ignite ignite;

	@JSFunction
	public static Object broadcast(Object i, final String s) {
		Collection<Object> res = ((org.apache.ignite.Ignite) i).compute().broadcast(new IgniteCallable<Object>() {
			@Override public Object call() {
				return wedo.openaf.AFBase.eval("(new Function(\"" + s + "\"))()");
			}
		});
		return AFCmdBase.jse.newArray(AFCmdBase.jse.getGlobalscope(), res.toArray());
	}

	@JSFunction
	public static Object call(Object i, final String s) {
		Object res = ((org.apache.ignite.Ignite) i).compute().call(new IgniteCallable<Object>() {
			@Override public Object call() {
				return wedo.openaf.AFBase.eval("(new Function(\"" + s + "\"))()");
			}
		});
		return res;
	}

	@Override
	public String getClassName() {
		return "Ignite";
	}

	/**
	 * <odoc>
	 * <key>Ignite.Ignite(shouldLog)</key>
	 * Setups an Apache Ignite node with no logging (unless shouldLog = true)
	 * </odoc>
	 */
	@JSConstructor
	public void newIgnite(boolean shouldLog) throws IOException {
		IgniteLogger log;
		if (shouldLog)
			log = new JavaLogger();
		else
			log = new NullLogger();
		config.setGridLogger(log);
	}
	
	/**
	 * <odoc>
	 * <key>Ignite.getConfiguration() : IgniteConfiguration</key>
	 * Retrieves the current Apache Ignite configuration.
	 * </odoc>
	 */
	@JSFunction
	public Object getConfiguration() {
		return config;
	}
	
	/**
	 * <odoc>
	 * <key>Ignite.getIgnite() : Ignite</key>
	 * Retrieves the Apache Ignite object.
	 * </odoc>
	 */
	@JSFunction
	public Object getIgnite() {
		return ignite;
	}
	
	/**
	 * <odoc>
	 * <key>Ignite.start(aName, secretKey, isClient)</key>
	 * Starts an Ignite grid. Optionally you can provide the grid aName, a secret key and determine if it's a client.
	 * </odoc>
	 * @throws IllegalAccessException 
	 * @throws InstantiationException 
	 */
	@JSFunction
	public void start(Object name, Object secretKey, boolean isClient) throws InstantiationException, IllegalAccessException {
		if (isClient) config.setClientMode(true);
		if (secretKey != null && !(secretKey instanceof Undefined))
			config.getConnectorConfiguration().setSecretKey(AFCmdBase.afc.dIP((String) secretKey));
		if (name != null && !(name instanceof Undefined)) config.setIgniteInstanceName((String) name);
		Ignition.getOrStart(config);
		if (name == null || name instanceof Undefined) {
			ignite = Ignition.ignite();
		} else {
			//config.setIgniteInstanceName((String) name);
			ignite = Ignition.ignite((String) name);
		}
	}
	
	/**
	 * <odoc>
	 * <key>Ignite.stop(aName, cancel)</key>
	 * Stops the current Ignite grid. Optionally providing the grid name and cancel = true to cancel all current jobs.
	 * </odoc>
	 */
	@JSFunction
	public void stop(Object name, boolean cancel) {
		if (name == null || name instanceof Undefined) {
			Ignition.stop(cancel);
		} else {
			Ignition.stop((String) name, cancel);
		}
	}
	
	/**
	 * <odoc>
	 * <key>Ignite.stopAll(cancel)</key>
	 * Stops all accessible Ignite grids. Optionally with cancel = true to cancel all current jobs. 
	 * </odoc>
	 */
	@JSFunction
	public void stopAll(boolean cancel) {
		Ignition.stopAll(cancel);
	}
}
