# ow.java.IMAP

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.java](../index.md) / [ow.java.IMAP](index.md)

<a id="api-ow-java-imap-close-d35c67fd"></a>

## ow.java.IMAP.close

### ow.java.IMAP.close(aFolder)

Tries to a close a previously aFolder (defaults to "Inbox") automatically open in other operations.

Sources:

- js/owrap.java.js:977

<a id="api-ow-java-imap-getmessage-aca55a4e"></a>

## ow.java.IMAP.getMessage

### ow.java.IMAP.getMessage(aFolder, aNum) : Map

Tries to retrieve a message metadata map based on aNum from aFolder.

Sources:

- js/owrap.java.js:1119

<a id="api-ow-java-imap-getmessagebodypart-cf6d1d0a"></a>

## ow.java.IMAP.getMessageBodyPart

### ow.java.IMAP.getMessageBodyPart(aFolder, aNum, aBodyPartId) : String

Retrieves the body part identified as aBodyPartId (starts in 0) from the message aNum on aFolder.

Sources:

- js/owrap.java.js:1098

<a id="api-ow-java-imap-getmessagecount-b524e92f"></a>

## ow.java.IMAP.getMessageCount

### ow.java.IMAP.getMessageCount(aFolder) : Number

Retrieves the current message count for aFolder.

Sources:

- js/owrap.java.js:1072

<a id="api-ow-java-imap-getmessages-5f505d59"></a>

## ow.java.IMAP.getMessages

### ow.java.IMAP.getMessages(aFolder, aNumber) : Array

Tries to retrieve an array of maps of message metadata from aFolder (defaults to Inbox) up to aNumber (defaults to 5) of messages.

Sources:

- js/owrap.java.js:1000

<a id="api-ow-java-imap-getnewmessagecount-404e1943"></a>

## ow.java.IMAP.getNewMessageCount

### ow.java.IMAP.getNewMessageCount(aFolder) : Number

Retrieves the current new message count for aFolder.

Sources:

- js/owrap.java.js:1085

<a id="api-ow-java-imap-getsortedmessages-54a632b5"></a>

## ow.java.IMAP.getSortedMessages

### ow.java.IMAP.getSortedMessages(aFolder, aType, aTerm, aNumber) : Array

For IMAP servers supporting the SORT operation will retrieve an array of maps of message metadata from aFolder (defaults to "Inbox") up to aNumber (defaults to 5) of messages. The list will be filtered by aTerm for aType (e.g. FROM (default), ARRIVAL, CC, DATE, REVERSE, SIZE, SUBJECT, TO).

Sources:

- js/owrap.java.js:1021

<a id="api-ow-java-imap-getunreadmessagecount-a48fc163"></a>

## ow.java.IMAP.getUnreadMessageCount

### ow.java.IMAP.getUnreadMessageCount(aFolder) : Boolean

Tries to determine if there are new unread messages in aFolder (defailt to Inbox)

Sources:

- js/owrap.java.js:1168

<a id="api-ow-java-imap-hasnewmessages-f90a7251"></a>

## ow.java.IMAP.hasNewMessages

### ow.java.IMAP.hasNewMessages(aFolder) : Boolean

Tries to determine how many new messagse there are in aFolder (defailt to Inbox)

Sources:

- js/owrap.java.js:1155

