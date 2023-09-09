
# Jetpack:

## Descripción

Jetpack is an automation tool that allows the export of models from Prolibu, such as `user`, `proposal`, `categories`, etc., in Excel format. The tool works locally but also automatically synchronizes all changes in the cloud.

## Main Features

- Export of various models (e.g., `user`, `proposal`, `categories`) in formats such as Excel.
- Local work with automatic synchronization in the cloud.

## Workflow

### Login

To lognin, use the following command:

```bash
jp signin [domain] [email] [password]
```

This command logs into the extension, creates a folder in `accounts` with the domain name and inserts a `config.json` file containing the API Key.

### Data Import

To import data, run:

```bash
jp import [domain]
```

With the following options (`flags`):

- `-c collection`: Specifies the collection to import. Example: `[user]`.
- `-q query`: Specifies a query to filter the data. Example: `[user,categories]`.
- `-or output`: Specifies the format in which you want to import. Example: `[excel, csv]`.

### Data Export

To export data, run: 

```bash
jp export [domain]
```

This command exports all changes made.

## Installation

To install Jetpack, run the following command:

```bash
npm install
```

## Technical Usage

Here is an example of how to execute the import command with all options:

```bash
jp import acme -c user -q "user,categories" -o excel
```

## Support

For further information or assistance, contact the support team.
