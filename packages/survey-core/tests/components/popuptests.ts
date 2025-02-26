import { PopupUtils } from "../../src/utils/popup";
import { IPopupOptionsBase, PopupModel } from "../../src/popup";
import { PopupBaseViewModel } from "../../src/popup-view-model";
import { createPopupViewModel } from "../../src/popup-utils";
import { surveyLocalization } from "../../src/surveyStrings";
import { PopupDropdownViewModel } from "../../src/popup-dropdown-view-model";
import { PopupModalViewModel } from "../../src/popup-modal-view-model";
import { englishStrings } from "../../src/localization/english";
import { germanSurveyStrings } from "../../src/localization/german";
import { settings, ISurveyEnvironment } from "../../src/settings";
import { AnimationOptions, AnimationUtils } from "../../src/utils/animation";
import { ListModel } from "../../src/list";
import { Action, IAction } from "../../src/actions/action";

// const popupTemplate = require("html-loader?interpolate!val-loader!../../../../src/knockout/components/popup/popup.html");

const popupTemplate = `<div>
  <!-- ko with: popupViewModel -->
  <div class="sv-popup" tabindex="-1"
    data-bind="visible: isVisible, click: function(data, event) { clickOutside(event); return true; }, class: styleClass, event: { keydown: function(data, event) { onKeyDown(event); return true; } }">
    <div class="sv-popup__container"
      data-bind="style: { left: left, top: top, height: height, minWidth: minWidth, width: width }, click: function() { return true; }, clickBubble: false">
      <!-- ko if: $data.showHeader -->
      <!-- ko template: { name: $data.popupHeaderTemplate, data: $data } -->
      <!-- /ko -->
      <!-- /ko -->
      <div class="sv-popup__body-content">
        <!-- ko if: !!title  -->
        <div class="sv-popup__body-header" data-bind="text: title"></div>
        <!-- /ko -->
        <div class="sv-popup__scrolling-content">
          <div class="sv-popup__content"
            data-bind="component: { name: contentComponentName, params: contentComponentData }"></div>
        </div>
        <!-- ko if: showFooter  -->
        <div class="sv-popup__body-footer">
          <!-- ko component: { name: "sv-action-bar", params: { model: $data.footerToolbar } } -->
          <!-- /ko -->
        </div>
        <!-- /ko -->
      </div>
    </div>
  </div>
  <!-- /ko -->
</div>
`;

export default QUnit.module("Popup");

function addElementIntoBody(element: HTMLElement) {
  document.body.style.margin = "0px";
  document.body.appendChild(element);
}
function getPopupContainer(root: HTMLElement) {
  return <HTMLElement>root?.querySelector(".sv-popup__container");
}

function createPopupViewModelTest(model: PopupModel, target: HTMLElement) {
  model.getTargetCallback = () => target;
  return createPopupViewModel(model);
}

const targetRect = {
  left: 20,
  top: 20,
  width: 50,
  height: 50,
  right: 70,
  bottom: 70,
};

//TODO: disable setTimeout when testing
const toggleVisibility = PopupModel.prototype.toggleVisibility;
PopupModel.prototype.toggleVisibility = function () {
  var prevSetTimeout = window.setTimeout;
  (<any>window).setTimeout = function (callback: any) {
    callback();
  };
  toggleVisibility.apply(this, arguments);
  window.setTimeout = prevSetTimeout;
};
//

QUnit.test("PopupModel defaults", (assert) => {
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data);

  assert.equal(model.contentComponentName, "sv-list");
  assert.equal(model.contentComponentData, data);
  assert.equal(model.verticalPosition, "bottom");
  assert.equal(model.horizontalPosition, "left");
  assert.equal(model.showPointer, true);
  assert.equal(model.isModal, false);
  assert.equal(typeof model.onCancel, "function");
  assert.equal(typeof model.onApply, "function");
  assert.equal(typeof model.onHide, "function");
  assert.equal(typeof model.onShow, "function");
  assert.equal(model.cssClass, "");
  assert.ok(model.onVisibilityChanged.isEmpty);
});

QUnit.test("PopupModel toggleVisibility", (assert) => {
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data);

  let trace = "";

  model.toggleVisibility();
  assert.equal(trace, "");

  model.onVisibilityChanged.add(() => {
    trace += "->onToggleVisibility";
  });

  model.toggleVisibility();
  assert.equal(trace, "->onToggleVisibility");
});

QUnit.test("PopupDropdownViewModel defaults", (assert) => {
  surveyLocalization.currentLocale = "";
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data);

  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.contentComponentName, "sv-list");
  assert.equal(viewModel.contentComponentData, data);
  assert.equal(viewModel.model.verticalPosition, "bottom");
  assert.equal(viewModel.model.horizontalPosition, "left");
  assert.equal(viewModel.showHeader, true);
  assert.equal(viewModel.isModal, false);
  assert.equal(typeof viewModel.model.onCancel, "function");
  assert.equal(typeof viewModel.model.onApply, "function");
  assert.equal(typeof viewModel.model.onHide, "function");
  assert.equal(typeof viewModel.model.onShow, "function");
  assert.equal(viewModel.model.cssClass, "");

  //assert.equal(ko.isWritableObservable(viewModel.top), true);
  assert.equal(viewModel.top, "0px");
  //assert.equal(ko.isWritableObservable(viewModel.left), true);
  assert.equal(viewModel.left, "0px");
  //assert.equal(ko.isWritableObservable(viewModel.popupDirection), true);
  assert.equal(viewModel.popupDirection, "left");
  //assert.equal(ko.isWritableObservable(viewModel.pointerTarget), true);
  assert.deepEqual(viewModel.pointerTarget, { left: "0px", top: "0px" });
  // assert.equal(ko.isWritableObservable(viewModel.isVisible), true);
  assert.equal(viewModel.isVisible, false);

  const container: HTMLElement = viewModel.container;
  assert.equal(!!container, true);
  assert.equal(container.tagName, "DIV");
  assert.notEqual(container.innerHTML.indexOf('<div class="sv-popup"'), 0);
  assert.equal(container.parentElement.tagName, "BODY");

  assert.equal(viewModel.footerToolbar.actions.length, 1);
  assert.equal(viewModel.footerToolbar.actions[0].title, viewModel.cancelButtonText);

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupDropdownViewModel RTL", (assert) => {
  surveyLocalization.currentLocale = "";
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data, { horizontalPosition: "right" });

  document.dir = "rtl";
  const targetElement: HTMLElement = document.createElement("div");
  targetElement.style.position = "absolute";
  targetElement.style.top = "1000px";
  targetElement.style.left = "1000px";
  targetElement.style.width = "32px";
  targetElement.style.height = "24px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = viewModel.container.querySelector(".sv-popup__container") as HTMLElement;
  popupContainer.style.width = "200px";
  popupContainer.style.height = "400px";
  popupContainer.style.margin = "8px";

  (<any>window).innerHeight = 2000;
  (<any>window).innerWidth = 2000;
  viewModel.updateOnShowing();

  viewModel.updatePosition(false, false);
  assert.equal(viewModel.popupDirection, "left");

  viewModel.dispose();
  targetElement.remove();
  document.dir = "";
});

