# Prolibu Jetpack

Prolibu Jetpack is designed to seamlessly manage, synchronize, and automate data interactions between your local environment and the Prolibu services. The application offers a suite of commands to enhance your data synchronization experience.
## Table of Contents

- [Commands](#commands)
   - [signin](#signin)
   - [import](#import)
   - [export](#export)
   - [watch](#watch)
- [Contribution](#contribution)

## Commands

### signin

Authenticate and establish a connection with the Prolibu service.

**Usage**:
```bash

node jetpack.js signin

./run signin

```

You'll be prompted to input your credentials. Once authenticated, the session will remain active until you choose to sign out.

### import
Retrieve data from your Prolibu service and save it locally.

**Usage**:
```bash

node jetpack.js import --domain <your_domain> --collection <your_collection> --format <file_format>

./run import --domain dev4 --collection contact --format xlsx || csv || json [OPTIONAL] --query populate=*

./run import -d dev4 -d contact -f xlsx

./run import dev4 contact xlsx

```

Follow the instructions to specify the type of data you wish to import and determine where you want it saved on your local environment.

### export
Send data from your local environment to the Prolibu service.

**Usage**:
**Usage**:
```bash

node jetpack.js export --domain <your_domain> --collection <your_collection> --format <file_format>

./run export --domain dev4 --collection contact --format xlsx || csv || json

./run export -d dev4 -d contact -f xlsx

./run export dev4 contact xlsx

```

Specify the path of the data file you aim to export, and the tool will handle the transfer to the specified Prolibu service.

### watch
Monitor specific files continuously for changes. Upon detecting a change, such as a modification in the file, Prolibu Jetpack will automatically process the changes and export them to the Prolibu service.

**Usage**:
```bash

node jetpack.js watch --domain <your_domain> --collection <your_collection> --format <file_format>

./run watch --domain dev4 --collection contact --format xlsx || csv || json

./run watch -d dev4 -d contact -f xlsx

./run watch dev4 contact xlsx

```

### preview
Allows you to preview specific templates in a local environment before deploying them. The tool renders templates using sample JSON data and provides a live preview with a built-in server.

**Usage**:
```bash

node jetpack.js preview --domain <your_domain> --template <template_name> --port <port_number>

./run preview --domain dev4 --template email/simple-message [OPTIONAL] --port 3000

./run preview -d dev4 -t email/simple-message -p 3000

./run preview dev4 email/simple-message 3000

```

Once executed, the tool will spin up a local server, by default port 3000 which you can access through your web browser to view the rendered template. The tool also comes with live-reloading capabilities, meaning if you make changes to the template or its data, the preview will automatically update.


