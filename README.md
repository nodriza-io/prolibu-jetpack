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
npm run signin
```

You'll be prompted to input your credentials. Once authenticated, the session will remain active until you choose to sign out.

### import
Retrieve data from your Prolibu service and save it locally.

**Usage**:
```bash
npm run import

node jetpack.js import --domain <your_domain> --collection <your_collection> --format <file_format>

```

Follow the instructions to specify the type of data you wish to import and determine where you want it saved on your local environment.

### export
Send data from your local environment to the Prolibu service.

**Usage**:
```bash
npm run export

node jetpack.js export --domain <your_domain> --collection <your_collection> --format <file_format>

```

Specify the path of the data file you aim to export, and the tool will handle the transfer to the specified Prolibu service.

### watch
Monitor specific files continuously for changes. Upon detecting a change, such as a modification in the file, Prolibu Jetpack will automatically process the changes and export them to the Prolibu service.

**Usage**:
```bash
npm run watch

node jetpack.js watch --domain <your_domain> --collection <your_collection> --format <file_format>

```
