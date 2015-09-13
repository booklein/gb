Package.describe({
	name:"quagga",
	summary: "quagga",
	version: "0.0.1",
	git: "https://github.com/steffow/meteor-accounts-saml.git"
});

Package.on_use(function (api) {
//	api.versionsFrom('1.1.0.2');
//	api.use(['rocketchat:lib'], 'server');

	api.addFiles(['1quagga.js'], 'client');
	api.addFiles(['locator.js', 'locator.css', 'locator.html'], 'client');
	api.export(['App', 'Quagga'], ['client']);
});