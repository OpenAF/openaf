// Copyright 2026 Nuno Aguiar

(function() {
    exports.testEmailTLSRequirement = function() {
        plugin("Email")

        var startTLS = new Email("localhost", "sender@example.invalid", true, true, false).getEmailObj()
        ow.test.assert(startTLS.isStartTLSEnabled(), true, "STARTTLS should be enabled when selected.")
        ow.test.assert(startTLS.isStartTLSRequired(), true, "STARTTLS should be required when selected.")

        var implicitTLS = new Email("localhost", "sender@example.invalid", true, false, false).getEmailObj()
        ow.test.assert(implicitTLS.isSSLOnConnect(), true, "Implicit SMTP TLS should remain enabled when selected.")
        ow.test.assert(implicitTLS.isStartTLSEnabled(), false, "Implicit SMTP TLS should not enable STARTTLS.")

        var plain = new Email("localhost", "sender@example.invalid", false, false, false).getEmailObj()
        ow.test.assert(plain.isSSLOnConnect(), false, "Plain SMTP should remain available when explicitly selected.")
        ow.test.assert(plain.isStartTLSEnabled(), false, "Plain SMTP should not enable STARTTLS.")
        ow.test.assert(plain.isStartTLSRequired(), false, "Plain SMTP should not require STARTTLS.")
    }

    exports.testFTPSTrustConfiguration = function() {
        var ftpClass = java.lang.Class.forName("openaf.plugins.FTP")
        var ftp = ftpClass.getDeclaredConstructor(java.lang.reflect.Array.newInstance(java.lang.Class, 0)).newInstance(java.lang.reflect.Array.newInstance(java.lang.Object, 0))
        var method = ftpClass.getDeclaredMethod("createFTPSClient", java.lang.reflect.Array.newInstance(java.lang.Class, 0))
        method.setAccessible(true)
        var client = method.invoke(ftp, java.lang.reflect.Array.newInstance(java.lang.Object, 0))

        ow.test.assert(client.isEndpointCheckingEnabled(), true, "FTPS should verify the control server hostname.")
        ow.test.assert(isNull(client.getTrustManager()), true, "FTPS should use the JVM default trust managers.")
    }
})()
