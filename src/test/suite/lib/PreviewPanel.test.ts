import * as vscode from "vscode";

import { getDataUriForTemplate } from "../../../lib/PreviewPanel";
import * as assert from "../assertions";

suite("lib/PreviewPanel", () => {
  test("derives adjacent data uri from template uri and suffix", () => {
    const templateUri = vscode.Uri.parse("vscode-vfs://github/user/repo/email.handlebars");
    const dataUri = getDataUriForTemplate(templateUri, ".preview.json");

    assert.equal(dataUri.toString(), "vscode-vfs://github/user/repo/email.handlebars.preview.json");
  });
});