QUnit.test("PopupDropdownViewModel custom environment", (assert) => {
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data);

  const shadowRootWrapper = document.createElement("div");
  const shadowRoot = shadowRootWrapper.attachShadow({ mode: "open" });

  const popupMountContainer = document.createElement("div");
  popupMountContainer.setAttribute("id", "shadowElement");
  shadowRoot.appendChild(popupMountContainer);

  const environment: ISurveyEnvironment = {
    ...settings.environment,
    root: shadowRoot,
    rootElement: shadowRoot,
    popupMountContainer
  };

  settings.environment = environment as any;

  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  const container: HTMLElement = viewModel.container;
  assert.equal(!!container, true);
  assert.equal(container.tagName, "DIV");
  assert.notEqual(container.innerHTML.indexOf('<div class="sv-popup"'), 0);

  assert.equal(container.parentElement?.tagName, "DIV");
  assert.equal(container.parentElement?.id, "shadowElement");

  viewModel.dispose();
  targetElement.remove();
  popupMountContainer.remove();
  shadowRootWrapper.remove();

  settings.environment = {
    ...settings.environment,
    root: document,
    rootElement: document.body,
    popupMountContainer: document.body,
  };
});

QUnit.test("PopupModalViewModel defaults", (assert) => {
  surveyLocalization.currentLocale = "";
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data);
  model.isModal = true;
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupModalViewModel = createPopupViewModelTest(model, targetElement) as PopupModalViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.contentComponentName, "sv-list");
  assert.equal(viewModel.contentComponentData, data);
  assert.equal(viewModel.model.verticalPosition, "bottom");
  assert.equal(viewModel.model.horizontalPosition, "left");
  assert.equal(viewModel.isModal, true);
  assert.equal(typeof viewModel.model.onCancel, "function");
  assert.equal(typeof viewModel.model.onApply, "function");
  assert.equal(typeof viewModel.model.onHide, "function");
  assert.equal(typeof viewModel.model.onShow, "function");
  assert.equal(viewModel.model.cssClass, "");
  assert.equal(viewModel.isVisible, false);

  const container: HTMLElement = viewModel.container;
  assert.equal(!!container, true);
  assert.equal(container.tagName, "DIV");
  assert.notEqual(container.innerHTML.indexOf('<div class="sv-popup"'), 0);
  assert.equal(container.parentElement.tagName, "BODY");

  assert.equal(viewModel.applyButtonText, "Apply");
  assert.equal(viewModel.cancelButtonText, "Cancel");
  assert.equal(viewModel.footerToolbar.actions.length, 2);
  assert.equal(viewModel.footerToolbar.actions[0].title, viewModel.cancelButtonText);
  assert.equal(viewModel.footerToolbar.actions[1].title, viewModel.applyButtonText);

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModalViewModel getActualHorizontalPosition", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.model.horizontalPosition, "left");
  assert.equal(viewModel["getActualHorizontalPosition"](), "left");

  document.body.style.direction = "rtl";
  assert.equal(viewModel["getActualHorizontalPosition"](), "right");

  document.body.style.direction = "";
  assert.equal(viewModel["getActualHorizontalPosition"](), "left");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupViewModel styleClass", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown sv-popup--show-pointer sv-popup--left");
  model.cssClass = "my-css-class";
  assert.equal(viewModel.styleClass, "my-css-class sv-popup--menu sv-popup--dropdown sv-popup--show-pointer sv-popup--left");

  viewModel.popupDirection = "down";
  assert.equal(viewModel.styleClass, "my-css-class sv-popup--menu sv-popup--dropdown sv-popup--show-pointer sv-popup--down");

  model.showPointer = false;
  assert.equal(viewModel.styleClass, "my-css-class sv-popup--menu sv-popup--dropdown");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupViewModel isVisible", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.deepEqual(viewModel.pointerTarget, { left: "0px", top: "0px" });

  let trace: String = "";
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  model.toggleVisibility();

  //viewModel.isVisible(!viewModel.isVisible());
  assert.equal(trace, "->onShow");
  assert.equal(viewModel.isVisible, true);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.equal(viewModel.pointerTarget.left, "0px");
  assert.equal(viewModel.pointerTarget.top, "0px");
  trace = "";

  model.toggleVisibility();
  //viewModel.isVisible(!viewModel.isVisible());
  assert.equal(trace, "->onHide");
  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.equal(viewModel.pointerTarget.left, "0px");
  assert.equal(viewModel.pointerTarget.top, "0px");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel toggleVisibility", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;

  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.deepEqual(viewModel.pointerTarget, { left: "0px", top: "0px" });

  let trace: String = "";
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  model.toggleVisibility();
  //viewModel.isVisible(!viewModel.isVisible());
  assert.equal(trace, "->onShow");
  assert.equal(viewModel.isVisible, true);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.equal(viewModel.pointerTarget.left, "0px");
  assert.equal(viewModel.pointerTarget.top, "0px");
  trace = "";

  model.toggleVisibility();
  //viewModel.isVisible(!viewModel.isVisible());
  assert.equal(trace, "->onHide");
  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.equal(viewModel.pointerTarget.left, "0px");
  assert.equal(viewModel.pointerTarget.top, "0px");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel PopupDropdownViewModel clickOutside", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.deepEqual(viewModel.pointerTarget, { left: "0px", top: "0px" });

  let trace: String = "";
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  viewModel.clickOutside();
  assert.equal(trace, "");
  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.deepEqual(viewModel.pointerTarget, { left: "0px", top: "0px" });
  trace = "";

  model.toggleVisibility();
  trace = "";
  viewModel.clickOutside();
  assert.equal(trace, "->onHide");
  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.popupDirection, "left");
  assert.equal(viewModel.pointerTarget.left, "0px");
  assert.equal(viewModel.pointerTarget.top, "0px");
  trace = "";

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel PopupModalViewModel clickOutside", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  model.isModal = true;
  const viewModel: PopupModalViewModel = createPopupViewModelTest(model, targetElement) as PopupModalViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.isVisible, false);

  let trace: String = "";
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  model.toggleVisibility();
  trace = "";
  viewModel.clickOutside();
  assert.equal(trace, "");
  assert.equal(viewModel.isVisible, true);
  trace = "";

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel cancel", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupBaseViewModel = createPopupViewModelTest(
    model,
    targetElement
  );
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.isVisible, false);

  let trace: String = "";
  model.onCancel = () => {
    trace += "->onCancel";
  };
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  viewModel.cancel();
  assert.equal(trace, "->onCancel");
  assert.equal(viewModel.isVisible, false);
  trace = "";

  model.toggleVisibility();
  trace = "";
  viewModel.cancel();
  assert.equal(trace, "->onCancel->onHide");
  assert.equal(viewModel.isVisible, false);
  trace = "";

  model.isModal = true;
  model.toggleVisibility();
  trace = "";
  viewModel.cancel();
  assert.equal(trace, "->onCancel->onHide");
  assert.equal(viewModel.isVisible, false);
  trace = "";

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel apply", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  model.isModal = true;
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupModalViewModel = createPopupViewModelTest(model, targetElement) as PopupModalViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.isVisible, false);

  let trace: String = "";
  model.onApply = () => {
    trace += "->onApply";
    return true;
  };
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  viewModel.apply();
  assert.equal(trace, "->onApply");
  assert.equal(viewModel.isVisible, false);
  trace = "";

  model.toggleVisibility();
  trace = "";
  viewModel.apply();
  assert.equal(trace, "->onApply->onHide");
  assert.equal(viewModel.isVisible, false);
  trace = "";

  model.isModal = true;
  model.toggleVisibility();
  trace = "";
  viewModel.apply();
  assert.equal(trace, "->onApply->onHide");
  assert.equal(viewModel.isVisible, false);
  trace = "";

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel apply when not allow", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  model.isModal = true;
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupModalViewModel = createPopupViewModelTest(model, targetElement) as PopupModalViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.isVisible, false);

  let canApply = false;
  model.onApply = (): boolean => {
    return canApply;
  };

  model.toggleVisibility();
  assert.equal(viewModel.isVisible, true);
  viewModel.apply();
  assert.equal(viewModel.isVisible, true);
  canApply = true;
  viewModel.apply();
  assert.equal(viewModel.isVisible, false);

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupViewModel dispose", (assert) => {
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data);

  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupBaseViewModel = createPopupViewModelTest(
    model,
    targetElement
  );
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  const container: HTMLElement = viewModel.container;

  viewModel.dispose();

  let trace: String = "";
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  model.isVisible = true;
  assert.equal(trace, "");
  assert.equal(!!viewModel.container, false);
  assert.equal(container.tagName, "DIV");
  assert.notEqual(container.innerHTML.indexOf('<div class="sv-popup"'), 0);

  targetElement.remove();
});

