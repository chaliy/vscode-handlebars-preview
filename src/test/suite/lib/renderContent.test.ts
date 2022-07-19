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
});
