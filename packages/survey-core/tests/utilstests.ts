import { IAction } from "../src/actions/action";
import { defaultListCss } from "../src/list";
import { createSvg, doKey2ClickDown, doKey2ClickUp, sanitizeEditableContent, configConfirmDialog, getSafeUrl, compareArrays, setPropertiesOnElementForAnimation, cleanHtmlElementAfterAnimation, isBase64URL } from "../src/utils/utils";
import { mouseInfo, detectMouseSupport, MatchMediaMethod, calculateIsTablet } from "../src/utils/devices";
import { PopupBaseViewModel } from "../src/popup-view-model";
import { PopupModel } from "../src/popup";
import { AnimationBoolean, AnimationGroup, AnimationGroupUtils, AnimationPropertyUtils, AnimationTab, AnimationUtils, IAnimationConsumer, IAnimationGroupConsumer } from "../src/utils/animation";
import { Base, EventBase } from "../src/base";

export default QUnit.module("utils");
function checkSanitizer(element, text, selectionNodeIndex, selectionStart, cleanLineBreaks = true) {
  element.innerHTML = text;
  const selection = document.getSelection();
  let range = document.createRange();
  if (selectionNodeIndex >= 0) {
    range.setStart(element.childNodes[selectionNodeIndex], selectionStart);
  }
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  sanitizeEditableContent(element, cleanLineBreaks);
  range = document.getSelection().getRangeAt(0);
  if (element.childNodes.length > 0) range.setStart(element.childNodes[0], 0);
  return {
    text: element.innerHTML,
    plainText: element.innerText,
    position: selection?.toString().length,
    offset: range.endOffset,
    nodeText: range.endContainer.textContent
  };
}
QUnit.test(
  "utils: sanitizer",
  function (assert) {
    var element: HTMLSpanElement = document.createElement("span");
    document.body.appendChild(element);
    element.contentEditable = "true";
    element.focus();

    var res = checkSanitizer(element, "sometext", 0, 2);
    assert.equal(res.text, "sometext");
    assert.equal(res.offset, 2);

    var res = checkSanitizer(element, "some<br/>text", 0, 2);
    assert.equal(res.text, "sometext");
    assert.equal(res.offset, 2);

    var res = checkSanitizer(element, "sometex<b>t</b>", 1, 1);
    assert.equal(res.text, "sometext");
    assert.equal(res.offset, 8);

    var res = checkSanitizer(element, "some<b>t</b>ext", 2, 1);
    assert.equal(res.text, "sometext");
    assert.equal(res.offset, 6);

    var res = checkSanitizer(element, "", -1, 0);
    assert.equal(res.text, "");
    assert.equal(res.offset, 0);

    element.remove();
  }
);

QUnit.test(
  "utils: sanitizer with linebreaks",
  function (assert) {
    var element: HTMLSpanElement = document.createElement("span");
    document.body.appendChild(element);
    element.contentEditable = "true";

    var res = checkSanitizer(element, "some<br/>text", 0, 2, false);
    assert.equal(res.plainText, "some\ntext");
    assert.equal(res.offset, 2);
    assert.equal(res.nodeText, "some");

    var res = checkSanitizer(element, "some<br/>text<br/><br/>", 3, 0, false);
    assert.equal(res.plainText, "some\ntext\n\n");
    assert.equal(res.position, 10);

    var res = checkSanitizer(element, "some<br/>text<br/>and more", 2, 3, false);
    assert.equal(res.plainText, "some\ntext\nand more");
    assert.equal(res.offset, 3);
    assert.equal(res.nodeText, "text");

    element.remove();
  }
);

QUnit.test(
  "utils: sanitizer with grapheme clusters",
  function (assert) {
    var element: HTMLSpanElement = document.createElement("span");
    document.body.appendChild(element);
    element.contentEditable = "true";

    var res = checkSanitizer(element, "พุธ", 0, 2, false);
    assert.equal(res.plainText.length, 3);
    assert.equal(res.plainText, "พุธ");
    assert.equal(res.offset, 2);
    assert.equal(res.nodeText, "พุธ");

    var res = checkSanitizer(element, "sพุธe", 0, 3, false);
    assert.equal(res.plainText.length, 5);
    assert.equal(res.plainText, "sพุธe");
    assert.equal(res.offset, 3);
    assert.equal(res.nodeText, "sพุธe");

    var res = checkSanitizer(element, "พุธs<br/>พุธe", 2, 2, false);
    assert.equal(res.plainText, "พุธs\nพุธe");
    assert.equal(res.offset, 2);
    assert.equal(res.nodeText, "พุธe");

    element.remove();
  }
);

export function createIActionArray(count: number): Array<IAction> {
  let result: Array<IAction> = [];
  for (let index = 0; index < count; ++index) {
    result.push(<IAction>{ id: "test" + index, title: "test" + index });
  }
  return result;
}

