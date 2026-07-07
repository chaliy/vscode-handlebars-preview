import { normalizeHelperModule } from "../../../lib/helpers";
import * as assert from "assert";

suite("lib/helpers", () => {
  test("accepts helper object exports", () => {
    const helper = () => "ok";
    const normalized = normalizeHelperModule({ helper });

    assert.deepEqual(normalized, { helper });
  });

  test("accepts helper descriptor array exports", () => {
    const body = () => "ok";
    const normalized = normalizeHelperModule([{ name: "helper", body }]);

    assert.deepEqual(normalized, [{ name: "helper", body }]);
  });

  test("accepts helper registration function exports", () => {
    const register = () => undefined;
    const normalized = normalizeHelperModule(register);

    assert.equal(normalized, register);
  });

  test("rejects helper objects with non-function values", () => {
    assert.throws(() => normalizeHelperModule({ helper: true }), /Expected helper "helper" to be a function/);
  });

  test("rejects invalid helper descriptors", () => {
    assert.throws(() => normalizeHelperModule([{ name: "helper" }]), /Expected helper descriptor at index 0/);
  });
});
