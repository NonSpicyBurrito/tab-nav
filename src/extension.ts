import * as vscode from 'vscode'

let enabled = true

export function activate(context: vscode.ExtensionContext) {
    registerCommandNext(context)
    registerCommandPrev(context)
    registerCommandToggleEnabled(context)
    registerCommandToggleCurrentLanguage(context)
    registerContextListener(context)

    updateWhenClauseContext()
}

function registerCommandNext(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('tab-nav.next', () => {
            vscode.commands.executeCommand('cursorWordEndRight')
        })
    )
}

function registerCommandPrev(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('tab-nav.prev', () => {
            vscode.commands.executeCommand('cursorWordLeft')
        })
    )
}

function registerCommandToggleEnabled(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('tab-nav.toggleEnabled', () => {
            enabled = !enabled

            updateWhenClauseContext()

            vscode.window.showInformationMessage(
                `Tab Nav is now ${enabled ? 'enabled' : 'disabled'}`
            )
        })
    )
}

function registerCommandToggleCurrentLanguage(
    context: vscode.ExtensionContext
) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand(
            'tab-nav.toggleCurrentLanguage',
            (editor) => {
                const languageId = editor.document.languageId
                const { languages } = getConfigs()

                const newLanguages = languages.includes(languageId)
                    ? languages.filter((id) => id !== languageId)
                    : [...languages, languageId]
                getConfig().update('languages', newLanguages, true)

                vscode.window.showInformationMessage(
                    `Language "${languageId}" is now ${
                        newLanguages.includes(languageId) ? 'added' : 'removed'
                    }`
                )
            }
        )
    )
}

function registerContextListener(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateWhenClauseContext)
    )
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(updateWhenClauseContext)
    )
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(updateWhenClauseContext)
    )
}

function updateWhenClauseContext() {
    const editor = vscode.window.activeTextEditor
    if (!editor) return

    const languageId = editor.document.languageId
    const { mode, languages } = getConfigs()

    let isEnabled = false
    if (enabled) {
        if (mode === 'whitelist') {
            isEnabled = languages.includes(languageId)
        } else {
            isEnabled = !languages.includes(languageId)
        }
    }

    vscode.commands.executeCommand('setContext', 'tabNav.enabled', isEnabled)
}

function getConfig() {
    return vscode.workspace.getConfiguration('tab-nav')
}

function getConfigs() {
    const config = getConfig()
    return {
        mode: config.get('mode', 'blacklist'),
        languages: config.get<string[]>('languages', []),
    }
}