export function createListContainerHtmlElement(): HTMLElement {
  const element = document.createElement("div");
  const innerElement = document.createElement("div");
  innerElement.className = defaultListCss.itemsContainer;
  innerElement.style.width = "200px";
  innerElement.style.height = "100px";

  const listContainerElement = document.createElement("div");
  listContainerElement.style.width = "200px";
  listContainerElement.style.height = "1000px";
  listContainerElement.scrollTop = 0;
  listContainerElement.scrollLeft = 0;

  document.body.appendChild(element);
  element.appendChild(innerElement);
  innerElement.appendChild(listContainerElement);
  return element;
}

QUnit.test(
  "utils: keytoclick - skip UP if there was no DOWN",
  function (assert) {
    var clicked = false;
    var event = {
      keyCode: 13,
      target: { click: () => { clicked = true; } },
      preventDefault: () => { }
    };

    doKey2ClickUp(event as any);
    assert.ok(clicked);
    clicked = false;
    doKey2ClickDown(event as any);
    doKey2ClickUp(event as any);
    assert.ok(clicked);
    clicked = false;

    doKey2ClickUp(event as any, undefined);
    assert.ok(clicked);
    clicked = false;
    doKey2ClickDown(event as any, undefined);
    doKey2ClickUp(event as any, undefined);
    assert.ok(clicked);
    clicked = false;

    var options = {};
    doKey2ClickUp(event as any, options);
    assert.notOk(clicked);
    doKey2ClickDown(event as any, options);
    doKey2ClickUp(event as any, options);
    assert.ok(clicked);
  }
);

QUnit.test(
  "utils: keytoclick - support tab keyup",
  function (assert) {
    var classAdded = "";
    var event = {
      keyCode: 9,
      target: {
        classList: {
          contains: () => false,
          add: (cl) => classAdded = cl
        }
      },
      preventDefault: () => { }
    };

    var options = {};
    doKey2ClickUp(event as any, options);
    assert.equal(classAdded, "sv-focused--by-key");
  }
);

QUnit.test(
  "utils: devices: isTouch",
  function (assert) {
    mouseInfo.hasMouse = true;
    assert.equal(mouseInfo.isTouch, false, "isTouch, #1");
    mouseInfo.hasMouse = false;
    const hasTouchEvent = mouseInfo.hasTouchEvent;
    assert.equal(mouseInfo.isTouch, hasTouchEvent, "isTouch, #2. hasTouch in window: " + hasTouchEvent);
    if (!hasTouchEvent) {
      window["ontouchstart"] = () => { };
    }
    mouseInfo.hasMouse = true;
    assert.equal(mouseInfo.isTouch, false, "isTouch, #3");
    mouseInfo.hasMouse = false;
    assert.equal(mouseInfo.isTouch, true, "isTouch, #4");
    mouseInfo.hasMouse = true;
    if (!hasTouchEvent) {
      window["ontouchstart"] = undefined;
    }
  }
);

QUnit.test(
  "utils: devices: detectMouseSupport",
  function (assert) {
    let result;

    let matchMediaFunction: MatchMediaMethod = null;
    result = detectMouseSupport(matchMediaFunction);
    assert.equal(result, false, "no matchMedia function");

    matchMediaFunction = ()=> { return null; };
    result = detectMouseSupport(matchMediaFunction);
    assert.equal(result, false, "matchMedia might return null at some environments");

    matchMediaFunction = (query:string) => {
      if (query === "(pointer:fine)") return { matches: true };
      return { matches: false };
    };
    result = detectMouseSupport(matchMediaFunction);
    assert.equal(result, true, "matchMedia pointer:fine");

    matchMediaFunction = (query:string) => {
      if (query === "(pointer:fine)") return { matches: false };
      if (query === "(any-hover:hover)") return { matches: true };
      return { matches: false };
    };
    result = detectMouseSupport(matchMediaFunction);
    assert.equal(result, true, "matchMedia any-hover:hover");
  }
);

QUnit.test(
  "utils: configConfirmDialog",
  function (assert) {
    const popupViewModel = new PopupBaseViewModel(new PopupModel("", undefined));
    configConfirmDialog(popupViewModel);
    assert.equal(popupViewModel.width, "min-content");
  }
);

QUnit.test("Test animation utils: getAnimationsCount", (assert) => {
  const animationUtils = new AnimationPropertyUtils();
  const element = document.createElement("div");
  document.body.appendChild(element);
  assert.equal(animationUtils["getAnimationsCount"](element), 0);
  element.style.animationName = "animation1, animation2";
  assert.equal(animationUtils["getAnimationsCount"](element), 2);
  element.style.animationName = "animation1";
  assert.equal(animationUtils["getAnimationsCount"](element), 1);
});

QUnit.test("Test animation utils: getAnimationDuration", (assert) => {
  const animationUtils = new AnimationPropertyUtils();
  const element = document.createElement("div");
  document.body.appendChild(element);
  assert.equal(animationUtils["getAnimationDuration"](element), 0);
  element.style.animationDuration = "5s, 3ms";
  assert.equal(animationUtils["getAnimationDuration"](element), 5000);
  element.style.animationDuration = "3s";
  assert.equal(animationUtils["getAnimationDuration"](element), 3000);

  element.style.animationDuration = "5s, 3ms, 2s";
  element.style.animationDelay = "4ms, 3s";
  assert.equal(animationUtils["getAnimationDuration"](element), 5004);
  element.style.animationDuration = "5s, 3ms, 6s";
  element.style.animationDelay = "3ms, 1s";
  assert.equal(animationUtils["getAnimationDuration"](element), 6003);
  element.remove();
});

