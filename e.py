version = _('getVersion()')
print("Python running on OpenAF version " + version)

joke = _('$rest().get("https://api.chucknorris.io/jokes/random")')
print(joke['value'])