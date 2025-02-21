import { Selector, ClientFunction, t } from "testcafe";
import { getListItemByText, setOptions } from "../../../functionalTests/helper";
import { url, frameworks, initSurvey, takeElementScreenshot, wrapVisualTest, resetFocusToBody } from "../../helper";

const title = "Tagbox Screenshot";

fixture`${title}`.page`${url}`;

frameworks.forEach(async framework => {
  fixture`${framework} ${title}`
    .page`${url}${framework}`
    .beforeEach(async t => {
    });

  test("Check tagbox select question popup", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1280, 1100);
      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "question1",
            hasOther: "true",
            closeOnSelect: "false",
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10",
              "item11",
              "item12",
              "item13",
              "item14",
              "item15",
              "item16",
              "item17",
              "item18",
              "item19",
              "item20",
              "item21",
              "item22",
              "item23",
              "item24",
              "item25",
              "item26",
              "item27"
            ]
          }
        ]
      });

      const questionTagbox = Selector(".sd-input.sd-tagbox");
      const popupContainer = Selector(".sv-popup__container").filterVisible();
      await resetFocusToBody();
      await takeElementScreenshot("tagbox-question.png", questionTagbox, t, comparer);

      await t
        .click(questionTagbox)
        .click(getListItemByText("item10"))
        .click(getListItemByText("item20"));
      await takeElementScreenshot("tagbox-popup-selected-items.png", popupContainer, t, comparer);
      await takeElementScreenshot("tagbox-input-selected-items.png", questionTagbox, t, comparer);

      await t
        .pressKey("esc")
        .hover(Selector(".sv-tagbox__item"));
      await takeElementScreenshot("tagbox-question-item-hover.png", Selector(".sv-tagbox__item"), t, comparer);

      await t.hover(Selector(".sd-tagbox-item_clean-button-svg"));
      await takeElementScreenshot("tagbox-question-item-icon-hover.png", Selector(".sv-tagbox__item"), t, comparer);
    });
  });

  test("Check tagbox select question without clear button", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1280, 1100);
      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "question12",
            hasOther: "true",
            allowClear: false,
            defaultValue: ["item1"],
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7"
            ]
          }
        ]
      });

      const questionTagbox = Selector(".sd-input.sd-tagbox");
      await resetFocusToBody();
      await takeElementScreenshot("tagbox-question-without-clear-button.png", questionTagbox, t, comparer);
    });
  });

  test("Check tagbox disabled items", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1280, 1100);
      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "tagbox",
            hasOther: "true",
            searchEnabled: false,
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10",
              "item11",
              "item12",
              "item13",
              "item14",
              "item15",
              "item16",
              "item17",
              "item18",
              "item19",
              "item20",
              "item21",
              "item22",
              "item23",
              "item24",
              "item25",
              "item26",
              "item27"
            ]
          }
        ]
      });

      await ClientFunction(() => {
        const updateChoiceEnabled = (_, opt) => {
          opt.choices.forEach((ch, index) => { ch.setIsEnabled(index % 2 === 0); });
        };

        const selectQuestion = window["survey"].getQuestionByName("tagbox");
        selectQuestion.onOpened.add(updateChoiceEnabled);
      })();

      const questionTagbox = Selector(".sd-input.sd-tagbox");
      const popupContainer = Selector(".sv-popup__container").filterVisible();
      await t
        .pressKey("esc")
        .click(questionTagbox);
      await takeElementScreenshot("tagbox-disabled-popup-items.png", popupContainer, t, comparer);
    });
  });

  test("Check tagbox multivalue selected items", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(800, 900);
      await initSurvey(framework, {
        focusFirstQuestionAutomatic: true,
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "q1",
            hasOther: "true",
            allowClear: false,
            defaultValue: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10",
            ],
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10",
            ]
          }
        ]
      });

      const questionTagbox = Selector(".sd-input.sd-tagbox");
      await takeElementScreenshot("tagbox-question-multiline-selected-items.png", questionTagbox, t, comparer);

      await setOptions("q1", { "readOnly": true });
      await takeElementScreenshot("tagbox-question-multiline-selected-items-readonly.png", questionTagbox, t, comparer);
    });
  });

  test("Check rtl tagbox question ", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1280, 1100);
      await ClientFunction(() => {
        document.body.setAttribute("dir", "rtl");
      })();

      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "question1",
            defaultValue: ["item10", "item20"],
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10",
              "item11",
              "item12",
              "item13",
              "item14",
              "item15",
              "item16",
              "item17",
              "item18",
              "item19",
              "item20"
            ]
          }
        ]
      });

      const questionTagbox = Selector(".sd-question");
      await resetFocusToBody();

      await t.hover(Selector(".sv-tagbox__item"));
      await takeElementScreenshot("tagbox-rtl-question-answered.png", questionTagbox, t, comparer);

      await t.click(".sd-tagbox_clean-button-svg");
      await resetFocusToBody();
      await takeElementScreenshot("tagbox-rtl-question.png", questionTagbox, t, comparer);

      await ClientFunction(() => {
        document.body.setAttribute("dir", "ltr");
      })();
    });
  });
  test("Check overlay popup in tagbox question", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(500, 700);
      await ClientFunction(() => {
        window["Survey"]._setIsTouch(true);
      })();
      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "tagbox",
            hasOther: "true",
            closeOnSelect: false,
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10",
              "item11",
              "item12",
            ]
          }
        ]
      });
      await t.click(Selector(".sd-dropdown__filter-string-input"))
        .click(Selector(".sd-list__item span").withText("item1"));
      await takeElementScreenshot("tagbox-question-overlay-popup-selected.png", Selector(".sv-popup.sv-multi-select-list"), t, comparer);

      await t.click(Selector("span").withText("Cancel"));

      await t.click(Selector(".sd-dropdown__filter-string-input"))
        .typeText(Selector(".sv-list__input"), "item1");
      await takeElementScreenshot("tagbox-question-overlay-popup.png", Selector(".sv-popup.sv-multi-select-list"), t, comparer);
    });
  });
  test("Check overlay popup (table mode) in tagbox question", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(600, 900);
      await ClientFunction(() => {
        window["Survey"]._setIsTouch(true);
      })();
      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "tagbox",
            hasOther: "true",
            closeOnSelect: false,
            choices: [
              "item1",
              "item2",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10",
              "item11",
              "item12",
              "item20",
              "item21",
              "item22",
              "item23",
              "item24",
              "item25",
              "item26",
              "item27",
              "item28",
              "item29",
              "item30",
              "item31",
            ]
          }
        ]
      });
      await t.click(Selector(".sd-dropdown__filter-string-input"))
        .typeText(Selector(".sv-list__input"), "item1");
      await takeElementScreenshot("tagbox-question-overlay-tablet-popup.png", Selector(".sv-popup.sv-multi-select-list"), t, comparer);

      await t.click(Selector(".sd-root-modern"), { offsetX: 10, offsetY: 10 });
      await t.click(Selector(".sd-dropdown__filter-string-input"))
        .expect(Selector(".sv-list__input").visible).ok()
        .typeText(Selector(".sv-list__input"), "item", { replace: true });

      await takeElementScreenshot("tagbox-question-overlay-tablet-popup-big.png", Selector(".sv-popup.sv-multi-select-list"), t, comparer);

      await t.click(Selector(".sd-root-modern"), { offsetX: 10, offsetY: 10 });
      await t.click(Selector(".sd-dropdown__filter-string-input"))
        .expect(Selector(".sv-list__input").visible).ok()
        .typeText(Selector(".sv-list__input"), "item3", { replace: true });
      await takeElementScreenshot("tagbox-question-overlay-tablet-popup-small.png", Selector(".sv-popup.sv-multi-select-list"), t, comparer);
    });
  });
  test("Check overlay popup (table mode) in tagbox question with long items", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(900, 900);
      await ClientFunction(() => {
        window["Survey"]._setIsTouch(true);
      })();
      await initSurvey(framework,
        {
          showQuestionNumbers: "on",
          "elements": [{
            "type": "tagbox",
            "name": "q1",
            "choices": ["English: American Literature", "English: British and World Literature", "Math: Consumer Math", "Math: Practical Math", "Math: Developmental Algebra", "Math: Continuing Algebra", "Math: Pre-Algebra", "Math: Algebra", "Math: Geometry", "Math: Integrated Mathematics", "Science: Physical Science", "Science: Earth Science", "Science: Biology", "Science: Chemistry", "History: World History", "History: Modern World Studies", "History: U.S. History", "History: Modern U.S. History", "Social Sciences: U.S. Government and Politics", "Social Sciences: U.S. and Global Economics", "World Languages: Spanish", "World Languages: French", "World Languages: German", "World Languages: Latin", "World Languages: Chinese", "World Languages: Japanese"]
          }]
        });
      await t.click(Selector(".sd-dropdown__filter-string-input"));
      await takeElementScreenshot("tagbox-question-long-items-overlay-tablet-popup.png", Selector(".sv-popup.sv-multi-select-list"), t, comparer);
    });
  });
  test("Check tagbox focused state", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(600, 900);
      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "tagbox",
            hasOther: "true",
            choices: [
              "item1",
              "item2",
              "item3"
            ]
          }
        ]
      });
      await t.click(Selector(".sd-question__title"));
      await takeElementScreenshot("tagbox-focused.png", Selector(".sd-question"), t, comparer);
    });
  });
  test("Check tagbox input width", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(600, 900);
      await initSurvey(framework, {
        focusFirstQuestionAutomatic: true,
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "tagbox",
            hasOther: "true",
            choices: [
              "item1",
              "item2",
              "item3"
            ]
          }
        ]
      });
      await ClientFunction(() => {
        (<HTMLElement>document.querySelector(".sd-question input")).style.backgroundColor = "red";
      })();
      await takeElementScreenshot("tagbox-contrast-input.png", Selector(".sd-question"), t, comparer);
    });
  });

  test("Check readOnly tagbox with markdown", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(900, 400);

      await initSurvey(framework, {
        focusFirstQuestionAutomatic: true,
        showQuestionNumbers: "off",
        mode: "display",
        questions: [
          {
            type: "tagbox",
            name: "q1",
            defaultValue: ["Cuba", "Romania"],
            choicesByUrl: {
              url: "http://127.0.0.1:8080/testCafe/countriesMock.json",
              path: "RestResponse;result",
              valueName: "name",
            },
          }
        ]
      }, {
        "onGetQuestionDisplayValue": (sender, options) => {
          var strs = options.displayValue.split(",");
          options.displayValue = strs.join("<br>");
        },
        "onTextMarkdown": (survey, options) => {
          var converter = new window["showdown"].Converter();
          var str = converter.makeHtml(options.text);
          str = str.substring(3);
          str = str.substring(0, str.length - 4);
          options.html = str;
        }
      });

      const question = Selector(".sd-input.sd-tagbox");
      await takeElementScreenshot("tagbox-readonly-with-markdown.png", question, t, comparer);
    });
  });

  test("Resize input & popup", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(600, 900);
      await initSurvey(framework, {
        showQuestionNumbers: "off",
        questions: [
          {
            type: "tagbox",
            name: "tagbox",
            hideSelectedItems: true,
            defaultValue: ["item1", "item2", "item3", "item4", "item5"],
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10"
            ]
          }, {
            type: "checkbox",
            name: "question1",
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6"
            ]
          }, {
            type: "tagbox",
            name: "tagbox2",
            hideSelectedItems: true,
            defaultValue: ["item1", "item2", "item3", "item4", "item5"],
            choices: [
              "item1",
              "item2",
              "item3",
              "item4",
              "item5",
              "item6",
              "item7",
              "item8",
              "item9",
              "item10"
            ]
          }
        ]
      });
      await t.click(Selector(".sd-dropdown__filter-string-input"));
      await takeElementScreenshot("tagbox-question-popup-direction-bottom.png", Selector(".sd-body"), t, comparer);

      await t
        .click(getListItemByText("item7"))
        .click(getListItemByText("item8"));
      await takeElementScreenshot("tagbox-question-popup-direction-bottom-and-resize-input.png", Selector(".sd-body"), t, comparer);

      await t.click(Selector(".sd-dropdown__filter-string-input").nth(1));
      await takeElementScreenshot("tagbox-question-popup-direction-top.png", Selector(".sd-body"), t, comparer);

      await t
        .click(getListItemByText("item7"))
        .click(getListItemByText("item8"));
      await takeElementScreenshot("tagbox-question-popup-direction-top-and-resize-input.png", Selector(".sd-body"), t, comparer);
    });
  });

  test("Check tagbox long label width", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(600, 900);
      await initSurvey(framework, {
        "logoPosition": "right",
        "pages": [
          {
            "name": "page1",
            "elements": [
              {
                "type": "tagbox",
                "name": "question6",
                "defaultValue": ["Item 1"],
                "choices": [
                  {
                    "value": "Item 1",
                    "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
                  },
                  {
                    "value": "Item 2",
                    "text": "text"
                  }
                ]
              }
            ]
          }
        ],
        "widthMode": "static",
        "width": "800px"
      });
      await t.click(Selector(".sd-question"));
      await takeElementScreenshot("tagbox-long-item-max-width.png", Selector(".sd-question"), t, comparer);
      await t.pressKey("s e d");
      await takeElementScreenshot("tagbox-long-item-hint-max-width.png", Selector(".sd-question"), t, comparer);
      await t.pressKey("a b c");
      await takeElementScreenshot("tagbox-long-item-not-found.png", Selector(".sd-question"), t, comparer);
    });
  });
});