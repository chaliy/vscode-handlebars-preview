import * as assert from "assert";
import { join } from "path";
import { TextDocument } from "vscode";
import renderContent, { HelperFunctionInfo } from "../../src/lib/renderContent";


suite("lib/renderContent", () => {
  test("render something simple", () => {
    const html = renderContent("Hello <b>World!</b>", null, []);
    assert.equal(html, "Hello <b>World!</b>");
  });

  test("render with context", () => {
    console.log(join(__dirname, "../examples/simple.handlebars"));
    const html = renderContent("Super {{foo}}!", "{ \"foo\": \"bar\" }", []);
    assert.equal(html, "Super bar!");
  });

  const helperFunctionInfos: HelperFunctionInfo[] = [{
    name: 'capitalize',
    body: (s: string) => s.toUpperCase()
  }, {
    name: 'ask',
    body: (s: string) => `${s}???`
  }];

  test("render with a helper function", () => {
    const html = renderContent('SUPER {{capitalize foo}}!', '{ "foo": "bar" }', helperFunctionInfos);
    assert.equal(html, "SUPER BAR!");
  });

  test("render with nested helper functions", () => {
    const html = renderContent('SUPER {{capitalize (ask foo)}}!', '{ "foo": "bar" }', helperFunctionInfos);
    assert.equal(html, "SUPER BAR???!");
  });
});
