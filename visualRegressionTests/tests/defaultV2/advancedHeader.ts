import { Selector, ClientFunction } from "testcafe";
import { url, frameworks, initSurvey, takeElementScreenshot, wrapVisualTest, resetFocusToBody, upArrowImageLink } from "../../helper";

const title = "Advanced header screenshot";

fixture`${title}`.page`${url}`;

frameworks.forEach(framework => {
  fixture`${framework} ${title}`.page`${url}${framework}`;

  test("Check survey advanced header inherit width from survey", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1200, 1000);
      await initSurvey(framework, {
        showQuestionNumbers: "on",
        focusFirstQuestionAutomatic: true,
        title: "Survey Title",
        description: "Survey description",
        logo: upArrowImageLink,
        "widthMode": "static",
        "width": "600",
        headerView: "advanced",
        questions: [
          {
            type: "text",
            title: "Question title",
            name: "q1"
          }
        ]
      });
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: "500px",
            inheritWidthFrom: "survey",
            "logoPositionX": "right",
            "logoPositionY": "top"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-width-by-survey.png", Selector(".sd-root-modern"), t, comparer);
    });
  });
  test("Check survey advanced header with overlap", async (t) => {
    if (framework === "vue") return;
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1200, 1000);
      await initSurvey(framework, {
        showQuestionNumbers: "on",
        focusFirstQuestionAutomatic: true,
        title: "Survey Title",
        description: "Survey description",
        logo: upArrowImageLink,
        "widthMode": "static",
        "width": "600",
        headerView: "advanced",
        questions: [
          {
            type: "text",
            title: "Question title",
            name: "q1"
          }
        ]
      });
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: "500px",
            inheritWidthFrom: "survey",
            "overlapEnabled": true,
          },
          "cssVariables": {
            "--sjs-header-backcolor": "rgba(25, 179, 148, 1)"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-with-overlap.png", Selector(".sd-root-modern"), t, comparer);

      await t.resizeWindow(500, 600);
      await ClientFunction(() => {
        (<any>window).survey.setIsMobile(true);
      })();
      await takeElementScreenshot("survey-advanced-header-mobile-with-overlap.png", Selector(".sd-root-modern"), t, comparer);
    });
  });
  test("Check survey TOC + advanced header with overlap", async (t) => {
    if (framework === "vue") return;
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1200, 1000);
      await initSurvey(framework, {
        showQuestionNumbers: "on",
        focusFirstQuestionAutomatic: true,
        title: "Survey Title",
        description: "Survey description",
        logo: upArrowImageLink,
        "widthMode": "static",
        "width": "600",
        headerView: "advanced",
        showTOC: true,
        questions: [
          {
            type: "text",
            title: "Question title",
            name: "q1"
          }
        ]
      });
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: "500px",
            inheritWidthFrom: "survey",
            "overlapEnabled": true,
          },
          "cssVariables": {
            "--sjs-header-backcolor": "rgba(25, 179, 148, 1)"
          }
        });
      })();
      await takeElementScreenshot("survey-toc-advanced-header-with-overlap.png", Selector(".sd-root-modern"), t, comparer);

      await t.resizeWindow(500, 600);
      await ClientFunction(() => {
        (<any>window).survey.setIsMobile(true);
      })();
      await takeElementScreenshot("survey-toc-advanced-header-mobile-with-overlap.png", Selector(".sd-root-modern"), t, comparer);
    });
  });
  test("Check header background color modes", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(800, 600);
      await initSurvey(framework, {
        showQuestionNumbers: "on",
        focusFirstQuestionAutomatic: true,
        title: "Survey Title",
        description: "Survey description",
        questions: [
          {
            type: "text",
            title: "Question title",
            name: "q1"
          }
        ]
      });
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({ "cssVariables": {}, "header": {}, "headerView": "advanced" });
      })();
      await t.wait(500);
      await resetFocusToBody();
      await takeElementScreenshot("survey-advanced-header-background-none.png", Selector(".sd-root-modern"), t, comparer);

      await ClientFunction(() => {
        (<any>window).survey.applyTheme({ "cssVariables": { "--sjs-header-backcolor": "var(--sjs-primary-backcolor)" }, "header": {}, "headerView": "advanced" });
      })();
      await t.wait(500);
      await resetFocusToBody();
      await takeElementScreenshot("survey-advanced-header-background-accent.png", Selector(".sd-root-modern"), t, comparer);

      await ClientFunction(() => {
        (<any>window).survey.applyTheme({ "cssVariables": { "--sjs-header-backcolor": "transparent" }, "header": {}, "headerView": "advanced" });
      })();
      await t.wait(500);
      await resetFocusToBody();
      await takeElementScreenshot("survey-advanced-header-background-custom-none.png", Selector(".sd-root-modern"), t, comparer);

      await ClientFunction(() => {
        (<any>window).survey.applyTheme({ "cssVariables": { "--sjs-font-headertitle-color": "rgba(255, 0, 0, 1)", "--sjs-font-headerdescription-color": "rgba(255, 0, 0, 1)", "--sjs-header-backcolor": "rgba(0, 255, 0, 1)" }, "header": {}, "headerView": "advanced" });
      })();
      await t.wait(500);
      await resetFocusToBody();
      await takeElementScreenshot("survey-advanced-header-background-custom-set.png", Selector(".sd-root-modern"), t, comparer);
    });
  });

  test("Check header background color modes", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1920, 1080);
      await initSurvey(framework, {
        showQuestionNumbers: "on",
        "description": "Building your own form management\nsystem has never been easier.",
        "logoPosition": "right",
        "pages": [
          {
            "name": "page1",
            "elements": [
              {
                "type": "radiogroup",
                "name": "question1",
                "choices": [
                  "Item 1",
                  "Item 2",
                  "Item 3"
                ]
              }
            ]
          }
        ]
      });

      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "cssVariables": {
            "--sjs-header-backcolor": "transparent"
          },
          "header": {
            "inheritWidthFrom": "survey",
            "height": 256
          },
          "headerView": "advanced"
        });
      })();
      await t.wait(500);
      await resetFocusToBody();
      await takeElementScreenshot("survey-advanced-header-text-alignment.png", Selector(".sd-root-modern"), t, comparer);
    });
  });

  test("Check survey advanced header with height 300px", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      const headerSelector = Selector(".sv-header");

      await t.resizeWindow(1200, 1000);
      await initSurvey(framework, {
        title: "Building your own form management system has never been easier.",
        description: "With SurveyJS, you can finally avoid using third-party black box SaaS platforms and create a secure and self-hosted form management system, retaining all sensitive data on your own servers.",
        logo: upArrowImageLink,
        logoHeight: "200",
        headerView: "advanced",
        "widthMode": "static",
        "width": "1000",
        "pages": [{ "name": "page1", "elements": [{ "type": "text", "name": "question1" }] }],
      });

      /**
       +---+---+---+
       |   |   |   |
       +---+---+---+
       |T,D|   | I |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: 300,
            inheritWidthFrom: "survey",
            "logoPositionX": "right",
            "logoPositionY": "middle",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-fixed-height-1-one-row.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       | I |   |   |
       +---+---+---+
       | T |   |   |
       +---+---+---+
       | D |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: 300,
            inheritWidthFrom: "survey",
            "logoPositionX": "left",
            "logoPositionY": "top",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "bottom"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-fixed-height-2-one-first-column.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   | I |
       +---+---+---+
       |T,D|   |   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: 300,
            inheritWidthFrom: "survey",
            "logoPositionX": "right",
            "logoPositionY": "top",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-fixed-height-3-different-rows-1.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   | I |
       +---+---+---+
       |   |T,D|   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: 300,
            inheritWidthFrom: "survey",
            "logoPositionX": "right",
            "logoPositionY": "top",
            "titlePositionX": "center",
            "titlePositionY": "middle",
            "descriptionPositionX": "center",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-fixed-height-4-different-rows-2.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   |   |
       +---+---+---+
       | I |T,D|   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: 300,
            inheritWidthFrom: "survey",
            "logoPositionX": "left",
            "logoPositionY": "middle",
            "titlePositionX": "center",
            "titlePositionY": "middle",
            "descriptionPositionX": "center",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-fixed-height-5-one-row-close-columns-1.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   |   |
       +---+---+---+
       |T,D| I |   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            height: 300,
            inheritWidthFrom: "survey",
            "logoPositionX": "center",
            "logoPositionY": "middle",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-fixed-height-6-one-row-close-columns-2.png", headerSelector, t, comparer);
    });
  });

  test("Check survey advanced header with auto height", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      const headerSelector = Selector(".sv-header");

      await t.resizeWindow(1200, 800);
      await initSurvey(framework, {
        title: "Building your own form management system has never been easier.",
        description: "With SurveyJS, you can finally avoid using third-party black box SaaS platforms and create a secure and self-hosted form management system, retaining all sensitive data on your own servers.",
        logo: upArrowImageLink,
        logoHeight: "200",
        headerView: "advanced",
        "widthMode": "static",
        "width": "1000",
        "pages": [{ "name": "page1", "elements": [{ "type": "text", "name": "question1" }] }],
      });

      /**
       +---+---+---+
       |   |   |   |
       +---+---+---+
       |T,D|   | I |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            inheritWidthFrom: "survey",
            "logoPositionX": "right",
            "logoPositionY": "middle",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-auto-height-1-one-row.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       | I |   |   |
       +---+---+---+
       | T |   |   |
       +---+---+---+
       | D |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            inheritWidthFrom: "survey",
            "logoPositionX": "left",
            "logoPositionY": "top",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "bottom"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-auto-height-2-one-first-column.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   | I |
       +---+---+---+
       |T,D|   |   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            inheritWidthFrom: "survey",
            "logoPositionX": "right",
            "logoPositionY": "top",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-auto-height-3-different-rows-1.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   | I |
       +---+---+---+
       |   |T,D|   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            inheritWidthFrom: "survey",
            "logoPositionX": "right",
            "logoPositionY": "top",
            "titlePositionX": "center",
            "titlePositionY": "middle",
            "descriptionPositionX": "center",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-auto-height-4-different-rows-2.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   |   |
       +---+---+---+
       | I |T,D|   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            inheritWidthFrom: "survey",
            "logoPositionX": "left",
            "logoPositionY": "middle",
            "titlePositionX": "center",
            "titlePositionY": "middle",
            "descriptionPositionX": "center",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-auto-height-5-one-row-close-columns-1.png", headerSelector, t, comparer);

      /**
       +---+---+---+
       |   |   |   |
       +---+---+---+
       |T,D| I |   |
       +---+---+---+
       |   |   |   |
       +---+---+---+
       */
      await ClientFunction(() => {
        (<any>window).survey.applyTheme({
          "header": {
            inheritWidthFrom: "survey",
            "logoPositionX": "center",
            "logoPositionY": "middle",
            "titlePositionX": "left",
            "titlePositionY": "middle",
            "descriptionPositionX": "left",
            "descriptionPositionY": "middle"
          }
        });
      })();
      await takeElementScreenshot("survey-advanced-header-auto-height-6-one-row-close-columns-2.png", headerSelector, t, comparer);
    });
  });

  test("Check header height is correct", async (t) => {
    await wrapVisualTest(t, async (t, comparer) => {
      await t.resizeWindow(1600, 900);
      await initSurvey(framework, {
        title: "My Survey",
        logo: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEAeAB4AAD//gASTEVBRFRPT0xTIHYyMC4wAP/bAIQABQUFCAUIDAcHDAwJCQkMDQwMDAwNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQEFCAgKBwoMBwcMDQwKDA0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0N/8QBogAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoLAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+hEAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8AAEQgBqwGjAwEiAAIRAQMRAf/aAAwDAQACEQMRAD8A96ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKlhgedgqAnP5UARU9I2kOEBJ9q6W10FQ26Zs+w/rXQRWkUH+rUL+HNAHEx6TcPztx9avR6BKfvED6V1wXFPoA5L/hHj/e/Sj/hHm/vV1mKMUAcXLoUyDK4bFZ76fPGMlDivRaCAeKAPLyuODxSdK7660uG4GcbT6jiucu9GeH5o/mH60AYlFKylDgjBpKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoorb0vSzcESycIOnvQBHp+kvdkO3yoP1rsoLWO3XYgAAqYAKMDgCnCgBgXFPoooAKKKKACiiigAooooAKjKZqSigDIv9LjuASBh+xrkLm0e1ba4xXo1Vbu0S7jKN+B9KAPOCMUVdu7R7V9rDjsaqYoAbRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFPijMrBB1JxQBp6VYfbHy2di9ff2rt1jEYCqMAdBUNnaraRhF9OfrVqgAxRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBRvrRbqMrjnsa4KSMxEq3BFel1zmt2IK+cg5HWgDkaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArotBs97+c3Ren1rna9C0yLybdRjBxzQBfooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACopoxKhQ9xUtFAHmtzCbeRkPY1BXReIIdrhwOo61ztABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBPap5kqp6kV6Qg2qB6CuC0mPfcr7c139ABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAGPrUHmwEj+HmuGr0TUF3QOP8AZP8AKvOzwaACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDV0Y4uVrvK4LRzi5Wu9oAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAqX3+pf/AHT/ACrzo9a9EvyFgfP90/yrzs9aAEooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAtWT+XMrehr0ZTkA15gDtORXomnzedCrZycc0AXKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAyNbk8u3PqTiuFNdP4gmyyxg8DnHvXMmgBKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACul0C62EwnvyK5qp7eYwOHHY0AelUVBbTi4QOO4qegAooooAKKKKACiiigAooooAKKKKACiiigAooooAKbI4jUsegGadXOa5fiNfJQ/MeuPSgDnryc3ErOe54qmaAaDQAlFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABSikooA3NIvjbvsc/Ia7NWBGRXmanFdDpmp7CI5Dx2NAHW0UgIIyOlLQAUUUUAFFFFABRRRQAUUUUAFFFFABRRUFxcLbKXY4xQAy8ultYy7HB7CvO5pDM5dupNXL+9a8fJ+6OgqhQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAop4OKjooA39P1drf5JMsnb2rrIZ0nXchBFeaVatr2W0OYjj27UAej0VzlprqyYWX5T69q3o5lkGVINAEtFFFABRRRQAUUUZoAKKqXF7FbDLn8K5q7113OIflFAG7eanHaA5OWHYVyN5fPdn5unYVSdzKdzHJNMoADRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUsc7xHKMVNRUUAbEWtXEYwTu+tXV8RMv31/KuaoNAHXDxAn9001vECjoprlRS0Ab02vyNwgArOl1O4l43FQewqiabQAu49yTSZoooAM0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUoUtwKAEoq9FptxLjCnHrWtH4eY/fbH0oA5uiuwTQIUPJJq4ui2w/h/WgDhgKXFd+NNt14CL+VI2mW7fwAfTigDz802u7k0W3cYA2n1qk3h5MfKeaAORorcn0KaLlMNWXLaSwffUigCvRS4xSYoAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKVVLHA5NACVJFE0zBUGSa2bHR3kO6UbV/nXT29pFbqFRQMUAc3baEz8yHA9K3bfTYYOQOR61o0o4oAVRjjpS0gpaACiiigAooooAKKKKACmPGrjDAEe9PooAxbnRIpjlflPtXO3OkzW5JxlfUV3lIy7higDzFlK8Gm1295paT8j5WrmrnTpbbqMgdxQBm0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFadhpr3jDsnUn/CgCva2b3TbUHHc11+n6UlmMthnPc9vpVyC1S2G2MYFWgKAFxRjFFFABiiiigAooooAKKKKACiiigAooooAKKKKACiiigAxTWjVhggEU6igDmNS0UcyQD/gNcu6NGcMCD716fWVqGmpdrkfK/rQBwdFWLi2e2Yo4xiq+KACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoorZ0vTTdHe/CCgBNN0trk73GEH612kaCMBVGAKcqBAFXgCnCgBaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigCleWKXa4Yc9jXDXVu1q5Rh9DXo1Z9/YreJtPXsaAPPzSVYuLdrZyjdqr4oAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoop8UZlYIvJNAFuwsmvZAo4Uck130MKwIEQYAqpYWwtIwo69zWhQAYo6UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAZWpact0u4cOOhrh5EMZKnqK9Nrl9bsAo85B9cUActRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAJ0rrNEs9i+aw5PSsCwtvtUyofu5yfoOa9ASMIABwBQACpRTQKdQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFNdQ42nkGnUUAefala/ZZSB908is+u81S1E0LHGWUZFcHjHFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRVi0h8+VUHc0AdLolr5aeaerdK6IdKgjjEShV6CphQA4UtIKWgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEYZGK4PVbT7NKcfdbkV3tYus2vnQlh95eaAOIopTSUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAV0OgW4eQyn+Hp+Nc9XbaFEY4MkYLEn8OKANvFGKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACo5kEilT3FSUUAea3Efluy+hqCtfWYTFOTjAbkVkUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAqjcQPU16NaJ5car6AV55D/rF/wB4fzr0eLoPoKAJqKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDmfEMfyq/ocVyldp4gH7gf7wri6ACiiigAooooAKKKKACiiigD/9k=",
        pages: [
          {
            name: "page1",
            elements: [
              {
                type: "text",
                name: "question1",
              },
            ],
          },
          {
            name: "page2",
            elements: [
              {
                type: "text",
                name: "question2",
              },
            ],
          },
        ],
      });

      await resetFocusToBody();
      await takeElementScreenshot("survey-advanced-header-correct-height.png", Selector(".sd-root-modern"), t, comparer);
    });
  });
});