import * as vscode from "vscode";

import {
  getDataUriForTemplate,
  getHelperUriForTemplate,
  getPartialUrisFromConfigurationValues,
  getWatchDirectoriesForUris,
  getWebviewOptions,
  renderWebviewDocument,
  rewriteLocalFontUrls,
  sanitizeBackgroundColor
} from "../../../lib/PreviewPanel";
import * as assert from "../assertions";

suite("lib/PreviewPanel", () => {
  const fakeWebview = {
    cspSource: "vscode-webview:",
    asWebviewUri(uri: vscode.Uri): vscode.Uri {
      const query = uri.query ? `?${uri.query}` : "";
      const fragment = uri.fragment ? `#${uri.fragment}` : "";
      return vscode.Uri.parse(`vscode-resource:${uri.path}${query}${fragment}`);
    }
  };

  test("derives adjacent data uri from template uri and suffix", () => {
    const templateUri = vscode.Uri.parse("vscode-vfs://github/user/repo/email.handlebars");
    const dataUri = getDataUriForTemplate(templateUri, ".preview.json");

    assert.equal(dataUri.toString(), "vscode-vfs://github/user/repo/email.handlebars.preview.json");
  });

  test("adds template directory as the only workspace local resource root", () => {
    const extensionUri = vscode.Uri.file("/extension");
    const templateUri = vscode.Uri.file("/workspace/templates/email.handlebars");
    const options = getWebviewOptions(extensionUri, templateUri);

    assert.equal(options.enableScripts, false);
    assert.equal(options.localResourceRoots?.map(uri => uri.toString()).join("|"), "file:///extension/media|file:///workspace/templates");
  });

  test("rewrites local font and stylesheet references to webview uris", () => {
    const templateUri = vscode.Uri.file("/workspace/templates/email.handlebars");
    const html = rewriteLocalFontUrls(`
      <link rel="stylesheet" href="./email.css">
      <style>
        @import "./typography.css";
        @font-face { font-family: Brand; src: url("./fonts/brand.woff2?v=1") format("woff2"); }
      </style>
      <p style='font-family: Brand; src: url("fonts/fallback.otf")'>Hello</p>
    `, templateUri, fakeWebview);

    assert.match(html, /href="vscode-resource:\/workspace\/templates\/email\.css"/);
    assert.match(html, /@import url\("vscode-resource:\/workspace\/templates\/typography\.css"\)/);
    assert.match(html, /url\("vscode-resource:\/workspace\/templates\/fonts\/brand\.woff2\?/);
    assert.match(html, /url\("vscode-resource:\/workspace\/templates\/fonts\/fallback\.otf"\)/);
  });

  test("does not rewrite unsafe or unsupported resource references", () => {
    const templateUri = vscode.Uri.file("/workspace/templates/email.handlebars");
    const html = rewriteLocalFontUrls(`
      <link rel="stylesheet" href="../outside.css">
      <style>
        @font-face { src: url("../secret.woff2"); }
        @font-face { src: url("/fonts/root.woff2"); }
        @font-face { src: url("https://example.com/font.woff2"); }
        @font-face { src: url("data:font/woff2;base64,abc"); }
        .hero { background-image: url("./image.png"); }
      </style>
      <p>url("./visible.woff2")</p>
    `, templateUri, fakeWebview);

    assert.match(html, /href="\.\.\/outside\.css"/);
    assert.match(html, /url\("\.\.\/secret\.woff2"\)/);
    assert.match(html, /url\("\/fonts\/root\.woff2"\)/);
    assert.match(html, /url\("https:\/\/example\.com\/font\.woff2"\)/);
    assert.match(html, /url\("data:font\/woff2;base64,abc"\)/);
    assert.match(html, /url\("\.\/image\.png"\)/);
    assert.match(html, /<p>url\("\.\/visible\.woff2"\)<\/p>/);
    assert.doesNotMatch(html, /vscode-resource:/);
  });

  test("allows webview font resources in the content security policy", () => {
    const templateUri = vscode.Uri.file("/workspace/templates/email.handlebars");
    const html = renderWebviewDocument(fakeWebview, "<p>Hello</p>", templateUri);

    assert.match(html, /default-src 'none'; img-src vscode-webview: https: data:; font-src vscode-webview:; style-src vscode-webview: 'unsafe-inline'/);
  });

  test("derives adjacent helper uri from template uri", () => {
    const templateUri = vscode.Uri.parse("file:///workspace/email.handlebars");
    const helperUri = getHelperUriForTemplate(templateUri);

    assert.equal(helperUri.toString(), "file:///workspace/email.handlebars.js");
  });

  test("derives configured relative helper uri from template directory without workspace", () => {
    const templateUri = vscode.Uri.parse("file:///workspace/templates/email.handlebars");
    const helperUri = getHelperUriForTemplate(templateUri, "_preview_handlebars.js");

    assert.equal(helperUri.toString(), "file:///workspace/templates/_preview_handlebars.js");
  });

  test("normalizes configured partial uris and skips empty values", () => {
    const partialUris = getPartialUrisFromConfigurationValues([
      "",
      "  file:///workspace/partials/card.handlebars  ",
      "/workspace/partials/footer.handlebars"
    ]);

    assert.deepEqual(partialUris.map(uri => uri.toString()), [
      "file:///workspace/partials/card.handlebars",
      "file:///workspace/partials/footer.handlebars"
    ]);
  });

  test("watches only directories for tracked non-untitled resources", () => {
    const directories = getWatchDirectoriesForUris([
      vscode.Uri.file("/workspace/templates/email.handlebars"),
      vscode.Uri.file("/workspace/templates/email.handlebars.json"),
      vscode.Uri.file("/workspace/partials/card.handlebars"),
      vscode.Uri.file("/workspace/partials/footer.handlebars"),
      vscode.Uri.parse("untitled:Untitled-1")
    ]);

    assert.deepEqual(directories.map(uri => uri.toString()), [
      "file:///workspace/templates",
      "file:///workspace/partials"
    ]);
  });

  test("accepts simple CSS background colors", () => {
    assert.equal(sanitizeBackgroundColor(" #fff "), "#fff");
    assert.equal(sanitizeBackgroundColor("#11223344"), "#11223344");
    assert.equal(sanitizeBackgroundColor("white"), "white");
    assert.equal(sanitizeBackgroundColor("rgb(255, 255, 255)"), "rgb(255, 255, 255)");
    assert.equal(sanitizeBackgroundColor("rgba(255, 255, 255, 0.75)"), "rgba(255, 255, 255, 0.75)");
    assert.equal(sanitizeBackgroundColor("hsl(210, 20%, 95%)"), "hsl(210, 20%, 95%)");
  });

  test("rejects CSS background color values that could inject declarations", () => {
    assert.equal(sanitizeBackgroundColor("red; color: blue"), undefined);
    assert.equal(sanitizeBackgroundColor("url(https://example.com/bg.png)"), undefined);
    assert.equal(sanitizeBackgroundColor("#fff\" onclick=\"alert(1)"), undefined);
  });

  test("renders sanitized background color on preview body", () => {
    const html = renderWebviewDocument(fakeWebview, "<p>Hello</p>", undefined, "#fafafa");

    assert.match(html, /<body style="background-color: #fafafa;">/);
    assert.match(html, /<p>Hello<\/p>/);
  });

  test("omits unsupported background colors from preview body", () => {
    const html = renderWebviewDocument(fakeWebview, "<p>Hello</p>", undefined, "red; color: blue");

    assert.match(html, /<body>/);
    assert.doesNotMatch(html, /background-color/);
  });
});