QUnit.test("Test animation utils: getAnimationDuration", (assert) => {
  const animationUtils = new AnimationPropertyUtils();
  const element = document.createElement("div");
  document.body.appendChild(element);
  assert.equal(animationUtils["getAnimationDuration"](element), 0);
  element.style.animationDuration = "5s, 3ms";
  assert.equal(animationUtils["getAnimationDuration"](element), 5000);
  element.style.animationDuration = "3s";
  assert.equal(animationUtils["getAnimationDuration"](element), 3000);

  element.style.animationDuration = "5s, 3ms, 2s";
  element.style.animationDelay = "4ms, 3s";
  assert.equal(animationUtils["getAnimationDuration"](element), 5004);
  element.style.animationDuration = "5s, 3ms, 6s";
  element.style.animationDelay = "3ms, 1s";
  assert.equal(animationUtils["getAnimationDuration"](element), 6003);
  element.remove();
});

QUnit.test("Test animation utils: onAnimationEnd", (assert) => {
  const done = assert.async();
  const animationUtils = new AnimationUtils();
  const element = document.createElement("div");
  document.body.appendChild(element);
  let log = "";
  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated";
  }, { } as any);
  assert.equal(log, "->updated");
  assert.ok(animationUtils["cancelQueue"].length == 0);
  element.style.animationName = "animation1, animation2";
  element.style.animationDuration = "1s";
  log = "";
  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated";
  }, { } as any);
  assert.equal(log, "");
  element.dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "");
  element.dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->updated");
  assert.ok(animationUtils["cancelQueue"].length == 0);

  element.style.animationName = "animation1";
  element.style.animationDuration = "1s";
  log = "";
  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated";
  }, { } as any);
  assert.equal(log, "");
  element.dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->updated");
  assert.ok(animationUtils["cancelQueue"].length == 0);

  element.style.animationName = "animation1";
  element.style.animationDuration = "1ms";
  log = "";
  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated";
  }, { } as any);
  assert.equal(log, "");
  animationUtils.cancel();
  assert.ok(animationUtils["cancelQueue"].length == 0);

  element.style.animationName = "animation1";
  element.style.animationDuration = "1ms";
  log = "";
  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated";
  }, { } as any);
  assert.equal(log, "");
  setTimeout(() => {
    assert.equal(log, "->updated");
    assert.ok(animationUtils["cancelQueue"].length == 0);
    element.remove();
    done();
  }, 11);
});

QUnit.test("Test animation utils: check cancel animation works correctly when mutliple animations applied", (assert) => {
  const animationUtils = new AnimationUtils();
  const element = document.createElement("div");
  element.style.animationName = "animation1, animation2";
  element.style.animationDuration = "1s";
  document.body.appendChild(element);
  let log = "";

  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated1";
  }, { } as any);

  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated2";
  }, { } as any);

  animationUtils["onAnimationEnd"](element, () => {
    log += "->updated3";
  }, { } as any);

  assert.equal(log, "");
  animationUtils.cancel();
  assert.equal(log, "->updated1->updated2->updated3");
  assert.ok(animationUtils["cancelQueue"].length == 0);
});

QUnit.test("Test animation utils: enter animation", (assert) => {
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = ((cb) => cb()) as any;
  const animationUtils = new AnimationPropertyUtils();
  const htmlElement = document.createElement("div");
  htmlElement.style.animationName = "animation1";
  htmlElement.style.animationDuration = "1s";
  document.body.appendChild(htmlElement);
  let log = "";
  const animationOptions: IAnimationConsumer = {
    getRerenderEvent: () => new EventBase(),
    getLeaveOptions() {
      return {} as any;
    },
    isAnimationEnabled() {
      return true;
    },
    getAnimatedElement() {
      return htmlElement;
    },
    getEnterOptions() {
      return {
        onAfterRunAnimation: (element) => {
          assert.equal(element, element);
          log+= "->afterRunAnimation";
        },
        onBeforeRunAnimation: (element) => {
          assert.equal(element, element);
          log+= "->beforeRunAnimation";
        },
        cssClass: "enter"
      };
    }
  };
  animationUtils.onEnter(animationOptions);
  assert.equal(log, "->beforeRunAnimation");
  assert.ok(htmlElement.classList.contains("enter"));
  htmlElement.dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->beforeRunAnimation->afterRunAnimation");
  assert.notOk(htmlElement.classList.contains("enter"));
  window.requestAnimationFrame = oldRequestAnimationFrame;
});