QUnit.test("PopupViewModel initialize/dispose", (assert) => {
  const data = {};
  const model: PopupModel = new PopupModel("sv-list", data);

  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupBaseViewModel = createPopupViewModelTest(
    model,
    targetElement
  );

  assert.equal(!!viewModel.container, false);
  viewModel.initializePopupContainer();
  assert.equal(!!viewModel.container, true);

  viewModel.dispose();
  assert.equal(!!viewModel.container, false);

  targetElement.remove();
});

QUnit.test("Check calculatePosition method", (assert) => {
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "top", "left"), { left: 0, top: 60 }, "top left");
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "top", "center"), { left: 35, top: 10 }, "top center");
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "top", "right"), { left: 70, top: 60 }, "top right");

  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "middle", "left"), { left: 0, top: 40 }, "middle left");
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "middle", "center"), { left: 35, top: 40 }, "middle center");
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "middle", "right"), { left: 70, top: 40 }, "middle right");

  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "bottom", "left"), { left: 0, top: 20 }, "bottom left");
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "bottom", "center"), { left: 35, top: 70 }, "bottom center");
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "bottom", "right"), { left: 70, top: 20 }, "bottom right");

  //cases with pointer
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "top", "left"/*, true*/), { left: 0, top: 60 });
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "top", "right"/*, true*/), { left: 70, top: 60 });
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "bottom", "left"/*, true*/), { left: 0, top: 20 });
  assert.deepEqual(PopupUtils.calculatePosition(<any>targetRect, 10, 20, "bottom", "right"/*, true*/), { left: 70, top: 20 });
});

QUnit.test("Check calculatateDirection method", (assert) => {
  assert.deepEqual(PopupUtils.calculatePopupDirection("top", "left"), "left");

  assert.deepEqual(PopupUtils.calculatePopupDirection("top", "center"), "top");

  assert.deepEqual(PopupUtils.calculatePopupDirection("top", "right"), "right");
  assert.deepEqual(
    PopupUtils.calculatePopupDirection("middle", "left"),
    "left"
  );
  assert.deepEqual(
    PopupUtils.calculatePopupDirection("middle", "center"),
    undefined
  );
  assert.deepEqual(
    PopupUtils.calculatePopupDirection("middle", "right"),
    "right"
  );
  assert.deepEqual(
    PopupUtils.calculatePopupDirection("bottom", "left"),
    "left"
  );
  assert.deepEqual(
    PopupUtils.calculatePopupDirection("bottom", "center"),
    "bottom"
  );
  assert.deepEqual(
    PopupUtils.calculatePopupDirection("bottom", "right"),
    "right"
  );
});

