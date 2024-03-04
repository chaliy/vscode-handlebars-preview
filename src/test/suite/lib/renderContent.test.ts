import * as assert from "assert";
import renderContent from "../../../lib/renderContent";


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

  test("render with partials", () => {
    const html = renderContent("Hello {{> user}}!", "{ \"name\": \"Ada\" }", {
      user: "<b>{{name}}</b>",
    });

    assert.equal(html, "Hello <b>Ada</b>!");
  });

  test("does not leak partials between renders", () => {
    renderContent("Hello {{> user}}!", "{ \"name\": \"Ada\" }", {
      user: "<b>{{name}}</b>",
    });

    const html = renderContent("Hello {{> user}}!", "{ \"name\": \"Grace\" }");

    assert.match(html, /Error occurred/);
    assert.match(html, /partial user could not be found/);
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