QUnit.test("Test animation utils: leave animation", (assert) => {
  const done = assert.async();
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = (cb) => setTimeout(cb);
  const animationUtils = new AnimationPropertyUtils();
  const htmlElement = document.createElement("div");
  htmlElement.style.animationName = "animation1";
  htmlElement.style.animationDuration = "1s";
  document.body.appendChild(htmlElement);
  let log = "";
  const animationOptions: IAnimationConsumer = {
    getRerenderEvent: () => new EventBase(),
    getLeaveOptions() {
      return {
        onAfterRunAnimation: (element) => {
          assert.equal(element, element);
          log+= "->afterRunAnimation";
        },
        onBeforeRunAnimation: (element) => {
          assert.equal(element, element);
          log+= "->beforeRunAnimation";
        },
        cssClass: "leave"
      };
    },
    isAnimationEnabled() {
      return true;
    },
    getAnimatedElement() {
      return htmlElement;
    },
    getEnterOptions() {
      return {} as any;
    }
  };
  animationUtils.onLeave(animationOptions, () => {
    log += "->updated";
  },);
  assert.equal(log, "->beforeRunAnimation");
  assert.ok(htmlElement.classList.contains("leave"));
  htmlElement.dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->beforeRunAnimation->updated");
  assert.ok(htmlElement.classList.contains("leave"));
  setTimeout(() => {
    setTimeout(() => {
      assert.notOk(htmlElement.classList.contains("leave"));
      assert.equal(log, "->beforeRunAnimation->updated->afterRunAnimation");
      window.requestAnimationFrame = oldRequestAnimationFrame;
      htmlElement.remove();
      done();
    });
  });
});

QUnit.test("Test animation utils: group enter animation", (assert) => {
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = ((cb) => cb()) as any;
  const animationUtils = new AnimationGroupUtils<number>();
  const elements = [0, 1, 2];
  const htmlElements = elements.map(() => {
    const element = document.createElement("div");
    element.style.animationName = "animation1";
    element.style.animationDuration = "1s";
    document.body.appendChild(element);
    return element;
  });
  let log = "";
  const animationOptions: IAnimationGroupConsumer<number> = {
    getRerenderEvent: () => new EventBase(),
    getEnterOptions(i) {
      return {
        onAfterRunAnimation: (element) => {
          assert.equal(element, element);
          log+= "->afterRunAnimation_" + i;
        },
        onBeforeRunAnimation: (element) => {
          assert.equal(element, element);
          log+= "->beforeRunAnimation_" + i;
        },
        cssClass: "enter_" + i
      };
    },
    getLeaveOptions() {
      return {} as any;
    },
    isAnimationEnabled() {
      return true;
    },
    getAnimatedElement(i) {
      return htmlElements[i];
    }
  };
  animationUtils.runGroupAnimation(animationOptions, [0, 1, 2], [], []);
  assert.equal(log, "->beforeRunAnimation_0->beforeRunAnimation_1->beforeRunAnimation_2");
  assert.ok(htmlElements[0].classList.contains("enter_0"));
  assert.ok(htmlElements[1].classList.contains("enter_1"));
  assert.ok(htmlElements[2].classList.contains("enter_2"));

  log = "";
  htmlElements[0].dispatchEvent(new AnimationEvent("animationend"));
  htmlElements[1].dispatchEvent(new AnimationEvent("animationend"));
  htmlElements[2].dispatchEvent(new AnimationEvent("animationend"));

  assert.equal(log, "->afterRunAnimation_0->afterRunAnimation_1->afterRunAnimation_2");
  assert.notOk(htmlElements[0].classList.contains("enter_0"));
  assert.notOk(htmlElements[1].classList.contains("enter_1"));
  assert.notOk(htmlElements[2].classList.contains("enter_2"));

  htmlElements.forEach(el => el.remove());
  window.requestAnimationFrame = oldRequestAnimationFrame;
});

QUnit.test("Test animation utils: group leave animation", (assert) => {
  const done = assert.async();
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = (cb) => setTimeout(cb);
  const animationUtils = new AnimationGroupUtils<number>();
  const elements = [0, 1, 2];
  const htmlElements = elements.map(() => {
    const element = document.createElement("div");
    element.style.animationName = "animation1";
    element.style.animationDuration = "1s";
    document.body.appendChild(element);
    return element;
  });
  let log = "";
  const animationOptions: IAnimationGroupConsumer<number> = {
    getRerenderEvent: () => new EventBase(),
    getLeaveOptions(i) {
      {
        return {
          onAfterRunAnimation: (element) => {
            assert.equal(element, element);
            log+= "->afterRunAnimation_" + i;
          },
          onBeforeRunAnimation: (element) => {
            assert.equal(element, element);
            log+= "->beforeRunAnimation_" + i;
          },
          cssClass: "leave_" + i
        };
      }
    },
    isAnimationEnabled() {
      return true;
    },
    getAnimatedElement(i) {
      return htmlElements[i];
    }
  };
  animationUtils.runGroupAnimation(animationOptions, [], [0, 1, 2], [], () => {
    log+="->updated";
  });
  setTimeout(() => {
    assert.equal(log, "->beforeRunAnimation_0->beforeRunAnimation_1->beforeRunAnimation_2");
    assert.ok(htmlElements[0].classList.contains("leave_0"));
    assert.ok(htmlElements[1].classList.contains("leave_1"));
    assert.ok(htmlElements[2].classList.contains("leave_2"));
    log = "";
    htmlElements[0].dispatchEvent(new AnimationEvent("animationend"));
    htmlElements[1].dispatchEvent(new AnimationEvent("animationend"));
    htmlElements[2].dispatchEvent(new AnimationEvent("animationend"));
    assert.equal(log, "->updated");
    assert.ok(htmlElements[0].classList.contains("leave_0"));
    assert.ok(htmlElements[1].classList.contains("leave_1"));
    assert.ok(htmlElements[2].classList.contains("leave_2"));
    log = "";
    setTimeout(() => {
      setTimeout(() => {
        assert.notOk(htmlElements[0].classList.contains("leave_0"));
        assert.notOk(htmlElements[1].classList.contains("leave_1"));
        assert.notOk(htmlElements[2].classList.contains("leave_2"));
        assert.equal(log, "->afterRunAnimation_0->afterRunAnimation_1->afterRunAnimation_2");
        htmlElements.forEach(el => el.remove());
        window.requestAnimationFrame = oldRequestAnimationFrame;
        done();
      });
    });
  });
});

