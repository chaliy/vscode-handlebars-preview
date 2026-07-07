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

  test("render with partials", () => {
    const html = renderContent("Hello {{> user}}!", "{ \"name\": \"Ada\" }", {
      user: "<b>{{name}}</b>",
    });

    assert.equal(html, "Hello <b>Ada</b>!");
  });

  test("render with built-in comparison helpers", () => {
    const html = renderContent([
      "{{#compare count 3}}same{{else}}different{{/compare}}",
      "{{#compare count \">\" min}}above{{else}}below{{/compare}}",
      "{{#if (eq status \"active\")}}active{{else}}inactive{{/if}}",
      "{{eval status}}",
    ].join(" "), "{ \"count\": \"3\", \"min\": 2, \"status\": \"active\" }");

    assert.equal(html, "same above active active");
  });

  test("does not leak partials between renders", () => {
    renderContent("Hello {{> user}}!", "{ \"name\": \"Ada\" }", {
      user: "<b>{{name}}</b>",
    });

    const html = renderContent("Hello {{> user}}!", "{ \"name\": \"Grace\" }");

    assert.match(html, /Error occurred/);
    assert.match(html, /partial user could not be found/);
  });

  test("render with helper object", () => {
    const html = renderContent("Super {{shout foo}}!", "{ \"foo\": \"bar\" }", {}, {
      shout: (value: string) => value.toUpperCase(),
    });

    assert.equal(html, "Super BAR!");
  });

  test("render with helper descriptors", () => {
    const html = renderContent("Super {{shout (ask foo)}}!", "{ \"foo\": \"bar\" }", {}, [
      { name: "shout", body: (value: string) => value.toUpperCase() },
      { name: "ask", body: (value: string) => `${value}?` },
    ]);

    assert.equal(html, "Super BAR?!");
  });

  test("render with helper registration function", () => {
    const html = renderContent("Super {{shout foo}}!", "{ \"foo\": \"bar\" }", {}, handlebars => {
      handlebars.registerHelper("shout", (value: string) => value.toUpperCase());
    });

    assert.equal(html, "Super BAR!");
  });

  test("does not leak helpers between renders", () => {
    renderContent("Super {{shout foo}}!", "{ \"foo\": \"bar\" }", {}, {
      shout: (value: string) => value.toUpperCase(),
    });

    const html = renderContent("Super {{shout foo}}!", "{ \"foo\": \"bar\" }");

    assert.match(html, /Error occurred/);
    assert.match(html, /Missing helper: &quot;shout&quot;/);
  });

  test("render helper load errors as escaped errors", () => {
    const html = renderContent("Super {{foo}}!", "{ \"foo\": \"bar\" }", {}, undefined, new Error("<helper failed>"));

    assert.match(html, /Error occurred/);
    assert.match(html, /&lt;helper failed&gt;/);
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
