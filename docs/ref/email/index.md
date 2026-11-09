# Email

[Home](../index.md) / [All APIs](../all-apis.md) / [Email](index.md)

<a id="api-email-addattachment-7779d289"></a>

## Email.addAttachment

### Email.addAttachment(aPath, isInline, noDisposition, aName) : Email

Adds aPath file as an attachment for the current email. Optionally you can specify if it's an inline (isInline) attachment; noDisposition = true to not set it as inline or attachment (ignores isInline); an internal aName.

Sources:

- src/openaf/plugins/Email.java:301

<a id="api-email-addbcc-dd1ca151"></a>

## Email.addBcc

### Email.addBcc(aBccOrList) : Email

Sets the current email bcc email address or an array of bcc email addresses.

Sources:

- src/openaf/plugins/Email.java:214

<a id="api-email-addcc-f653199d"></a>

## Email.addCc

### Email.addCc(aCcOrList) : Email

Sets the current email cc email address or an array of cc email addresses.

Sources:

- src/openaf/plugins/Email.java:195

<a id="api-email-addexternalimage-c97aeaed"></a>

## Email.addExternalImage

### Email.addExternalImage(aURL) : Email

Retrieves an external image from aURL and set's everything for that URL to be used in HTML.  Only available if the Email object was initialized with isHtml = true.

Sources:

- src/openaf/plugins/Email.java:341

<a id="api-email-addhtmlheader-079c3218"></a>

## Email.addHTMLHeader

### Email.addHTMLHeader() : Email

(deprecation) Please use the option in the constructor and the setHTML function. Adds the necessary headers to support HTML contents.  To be deprecated in the future. Please use new Email with isHTML = true and the setHTML function.

Sources:

- src/openaf/plugins/Email.java:156

<a id="api-email-addheader-a3940e4b"></a>

## Email.addHeader

### Email.addHeader(aKey, aValue) : Email

Add a SMTP header with aKey and the corresponding aValue.

Sources:

- src/openaf/plugins/Email.java:144

<a id="api-email-addto-5337b15f"></a>

## Email.addTo

### Email.addTo(aToOrList) : Email

Sets the current email "To" email address or an array of "To" email addresses.

Sources:

- src/openaf/plugins/Email.java:176

<a id="api-email-email-965ff501"></a>

## Email.email

### Email.email(aServer, aSenderAddress, shouldSecure, useTLS, isHTML)

Creates a Email object instance using the aServer SMTP server to send email with the from field set to aSenderAddress. Optionally you can specify if a secure protocol (SSL) should be used with shouldSecure = true, to TLS add shouldSecure = true and useTLS = true and isHTML to use the setHTML function later.

Sources:

- src/openaf/plugins/Email.java:64

<a id="api-email-embedfile-9e3d884b"></a>

## Email.embedFile

### Email.embedFile(aFilePath, aName) : Email

Tries to embed aFilePath with aName and returns the cid to be used in HTML (e.g. img src="cid:xxx").  Only available if the Email object was initialized with isHtml = true.

Sources:

- src/openaf/plugins/Email.java:378

<a id="api-email-embedurl-68b3d3ce"></a>

## Email.embedURL

### Email.embedURL(aURL, aName) : Email

Tries to embed aURL with aName and returns the cid to be used in HTML (e.g. img src="cid:xxx").  Only available if the Email object was initialized with isHtml = true.

Sources:

- src/openaf/plugins/Email.java:360

<a id="api-email-getemailobj-27f5ef8f"></a>

## Email.getEmailObj

### Email.getEmailObj() : JavaObject

Returns the internal Java object used to composed the email message for advance usage. See more in https://commons.apache.org/proper/commons-email/apidocs/org/apache/commons/mail/Email.html.

Sources:

- src/openaf/plugins/Email.java:257

<a id="api-email-login-f943b34b"></a>

## Email.login

### Email.login(aLogin, aPassword)

Sets the credentials to use when using a SMTP server which activates the use of a secure protocol (TLS/SSL) if available.

Sources:

- src/openaf/plugins/Email.java:120

<a id="api-email-send-40596e30"></a>

## Email.send

### Email.send(aSubject, aMessage, aToList, aCCList, aBCCList, aSender) : String

Sends an email with aSubject and aMessage to the provided array of aToList, aCCList and aBCCList. Optionally you can specify a from address in aSender, otherwise the default for this object instance will be used. Returns the id of the message sent.

Sources:

- src/openaf/plugins/Email.java:420

<a id="api-email-setcharset-41ef3134"></a>

## Email.setCharset

### Email.setCharset(aCharset) : Email

Sets the current email aCharset to use.

Sources:

- src/openaf/plugins/Email.java:245

<a id="api-email-setcontent-c5003d07"></a>

## Email.setContent

### Email.setContent(aContent, aContentType) : Email

Sets the current email body message to send with aContent string. Specifies also that the corresponding  content type is aContentType.

Sources:

- src/openaf/plugins/Email.java:289

<a id="api-email-setcredentials-6fbb7d64"></a>

## Email.setCredentials

### Email.setCredentials(aLogin, aPassword)

Sets the credentials to use when using a SMTP server which activates the use of a secure protocol (TLS/SSL) if available.

Sources:

- src/openaf/plugins/Email.java:107

<a id="api-email-setfrom-76117476"></a>

## Email.setFrom

### Email.setFrom(aFrom) : Email

Sets the current email aFrom email address.

Sources:

- src/openaf/plugins/Email.java:233

<a id="api-email-sethtml-ec9e60c7"></a>

## Email.setHTML

### Email.setHTML(aHTML) : Email

If the Email object was initialized with isHtml = true then will set the HTML content to aHTML.

Sources:

- src/openaf/plugins/Email.java:325

<a id="api-email-setmessage-15d14709"></a>

## Email.setMessage

### Email.setMessage(aMessage) : Email

Sets the current email body message to send (raw). Please use Email.setContent to specify the mime type. For  emails initialized with isHtml = true, sets the alternative text content to show.

Sources:

- src/openaf/plugins/Email.java:269

<a id="api-email-setport-82f79ccd"></a>

## Email.setPort

### Email.setPort(aPort)

Sets aPort to contact the SMTP server.

Sources:

- src/openaf/plugins/Email.java:94

<a id="api-email-setsubject-421ffea4"></a>

## Email.setSubject

### Email.setSubject(aSubject) : Email

Sets the email's aSubject;

Sources:

- src/openaf/plugins/Email.java:408

