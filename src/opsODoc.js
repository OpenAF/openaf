// GENERIC
// ********************************************************************************************************************

/**
 * <odoc>
 * <key>Ping</key>
 * \
 * In: any Map\
 * Out: Up to version &lt;= 6.3.x this operation would only return a empty Map. From version &gt;= 7.0.x this operation 
 * will return the input Map.\
 * Version: >= 6.3
 * </odoc> 
 */

// OBJECT (OMT)
// ********************************************************************************************************************


/**
 * <odoc>
 * <key>GetObjectNameAndSecurity</key>
 * \
 * In: (optional) { "objTypes": ["Mashup", ...] }\
 * Out: { "objTypes": { "Mashup": [...], "...": [...] } }\
 * Version: >= 7.1\
 * \
 * If no input Map is provided it will output a Map consisting of an array per registered object type entry. Each
 * entry on the array will consist of the object's SpecUUID, Name, Owner, Description, Visibility and corresponding Permissions.
 * If a input Map is provided consisting of a objTypes array of object types the output will be restricted to those object types.
 * </odoc>
 */

/**
 * <odoc>
 * <key>GetObjectTypes</key>
 * \
 * In: { "secure": true }\
 * Out: { "objTypes": [ { "ChildObjTypes": [], "Name": ..., "Desc": ..., "IconClass": ..., "LifecycleUUID": ... } ] }\
 * Version: >= 7.1\
 * \
 * Retrieves the current list of object types (specifying if secure or not). The list is returned on a objTypes array which
 * specifies the child object types, name, description, icon class and lifecycle UUID.
 * </odoc>
 */

/**
 * <odoc>
 * <key>GetObjectByUUID</key>
 * \
 * In: { "uuid": "...", (optional) "loadTags": true }\
 * Out: the object metadata and definition\
 * Version: >= 7.1\
 * \
 * Retrieves the specified object metadata and definition for the provided UUID. Optionally you can specify if you want the object's
 * corresponding tags to be retrieved.
 * </odoc>
 */

/**
 * <odoc>
 * <key>GetObjectByVersion</key>
 * \
 * In: { "SpecUUID": "...", (optional) "objUUID": "...", (optional) "statusName": "...", (optional) "lock": true, (optional) "ignoreSession": true, (optional) "loadTags": true }\
 * Out: the object metadata and definition\
 * Version: >= 7.1\
 * \
 * Retrieves the specified object Spec metadata and definition. Optional you can provide the object version UUID, status name and you 
 * can lock it for edition, ignoring other sessions locking or not, and including tags if specified.
 * </odoc>
 */

/**
 * <odoc>
 * <key>GetObjectPrivileges</key>
 * \
 * In: { "uuids": ["...", ...] }\
 * Out: { "objects": [ ... ] }\
 * Version: >= 7.1\
 * \
 * Retrieves the corresponding object uuids (list in an array) privileges. 
 * </odoc>
 */

/**
 * <odoc>
 * <key>GetAllObjects</key>
 * \
 * In: { (optional) "objType": "...", (optional) "loadMetadata": true, (optional) "loadObjDefintion": true, (optional) "loadTags": true, (optional) "properties": [ "..." ], ... }\
 * Out: { "objects": [ ... ], "hasCreatePermission": true }\
 * Version: >= 7.1\
 * \
 * Retrieves all objects metadata (e.g. objType, permissions, ...). Optionally you can specify to not load metadata (by default it's true),
 * to load the object's definition and the object associated tags. You can optional also add to the input map the following options:\
 * \
 *    - allVersions :boolean\
 *    - filterByCreator :boolean\
 *    - filterByActive :boolean\
 *    - recentlyUsed :boolean\
 *    - filterByOwners :array\
 *    - filterByOneOfTags :array\
 *    - filterByTags :array\
 *    - filterByProperties :map\
 *    - shortnameOrDescrLike :string\
 *    - shortnameOrDescrLikeIgnoreCase :string\
 *    - orderByShortNameIgnoreCase :boolean\
 *    - statusNameList :array\
 * \
 * </odoc>
 */

