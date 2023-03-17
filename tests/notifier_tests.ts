import { IAction } from "../src/actions/action";
import { Notifier } from "../src/notifier";
import { settings } from "../src/settings";

export default QUnit.module("Notifier model");

const testCssClasses = {
  root: "alert",
  info: "alert-info",
  error: "alert-error",
  success: "alert-success",
  button: "alert-button",
  shown: "alert-shown",
};

QUnit.test("getCssClass", function (assert) {
  const notifier = new Notifier(testCssClasses);

  assert.equal(notifier.getCssClass("error"), "alert alert-error");
  assert.equal(notifier.getCssClass("info"), "alert alert-info");
  assert.equal(notifier.getCssClass("text"), "alert alert-info");
  assert.equal(notifier.getCssClass("success"), "alert alert-success");
});

QUnit.test("action bar: button css", function (assert) {
  const notifier = new Notifier(testCssClasses);

  assert.ok(!!notifier.actionBar);
  assert.equal(notifier.actionBar.actions.length, 0);

  notifier.addAction(<IAction>{ id: "test", title: "Test" }, "error");
  assert.equal(notifier.actionBar.actions.length, 1);

  const testAction = notifier.actionBar.actions[0];
  assert.equal(testAction.innerCss, testCssClasses.button);
});

QUnit.test("action bar: button visibility", function (assert) {
  const notifier = new Notifier(testCssClasses);
  notifier.addAction(<IAction>{ id: "test", title: "Test" }, "error");
  assert.equal(notifier.actionBar.actions.length, 1);

  const testAction = notifier.actionBar.actions[0];
  assert.equal(testAction.visible, false);

  notifier.updateActionsVisibility("error");
  assert.equal(testAction.visible, true);

  notifier.updateActionsVisibility("info");
  assert.equal(testAction.visible, false);

  notifier.updateActionsVisibility("error");
  assert.equal(testAction.visible, true);

  notifier.updateActionsVisibility("success");
  assert.equal(testAction.visible, false);
});

QUnit.test("message box visibility", function (assert) {
  const done = assert.async(2);
  const notifier = new Notifier(testCssClasses);
  notifier.notify("Test", "success");
  assert.equal(notifier.active, true);
  assert.equal(notifier.css, "alert alert-success alert-shown");

  setTimeout(() => {
    assert.equal(notifier.active, false, "success message is hidden");
    assert.equal(notifier.css, "alert");

    done();

    notifier.notify("Error", "error");
    assert.equal(notifier.active, true);
    assert.equal(notifier.css, "alert alert-error alert-shown");

    setTimeout(() => {
      assert.equal(notifier.active, true, "error message is visible");
      assert.equal(notifier.css, "alert alert-error alert-shown");

      done();
    }, settings.notifications.lifetime + 120);
  }, settings.notifications.lifetime + 120);

});