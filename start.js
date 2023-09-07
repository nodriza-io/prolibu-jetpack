const vscode = require('vscode');
const path = require('path');


function start(context) {

	let disposable = vscode.commands.registerCommand(
		"extension.start",
		function () {
			const terminal = vscode.window.createTerminal("Prolibu");
			terminal.show();

			const cliPath = path.join(__dirname, 'cli.js');

			terminal.sendText(`alias prolibu="node ${cliPath}"`);
		}
	);

	context.subscriptions.push(disposable);
}
exports.start = start;