/**
 * <odoc>
 * <key>DeleteObjects</key>
 * \
 * In: { "uuidList": [ ... ], (optional) "deleteCascade": true } \
 * Out:\
 * Version: >= 7.1\
 * \
 * Marks the uuidList of objects as deleted. If deleteCascade is provided it will delete dependent objects also.
 * </odoc>
 */

/**
 * <odoc>
 * <key>Export</key>
 * \
 * In: { "objTypes": [...], "noFile": false, "pMapFormat": true, "exportDir": "/some/dir", "ParameterMapName": "aName", "uuids": [...], singleFile: true }\
 * Out: { "Types" : { objType: [...], ... } }\
 * Version: >= 7.1\
 * \
 * Exports the corresponding objTypes to the output Map. Optionally a list to restrict the objects to export can be provided with uuids. 
 * If noFile is false it will not return the export to the output Map but rather create files or a single file (singleFile) per objType on the provided
 * exportDir (on the server system). 
 * </odoc>
 */

/** 
 * <odoc>
 * <key>UnlockObjects</key>
 * \
 * In: { "uuidList": [...] }\
 * Out: { }\
 * Version: >= 7.1\
 * \
 * Tries to unlock the given list of objects by UUID.
 * </odoc>
 */

/**
 * <odoc>
 * <key>GetTags</key>
 * \
 * In: { (optional) "objTypes": [ "Mashup", ... ], (optional) "tagType": "aTagType" }\
 * Out: { "tags": [...] }\
 * Version: >= 7.1\
 * \
 * Retrieves the list of applicable tags (all tags or for specific objects).
 * </odoc>
 */

/**
 * <odoc>
 * <key>isShortNameUnique</key>
 * \
 * In: { "objType": "Mashup", "shortname": "aName", (optonal) "specUUID": "..." }\
 * Out: { "isUnique": true }\
 * Version: >= 8.0\
 * \
 * Tries to determine if a given shortname is unique given an objType and a shortname and, optionally, a specUUID.
 * </odoc>
 */

// DATA MODEL
// ********************************************************************************************************************
/**
 * <odoc>
 * <key>DM.CloseQuery</key>
 * \
 * In: { "QueryId": "...", (optionally) "ConsumerTag": "..."  }\
 * Out: { }\
 * Version: >= 7.1\
 * \
 * Closes a query, given a QueryId provided by the operation DM.PrepareQuery. 
 * </odoc>
 */

/**
 * <odoc>
 * <key>DM.CancelQuery</key>
 * \
 * In: { "QueryId": "..." }\
 * Out: { }\
 * Version: >= 7.1\
 * \
 * Cancels a query, given a QueryId provided by the operation DM.PrepareQuery. 
 * </odoc>
 */

/**
 * <odoc>
 * <key>DM.SaveSnaphot</key>
 * \
 * In: { "QueryId": "...", "Description": "...", "ExpireOn": wedoDate(...) }\
 * Out: { }\
 * Version: >= 7.1\
 * \
 * Saves a snapshot for a query, given a QueryId provided by the operation DM.PrepareQuery. You should also provide a description
 * a the expire on date.
 * </odoc>
 */

/**
 * <odoc>
 * <key>DM.OpenSnapshot</key>
 * \
 * In: { "QueryId": "..." }\
 * Out: { }\
 * Version: >= 7.1\
 * \
 * Opens a snapshot for a query, given a QueryId provided by the operation DM.PrepareQuery. 
 * </odoc>
 */

/**
 * <odoc>
 * <key>DM.GetSnapshot</key>
 * \
 * In: { "QueryId": "..." }\
 * Out: { snapshot }\
 * Version: >= 7.1\
 * \
 * Obtains the snapshot data for a query, given a QueryId provided by the operation DM.PrepareQuery.
 * </odoc>
 */


// CIR
// ********************************************************************************************************************
/**
 * <odoc>
 * <key>CIR.ConnectorConfiguration.Get</key>
 * \
 * In: { "Name": "...", "ServerType": "..." OR "UUID": "..." }\
 * Out: { "Configuration": { ... } }\
 * Version: >= 7.1\
 * \
 * Retrieves a connection configuration given a connection name and server type or the corresponding UUID. 
 * </odoc>
 */

/**
 * <odoc>
 * <key>CIR.ConnectorConfiguration.Remove</key>
 * \
 * In: { "UUIDList": [ "..." ]\
 * Out: { }\
 * Version: >= 7.1\
 * \
 * Removes several connection configuration given an array of UUIDs.
 * </odoc>
 */

