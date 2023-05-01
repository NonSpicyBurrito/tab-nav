import * as vscode from 'vscode'

let enabled = true
let characters = ''

export function activate(context: vscode.ExtensionContext) {
    registerCommandNext(context)
    registerCommandPrev(context)
    registerCommandToggleEnabled(context)
    registerCommandToggleCurrentLanguage(context)
    registerContextListener(context)

    updateWhenClauseContext()
    updateCharacterSequences()
}

function registerCommandNext(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand(
            'tab-nav.next',
            (textEditor) => next(textEditor, textEditor.selection.active)
        )
    )
}

function next(textEditor: vscode.TextEditor, position: vscode.Position) {
    const line = textEditor.document.lineAt(position.line)
    if (position.character >= line.text.length) {
        if (position.line >= textEditor.document.lineCount - 1) {
            textEditor.selections = [new vscode.Selection(position, position)]
        } else {
            next(textEditor, new vscode.Position(position.line + 1, 0))
        }
        return
    }

    const character = line.text.slice(
        position.character,
        position.character + 1
    )
    if (characters.indexOf(character) !== -1) {
        const active = position.translate(0, 1)
        textEditor.selections = [new vscode.Selection(active, active)]
    } else {
        vscode.commands.executeCommand('cursorWordEndRight')
    }
}

function registerCommandPrev(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand(
            'tab-nav.prev',
            (textEditor) => prev(textEditor, textEditor.selection.active)
        )
    )
}

function prev(textEditor: vscode.TextEditor, position: vscode.Position) {
    if (position.character <= 0) {
        if (position.line <= 0) {
            textEditor.selections = [new vscode.Selection(position, position)]
        } else {
            const line = textEditor.document.lineAt(position.line - 1)
            prev(
                textEditor,
                new vscode.Position(position.line - 1, line.text.length)
            )
        }
        return
    }

    const line = textEditor.document.lineAt(position.line)
    const character = line.text.slice(
        position.character - 1,
        position.character
    )
    if (characters.indexOf(character) !== -1) {
        const active = position.translate(0, -1)
        textEditor.selections = [new vscode.Selection(active, active)]
    } else {
        vscode.commands.executeCommand('cursorWordLeft')
    }
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
        vscode.workspace.onDidChangeConfiguration(() => {
            updateWhenClauseContext()
            updateCharacterSequences()
        })
    )
}

function updateWhenClauseContext() {
    const { mode, languages } = getConfigs()

    vscode.commands.executeCommand('setContext', 'tabNav.enabled', enabled)
    vscode.commands.executeCommand('setContext', 'tabNav.mode', mode)
    vscode.commands.executeCommand('setContext', 'tabNav.languages', languages)
}

function updateCharacterSequences() {
    ;({ characters } = getConfigs())
}

function getConfig() {
    return vscode.workspace.getConfiguration('tab-nav')
}

function getConfigs() {
    const config = getConfig()
    return {
        mode: config.get('mode', 'blacklist'),
        languages: config.get<string[]>('languages', []),
        characters: config.get('characters', '"\'`)]}'),
    }
}