QUnit.test("Test animation property: boolean", (assert) => {
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = ((cb) => cb()) as any;
  let value: boolean = false;
  const element = document.createElement("div");
  element.style.animationName = "animation1";
  element.style.animationDuration = "1s";
  document.body.appendChild(element);
  let log = "";
  const rerenderEvent = new EventBase();
  const animation = new AnimationBoolean({
    getRerenderEvent: () => rerenderEvent as any,
    getEnterOptions: () => {
      return {
        onBeforeRunAnimation: () => {
          log += "->before-enter";
        },
        onAfterRunAnimation: () => {
          log += "->after-enter";
        },
        cssClass: "enter",
      };
    },
    isAnimationEnabled: () => {
      return true;
    },
    getAnimatedElement: () => {
      return element;
    },
    getLeaveOptions: () => {
      return {
        onBeforeRunAnimation: () => {
          log += "->before-leave";
        },
        onAfterRunAnimation: () => {
          log += "->after-leave";
        },
        cssClass: "leave"
      };
    }
  }, (val: boolean) => {
    value = val;
    log += `->updated: ${val}`;
  }, () => value);
  animation["_sync"](true);
  animation["animationOptions"].getRerenderEvent().fire(undefined as any, {});
  element.dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->updated: true->before-enter->after-enter");

  log = "";
  animation["_sync"](false);
  element.dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->before-leave->updated: false->after-leave");

  window.requestAnimationFrame = oldRequestAnimationFrame;
});
QUnit.test("Test animation property: array", (assert) => {
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = ((cb) => cb()) as any;
  let elements = [0, 3];
  const htmlElements = [0, 1, 2, 3].map(() => {
    const element = document.createElement("div");
    element.style.animationName = "animation1";
    element.style.animationDuration = "1s";
    document.body.appendChild(element);
    return element;
  });
  let log = "";
  const rerenderEvent = new EventBase();
  const animation = new AnimationGroup<number>({
    getRerenderEvent: () => rerenderEvent as any,
    getEnterOptions: (i) => {
      return {
        onBeforeRunAnimation: () => {
          log += `->before-enter_${i}`;
        },
        onAfterRunAnimation: () => {
          log += `->after-enter_${i}`;
        },
        cssClass: "enter"
      };
    },
    isAnimationEnabled: () => {
      return true;
    },
    getAnimatedElement: (i) => {
      return htmlElements[i];
    },
    getLeaveOptions: (i) => {
      return {
        onBeforeRunAnimation: () => {
          log += `->before-leave_${i}`;
        },
        onAfterRunAnimation: () => {
          log += `->after-leave_${i}`;
        },
        cssClass: "leave"
      };
    }
  }, (val: Array<number>) => {
    elements = val;
    log += `->updated: ${val}`;
  }, () => elements);
  animation["_sync"]([0, 1, 2, 3]);
  animation["animationOptions"].getRerenderEvent().fire(undefined as any, {});
  htmlElements[1].dispatchEvent(new AnimationEvent("animationend"));
  htmlElements[2].dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->updated: 0,1,2,3->before-enter_1->before-enter_2->after-enter_1->after-enter_2");

  log = "";
  animation["_sync"]([1, 2]);
  htmlElements[0].dispatchEvent(new AnimationEvent("animationend"));
  htmlElements[3].dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->before-leave_0->before-leave_3->updated: 1,2->after-leave_0->after-leave_3");

  window.requestAnimationFrame = oldRequestAnimationFrame;
});