/**
 * <odoc>
 * <key>CIR.ConnectorConfiguration.Save</key>
 * \
 * In: { "Name": "...", "ServerType": "...", "Description": "...", "Folder": "...", "Configuration": {}, (optional) "UUID": "...", (optional) "BaseConfiguration": "..." }
 * Out: { "Configuration": ... }
 * Version: >= 7.1\
 * \
 * Creates or modifies a connection configuration provide a Name, ServerType, Description, Folder and a Configuration. Optionally you 
 * can specify the UUID to use and the corresponding BaseConfiguration. Will return the created or modified Configuration.
 * \
 * </odoc>
 */

/**
 * <odoc>
 * <key>CIR.ConnectorConfiguration.Test</key>
 * \
 * In: { "UUID": "...", "ServerType": "...", "Configuration": {} }
 * Out: { "ValidConnector": true }
 * Version: >= 7.1\
 * \
 * Test the provided connection configuration given the connector UUID or a ServerType and Configuration map. Will return
 * a boolean ValidConnector with the result of the test.
 * </odoc>
 */

/**
 * <odoc>
 * <key>CIR.ConnectorConfiguration.List</key>
 * \
 * In: { }
 * Out: { "...": { (Configuration) } }
 * Version: >= 7.1\
 * \
 * List all the connector configurations available in the returned map. Each entry will have, as key, the corresponding UUID 
 * followed by the configuration map.
 * </odoc>
 */

/**
 * <odoc>
 * <key>CIR.ConnectorConfiguration.Hierarchy</key>
 * \
 * In: { }
 * Out: { (Root Configuration), "Folders": [ ... ] }
 * Version: >= 7.1\
 * \
 * Will return the CIR Root object with a Folders array where each entry is the other CIR objects with corresponding mention
 * for each object to the ParentId (parent's UUID). 
 * </odoc>
 */

/**
 * <odoc>
 * <key>CIR.ServerType.List</key>
 * \
 * In: { }
 * Out: { "...": { (ServerType entry) } }
 * Version: >= 7.1\
 * \
 * Will return a map where each entry is a ServerType configuration.
 * </odoc>
 */

/**
 * <odoc>
 * <key>CIR.Folder.List</key>
 * \
 * In: { }
 * Out: { "...": { (ServerType entry) } }
 * Version: >= 7.1\
 * \
 * Will return a map where each entry is a ServerType configuration.
 * </odoc>
 */

// FRAUD
// ********************************************************************************************************************

/**
 * <odoc>
 * <key>FRAUD.CreateSnapshot</key>
 * \
 * In: { (optional) "JobId": 1234, (optional) "ProcessId": 1234 }\
 * Out: { }\
 * Version: >= 7.0 (some options only since 7.1)\
 * \
 * Starts the process of creating a fraud snapshot for the engines allocated to the RAID Fraud instance where the operation
 * is invoked. Optionally you can specify a JobId or ProcessId to performn the snapshot operation only to a single engine. If
 * no option is provided the snapshot operation will be started for all engines.
 * </odoc>
 */

/**
 * <odoc>
 * <key>FRAUD.GetAlertBadRecords</key>
 * \
 * In: { "AlertId": 1234 }\
 * Out: { }\
 * Version: Jet engine still in development\
 * \
 * Processes an alert id retrieving the relevant information from Event Tracker and creating the corresponding records on 
 * the bad records table.
 * </odoc>
 */

/**
 * <odoc>
 * <key>FRAUD.GetCaseBadRecords</key>
 * \
 * In: { "CaseId": 1234 }\
 * Out: { }\
 * Version: Jet engine still in development\
 * \
 * Processes a case id retrieving the relevant information from Event Tracker and creating the corresponding records on 
 * the bad records table. 
 * </odoc>
 */

/**
 * <odoc>
 * <key>decrypt</key>
 * decrypt? but it's already unlocked...
 * </odoc>
 */

/**
 * <odoc>
 * <key>preto</key>
 * don't call nigga for nothing or I will teach you a lesson you won't walk for a whole (and whole has a meaning)... week
 * </odoc>
 */
