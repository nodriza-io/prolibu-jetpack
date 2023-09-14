const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.openWebView', () => {
        const panel = vscode.window.createWebviewPanel(
            'browserView',
            'Browser Preview',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    return `<iframe src="http://localhost:3000/" width="100%" height="100%"></iframe>`;
}

exports.activate = activate;