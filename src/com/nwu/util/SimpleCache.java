/**       
 *	   Licensed to the Apache Software Foundation (ASF) under one
 *     or more contributor license agreements.  See the NOTICE file
 *     distributed with this work for additional information
 *     regarding copyright ownership.  The ASF licenses this file
 *     to you under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */
package com.nwu.util;

import java.util.HashMap;

/**
 * This is a simple cache implementation to hold objects between counter cycles
 * 
 * @author Nuno Aguiar <nuno@aguiar.name>
 *
 */
public class SimpleCache {
	protected HashMap<String, CacheableObject> cache = new HashMap<String,CacheableObject>();
	protected HashMap<String, Long> cacheAge = new HashMap<String,Long>();
	protected HashMap<String, Long> cacheLimitAge = new HashMap<String,Long>();
	
	protected SimpleCacheConfig conf;
	
	public SimpleCache(SimpleCacheConfig conf) {
		this.conf = conf;
	}
	
	public int getNumberOfCurrentCachedObjects() {
		return cache.size();
	}
	
	/**
	 * Is the specified key still valid given the limits of "age" in cache parameterized?
	 * 
	 * @param key The cache key
	 * @return True if it's valid. False otherwise.
	 */
	protected boolean stillYoungEnough(String key) {
		if (cacheAge.containsKey(key)) {
			if (cacheLimitAge.containsKey(key)) {
				if (cacheLimitAge.get(key).longValue() - ( conf.getCurrentCounter() - ((Long) (cacheAge.get(key))).longValue() ) <= 0 ) {
					return false;
				} else {
					return true;
				}
			} else {
				if (conf.getLimitObjectInCacheAge() < 0) {
					return true;
				} else if ( conf.getLimitObjectInCacheAge() - ( conf.getCurrentCounter() - ((Long) (cacheAge.get(key))).longValue() ) <= 0 ) {
					return false;
				} else {
					return true;
				}			
			}

		} else {
			return false;
		}
	}
	
	/**
	 * Adds an object to the cache.
	 * 
	 * @param key The key to reference the object to be added to cache
	 * @param obj The object to be cached (should be extended from CacheableObject)
	 */
	public void addObjectToCache(String key, CacheableObject obj) {
		cache.put(key, obj);
		cacheAge.put(key, conf.getCurrentCounter());
	}
	
	/**
	 * Adds an object to the cache but with a implicit time limit
	 * 
	 * @param key
	 * @param obj
	 * @param timeLimit This limit is defined in number of counter cycles
	 */
	public void addObjectToCacheWithTimeLimit(String key, CacheableObject obj, long timeLimit) {
		addObjectToCache(key, obj);
		cacheLimitAge.put(key, new Long(timeLimit));
	}
	
	public boolean isObjectStillValid(String key) {
		boolean stillValid = false;
		if (cache.containsKey(key)) {
			if (stillYoungEnough(key)) {
				stillValid = true;
			} else {
				invalidateObject(key);
			}
		}
			
		return stillValid;
	}
	
	public void invalidateObject(String key) {
		cache.remove(key);
		cacheAge.remove(key);
		if (cacheLimitAge.containsKey(key)) {
			cacheLimitAge.remove(key);
		}
	}
	
	public CacheableObject getCachedObject(String key) {
		if (isObjectStillValid(key)) {
			return cache.get(key);
		} else {
			return null;
		}
	}
	
}