QUnit.test("Check calculatePointer target method", (assert) => {
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(<any>targetRect, 10, 10, "top", "left"),
    { left: 10, top: 35 }
  );

  assert.deepEqual(
    PopupUtils.calculatePointerTarget(<any>targetRect, 10, 10, "top", "center"),
    { left: 35, top: 10 }
  );

  assert.deepEqual(
    PopupUtils.calculatePointerTarget(<any>targetRect, 10, 10, "top", "right"),
    { left: 60, top: 35 }
  );
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      10,
      "middle",
      "left"
    ),
    { left: 10, top: 35 }
  );
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      20,
      "middle",
      "center"
    ),
    { left: NaN, top: NaN }
  );
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      10,
      "middle",
      "right"
    ),
    { left: 60, top: 35 }
  );

  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      10,
      "bottom",
      "left"
    ),
    { left: 10, top: 35 }
  );
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      10,
      "bottom",
      "left",
      10,
      15
    ),
    { left: -15, top: 35 }, "pointer target takes into account margin"
  );
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      10,
      "bottom",
      "center"
    ),
    { left: 35, top: 60 }
  );
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      10,
      "bottom",
      "center",
      10,
      15
    ),
    { left: 25, top: 60 }, "pointer target takes into account margin"
  );
  assert.deepEqual(
    PopupUtils.calculatePointerTarget(
      <any>targetRect,
      10,
      10,
      "bottom",
      "right"
    ),
    { left: 60, top: 35 }
  );
});

QUnit.test("Check calculatePosition with window size method", (assert) => {
  let targetRect: any = {
    left: 50,
    top: 250,
    width: 50,
    height: 20,
    right: 100,
    bottom: 270,
  };
  let windowHeight = 300;
  let verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    100,
    "center",
    "bottom",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "top",
    "vertical position is changed to top cause doesn't fit in bottom"
  );
  targetRect.top = 50;
  targetRect.bottom = 70;
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    100,
    "center",
    "top",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "bottom",
    "vertical position is changed to bottom cause doesn't fit in top"
  );
  targetRect.top = 200;
  targetRect.bottom = 220;
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    300,
    "center",
    "top",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "top",
    "both directions do not fit: result top"
  );
  targetRect.top = 100;
  targetRect.bottom = 120;
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    300,
    "center",
    "top",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "bottom",
    "both directions do not fit: result bottom"
  );
  targetRect.top = 50;
  targetRect.bottom = 70;
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    60,
    "left",
    "top",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "top",
    "with pointer: top vertical position is not changed"
  );
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    100,
    "left",
    "top",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "bottom",
    "with pointer: top vertical position is changed to bottom"
  );

  targetRect.top = 250;
  targetRect.bottom = 270;
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    40,
    "left",
    "bottom",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "bottom",
    "with pointer: bottom vertical position is not changed"
  );
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    100,
    "left",
    "bottom",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "top",
    "with pointer: bottom vertical position is changed to top"
  );
  targetRect.top = 200;
  targetRect.bottom = 220;
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    300,
    "left",
    "top",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "top",
    "with pointer: both directions do not fit: result top"
  );
  targetRect.top = 100;
  targetRect.bottom = 120;
  verticalPosition = PopupUtils.updateVerticalPosition(
    targetRect,
    300,
    "left",
    "top",
    windowHeight
  );
  assert.deepEqual(
    verticalPosition,
    "bottom",
    "with pointer: both directions do not fit: result bottom"
  );
});

QUnit.test("Check calculatePosition with window size method", (assert) => {
  let targetRect: any = {
    top: 50,
    left: 250,
    height: 50,
    width: 20,
    bottom: 100,
    right: 270,
  };
  let windowWidth = 300;
  let horizontalPosition = PopupUtils.updateHorizontalPosition(targetRect, 100, "right", windowWidth);
  assert.deepEqual(horizontalPosition, "left", "horizontal position is changed to top cause doesn't fit in right");

  horizontalPosition = PopupUtils.updateHorizontalPosition(targetRect, 25, "right", windowWidth);
  assert.deepEqual(horizontalPosition, "right", "right horizontal position is not changed");

  targetRect.left = 50;
  targetRect.right = 70;
  horizontalPosition = PopupUtils.updateHorizontalPosition(targetRect, 100, "left", windowWidth);
  assert.deepEqual(horizontalPosition, "right", "horizontal position is changed to bottom cause doesn't fit in left");

  horizontalPosition = PopupUtils.updateHorizontalPosition(targetRect, 40, "left", windowWidth);
  assert.deepEqual(horizontalPosition, "left", "left horizontal position is not changed");

  targetRect.left = 200;
  targetRect.right = 220;
  horizontalPosition = PopupUtils.updateHorizontalPosition(targetRect, 300, "left", windowWidth);
  assert.deepEqual(horizontalPosition, "left", "both directions do not fit: result left");

  targetRect.left = 100;
  targetRect.right = 120;
  horizontalPosition = PopupUtils.updateHorizontalPosition(targetRect, 300, "left", windowWidth);
  assert.deepEqual(horizontalPosition, "right", "both directions do not fit: result right");
});

QUnit.test("Check getCorrectedVerticalDimensions if both directions do not fit", (assert) => {
  let newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(-20, 200, 300, "bottom");
  assert.equal(newVerticalDimensions.height, 180);
  assert.equal(newVerticalDimensions.top, 0);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(150, 200, 300, "bottom");
  assert.equal(newVerticalDimensions.height, 150 - PopupUtils.bottomIndent);
  assert.equal(newVerticalDimensions.top, 150);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(150, 450, 300, "bottom");
  assert.equal(newVerticalDimensions.height, 150 - PopupUtils.bottomIndent);
  assert.equal(newVerticalDimensions.top, 150);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(10, 200, 300, "bottom");
  assert.notOk(newVerticalDimensions);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(10, 200, 300, "top");
  assert.equal(newVerticalDimensions.height, 200);
  assert.equal(newVerticalDimensions.top, 10);
});

QUnit.test("Check getCorrectedVerticalDimensions if both directions do not fit and canShrink = false", (assert) => {
  let newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(-20, 200, 300, "bottom", false);
  assert.equal(newVerticalDimensions.height, 200);
  assert.equal(newVerticalDimensions.top, 0);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(150, 200, 300, "bottom", false);
  assert.equal(newVerticalDimensions.height, 200);
  assert.equal(newVerticalDimensions.top, 100 - PopupUtils.bottomIndent);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(150, 450, 300, "bottom", false);
  assert.equal(newVerticalDimensions.height, 300 - PopupUtils.bottomIndent);
  assert.equal(newVerticalDimensions.top, 0);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(10, 200, 300, "bottom", false);
  assert.notOk(newVerticalDimensions);

  newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(10, 200, 300, "top", false);
  assert.equal(newVerticalDimensions.height, 200);
  assert.equal(newVerticalDimensions.top, 10);
});

