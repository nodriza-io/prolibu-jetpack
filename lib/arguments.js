const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

function getArguments() {
  const args = yargs(hideBin(process.argv))
    .command("signin", "Sign in to Prolibu account")
    .command("signout", "Sign out from Prolibu account")
    .command(
      "import [domain] [collection] [format]",
      "Import data from Prolibu account",
      (yargs) => {
        return yargs
          .option("query", {
            describe: "Custom query for data filtering",
            type: "string"
          })
          .positional("domain", {
            describe: "Subdomain for Prolibu account",
            type: "string",
            alias: "d",
          })
          .positional("collection", {
            describe: "Name of the collection",
            type: "string",
            alias: "c",
          })
          .positional("format", {
            describe: "Format of the data",
            type: "string",
            choices: ["csv", "json", "xlsx"],
            alias: "f",
          })
          .check((argv) => {
            if (!argv.domain || !argv.collection || !argv.format) {
              throw new Error(
                "Please provide domain, collection, and format arguments for the import command."
              );
            }
            return true;
          });
      }
    )
    .command(
      "export [domain] [collection] [format]",
      "Export data to Prolibu account",
      (yargs) => {
        yargs
          .positional("domain", {
            describe: "Subdomain for Prolibu account",
            type: "string",
            alias: "d",
          })
          .positional("collection", {
            describe: "Name of the collection",
            type: "string",
            alias: "c",
          })
          .positional("format", {
            describe: "Format of the data",
            type: "string",
            choices: ["csv", "json", "xlsx"],
            alias: "f",
          })
          .check((argv) => {
            if (!argv.domain || !argv.collection || !argv.format) {
              throw new Error(
                "Please provide domain, collection, and format arguments for the export command."
              );
            }
            return true;
          });
      }
    )
    .command(
      "watch [domain] [collection] [format]",
      "Watch and sync changes for specific data",
      (yargs) => {
        yargs
          .positional("domain", {
            describe: "Subdomain for Prolibu account",
            type: "string",
            alias: "d",
          })
          .positional("collection", {
            describe: "Name of the collection",
            type: "string",
            alias: "c",
          })
          .positional("format", {
            describe: "Format of the data",
            type: "string",
            choices: ["csv", "json", "xlsx"],
            alias: "f",
          })
          .check((argv) => {
            if (!argv.domain || !argv.collection || !argv.format) {
              throw new Error(
                "Please provide domain, collection, and format arguments for the watch command."
              );
            }
            return true;
          });
      }
    )
    .command(
      "preview [domain] [template] [port]",
      "Preview a specific template",
      (yargs) => {
        yargs
          .positional("domain", {
            describe: "Subdomain for Prolibu account",
            type: "string",
            alias: "d",
          })
          .positional("template", {
            describe: "Name of the template",
            type: "string",
            alias: "t",
          })
          .positional("port", {
            describe: "Port number for preview",
            type: "number",
            default: 3000,
            alias: "p",
          })
          .check((argv) => {
            if (!argv.domain || !argv.template) {
              throw new Error(
                "Please provide domain and template arguments for the preview command."
              );
            }
            return true;
          });
      }
    )
    .help("h")
    .alias("h", "help").argv;

  return args;
}

module.exports = getArguments;
