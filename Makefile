default: build

prepare-angular:
	(cd angular; npm install)

build-angular:
	(cd angular; ./node_modules/.bin/grunt build)

assets/index.html: angular/build/assets/index.html
	cp $< $@

assets/index.min.js: angular/build/assets/index.min.js
	cp $< $@

build-angular-assets: build-angular assets/index.html assets/index.min.js

.PHONY: prepare-angular build-angular build-angular-assets

assets/Authenticator-deployment-instructions.txt: runtime/Authenticator/descriptor.yaml runtime/Authenticator/Authenticator.js runtime/Authenticator/descriptor.yaml runtime/context-local.yaml
	twilio-runtime-utils -c runtime/context-local.yaml deploy runtime/Authenticator/descriptor.yaml > $@

assets/FleetManager-deployment-instructions.txt: runtime/FleetManager/descriptor.yaml runtime/FleetManager/FleetManager.js runtime/FleetManager/descriptor.yaml runtime/context-local.yaml
	twilio-runtime-utils -c runtime/context-local.yaml deploy runtime/FleetManager/descriptor.yaml > $@

build-runtime: assets/Authenticator-deployment-instructions.txt assets/FleetManager-deployment-instructions.txt

.PHONY: build-runtime

prepare: prepare-angular

build: build-angular-assets build-runtime

dev:
	(cd angular; ./angular/node_modules/.bin/grunt dev)

clean:
	rm -rf angular/build/assets

full-clean: clean
	rm -rf angular/node_modules
	rm -rf angular/build

rebuild: clean build

full-rebuild: full-clean prepare build

.PHONY: default prepare build dev clean full-clean rebuild full-rebuild