QUnit.test("Test animation tab", (assert) => {
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = ((cb) => cb()) as any;
  let elements = [0];
  const htmlElements = [0, 1].map(() => {
    const element = document.createElement("div");
    element.style.animationName = "animation1";
    element.style.animationDuration = "1s";
    document.body.appendChild(element);
    return element;
  });
  let log = "";
  const rerenderEvent = new EventBase();
  const animation = new AnimationTab<number>({
    getRerenderEvent: () => rerenderEvent as any,
    getEnterOptions: (i) => {
      return {
        onBeforeRunAnimation: () => {
          log += `->before-enter_${i}`;
        },
        onAfterRunAnimation: () => {
          log += `->after-enter_${i}`;
        },
        cssClass: "enter"
      };
    },
    isAnimationEnabled: () => {
      return true;
    },
    getAnimatedElement: (i) => {
      return htmlElements[i];
    },
    getLeaveOptions: (i) => {
      return {
        onBeforeRunAnimation: () => {
          log += `->before-leave_${i}`;
        },
        onAfterRunAnimation: () => {
          log += `->after-leave_${i}`;
        },
        cssClass: "leave"
      };
    }
  }, (val: Array<number>) => {
    elements = val;
    log += `->updated: ${val}`;
  }, () => elements, (newValue: number[], oldValue: number[]) => {
    return ([] as number[]).concat(newValue, oldValue);
  },);
  animation["_sync"]([1]);
  assert.deepEqual(elements, [1, 0]);
  assert.equal(log, "->updated: 1,0");
  log = "";
  animation["animationOptions"].getRerenderEvent().fire(undefined as any, {});
  htmlElements[0].dispatchEvent(new AnimationEvent("animationend"));
  htmlElements[1].dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->before-enter_1->before-leave_0->updated: 1->after-enter_1->after-leave_0");
  assert.deepEqual(elements, [1]);
  log = "";
  animation["_sync"]([0]);
  assert.deepEqual(elements, [0, 1]);
  assert.equal(log, "->updated: 0,1");
  log = "";
  animation["animationOptions"].getRerenderEvent().fire(undefined as any, {});
  htmlElements[0].dispatchEvent(new AnimationEvent("animationend"));
  htmlElements[1].dispatchEvent(new AnimationEvent("animationend"));
  assert.equal(log, "->before-enter_0->before-leave_1->updated: 0->after-enter_0->after-leave_1");
  assert.deepEqual(elements, [0]);

  window.requestAnimationFrame = oldRequestAnimationFrame;
});

QUnit.test("Check onNextRender and cancel", (assert) => {
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  const oldCancelAnimationFrame = window.cancelAnimationFrame;
  let id = 0;
  let log = "";
  let latestCb;
  window.requestAnimationFrame = (cb: any) => {
    let rafId = ++id;
    latestCb = () => { log+= `->running: ${id}`; cb(); };
    log+= `->raf: ${rafId}`;
    return rafId;
  };
  window.cancelAnimationFrame = (id) => { log+= `->canceled: ${id}`; };
  const animation = new AnimationUtils();
  animation["onNextRender"](() => {
    log+="->updated";
  });
  animation.cancel();
  assert.equal(log, "->raf: 1->updated->canceled: 1");
  id = 0;
  log = "";
  animation["onNextRender"](() => {
    log+="->updated";
  });
  latestCb();
  animation.cancel();
  assert.equal(log, "->raf: 1->running: 1->raf: 2->updated->canceled: 2");
  id = 0;
  log = "";
  animation["onNextRender"](() => {
    log+="->updated";
  });
  latestCb();
  latestCb();
  assert.equal(log, "->raf: 1->running: 1->raf: 2->running: 2->updated");
  log = "";
  animation.cancel();
  assert.equal(log, "");

  window.requestAnimationFrame = oldRequestAnimationFrame;
  window.cancelAnimationFrame = oldCancelAnimationFrame;
});

QUnit.test("Test animation property: check latest update persists", (assert) => {
  const done = assert.async();
  let value: boolean = false;
  let animationEnabled = false;
  const animation = new AnimationBoolean({
    getRerenderEvent: () => new EventBase(),
    getEnterOptions: () => {
      return {
        cssClass: "enter",
      };
    },
    isAnimationEnabled: () => {
      return animationEnabled;
    },
    getAnimatedElement: () => {
      return undefined as any;
    },
    getLeaveOptions: () => {
      return {
        cssClass: "leave"
      };
    }
  }, (val: boolean) => {
    value = val;
  }, () => value);
  animationEnabled = true;
  animation.sync(true);
  animationEnabled = false;
  animation.sync(false);
  setTimeout(() => {
    assert.notOk(value);
    animationEnabled = false;
    animation.sync(true);
    assert.ok(value);
    animation.sync(false);
    setTimeout(() => {
      assert.notOk(value);
      done();
    });
  });
});

