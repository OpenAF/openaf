# Security Policy

## Supported Versions

OpenAF currently has 3 main distributions:

| Distribution | Description |
|---|---|
| t8 | A fast-track release, build daily or more often, to start testing changes and new features. The functionality should not be considered final until it's merged into the main branch |
| nightly | A nightly build of the main branch where changes and new features are added for broader testing and use before being included in a future stable version |
| stable | Release a couple of times per year after extensive use of changes and new features on the nightly distribution |

Security updates, unless urgent, will first be added to the _t8_ distribution and then, in a couple of days, into the _nightly_ distribution. When enough security updates have been included and tested
a stable release will be released.

## Reporting a Vulnerability

To report a security vulnerability please send an email to openaf@openaf.io.
If accepted it will be addressed and tested on the a specific branch and then, merged, as soon as possible to the main branch that will become available as a nightly build.

Depending on the impacts of the necessary changes the latest stable release might also be updated, if them needed.
