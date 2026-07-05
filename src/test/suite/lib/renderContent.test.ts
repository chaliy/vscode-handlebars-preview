import renderContent from "../../../lib/renderContent";
import * as assert from "../assertions";


suite("lib/renderContent", () => {
  test("render something simple", () => {
    const html = renderContent("Hello <b>World!</b>", null);
    assert.equal(html, "Hello <b>World!</b>");
  });

  test("render with context", () => {
    const html = renderContent("Super {{foo}}!", "{ \"foo\": \"bar\" }");
    assert.equal(html, "Super bar!");
  });

  test("render with missing context", () => {
    const html = renderContent("Super {{foo}}!", null);
    assert.equal(html, "Super !");
  });

  test("render invalid context as escaped error", () => {
    const html = renderContent("Super {{foo}}!", "{");

    assert.match(html, /Error occurred/);
    assert.match(html, /SyntaxError/);
    assert.doesNotMatch(html, /Error occured/);
  });

  test("escape thrown render errors", () => {
    const html = renderContent("<script>{{#if foo}}", "{\"foo\": true}");

    assert.match(html, /Error occurred/);
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
  });
});
