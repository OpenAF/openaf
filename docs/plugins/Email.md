# Email Java Plugin Reference

The `Email` plugin provides an SMTP client built on Apache Commons Mail (`MultiPartEmail` / `ImageHtmlEmail`) supporting plain text, HTML, inline CID embedded images, attachments, and TLS/SSL authentication.

---

## Loading Syntax

```javascript
plugin("Email");
var email = new Email(server, sender, shouldSecure, useTLS, isHTML);
```

### Constructor Parameters
* `server` *(String)*: SMTP server host.
* `sender` *(String)*: Sender email address (defaults to `"openaf@openaf.io"`).
* `shouldSecure` *(boolean)*: Enable SSL on connect (port 465).
* `useTLS` *(boolean)*: Enable STARTTLS (port 587).
* `isHTML` *(boolean)*: Set `true` to enable HTML body and image embedding.

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `setPort(port)` | `int` | `Email` | Configures SMTP server port. |
| `setCredentials(login, pass)` | `String, String` | `Email` | Sets SMTP auth credentials (supports OpenAF encrypted passwords). |
| `setFrom(from)` | `String` | `Email` | Configures From address. |
| `addTo(toList)` | `String \| Array<String>` | `Email` | Adds one or more recipient To addresses. |
| `addCc(ccList)` | `String \| Array<String>` | `Email` | Adds one or more CC addresses. |
| `addBcc(bccList)` | `String \| Array<String>` | `Email` | Adds one or more BCC addresses. |
| `setSubject(subject)` | `String` | `Email` | Sets message subject line. |
| `setMessage(message)` | `String` | `Email` | Sets plain text body (or alternative text for HTML emails). |
| `setHTML(html)` | `String` | `Email` | Sets HTML body string (requires `isHTML = true`). |
| `addAttachment(path, inline, noDisp, name)` | `String, boolean, boolean, [String]` | `Email` | Attaches a file from local disk. |
| `embedFile(path, name)` | `String, String` | `String` | Embeds local image and returns CID string for `<img src="cid:...">`. |
| `embedURL(url, name)` | `String, String` | `String` | Embeds remote image URL and returns CID string. |
| `setCharset(charset)` | `String` | `Email` | Sets character encoding (e.g. `"UTF-8"`). |
| `addHeader(key, value)` | `String, String` | `Email` | Adds custom SMTP header. |
| `send(subject, msg, toList, ccList, bccList, sender)` | `String, String, Array, Array, Array, String` | `String` | Sends email and returns Message ID. |
| `getEmailObj()` | *none* | `Object` | Returns underlying Apache Commons Mail Java object. |

---

## Practical Code Example

```javascript
plugin("Email");

// Plain text email with attachment
var mail = new Email("smtp.example.com", "notifications@example.com", true, true, false);
mail.login("smtpUser", "smtpPass")
    .setPort(587)
    .setSubject("Daily Report")
    .setMessage("Please find the attached daily report.")
    .addTo(["team@example.com"])
    .addAttachment("/tmp/report.pdf", false, false, "DailyReport.pdf")
    .send();

// HTML email with embedded image
var htmlMail = new Email("smtp.example.com", "alerts@example.com", true, true, true);
var cid = htmlMail.embedFile("/path/to/logo.png", "logo");
htmlMail.setSubject("Alert Notification")
        .setHTML("<h1>System Status</h1><img src='cid:" + cid + "'><p>All systems operational.</p>")
        .addTo("admin@example.com")
        .send();
```
