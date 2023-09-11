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
```

Follow the instructions to specify the type of data you wish to import and determine where you want it saved on your local environment.

### export
Send data from your local environment to the Prolibu service.

**Usage**:
```bash
npm run export
```

Specify the path of the data file you aim to export, and the tool will handle the transfer to the specified Prolibu service.

### watch
Monitor directories continuously for changes. Upon detecting a change, such as a modification in a file, Prolibu Jetpack will automatically process the changes and export them to the Prolibu service.

**Usage**:
```bash
npm run watch
```

On initiation, the tool will monitor the designated accounts directory. Changes in .csv or .json files within this directory will be automatically detected and managed.