QUnit.test("Check updateHorizontalDimensions", (assert) => {
  let newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(-20, 200, 300, "center");
  assert.equal(newHorizontalDimensions.width, 200, "updateHorizontalDimensions - center - fitting left out - width");
  assert.equal(newHorizontalDimensions.left, 0, "updateHorizontalDimensions - center - fitting left out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(-100, 300, 250, "center");
  assert.equal(newHorizontalDimensions.width, 250, "updateHorizontalDimensions - center - not-fitting left out - width");
  assert.equal(newHorizontalDimensions.left, 0, "updateHorizontalDimensions - center - not-fitting left out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(100, 200, 250, "center");
  assert.equal(newHorizontalDimensions.width, 200, "updateHorizontalDimensions - center - fitting right out - width");
  assert.equal(newHorizontalDimensions.left, 50, "updateHorizontalDimensions - center - fitting right out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(100, 300, 250, "center");
  assert.equal(newHorizontalDimensions.width, 250, "updateHorizontalDimensions - center - non-fitting right out - width");
  assert.equal(newHorizontalDimensions.left, 0, "updateHorizontalDimensions - center - non-fitting right out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(-20, 200, 300, "left");
  assert.equal(newHorizontalDimensions.width, 200, "updateHorizontalDimensions - left - left out - width");
  assert.equal(newHorizontalDimensions.left, 0, "updateHorizontalDimensions - left - left out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(100, 250, 300, "right");
  assert.equal(newHorizontalDimensions.width, 200, "updateHorizontalDimensions - right - right out - width");
  assert.equal(newHorizontalDimensions.left, 100, "updateHorizontalDimensions - right - right out - left");
}
);
QUnit.test("Check updateHorizontalDimensions with margins positionMode is flex", (assert) => {
  let newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(100, 300, 250, "center", "flex", { left: 10, right: 15 });
  assert.equal(newHorizontalDimensions.width, 225, "updateHorizontalDimensions - center+flex - non-fitting right out - width");
  assert.equal(newHorizontalDimensions.left, 10, "updateHorizontalDimensions - center+flex - non-fitting right out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(-20, 200, 300, "left", "flex", { left: 10, right: 15 });
  assert.equal(newHorizontalDimensions.width, 200, "updateHorizontalDimensions - left+flex - left out - width");
  assert.equal(newHorizontalDimensions.left, 10, "updateHorizontalDimensions - left+flex - left out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(100, 250, 300, "right", "flex", { left: 10, right: 15 });
  assert.equal(newHorizontalDimensions.width, 175, "updateHorizontalDimensions - right+flex - right out - width");
  assert.equal(newHorizontalDimensions.left, 100, "updateHorizontalDimensions - right+flex - right out - left");
});

QUnit.test("Check updateHorizontalDimensions positionMode is fixed", (assert) => {
  let newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(100, 300, 250, "center", "fixed", { left: 10, right: 15 });
  assert.equal(newHorizontalDimensions.width, 125, "updateHorizontalDimensions - center+fixed - non-fitting right out - width");
  assert.equal(newHorizontalDimensions.left, 90, "updateHorizontalDimensions - center+fixed - non-fitting right out - left");

  newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(100, 300, 250, "center", "fixed");
  assert.equal(newHorizontalDimensions.width, 150, "updateHorizontalDimensions - center+fixed - without margin");
  assert.equal(newHorizontalDimensions.left, 100, "updateHorizontalDimensions - center+fixed - without margin");
});

QUnit.test("PopupModel dropdown displayMode", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.showFooter, false);
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown sv-popup--show-pointer sv-popup--left");
  model.displayMode = "overlay";
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel displayMode overlay and overlayDisplayMode", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.showFooter, false);
  assert.equal(model.overlayDisplayMode, "auto");

  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown sv-popup--show-pointer sv-popup--left", "default");
  model.displayMode = "overlay";
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown", "overlayDisplayMode auto");

  model.overlayDisplayMode = "dropdown-overlay";
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--menu-overlay sv-popup--menu-phone", "overlayDisplayMode dropdown-overlay");

  model.overlayDisplayMode = "tablet-dropdown-overlay";
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--menu-overlay sv-popup--menu-tablet", "overlayDisplayMode tablet-dropdown-overlay");

  model.overlayDisplayMode = "plain";
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown", "overlayDisplayMode plain");

  model.overlayDisplayMode = "auto";
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown", "overlayDisplayMode auto");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel isModal displayMode", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  model.isModal = true;
  const viewModel: PopupModalViewModel = createPopupViewModelTest(model, targetElement) as PopupModalViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  assert.equal(viewModel.styleClass, "sv-popup--modal");
  model.displayMode = "overlay";
  assert.equal(viewModel.styleClass, "sv-popup--modal-overlay");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel and locale", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {});
  const targetElement: HTMLElement = document.createElement("div");
  const viewModel: PopupModalViewModel = createPopupViewModelTest(model, targetElement) as PopupModalViewModel;
  viewModel.initializePopupContainer();
  assert.equal(viewModel.getLocalizationString("modalApplyButtonText"), englishStrings.modalApplyButtonText, "en Apply text");
  viewModel.locale = "de";
  assert.equal(viewModel.getLocalizationString("modalApplyButtonText"), germanSurveyStrings.modalApplyButtonText, "de Apply text");
  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel top+center position calculate", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "top", horizontalPosition: "center", showPointer: true });
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "1000px";
  targetElement.style.left = "1000px";
  targetElement.style.width = "32px";
  targetElement.style.height = "24px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = viewModel.container.querySelector(".sv-popup__container") as HTMLElement;
  popupContainer.style.width = "200px";
  popupContainer.style.height = "400px";
  popupContainer.style.margin = "8px";

  (<any>window).innerHeight = 2000;
  (<any>window).innerWidth = 2000;
  viewModel.updateOnShowing();
  assert.equal(viewModel.left, (1000 - 200 / 2 - 8 + 32 / 2) + "px");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupModel top+left position calculate", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "top", horizontalPosition: "left", showPointer: true });
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "1000px";
  targetElement.style.left = "1000px";
  targetElement.style.width = "32px";
  targetElement.style.height = "24px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "200px";
  popupContainer.style.height = "400px";
  popupContainer.style.margin = "8px";

  (<any>window).innerHeight = 2000;
  (<any>window).innerWidth = 2000;
  viewModel.updateOnShowing();
  assert.equal(viewModel.pointerTarget.left, "200px");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("Fixed PopupModel width calculate setWidthByTarget = false", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  model.positionMode = "fixed";
  model.setWidthByTarget = false;
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "700px";
  popupContainer.style.height = "400px";

  (<any>window).innerWidth = 1000;
  (<any>window).innerHeight = 800;
  model.toggleVisibility();
  viewModel.updateOnShowing();
  assert.equal(viewModel.minWidth, "auto", "minWidth");
  assert.equal(viewModel.width, "auto", "width");
  assert.equal(viewModel.left, "200px", "left");
  assert.equal(viewModel.top, "178px", "top");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("Fixed PopupModel width calculate if short content setWidthByTarget = false", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  model.positionMode = "fixed";
  model.setWidthByTarget = false;
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "200px";
  popupContainer.style.height = "400px";

  (<any>window).innerWidth = 1000;
  (<any>window).innerHeight = 800;
  model.toggleVisibility();
  viewModel.updateOnShowing();
  assert.equal(viewModel.minWidth, "auto", "minWidth");
  assert.equal(viewModel.width, "auto", "width");
  assert.equal(viewModel.left, "200px", "left");
  assert.equal(viewModel.top, "178px", "top");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("Fixed PopupModel width calculate and overflow content position calculate setWidthByTarget = false", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  model.positionMode = "fixed";
  model.setWidthByTarget = false;
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "1500px";
  popupContainer.style.height = "400px";

  (<any>window).innerWidth = 1000;
  (<any>window).innerHeight = 800;
  model.toggleVisibility();
  viewModel.updateOnShowing();
  assert.equal(viewModel.minWidth, "auto", "minWidth");
  assert.equal(viewModel.width, "800px", "width");
  assert.equal(viewModel.left, "200px", "left");
  assert.equal(viewModel.top, "178px", "top");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("Fixed PopupModel width calculate", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  model.positionMode = "fixed";
  model.setWidthByTarget = true;
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "700px";
  popupContainer.style.height = "400px";

  (<any>window).innerWidth = 1000;
  (<any>window).innerHeight = 800;
  model.toggleVisibility();
  viewModel.updateOnShowing();
  assert.equal(viewModel.minWidth, "560px", "minWidth");
  assert.equal(viewModel.width, "560px", "width");
  assert.equal(viewModel.left, "200px", "left");
  assert.equal(viewModel.top, "178px", "top");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("Fixed PopupModel width calculate if short content", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  model.positionMode = "fixed";
  model.setWidthByTarget = true;
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "200px";
  popupContainer.style.height = "400px";

  (<any>window).innerWidth = 1000;
  (<any>window).innerHeight = 800;
  model.toggleVisibility();
  viewModel.updateOnShowing();
  assert.equal(viewModel.minWidth, "560px", "minWidth");
  assert.equal(viewModel.width, "560px", "width");
  assert.equal(viewModel.left, "200px", "left");
  assert.equal(viewModel.top, "178px", "top");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("Fixed PopupModel width calculate and overflow content position calculate", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  model.positionMode = "fixed";
  model.setWidthByTarget = true;
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "1500px";
  popupContainer.style.height = "400px";

  (<any>window).innerWidth = 1000;
  (<any>window).innerHeight = 800;
  model.toggleVisibility();
  viewModel.updateOnShowing();
  assert.equal(viewModel.minWidth, "560px", "minWidth");
  assert.equal(viewModel.width, "560px", "width");
  assert.equal(viewModel.left, "200px", "left");
  assert.equal(viewModel.top, "178px", "top");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupViewModel updateOnHiding", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  model.positionMode = "fixed";
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = viewModel.container.querySelector(".sv-popup__container") as HTMLElement;
  popupContainer.style.width = "550px";
  popupContainer.style.height = "400px";

  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.height, "auto");
  assert.equal(viewModel.width, "auto");

  let trace: String = "";
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  model.toggleVisibility();
  (<any>window).innerWidth = 600;
  (<any>window).innerHeight = 400;
  viewModel.updateOnShowing();

  assert.equal(trace, "->onShow");
  assert.equal(viewModel.isVisible, true);
  assert.notEqual(viewModel.top, "0px", "onShow top");
  assert.notEqual(viewModel.left, "0px", "onShow left");
  assert.notEqual(viewModel.height, "auto", "onShow height");
  assert.notEqual(viewModel.width, "auto", "onShow width");
  trace = "";

  model.toggleVisibility();
  assert.equal(trace, "->onHide");
  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px", "onHide top");
  assert.equal(viewModel.left, "0px", "onHide left");
  assert.equal(viewModel.height, "auto", "onHide height");
  assert.equal(viewModel.width, "auto", "onHide width");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("PopupViewModel updateOnHiding displayMode = overlay", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "bottom", horizontalPosition: "center", showPointer: true });
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "130px";
  targetElement.style.left = "200px";
  targetElement.style.width = "560px";
  targetElement.style.height = "48px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  let popupContainer = getPopupContainer(viewModel.container);
  popupContainer.style.width = "550px";
  popupContainer.style.height = "400px";

  model.displayMode = "overlay";
  assert.equal(viewModel.styleClass, "sv-popup--menu sv-popup--dropdown");

  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px");
  assert.equal(viewModel.left, "0px");
  assert.equal(viewModel.height, "auto");
  assert.equal(viewModel.width, "auto");

  let trace: String = "";
  model.onHide = () => {
    trace += "->onHide";
  };
  model.onShow = () => {
    trace += "->onShow";
  };

  model.toggleVisibility();
  (<any>window).innerWidth = 600;
  (<any>window).innerHeight = 400;
  viewModel.updateOnShowing();

  assert.equal(trace, "->onShow");
  assert.equal(viewModel.isVisible, true);
  assert.equal(viewModel.top, "", "onShow top");
  assert.equal(viewModel.left, "", "onShow left");
  assert.equal(viewModel.height, "", "onShow height");
  assert.equal(viewModel.width, "", "onShow width");
  trace = "";

  model.toggleVisibility();
  assert.equal(trace, "->onHide");
  assert.equal(viewModel.isVisible, false);
  assert.equal(viewModel.top, "0px", "onHide top");
  assert.equal(viewModel.left, "0px", "onHide left");
  assert.equal(viewModel.height, "auto", "onHide height");
  assert.equal(viewModel.width, "auto", "onHide width");

  viewModel.dispose();
  targetElement.remove();
});

QUnit.test("Check that modal popup prevents scroll outside", (assert) => {
  let eventLog = "";
  let subscribeLog = "";
  const wrapEvent = (event) => {
    event.preventDefault = () => {
      eventLog += "->prevented";
    };
  };
  const wrapContainer = (element) => {
    const oldAddEventListener = element.addEventListener;
    element.addEventListener = function (name, callback) {
      oldAddEventListener.call(element, name, callback);
      subscribeLog += "->subscribed";
    };
    const oldRemoveEventListener = element.removeEventListener;
    element.removeEventListener = function (name, callback) {
      oldRemoveEventListener.call(element, name, callback);
      subscribeLog += "->unsubscribed";
    };
  };

  const model: PopupModel = new PopupModel("sv-list", {});
  model.isModal = true;
  const viewModel: PopupModalViewModel = createPopupViewModel(model) as PopupModalViewModel;

  const container = document.createElement("div");
  container.innerHTML = `<div style="height: 200px; overflow: auto;">
    <div style="height: 400px;"></div>
  </div>`;
  wrapContainer(container);
  addElementIntoBody(container);
  viewModel.setComponentElement(container);
  model.isVisible = true;
  viewModel.updateOnShowing();
  assert.equal(subscribeLog, "->subscribed");

  let event = new WheelEvent("wheel", { deltaY: 20, cancelable: true });
  wrapEvent(event);
  container.dispatchEvent(event);
  assert.equal(eventLog, "->prevented", "prevented scroll when not scrolling inside");

  eventLog = "";
  event = new WheelEvent("wheel", { deltaY: 20, bubbles: true, cancelable: true });
  wrapEvent(event);
  container.children[0].children[0].dispatchEvent(event);
  assert.equal(eventLog, "", "scroll inside (not prevented)");

  eventLog = "";
  event = new WheelEvent("wheel", { deltaY: -20, bubbles: true, cancelable: true });
  wrapEvent(event);
  container.children[0].scrollTo(0, 20);
  container.children[0].children[0].dispatchEvent(event);
  assert.equal(eventLog, "", "scroll inside (not prevented)");

  eventLog = "";
  event = new WheelEvent("wheel", { deltaY: 20, bubbles: true, cancelable: true });
  wrapEvent(event);
  container.children[0].scrollTo(0, 150);
  container.children[0].children[0].dispatchEvent(event);
  assert.equal(eventLog, "", "scroll inside (not prevented)");

  eventLog = "";
  event = new WheelEvent("wheel", { deltaY: -20, bubbles: true, cancelable: true });
  wrapEvent(event);
  container.children[0].scrollTo(0, 0);
  container.children[0].children[0].dispatchEvent(event);
  assert.equal(eventLog, "->prevented", "overscroll inside (prevented)");

  eventLog = "";
  event = new WheelEvent("wheel", { deltaY: 20, bubbles: true, cancelable: true });
  wrapEvent(event);
  container.children[0].scrollTo(0, 200);
  container.children[0].children[0].dispatchEvent(event);
  assert.equal(eventLog, "->prevented", "overscroll inside (prevented)");

  model.toggleVisibility();
  assert.equal(subscribeLog, "->subscribed->unsubscribed");

  container.remove();
});
QUnit.test("PopupModel into modal window with translate/transform", (assert) => {
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "top", horizontalPosition: "center" });
  const targetElement: HTMLElement = document.createElement("button");

  targetElement.style.position = "absolute";
  targetElement.style.top = "350px";
  targetElement.style.left = "250px";
  targetElement.style.width = "32px";
  targetElement.style.height = "24px";
  addElementIntoBody(targetElement);
  targetElement.parentElement.scrollTop = 0;
  targetElement.parentElement.scrollLeft = 0;

  const viewModel: PopupDropdownViewModel = createPopupViewModelTest(model, targetElement) as PopupDropdownViewModel;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;

  let popupContainer = viewModel.container.querySelector(".sv-popup__container") as HTMLElement;
  popupContainer.style.width = "200px";
  popupContainer.style.height = "400px";

  let fixedPopupContainer = viewModel.container.querySelector(".sv-popup") as HTMLElement;
  fixedPopupContainer.getBoundingClientRect = () => {
    return <DOMRect>{ "x": 100, "y": 200, "width": 1920, "height": 0, "top": 200, "right": 2097, "bottom": 200, "left": 100 };
  };

  (<any>window).innerHeight = 2000;
  (<any>window).innerWidth = 2000;
  viewModel.updateOnShowing();
  assert.equal(viewModel.top, 174 + "px", "top");
  assert.equal(viewModel.left, 66 + "px", "left");

  viewModel.dispose();
  targetElement.remove();
});

class TestAnimation extends AnimationUtils {
  public logger: { log: string };
  public passedEnterClass: string;
  public passedLeaveClass: string;
  public onEnter(options: PopupBaseViewModel): void {
    this.logger.log += "->onEnter";
    this.passedEnterClass = options.getEnterOptions().cssClass;
  }
  public onLeave(options: PopupBaseViewModel, callback: () => void): void {
    this.logger.log += "->onLeave";
    this.passedLeaveClass = options.getLeaveOptions().cssClass;
    callback();
  }
}

class TestAnimationPopupViewModel extends PopupBaseViewModel {
  constructor(model: PopupModel) {
    super(model);
    this["visibilityAnimation"]["animation"] = new TestAnimation();
  }
  public set logger(logger: { log: string }) {
    (this["visibilityAnimation"]["animation"] as any).logger = logger;
  }
  public getAnimation() {
    return this["visibilityAnimation"]["animation"] as TestAnimation;
  }
}

QUnit.test("PopupViewModel: check animation's onEnter, onLeave are called correctly", (assert) => {
  const logger = { log: "" };
  settings.animationEnabled = true;
  const oldQueueMicrotask = window.queueMicrotask;
  window.queueMicrotask = (cb) => cb();
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "top", horizontalPosition: "center" });
  model.onVisibilityChanged.add((_: PopupModel, options: { isVisible: boolean }) => {
    logger.log += `->model:isVisible:${options.isVisible}`;
  });
  const viewModel: TestAnimationPopupViewModel = new TestAnimationPopupViewModel(model);
  viewModel.setComponentElement(document.createElement("div"));
  viewModel.logger = logger;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  viewModel.onVisibilityChanged.add((_: PopupBaseViewModel, options: { isVisible: boolean }) => {
    logger.log += `->viewModel:isVisible:${options.isVisible}`;
  });
  viewModel.enableOnElementRerenderedEvent();
  model.isVisible = true;
  viewModel.afterRerender();
  assert.equal(logger.log, "->model:isVisible:true->viewModel:isVisible:true->onEnter", "correct order of updates when entering");
  assert.deepEqual(viewModel.getAnimation().passedEnterClass, "sv-popup--enter", "correct css classes passed to animation's onEnter");
  logger.log = "";
  model.isVisible = false;
  assert.equal(logger.log, "->model:isVisible:false->onLeave->viewModel:isVisible:false", "correct order of updates when leaving");
  assert.deepEqual(viewModel.getAnimation().passedLeaveClass, "sv-popup--leave", "correct css classes passed to animation's onLeave");
  settings.animationEnabled = false;
  window.queueMicrotask = oldQueueMicrotask;
});

QUnit.test("PopupViewModel: check popupViewModel without container is working correctly", (assert) => {
  const logger = { log: "" };
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "top", horizontalPosition: "center" });
  model.onVisibilityChanged.add((_: PopupModel, options: { isVisible: boolean }) => {
    logger.log += `->model:isVisible:${options.isVisible}`;
  });
  const viewModel: PopupDropdownViewModel = new PopupDropdownViewModel(model);
  viewModel.initializePopupContainer();
  viewModel.onVisibilityChanged.add((_: PopupBaseViewModel, options: { isVisible: boolean }) => {
    logger.log += `->viewModel:isVisible:${options.isVisible}`;
  });
  model.isVisible = true;
  assert.equal(logger.log, "->model:isVisible:true->viewModel:isVisible:true", "correct order of updates when entering without animation");
  logger.log = "";
  model.isVisible = false;
  assert.equal(logger.log, "->model:isVisible:false->viewModel:isVisible:false", "correct order of updates when leaving without animation");
});

QUnit.test("PopupViewModel: check popupViewModel is working correctly when shouldRunAnimation is false", (assert) => {
  const logger = { log: "" };
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "top", horizontalPosition: "center" });
  model.onVisibilityChanged.add((_: PopupModel, options: { isVisible: boolean }) => {
    logger.log += `->model:isVisible:${options.isVisible}`;
  });
  const viewModel: TestAnimationPopupViewModel = new TestAnimationPopupViewModel(model);
  viewModel.setComponentElement(document.createElement("div"));
  viewModel.logger = logger;
  viewModel.initializePopupContainer();
  viewModel.container.innerHTML = popupTemplate;
  viewModel.onVisibilityChanged.add((_: PopupBaseViewModel, options: { isVisible: boolean }) => {
    logger.log += `->viewModel:isVisible:${options.isVisible}`;
  });
  model.isVisible = true;
  assert.equal(logger.log, "->model:isVisible:true->viewModel:isVisible:true", "correct order of updates when entering without animation");
  logger.log = "";
  model.isVisible = false;
  assert.equal(logger.log, "->model:isVisible:false->viewModel:isVisible:false", "correct order of updates when leaving without animation");
});

QUnit.test("PopupViewModel: check getShouldRunAnimation method", (assert) => {
  settings.animationEnabled = true;
  const model: PopupModel = new PopupModel("sv-list", {}, { verticalPosition: "top", horizontalPosition: "center" });
  const viewModel: TestAnimationPopupViewModel = new TestAnimationPopupViewModel(model);
  assert.ok(viewModel.isAnimationEnabled());
  model.displayMode = "overlay";
  assert.notOk(viewModel.isAnimationEnabled());
  settings.animationEnabled = false;
});

QUnit.test("Check the sequence of method calls", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const done4 = assert.async();
  const done5 = assert.async();
  const done6 = assert.async();

  settings.animationEnabled = true;
  const animationTimeOut = 1;
  const oldQueueMicrotask = window.queueMicrotask;
  window.queueMicrotask = (callback) => { setTimeout(() => callback(), animationTimeOut); };

  let log = "";
  const items: Array<Action> = [new Action({ id: "test", action: () => { } })];
  const listModel = new ListModel(items, () => { model.isVisible = false; }, true);

  const originalRefresh = ListModel.prototype["refresh"];
  ListModel.prototype["refresh"] = function () {
    log += "listModel.refresh->";
    originalRefresh.call(this);
  };

  const popupOptions = {
    onShow: () => { log += "onShow:(viewModel.isVisible == " + viewModel.isVisible.toString() + ")->"; },
    onHide: () => { log += "onHide:(viewModel.isVisible == " + viewModel.isVisible.toString() + ")"; },
    onCancel: () => { log += "onCancel->"; },
    onDispose: () => { log += "onDispose"; }
  };
  const model: PopupModel = new PopupModel("sv-list", { model: listModel }, popupOptions);
  const viewModel: TestAnimationPopupViewModel = new TestAnimationPopupViewModel(model);
  viewModel.logger = { log: "" };
  viewModel.onVisibilityChanged.add((_: PopupBaseViewModel, options: { isVisible: boolean }) => {
    log += "onVisibilityChanged:(viewModel.isVisible == " + options.isVisible + ")->";
  });
  assert.equal(log, "");

  model.isVisible = true;
  setTimeout(() => {
    assert.equal(log, "onShow:(viewModel.isVisible == false)->onVisibilityChanged:(viewModel.isVisible == true)->", "popup show");

    log = "";
    model.isVisible = false;
    setTimeout(() => {
      assert.equal(log, "onVisibilityChanged:(viewModel.isVisible == false)->listModel.refresh->onHide:(viewModel.isVisible == false)", "popup hide");

      model.isVisible = true;
      setTimeout(() => {
        log = "";
        listModel.onItemClick(items[0]);
        setTimeout(() => {
          assert.equal(log, "onVisibilityChanged:(viewModel.isVisible == false)->listModel.refresh->onHide:(viewModel.isVisible == false)", "item click");

          model.isVisible = true;
          setTimeout(() => {
            log = "";
            viewModel.cancel();
            setTimeout(() => {
              assert.equal(log, "onCancel->onVisibilityChanged:(viewModel.isVisible == false)->listModel.refresh->onHide:(viewModel.isVisible == false)", "click cancel");

              log = "";
              model.dispose();
              assert.equal(log, "onDispose");

              settings.animationEnabled = false;
              window.queueMicrotask = oldQueueMicrotask;

              done6();
            }, animationTimeOut + 1);
            done5();
          }, animationTimeOut + 1);
          done4();
        }, animationTimeOut + 1);
        done3();
      }, animationTimeOut + 1);
      done2();
    }, animationTimeOut + 1);
    done1();
  }, animationTimeOut + 1);
});
