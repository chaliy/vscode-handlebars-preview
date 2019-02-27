import {
    workspace, window, commands, 
    TextDocumentContentProvider,
    Event, Uri, EventEmitter, Disposable 
} from "vscode";
import { dirname } from "path";
import { existsSync, readFileSync } from "fs";
import renderContent, { HelperFunctionInfo } from "./renderContent";

const resolveFileOrText = fileName => {
    console.log(fileName, workspace.textDocuments.map(x => x.fileName));
    let document = workspace.textDocuments.find(e => e.fileName === fileName);

    if (document) {
        return document.getText();
    }
    if (dirname(fileName) && existsSync(fileName)) {
        return readFileSync(fileName, "utf8");
    }
}

const requireUncached = module => {
  delete require.cache[require.resolve(module)]
  return require(module)
}

export default class HtmlDocumentContentProvider implements TextDocumentContentProvider {
    private _onDidChange = new EventEmitter<Uri>();
    private _fileName: string;
    private _dataFileName: string;
    private _helperFunctionFileName: string;
    
    constructor() {
    }

    public provideTextDocumentContent(uri: Uri): string {
        let templateSource;
        let dataSource;
        let helperFunctionInfos: HelperFunctionInfo[];
        
        if (window.activeTextEditor && window.activeTextEditor.document) {
            let currentFileName = window.activeTextEditor.document.fileName;
            let dataFileName;
            let fileName;
            let helperFunctionFileName: string;

            const relevantFileNames = [
              this._fileName, 
              this._dataFileName, 
              this._helperFunctionFileName
            ];
            if (relevantFileNames.some(f => f === currentFileName)) {
                // User switched editor to context, just use stored on
                fileName = this._fileName;
                dataFileName = this._dataFileName;
                helperFunctionFileName = this._helperFunctionFileName;
            } else {
                dataFileName = currentFileName + '.json';
                fileName = currentFileName;
                helperFunctionFileName = `${currentFileName}.js`;
            }

            this._fileName = fileName;
            this._dataFileName = dataFileName;
            this._helperFunctionFileName = helperFunctionFileName;
            templateSource = resolveFileOrText(fileName);
            dataSource = resolveFileOrText(dataFileName);

            helperFunctionInfos = requireUncached(helperFunctionFileName) || [];
            if (!Array.isArray(helperFunctionInfos)) {
              console.error(`Expected ${helperFunctionFileName} to export an array. Got ${JSON.stringify(helperFunctionInfos)} instead`);
              helperFunctionInfos = [];
            }
        }
        
        return renderContent(templateSource, dataSource, helperFunctionInfos);
    }

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

    public update(uri: Uri) {
        this._onDidChange.fire(uri);
    }
}
