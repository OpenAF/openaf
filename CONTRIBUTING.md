# Contributors Guide
`openaf` welcomes your contribution. Below steps can be followed to create a pull request.

* Fork this openaf repository into your account.
* Create a feature branch in your fork (`$ git checkout -b my-new-feature`).
* Hack, hack, hack...
* Do test build (`$ ojob build.yaml`).
* Do functional tests (`$ cd tests && java -jar ../openaf.jar --ojob -e autoTestAll.yaml`).
* Commit your changes (`$ git commit -am 'Add some feature'`).
* Push the feature branch into your fork (`$ git push origin -u my-new-feature`).
* Create new pull request to `master` branch.