QUnit.test("test compareArrays function", (assert) => {
  let res: any = compareArrays([0, 1, 2, 3, 4], [5, 3, 6, 1, 7], (i) => i);
  assert.deepEqual(res.deletedItems, [0, 2, 4]);
  assert.deepEqual(res.addedItems, [5, 6, 7]);
  assert.deepEqual(res.reorderedItems, [{ item: 3, movedForward: false }, { item: 1, movedForward: true }]);
  assert.deepEqual(res.mergedItems, [5, 0, 3, 6, 2, 1, 7, 4]);

  res = compareArrays([0, 1, 2, 3, 4], [3, 1], (i) => i);
  assert.deepEqual(res.deletedItems, [0, 2, 4]);
  assert.deepEqual(res.addedItems, []);
  assert.deepEqual(res.reorderedItems, [{ item: 3, movedForward: false }, { item: 1, movedForward: true }]);
  assert.deepEqual(res.mergedItems, [0, 3, 2, 1, 4]);

  res = compareArrays([1, 3], [5, 3, 6, 1, 7], (i) => i);
  assert.deepEqual(res.deletedItems, []);
  assert.deepEqual(res.addedItems, [5, 6, 7]);
  assert.deepEqual(res.reorderedItems, [{ item: 3, movedForward: false }, { item: 1, movedForward: true }]);
  assert.deepEqual(res.mergedItems, [5, 3, 6, 1, 7]);

  res = compareArrays([0, 1, 2, 3, 4], [5, 1, 6, 3, 7], (i) => i);
  assert.deepEqual(res.deletedItems, [0, 2, 4]);
  assert.deepEqual(res.addedItems, [5, 6, 7]);
  assert.deepEqual(res.reorderedItems, []);
  assert.deepEqual(res.mergedItems, [5, 0, 1, 6, 2, 3, 7, 4]);

  res = compareArrays([0, 1, 2, 3, 4], [], (i) => i);
  assert.deepEqual(res.deletedItems, [0, 1, 2, 3, 4]);
  assert.deepEqual(res.addedItems, []);
  assert.deepEqual(res.reorderedItems, []);
  assert.deepEqual(res.mergedItems, [0, 1, 2, 3, 4]);

  res = compareArrays([], [5, 1, 6, 3, 7], (i) => i);
  assert.deepEqual(res.deletedItems, []);
  assert.deepEqual(res.addedItems, [5, 1, 6, 3, 7]);
  assert.deepEqual(res.reorderedItems, []);
  assert.deepEqual(res.mergedItems, [5, 1, 6, 3, 7]);

  res = compareArrays([{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }], [{ value: 5 }, { value: 3 }, { value: 6 }, { value: 1 }, { value: 7 }], (item) => item.value);
  assert.deepEqual(res.deletedItems, [{ value: 0 }, { value: 2 }, { value: 4 }]);
  assert.deepEqual(res.addedItems, [{ value: 5 }, { value: 6 }, { value: 7 }]);
  assert.deepEqual(res.reorderedItems, [{ item: { value: 3 }, movedForward: false }, { item: { value: 1 }, movedForward: true }]);
  assert.deepEqual(res.mergedItems, [{ value: 5 }, { value: 0 }, { value: 3 }, { value: 6 }, { value: 2 }, { value: 1 }, { value: 7 }, { value: 4 }]);

  res = compareArrays([{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }], [{ value: 5 }, { value: 3 }, { value: 6 }, { value: 1 }, { value: 7 }], (item) => item);
  assert.deepEqual(res.deletedItems, [{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]);
  assert.deepEqual(res.addedItems, [{ value: 5 }, { value: 3 }, { value: 6 }, { value: 1 }, { value: 7 }]);
  assert.deepEqual(res.reorderedItems, []);
  assert.deepEqual(res.mergedItems, [{ value: 5 }, { value: 3 }, { value: 6 }, { value: 1 }, { value: 7 }, { value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]);

  assert.throws(() => compareArrays([{ value: 0 }, { value: 0 }], [], (item) => item.value), new Error("keys must be unique"));
  assert.throws(() => compareArrays([], [{ value: 1 }, { value: 1 }], (item) => item.value), new Error("keys must be unique"));
});

QUnit.test("test onNextRender function", (assert) => {
  let rerenderEvent = new EventBase();
  const animation = new AnimationBoolean({
    getRerenderEvent() {
      return rerenderEvent;
    }
  } as any, () => {}, () => undefined as any);

  let log = "";
  animation["onNextRender"](() => {
    log+= "->callback";
  }, () => {
    log+= "->cancelled";
  });
  assert.equal(log, "");
  rerenderEvent.fire(undefined, {});
  assert.equal(log, "->callback");
  assert.ok(rerenderEvent.isEmpty);
  assert.notOk(!!animation["cancelCallback"]);

  log ="";
  animation["onNextRender"](() => {
    log+= "->callback";
  }, () => {
    log+= "->cancelled";
  });
  assert.equal(log, "");
  animation.cancel();
  assert.equal(log, "->cancelled");
  assert.ok(rerenderEvent.isEmpty);
  assert.notOk(!!animation["cancelCallback"]);

  log = "";
  rerenderEvent = undefined as any;
  let latestRafCb: any;
  let rafId = 0;
  const oldRequestAnimationFrame = window.requestAnimationFrame;
  const oldCancelAnimationFrame = window.cancelAnimationFrame;
  window.requestAnimationFrame = ((cb) => {
    rafId++;
    latestRafCb = () => { log+= `->running: ${rafId}`; cb(); };
    log+= `->raf: ${rafId}`;
    return rafId;
  }) as any;
  window.cancelAnimationFrame = (() => {
    log+= `->canceled raf: ${rafId}`;
  }) as any;

  animation["onNextRender"](() => {
    log+= "->callback";
  }, () => {
    log+= "->cancelled";
  });
  assert.equal(log, "->raf: 1");
  log = "";
  latestRafCb();
  assert.equal(log, "->running: 1->callback");
  assert.notOk(!!animation["cancelCallback"]);

  log ="";
  animation["onNextRender"](() => {
    log+= "->callback";
  }, () => {
    log+= "->cancelled";
  });
  assert.equal(log, "->raf: 2");
  log = "";
  animation.cancel();
  assert.equal(log, "->cancelled->canceled raf: 2");
  assert.notOk(!!animation["cancelCallback"]);

  window.requestAnimationFrame = oldRequestAnimationFrame;
  window.cancelAnimationFrame = oldCancelAnimationFrame;
});
QUnit.test("check animation when rerendered event fired with isCanceled option", (assert) => {
  const rerenderEvent = new EventBase<Base, any>();
  const htmlElement = document.createElement("div");
  let log = "";
  let value = false;
  const animation = new AnimationBoolean({
    getRerenderEvent() {
      return rerenderEvent;
    },
    isAnimationEnabled() {
      return true;
    },
    getEnterOptions() {
      log += "->getEnterOptions";
      return {} as any;
    },
    getLeaveOptions() {
      log += "->getEnterOptions";
      return {} as any;
    },
    getAnimatedElement() {
      return htmlElement;
    },
  }, (val) => {
    value = val;
    log += "->updated"; }, () => value);

  assert.equal(rerenderEvent.length, 0);
  assert.equal(log, "");
  animation["_sync"](true);
  assert.equal(rerenderEvent.length, 1);
  rerenderEvent.fire(null as any, { isCancel: true });
  assert.equal(log, "->updated");
  assert.equal(value, true);
});
QUnit.test("getSafeUrl", (assert) => {
  assert.equal(getSafeUrl("https://surveyjs.io"), "https://surveyjs.io", "https://surveyjs.io");
  assert.equal(getSafeUrl("javascript:alert('1')"), "javascript%3Aalert('1')", "javascript:alert('1')");
});

QUnit.test("animation helper functions", (assert) => {
  const el = document.createElement("div");
  setPropertiesOnElementForAnimation(el, { height: "200px", marginTop: "300px" });
  assert.deepEqual(el["__sv_created_properties"], ["--animation-height", "--animation-margin-top"]);
  assert.equal(el.style.getPropertyValue("--animation-height"), "200px");
  assert.equal(el.style.getPropertyValue("--animation-margin-top"), "300px");
  cleanHtmlElementAfterAnimation(el);
  assert.equal(el["__sv_created_properties"], undefined);
  assert.equal(el.style.getPropertyValue("--animation-height"), "");
  assert.equal(el.style.getPropertyValue("--animation-margin-top"), "");
});

QUnit.test("test isBase64", (assert) => {
  assert.ok(isBase64URL("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"));
  assert.ok(isBase64URL("data:image/jpg;base64,AAA"));
  assert.ok(isBase64URL("data:image/jpeg;base64,UEsDBBQAAAAI"));
  assert.ok(isBase64URL("data:image/jpeg;key=value;base64,UEsDBBQAAAAI"));
  assert.ok(isBase64URL("data:image/jpeg;key=value,UEsDBBQAAAAI"));
  assert.ok(isBase64URL("data:;base64;sdfgsdfgsdfasdfa=s,UEsDBBQAAAAI"));
  assert.ok(isBase64URL("data:,UEsDBBQAAAAI"));
  assert.ok(isBase64URL("data:image/jpeg;e,UEsDBBQAAAA"));
  assert.ok(isBase64URL("data:image/png;base64,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"));

  assert.notOk(isBase64URL("data:image/jpeg;base64;UEsDBBQAAAA"));
  assert.notOk(isBase64URL("data:image/jpeg;,UEsDBBQAAAA"));
  assert.notOk(isBase64URL("data:image/jpeg;;,UEsDBBQAAAA"));
  assert.notOk(isBase64URL("data:image/jpeg;;e,UEsDBBQAAAA"));
  assert.notOk(isBase64URL("iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"));
  assert.notOk(isBase64URL("image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"));
  assert.notOk(isBase64URL("https://localhost:7777/image.jpg"));
});

QUnit.test("calculateIsTablet function", (assert) => {
  let result = calculateIsTablet(300, 300);
  assert.notOk(result);
  result = calculateIsTablet(300, 600);
  assert.notOk(result);
  result = calculateIsTablet(600, 300);
  assert.notOk(result);
  result = calculateIsTablet(600, 600);
  assert.ok(result);
  result = calculateIsTablet(700, 600);
  assert.ok(result);
  result = calculateIsTablet(700, 700);
  assert.ok(result);
});