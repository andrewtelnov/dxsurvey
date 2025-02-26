import { HashTable, Helpers } from "./helpers";
import { JsonObject, JsonError, Serializer, property, propertyArray } from "./jsonobject";
import { Base, EventBase, ComputedUpdater } from "./base";
import {
  ISurvey,
  ISurveyData,
  ISurveyImpl,
  ITextProcessor,
  IQuestion,
  IPanel,
  IElement,
  IPage,
  ISurveyErrorOwner,
  ISurveyElement,
  IProgressInfo,
  IFindElement,
  ISurveyLayoutElement,
  IPlainDataOptions,
  LayoutElementContainer,
  IValueItemCustomPropValues,
  ILoadFromJSONOptions,
  IDropdownMenuOptions,
  ITextProcessorProp,
  ITextProcessorResult
} from "./base-interfaces";
import { SurveyElementCore, SurveyElement } from "./survey-element";
import { surveyCss } from "./defaultCss/defaultCss";
import { ISurveyTriggerOwner, SurveyTrigger, Trigger } from "./trigger";
import { CalculatedValue } from "./calculatedValue";
import { PageModel } from "./page";
import { TextPreProcessor, TextPreProcessorValue } from "./textPreProcessor";
import { ProcessValue } from "./conditionProcessValue";
import { surveyLocalization } from "./surveyStrings";
import { CustomError } from "./error";
import { LocalizableString } from "./localizablestring";
// import { StylesManager } from "./stylesmanager";
import { SurveyTimerModel, ISurveyTimerText } from "./surveyTimerModel";
import { IQuestionPlainData, Question } from "./question";
import { QuestionSelectBase } from "./question_baseselect";
import { ItemValue } from "./itemvalue";
import { PanelModelBase, PanelModel, QuestionRowModel } from "./panel";
import {
  HtmlConditionItem,
  UrlConditionItem,
  ExpressionItem,
} from "./expressionItems";
import { ExpressionRunner, ConditionRunner } from "./conditions";
import { settings } from "./settings";
import { isContainerVisible, isMobile, mergeValues, activateLazyRenderingChecks, navigateToUrl, getRenderedStyleSize, getRenderedSize, wrapUrlForBackgroundImage, chooseFiles, classesToSelector } from "./utils/utils";
import { SurveyError } from "./survey-error";
import { IAction, Action } from "./actions/action";
import { ActionContainer } from "./actions/container";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { QuestionPanelDynamicModel } from "./question_paneldynamic";
import { Notifier } from "./notifier";
import {
  TriggerExecutedEvent, CompletingEvent, CompleteEvent, ShowingPreviewEvent, NavigateToUrlEvent, CurrentPageChangingEvent, CurrentPageChangedEvent,
  ValueChangingEvent, ValueChangedEvent, VariableChangedEvent, QuestionVisibleChangedEvent, PageVisibleChangedEvent, PanelVisibleChangedEvent, QuestionCreatedEvent,
  QuestionAddedEvent, QuestionRemovedEvent, PanelAddedEvent, PanelRemovedEvent, PageAddedEvent, ValidateQuestionEvent, SettingQuestionErrorsEvent, ValidatePanelEvent,
  ErrorCustomTextEvent, ValidatePageEvent, ValidatedErrorsOnCurrentPageEvent, ProcessHtmlEvent, GetQuestionTitleEvent, GetTitleTagNameEvent, GetQuestionNumberEvent, GetPageNumberEvent,
  GetPanelNumberEvent, GetProgressTextEvent, TextMarkdownEvent, TextRenderAsEvent, SendResultEvent, GetResultEvent, UploadFilesEvent, DownloadFileEvent, ClearFilesEvent,
  ChoicesLoadedEvent, ProcessDynamicTextEvent, UpdateQuestionCssClassesEvent, UpdatePanelCssClassesEvent, UpdatePageCssClassesEvent, UpdateChoiceItemCssEvent, AfterRenderSurveyEvent,
  AfterRenderPageEvent, AfterRenderQuestionEvent, AfterRenderQuestionInputEvent, AfterRenderPanelEvent, FocusInQuestionEvent, FocusInPanelEvent,
  ShowingChoiceItemEvent, ChoicesLazyLoadEvent, GetChoiceDisplayValueEvent, MatrixRowAddedEvent, MatrixBeforeRowAddedEvent, MatrixRowRemovingEvent, MatrixRowRemovedEvent,
  MatrixAllowRemoveRowEvent, MatrixDetailPanelVisibleChangedEvent, MatrixCellCreatingEvent, MatrixCellCreatedEvent, MatrixAfterCellRenderEvent, MatrixCellValueChangedEvent,
  MatrixCellValueChangingEvent, MatrixCellValidateEvent, DynamicPanelModifiedEvent, DynamicPanelRemovingEvent, TimerPanelInfoTextEvent,
  DynamicPanelItemValueChangedEvent, DynamicPanelValueChangedEvent, DynamicPanelValueChangingEvent,
  DynamicPanelGetTabTitleEvent, DynamicPanelCurrentIndexChangedEvent, CheckAnswerCorrectEvent, DragDropAllowEvent, ScrollToTopEvent, GetQuestionTitleActionsEvent,
  GetPanelTitleActionsEvent, GetPageTitleActionsEvent, GetPanelFooterActionsEvent, GetMatrixRowActionsEvent, GetExpressionDisplayValueEvent,
  ServerValidateQuestionsEvent, MultipleTextItemAddedEvent, MatrixColumnAddedEvent, GetQuestionDisplayValueEvent, PopupVisibleChangedEvent, ChoicesSearchEvent,
  OpenFileChooserEvent, OpenDropdownMenuEvent, ResizeEvent,
  GetTitleActionsEventMixin, ProgressTextEvent, ScrollingElementToTopEvent, IsAnswerCorrectEvent,
  LoadChoicesFromServerEvent,
  ProcessTextValueEvent
} from "./survey-events-api";
import { QuestionMatrixDropdownModelBase } from "./question_matrixdropdownbase";
import { QuestionMatrixDynamicModel } from "./question_matrixdynamic";
import { QuestionFileModel } from "./question_file";
import { QuestionMultipleTextModel } from "./question_multipletext";
import { ITheme, ImageFit, ImageAttachment } from "./themes";
import { PopupModel } from "./popup";
import { Cover } from "./header";
import { surveyTimerFunctions } from "./surveytimer";
import { QuestionSignaturePadModel } from "./question_signaturepad";
import { SurveyTaskManagerModel } from "./surveyTaskManager";
import { ProgressButtons } from "./progress-buttons";
import { TOCModel } from "./surveyToc";
import { DomDocumentHelper, DomWindowHelper } from "./global_variables_utils";
import { ConsoleWarnings } from "./console-warnings";

/**
 * The `SurveyModel` object contains properties and methods that allow you to control the survey and access its elements.
 *
 * [View Demo](https://surveyjs.io/form-library/examples/nps-question/ (linkStyle))
 */
export class SurveyModel extends SurveyElementCore
  implements
  ISurvey,
  ISurveyData,
  ISurveyImpl,
  ISurveyTriggerOwner,
  ISurveyErrorOwner,
  ISurveyTimerText {
  public static readonly TemplateRendererComponentName: string =
    "sv-template-renderer";
  // public static get cssType(): string {
  //   return surveyCss.currentType;
  // }
  // public static set cssType(value: string) {
  //   StylesManager.applyTheme(value);
  // }

  [index: string]: any;
  // private static stylesManager: StylesManager = null;
  public static platform: string = "unknown";
  public get platformName(): string {
    return SurveyModel.platform;
  }
  public notifier: Notifier;
  public rootElement: HTMLElement;
  /**
   * A suffix added to the name of the property that stores comments.
   *
   * Default value: "-Comment"
   *
   * Many question types allow respondents to leave comments. To enable this functionality, set a question's [`showCommentArea`](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model#showCommentArea) property to `true`. Comment values are saved in a separate property. The property name is composed of the question `name` and `commentSuffix`.
   *
   * Respondents can also leave comments when they select "Other" in choice-based questions, such as Dropdown or Checkboxes. The property name for the comment value is composed according to the same rules. However, you can use the question `name` as a key to store the comment value instead. Disable the [`storeOthersAsComment`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#storeOthersAsComment) property in this case.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/create-checkboxes-question-in-javascript/ (linkStyle))
   */
  public get commentSuffix(): string {
    return settings.commentSuffix;
  }
  public set commentSuffix(val: string) {
    settings.commentSuffix = val;
  }
  public get commentPrefix(): string {
    return this.commentSuffix;
  }
  public set commentPrefix(val: string) {
    this.commentSuffix = val;
  }

  private valuesHash: HashTable<any> = {};
  private variablesHash: HashTable<any> = {};
  private editingObjValue: Base;

  private timerModelValue: SurveyTimerModel;

  private navigationBarValue: ActionContainer;

  //#region Event declarations
  /**
   * An event that is raised after a [trigger](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#triggers) is executed.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [Conditional Survey Logic (Triggers)](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-survey-logic-triggers (linkStyle))
   * @see triggers
   * @see runTriggers
   */
  public onTriggerExecuted: EventBase<SurveyModel, TriggerExecutedEvent> = this.addEvent<SurveyModel, TriggerExecutedEvent>();

  /**
   * An event that is raised before the survey is completed. Use this event to prevent survey completion.
   * @see onComplete
   * @see doComplete
   * @see autoAdvanceAllowComplete
   */
  public onCompleting: EventBase<SurveyModel, CompletingEvent> = this.addEvent<SurveyModel, CompletingEvent>();
  /**
   * An event that is raised after the survey is completed. Use this event to send survey results to the server.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * For an example of how to use the methods described above, refer to the following help topic: [Store Survey Results in Your Own Database](https://surveyjs.io/form-library/documentation/handle-survey-results-store#store-survey-results-in-your-own-database).
   *
   * > Do not disable the [`showCompletePage`](https://surveyjs.io/form-library/documentation/surveymodel#showCompletePage) property if you call one of the `options.showSave...` methods. This is required because the UI that indicates data saving progress is integrated into the complete page. If you hide the complete page, the UI also becomes invisible.
   * @see onPartialSend
   * @see doComplete
   * @see autoAdvanceAllowComplete
   */
  public onComplete: EventBase<SurveyModel, CompleteEvent> = this.addEvent<SurveyModel, CompleteEvent>();
  /**
   * An event that is raised before the survey displays a [preview of given answers](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#preview-page). Use this event to cancel the preview.
   * @see showPreviewBeforeComplete
   * @see previewMode
   * @see showPreview
   * @see cancelPreview
   */
  public onShowingPreview: EventBase<SurveyModel, ShowingPreviewEvent> = this.addEvent<SurveyModel, ShowingPreviewEvent>();
  /**
   * An event that is raised before the survey navigates to a specified URL. Use this event to change the URL or cancel the navigation.
   * @see navigateToUrl
   * @see navigateToUrlOnCondition
   */
  public onNavigateToUrl: EventBase<SurveyModel, NavigateToUrlEvent> = this.addEvent<SurveyModel, NavigateToUrlEvent>();
  /**
   * An event that is raised when the survey [`state`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#state) changes to `"running"`.
   * @see firstPageIsStartPage
   */
  public onStarted: EventBase<SurveyModel, {}> = this.addEvent<SurveyModel, {}>();
  /**
   * An event that is raised to save incomplete survey results. Enable the [`partialSendEnabled`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#partialSendEnabled) property for this event to occur.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * Alternatively, you can handle the [`onCurrentPageChanged`](#onCurrentPageChanged) and [`onValueChanged`](#onValueChanged) events, as shown in the following demo: [Continue an Incomplete Survey](https://surveyjs.io/form-library/examples/survey-editprevious/).
   */
  public onPartialSend: EventBase<SurveyModel, {}> = this.addEvent<SurveyModel, {}>();
  /**
   * An event that is raised before the current page is switched.
   *
   * @see currentPageNo
   * @see nextPage
   * @see prevPage
   **/
  public onCurrentPageChanging: EventBase<SurveyModel, CurrentPageChangingEvent> = this.addEvent<SurveyModel, CurrentPageChangingEvent>();
  /**
   * An event that is raised after the current page is switched.
   *
   * @see currentPageNo
   * @see nextPage
   * @see prevPage
   */
  public onCurrentPageChanged: EventBase<SurveyModel, CurrentPageChangedEvent> = this.addEvent<SurveyModel, CurrentPageChangedEvent>();
  /**
   * An event that is raised before a question value is changed.
   * @see setValue
   */
  public onValueChanging: EventBase<SurveyModel, ValueChangingEvent> = this.addEvent<SurveyModel, ValueChangingEvent>();
  /**
   * An event that is raised after a question value is changed.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * To handle value changes in matrix cells or panels within a [Dynamic Panel](https://surveyjs.io/form-library/documentation/api-reference/dynamic-panel-model), use the [`onMatrixCellValueChanged`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onMatrixCellValueChanged) or [`onDynamicPanelValueChanged`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onDynamicPanelValueChanged) event.
   * @see setValue
   */
  public onValueChanged: EventBase<SurveyModel, ValueChangedEvent> = this.addEvent<SurveyModel, ValueChangedEvent>();
  /**
   * An event that is raised after a [variable](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#variables) or [calculated value](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#calculated-values) is changed.
   *
   * @see setVariable
   * @see calculatedValues
   */
  public onVariableChanged: EventBase<SurveyModel, VariableChangedEvent> = this.addEvent<SurveyModel, VariableChangedEvent>();
  /**
   * An event that is raised after question visibility is changed.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * Refer to the following help topic for information on how to implement conditional visibility: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-visibility).
   */
  public onQuestionVisibleChanged: EventBase<SurveyModel, QuestionVisibleChangedEvent> = this.addEvent<SurveyModel, QuestionVisibleChangedEvent>();
  public onVisibleChanged: EventBase<SurveyModel, any> = this.onQuestionVisibleChanged;
  /**
   * An event that is raised after page visibility is changed.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * Refer to the following help topic for information on how to implement conditional visibility: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-visibility).
   */
  public onPageVisibleChanged: EventBase<SurveyModel, PageVisibleChangedEvent> = this.addEvent<SurveyModel, PageVisibleChangedEvent>();
  /**
   * An event that is raised after panel visibility is changed.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * Refer to the following help topic for information on how to implement conditional visibility: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-visibility).
   */
  public onPanelVisibleChanged: EventBase<SurveyModel, PanelVisibleChangedEvent> = this.addEvent<SurveyModel, PanelVisibleChangedEvent>();
  /**
   * An event that is raised when the survey creates any new object derived from [`Question`](https://surveyjs.io/form-library/documentation/api-reference/question).
   *
   * In a survey, complex elements ([Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/), [Multiple Text](https://surveyjs.io/form-library/examples/questiontype-multipletext/), and [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/)) are composed of questions. Use this event to customize any question regardless of which survey element it belongs to.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * To use this event for questions loaded from JSON, create an empty survey model, add an event handler, and only then populate the model from the JSON object:
   *
   * ```js
   * import { Model } from "survey-core";
   *
   * const surveyJson = {
   *    // ...
   * };
   * // Create an empty model
   * const survey = new Model();
   * // Add an event handler
   * survey.onQuestionCreated.add((sender, options) => {
   *   //...
   * });
   * // Load the survey JSON schema
   * survey.fromJSON(surveyJson);
   * ```
   * @see onQuestionAdded
   */
  public onQuestionCreated: EventBase<SurveyModel, QuestionCreatedEvent> = this.addEvent<SurveyModel, QuestionCreatedEvent>();
  /**
   * An event that is raised when a new question is added to a panel or page.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * To use this event for questions loaded from JSON, create an empty survey model, add an event handler, and only then populate the model from the JSON object:
   *
   * ```js
   * import { Model } from "survey-core";
   *
   * const surveyJson = {
   *    // ...
   * };
   * // Create an empty model
   * const survey = new Model();
   * // Add an event handler
   * survey.onQuestionAdded.add((sender, options) => {
   *   //...
   * });
   * // Load the survey JSON schema
   * survey.fromJSON(surveyJson);
   * ```
   * @see onQuestionCreated
   */
  public onQuestionAdded: EventBase<SurveyModel, QuestionAddedEvent> = this.addEvent<SurveyModel, QuestionAddedEvent>();
  /**
   * An event that is raised after a question is deleted from the survey.
   */
  public onQuestionRemoved: EventBase<SurveyModel, QuestionRemovedEvent> = this.addEvent<SurveyModel, QuestionRemovedEvent>();
  /**
   * An event that is raised when a new panel is added to a page.
   */
  public onPanelAdded: EventBase<SurveyModel, PanelAddedEvent> = this.addEvent<SurveyModel, PanelAddedEvent>();
  /**
   * An event that is raised after a panel is deleted from the survey.
   */
  public onPanelRemoved: EventBase<SurveyModel, PanelRemovedEvent> = this.addEvent<SurveyModel, PanelRemovedEvent>();
  /**
   * An event that is raised when a new page is added to the survey.
   * @see PanelModel
   */
  public onPageAdded: EventBase<SurveyModel, PageAddedEvent> = this.addEvent<SurveyModel, PageAddedEvent>();
  /**
   * An event that is raised when a question value is being validated. Use this event to add/remove/modify errors or specify a custom error message.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/add-custom-input-validation/ (linkStyle))
   * @see onServerValidateQuestions
   * @see onValidatePanel
   * @see onMatrixCellValidate
   * @see onSettingQuestionErrors
   */
  public onValidateQuestion: EventBase<SurveyModel, ValidateQuestionEvent> = this.addEvent<SurveyModel, ValidateQuestionEvent>();
  /**
   * @deprecated Use the [`onValidateQuestion`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onValidateQuestion) property instead.
   */
  public onSettingQuestionErrors: EventBase<SurveyModel, SettingQuestionErrorsEvent> = this.addEvent<SurveyModel, SettingQuestionErrorsEvent>();
  /**
   * Use this event to validate data on your server.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/javascript-server-side-form-validation/ (linkStyle))
   * @see onValidateQuestion
   * @see onValidatePanel
   * @see isValidatingOnServer
   */
  public onServerValidateQuestions: EventBase<SurveyModel, ServerValidateQuestionsEvent> = this.addEvent<SurveyModel, ServerValidateQuestionsEvent>();
  /**
   * An event that is raised when a panel is being validated. Use this event to add/remove/modify errors or specify a custom error message.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/add-custom-input-validation/ (linkStyle))
   * @see onValidateQuestion
   * @see onServerValidateQuestions
   */
  public onValidatePanel: EventBase<SurveyModel, ValidatePanelEvent> = this.addEvent<SurveyModel, ValidatePanelEvent>();
  /**
   * @deprecated Use the [`onValidateQuestion`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onValidateQuestion), [`onValidatePanel`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onValidatePanel), and [`onValidatePage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onValidatePage) events instead.
   */
  public onErrorCustomText: EventBase<SurveyModel, ErrorCustomTextEvent> = this.addEvent<SurveyModel, ErrorCustomTextEvent>();
  /**
   * An event that is raised when a survey page is being validated. Use this event to add/remove/modify errors.
   */
  public onValidatePage: EventBase<SurveyModel, ValidatePageEvent> = this.addEvent<SurveyModel, ValidatePageEvent>();
  /**
   * @deprecated Use the [`onValidatePage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onValidatePage) event instead.
   */
  public onValidatedErrorsOnCurrentPage: EventBase<SurveyModel, ValidatedErrorsOnCurrentPageEvent> = this.onValidatePage;
  /**
   * An event that is raised when the survey processes HTML content. Handle this event to modify HTML content before displaying.
   * @see completedHtml
   * @see loadingHtml
   * @see QuestionHtmlModel.html
   */
  public onProcessHtml: EventBase<SurveyModel, ProcessHtmlEvent> = this.addEvent<SurveyModel, ProcessHtmlEvent>();
  /**
   * Use this event to change a question's display text.
   */
  public onGetQuestionDisplayValue: EventBase<SurveyModel, GetQuestionDisplayValueEvent> = this.addEvent<SurveyModel, GetQuestionDisplayValueEvent>();
  /**
   * An event that is raised before the survey displays a question title. Handle this event to modify question titles.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * If you want to modify question numbers, handle the [`onGetQuestionNumber`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onGetQuestionNumber) event.
   * @see requiredMark
   */
  public onGetQuestionTitle: EventBase<SurveyModel, GetQuestionTitleEvent> = this.addEvent<SurveyModel, GetQuestionTitleEvent>();
  /**
   * An event that is raised when the survey applies HTML tags to a survey, page, panel, and question title. Handle this event to change the HTML tag of individual titles.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * If you want to specify HTML tags for all titles, use the [`titleTags`](https://surveyjs.io/form-library/documentation/api-reference/settings#titleTags) object in [global settings](https://surveyjs.io/form-library/documentation/api-reference/settings).
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-titletagnames/ (linkStyle))
   * @see onGetQuestionTitle
   * @see onGetQuestionNumber
   */
  public onGetTitleTagName: EventBase<SurveyModel, GetTitleTagNameEvent> = this.addEvent<SurveyModel, GetTitleTagNameEvent>();
  /**
   * An event that is raised before the survey calculates a question number. Handle this event to modify question numbers.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * If you want to hide question numbers, disable the [`showQuestionNumbers`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showQuestionNumbers) property.
   * @see onGetQuestionTitle
   * @see questionStartIndex
   */
  public onGetQuestionNumber: EventBase<SurveyModel, GetQuestionNumberEvent> = this.addEvent<SurveyModel, GetQuestionNumberEvent>();
  /**
   * @deprecated Use the [`onGetQuestionNumber`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onGetQuestionNumber) event instead.
   */
  public onGetQuestionNo: EventBase<SurveyModel, GetQuestionNumberEvent> = this.onGetQuestionNumber;
  /**
   * An event that is raised before the survey calculates a panel number. Handle this event to modify panel numbers.
   *
   * This event is raised only for the panels with a [specified title](https://surveyjs.io/form-library/documentation/api-reference/panel-model#title) and [visible number](https://surveyjs.io/form-library/documentation/api-reference/panel-model#showNumber).
   */
  public onGetPanelNumber: EventBase<SurveyModel, GetPanelNumberEvent> = this.addEvent<SurveyModel, GetPanelNumberEvent>();
  /**
   * An event that is raised before the survey calculates a page number. Handle this event to modify page numbers.
   *
   * This event is raised only if the [`showPageNumbers`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showPageNumbers) property is enabled.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   * @see onGetQuestionTitle
   * @see questionStartIndex
   */
  public onGetPageNumber: EventBase<SurveyModel, GetPageNumberEvent> = this.addEvent<SurveyModel, GetPageNumberEvent>();
  /**
   * An event that is raised before the survey displays progress text. Handle this event to change the progress text in code.
   * @see showProgressBar
   * @see progressBarLocation
   * @see progressBarType
   */
  public onGetProgressText: EventBase<SurveyModel, GetProgressTextEvent> = this.addEvent<SurveyModel, GetProgressTextEvent>();
  /**
   * @deprecated Use the [`onGetProgressText`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onGetProgressText) event instead.
   */
  public onProgressText: EventBase<SurveyModel, ProgressTextEvent> = this.onGetProgressText;
  /**
   * An event that is raised to convert Markdown content to HTML.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/edit-survey-questions-markdown/ (linkStyle))
   */
  public onTextMarkdown: EventBase<SurveyModel, TextMarkdownEvent> = this.addEvent<SurveyModel, TextMarkdownEvent>();

  public onTextRenderAs: EventBase<SurveyModel, any> = this.addEvent<SurveyModel, any>();
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public onSendResult: EventBase<SurveyModel, SendResultEvent> = this.addEvent<SurveyModel, SendResultEvent>();
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public onGetResult: EventBase<SurveyModel, GetResultEvent> = this.addEvent<SurveyModel, GetResultEvent>();
  /**
   * An event that is raised when a respondent opens a dialog window to select files.
   * @see chooseFiles
   */
  public onOpenFileChooser: EventBase<SurveyModel, OpenFileChooserEvent> = this.addEvent<SurveyModel, OpenFileChooserEvent>();
  /**
   * An event that is raised when a File Upload or Signature Pad question starts to upload a file. Applies only if [`storeDataAsText`](https://surveyjs.io/form-library/documentation/api-reference/file-model#storeDataAsText) is `false`. Use this event to upload files to your server.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/file-upload/ (linkStyle))
   * @see uploadFiles
   * @see onDownloadFile
   * @see onClearFiles
   */
  public onUploadFiles: EventBase<SurveyModel, UploadFilesEvent> = this.addEvent<SurveyModel, UploadFilesEvent>();
  /**
   * An event that is raised when a File Upload question starts to download a file. Use this event to implement file preview when your server stores only file names.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/store-file-names-in-survey-results/ (linkStyle))
   * @see downloadFile
   * @see onClearFiles
   * @see onUploadFiles
   */
  public onDownloadFile: EventBase<SurveyModel, DownloadFileEvent> = this.addEvent<SurveyModel, DownloadFileEvent>();
  /**
   * An event that is raised when users clear files in a [File Upload](https://surveyjs.io/form-library/documentation/api-reference/file-model) question or clear signature in a [Signature Pad](https://surveyjs.io/form-library/documentation/api-reference/signature-pad-model) question. Use this event to delete files from your server.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/file-delayed-upload/ (linkStyle))
   * @see clearFiles
   * @see onDownloadFile
   * @see onUploadFiles
   */
  public onClearFiles: EventBase<SurveyModel, ClearFilesEvent> = this.addEvent<SurveyModel, ClearFilesEvent>();
  /**
   * An event that is raised after choices are loaded from a server but before they are assigned to a choice-based question, such as [Dropdown](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model) or [Checkboxes](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model). Handle this event if you need to modify the loaded choices.
   */
  public onChoicesLoaded: EventBase<SurveyModel, ChoicesLoadedEvent> = this.addEvent<SurveyModel, ChoicesLoadedEvent>();
  /**
   * @deprecated Use the [`onChoicesLoaded`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onChoicesLoaded) event instead.
   */
  public onLoadChoicesFromServer: EventBase<SurveyModel, LoadChoicesFromServerEvent> = this.onChoicesLoaded;

  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public onLoadedSurveyFromService: EventBase<SurveyModel, {}> = this.addEvent<SurveyModel, {}>();

  /**
   * An event that is raised when the survey processes [dynamic texts](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#dynamic-texts) and any text in curly brackets. Use this event, for instance, to substitute parameters in a RESTful URL with real values when you [load choices by URL](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model#choicesByUrl).
   */
  public onProcessDynamicText: EventBase<SurveyModel, ProcessDynamicTextEvent> = this.addEvent<SurveyModel, ProcessDynamicTextEvent>();
  /**
   * @deprecated Use the [`onProcessDynamicText`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onProcessDynamicText) event instead.
   */
  public onProcessTextValue: EventBase<SurveyModel, ProcessTextValueEvent> = this.onProcessDynamicText;

  /**
   * An event that is raised before rendering a question. Use it to override default question CSS classes.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/customize-survey-with-css/ (linkStyle))
   * @see css
   */
  public onUpdateQuestionCssClasses: EventBase<SurveyModel, UpdateQuestionCssClassesEvent> = this.addEvent<SurveyModel, UpdateQuestionCssClassesEvent>();

  /**
   * An event that is raised before rendering a standalone panel and panels within [Dynamic Panel](https://surveyjs.io/form-library/examples/duplicate-group-of-fields-in-form/). Use it to override default panel CSS classes.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/customize-survey-with-css/ (linkStyle))
   * @see css
   */
  public onUpdatePanelCssClasses: EventBase<SurveyModel, UpdatePanelCssClassesEvent> = this.addEvent<SurveyModel, UpdatePanelCssClassesEvent>();

  /**
   * An event that is raised before rendering a page. Use it to override default page CSS classes.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/customize-survey-with-css/ (linkStyle))
   * @see css
   */
  public onUpdatePageCssClasses: EventBase<SurveyModel, UpdatePageCssClassesEvent> = this.addEvent<SurveyModel, UpdatePageCssClassesEvent>();

  /**
   * An event that is raised before rendering a choice item in Radio Button Group and Checkboxes questions. Use it to override default CSS classes applied to choice items.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/customize-survey-with-css/ (linkStyle))
   * @see css
   */
  public onUpdateChoiceItemCss: EventBase<SurveyModel, UpdateChoiceItemCssEvent> = this.addEvent<SurveyModel, UpdateChoiceItemCssEvent>();

  /**
   * An event that is raised after the survey is rendered to the DOM. Use this event to modify survey markup.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-animation/ (linkStyle))
   */
  public onAfterRenderSurvey: EventBase<SurveyModel, AfterRenderSurveyEvent> = this.addEvent<SurveyModel, AfterRenderSurveyEvent>();

  public onAfterRenderHeader: EventBase<SurveyModel, any> = this.addEvent<SurveyModel, any>();

  /**
   * An event that is raised after a page is rendered to the DOM. Use it to modify page markup.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-afterrender/ (linkStyle))
   */
  public onAfterRenderPage: EventBase<SurveyModel, AfterRenderPageEvent> = this.addEvent<SurveyModel, AfterRenderPageEvent>();

  /**
   * An event that is raised after a question is rendered to the DOM. Use it to modify question markup.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-afterrender/ (linkStyle))
   */
  public onAfterRenderQuestion: EventBase<SurveyModel, AfterRenderQuestionEvent> = this.addEvent<SurveyModel, AfterRenderQuestionEvent>();

  /**
   * An event that is raised after a question with a single input field is rendered to the DOM. Use it to modify question markup.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * > This event is not raised for questions without input fields ([HTML](https://surveyjs.io/form-library/documentation/questionhtmlmodel), [Image](https://surveyjs.io/form-library/documentation/questionimagemodel)) or questions with multiple input fields ([Matrix](https://surveyjs.io/form-library/documentation/questionmatrixmodel), [Multiple Text](https://surveyjs.io/form-library/documentation/questionmultipletextmodel)).
   */
  public onAfterRenderQuestionInput: EventBase<SurveyModel, AfterRenderQuestionInputEvent> = this.addEvent<SurveyModel, AfterRenderQuestionInputEvent>();

  /**
   * An event that is raised after a panel is rendered to the DOM. Use it to modify panel markup.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * > This event is raised for static [Panels](https://surveyjs.io/form-library/examples/set-properties-on-multiple-questions-using-panel/) as well as panels within a [Dynamic Panel](https://surveyjs.io/form-library/examples/duplicate-group-of-fields-in-form/).
   */
  public onAfterRenderPanel: EventBase<SurveyModel, AfterRenderPanelEvent> = this.addEvent<SurveyModel, AfterRenderPanelEvent>();

  /**
   * An event that is raised when an element (input field, checkbox, radio button) within a question gets focus.
   * @see onFocusInPanel
   * @see autoFocusFirstQuestion
   * @see focusQuestion
   */
  public onFocusInQuestion: EventBase<SurveyModel, FocusInQuestionEvent> = this.addEvent<SurveyModel, FocusInQuestionEvent>();
  /**
   * An event that is raised when an element within a panel gets focus.
   * @see onFocusInQuestion
   * @see autoFocusFirstQuestion
   * @see focusQuestion
   */
  public onFocusInPanel: EventBase<SurveyModel, FocusInPanelEvent> = this.addEvent<SurveyModel, FocusInPanelEvent>();

  /**
   * An event that is raised before a [choice item](https://surveyjs.io/form-library/documentation/api-reference/questionselectbase#choices) is displayed. Use this event to change the visibility of individual choice items in [Checkboxes](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model), [Dropdown](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model), [Radio Button Group](https://surveyjs.io/form-library/documentation/api-reference/radio-button-question-model), and other similar question types.
   */
  public onShowingChoiceItem: EventBase<SurveyModel, ShowingChoiceItemEvent> = this.addEvent<SurveyModel, ShowingChoiceItemEvent>();

  /**
   * Use this event to load choice items in [Dropdown](https://surveyjs.io/form-library/documentation/questiondropdownmodel) and [Tag Box](https://surveyjs.io/form-library/documentation/questiontagboxmodel) questions on demand.
   *
   * This event is raised only for those questions that have the [`choicesLazyLoadEnabled`](https://surveyjs.io/form-library/documentation/questiondropdownmodel#choicesLazyLoadEnabled) property set to `true`.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/lazy-loading-dropdown/ (linkStyle))
   */
  public onChoicesLazyLoad: EventBase<SurveyModel, ChoicesLazyLoadEvent> = this.addEvent<SurveyModel, ChoicesLazyLoadEvent>();

  /**
   * An event that is raised each time a search string in a [Dropdown](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model) or [Tag Box](https://surveyjs.io/form-library/documentation/api-reference/dropdown-tag-box-model) question changes. Use this event to implement custom filtering of choice options.
   * @see [QuestionDropdownModel.searchEnabled](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model#searchEnabled)
   * @see [QuestionDropdownModel.searchMode](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model#searchMode)
   */
  public onChoicesSearch: EventBase<SurveyModel, ChoicesSearchEvent> = this.addEvent<SurveyModel, ChoicesSearchEvent>();

  /**
   * Use this event to load a display text for the [default choice item](https://surveyjs.io/form-library/documentation/questiondropdownmodel#defaultValue) in [Dropdown](https://surveyjs.io/form-library/documentation/questiondropdownmodel) and [Tag Box](https://surveyjs.io/form-library/documentation/questiontagboxmodel) questions.
   *
   * If you load choices from a server (use [`choicesByUrl`](https://surveyjs.io/form-library/documentation/questiondropdownmodel#choicesByUrl) or [`onChoicesLazyLoad`](https://surveyjs.io/form-library/documentation/surveymodel#onChoicesLazyLoad)), display texts become available only when data is loaded, which does not happen until a user opens the drop-down menu. However, a display text for a default choice item is required before that. In this case, you can load data individually for the default item within the `onGetChoiceDisplayValue` event handler.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/lazy-loading-dropdown/ (linkStyle))
   */
  public onGetChoiceDisplayValue: EventBase<SurveyModel, GetChoiceDisplayValueEvent> = this.addEvent<SurveyModel, GetChoiceDisplayValueEvent>();

  /**
   * An event that is raised after a new row is added to a [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/).
   */
  public onMatrixRowAdded: EventBase<SurveyModel, MatrixRowAddedEvent> = this.addEvent<SurveyModel, MatrixRowAddedEvent>();

  /**
   * An event that is raised before a new row is added to a [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/).
   */
  public onMatrixRowAdding: EventBase<SurveyModel, MatrixBeforeRowAddedEvent> = this.addEvent<SurveyModel, MatrixBeforeRowAddedEvent>();
  /**
   * @deprecated Use the [`onMatrixRowAdding`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onMatrixRowAdding) event instead.
   */
  public onMatrixBeforeRowAdded: EventBase<SurveyModel, MatrixBeforeRowAddedEvent> = this.onMatrixRowAdding;

  /**
   * An event that is raised before a row is deleted from a [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/). You can cancel row deletion and clear row data instead.
   * @see onMatrixRenderRemoveButton
   */
  public onMatrixRowRemoving: EventBase<SurveyModel, MatrixRowRemovingEvent> = this.addEvent<SurveyModel, MatrixRowRemovingEvent>();

  /**
   * An event that is raised after a row is deleted from a [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/).
   * @see onMatrixRenderRemoveButton
   */
  public onMatrixRowRemoved: EventBase<SurveyModel, MatrixRowRemovedEvent> = this.addEvent<SurveyModel, MatrixRowRemovedEvent>();

  /**
   * An event that is raised before rendering the Remove button in a row of a [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/). Use this event to hide the Remove button for individual matrix rows.
   * @see onMatrixRowRemoving
   * @see onMatrixRowRemoved
   */
  public onMatrixRenderRemoveButton: EventBase<SurveyModel, MatrixAllowRemoveRowEvent> = this.addEvent<SurveyModel, MatrixAllowRemoveRowEvent>();
  /**
   * @deprecated Use the [`onMatrixRenderRemoveButton`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onMatrixRenderRemoveButton) event instead.
   */
  public onMatrixAllowRemoveRow: EventBase<SurveyModel, MatrixAllowRemoveRowEvent> = this.onMatrixRenderRemoveButton;
  /**
   * An event that is raised after the visibility of an [expandable detail section](https://surveyjs.io/form-library/examples/add-expandable-details-section-under-matrix-rows/) is changed. This event can be raised for [Multi-Select](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list) and [Dynamic Matrix](https://surveyjs.io/form-library/documentation/api-reference/dynamic-matrix-table-question-model) questions.
   */
  public onMatrixDetailPanelVisibleChanged: EventBase<SurveyModel, MatrixDetailPanelVisibleChangedEvent> = this.addEvent<SurveyModel, MatrixDetailPanelVisibleChangedEvent>();
  /**
   * An event that is raised before a cell in a [Multi-Select Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdropdown/) or [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/) is created. Use this event to change the type of individual matrix cells.
   * @see onAfterRenderMatrixCell
   */
  public onMatrixCellCreating: EventBase<SurveyModel, MatrixCellCreatingEvent> = this.addEvent<SurveyModel, MatrixCellCreatingEvent>();

  /**
    * An event that is raised after a cell in a [Multi-Select Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdropdown/) or [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/) is created.
    * @see onAfterRenderMatrixCell
    */
  public onMatrixCellCreated: EventBase<SurveyModel, MatrixCellCreatedEvent> = this.addEvent<SurveyModel, MatrixCellCreatedEvent>();

  /**
   * An event that is raised for every matrix cell after it is rendered to the DOM.
   * @see onMatrixCellCreated
   */
  public onAfterRenderMatrixCell: EventBase<SurveyModel, MatrixAfterCellRenderEvent> = this.addEvent<SurveyModel, MatrixAfterCellRenderEvent>();
  /**
   * @deprecated Use the [`onAfterRenderMatrixCell`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onAfterRenderMatrixCell) event instead.
   */
  public onMatrixAfterCellRender: EventBase<SurveyModel, MatrixAfterCellRenderEvent> = this.onAfterRenderMatrixCell;

  /**
   * An event that is raised after a cell value is changed in a [Multi-Select Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdropdown/) or [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/).
   * @see onMatrixRowAdding
   */
  public onMatrixCellValueChanged: EventBase<SurveyModel, MatrixCellValueChangedEvent> = this.addEvent<SurveyModel, MatrixCellValueChangedEvent>();

  /**
   * An event that is raised before a cell value is changed in a [Multi-Select Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdropdown/) or [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/). Use this event to change the cell value.
   * @see onMatrixRowAdding
   */
  public onMatrixCellValueChanging: EventBase<SurveyModel, MatrixCellValueChangingEvent> = this.addEvent<SurveyModel, MatrixCellValueChangingEvent>();

  /**
   * An event that is raised for [Multi-Select Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdropdown/) and [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/) questions when they validate a cell value. Use this event to display a custom error message based on a condition.
   * @see onMatrixRowAdding
   */
  public onMatrixCellValidate: EventBase<SurveyModel, MatrixCellValidateEvent> = this.addEvent<SurveyModel, MatrixCellValidateEvent>();

  /**
   * An event that is raised after a new column is added to a [Multi-Select Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdropdown/) or [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/).
   */
  public onMatrixColumnAdded: EventBase<SurveyModel, MatrixColumnAddedEvent> = this.addEvent<SurveyModel, MatrixColumnAddedEvent>();
  /**
   * An event that is raised on adding a new item in Multiple Text question.
   */
  public onMultipleTextItemAdded: EventBase<SurveyModel, MultipleTextItemAddedEvent> = this.addEvent<SurveyModel, MultipleTextItemAddedEvent>();
  /**
   * An event that is raised after a new panel is added to a [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/) question.
   */
  public onDynamicPanelAdded: EventBase<SurveyModel, DynamicPanelModifiedEvent> = this.addEvent<SurveyModel, DynamicPanelModifiedEvent>();

  /**
   * An event that is raised after a panel is deleted from a [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/) question.
   */
  public onDynamicPanelRemoved: EventBase<SurveyModel, DynamicPanelModifiedEvent> = this.addEvent<SurveyModel, DynamicPanelModifiedEvent>();
  /**
   * An event that is raised before a panel is deleted from a [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/) question. Use this event to cancel the deletion.
   */
  public onDynamicPanelRemoving: EventBase<SurveyModel, DynamicPanelRemovingEvent> = this.addEvent<SurveyModel, DynamicPanelRemovingEvent>();
  /**
  * An event that is raised every second while the timer is running.
  *
  * Use the [`timeSpent`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timeSpent) property to find out how many seconds have elapsed.
  * @see timeLimit
  * @see timeLimitPerPage
  * @see showTimer
  * @see timerLocation
  * @see startTimer
  */
  public onTimerTick: EventBase<SurveyModel, {}> = this.addEvent<SurveyModel, {}>();
  /**
   * @deprecated Use the [`onTimerTick`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onTimerTick) event instead.
   */
  public onTimer: EventBase<SurveyModel, {}> = this.onTimerTick;

  public onTimerPanelInfoText: EventBase<SurveyModel, any> = this.addEvent<SurveyModel, any>();

  /**
   * An event that is raised after a value is changed in a panel within a [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/) question.
   */
  public onDynamicPanelValueChanged: EventBase<SurveyModel, DynamicPanelItemValueChangedEvent> = this.addEvent<SurveyModel, DynamicPanelValueChangedEvent>();
  /**
   * @deprecated Use the [`onDynamicPanelValueChanged`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onDynamicPanelValueChanged) event instead.
   */
  public onDynamicPanelItemValueChanged: EventBase<SurveyModel, DynamicPanelItemValueChangedEvent> = this.onDynamicPanelValueChanged;
  /**
   * An event that is raised before a value is changed in a panel within a [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/) question.
   */
  public onDynamicPanelValueChanging: EventBase<SurveyModel, DynamicPanelValueChangingEvent> = this.addEvent<SurveyModel, DynamicPanelValueChangingEvent>();

  /**
   * An event that is raised before a [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/) renders [tab titles](https://surveyjs.io/form-library/documentation/api-reference/dynamic-panel-model#templateTabTitle). Use this event to change individual tab titles.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/tabbed-interface-for-duplicate-group-option/ (linkStyle))
   */
  public onGetDynamicPanelTabTitle: EventBase<SurveyModel, DynamicPanelGetTabTitleEvent> = this.addEvent<SurveyModel, DynamicPanelGetTabTitleEvent>();

  /**
   * An event that is raised after the current panel is changed in a [Dynamic Panel](https://surveyjs.io/form-library/examples/questiontype-paneldynamic/) question.
   */
  public onDynamicPanelCurrentIndexChanged: EventBase<SurveyModel, DynamicPanelCurrentIndexChangedEvent> = this.addEvent<SurveyModel, DynamicPanelCurrentIndexChangedEvent>();

  /**
   * An event that is raised to define whether a question answer is correct. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey/create-a-quiz).
   */
  public onCheckAnswerCorrect: EventBase<SurveyModel, CheckAnswerCorrectEvent> = this.addEvent<SurveyModel, CheckAnswerCorrectEvent>();
  /**
   * @deprecated Use the [`onCheckAnswerCorrect`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onCheckAnswerCorrect) event instead.
   */
  public onIsAnswerCorrect: EventBase<SurveyModel, IsAnswerCorrectEvent> = this.onCheckAnswerCorrect;

  /**
   * An event that is raised when users drag and drop survey elements while designing the survey in [Survey Creator](https://surveyjs.io/survey-creator/documentation/overview). Use this event to control drag and drop operations.
   * @see isDesignMode
   */
  public onDragDropAllow: EventBase<SurveyModel, DragDropAllowEvent> = this.addEvent<SurveyModel, DragDropAllowEvent>();
  /**
   * An event this is raised before a survey element (usually page) is scrolled to the top. Use this event to cancel the scroll operation.
   */
  public onScrollToTop: EventBase<SurveyModel, ScrollToTopEvent> = this.addEvent<SurveyModel, ScrollToTopEvent>();
  /**
   * @deprecated Use the [`onScrollToTop`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onScrollToTop) event instead.
   */
  public onScrollingElementToTop: EventBase<SurveyModel, ScrollingElementToTopEvent> = this.onScrollToTop;

  public onLocaleChangedEvent: EventBase<SurveyModel, {}> = this.addEvent<SurveyModel, {}>();

  /**
   * An event that allows you to add, delete, or modify actions in a question title.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-titleactions/ (linkStyle))
   * @see [IAction](https://surveyjs.io/form-library/documentation/api-reference/iaction)
  */
  public onGetQuestionTitleActions: EventBase<SurveyModel, GetQuestionTitleActionsEvent> = this.addEvent<SurveyModel, GetQuestionTitleActionsEvent>();

  /**
   * An event that allows you to add, delete, or modify actions in a panel title.
   * @see [IAction](https://surveyjs.io/form-library/documentation/api-reference/iaction)
   */
  public onGetPanelTitleActions: EventBase<SurveyModel, GetPanelTitleActionsEvent> = this.addEvent<SurveyModel, GetPanelTitleActionsEvent>();

  /**
   * An event that allows you to add, delete, or modify actions in a page title.
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/modify-titles-of-survey-elements/ (linkStyle))
   * @see [IAction](https://surveyjs.io/form-library/documentation/api-reference/iaction)
   */
  public onGetPageTitleActions: EventBase<SurveyModel, GetPageTitleActionsEvent> = this.addEvent<SurveyModel, GetPageTitleActionsEvent>();

  /**
   * An event that allows you to add, delete, or modify actions in the footer of a [Panel](https://surveyjs.io/form-library/documentation/panelmodel). This panel may belong to a [Dynamic Panel](https://surveyjs.io/form-library/documentation/api-reference/dynamic-panel-model) or be a standalone survey element.
   * @see [IAction](https://surveyjs.io/form-library/documentation/api-reference/iaction)
   */
  public onGetPanelFooterActions: EventBase<SurveyModel, GetPanelFooterActionsEvent> = this.addEvent<SurveyModel, GetPanelFooterActionsEvent>();
  /**
   * An event that allows you to add, delete, or modify actions in rows of a [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/).
   *
   * For information on event handler parameters, refer to descriptions within the interface.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/employee-information-form/ (linkStyle))
   * @see [IAction](https://surveyjs.io/form-library/documentation/api-reference/iaction)
   */
  public onGetMatrixRowActions: EventBase<SurveyModel, GetMatrixRowActionsEvent> = this.addEvent<SurveyModel, GetMatrixRowActionsEvent>();

  public onElementContentVisibilityChanged: EventBase<SurveyModel, any> = this.addEvent<SurveyModel, any>();

  /**
   * An event that is raised before an [Expression](https://surveyjs.io/form-library/documentation/api-reference/expression-model) question displays a value. Use this event to override the display value.
   */
  public onGetExpressionDisplayValue: EventBase<SurveyModel, GetExpressionDisplayValueEvent> = this.addEvent<SurveyModel, GetExpressionDisplayValueEvent>();

  /**
   * An event that is raised after the visibility of a popup is changed.
   *
   * This event can be raised for [Single-](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model) and [Multi-Select Dropdown](https://surveyjs.io/form-library/documentation/api-reference/dropdown-tag-box-model) questions and [Rating Scale](https://surveyjs.io/form-library/documentation/api-reference/rating-scale-question-model) questions [rendered as drop-down menus](https://surveyjs.io/form-library/documentation/api-reference/rating-scale-question-model#displayMode), and [Multi-Select Matrix](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list) questions that contain columns of the `"dropdown"` or `"tagbox"` [`cellType`](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list#cellType).
   */
  public onPopupVisibleChanged: EventBase<SurveyModel, PopupVisibleChangedEvent> = this.addEvent<SurveyModel, PopupVisibleChangedEvent>();

  /**
   * An event that is raised when users open a drop-down menu.
   *
   * This event can be raised for [Single-](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model) and [Multi-Select Dropdown](https://surveyjs.io/form-library/documentation/api-reference/dropdown-tag-box-model) questions, [Rating Scale](https://surveyjs.io/form-library/documentation/api-reference/rating-scale-question-model) questions [rendered as drop-down menus](https://surveyjs.io/form-library/documentation/api-reference/rating-scale-question-model#displayMode), and [Multi-Select Matrix](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list) questions that contain columns of the `"dropdown"` or `"tagbox"` [`cellType`](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list#cellType). Handle this event to change the drop-down menu type for specific questions or device types.
   */
  public onOpenDropdownMenu: EventBase<SurveyModel, OpenDropdownMenuEvent> = this.addEvent<SurveyModel, OpenDropdownMenuEvent>();

  public onElementWrapperComponentName: EventBase<SurveyModel, any> = this.addEvent<SurveyModel, any>();
  public onElementWrapperComponentData: EventBase<SurveyModel, any> = this.addEvent<SurveyModel, any>();
  //#endregion

  constructor(jsonObj: any = null, renderedElement: any = null) {
    super();
    this.onBeforeRunConstructor();
    // if (DomDocumentHelper.isAvailable()) {
    //   SurveyModel.stylesManager = new StylesManager();
    // }
    const htmlCallBack = (str: string): string => { return "<h3>" + str + "</h3>"; };
    this.createHtmlLocString("completedHtml", "completingSurvey", htmlCallBack);
    this.createHtmlLocString("completedBeforeHtml", "completingSurveyBefore", htmlCallBack, "completed-before");
    this.createHtmlLocString("loadingHtml", "loadingSurvey", htmlCallBack, "loading");
    this.createLocalizableString("emptySurveyText", this, true, "emptySurvey");
    this.createLocalizableString("logo", this, false);
    this.createLocalizableString("startSurveyText", this, false, true);
    this.createLocalizableString("pagePrevText", this, false, true);
    this.createLocalizableString("pageNextText", this, false, true);
    this.createLocalizableString("completeText", this, false, true);
    this.createLocalizableString("previewText", this, false, true);
    this.createLocalizableString("editText", this, false, true);
    this.createLocalizableString("questionTitleTemplate", this, true);

    this.timerModelValue = new SurveyTimerModel(this);
    this.timerModelValue.onTimerTick = (page: PageModel): void => {
      this.doTimer(page);
    };

    this.createNewArray(
      "pages",
      (value: PageModel) => {
        if(value.isReadyForCleanChangedCallback) {
          value.isReadyForCleanChangedCallback();
        }
        this.doOnPageAdded(value);
      },
      (value: PageModel) => {
        if(!value.isReadyForClean) {
          value.isReadyForCleanChangedCallback = () => {
            this.doOnPageRemoved(value);
            value.isReadyForCleanChangedCallback = undefined;
          };
        } else {
          this.doOnPageRemoved(value);
        }
      }
    );
    this.createNewArray("triggers", (value: any) => {
      value.setOwner(this);
    });
    this.createNewArray("calculatedValues", (value: any) => {
      value.setOwner(this);
    });
    this.createNewArray("completedHtmlOnCondition", (value: any) => {
      value.locOwner = this;
    });
    this.createNewArray("navigateToUrlOnCondition", (value: any) => {
      value.locOwner = this;
    });
    this.registerPropertyChangedHandlers(["locale"], () => {
      this.onSurveyLocaleChanged();
    });
    this.registerPropertyChangedHandlers(["firstPageIsStartPage"], () => {
      this.onFirstPageIsStartedChanged();
    });
    this.registerPropertyChangedHandlers(["readOnly"], () => {
      this.onReadOnlyChanged();
    });
    this.registerPropertyChangedHandlers(["progressBarType"], () => {
      this.updateProgressText();
    });
    this.registerPropertyChangedHandlers(
      ["questionStartIndex", "requiredMark", "questionTitlePattern"],
      () => {
        this.resetVisibleIndexes();
      }
    );
    this.registerPropertyChangedHandlers(
      ["isLoading", "isCompleted", "isCompletedBefore", "readOnly", "isStartedState", "currentPage", "isShowingPreview"],
      () => { this.updateState(); });
    this.registerPropertyChangedHandlers(["state", "currentPage", "showPreviewBeforeComplete"],
      () => { this.onStateAndCurrentPageChanged(); });
    this.registerPropertyChangedHandlers(["logo", "logoPosition"], () => { this.resetHasLogo(); });
    this.registerPropertyChangedHandlers(["backgroundImage"], () => { this.resetPropertyValue("renderBackgroundImage"); });
    this.registerPropertyChangedHandlers(["backgroundImage", "backgroundOpacity", "backgroundImageFit", "fitToContainer", "backgroundImageAttachment"], () => {
      this.resetPropertyValue("backgroundImageStyle");
    });
    this.registerPropertyChangedHandlers(
      ["showPrevButton", "showCompleteButton"],
      () => { this.updateButtonsVisibility(); });

    this.onGetQuestionNumber.onCallbacksChanged = () => {
      this.resetVisibleIndexes();
    };
    this.onGetPanelNumber.onCallbacksChanged = () => {
      this.resetVisibleIndexes();
    };
    this.onGetProgressText.onCallbacksChanged = () => {
      this.updateProgressText();
    };
    this.onTextMarkdown.onCallbacksChanged = () => {
      this.locStrsChanged();
    };
    this.onProcessHtml.onCallbacksChanged = () => {
      this.locStrsChanged();
    };
    this.onGetQuestionTitle.onCallbacksChanged = () => {
      this.locStrsChanged();
    };
    this.onUpdatePageCssClasses.onCallbacksChanged = () => {
      this.currentPage && this.currentPage.updateElementCss();
    };
    this.onUpdatePanelCssClasses.onCallbacksChanged = () => {
      this.currentPage && this.currentPage.updateElementCss();
    };
    this.onUpdateQuestionCssClasses.onCallbacksChanged = () => {
      this.currentPage && this.currentPage.updateElementCss();
    };
    this.onShowingChoiceItem.onCallbacksChanged = () => {
      this.rebuildQuestionChoices();
    };
    this.locTitle.onStringChanged.add(() => this.resetPropertyValue("titleIsEmpty"));
    this.onBeforeCreating();
    if (jsonObj) {
      if (typeof jsonObj === "string" || jsonObj instanceof String) {
        jsonObj = JSON.parse(jsonObj as string);
      }
      if (jsonObj && jsonObj.clientId) {
        this.clientId = jsonObj.clientId;
      }
      this.fromJSON(jsonObj);
      if (this.surveyId) {
        this.loadSurveyFromService(this.surveyId, this.clientId);
      }
    }
    this.onCreating();
    if (!!renderedElement) {
      this.render(renderedElement);
    }
    this.updateCss();
    this.setCalculatedWidthModeUpdater();

    this.notifier = new Notifier(this.css.saveData);
    this.notifier.addAction(this.createTryAgainAction(), "error");

    this.onPopupVisibleChanged.add((_, opt) => {
      if (opt.visible) {
        this.onScrollCallback = () => {
          opt.popup.hide();
        };
      } else {
        this.onScrollCallback = undefined;
      }
    });

    this.layoutElements.push({
      id: "timerpanel",
      template: "survey-timerpanel",
      component: "sv-timerpanel",
      data: this.timerModel
    });
    this.layoutElements.push({
      id: "progress-buttons",
      component: "sv-progress-buttons",
      getData: () => this.progressBar,
      processResponsiveness: width => this.progressBar.processResponsiveness && this.progressBar.processResponsiveness(width)
    });
    this.layoutElements.push({
      id: "progress-questions",
      component: "sv-progress-questions",
      data: this
    });
    this.layoutElements.push({
      id: "progress-pages",
      component: "sv-progress-pages",
      data: this
    });
    this.layoutElements.push({
      id: "progress-correctquestions",
      component: "sv-progress-correctquestions",
      data: this
    });
    this.layoutElements.push({
      id: "progress-requiredquestions",
      component: "sv-progress-requiredquestions",
      data: this
    });
    this.addLayoutElement({
      id: "toc-navigation",
      component: "sv-navigation-toc",
      getData: () => this.tocModel,
      processResponsiveness: width => this.tocModel.updateStickyTOCSize(this.rootElement)
    });
    this.layoutElements.push({
      id: "buttons-navigation",
      component: "sv-action-bar",
      getData: () => this.navigationBar
    });

  }
  private tocModelValue: TOCModel;
  private get tocModel(): TOCModel {
    if (!this.tocModelValue) {
      this.tocModelValue = new TOCModel(this);
    }
    return this.tocModelValue;
  }
  public get sjsVersion(): string {
    return this.getPropertyValue("sjsVersion");
  }
  public set sjsVersion(val: string) {
    this.setPropertyValue("sjsVersion", val);
  }
  processClosedPopup(question: IQuestion, popupModel: PopupModel<any>): void {
    throw new Error("Method not implemented.");
  }
  protected createTryAgainAction(): IAction {
    return <IAction>{
      id: "save-again",
      title: this.getLocalizationString("saveAgainButton"),
      action: () => {
        if (this.isCompleted) {
          this.saveDataOnComplete();
        } else {
          this.doComplete();
        }
      }
    };
  }
  private createHtmlLocString(name: string, locName: string, func: (str: string) => string, reason?: string): void {
    const res = this.createLocalizableString(name, this, false, locName);
    res.onGetLocalizationTextCallback = func;
    if (reason) {
      res.onGetTextCallback = (str: string): string => { return this.processHtml(str, reason); };
    }
  }
  /**
   * A list of errors in a survey JSON schema.
   * @see ensureUniqueNames
   */
  public jsonErrors: Array<JsonError> = null;

  public getType(): string {
    return "survey";
  }
  protected onPropertyValueChanged(name: string, oldValue: any, newValue: any): void {
    if (name === "questionsOnPageMode") {
      this.onQuestionsOnPageModeChanged(oldValue);
    }
  }

  /**
   * Returns an array of all pages in the survey.
   *
   * To get an array of only visible pages, use the [`visiblePages`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#visiblePages) array.
   * @see PageModel
   */
  public get pages(): Array<PageModel> {
    return this.getPropertyValue("pages");
  }
  renderCallback: () => void;
  public render(element: any = null): void {
    if (this.renderCallback) {
      this.renderCallback();
    }
  }
  public updateSurvey(newProps: any, oldProps?: any) {
    for (var key in newProps) {
      if (key == "model" || key == "children") continue;
      if (key.indexOf("on") == 0 && this[key] && this[key].add) {
        let funcBody = newProps[key];
        let func = function (sender: any, options: any) {
          funcBody(sender, options);
        };
        this[key].add(func);
      } else {
        this[key] = newProps[key];
      }
    }

    if (newProps && newProps.data)
      this.onValueChanged.add((sender, options) => {
        newProps.data[options.name] = options.value;
      });
  }
  public getCss(): any {
    return this.css;
  }
  private cssValue: any = null;
  private updateCompletedPageCss() {
    this.containerCss = this.css.container;
    this.completedCss = new CssClassBuilder().append(this.css.body)
      .append(this.css.completedPage).toString(); // for completed page
    this.completedBeforeCss = new CssClassBuilder()
      .append(this.css.body)
      .append(this.css.completedBeforePage)
      .toString();
    this.loadingBodyCss = new CssClassBuilder()
      .append(this.css.body)
      .append(this.css.bodyLoading)
      .toString();
  }
  private updateCss() {
    this.rootCss = this.getRootCss();
    this.updateNavigationCss();
    this.updateCompletedPageCss();
    this.updateWrapperFormCss();
  }
  /**
   * Gets or sets an object in which keys are UI elements and values are CSS classes applied to them.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/customize-survey-with-css/ (linkStyle))
   */
  public get css(): any {
    if (!this.cssValue) {
      this.cssValue = {};
      this.copyCssClasses(this.cssValue, surveyCss.getCss());
    }
    return this.cssValue;
  }
  public set css(value: any) {
    this.setCss(value);
  }

  public setCss(value: any, needMerge = true) {
    if (needMerge) {
      this.mergeValues(value, this.css);
    } else {
      this.cssValue = value;
    }
    this.updateElementCss(false);
  }

  public get cssTitle(): string {
    return this.css.title;
  }
  public get cssNavigationComplete() {
    return this.getNavigationCss(
      this.cssSurveyNavigationButton,
      this.css.navigation.complete
    );
  }
  public get cssNavigationPreview() {
    return this.getNavigationCss(
      this.cssSurveyNavigationButton,
      this.css.navigation.preview
    );
  }
  public get cssNavigationEdit() {
    return this.getNavigationCss(
      this.css.navigationButton,
      this.css.navigation.edit
    );
  }
  public get cssNavigationPrev() {
    return this.getNavigationCss(
      this.cssSurveyNavigationButton,
      this.css.navigation.prev
    );
  }
  public get cssNavigationStart() {
    return this.getNavigationCss(
      this.cssSurveyNavigationButton,
      this.css.navigation.start
    );
  }
  public get cssNavigationNext() {
    return this.getNavigationCss(
      this.cssSurveyNavigationButton,
      this.css.navigation.next
    );
  }
  private get cssSurveyNavigationButton(): string {
    return new CssClassBuilder().append(this.css.navigationButton).append(this.css.bodyNavigationButton).toString();
  }
  public get bodyCss(): string {
    return new CssClassBuilder().append(this.css.body)
      .append(this.css.bodyWithTimer, this.showTimer && this.state === "running")
      .append(this.css.body + "--" + this.calculatedWidthMode).toString();
  }
  public get bodyContainerCss(): string {
    return this.css.bodyContainer;
  }
  @property() completedCss: string;
  @property() completedBeforeCss: string;
  @property() loadingBodyCss: string;
  @property() containerCss: string;
  @property({ onSet: (newValue, target: SurveyModel) => { target.updateCss(); } }) fitToContainer: boolean;
  /**
   * @deprecated Use the [`headerView`](https://surveyjs.io/form-library/documentation/api-reference/itheme#headerView) property within a theme instead.
   */
  @property({
    onSet: (newValue, target: SurveyModel) => {
      if (newValue === "advanced") {
        const layoutElement = target.findLayoutElement("advanced-header");
        if (!layoutElement) {
          var advHeader = new Cover();
          advHeader.logoPositionX = target.logoPosition === "right" ? "right" : "left";
          advHeader.logoPositionY = "middle";
          advHeader.titlePositionX = target.logoPosition === "right" ? "left" : "right";
          advHeader.titlePositionY = "middle";
          advHeader.descriptionPositionX = target.logoPosition === "right" ? "left" : "right";
          advHeader.descriptionPositionY = "middle";
          target.insertAdvancedHeader(advHeader);
        }
      } else {
        target.removeLayoutElement("advanced-header");
      }
    }
  }) headerView: "advanced" | "basic";

  protected insertAdvancedHeader(advHeader: Cover): void {
    advHeader.survey = this;
    this.layoutElements.push({
      id: "advanced-header",
      container: "header",
      component: "sv-header",
      index: -100,
      data: advHeader,
      processResponsiveness: width => advHeader.processResponsiveness()
    });
  }

  /**
   * Specifies whether the [Complete page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#complete-page) should display the [survey header](https://surveyjs.io/form-library/examples/brand-your-survey-header/).
   *
   * Possible values:
   *
   * - `true` - Displays the survey header on the Complete page.
   * - `false` - Hides the header when users reach the Complete page.
   * - `"auto"` (default) - Displays a header with the basic view, but hides a header with the advanced view (see the [`headerView`](https://surveyjs.io/form-library/documentation/api-reference/itheme#headerView) property description).
   *
   * > This property cannot be specified in the survey JSON schema. Use dot notation to specify it.
   */
  public showHeaderOnCompletePage: true | false | "auto" = "auto";

  private getNavigationCss(main: string, btn: string) {
    return new CssClassBuilder().append(main)
      .append(btn).toString();
  }
  private lazyRenderEnabledValue: boolean;
  @property() showBrandInfo: boolean;
  @property() enterKeyAction: "moveToNextEditor" | "loseFocus" | "default";
  /**
   * Specifies whether to enable lazy rendering.
   *
   * In default mode, a survey renders the entire current page. With lazy rendering, the survey renders the page gradually as a user scrolls it. This helps reduce survey startup time and optimizes large surveys for low-end devices.
   *
   * Default value: `false`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-lazy/ (linkStyle))
   * @see [settings.lazyRender](https://surveyjs.io/form-library/documentation/api-reference/settings#lazyRender)
   */
  public get lazyRenderEnabled(): boolean {
    return this.lazyRenderEnabledValue === true;
  }
  public set lazyRenderEnabled(val: boolean) {
    if (this.lazyRenderEnabled === val) return;
    this.lazyRenderEnabledValue = val;
    const page: PageModel = this.currentPage;
    if (!!page) {
      page.updateRows();
    }
  }
  /**
   * @deprecated Use the [`lazyRenderEnabled`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#lazyRenderEnabled) property instead.
   */
  public get lazyRendering(): boolean {
    return this.lazyRenderEnabled;
  }
  public set lazyRendering(val: boolean) {
    this.lazyRenderEnabled = val;
  }
  public get isLazyRendering(): boolean {
    return this.lazyRenderEnabled || settings.lazyRender.enabled;
  }
  @property() lazyRenderFirstBatchSizeValue: number;
  public get lazyRenderFirstBatchSize(): number {
    return this.lazyRenderFirstBatchSizeValue || settings.lazyRender.firstBatchSize;
  }
  public set lazyRenderFirstBatchSize(val: number) {
    this.lazyRenderFirstBatchSizeValue = val;
  }

  protected _isLazyRenderingSuspended = false;
  public get isLazyRenderingSuspended(): boolean {
    return this._isLazyRenderingSuspended;
  }
  protected suspendLazyRendering(): void {
    if (!this.isLazyRendering) return;
    this._isLazyRenderingSuspended = true;
  }
  protected releaseLazyRendering(): void {
    if (!this.isLazyRendering) return;
    this._isLazyRenderingSuspended = false;
  }
  private updateLazyRenderingRowsOnRemovingElements() {
    if (!this.isLazyRendering) return;
    var page = this.currentPage;
    if (!!page) {
      activateLazyRenderingChecks(page.id);
    }
  }
  /**
   * A list of triggers in the survey.
   *
   * [Conditional Survey Logic (Triggers)](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-survey-logic-triggers (linkStyle))
   * @see runTriggers
   * @see onTriggerExecuted
   */
  public get triggers(): Array<SurveyTrigger> {
    return this.getPropertyValue("triggers");
  }
  public set triggers(val: Array<SurveyTrigger>) {
    this.setPropertyValue("triggers", val);
  }
  /**
   * An array of [calculated values](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#calculated-values).
   */
  public get calculatedValues(): Array<CalculatedValue> {
    return this.getPropertyValue("calculatedValues");
  }
  public set calculatedValues(val: Array<CalculatedValue>) {
    this.setPropertyValue("calculatedValues", val);
  }
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public get surveyId(): string {
    return this.getPropertyValue("surveyId", "");
  }
  public set surveyId(val: string) {
    this.setPropertyValue("surveyId", val);
  }
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public get surveyPostId(): string {
    return this.getPropertyValue("surveyPostId", "");
  }
  public set surveyPostId(val: string) {
    this.setPropertyValue("surveyPostId", val);
  }
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public get clientId(): string {
    return this.getPropertyValue("clientId", "");
  }
  public set clientId(val: string) {
    this.setPropertyValue("clientId", val);
  }
  /**
   * A cookie name used to save information about survey completion.
   *
   * When this property has a value, the survey creates a cookie with the specified name on completion. This cookie helps ensure that users do not pass the same survey twice. On the second run, they will see the [Completed Before page](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#completedBeforeHtml).
   * @see clientId
   */
  public get cookieName(): string {
    return this.getPropertyValue("cookieName", "");
  }
  public set cookieName(val: string) {
    this.setPropertyValue("cookieName", val);
  }
  /**
   * Specifies whether to save survey results when respondents switch between pages. Handle the [`onPartialSend`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onPartialSend) event to implement the save operation.
   *
   * Alternatively, you can handle the [`onCurrentPageChanged`](#onCurrentPageChanged) and [`onValueChanged`](#onValueChanged) events, as shown in the following demo: [Continue an Incomplete Survey](https://surveyjs.io/form-library/examples/survey-editprevious/).
   */
  public get partialSendEnabled(): boolean {
    return this.getPropertyValue("partialSendEnabled");
  }
  public set partialSendEnabled(val: boolean) {
    this.setPropertyValue("partialSendEnabled", val);
  }
  /**
   * @deprecated Use the [`partialSend`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#partialSend) property instead.
   */
  public get sendResultOnPageNext(): boolean {
    return this.partialSendEnabled;
  }
  public set sendResultOnPageNext(val: boolean) {
    this.partialSendEnabled = val;
  }
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public get surveyShowDataSaving(): boolean {
    return this.getPropertyValue("surveyShowDataSaving");
  }
  public set surveyShowDataSaving(val: boolean) {
    this.setPropertyValue("surveyShowDataSaving", val);
  }
  /**
   * Specifies whether to focus the first question on the page on survey startup or when users switch between pages.
   *
   * Default value: `false` in v1.9.114 and later, `true` in earlier versions
   * @see autoFocusFirstError
   * @see focusFirstQuestion
   * @see focusQuestion
   */
  public get autoFocusFirstQuestion(): boolean {
    return this.getPropertyValue("autoFocusFirstQuestion");
  }
  public set autoFocusFirstQuestion(val: boolean) {
    this.setPropertyValue("autoFocusFirstQuestion", val);
  }
  /**
   * @deprecated Use the [`autoFocusFirstQuestion`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#autoFocusFirstQuestion) property instead.
   */
  public get focusFirstQuestionAutomatic(): boolean {
    return this.autoFocusFirstQuestion;
  }
  public set focusFirstQuestionAutomatic(val: boolean) {
    this.autoFocusFirstQuestion = val;
  }
  /**
   * Specifies whether to focus the first question with a validation error on the current page.
   *
   * Default value: `true`
   * @see validate
   * @see autoFocusFirstQuestion
   */
  public get autoFocusFirstError(): boolean {
    return this.getPropertyValue("autoFocusFirstError");
  }
  public set autoFocusFirstError(val: boolean) {
    this.setPropertyValue("autoFocusFirstError", val);
  }
  /**
   * @deprecated Use the [`autoFocusFirstError`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#autoFocusFirstError) property instead.
   */
  public get focusOnFirstError(): boolean {
    return this.autoFocusFirstError;
  }
  public set focusOnFirstError(val: boolean) {
    this.autoFocusFirstError = val;
  }
  /**
   * Gets or sets the visibility of the Start, Next, Previous, and Complete navigation buttons.
   *
   * Possible values:
   *
   * - `true` (default) - Displays the navigation buttons.
   * - `false` - Hides the navigation buttons. This setting may be useful if you [implement custom external navigation](https://surveyjs.io/form-library/examples/external-form-navigation-system/).
   * @see navigationButtonsLocation
   * @see autoAdvanceEnabled
   * @see showPrevButton
   * @see showCompleteButton
   */
  public get showNavigationButtons(): boolean | any {
    return this.getPropertyValue("showNavigationButtons");
  }
  public set showNavigationButtons(val: boolean | any) {
    // if (val === true || val === undefined) {
    //   val = "bottom";
    // }
    // if (val === false) {
    //   val = "none";
    // }
    if (val === "both") {
      val === "topBottom";
    }
    if (val === true || val === false) {
      this.setPropertyValue("showNavigationButtons", val);
    } else if (val === "none") {
      this.setPropertyValue("showNavigationButtons", false);
    } else if (["top", "bottom", "both", "topBottom"].indexOf(val) > -1) {
      this.setPropertyValue("showNavigationButtons", true);
      this.navigationButtonsLocation = val;
    }
  }
  /**
   * Gets or sets the position of the Start, Next, Previous, and Complete navigation buttons. Applies only if the [`showNavigationButtons`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showNavigationButtons) property is `true`.
   *
   * Possible values:
   *
   * - `"bottom"` (default) - Displays the navigation buttons below survey content.
   * - `"top"` - Displays the navigation buttons above survey content.
   * - `"topBottom"` - Displays the navigation buttons above and below survey content.
   * @see autoAdvanceEnabled
   * @see showPrevButton
   * @see showCompleteButton
   */
  public get navigationButtonsLocation(): string | any {
    return this.getPropertyValue("navigationButtonsLocation");
  }
  public set navigationButtonsLocation(val: string | any) {
    this.setPropertyValue("navigationButtonsLocation", val);
  }
  /**
   * Specifies whether to display the Previous button. Set this property to `false` if respondents should not move backward along the survey.
   * @see showNavigationButtons
   * @see showCompleteButton
   */
  public get showPrevButton(): boolean {
    return this.getPropertyValue("showPrevButton");
  }
  public set showPrevButton(val: boolean) {
    this.setPropertyValue("showPrevButton", val);
  }
  /**
   * Specifies whether to display the Complete button. Set this property to `false` if respondents should not complete the survey.
   * @see showNavigationButtons
   * @see showPrevButton
   */
  public get showCompleteButton(): boolean {
    return this.getPropertyValue("showCompleteButton", true);
  }
  public set showCompleteButton(val: boolean) {
    this.setPropertyValue("showCompleteButton", val);
  }
  /**
   * Gets or sets the visibility of the table of contents.
   *
   * Default value: `false`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/toc-feature/ (linkStyle))
   * @see tocLocation
   */
  public get showTOC(): boolean {
    return this.getPropertyValue("showTOC");
  }
  public set showTOC(val: boolean) {
    this.setPropertyValue("showTOC", val);
  }
  /**
   * Gets or sets the position of the table of contents. Applies only when the table of contents is visible.
   *
   * Possible values:
   *
   * - `"left"` (default)
   * - `"right"`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/toc-feature/ (linkStyle))
   * @see showTOC
   */
  public get tocLocation(): "left" | "right" {
    return this.getPropertyValue("tocLocation");
  }
  public set tocLocation(val: "left" | "right") {
    this.setPropertyValue("tocLocation", val);
  }
  /**
   * Specifies whether to display the [survey title](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#title).
   *
   * [View Demo](https://surveyjs.io/form-library/examples/brand-your-survey-header/ (linkStyle))
   * @see title
   */
  public get showTitle(): boolean {
    return this.getPropertyValue("showTitle");
  }
  public set showTitle(val: boolean) {
    this.setPropertyValue("showTitle", val);
  }
  /**
   * Specifies whether to display [page titles](https://surveyjs.io/form-library/documentation/api-reference/page-model#title).
   */
  public get showPageTitles(): boolean {
    return this.getPropertyValue("showPageTitles");
  }
  public set showPageTitles(val: boolean) {
    this.setPropertyValue("showPageTitles", val);
  }
  /**
   * Specifies whether to show the [complete page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#complete-page).
   * @see onComplete
   * @see navigateToUrl
   */
  public get showCompletePage(): boolean {
    return this.getPropertyValue("showCompletePage");
  }
  public set showCompletePage(val: boolean) {
    this.setPropertyValue("showCompletePage", val);
  }
  /**
   * @deprecated Use the [`showCompletePage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showCompletePage) property instead.
   */
  public get showCompletedPage(): boolean { return this.showCompletePage; }
  public set showCompletedPage(val: boolean) { this.showCompletePage = val; }
  /**
   * A URL to which respondents should be navigated after survey completion.
   * @see onNavigateToUrl
   * @see navigateToUrlOnCondition
   */
  public get navigateToUrl(): string {
    return this.getPropertyValue("navigateToUrl");
  }
  public set navigateToUrl(val: string) {
    this.setPropertyValue("navigateToUrl", val);
  }
  /**
   * An array of objects that allows you to navigate respondents to different URLs after survey completion.
   *
   * Each object should include the [`expression`](https://surveyjs.io/form-library/documentation/api-reference/urlconditionitem#url) and [`url`](https://surveyjs.io/form-library/documentation/api-reference/urlconditionitem#expression) properties. When `expression` evaluates to `true`, the survey navigates to the corresponding `url`. Refer to the following help topic for more information about expressions: [Expressions](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#expressions).
   * @see onNavigateToUrl
   * @see navigateToUrl
   */
  public get navigateToUrlOnCondition(): Array<UrlConditionItem> {
    return this.getPropertyValue("navigateToUrlOnCondition");
  }
  public set navigateToUrlOnCondition(val: Array<UrlConditionItem>) {
    this.setPropertyValue("navigateToUrlOnCondition", val);
  }

  public getNavigateToUrl(): string {
    var item = this.getExpressionItemOnRunCondition(
      this.navigateToUrlOnCondition
    );
    var url = !!item ? (<UrlConditionItem>item).url : this.navigateToUrl;
    if (!!url) {
      url = this.processText(url, false);
    }
    return url;
  }
  private navigateTo() {
    var url = this.getNavigateToUrl();
    var options = { url: url, allow: true };
    this.onNavigateToUrl.fire(this, options);
    if (!options.url || !options.allow) return;
    navigateToUrl(options.url);
  }
  /**
   * Specifies one or multiple characters that designate required questions.
   *
   * Default value: `*`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/modify-question-title/ (linkStyle))
   */
  public get requiredMark(): string {
    return this.getPropertyValue("requiredMark");
  }
  public set requiredMark(val: string) {
    this.setPropertyValue("requiredMark", val);
  }
  /**
   * @deprecated Use the [`requiredMark`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#requiredMark) property instead.
   */
  public get requiredText(): string {
    return this.requiredMark;
  }
  public set requiredText(val: string) {
    this.requiredMark = val;
  }
  /**
   * Specifies whether to hide validation errors thrown by the Required validation in the UI.
   *
   * [Built-In Client-Side Validators](https://surveyjs.io/form-library/documentation/data-validation#built-in-client-side-validators (linkStyle))
   * @see validationEnabled
   * @see validationAllowSwitchPages
   */
  public hideRequiredErrors: boolean = false;
  private beforeSettingQuestionErrors(question: Question, errors: Array<SurveyError>): void {
    this.makeRequiredErrorsInvisible(errors);
    this.onSettingQuestionErrors.fire(this, {
      question: question,
      errors: errors,
    });
  }
  private makeRequiredErrorsInvisible(errors: Array<SurveyError>) {
    if (!this.hideRequiredErrors) return;
    for (var i = 0; i < errors.length; i++) {
      var erType = errors[i].getErrorType();
      if (erType == "required" || erType == "requireoneanswer") {
        errors[i].visible = false;
      }
    }
  }
  /**
   * Specifies the initial number or letter from which to start question numbering.
   *
   * [Question Numbers](https://surveyjs.io/form-library/documentation/design-survey/configure-question-titles#question-numbers (linkStyle))
   */
  public get questionStartIndex(): string {
    return this.getPropertyValue("questionStartIndex", "");
  }
  public set questionStartIndex(val: string) {
    this.setPropertyValue("questionStartIndex", val);
  }
  /**
   * Specifies whether to store the "Other" option response in a separate property.
   *
   * Default value: `true`
   *
   * Respondents can leave comments when they select "Other" in choice-based questions, such as Dropdown or Checkboxes. Comment values are saved in a separate property. The property name is composed of the question `name` and [`commentSuffix`](#commentSuffix). However, you can use the question `name` as a key to store the comment value instead. Disable the `storeOthersAsComment` property in this case.
   * @see maxCommentLength
   */
  public get storeOthersAsComment(): boolean {
    return this.getPropertyValue("storeOthersAsComment");
  }
  public set storeOthersAsComment(val: boolean) {
    this.setPropertyValue("storeOthersAsComment", val);
  }
  /**
   * Specifies the maximum text length in textual questions ([Single-Line Input](https://surveyjs.io/form-library/examples/text-entry-question/), [Long Text](https://surveyjs.io/form-library/examples/add-open-ended-question-to-a-form/), [Multiple Textboxes](https://surveyjs.io/form-library/examples/multiple-text-box-question/)), measured in characters.
   *
   * Default value: 0 (unlimited)
   *
   * You can override this setting for individual questions if you specify their [`maxLength`](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model#maxLength) property.
   * @see maxCommentLength
   */
  public get maxTextLength(): number {
    return this.getPropertyValue("maxTextLength");
  }
  public set maxTextLength(val: number) {
    this.setPropertyValue("maxTextLength", val);
  }
  /**
   * Specifies the maximum text length for question comments. Applies to questions with the [`showCommentArea`](https://surveyjs.io/form-library/documentation/api-reference/question#showCommentArea) or [`showOtherItem`](https://surveyjs.io/form-library/documentation/api-reference/question#showOtherItem) property set to `true`.
   *
   * Default value: 0 (unlimited)
   * @see maxTextLength
   */
  public get maxCommentLength(): number {
    return this.getPropertyValue("maxCommentLength");
  }
  public set maxCommentLength(val: number) {
    this.setPropertyValue("maxCommentLength", val);
  }
  /**
   * @deprecated Use the [`maxCommentLength`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#maxCommentLength) property instead.
   */
  public get maxOthersLength(): number {
    return this.maxCommentLength;
  }
  public set maxOthersLength(val: number) {
    this.maxCommentLength = val;
  }

  /**
   * Specifies whether the survey switches to the next page automatically after a user answers all questions on the current page.
   *
   * Default value: `false`
   *
   * If you enable this property, the survey is also completed automatically. Set the [`autoAdvanceAllowComplete`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#autoAdvanceAllowComplete) property to `false` if you want to disable this behavior.
   *
   * > If any of the following questions is answered last, the survey does not switch to the next page: Checkboxes, Yes/No (Boolean) (rendered as Checkbox), Long Text, Signature, Image Picker (with Multi Select), File Upload, Single-Select Matrix (not all rows are answered), Dynamic Matrix, Dynamic Panel.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/automatically-move-to-next-page-if-answer-selected/ (linkStyle))
   * @see [`settings.autoAdvanceDelay`](https://surveyjs.io/form-library/documentation/api-reference/settings#autoAdvanceDelay)
   */
  public get autoAdvanceEnabled(): boolean {
    return this.getPropertyValue("autoAdvanceEnabled");
  }
  public set autoAdvanceEnabled(val: boolean) {
    this.setPropertyValue("autoAdvanceEnabled", val);
  }
  /**
   * @deprecated Use the [`autoAdvanceEnabled`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#autoAdvanceEnabled) property instead.
   */
  public get goNextPageAutomatic(): boolean {
    return this.autoAdvanceEnabled;
  }
  public set goNextPageAutomatic(val: boolean) {
    this.autoAdvanceEnabled = val;
  }
  /**
   * Specifies whether to complete the survey automatically after a user answers all questions on the last page. Applies only if the [`autoAdvanceEnabled`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#autoAdvanceEnabled) property is `true`.
   *
   * Default value: `true`
   * @see [`settings.autoAdvanceDelay`](https://surveyjs.io/form-library/documentation/api-reference/settings#autoAdvanceDelay)
   */
  public get autoAdvanceAllowComplete(): boolean {
    return this.getPropertyValue("autoAdvanceAllowComplete");
  }
  public set autoAdvanceAllowComplete(val: boolean) {
    this.setPropertyValue("autoAdvanceAllowComplete", val);
  }
  /**
   * @deprecated Use the [`autoAdvanceAllowComplete`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#autoAdvanceAllowComplete) property instead.
   */
  public get allowCompleteSurveyAutomatic(): boolean {
    return this.autoAdvanceAllowComplete;
  }
  public set allowCompleteSurveyAutomatic(val: boolean) {
    this.autoAdvanceAllowComplete = val;
  }
  /**
   * Specifies when the survey validates answers.
   *
   * Possible values:
   *
   * - `"onNextPage"` (default) - Triggers validation before the survey is switched to the next page or completed.
   * - `"onValueChanged"` - Triggers validation each time a question value is changed.
   * - `"onComplete"` - Triggers validation when a user clicks the Complete button. If previous pages contain errors, the survey switches to the page with the first error.
   *
   * > In SurveyJS Form Library v1.12.5 and earlier, the `"onValueChanged"` mode doesn't work with date input fields because of the way browsers process date values. In most browsers, the value is considered changed as soon as a user starts entering the date in a text input field. This means that a user may only enter the day without having the chance to enter the month and year before validation is triggered. For this reason, date input fields are validated before the survey is switched to the next page or completed. Starting with v1.12.6, `"onValueChanged"` works for date input fields as well as for input fields of other types.
   *
   * Refer to the following help topic for more information: [Data Validation](https://surveyjs.io/form-library/documentation/data-validation).
   * @see validationEnabled
   * @see validationAllowSwitchPages
   * @see validationAllowComplete
   * @see validate
   */
  public get checkErrorsMode(): string {
    return this.getPropertyValue("checkErrorsMode");
  }
  public set checkErrorsMode(val: string) {
    this.setPropertyValue("checkErrorsMode", val);
  }
  /**
   * Specifies whether to trigger validation when a user focuses on an empty input field and then leaves it without making any changes. Applies only if [`checkErrorsMode`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#checkErrorsMode) is set to `"onValueChanged"`.
   *
   * Default value: `false`
   *
   * This property changes validation behavior for the following question types:
   *
   * - [Single-Line Input](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model)
   * - [Long Text](https://surveyjs.io/form-library/documentation/api-reference/comment-field-model)
   * - [Dropdown](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model)
   * @see validationEnabled
   * @see validationAllowSwitchPages
   * @see validationAllowComplete
   * @see validate
   */
  public get validateVisitedEmptyFields(): boolean {
    return this.getPropertyValue("validateVisitedEmptyFields");
  }
  public set validateVisitedEmptyFields(val: boolean) {
    this.setPropertyValue("validateVisitedEmptyFields", val);
  }
  getValidateVisitedEmptyFields(): boolean { return this.validateVisitedEmptyFields && this.isValidateOnValueChange; }
  /**
   * Specifies whether to increase the height of [Long Text](https://surveyjs.io/form-library/examples/add-open-ended-question-to-a-form/) questions and other text areas to accommodate multi-line text content.
   *
   * Default value: `false`
   *
   * You can override this property for individual Long Text questions: [`autoGrow`](https://surveyjs.io/form-library/documentation/api-reference/comment-field-model#autoGrow).
   * @see allowResizeComment
   * @see commentAreaRows
   */
  public get autoGrowComment(): boolean {
    return this.getPropertyValue("autoGrowComment");
  }
  public set autoGrowComment(val: boolean) {
    this.setPropertyValue("autoGrowComment", val);
  }
  /**
   * Specifies whether to display a resize handle for [Long Text](https://surveyjs.io/form-library/examples/add-open-ended-question-to-a-form/) questions and other text areas intended for multi-line text content.
   *
   * Default value: `true`
   *
   * You can override this property for individual Long Text questions: [`allowResize`](https://surveyjs.io/form-library/documentation/api-reference/comment-field-model#allowResize).
   * @see autoGrowComment
   * @see commentAreaRows
   */
  public get allowResizeComment(): boolean {
    return this.getPropertyValue("allowResizeComment");
  }
  public set allowResizeComment(val: boolean) {
    this.setPropertyValue("allowResizeComment", val);
  }

  /**
   * Specifies the visible height of comment areas, measured in lines. Applies to the questions with the [`showCommentArea`](https://surveyjs.io/form-library/documentation/api-reference/question#showCommentArea) or [`showOtherItem`](https://surveyjs.io/form-library/documentation/api-reference/question#showOtherItem) property enabled.
   *
   * Default value: 2
   *
   * The value of this property is passed on to the `rows` attribute of the underlying `<textarea>` element.
   * @see autoGrowComment
   * @see allowResizeComment
   */
  public get commentAreaRows(): number {
    return this.getPropertyValue("commentAreaRows");
  }
  public set commentAreaRows(val: number) {
    this.setPropertyValue("commentAreaRows", val);
  }
  /**
   * Specifies when to update the question value in questions with a text input field.
   *
   * Possible values:
   *
   * - `"onBlur"` (default) - Updates the value after the input field loses focus.
   * - `"onTyping"` - Updates the value on every key press.
   *
   * > Do not use the `"onTyping"` mode if your survey contains many expressions. Expressions are reevaluated each time a question value is changed. In `"onTyping"` mode, the question value changes frequently. This may cause performance degradation.
   *
   * You can override this setting for individual questions: [`textUpdateMode`](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model#textUpdateMode).
   */
  public get textUpdateMode(): string {
    return this.getPropertyValue("textUpdateMode");
  }
  public set textUpdateMode(val: string) {
    this.setPropertyValue("textUpdateMode", val);
  }
  /**
   * Specifies when to remove values of invisible questions from [survey results](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#data).
   *
   * Possible values:
   *
   * - `"onComplete"` (default) - Clears invisible question values when the survey is complete.
   * - `"onHidden"` - Clears a question value when the question becomes invisible. If the question is invisible initially, its value is removed on survey completion.
   * - `"onHiddenContainer"` - Clears a question value when the question or its containter (page or panel) becomes invisible. If the question is invisible initially, its value is removed on survey completion.
   * - `"none"` - Keeps invisible values in survey results.
   * - `true` - Equivalent to `"onComplete"`.
   * - `false` - Equivalent to `"none"`.
   * @see [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-visibility)
   * @see onComplete
   */
  public get clearInvisibleValues(): any {
    return this.getPropertyValue("clearInvisibleValues");
  }
  public set clearInvisibleValues(val: any) {
    if (val === true) val = "onComplete";
    if (val === false) val = "none";
    this.setPropertyValue("clearInvisibleValues", val);
  }
  /**
   * Removes values that cannot be assigned to a question, for example, choices unlisted in the `choices` array.
   *
   * Call this method after you assign new question values in code to ensure that they are acceptable.
   *
   * > This method does not remove values that fail validation. Call the [`validate()`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#validate) method to validate newly assigned values.
   * @param removeNonExistingRootKeys Pass `true` to remove values that do not correspond to any question or [calculated value](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#calculated-values).
   */
  public clearIncorrectValues(removeNonExistingRootKeys: boolean = false): void {
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].clearIncorrectValues();
    }
    if (!removeNonExistingRootKeys) return;
    var data = this.data;
    var hasChanges = false;
    for (var key in data) {
      if (!!this.getQuestionByValueName(key)) continue;
      if (
        this.iscorrectValueWithPostPrefix(key, settings.commentSuffix) ||
        this.iscorrectValueWithPostPrefix(key, settings.matrix.totalsSuffix)
      )
        continue;
      var calcValue = this.getCalculatedValueByName(key);
      if (!!calcValue && calcValue.includeIntoResult) continue;
      hasChanges = true;
      delete data[key];
    }
    if (hasChanges) {
      this.data = data;
    }
  }
  private iscorrectValueWithPostPrefix(
    key: string,
    postPrefix: string
  ): boolean {
    if (key.indexOf(postPrefix) !== key.length - postPrefix.length)
      return false;
    return !!this.getQuestionByValueName(
      key.substring(0, key.indexOf(postPrefix))
    );
  }
  /**
   * Specifies whether to keep values that cannot be assigned to questions, for example, choices unlisted in the `choices` array.
   *
   * > This property cannot be specified in the survey JSON schema. Use dot notation to specify it.
   * @see clearIncorrectValues
   */
  public get keepIncorrectValues(): boolean {
    return this.getPropertyValue("keepIncorrectValues");
  }
  public set keepIncorrectValues(val: boolean) {
    this.setPropertyValue("keepIncorrectValues", val);
  }
  /**
   * Specifies the survey's locale.
   *
   * Default value: `""` (a default locale is used)
   *
   * [Localization & Globalization help topic](https://surveyjs.io/form-library/documentation/survey-localization (linkStyle))
   *
   * [Survey Localization demo](https://surveyjs.io/form-library/examples/survey-localization/ (linkStyle))
   */
  public get locale(): string {
    return this.getPropertyValueWithoutDefault("locale") || surveyLocalization.currentLocale;
  }
  public set locale(value: string) {
    if (value === surveyLocalization.defaultLocale && !surveyLocalization.currentLocale) {
      value = "";
    }
    this.setPropertyValue("locale", value);
  }
  private onSurveyLocaleChanged(): void {
    this.notifyElementsOnAnyValueOrVariableChanged("locale");
    this.localeChanged();
    this.onLocaleChangedEvent.fire(this, this.locale);
  }
  public get localeDir(): string {
    return surveyLocalization.localeDirections[this.locale];
  }
  /**
   * Returns an array of locales whose translations are used in the survey.
   *
   * [Localization & Globalization help topic](https://surveyjs.io/form-library/documentation/survey-localization (linkStyle))
   *
   * [Survey Localization demo](https://surveyjs.io/form-library/examples/survey-localization/ (linkStyle))
   */
  public getUsedLocales(): Array<string> {
    var locs = new Array<string>();
    this.addUsedLocales(locs);
    //Replace the default locale with the real one
    var index = locs.indexOf("default");
    if (index > -1) {
      var defaultLoc = surveyLocalization.defaultLocale;
      //Remove the defaultLoc
      var defIndex = locs.indexOf(defaultLoc);
      if (defIndex > -1) {
        locs.splice(defIndex, 1);
      }
      index = locs.indexOf("default");
      locs[index] = defaultLoc;
    }
    return locs;
  }
  public localeChanged(): void {
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].localeChanged();
    }
  }
  //ILocalizableOwner
  getLocale(): string {
    return this.locale;
  }
  public locStrsChanged(): void {
    if (this.isClearingUnsedValues) return;
    super.locStrsChanged();
    if (!this.currentPage) return;
    if (this.isDesignMode) {
      this.pages.forEach(page => page.locStrsChanged());
    } else {
      var page = this.activePage;
      if (!!page) {
        page.locStrsChanged();
      }
      const visPages = this.visiblePages;
      for (var i = 0; i < visPages.length; i++) {
        visPages[i].navigationLocStrChanged();
      }
    }
    if (!this.isStartPageActive) {
      this.updateProgressText();
    }
    if(!!this.navigationBarValue) {
      this.navigationBar.locStrsChanged();
    }
  }
  public getMarkdownHtml(text: string, name: string): string {
    return this.getSurveyMarkdownHtml(this, text, name);
  }
  public getRenderer(name: string): string {
    return this.getRendererForString(this, name);
  }
  public getRendererContext(locStr: LocalizableString) {
    return this.getRendererContextForString(this, locStr);
  }
  public getRendererForString(element: Question | PanelModel | PageModel | SurveyModel, name: string): string {
    let renderAs = this.getBuiltInRendererForString(element, name);
    renderAs = this.elementWrapperComponentNameCore(renderAs, element, "string", name);
    const options: TextRenderAsEvent = { element: element, name: name, renderAs: renderAs };
    this.onTextRenderAs.fire(this, options);
    return options.renderAs;
  }
  public getRendererContextForString(element: Base, locStr: LocalizableString): any {
    return this.elementWrapperDataCore(locStr, element, "string");
  }
  getExpressionDisplayValue(
    question: Question,
    value: any,
    displayValue: string
  ): string {
    const options = {
      question: question,
      value: value,
      displayValue: displayValue,
    };
    this.onGetExpressionDisplayValue.fire(this, options);
    return options.displayValue;
  }
  private getBuiltInRendererForString(element: Base, name: string): string {
    if (this.isDesignMode) return LocalizableString.editableRenderer;
    return undefined;
  }
  public getProcessedText(text: string) {
    return this.processText(text, true);
  }
  getLocString(str: string) {
    return this.getLocalizationString(str);
  }
  //ISurveyErrorOwner
  getErrorCustomText(text: string, error: SurveyError): string {
    return this.getSurveyErrorCustomText(this, text, error);
  }
  getSurveyErrorCustomText(obj: PanelModel | Question | SurveyModel, text: string, error: SurveyError): string {
    const options: ErrorCustomTextEvent = {
      text: text,
      name: error.getErrorType(),
      obj: obj,
      error: error
    };
    this.onErrorCustomText.fire(this, options);
    return options.text;
  }
  getQuestionDisplayValue(question: Question, displayValue: any): any {
    const options = { question: question, displayValue: displayValue };
    this.onGetQuestionDisplayValue.fire(this, options);
    return options.displayValue;
  }
  /**
   * A message that is displayed when a survey does not contain visible pages or questions.
   * @see [Localization & Globalization](https://surveyjs.io/form-library/documentation/survey-localization)
   */
  public get emptySurveyText(): string {
    return this.getLocalizableStringText("emptySurveyText");
  }
  public set emptySurveyText(val: string) {
    this.setLocalizableStringText("emptySurveyText", val);
  }
  //#region Title/Header options
  /**
   * An image URL or a Base64-encoded image to use as a survey logo.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-logo/ (linkStyle))
   * @see logoPosition
   * @see logoFit
   */
  public get logo(): string {
    return this.getLocalizableStringText("logo");
  }
  public set logo(value: string) {
    this.setLocalizableStringText("logo", value);
  }
  get locLogo(): LocalizableString {
    return this.getLocalizableString("logo");
  }
  /**
   * A logo width in CSS-accepted values.
   *
   * Default value: `auto` (the width is calculated automatically based on the [`logoHeight`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#logoHeight) value to keep the original aspect ratio)
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-logo/ (linkStyle))
   * @see logo
   * @see logoPosition
   * @see logoFit
   */
  public get logoWidth(): any {
    return this.getPropertyValue("logoWidth");
  }
  public set logoWidth(value: any) {
    this.setPropertyValue("logoWidth", value);
  }

  public get renderedLogoWidth(): number {
    return this.logoWidth ? getRenderedSize(this.logoWidth) : undefined;
  }
  public get renderedStyleLogoWidth(): string {
    return this.logoWidth ? getRenderedStyleSize(this.logoWidth) : undefined;
  }

  /**
   * A logo height in CSS-accepted values.
   *
   * Default value: `40px`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-logo/ (linkStyle))
   * @see logoWidth
   * @see logo
   * @see logoPosition
   * @see logoFit
   */
  public get logoHeight(): any {
    return this.getPropertyValue("logoHeight");
  }
  public set logoHeight(value: any) {
    this.setPropertyValue("logoHeight", value);
  }
  public get renderedLogoHeight(): number {
    return this.logoHeight ? getRenderedSize(this.logoHeight) : undefined;
  }
  public get renderedStyleLogoHeight(): string {
    return this.logoHeight ? getRenderedStyleSize(this.logoHeight) : undefined;
  }
  /**
   * A logo position relative to the [survey title](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#title).
   *
   * Possible values:
   *
   * - `"left"` (default) - Places the logo to the left of the survey title.
   * - `"right"` - Places the logo to the right of the survey title.
   * - `"none"` - Hides the logo.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-logo/ (linkStyle))
   * @see logo
   * @see logoFit
   */
  public get logoPosition(): string {
    return this.getPropertyValue("logoPosition");
  }
  public set logoPosition(value: string) {
    this.setPropertyValue("logoPosition", value);
  }
  public get hasLogo(): boolean {
    return this.getPropertyValue("hasLogo", undefined, () => !!this.logo && this.logoPosition !== "none");
  }
  private resetHasLogo(): void {
    this.resetPropertyValue("hasLogo");
  }
  public get isLogoBefore(): boolean {
    if (this.isDesignMode) return false;
    return (
      this.renderedHasLogo &&
      (this.logoPosition === "left" || this.logoPosition === "top")
    );
  }
  public get isLogoAfter(): boolean {
    if (this.isDesignMode) return this.renderedHasLogo;
    return (
      this.renderedHasLogo &&
      (this.logoPosition === "right" || this.logoPosition === "bottom")
    );
  }
  public get logoClassNames(): string {
    const logoClasses: { [index: string]: string } = {
      left: "sv-logo--left",
      right: "sv-logo--right",
      top: "sv-logo--top",
      bottom: "sv-logo--bottom",
    };
    return new CssClassBuilder().append(this.css.logo)
      .append(logoClasses[this.logoPosition]).toString();
  }
  public get titleIsEmpty(): boolean {
    return this.getPropertyValue("titleIsEmpty", undefined, () => this.locTitle.isEmpty);
  }
  public get renderedHasTitle(): boolean {
    if (this.isDesignMode) return this.isPropertyVisible("title");
    return !this.titleIsEmpty && this.showTitle;
  }
  public get renderedHasDescription(): boolean {
    if (this.isDesignMode) return this.isPropertyVisible("description");
    return !!this.hasDescription;
  }
  public get hasTitle(): boolean {
    return this.renderedHasTitle;
  }
  public get renderedHasLogo(): boolean {
    if (this.isDesignMode) return this.isPropertyVisible("logo");
    return this.hasLogo;
  }
  public get renderedHasHeader(): boolean {
    return this.renderedHasTitle || this.renderedHasLogo;
  }
  /**
   * Specifies how to resize a logo to fit it into its container.
   *
   * Possible values:
   *
   * - `"contain"` (default)
   * - `"cover"`
   * - `"fill"`
   * - `"none"`
   *
   * Refer to the [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) CSS property description for information on the possible values.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-logo/ (linkStyle))
   * @see logo
   * @see logoPosition
   */
  public get logoFit(): string {
    return this.getPropertyValue("logoFit");
  }
  public set logoFit(val: string) {
    this.setPropertyValue("logoFit", val);
  }
  //#endregion

  @property({ defaultValue: {} }) private cssVariables: { [index: string]: string } = {};
  public get themeVariables() {
    return Object.assign({}, this.cssVariables);
  }

  @property() _isMobile = false;
  public setIsMobile(newVal = true) {
    if (this._isMobile !== newVal) {
      this._isMobile = newVal;
      this.updateCss();
      this.getAllQuestions().forEach(q => q.setIsMobile(newVal));
    }
  }
  public get isMobile() {
    return this._isMobile && !this.isDesignMode;
  }
  @property() private _isCompact: boolean = false;
  public set isCompact(newVal: boolean) {
    if (newVal !== this._isCompact) {
      this._isCompact = newVal;
      this.updateElementCss();
      this.triggerResponsiveness(true);
    }
  }
  public get isCompact(): boolean {
    return this._isCompact;
  }
  protected isLogoImageChoosen() {
    return this.locLogo.renderedHtml;
  }
  public get titleMaxWidth(): string {
    return "";
  }
  /**
   * An image to display in the background of the survey or form. Accepts a base64 or URL string value.
   * @see backgroundOpacity
   */
  @property({
    onSet: (newValue, target: SurveyModel) => {
      target.updateCss();
    }
  }) backgroundImage: string;
  public get renderBackgroundImage(): string {
    return this.getPropertyValue("renderBackgroundImage", undefined, () => wrapUrlForBackgroundImage(this.backgroundImage));
  }
  @property() backgroundImageFit: ImageFit;
  @property({
    onSet: (newValue, target: SurveyModel) => {
      target.updateCss();
    }
  }) backgroundImageAttachment: ImageAttachment;
  /**
   * A value from 0 to 1 that specifies how transparent the [background image](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#backgroundImage) should be: 0 makes the image completely transparent, and 1 makes it opaque.
   */
  public get backgroundOpacity(): number {
    return this.getPropertyValue("backgroundOpacity");
  }
  public set backgroundOpacity(val: number) {
    this.setPropertyValue("backgroundOpacity", val);
  }
  public get backgroundImageStyle(): any {
    return this.getPropertyValue("backgroundImageStyle", undefined, () => this.calcBackgroundImageStyle());
  }
  private calcBackgroundImageStyle() {
    return {
      opacity: this.backgroundOpacity,
      backgroundImage: this.renderBackgroundImage,
      backgroundSize: this.backgroundImageFit,
      backgroundAttachment: !this.fitToContainer ? this.backgroundImageAttachment : undefined
    };
  }
  @property() wrapperFormCss: string;
  public updateWrapperFormCss(): void {
    this.wrapperFormCss = new CssClassBuilder()
      .append(this.css.rootWrapper)
      .append(this.css.rootWrapperHasImage, !!this.backgroundImage)
      .append(this.css.rootWrapperFixed, !!this.backgroundImage && this.backgroundImageAttachment === "fixed")
      .toString();
  }
  /**
   * HTML content displayed on the [complete page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#complete-page).
   *
   * [View Demo](https://surveyjs.io/form-library/examples/modify-survey-navigation-settings/ (linkStyle))
   * @see showCompletePage
   * @see completedHtmlOnCondition
   */
  public get completedHtml(): string {
    return this.getLocalizableStringText("completedHtml");
  }
  public set completedHtml(value: string) {
    this.setLocalizableStringText("completedHtml", value);
  }
  get locCompletedHtml(): LocalizableString {
    return this.getLocalizableString("completedHtml");
  }
  /**
   * An array of objects that allows you to specify different HTML content for the [complete page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#complete-page).
   *
   * Each object should include the [`expression`](https://surveyjs.io/form-library/documentation/api-reference/htmlconditionitem#expression) and [`html`](https://surveyjs.io/form-library/documentation/api-reference/htmlconditionitem#html) properties. When `expression` evaluates to `true`, the survey uses the corresponding HTML markup instead of [`completedHtml`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#completedHtml). Refer to the following help topic for more information about expressions: [Expressions](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#expressions).
   *
   * [View Demo](https://surveyjs.io/form-library/examples/nps-question/ (linkStyle))
   */
  public get completedHtmlOnCondition(): Array<HtmlConditionItem> {
    return this.getPropertyValue("completedHtmlOnCondition");
  }
  public set completedHtmlOnCondition(val: Array<HtmlConditionItem>) {
    this.setPropertyValue("completedHtmlOnCondition", val);
  }
  /**
   * Calculates a given [expression](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#expressions) and returns a result value.
   * @param expression An expression to calculate.
   * @param callback A callback function that you can use to access the calculation result if the expression uses asynchronous functions.
   */
  public runExpression(expression: string, callback?: (res: any) => void): any {
    if (!expression) return null;
    var values = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    const exp = new ExpressionRunner(expression);
    let onCompleteRes: any = undefined;
    exp.onRunComplete = (res: any) => {
      onCompleteRes = res;
      callback && callback(res);
    };
    return exp.run(values, properties) || onCompleteRes;
  }
  private setValueOnExpressionCounter: number = 0;
  public get isSettingValueOnExpression(): boolean { return this.setValueOnExpressionCounter > 0; }
  startSetValueOnExpression(): void {
    this.setValueOnExpressionCounter ++;
  }
  finishSetValueOnExpression(): void {
    this.setValueOnExpressionCounter --;
  }
  /**
   * Calculates a given [expression](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#expressions) and returns `true` or `false`.
   * @param expression An expression to calculate.
   */
  public runCondition(expression: string): boolean {
    if (!expression) return false;
    var values = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    return new ConditionRunner(expression).run(values, properties);
  }
  /**
   * Executes [all triggers](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#triggers), except ["complete"](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#complete).
   *
   * [Conditional Survey Logic (Triggers)](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-survey-logic-triggers (linkStyle))
   * @see onTriggerExecuted
   */
  public runTriggers(): void {
    this.checkTriggers(this.getFilteredValues(), false);
  }
  public get renderedCompletedHtml(): string {
    var item = this.getExpressionItemOnRunCondition(
      this.completedHtmlOnCondition
    );
    return !!item ? (<HtmlConditionItem>item).html : this.completedHtml;
  }
  private getExpressionItemOnRunCondition(
    items: Array<ExpressionItem>
  ): ExpressionItem {
    if (items.length == 0) return null;
    var values = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    for (var i = 0; i < items.length; i++) {
      if (items[i].runCondition(values, properties)) {
        return items[i];
      }
    }
    return null;
  }

  /**
   * HTML content displayed to a user who has completed the survey before. To identify such users, the survey uses a [cookie name](#cookieName) or [client ID](#clientId).
   * @see processedCompletedBeforeHtml
   */
  public get completedBeforeHtml(): string {
    return this.getLocalizableStringText("completedBeforeHtml");
  }
  public set completedBeforeHtml(value: string) {
    this.setLocalizableStringText("completedBeforeHtml", value);
  }
  get locCompletedBeforeHtml(): LocalizableString {
    return this.getLocalizableString("completedBeforeHtml");
  }
  /**
   * HTML content displayed while a survey JSON schema is [being loaded](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#beginLoading).
   * @see processedLoadingHtml
   */
  public get loadingHtml(): string {
    return this.getLocalizableStringText("loadingHtml");
  }
  public set loadingHtml(value: string) {
    this.setLocalizableStringText("loadingHtml", value);
  }
  get locLoadingHtml(): LocalizableString {
    return this.getLocalizableString("loadingHtml");
  }
  public get defaultLoadingHtml(): string {
    return "<h3>" + this.getLocalizationString("loadingSurvey") + "</h3>";
  }
  public get navigationBar(): ActionContainer {
    if(!this.navigationBarValue) {
      this.navigationBarValue = this.createNavigationBar();
      this.updateNavigationCss();
    }
    return this.navigationBarValue;
  }
  /**
   * Adds a custom navigation item similar to the Previous Page, Next Page, and Complete buttons.
   * Accepts an object described in the [IAction](https://surveyjs.io/Documentation/Library?id=IAction) help section.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-changenavigation/ (linkStyle))
  */
  public addNavigationItem(val: IAction): Action {
    if (!val.component) {
      val.component = "sv-nav-btn";
    }
    if (!val.innerCss) {
      val.innerCss = this.cssSurveyNavigationButton;
    }
    return this.navigationBar.addAction(val);
  }
  private removeNavigationItem(id: string): void {
    const action = this.navigationBar.getActionById(id);
    if(action) {
      const actions = this.navigationBar.actions;
      actions.splice(actions.indexOf(action), 1);
    }
  }
  /**
   * Gets or sets a caption for the Start button.
   * @see firstPageIsStartPage
   * @see [Localization & Globalization](https://surveyjs.io/form-library/documentation/survey-localization)
   */
  public get startSurveyText(): string {
    return this.getLocalizableStringText("startSurveyText");
  }
  public set startSurveyText(newValue: string) {
    this.setLocalizableStringText("startSurveyText", newValue);
  }
  get locStartSurveyText(): LocalizableString {
    return this.getLocalizableString("startSurveyText");
  }
  /**
   * Gets or sets a caption for the Previous button.
   * @see [Localization & Globalization](https://surveyjs.io/form-library/documentation/survey-localization)
   */
  public get pagePrevText(): string {
    return this.getLocalizableStringText("pagePrevText");
  }
  public set pagePrevText(newValue: string) {
    this.setLocalizableStringText("pagePrevText", newValue);
  }
  get locPagePrevText(): LocalizableString {
    return this.getLocalizableString("pagePrevText");
  }
  /**
   * Gets or sets a caption for the Next button.
   * @see [Localization & Globalization](https://surveyjs.io/form-library/documentation/survey-localization)
   */
  public get pageNextText(): string {
    return this.getLocalizableStringText("pageNextText");
  }
  public set pageNextText(newValue: string) {
    this.setLocalizableStringText("pageNextText", newValue);
  }
  get locPageNextText(): LocalizableString {
    return this.getLocalizableString("pageNextText");
  }
  /**
   * Gets or sets a caption for the Complete button.
   * @see [Localization & Globalization](https://surveyjs.io/form-library/documentation/survey-localization)
   */
  public get completeText(): string {
    return this.getLocalizableStringText("completeText");
  }
  public set completeText(newValue: string) {
    this.setLocalizableStringText("completeText", newValue);
  }
  get locCompleteText(): LocalizableString {
    return this.getLocalizableString("completeText");
  }
  /**
   * Gets or sets a caption for the Preview button.
   * @see showPreviewBeforeComplete
   * @see showPreview
   * @see editText
   */
  public get previewText(): string {
    return this.getLocalizableStringText("previewText");
  }
  public set previewText(newValue: string) {
    this.setLocalizableStringText("previewText", newValue);
  }
  get locPreviewText(): LocalizableString {
    return this.getLocalizableString("previewText");
  }
  /**
   * Gets or sets a caption for the Edit button displayed when the survey shows a [preview of given answers](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#preview-page).
   * @see showPreviewBeforeComplete
   * @see cancelPreview
   * @see previewText
   */
  public get editText(): string {
    return this.getLocalizableStringText("editText");
  }
  public set editText(newValue: string) {
    this.setLocalizableStringText("editText", newValue);
  }
  get locEditText(): LocalizableString {
    return this.getLocalizableString("editText");
  }
  getElementTitleTagName(element: Base, tagName: string): string {
    if (this.onGetTitleTagName.isEmpty) return tagName;
    const options: GetTitleTagNameEvent = { element: element, tagName: tagName };
    this.onGetTitleTagName.fire(this, options);
    return options.tagName;
  }
  /**
   * Specifies a pattern for question titles.
   *
   * Refer to the following help topic for more information: [Title Pattern](https://surveyjs.io/form-library/documentation/design-survey/configure-question-titles#title-pattern).
   */
  public get questionTitlePattern(): string {
    return this.getPropertyValue("questionTitlePattern", "numTitleRequire");
  }
  public set questionTitlePattern(val: string) {
    if (
      val !== "numRequireTitle" &&
      val !== "requireNumTitle" &&
      val != "numTitle"
    ) {
      val = "numTitleRequire";
    }
    this.setPropertyValue("questionTitlePattern", val);
  }
  getQuestionTitlePatternOptions(): Array<any> {
    const res = new Array<any>();
    const title = this.getLocalizationString("questionTitlePatternText");
    const num = !!this.questionStartIndex ? this.questionStartIndex : "1.";
    res.push({
      value: "numTitleRequire",
      text: num + " " + title + " " + this.requiredMark
    });
    res.push({
      value: "numRequireTitle",
      text: num + " " + this.requiredMark + " " + title
    });
    // res.push({
    //   value: "requireNumTitle",
    //   text: this.requiredMark + " " + num + " " + title
    // });
    res.push({
      value: "numTitle",
      text: num + " " + title
    });
    return res;
  }
  public get questionTitleTemplate(): string {
    return this.getLocalizableStringText("questionTitleTemplate");
  }
  public set questionTitleTemplate(value: string) {
    this.setLocalizableStringText("questionTitleTemplate", value);
    this.questionTitlePattern = this.getNewTitlePattern(value);
    this.questionStartIndex = this.getNewQuestionTitleElement(
      value,
      "no",
      this.questionStartIndex,
      "1"
    );
    this.requiredMark = this.getNewQuestionTitleElement(
      value,
      "require",
      this.requiredMark,
      "*"
    );
  }
  private getNewTitlePattern(template: string): string {
    if (!!template) {
      var strs = [];
      while (template.indexOf("{") > -1) {
        template = template.substring(template.indexOf("{") + 1);
        var ind = template.indexOf("}");
        if (ind < 0) break;
        strs.push(template.substring(0, ind));
        template = template.substring(ind + 1);
      }
      if (strs.length > 1) {
        if (strs[0] == "require") return "requireNumTitle";
        if (strs[1] == "require" && strs.length == 3) return "numRequireTitle";
        if (strs.indexOf("require") < 0) return "numTitle";
      }
      if (strs.length == 1 && strs[0] == "title") {
        return "numTitle";
      }
    }
    return "numTitleRequire";
  }
  private getNewQuestionTitleElement(
    template: string,
    name: string,
    currentValue: string,
    defaultValue: string
  ): string {
    name = "{" + name + "}";
    if (!template || template.indexOf(name) < 0) return currentValue;
    var ind = template.indexOf(name);
    var prefix = "";
    var postfix = "";
    var i = ind - 1;
    for (; i >= 0; i--) {
      if (template[i] == "}") break;
    }
    if (i < ind - 1) {
      prefix = template.substring(i + 1, ind);
    }
    ind += name.length;
    i = ind;
    for (; i < template.length; i++) {
      if (template[i] == "{") break;
    }
    if (i > ind) {
      postfix = template.substring(ind, i);
    }
    i = 0;
    while (i < prefix.length && prefix.charCodeAt(i) < 33) i++;
    prefix = prefix.substring(i);
    i = postfix.length - 1;
    while (i >= 0 && postfix.charCodeAt(i) < 33) i--;
    postfix = postfix.substring(0, i + 1);
    if (!prefix && !postfix) return currentValue;
    var value = !!currentValue ? currentValue : defaultValue;
    return prefix + value + postfix;
  }
  get locQuestionTitleTemplate(): LocalizableString {
    return this.getLocalizableString("questionTitleTemplate");
  }
  getUpdatedQuestionTitle(question: Question, title: string): string {
    if (this.onGetQuestionTitle.isEmpty) return title;
    const options: GetQuestionTitleEvent = { question: question, title: title };
    this.onGetQuestionTitle.fire(this, options);
    return options.title;
  }
  getUpdatedQuestionNo(question: Question, no: string): string {
    if (this.onGetQuestionNumber.isEmpty) return no;
    const options: GetQuestionNumberEvent = { question: question, number: no, no: no };
    this.onGetQuestionNumber.fire(this, options);
    return options.no === no ? options.number : options.no;
  }
  getUpdatedPanelNo(panel: PanelModel, no: string): string {
    if (this.onGetPanelNumber.isEmpty) return no;
    const options: GetPanelNumberEvent = { panel: panel, number: no };
    this.onGetPanelNumber.fire(this, options);
    return options.number;
  }
  getUpdatedPageNo(page: PageModel, no: string): string {
    if (this.onGetPageNumber.isEmpty) return no;
    const options: GetPageNumberEvent = { page: page, number: no };
    this.onGetPageNumber.fire(this, options);
    return options.number;
  }
  /**
   * Specifies whether page titles contain page numbers.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/how-to-number-pages-and-questions/ (linkStyle))
   * @see onGetPageNumber
   */
  public get showPageNumbers(): boolean {
    return this.getPropertyValue("showPageNumbers");
  }
  public set showPageNumbers(value: boolean) {
    if (value === this.showPageNumbers) return;
    this.setPropertyValue("showPageNumbers", value);
    this.updateVisibleIndexes();
  }
  /**
   * Specifies whether to display question numbers and how to calculate them.
   *
   * Possible values:
   *
   * - `true` or `"on"` - Displays question numbers.
   * - `"onpage"` - Displays question numbers and starts numbering on each page from scratch.
   * - `false` or `"off"` - Hides question numbers.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/how-to-number-pages-and-questions/ (linkStyle))
   *
   * If you want to hide the number of an individual question, disable its [`showNumber`](https://surveyjs.io/form-library/documentation/api-reference/question#showNumber) property.
   * @see onGetQuestionNumber
   */
  public get showQuestionNumbers(): string | boolean {
    return this.getPropertyValue("showQuestionNumbers");
  }
  public set showQuestionNumbers(value: string | boolean) {
    if (value === true) {
      value = "on";
    }
    if (value === false) {
      value = "off";
    }
    value = value.toLowerCase();
    value = value === "onpage" ? "onPage" : value;
    if (value === this.showQuestionNumbers) return;
    this.setPropertyValue("showQuestionNumbers", value);
    this.updateVisibleIndexes();
  }
  private progressBarValue: any;
  public get progressBar(): any {
    if(!this.progressBarValue) {
      this.progressBarValue = new ProgressButtons(this);
    }
    return this.progressBarValue;
  }
  /**
   * Specifies the visibility of the progress bar.
   *
   * Default value: `false`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/navigation-default/ (linkStyle))
   * @see progressBarLocation
   * @see progressBarType
   * @see progressValue
   */
  public get showProgressBar(): boolean {
    return this.getPropertyValue("showProgressBar");
  }
  public set showProgressBar(newValue: boolean | string) {
    this.setShowProgressBar(newValue);
  }
  protected setShowProgressBar(newValue: boolean | string) {
    if (newValue === "off") {
      newValue = false;
    }
    if (newValue === true || newValue === false) {
      this.setPropertyValue("showProgressBar", newValue);
    } else {
      this.setPropertyValue("showProgressBar", true);
      this.progressBarLocation = newValue;
    }
  }
  /**
   * Specifies the alignment of the progress bar. Applies only if the [`showProgressBar`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showProgressBar) property is `true`.
   *
   * Possible values:
   *
   * - `"aboveHeader"` - Displays the progress bar above the survey header.
   * - `"belowHeader"` - Displays the progress bar below the survey header.
   * - `"bottom"` - Displays the progress bar below survey content.
   * - `"topBottom"` - Displays the progress bar above and below survey content.
   * - `"auto"` (default) - Displays the progress bar below the survey header if the header has a [background image](https://surveyjs.io/form-library/documentation/api-reference/iheader#backgroundImage) or color. Otherwise, the progress bar is displayed above the header.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/navigation-default/ (linkStyle))
   * @see showProgressBar
   * @see progressBarType
   * @see progressValue
   */
  public get progressBarLocation(): string {
    return this.getPropertyValue("progressBarLocation");
  }
  public set progressBarLocation(newValue: string) {
    this.setPropertyValue("progressBarLocation", newValue.toLowerCase());
  }
  /**
   * Specifies the type of information displayed by the progress bar. Applies only when [`showProgressBar`](#showProgressBar) is `true`.
   *
   * Possible values:
   *
   * - `"pages"` (default) - The number of completed pages.
   * - `"questions"` - The number of answered questions.
   * - `"requiredQuestions"` - The number of answered [required questions](https://surveyjs.io/form-library/documentation/api-reference/question#isRequired).
   * - `"correctQuestions"` - The number of correct questions in a [quiz](https://surveyjs.io/form-library/documentation/design-survey/create-a-quiz).
   * - `"buttons"` - *(Obsolete)* Use the `"pages"` property value with the [`progressBarShowPageTitles`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#progressBarShowPageTitles) property set to `true` instead.
   *
   * > When `progressBarType` is set to `"pages"`, you can also enable the [`progressBarShowPageNumbers`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#progressBarShowPageNumbers) and [`progressBarShowPageTitles`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#progressBarShowPageTitles) properties if you want to display page numbers and titles in the progress bar.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/navigation-buttons/ (linkStyle))
   * @see progressValue
   */
  public get progressBarType(): string {
    return this.getPropertyValue("progressBarType");
  }
  public set progressBarType(newValue: string) {
    if (newValue === "correctquestion") newValue = "correctQuestion";
    if (newValue === "requiredquestion") newValue = "requiredQuestion";
    // if (newValue === "buttons") {
    //   newValue = "pages";
    //   this.progressBarShowPageTitles = true;
    // }
    this.setPropertyValue("progressBarType", newValue);
  }
  private get progressBarComponentName(): string {
    let actualProgressBarType = this.progressBarType;
    if (!settings.legacyProgressBarView && surveyCss.currentType === "default") {
      if (isStrCiEqual(actualProgressBarType, "pages")) {
        actualProgressBarType = "buttons";
      }
    }
    return "progress-" + actualProgressBarType;
  }
  /**
   * Specifies whether the progress bar displays page titles. Applies only when the [progress bar is visible](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showProgressBar) and [`progressBarType`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#progressBarType) is `"pages"`.
   *
   * Default value: `false`
   * @see progressBarShowPageNumbers
   * @see progressBarInheritWidthFrom
   */
  @property({
    getDefaultValue: (self: SurveyModel) => {
      return self.progressBarType === "buttons";
    },
  }) progressBarShowPageTitles: boolean;
  /**
   * Specifies whether the progress bar displays page numbers. Applies only when the [progress bar is visible](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showProgressBar) and [`progressBarType`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#progressBarType) is `"pages"`.
   *
   * Default value: `false`
   * @see progressBarShowPageTitles
   * @see progressBarInheritWidthFrom
   */
  @property() progressBarShowPageNumbers: boolean;
  /**
   * Specifies whether the progress bar spans the width of the survey or that of the survey container. Applies only when the [progress bar is visible](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showProgressBar) and [`progressBarType`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#progressBarType) is `"pages"`.
   *
   * Possible values:
   *
   * - `"survey"`\
   * The progress bar width is the same as the survey width.
   * - `"container"` (default)\
   * The progress bar width is the same as the survey container width.
   * @see progressBarShowPageTitles
   * @see progressBarShowPageNumbers
   */
  @property() progressBarInheritWidthFrom: "survey" | "container";
  public get isShowProgressBarOnTop(): boolean {
    if (!this.canShowProgressBar()) return false;
    if (!this.showProgressBar) return false;
    return ["auto", "aboveheader", "belowheader", "topbottom", "top", "both"].indexOf(this.progressBarLocation) !== -1;
  }
  public get isShowProgressBarOnBottom(): boolean {
    if (!this.canShowProgressBar()) return false;
    if (!this.showProgressBar) return false;
    return this.progressBarLocation === "bottom" || this.progressBarLocation === "both" || this.progressBarLocation === "topbottom";
  }
  public getProgressTypeComponent(): string {
    return "sv-progress-" + this.progressBarType.toLowerCase();
  }
  public getProgressCssClasses(container: string = ""): string {
    return new CssClassBuilder()
      .append(this.css.progress)
      .append(this.css.progressTop, this.isShowProgressBarOnTop && (!container || container == "header"))
      .append(this.css.progressBottom, this.isShowProgressBarOnBottom && (!container || container == "footer"))
      .toString();
  }
  private canShowProgressBar(): boolean {
    return (
      !this.isShowingPreview ||
      !this.showPreviewBeforeComplete || this.previewMode != "allQuestions"
    );
  }
  public get processedTitle(): string {
    return this.locTitle.renderedHtml;
  }
  /**
   * Gets or sets question title location relative to the input field: `"top"`, `"bottom"`, or `"left"`.
   *
   * > Certain question types (Matrix, Multiple Text) do not support the `"left"` value. For them, the `"top"` value is used.
   *
   * You can override this setting if you specify the `questionTitleLocation` property for an [individual page](https://surveyjs.io/form-library/documentation/pagemodel#questionTitleLocation) or [panel](https://surveyjs.io/form-library/documentation/panelmodel#questionTitleLocation) or set the `titleLocation` property for a [specific question](https://surveyjs.io/form-library/documentation/question#titleLocation).
   */
  public get questionTitleLocation(): string {
    return this.getPropertyValue("questionTitleLocation");
  }
  public set questionTitleLocation(value: string) {
    this.setPropertyValue("questionTitleLocation", value.toLowerCase());
    if (!this.isLoadingFromJson) {
      this.updateElementCss(true);
    }
  }
  public updateElementCss(reNew?: boolean): void {
    if (!!this.startPage) {
      this.startPage.updateElementCss(reNew);
    }
    var pages = this.visiblePages;
    for (var i = 0; i < pages.length; i++) {
      pages[i].updateElementCss(reNew);
    }
    this.updateCss();
  }
  /**
   * Specifies the error message position.
   *
   * Possible values:
   *
   * - `"top"` (default) - Displays error messages above questions.
   * - `"bottom"` - Displays error messages below questions.
   *
   * You can override this setting if you specify the `questionErrorLocation` property for an [individual page](https://surveyjs.io/form-library/documentation/pagemodel#questionErrorLocation) or [panel](https://surveyjs.io/form-library/documentation/panelmodel#questionErrorLocation) or set the `errorLocation` property for a [specific question](https://surveyjs.io/form-library/documentation/question#errorLocation).
   */
  public get questionErrorLocation(): string {
    return this.getPropertyValue("questionErrorLocation");
  }
  public set questionErrorLocation(value: string) {
    this.setPropertyValue("questionErrorLocation", value.toLowerCase());
  }
  /**
   * Specifies where to display question descriptions.
   *
   * Possible values:
   *
   * - `"underTitle"` (default) - Displays descriptions under question titles.
   * - `"underInput"` - Displays descriptions under the interactive area.
   *
   * You can override this setting for individual questions if you specify their [`descriptionLocation`](https://surveyjs.io/form-library/documentation/api-reference/question#descriptionLocation) property.
   *
   */
  public get questionDescriptionLocation(): string {
    return this.getPropertyValue("questionDescriptionLocation");
  }
  public set questionDescriptionLocation(value: string) {
    this.setPropertyValue("questionDescriptionLocation", value);
  }
  /**
   * @deprecated Use the [`readOnly`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#readOnly) property.
   */
  public get mode(): string {
    return this.readOnly ? "display" : "edit";
  }
  public set mode(value: string) {
    value = value.toLowerCase();
    if (value == this.mode) return;
    if (value != "edit" && value != "display") return;
    this.readOnly = value == "display";
  }
  /**
   * Enables the read-only mode. If you set this property to `true`, users cannot take the survey.
   *
   * Default value: `false`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/prevent-form-editing-with-read-only-mode/ (linkStyle))
   */
  public get readOnly(): boolean {
    return this.getPropertyValue("readOnly");
  }
  public set readOnly(val: boolean) {
    this.setPropertyValue("readOnly", val);
  }

  private onReadOnlyChanged() {
    for (var i = 0; i < this.pages.length; i++) {
      var page = this.pages[i];
      page.setPropertyValue("isReadOnly", page.isReadOnly);
    }
    this.updateButtonsVisibility();
    this.updateCss();
  }
  /**
   * Gets or sets an object with survey results. You can set this property with an object of the following structure:
   *
   * ```js
   * {
   *   question1Name: question1Value,
   *   question2Name: question2Value,
   *   // ...
   * }
   * ```
   *
   * When you set this property in code, the new object overrides the old object that may contain default question values and entered data. If you want to *merge* the new and old objects, call the [`mergeData(newDataObj)`](https://surveyjs.io/form-library/documentation/surveymodel#mergeData) method.
   *
   * If you assign a new object while a respondent takes the survey, set the [`currentPageNo`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#currentPageNo) property to 0 to start the survey from the beginning. This will also cause the survey to re-evaluate the [`visibleIf`](https://surveyjs.io/form-library/documentation/api-reference/question#visibleIf), [`enableIf`](https://surveyjs.io/form-library/documentation/api-reference/question#enableIf), and other [expressions](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#expressions).
   * @see setValue
   * @see getValue
   */
  public get data(): any {
    var result: { [index: string]: any } = {};
    var keys = this.getValuesKeys();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var dataValue = this.getDataValueCore(this.valuesHash, key);
      if (dataValue !== undefined) {
        result[key] = dataValue;
      }
    }
    this.setCalculatedValuesIntoResult(result);
    return result;
  }
  public set data(data: any) {
    this.valuesHash = {};
    this.setDataCore(data, !data);
  }
  /**
   * Merges a specified data object with the object from the [`data`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#data) property.
   *
   * Refer to the following help topic for more information: [Populate Form Fields | Multiple Question Values](https://surveyjs.io/form-library/documentation/design-survey/pre-populate-form-fields#multiple-question-values).
   *
   * @param data A data object to merge. It should have the following structure: `{ questionName: questionValue, ... }`
   * @see setValue
   */
  public mergeData(data: any): void {
    if (!data) return;
    const newData = this.data;
    this.mergeValues(data, newData);
    this.setDataCore(newData);
  }
  public setDataCore(data: any, clearData: boolean = false): void {
    if (clearData) {
      this.valuesHash = {};
    }
    if (data) {
      for (var key in data) {
        const dataKey = typeof key === "string" ? key.trim() : key;
        this.setDataValueCore(this.valuesHash, dataKey, data[key]);
      }
    }
    this.updateAllQuestionsValue(clearData);
    this.notifyAllQuestionsOnValueChanged();
    this.notifyElementsOnAnyValueOrVariableChanged("");
    this.runConditions();
    this.updateAllQuestionsValue(clearData);
  }
  public get isSurvey(): boolean { return true; }
  /**
   * Returns an object with survey results.
   *
   * If you want to get a survey results object that mirrors the survey structure, call the `getData()` method with an object that has the `includePages` and `includePanels` properties enabled. Without this object, the `getData()` method returns the [`data`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#data) property value.
   *
   * ```js
   * import { Model } from "survey-core";
   *
   * const surveyJson = { ... };
   * const survey = new Model(surveyJson);
   * survey.getData({ includePages: true, includePanels: true });
   * ```
   */
  public getData(options?: { includePages?: boolean, includePanels?: boolean }): any {
    const opt = options || { includePages: false, includePanels: false };
    if(!opt.includePages && !opt.includePanels) return this.data;
    return this.getStructuredData(!!opt.includePages, !opt.includePanels ? (opt.includePages ? 1 : 0) : -1);
  }
  public getStructuredData(includePages: boolean = true, level: number = -1): any {
    if (level === 0) return this.data;
    const data: any = {};
    this.pages.forEach(p => {
      if (includePages) {
        const pageValues = {};
        if (p.collectValues(pageValues, level - 1)) {
          data[p.name] = pageValues;
        }
      } else {
        p.collectValues(data, level);
      }
    });
    return data;
  }
  public setStructuredData(data: any, doMerge: boolean = false): void {
    if (!data) return;
    const res: any = {};
    for (let key in data) {
      const q = this.getQuestionByValueName(key);
      if (q) {
        res[key] = data[key];
      }
      else {
        let panel: PanelModelBase = this.getPageByName(key);
        if (!panel) {
          panel = this.getPanelByName(key);
        }
        if (panel) {
          this.collectDataFromPanel(panel, res, data[key]);
        }
      }
    }
    if (doMerge) {
      this.mergeData(res);
    } else {
      this.data = res;
    }
  }
  private collectDataFromPanel(panel: PanelModelBase, output: any, data: any): void {
    for (let key in data) {
      let el = panel.getElementByName(key);
      if (!el) continue;
      if (el.isPanel) {
        this.collectDataFromPanel(<PanelModel>el, output, data[key]);
      } else {
        output[key] = data[key];
      }
    }
  }
  private onEditingObjPropertyChanged: (sender: Base, options: any) => void;
  public get editingObj(): Base {
    return this.editingObjValue;
  }
  public set editingObj(val: Base) {
    if (this.editingObj == val) return;
    this.unConnectEditingObj();
    this.editingObjValue = val;
    if (this.isDisposed) return;
    if (!val) {
      var questions = this.getAllQuestions();
      for (var i = 0; i < questions.length; i++) {
        questions[i].unbindValue();
      }
    }
    if (!!this.editingObj) {
      this.setDataCore({});
      this.onEditingObjPropertyChanged = (sender: Base, options: any) => {
        if (!Serializer.hasOriginalProperty(this.editingObj, options.name))
          return;
        if (options.name === "locale") {
          this.setDataCore({});
        }
        this.updateOnSetValue(options.name, (<any>this.editingObj)[options.name], options.oldValue);
      };
      this.editingObj.onPropertyChanged.add(this.onEditingObjPropertyChanged);
    }
  }
  private unConnectEditingObj(): void {
    if(!!this.editingObj && !this.editingObj.isDisposed) {
      this.editingObj.onPropertyChanged.remove(
        this.onEditingObjPropertyChanged
      );
    }
  }
  public get isEditingSurveyElement(): boolean {
    return !!this.editingObj;
  }
  private setCalculatedValuesIntoResult(result: any) {
    for (var i = 0; i < this.calculatedValues.length; i++) {
      var calValue = this.calculatedValues[i];
      if (
        calValue.includeIntoResult &&
        !!calValue.name &&
        this.getVariable(calValue.name) !== undefined
      ) {
        result[calValue.name] = this.getVariable(calValue.name);
      }
    }
  }
  getAllValues(): any {
    return this.data;
  }
  /**
   * Returns survey results as an array of objects in which the question name, title, value, and other parameters are stored as individual properties.
   *
   * If a question can have more than one value (Matrix, Multiple Text), its object enables the `isNode` flag and stores information about these values in the `data` property. Refer to the following help topic for more information: [Access Full Survey Results](https://surveyjs.io/form-library/documentation/handle-survey-results-access#access-full-survey-results).
   *
   * If you want to skip empty answers, pass an object with the `includeEmpty` property set to `false`.
   */
  public getPlainData(options?: IPlainDataOptions): Array<IQuestionPlainData> {
    if (!options) {
      options = { includeEmpty: true, includeQuestionTypes: false, includeValues: false };
    }
    const result: Array<IQuestionPlainData> = [];
    const questionValueNames: Array<string> = [];
    this.getAllQuestions().forEach((question) => {
      var resultItem = (<Question>question).getPlainData(options);
      if (!!resultItem) {
        result.push(resultItem);
        questionValueNames.push(question.valueName || question.name);
      }
    });
    if (!!options.includeValues) {
      const keys = this.getValuesKeys();
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (questionValueNames.indexOf(key) == -1) {
          var dataValue = this.getDataValueCore(this.valuesHash, key);
          if (!!dataValue) {
            result.push({
              name: key,
              title: key,
              value: dataValue,
              displayValue: dataValue,
              isNode: false,
              getString: (val: any) =>
                typeof val === "object" ? JSON.stringify(val) : val,
            });
          }
        }
      }
    }
    return result;
  }
  getFilteredValues(): any {
    const values: { [index: string]: any } = {};
    for (var key in this.variablesHash) values[key] = this.variablesHash[key];
    this.addCalculatedValuesIntoFilteredValues(values);
    if(!this.isDesignMode) {
      const keys = this.getValuesKeys();
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        values[key] = this.getDataValueCore(this.valuesHash, key);
      }
      this.getAllQuestions().forEach(q => {
        if (q.hasFilteredValue) {
          values[q.getFilteredName()] = q.getFilteredValue();
        }
      });
    }
    return values;
  }
  private addCalculatedValuesIntoFilteredValues(values: {
    [index: string]: any,
  }) {
    var caclValues = this.calculatedValues;
    for (var i = 0; i < caclValues.length; i++)
      values[caclValues[i].name] = caclValues[i].value;
  }
  getFilteredProperties(): any {
    return { survey: this };
  }
  private getValuesKeys(): Array<string> {
    if (!this.editingObj) return Object.keys(this.valuesHash);
    var props = Serializer.getPropertiesByObj(this.editingObj);
    var res = [];
    for (var i = 0; i < props.length; i++) {
      res.push(props[i].name);
    }
    return res;
  }
  public getDataValueCore(valuesHash: any, key: string): any {
    if (!!this.editingObj)
      return Serializer.getObjPropertyValue(this.editingObj, key);
    return this.getDataFromValueHash(valuesHash, key);
  }
  public setDataValueCore(valuesHash: any, key: string, value: any) {
    if (!!this.editingObj) {
      Serializer.setObjPropertyValue(this.editingObj, key, value);
    } else {
      this.setDataToValueHash(valuesHash, key, value);
    }
  }
  public deleteDataValueCore(valuesHash: any, key: string) {
    if (!!this.editingObj) {
      (<any>this.editingObj)[key] = null;
    } else {
      this.deleteDataFromValueHash(valuesHash, key);
    }
  }
  valueHashGetDataCallback: (valuesHash: any, key: string) => any;
  valueHashSetDataCallback: (valuesHash: any, key: string, value: any) => void;
  valueHashDeleteDataCallback: (valuesHash: any, key: string) => void;
  private getDataFromValueHash(valuesHash: any, key: string): any {
    if (!!this.valueHashGetDataCallback) return this.valueHashGetDataCallback(valuesHash, key);
    return valuesHash[key];
  }
  private setDataToValueHash(valuesHash: any, key: string, value: any): void {
    if (!!this.valueHashSetDataCallback) {
      this.valueHashSetDataCallback(valuesHash, key, value);
    } else {
      valuesHash[key] = value;
    }
  }
  private deleteDataFromValueHash(valuesHash: any, key: string): void {
    if (!!this.valueHashDeleteDataCallback) {
      this.valueHashDeleteDataCallback(valuesHash, key);
    } else {
      delete valuesHash[key];
    }
  }
  /**
   * An object with all comment values.
   * @see Question.showCommentArea
   * @see storeOthersAsComment
   */
  public get comments(): any {
    var result: { [index: string]: any } = {};
    var keys = this.getValuesKeys();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.indexOf(this.commentSuffix) > 0) {
        result[key] = this.getDataValueCore(this.valuesHash, key);
      }
    }
    return result;
  }
  /**
   * Returns an array of visible pages without the start page.
   *
   * To get an array of all pages, use the [`pages`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#pages) property. If all pages are visible, the `pages` and `visiblePages` arrays are identical.
   * @see [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-visibility)
   */
  public get visiblePages(): Array<PageModel> {
    if (this.isDesignMode) return this.pages;
    if(!!this.pageContainerValue && (this.isShowingPreview || this.isSinglePage)) return [this.pageContainerValue];
    var result = new Array<PageModel>();
    for (var i = 0; i < this.pages.length; i++) {
      if (this.isPageInVisibleList(this.pages[i])) {
        result.push(this.pages[i]);
      }
    }
    return result;
  }
  private isPageInVisibleList(page: PageModel): boolean {
    return this.isDesignMode || page.isVisible && !page.isStartPage;
  }
  /**
   * Returns `true` if the survey contains zero pages.
   * @see emptySurveyText
   */
  public get isEmpty(): boolean {
    return this.pages.length == 0;
  }
  get PageCount(): number {
    return this.pageCount;
  }
  /**
   * Returns a total number of survey pages.
   *
   * To get the number of visible pages, use the [`visiblePageCount`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#visiblePageCount) property.
   * @see pages
   */
  public get pageCount(): number {
    return this.pages.length;
  }
  /**
   * Returns the number of visible survey pages.
   *
   * To get a total number of survey pages, use the [`pageCount`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#pageCount) property.
   * @see visiblePages
   * @see [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-visibility)
   */
  public get visiblePageCount(): number {
    return this.visiblePages.length;
  }
  /**
   * Returns the start page. Applies only if the [`firstPageIsStartPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#firstPageIsStartPage) property is set to `true`.
   *
   * Refer to the following help topic for more information: [Start Page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#start-page).
   * @see firstPageIsStartPage
   * @see activePage
   */
  public get startPage(): PageModel {
    var page =
      this.firstPageIsStartPage && this.pages.length > 1 ? this.pages[0] : null;
    if (!!page) {
      page.onFirstRendering();
      page.setWasShown(true);
    }
    return page;
  }
  /**
   * @deprecated Use the [`startPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#startPage) property instead.
   */
  public get startedPage(): PageModel { return this.startPage; }
  /**
   * Gets or sets the current page.
   *
   * If you want to change the current page, set this property to a `PageModel` object. You can get this object in different ways. For example, you can call the [`getPageByName()`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#getPageByName) method to obtain a `PageModel` object with a specific name:
   *
   * ```js
   * survey.currentPage = survey.getPageByName("my-page-name");
   * ```
   *
   * Alternatively, you can change the current page if you set the [`currentPageNo`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#currentPageNo) property to the index of the required page.
   *
   * The `currentPage` property does not return the start page even if it is current. Use the [`activePage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#activePage) property instead if your survey contains a start page.
   */
  public get currentPage(): any {
    return this.getPropertyValue("currentPage", null);
  }
  public set currentPage(value: any) {
    if (this.isLoadingFromJson) return;
    var newPage = this.getPageByObject(value);
    if (!!value && !newPage) return;
    if (!newPage && this.isCurrentPageAvailable) return;
    var vPages = this.visiblePages;
    if (newPage != null && vPages.indexOf(newPage) < 0) return;
    if (newPage == this.currentPage) return;
    var oldValue = this.currentPage;
    if (!this.isShowingPreview && !this.currentSingleQuestion && !this.currentPageChanging(newPage, oldValue)) return;
    this.setPropertyValue("currentPage", newPage);
    if (!!newPage) {
      newPage.onFirstRendering();
      newPage.updateCustomWidgets();
      newPage.setWasShown(true);
    }
    this.locStrsChanged();
    if (!this.isShowingPreview) {
      this.currentPageChanged(newPage, oldValue);
    }
  }
  public tryNavigateToPage(page: PageModel/*, serverValidationRes?: (res: boolean)=> void*/): boolean {
    if(!this.performValidationOnPageChanging(page)) return false;
    const index = this.visiblePages.indexOf(page);
    const res = index < this.currentPageNo || !this.doServerValidation(false, false, page);
    if(res) {
      this.currentPage = page;
    }
    return res;
  }
  private performValidationOnPageChanging(page: PageModel): boolean {
    if (this.isDesignMode) return false;
    if(this.canGoTroughValidation()) return true;
    const index = this.visiblePages.indexOf(page);
    if (index < 0 || index >= this.visiblePageCount) return false;
    if (index === this.currentPageNo) return false;
    if (index < this.currentPageNo || this.checkErrorsMode === "onComplete" || this.validationAllowSwitchPages)
      return true;
    if(!this.validateCurrentPage()) return false;
    for (let i = this.currentPageNo + 1; i < index; i++) {
      const page = this.visiblePages[i];
      if (!page.validate(true, true)) return false;
      page.passed = true;
    }
    return true;
  }

  private updateCurrentPage(): void {
    if (this.isCurrentPageAvailable) return;
    this.currentPage = this.firstVisiblePage;
  }
  private get isCurrentPageAvailable(): boolean {
    const page = this.currentPage;
    return !!page && this.isPageInVisibleList(page) && this.isPageExistsInSurvey(page);
  }
  private isPageExistsInSurvey(page: PageModel): boolean {
    if (this.pages.indexOf(page) > -1) return true;
    return !!this.onContainsPageCallback && this.onContainsPageCallback(page);
  }
  /**
   * Returns [`startPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#startPage) if the survey currently displays a start page; otherwise, returns [`currentPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#currentPage).
   * @see startPage
   * @see currentPage
   * @see firstPageIsStartPage
   */
  public get activePage(): any {
    return this.getPropertyValue("activePage");
  }
  /**
   * A Boolean value that indicates whether the [start page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#start-page) is currently displayed.
   */
  public get isStartPageActive(): boolean {
    return this.state === "starting";
  }
  /**
   * @deprecated Use the [`isStartPageActive`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#isStartPageActive) property instead.
   */
  public get isShowStartingPage(): boolean {
    return this.isStartPageActive;
  }
  /**
   * Specifies which part of a matrix row responds to a drag gesture in [Dynamic Matrix](https://surveyjs.io/form-library/examples/questiontype-matrixdynamic/) questions.
   *
   * Possible values:
   *
   * - `"entireItem"` (default) - Users can use the entire matrix row as a drag handle.
   * - `"icon"` - Users can only use a drag icon as a drag handle.
   */
  public get matrixDragHandleArea(): string {
    return this.getPropertyValue("matrixDragHandleArea", "entireItem");
  }
  public set matrixDragHandleArea(val: string) {
    this.setPropertyValue("matrixDragHandleArea", val);
  }
  public get isShowingPage(): boolean {
    return this.state == "running" || this.state == "preview" || this.isStartPageActive;
  }
  private updateActivePage(): void {
    const newPage = this.isStartPageActive ? this.startPage : this.currentPage;
    if (newPage !== this.activePage) {
      this.setPropertyValue("activePage", newPage);
    }
  }
  private onStateAndCurrentPageChanged(): void {
    this.updateActivePage();
    this.updateButtonsVisibility();
  }
  private getPageByObject(value: any): PageModel {
    if (!value) return null;
    if (value.getType && value.getType() == "page") return value;
    if (typeof value === "string" || value instanceof String)
      return this.getPageByName(String(value));
    if (!isNaN(value)) {
      var index = Number(value);
      var vPages = this.visiblePages;
      if (value < 0 || value >= vPages.length) return null;
      return vPages[index];
    }
    return value;
  }
  /**
   * A zero-based index of the current page in the [`visiblePages`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#visiblePages) array.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-editprevious/ (linkStyle))
   * @see visiblePages
   */
  public get currentPageNo(): number {
    return this.visiblePages.indexOf(this.currentPage);
  }
  public set currentPageNo(value: number) {
    var vPages = this.visiblePages;
    if (value < 0 || value >= vPages.length) return;
    this.currentPage = vPages[value];
  }
  /**
   * Specifies the sort order of questions in the survey.
   *
   * Possible values:
   *
   * - `"initial"` (default) - Preserves the original order of questions.
   * - `"random"` - Displays questions in random order.
   *
   * You can override this property for individual pages and panels.
   * @see PageModel.questionOrder
   * @see PanelModel.questionOrder
   */
  public get questionOrder(): string {
    return this.getPropertyValue("questionOrder");
  }
  public set questionOrder(val: string) {
    this.setPropertyValue("questionOrder", val);
  }
  /**
   * @deprecated Use the [`questionOrder`](#questionOrder) property instead.
   */
  public get questionsOrder(): string { return this.questionOrder; }
  public set questionsOrder(val: string) { this.questionOrder = val; }
  /**
   * Focuses the first question on the current page.
   * @see focusQuestion
   * @see autoFocusFirstQuestion
   */
  public focusFirstQuestion() {
    if (this.focusingQuestionInfo) return;
    var page = this.activePage;
    if (page) {
      page.scrollToTop();
      page.focusFirstQuestion();
    }
  }
  scrollToTopOnPageChange(doScroll: boolean = true): void {
    var page = this.activePage;
    if (!page) return;
    if (doScroll) {
      page.scrollToTop();
    }
    if (this.isCurrentPageRendering && this.autoFocusFirstQuestion && !this.focusingQuestionInfo) {
      page.focusFirstQuestion();
      this.isCurrentPageRendering = false;
    }
  }
  /**
   * Returns the current survey state.
   *
   * Possible values:
   *
   * - `"loading"` - The survey is being loaded from a JSON schema.
   * - `"empty"` - The survey has no elements to display.
   * - `"starting"` - The survey displays a [start page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#start-page).
   * - `"running"` - A respondent is taking the survey.
   * - `"preview"` - A respondent is [previewing](https://surveyjs.io/form-library/examples/survey-showpreview/) answers before submitting them.
   * - `"completed"` - A respondent has completed the survey and submitted the results.
   */
  public get state(): string {
    return this.getPropertyValue("state", "empty");
  }
  private updateState(): void {
    this.setPropertyValue("state", this.calcState());
  }
  private calcState(): string {
    if (this.isLoading) return "loading";
    if (this.isCompleted) return "completed";
    if (this.isCompletedBefore) return "completedbefore";
    if (
      !this.isDesignMode &&
      this.isEditMode &&
      this.isStartedState &&
      this.startPage
    )
      return "starting";
    if (this.isShowingPreview) return this.currentPage ? "preview" : "empty";
    return this.currentPage ? "running" : "empty";
  }
  private get isCompleted(): boolean {
    return this.getPropertyValue("isCompleted", false);
  }
  private set isCompleted(val: boolean) {
    this.setPropertyValue("isCompleted", val);
  }
  private get isShowingPreview(): boolean {
    return this.getPropertyValue("isShowingPreview", false);
  }
  private set isShowingPreview(val: boolean) {
    if (this.isShowingPreview == val) return;
    this.setPropertyValue("isShowingPreview", val);
    this.onShowingPreviewChanged();
  }
  private get isStartedState(): boolean {
    return this.getPropertyValue("isStartedState", false);
  }
  private set isStartedState(val: boolean) {
    this.setPropertyValue("isStartedState", val);
  }
  private get isCompletedBefore(): boolean {
    return this.getPropertyValue("isCompletedBefore", false);
  }
  private set isCompletedBefore(val: boolean) {
    this.setPropertyValue("isCompletedBefore", val);
  }
  private get isLoading(): boolean {
    return this.getPropertyValue("isLoading", false);
  }
  private set isLoading(val: boolean) {
    this.setPropertyValue("isLoading", val);
  }
  /**
   * Displays the [Loading page](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#loadingHtml).
   * @see endLoading
   */
  public beginLoading(): void {
    this.isLoading = true;
  }
  /**
   * Stops displaying the [Loading page](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#loadingHtml).
   * @see beginLoading
   */
  public endLoading(): void {
    this.isLoading = false;
  }
  public get completedState(): string {
    return this.getPropertyValue("completedState", "");
  }
  get completedStateText(): string {
    return this.getPropertyValue("completedStateText", "");
  }
  protected setCompletedState(value: string, text: string): void {
    this.setPropertyValue("completedState", value);
    if (!text) {
      if (value == "saving") text = this.getLocalizationString("savingData");
      if (value == "error") text = this.getLocalizationString("savingDataError");
      if (value == "success") text = this.getLocalizationString("savingDataSuccess");
    }
    this.setPropertyValue("completedStateText", text);
    if (this.state === "completed" && this.showCompletePage && !!this.completedState) {
      this.notify(this.completedStateText, this.completedState, value === "error");
    }
  }
  /**
   * Displays a toast notification with a specified message.
   *
   * Depending on the `type` argument, a survey can display the following notification types:
   *
   * ![Toast notification types in SurveyJS Form Library](https://surveyjs.io//Content/Images/docs/notification-types.png)
   * @param message A message to display.
   * @param type A notification type: `"info"` (default), `"success"`, or `"error"`.
   * @param showActions For internal use.
   */
  public notify(message: string, type: string, showActions: boolean = false): void {
    this.notifier.showActions = showActions;
    this.notifier.notify(message, type, showActions);
  }
  /**
   * Resets the survey [`state`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#state) and, optionally, [`data`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#data). If `state` is `"completed"`, it becomes `"running"`.
   * @param clearData *(Optional)* Specifies whether to clear survey data. Default value: `true`.
   * @param goToFirstPage *(Optional)* Specifies whether to switch the survey to the first page. Default value: `true`.
   */
  public clear(clearData: boolean = true, goToFirstPage: boolean = true): void {
    this.isCompleted = false;
    this.isCompletedBefore = false;
    this.isLoading = false;
    this.completedByTriggers = undefined;
    if (clearData) {
      this.setDataCore(null, true);
    }
    this.timerModel.spent = 0;
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].timeSpent = 0;
      this.pages[i].setWasShown(false);
      this.pages[i].passed = false;
    }
    this.onFirstPageIsStartedChanged();
    if (goToFirstPage) {
      this.currentPage = this.firstVisiblePage;
      if(this.currentSingleQuestion) {
        const questions = this.getSingleQuestions();
        this.currentSingleQuestion = questions.length > 0 ? questions[0] : undefined;
      }
    }
    if (clearData) {
      this.updateValuesWithDefaults();
    }
  }
  public mergeValues(src: any, dest: any): void {
    mergeValues(src, dest);
  }
  private updateValuesWithDefaults(): void {
    if (this.isDesignMode || this.isLoading) return;
    for (var i = 0; i < this.pages.length; i++) {
      var questions = this.pages[i].questions;
      for (var j = 0; j < questions.length; j++) {
        questions[j].updateValueWithDefaults();
      }
    }
  }
  protected updateCustomWidgets(page: PageModel): void {
    if (!page) return;
    page.updateCustomWidgets();
  }
  protected currentPageChanging(newValue: PageModel, oldValue: PageModel, newQuestion?: Question, oldQuestion?: Question): boolean {
    const options = this.createPageChangeEventOptions(newValue, oldValue, newQuestion, oldQuestion);
    return this.currentPageChangingFromOptions(options);
  }
  private currentPageChangingFromOptions(options: any): boolean {
    options.allow = true;
    options.allowChanging = true;
    this.onCurrentPageChanging.fire(this, options);
    const allow = options.allowChanging && options.allow;
    if (allow && options.newCurrentPage !== options.oldCurrentPage) {
      this.isCurrentPageRendering = true;
    }
    return allow;
  }
  protected currentPageChanged(newValue: PageModel, oldValue: PageModel): void {
    this.notifyQuestionsOnHidingContent(oldValue);
    if (oldValue && !oldValue.isDisposed && !oldValue.passed) {
      if (oldValue.validate(false)) {
        oldValue.passed = true;
      }
    }
    if (this.isCurrentPageRendered === true) {
      this.isCurrentPageRendered = false;
    }
    if(!this.currentSingleQuestion) {
      const options = this.createPageChangeEventOptions(newValue, oldValue);
      this.onCurrentPageChanged.fire(this, options);
    }
  }
  private notifyQuestionsOnHidingContent(page: PageModel): void {
    if (page && !page.isDisposed) {
      page.questions.forEach(q => q.onHidingContent());
    }
  }
  private createPageChangeEventOptions(newValue: PageModel, oldValue: PageModel, newQuestion?: Question, oldQuestion?: Question): CurrentPageChangedEvent {
    const diff = !!newValue && !!oldValue ? newValue.visibleIndex - oldValue.visibleIndex : 0;
    let qDiff = diff;
    if (qDiff === 0 && !!oldQuestion && !!newQuestion) {
      qDiff = newValue.elements.indexOf(newQuestion) - newValue.elements.indexOf(oldQuestion);
    }
    return {
      oldCurrentQuestion: oldQuestion,
      newCurrentQuestion: newQuestion,
      oldCurrentPage: oldValue,
      newCurrentPage: newValue,
      isNextPage: diff === 1,
      isPrevPage: diff === -1,
      isGoingForward: qDiff > 0,
      isGoingBackward: qDiff < 0,
      isAfterPreview: this.changeCurrentPageFromPreview === true
    };
  }
  public getProgress(): number {
    if (this.currentPage == null) return 0;
    if (this.progressBarType !== "pages") {
      var info = this.getProgressInfo();
      if (this.progressBarType === "requiredQuestions") {
        return info.requiredQuestionCount >= 1
          ? Math.ceil(
            (info.requiredAnsweredQuestionCount * 100) /
            info.requiredQuestionCount
          )
          : 100;
      }
      return info.questionCount >= 1
        ? Math.ceil((info.answeredQuestionCount * 100) / info.questionCount)
        : 100;
    }
    const visPages = this.visiblePages;
    var index = visPages.indexOf(this.currentPage);
    return Math.ceil((index * 100) / visPages.length);
  }
  public get isNavigationButtonsShowing(): string {
    if (this.isDesignMode) return "none";
    var page = this.activePage;
    if (!page) return "none";
    if (page.navigationButtonsVisibility === "hide") {
      return "none";
    }
    if (page.navigationButtonsVisibility === "show") {
      return !this.showNavigationButtons ? "bottom" : this.navigationButtonsLocation;
    }
    return !this.showNavigationButtons ? "none" : this.navigationButtonsLocation;
  }
  public get isNavigationButtonsShowingOnTop(): boolean {
    return this.getIsNavigationButtonsShowingOn("top");
  }
  public get isNavigationButtonsShowingOnBottom(): boolean {
    return this.getIsNavigationButtonsShowingOn("bottom");
  }
  private getIsNavigationButtonsShowingOn(buttonPosition: string): boolean {
    var res = this.isNavigationButtonsShowing;
    return res == "both" || res == "topBottom" || res == buttonPosition;
  }
  public get isEditMode(): boolean {
    return !this.readOnly;
  }
  public get isDisplayMode(): boolean { //
    return this.readOnly && !this.isDesignMode || this.state == "preview";
  }
  public get isUpdateValueTextOnTyping(): boolean {
    return this.textUpdateMode == "onTyping";
  }
  /**
   * Indicates whether the survey is being designed in [Survey Creator](https://surveyjs.io/survey-creator/documentation/overview).
   */
  public get isDesignMode(): boolean {
    return this._isDesignMode;
  }
  private _isDesignMode: boolean = false;
  public setDesignMode(value: boolean): void {
    if (!!this._isDesignMode != !!value) {
      this._isDesignMode = !!value;
      this.onQuestionsOnPageModeChanged("standard");
    }
  }
  /**
   * Specifies whether to show all survey elements, regardless of their visibility.
   *
   * Default value: `false`
   */
  public get showInvisibleElements(): boolean {
    return this.getPropertyValue("showInvisibleElements", false);
  }
  public set showInvisibleElements(val: boolean) {
    var visPages = this.visiblePages;
    this.setPropertyValue("showInvisibleElements", val);
    if (this.isLoadingFromJson) return;
    this.runConditions();
    this.updateAllElementsVisibility(visPages);
  }
  private updateAllElementsVisibility(visPages: Array<PageModel>) {
    for (var i = 0; i < this.pages.length; i++) {
      var page = this.pages[i];
      page.updateElementVisibility();
      if (visPages.indexOf(page) > -1 != page.isVisible) {
        this.onPageVisibleChanged.fire(this, {
          page: page,
          visible: page.isVisible,
        });
      }
    }
  }
  public get areInvisibleElementsShowing(): boolean {
    return this.isDesignMode || this.showInvisibleElements;
  }
  public get areEmptyElementsHidden(): boolean {
    return (
      this.isShowingPreview &&
      this.showPreviewBeforeComplete && this.previewMode == "answeredQuestions" && this.isAnyQuestionAnswered
    );
  }
  private get isAnyQuestionAnswered(): boolean {
    const questions = this.getAllQuestions(true);
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].isEmpty()) return true;
    }
    return false;
  }
  /**
   * Indicates whether the browser has a cookie with a specified [`cookieName`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#cookieName). If this property's value is `true`, the respondent has passed the survey previously.
   * @see setCookie
   * @see deleteCookie
   */
  public get hasCookie(): boolean {
    if (!this.cookieName) return false;
    var cookies = DomDocumentHelper.getCookie();
    return cookies && cookies.indexOf(this.cookieName + "=true") > -1;
  }
  /**
   * Sets a cookie with a specified [`cookieName`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#cookieName) in the browser. If the `cookieName` property value is defined, this method is automatically called on survey completion.
   * @see hasCookie
   * @see deleteCookie
   */
  public setCookie() {
    if (!this.cookieName) return;
    DomDocumentHelper.setCookie(this.cookieName + "=true; expires=Fri, 31 Dec 9999 0:0:0 GMT");
  }
  /**
   * Deletes a cookie with a specified [`cookieName`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#cookieName) from the browser.
   * @see hasCookie
   * @see setCookie
   */
  public deleteCookie() {
    if (!this.cookieName) return;
    DomDocumentHelper.setCookie(this.cookieName + "=;");
  }
  /**
   * @deprecated Use the [`validationEnabled`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#validationEnabled) property instead.
   */
  public get ignoreValidation(): boolean { return !this.validationEnabled; }
  public set ignoreValidation(val: boolean) { this.validationEnabled = !val; }
  /**
   * Specifies whether data validation is enabled.
   *
   * Default value: `true`
   * @see checkErrorsMode
   * @see hideRequiredErrors
   */
  @property({ defaultValue: true }) validationEnabled: boolean;
  /**
   * Specifies whether respondents can switch the current page even if it contains validation errors.
   *
   * Default value: `false`
   * @see checkErrorsMode
   */
  public validationAllowSwitchPages: boolean = false;
  /**
   * Specifies whether respondents can end a survey with validation errors.
   *
   * Default value: `false`
   * @see checkErrorsMode
   */
  public validationAllowComplete: boolean = false;
  /**
   * Switches the survey to the next page.
   *
   * This method returns a Boolean value that indicates whether the page was successfully switched. `false` is returned if the current page is the last page or if it contains validation errors.
   * @returns `true` if the page was successfully switched; `false` otherwise.
   * @see isLastPage
   * @see prevPage
   * @see completeLastPage
   */
  public nextPage(): boolean {
    if(this.currentSingleQuestion) return this.performNext();
    if (this.isLastPage) return false;
    return this.doCurrentPageComplete(false);
  }
  public performNext(): boolean {
    const q = this.currentSingleQuestion;
    if(!q) return this.nextPage();
    if(this.isSingleVisibleInput) {
      if(!q.validateSingleInput()) return false;
      if(q.nextSingleInput()) {
        this.updateButtonsVisibility();
        return true;
      }
    }
    if(!q.validate(true)) return false;
    const questions = this.getSingleQuestions();
    const index = questions.indexOf(q);
    if(index < 0 || index === questions.length - 1) return false;
    const key: any = {};
    key[q.name] = q.value;
    this.checkTriggers(key, false, false, true, q.name);
    this.currentSingleQuestion = questions[index + 1];
    return true;
  }
  public performPrevious(): boolean {
    const q = this.currentSingleQuestion;
    if(!q) return this.prevPage();
    if(this.isSingleVisibleInput) {
      if(q.prevSingleInput()) {
        this.updateButtonsVisibility();
        return true;
      }
    }
    const questions = this.getSingleQuestions();
    const index = questions.indexOf(q);
    if(index === 0) return false;
    this.currentSingleQuestion = questions[index - 1];
    return true;
  }
  private hasErrorsOnNavigate(doComplete: boolean): boolean {
    if (this.canGoTroughValidation()) return false;
    const skipValidation = doComplete && this.validationAllowComplete || !doComplete && this.validationAllowSwitchPages;
    const func = (hasErrors: boolean) => {
      if (!hasErrors || skipValidation) {
        this.doCurrentPageCompleteCore(doComplete);
      }
    };
    if (this.isValidateOnComplete) {
      if (!this.isLastPage) return false;
      return this.validate(true, this.autoFocusFirstError, func, true) !== true && !skipValidation;
    }
    return this.validateCurrentPage(func) !== true && !skipValidation;
  }
  private canGoTroughValidation(): boolean { return !this.isEditMode || !this.validationEnabled; }
  private asyncValidationQuesitons: Array<Question>;
  private checkForAsyncQuestionValidation(
    questions: Array<Question>,
    func: (hasErrors: boolean) => void
  ): boolean {
    this.clearAsyncValidationQuesitons();
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].isRunningValidators) {
        let q = questions[i];
        q.onCompletedAsyncValidators = (hasErrors: boolean) => {
          this.onCompletedAsyncQuestionValidators(q, func, hasErrors);
        };
        this.asyncValidationQuesitons.push(questions[i]);
      }
    }
    return this.asyncValidationQuesitons.length > 0;
  }
  private clearAsyncValidationQuesitons() {
    if (!!this.asyncValidationQuesitons) {
      var asynQuestions = this.asyncValidationQuesitons;
      for (var i = 0; i < asynQuestions.length; i++) {
        asynQuestions[i].onCompletedAsyncValidators = null;
      }
    }
    this.asyncValidationQuesitons = [];
  }
  private onCompletedAsyncQuestionValidators(
    question: Question,
    func: (hasErrors: boolean) => void,
    hasErrors: boolean
  ) {
    if (hasErrors) {
      this.clearAsyncValidationQuesitons();
      func(true);
      if (this.autoFocusFirstError && !!question && !!question.page && question.page === this.currentPage) {
        const questions: Array<Question> = this.currentPage.questions;
        for (let i = 0; i < questions.length; i++) {
          if (questions[i] !== question && questions[i].errors.length > 0) return;
        }
        question.focus(true);
      }
      return;
    }
    var asynQuestions = this.asyncValidationQuesitons;
    for (var i = 0; i < asynQuestions.length; i++) {
      if (asynQuestions[i].isRunningValidators) return;
    }
    func(false);
  }
  public get isCurrentPageHasErrors(): boolean {
    return this.checkIsCurrentPageHasErrors();
  }
  /**
   * Returns `true` if the current page does not contain errors.
   * @see currentPage
   */
  public get isCurrentPageValid(): boolean {
    return !this.checkIsCurrentPageHasErrors();
  }
  public hasCurrentPageErrors(
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    return this.hasPageErrors(undefined, onAsyncValidation);
  }
  /**
   * Validates all questions on the current page and returns `false` if the validation fails.
   *
   * If you use validation expressions and at least one of them calls an async function, the `validateCurrentPage` method returns `undefined`. In this case, you should pass a callback function as the `onAsyncValidation` parameter. The function's `hasErrors` Boolean parameter will contain the validation result.
   * @param onAsyncValidation *(Optional)* Pass a callback function. It accepts a Boolean `hasErrors` parameter that equals `true` if the validation fails or `false` otherwise.
   * @see currentPage
   * @see validate
   * @see validateCurrentPage
   */
  public validateCurrentPage(
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    return this.validatePage(undefined, onAsyncValidation);
  }
  public hasPageErrors(
    page?: PageModel,
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    const res = this.validatePage(page, onAsyncValidation);
    if (res === undefined) return res;
    return !res;
  }
  /**
   * Validates all questions on a specified page and returns `false` if the validation fails.
   *
   * If you use validation expressions and at least one of them calls an async function, the `validatePage` method returns `undefined`. In this case, you should pass a callback function as the `onAsyncValidation` parameter. The function's `hasErrors` Boolean parameter will contain the validation result.
   * @param page Pass the `PageModel` that you want to validate. You can pass `undefined` to validate the [`activePage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#activePage).
   * @param onAsyncValidation *(Optional)* Pass a callback function. It accepts a Boolean `hasErrors` parameter that equals `true` if the validation fails or `false` otherwise.
   * @see validate
   * @see validateCurrentPage
   */
  public validatePage(
    page?: PageModel,
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    if (!page) {
      page = this.activePage;
    }
    if (!page) return true;
    if (this.checkIsPageHasErrors(page)) return false;
    if (!onAsyncValidation) return true;
    return this.checkForAsyncQuestionValidation(
      page.questions,
      (hasErrors: boolean) => onAsyncValidation(hasErrors)
    )
      ? undefined
      : true;
  }
  public hasErrors(
    fireCallback: boolean = true,
    focusOnFirstError: boolean = false,
    onAsyncValidation?: (hasErrors: boolean) => void
  ): boolean {
    const res = this.validate(fireCallback, focusOnFirstError, onAsyncValidation);
    if (res === undefined) return res;
    return !res;
  }
  /**
   * Validates all questions and returns `false` if the validation fails.
   *
   * If you use validation expressions and at least one of them calls an async function, the `validate` method returns `undefined`. In this case, you should pass a callback function as the `onAsyncValidation` parameter. The function's `hasErrors` Boolean parameter will contain the validation result.
   * @param fireCallback *(Optional)* Pass `false` if you do not want to show validation errors in the UI.
   * @param focusFirstError *(Optional)* Pass `true` if you want to focus the first question with a validation error. The survey will be switched to the page that contains this question if required.
   * @param onAsyncValidation *(Optional)* Pass a callback function. It accepts a Boolean `hasErrors` parameter that equals `true` if the validation fails or `false` otherwise.
   * @see validateCurrentPage
   * @see validatePage
   */
  public validate(
    fireCallback: boolean = true,
    focusFirstError: boolean = false,
    onAsyncValidation?: (hasErrors: boolean) => void,
    changeCurrentPage?: boolean
  ): boolean {
    if (!!onAsyncValidation) {
      fireCallback = true;
    }
    var visPages = this.visiblePages;
    var res = true;
    const rec = { fireCallback: fireCallback, focusOnFirstError: focusFirstError, firstErrorQuestion: <any>null, result: false };
    for (var i = 0; i < visPages.length; i++) {
      if (!visPages[i].validate(fireCallback, focusFirstError, rec)) {
        res = false;
      }
    }
    if (!!rec.firstErrorQuestion && (focusFirstError || changeCurrentPage)) {
      if (focusFirstError) {
        rec.firstErrorQuestion.focus(true);
      } else {
        this.currentPage = rec.firstErrorQuestion.page;
      }
    }
    if (!res || !onAsyncValidation) return res;
    return this.checkForAsyncQuestionValidation(
      this.getAllQuestions(),
      (hasErrors: boolean) => onAsyncValidation(hasErrors)
    )
      ? undefined
      : true;
  }
  public ensureUniqueNames(element: ISurveyElement = null): void {
    if (element == null) {
      for (var i = 0; i < this.pages.length; i++) {
        this.ensureUniqueName(this.pages[i]);
      }
    } else {
      this.ensureUniqueName(element);
    }
  }
  private ensureUniqueName(element: ISurveyElement) {
    if (element.isPage) {
      this.ensureUniquePageName(element);
    }
    if (element.isPanel) {
      this.ensureUniquePanelName(element);
    }
    if (element.isPage || element.isPanel) {
      var elements = (<IPanel>element).elements;
      for (var i = 0; i < elements.length; i++) {
        this.ensureUniqueNames(elements[i]);
      }
    } else {
      this.ensureUniqueQuestionName(element);
    }
  }
  private ensureUniquePageName(element: ISurveyElement) {
    return this.ensureUniqueElementName(
      element,
      (name: string): ISurveyElement => {
        return this.getPageByName(name);
      }
    );
  }
  private ensureUniquePanelName(element: ISurveyElement) {
    return this.ensureUniqueElementName(
      element,
      (name: string): ISurveyElement => {
        return this.getPanelByName(name);
      }
    );
  }
  private ensureUniqueQuestionName(element: ISurveyElement) {
    return this.ensureUniqueElementName(
      element,
      (name: string): ISurveyElement => {
        return this.getQuestionByName(name);
      }
    );
  }
  private ensureUniqueElementName(
    element: ISurveyElement,
    getElementByName: (name: string) => ISurveyElement
  ) {
    var existingElement = getElementByName(element.name);
    if (!existingElement || existingElement == element) return;
    var newName = this.getNewName(element.name);
    while (!!getElementByName(newName)) {
      var newName = this.getNewName(element.name);
    }
    element.name = newName;
  }
  private getNewName(name: string): string {
    var pos = name.length;
    while (pos > 0 && name[pos - 1] >= "0" && name[pos - 1] <= "9") {
      pos--;
    }
    var base = name.substring(0, pos);
    var num = 0;
    if (pos < name.length) {
      num = parseInt(name.substring(pos));
    }
    num++;
    return base + num;
  }
  private checkIsCurrentPageHasErrors(
    isFocuseOnFirstError: boolean = undefined
  ): boolean {
    return this.checkIsPageHasErrors(this.activePage, isFocuseOnFirstError);
  }
  private checkIsPageHasErrors(
    page: PageModel,
    isFocuseOnFirstError: boolean = undefined
  ): boolean {
    if (isFocuseOnFirstError === undefined) {
      isFocuseOnFirstError = this.focusOnFirstError;
    }
    if (!page) return true;
    let res: boolean = false;
    if(this.currentSingleQuestion) {
      res = !this.currentSingleQuestion.validate(true);
    } else {
      res = !page.validate(true, isFocuseOnFirstError);
    }
    this.fireValidatedErrorsOnPage(page);
    return res;
  }
  private fireValidatedErrorsOnPage(page: PageModel) {
    if (this.onValidatePage.isEmpty || !page) return;
    var questionsOnPage = page.questions;
    var questions = new Array<Question>();
    var errors = new Array<SurveyError>();
    for (var i = 0; i < questionsOnPage.length; i++) {
      var q = questionsOnPage[i];
      if (q.errors.length > 0) {
        questions.push(q);
        for (var j = 0; j < q.errors.length; j++) {
          errors.push(q.errors[j]);
        }
      }
    }
    this.onValidatePage.fire(this, {
      questions: questions,
      errors: errors,
      page: page,
    });
  }
  /**
   * Switches the survey to the previous page.
   *
   * This method returns a Boolean value that indicates whether the page was successfully switched. `false` is returned if the current page is the first page.
   * @returns `true` if the page was successfully switched; `false` otherwise.
   * @see isFirstPage
   * @see nextPage
   */
  public prevPage(): boolean {
    if(this.currentSingleQuestion) return this.performPrevious();
    if (this.isFirstPage || this.state === "starting") return false;
    this.resetNavigationButton();

    const skipped = this.skippedPages.find(sp => sp.to == this.currentPage);
    if (skipped) {
      this.currentPage = skipped.from;
      this.skippedPages.splice(this.skippedPages.indexOf(skipped), 1);
    }
    else {
      const vPages = this.visiblePages;
      const index = vPages.indexOf(this.currentPage);
      this.currentPage = vPages[index - 1];
    }
    return true;
  }
  /**
   * Completes the survey if it currently displays the last page and the page contains no validation errors. If both these conditions are met, this method returns `true`; otherwise, `false`.
   *
   * If you want to complete the survey regardless of the current page and validation errors, use the [`doComplete()`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#completeLastPage) event.
   * @see isCurrentPageValid
   * @see nextPage
   */
  public tryComplete(): boolean {
    if (this.isValidateOnComplete) {
      this.cancelPreview();
    }
    let res = this.doCurrentPageComplete(true);
    if (res) {
      this.cancelPreview();
    }
    return res;
  }
  /**
   * @deprecated Use the [`tryComplete`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#tryComplete) method instead.
   */
  public completeLastPage(): boolean {
    return this.tryComplete();
  }
  private isNavigationButtonPressed: boolean = false;
  public navigationMouseDown(): boolean {
    this.isNavigationButtonPressed = true;
    return true;
  }
  private resetNavigationButton() {
    this.isNavigationButtonPressed = false;
  }
  private mouseDownPage: any = null;
  public nextPageUIClick(): boolean {
    if (!!this.mouseDownPage && this.mouseDownPage !== this.activePage) return false;
    this.mouseDownPage = null;
    return this.performNext();
  }
  public nextPageMouseDown(): boolean {
    this.mouseDownPage = this.activePage;
    return this.navigationMouseDown();
  }
  /**
   * Displays a [preview of given answers](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#preview-page). Returns `false` if the preview cannot be displayed because of validation errors.
   * @see cancelPreview
   * @see showPreviewBeforeComplete
   * @see onShowingPreview
   * @see state
   */
  public showPreview(): boolean {
    this.resetNavigationButton();
    if (!this.isValidateOnComplete) {
      if (this.hasErrorsOnNavigate(true)) return false;
      if (this.doServerValidation(true, true)) return false;
    }
    this.showPreviewCore();
    return true;
  }
  private showPreviewCore(): void {
    var options = { allowShowPreview: true, allow: true };
    this.onShowingPreview.fire(this, options);
    this.isShowingPreview = options.allowShowPreview && options.allow;
  }
  /**
   * Cancels a [preview of given answers](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#preview-page) and switches the survey to the page specified by the `currentPage` parameter.
   * @param currentPage A new current page. If you do not specify this parameter, the survey displays the last page.
   * @see showPreview
   * @see showPreviewBeforeComplete
   * @see state
   */
  public cancelPreview(currentPage: any = null): void {
    if (!this.isShowingPreview) return;
    this.gotoPageFromPreview = currentPage;
    this.isShowingPreview = false;
  }
  private gotoPageFromPreview: PageModel;
  public cancelPreviewByPage(panel: IPanel): any {
    this.cancelPreview(<PageModel>panel);
  }
  protected doCurrentPageComplete(doComplete: boolean): boolean {
    if (this.isValidatingOnServer) return false;
    this.resetNavigationButton();
    if (this.hasErrorsOnNavigate(doComplete)) return false;
    return this.doCurrentPageCompleteCore(doComplete);
  }
  private doCurrentPageCompleteCore(doComplete: boolean): boolean {
    if (this.doServerValidation(doComplete)) return false;
    if (doComplete) {
      this.currentPage.passed = true;
      return this.doComplete(this.canBeCompletedByTrigger, this.completedTrigger);
    }
    this.doNextPage();
    return true;
  }
  public get isSinglePage(): boolean {
    return this.questionsOnPageMode == "singlePage";
  }
  public set isSinglePage(val: boolean) {
    this.questionsOnPageMode = val ? "singlePage" : "standard";
  }
  public get isSingleVisibleQuestion(): boolean {
    return !this.isDesignMode && (this.isSingleVisibleQuestionVal(this.questionsOnPageMode) || this.isSingleVisibleInput);
  }
  public get isSingleVisibleInput(): boolean {
    return !this.isDesignMode && this.questionsOnPageMode == "inputPerPage";
  }
  private isSingleVisibleQuestionVal(val: string): boolean {
    return val === "questionPerPage" || val === "questionOnPage";
  }
  /**
   * Specifies how to distribute survey elements between pages.
   *
   * Possible values:
   *
   * - `"singlePage"` - Combines all survey pages into a single page.
   * - `"questionPerPage"` - Displays each question on a separate page.
   * - `"standard"` (default) - Retains the original structure specified in the JSON schema.
   */
  public get questionsOnPageMode(): string {
    return this.getPropertyValue("questionsOnPageMode");
  }
  public set questionsOnPageMode(val: string) {
    this.setPropertyValue("questionsOnPageMode", val);
  }
  /**
   * Gets or sets a Boolean value that specifies whether the first page is a start page.
   *
   * Refer to the following help topic for more information: [Start Page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#start-page).
   * @see startPage
   * @see activePage
   */
  public get firstPageIsStartPage(): boolean {
    return this.getPropertyValue("firstPageIsStartPage");
  }
  public set firstPageIsStartPage(val: boolean) {
    this.setPropertyValue("firstPageIsStartPage", val);
  }
  /**
   * @deprecated Use the [`firstPageIsStartPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#firstPageIsStartPage) property instead.
   */
  public get firstPageIsStarted(): boolean {
    return this.firstPageIsStartPage;
  }
  public set firstPageIsStarted(val: boolean) {
    this.firstPageIsStartPage = val;
  }
  isPageStarted(page: IPage): boolean {
    return (
      this.firstPageIsStartPage && this.pages.length > 1 && this.pages[0] === page
    );
  }
  /**
   * Specifies whether to show a preview of given answers before they are submitted.
   *
   * Default value: `false`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-preview/ (linkStyle))
   * @see previewMode
   * @see showPreview
   * @see cancelPreview
   */
  public get showPreviewBeforeComplete(): boolean | any {
    return this.getPropertyValue("showPreviewBeforeComplete");
  }
  public set showPreviewBeforeComplete(val: boolean | any) {
    this.setShowPreviewBeforeComplete(val);
  }
  public setShowPreviewBeforeComplete(val: boolean | any) {
    if (val === undefined || val === "noPreview" || val === false) {
      this.setPropertyValue("showPreviewBeforeComplete", false);
    } else {
      this.setPropertyValue("showPreviewBeforeComplete", true);
      if (val === "showAllQuestions") this.previewMode = "allQuestions";
      if (val === "showAnsweredQuestions") this.previewMode = "answeredQuestions";
    }
  }
  /**
   * Specifies whether the [preview of given answers](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#preview-page) includes all or only answered questions.
   *
   * Possible values:
   *
   * - `"allQuestions"` (default)
   * - `"answeredQuestions"`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/survey-preview/ (linkStyle))
   */
  public get previewMode(): string {
    return this.getPropertyValue("previewMode");
  }
  public set previewMode(val: string) {
    this.setPropertyValue("previewMode", val);
  }
  protected onFirstPageIsStartedChanged(): void {
    this.isStartedState = this.firstPageIsStartPage && this.pages.length > 1;
    this.pageVisibilityChanged(this.pages[0], !this.isStartedState);
  }
  private runningPages: any;
  private pageContainerValue: PageModel;
  private onShowingPreviewChanged() {
    this.updatePagesContainer();
  }
  private createRootPage(name: string, pages: Array<PageModel>): PageModel {
    const container = Serializer.createClass("page");
    container.name = name;
    container.isPageContainer = true;
    pages.forEach(page => {
      if(!page.isStartPage) {
        container.addElement(page);
      }
    });
    return container;
  }
  private disposeContainerPage(): void {
    let cPage = this.pageContainerValue;
    const elements = [].concat(cPage.elements);
    elements.forEach(el => cPage.removeElement(el));
    cPage.dispose();
    this.pageContainerValue = undefined;
  }
  private updatePagesContainer(): void {
    if (this.isDesignMode) return;
    this.getAllQuestions().forEach(q => q.updateElementVisibility());
    this.setPropertyValue("currentPage", undefined);
    const singleName = "single-page";
    const previewName = "preview-page";
    let rootPage: PageModel = undefined;
    if(this.isSinglePage) {
      const cPage = this.pageContainerValue;
      if(cPage && cPage.name === previewName) {
        rootPage = <PageModel>cPage.elements[0];
        this.disposeContainerPage();
      } else {
        rootPage = this.createRootPage(singleName, this.pages);
      }
    }
    if(this.isShowingPreview) {
      rootPage = this.createRootPage(previewName, rootPage ? [rootPage] : this.pages);
    }
    if(rootPage) {
      rootPage.setSurveyImpl(this);
      this.pageContainerValue = rootPage;
      this.currentPage = rootPage;
    }
    if(!this.isSinglePage && !this.isShowingPreview) {
      this.disposeContainerPage();
      let curPage = this.gotoPageFromPreview;
      this.gotoPageFromPreview = null;
      if (Helpers.isValueEmpty(curPage) && this.visiblePageCount > 0) {
        curPage = this.visiblePages[this.visiblePageCount - 1];
      }
      if (!!curPage) {
        this.changeCurrentPageFromPreview = true;
        this.currentPage = curPage;
        this.changeCurrentPageFromPreview = false;
      }
    }
    if(!this.currentPage && this.visiblePageCount > 0) {
      this.currentPage = this.visiblePages[0];
    }
    this.pages.forEach(page => {
      if(page.hasShown) {
        page.updateElementCss(true);
      }
    });
    this.updateButtonsVisibility();
  }
  private currentSingleQuestionValue: Question;
  private getSingleQuestions(): Array<Question> {
    const res = new Array<Question>();
    const pages = this.pages;
    for (var i: number = 0; i < pages.length; i++) {
      const p = pages[i];
      if(!p.isStartPage && p.isVisible) {
        p.addQuestionsToList(res, true);
      }
    }
    return res;
  }
  public get currentSingleQuestion(): Question { return this.currentSingleQuestionValue; }
  public set currentSingleQuestion(val: Question) {
    const oldVal = this.currentSingleQuestion;
    if(val !== oldVal && !this.isCompleted) {
      const options: any = !!val && !!oldVal ? this.createPageChangeEventOptions(<PageModel>val.page, <PageModel>oldVal.page, val, oldVal) : undefined;
      if(!!options && !this.currentPageChangingFromOptions(options)) return;
      this.currentSingleQuestionValue = val;
      if(!!val) {
        const page = <PageModel>val.page;
        page.updateRows();
        if(page !== this.currentPage) {
          this.currentPage = page;
        } else {
          if(this.autoFocusFirstQuestion) {
            val.focus();
          }
        }
        this.updateButtonsVisibility();
        if(!!options) {
          this.onCurrentPageChanged.fire(this, options);
        }
      } else {
        this.visiblePages.forEach(page => page.updateRows());
      }
    }
  }
  private changeCurrentPageFromPreview: boolean;
  protected onQuestionsOnPageModeChanged(oldValue: string): void {
    if (this.isShowingPreview || this.isDesignMode) return;
    this.currentSingleQuestion = undefined;
    if(oldValue === "singlePage") {
      this.updatePagesContainer();
    }
    if(oldValue === "inputPerPage") {
      this.getAllQuestions().forEach(q => q.resetSingleInput());
    }
    if(this.isSinglePage) {
      this.updatePagesContainer();
    }
    this.setupSingleInputNavigationActions();
    if(this.isSingleVisibleQuestion) {
      const questions = this.getSingleQuestions();
      if(questions.length > 0) {
        this.currentSingleQuestion = questions[0];
      }
    }
  }
  private setupSingleInputNavigationActions(): void {
    const actionAddId = "sv-singleinput-add";
    if(this.isSingleVisibleInput) {
      const addItem = (): void => {
        const q = this.currentSingleQuestion;
        if(q.validateSingleInput()) {
          this.currentSingleQuestion.singleInputAddItem();
        }
      };
      const removeItem = (): void => {
        this.currentSingleQuestion.singleInputRemoveItem();
      };
      this.addNavigationItem({ id: actionAddId, visible: false, action: (): void => addItem() });
    } else {
      this.removeNavigationItem(actionAddId);
    }
  }
  private getPageStartIndex(): number {
    return this.firstPageIsStartPage && this.pages.length > 0 ? 1 : 0;
  }
  /**
   * Indicates whether the [current page](#currentPage) is the first page.
   *
   * > If the survey displays the [start page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#start-page), this property contains `false`. Use the [`isStartPageActive`](#isStartPageActive) property to find out whether the start page is currently displayed.
   */
  public get isFirstPage(): boolean {
    return this.getPropertyValue("isFirstPage");
  }
  /**
   * Indicates whether the [current page](#currentPage) is the last page.
   */
  public get isLastPage(): boolean {
    return this.getPropertyValue("isLastPage");
  }
  public updateNavigationElements(): void {
    this.updateButtonsVisibility();
  }
  private updateButtonsVisibility(): void {
    this.updateIsFirstLastPageState();
    this.setPropertyValue("isShowPrevButton", this.calcIsShowPrevButton());
    this.setPropertyValue("isShowNextButton", this.calcIsShowNextButton());
    this.setPropertyValue("isCompleteButtonVisible", this.calcIsCompleteButtonVisible());
    this.setPropertyValue("isPreviewButtonVisible", this.calcIsPreviewButtonVisible());
    this.setPropertyValue("isCancelPreviewButtonVisible", this.calcIsCancelPreviewButtonVisible());
    this.updateSingleInputActions();
  }
  private updateSingleInputActions() {
    if(!this.isSingleVisibleInput) return;
    const q = this.currentSingleQuestion;
    if(!q) return;
    const addBtn = this.navigationBar.getActionById("sv-singleinput-add");
    if(addBtn) {
      addBtn.title = q.getSingleInputAddText();
      addBtn.visible = !!addBtn.title;
    }
  }
  public get isShowPrevButton(): boolean {
    return this.getPropertyValue("isShowPrevButton");
  }
  public get isShowNextButton(): boolean {
    return this.getPropertyValue("isShowNextButton");
  }
  public get isCompleteButtonVisible(): boolean {
    return this.getPropertyValue("isCompleteButtonVisible");
  }
  public get isPreviewButtonVisible(): boolean {
    return this.getPropertyValue("isPreviewButtonVisible");
  }
  public get isCancelPreviewButtonVisible(): boolean {
    return this.getPropertyValue("isCancelPreviewButtonVisible");
  }
  public get isFirstElement(): boolean | undefined {
    return this.getPropertyValue("isFirstElement");
  }
  public get isLastElement(): boolean | undefined {
    return this.getPropertyValue("isLastElement");
  }
  private updateIsFirstLastPageState() {
    const curPage = this.currentPage;
    this.setPropertyValue("isFirstPage", !!curPage && curPage === this.firstVisiblePage);
    this.setPropertyValue("isLastPage", !!curPage && curPage === this.lastVisiblePage);
    let fVal: boolean | undefined = undefined;
    let lVal: boolean | undefined = undefined;
    const q = this.currentSingleQuestion;
    if(!!q) {
      let isFirstInput = true;
      let isLastInput = true;
      if(this.isSingleVisibleInput) {
        const inputState = q.getSingleInputElementPos();
        if(inputState !== 0) {
          isFirstInput = inputState === -1;
          isLastInput = inputState === 1;
        }
      }
      const questions = this.getSingleQuestions();
      const index = questions.indexOf(q);
      if(index >= 0) {
        fVal = isFirstInput && index === 0;
        lVal = isLastInput && index === questions.length - 1;
      }
    }
    this.setPropertyValue("isFirstElement", fVal);
    this.setPropertyValue("isLastElement", lVal);
  }
  private get isLastPageOrElement(): boolean {
    return this.isLastElement !== undefined ? this.isLastElement : this.isLastPage;
  }
  private get isFirstPageOrElement(): boolean {
    return this.isFirstElement !== undefined ? this.isFirstElement : this.isFirstPage;
  }
  private calcIsShowPrevButton(): boolean {
    if (this.isFirstPageOrElement || !this.showPrevButton || this.state !== "running") return false;
    if(this.isFirstElement !== undefined) return true;
    const page = this.visiblePages[this.currentPageNo - 1];
    return page && page.getMaxTimeToFinish() <= 0;
  }
  private calcIsShowNextButton(): boolean {
    return this.state === "running" && !this.isLastPageOrElement && !this.canBeCompletedByTrigger;
  }
  public calcIsCompleteButtonVisible(): boolean {
    const state = this.state;
    return this.isEditMode && (this.state === "running" &&
      (this.isLastPageOrElement && !this.showPreviewBeforeComplete || this.canBeCompletedByTrigger)
      || state === "preview") && this.showCompleteButton;
  }
  private calcIsPreviewButtonVisible(): boolean {
    return (
      this.isEditMode &&
      this.showPreviewBeforeComplete &&
      this.state == "running" && this.isLastPageOrElement
    );
  }
  private calcIsCancelPreviewButtonVisible(): boolean {
    return (
      this.isEditMode &&
      this.showPreviewBeforeComplete &&
      this.state == "preview"
    );
  }
  private get firstVisiblePage(): PageModel {
    if(this.visiblePageCount === 1) return this.visiblePages[0];
    const pages = this.pages;
    for (let i = 0; i < pages.length; i++) {
      if (this.isPageInVisibleList(pages[i])) return pages[i];
    }
    return null;
  }
  private get lastVisiblePage(): PageModel {
    if(this.visiblePageCount === 1) return this.visiblePages[0];
    const pages = this.pages;
    for (let i = pages.length - 1; i >= 0; i--) {
      if (this.isPageInVisibleList(pages[i])) return pages[i];
    }
    return null;
  }
  /**
   * Completes the survey.
   *
   * When you call this method, Form Library performs the following actions:
   *
   * 1. Saves a cookie if the [`cookieName`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#cookieName) property is set.
   * 1. Switches the survey [`state`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#state) to `"completed"`.
   * 1. Raises the [`onComplete`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onComplete) event.
   * 1. Navigates the user to a URL specified by the [`navigateToUrl`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#navigateToUrl) or [`navigateToUrlOnCondition`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#navigateToUrlOnCondition) property.
   *
   * The `doComplete()` method completes the survey regardless of validation errors and the current page. If you need to ensure that survey results are valid and full, call the [`completeLastPage()`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#completeLastPage) method instead.
   *
   * @param isCompleteOnTrigger For internal use.
   * @param completeTrigger For internal use.
   * @returns `false` if survey completion is cancelled within the [`onCompleting`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onCompleting) event handler; otherwise, `true`.
   */
  public doComplete(isCompleteOnTrigger: boolean = false, completeTrigger?: Trigger): boolean {
    if (this.isCompleted) return;
    if (!this.checkOnCompletingEvent(isCompleteOnTrigger, completeTrigger)) {
      this.isCompleted = false;
      return false;
    }
    this.checkOnPageTriggers(true);
    this.stopTimer();
    this.notifyQuestionsOnHidingContent(this.currentPage);
    this.isCompleted = true;
    this.clearUnusedValues();
    this.saveDataOnComplete(isCompleteOnTrigger, completeTrigger);
    this.setCookie();
    return true;
  }
  private saveDataOnComplete(isCompleteOnTrigger: boolean = false, completeTrigger?: Trigger) {
    let previousCookie = this.hasCookie;
    const showSaveInProgress = (text: string) => {
      savingDataStarted = true;
      this.setCompletedState("saving", text);
    };
    const showSaveError = (text: string) => {
      this.setCompletedState("error", text);
    };
    const showSaveSuccess = (text: string) => {
      this.setCompletedState("success", text);
      this.navigateTo();
    };
    const clearSaveMessages = (text: string) => {
      this.setCompletedState("", "");
    };
    var savingDataStarted = false;
    var onCompleteOptions = {
      isCompleteOnTrigger: isCompleteOnTrigger,
      completeTrigger: completeTrigger,
      showSaveInProgress: showSaveInProgress,
      showSaveError: showSaveError,
      showSaveSuccess: showSaveSuccess,
      clearSaveMessages: clearSaveMessages,
      //Obsolete functions
      showDataSaving: showSaveInProgress,
      showDataSavingError: showSaveError,
      showDataSavingSuccess: showSaveSuccess,
      showDataSavingClear: clearSaveMessages
    };
    this.onComplete.fire(this, onCompleteOptions);
    if (!previousCookie && this.surveyPostId) {
      this.sendResult();
    }
    if (!savingDataStarted) {
      this.navigateTo();
    }
  }
  private checkOnCompletingEvent(isCompleteOnTrigger: boolean, completeTrigger?: Trigger): boolean {
    var options = {
      allowComplete: true,
      allow: true,
      isCompleteOnTrigger: isCompleteOnTrigger,
      completeTrigger: completeTrigger
    };
    this.onCompleting.fire(this, options);
    return options.allowComplete && options.allow;
  }
  /**
   * Starts the survey. Applies only if the survey has a [start page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#start-page).
   * @see firstPageIsStartPage
   * @see completeLastPage
   */
  public start(): boolean {
    if (!this.firstPageIsStartPage) return false;
    this.isCurrentPageRendering = true;
    if (this.checkIsPageHasErrors(this.startPage, true)) return false;
    this.isStartedState = false;
    this.notifyQuestionsOnHidingContent(this.pages[0]);
    this.startTimerFromUI();
    this.onStarted.fire(this, {});
    this.updateVisibleIndexes();
    this.currentPageNo = 0;
    if (!!this.currentPage) {
      this.currentPage.locStrsChanged();
    }
    return true;
  }
  /**
   * Indicates whether the current page is being [validated on a server](#onServerValidateQuestions).
   */
  public get isValidatingOnServer(): boolean {
    return this.getPropertyValue("isValidatingOnServer", false);
  }
  private serverValidationEventCount: number;
  private setIsValidatingOnServer(val: boolean) {
    if (val == this.isValidatingOnServer) return;
    this.setPropertyValue("isValidatingOnServer", val);
    this.onIsValidatingOnServerChanged();
  }
  private createServerValidationOptions(doComplete: boolean, isPreview: boolean, page: PageModel): ServerValidateQuestionsEvent {
    var self = this;
    const options = {
      data: <{ [index: string]: any }>{},
      errors: {},
      survey: this,
      complete: function () {
        self.completeServerValidation(options, isPreview, page);
      },
    };
    if (doComplete && this.isValidateOnComplete) {
      options.data = this.data;
    } else {
      var questions = this.activePage.questions;
      for (var i = 0; i < questions.length; i++) {
        var question = questions[i];
        if (!question.visible) continue;
        var value = this.getValue(question.getValueName());
        if (!this.isValueEmpty(value))
          options.data[question.getValueName()] = value;
      }
    }
    return options;
  }
  protected onIsValidatingOnServerChanged() { }
  protected doServerValidation(doComplete: boolean, isPreview: boolean = false, page?: PageModel): boolean {
    if (
      !this.onServerValidateQuestions ||
      (<EventBase<SurveyModel>>this.onServerValidateQuestions).isEmpty
    )
      return false;
    if (!doComplete && this.isValidateOnComplete) return false;
    this.setIsValidatingOnServer(true);
    const isFunc = typeof this.onServerValidateQuestions === "function";
    this.serverValidationEventCount = !isFunc ? this.onServerValidateQuestions.length : 1;
    if (isFunc) {
      (<Function><any>this.onServerValidateQuestions)(this, this.createServerValidationOptions(doComplete, isPreview, page));
    } else {
      (<EventBase<SurveyModel, ServerValidateQuestionsEvent>>this.onServerValidateQuestions).fireByCreatingOptions(this, () => { return this.createServerValidationOptions(doComplete, isPreview, page); });
    }
    return true;
  }
  private completeServerValidation(options: any, isPreview: boolean, page: PageModel) {
    if (this.serverValidationEventCount > 1) {
      this.serverValidationEventCount--;
      if (!!options && !!options.errors && Object.keys(options.errors).length === 0) return;
    }
    this.serverValidationEventCount = 0;
    this.setIsValidatingOnServer(false);
    if (!options && !options.survey) return;
    var self = options.survey;
    var hasErrors = false;
    if (options.errors) {
      var hasToFocus = this.autoFocusFirstError;
      for (var name in options.errors) {
        var question = self.getQuestionByName(name);
        if (question && question["errors"]) {
          hasErrors = true;
          question.addError(new CustomError(options.errors[name], this));
          if (hasToFocus) {
            hasToFocus = false;
            if (!!question.page) {
              this.currentPage = question.page;
            }
            question.focus(true);
          }
        }
      }
      this.fireValidatedErrorsOnPage(this.currentPage);
    }
    if (!hasErrors) {
      if (isPreview) {
        this.showPreviewCore();
      } else {
        if(page) {
          this.currentPage = page;
        } else {
          if (self.isLastPage) self.doComplete();
          else self.doNextPage();
        }
      }
    }
  }
  protected doNextPage() {
    var curPage = this.currentPage;
    this.checkOnPageTriggers(false);
    if (!this.isCompleted) {
      if (this.partialSendEnabled) {
        this.sendResult(this.surveyPostId, this.clientId, true);
      }
      if (curPage === this.currentPage) {
        var vPages = this.visiblePages;
        var index = vPages.indexOf(this.currentPage);
        this.currentPage = vPages[index + 1];
      }
    } else {
      this.doComplete(true);
    }
  }
  public setCompleted(trigger: Trigger): void {
    this.doComplete(true, trigger);
  }
  canBeCompleted(trigger: Trigger, isCompleted: boolean): void {
    if (!settings.triggers.changeNavigationButtonsOnComplete) return;
    const prevCanBeCompleted = this.canBeCompletedByTrigger;
    if (!this.completedByTriggers) this.completedByTriggers = {};
    if (isCompleted) {
      this.completedByTriggers[trigger.id] = { trigger: trigger, pageId: this.currentPage?.id };
    } else {
      delete this.completedByTriggers[trigger.id];
    }
    if (prevCanBeCompleted !== this.canBeCompletedByTrigger) {
      this.updateButtonsVisibility();
    }
  }
  private completedByTriggers: HashTable<any>;
  private get canBeCompletedByTrigger(): boolean {
    if (!this.completedByTriggers) return false;
    const keys = Object.keys(this.completedByTriggers);
    if (keys.length === 0) return false;
    const id = this.currentPage?.id;
    if (!id) return true;
    for (let i = 0; i < keys.length; i++) {
      if (id === this.completedByTriggers[keys[i]].pageId) return true;
    }
    return false;
  }
  private get completedTrigger(): Trigger {
    if (!this.canBeCompletedByTrigger) return undefined;
    const key = Object.keys(this.completedByTriggers)[0];
    return this.completedByTriggers[key].trigger;
  }
  /**
   * Returns HTML content displayed on the [complete page](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#complete-page).
   *
   * To specify HTML content, use the [`completedHtml`](#completedHtml) property.
   */
  public get processedCompletedHtml(): string {
    var html = this.renderedCompletedHtml;
    return !!html ? this.processHtml(html, "completed") : "";
  }
  /**
   * Returns HTML content displayed to a user who has completed the survey before. To identify such users, the survey uses a [cookie name](#cookieName) or [client ID](#clientId).
   *
   * To specify HTML content, use the [`completedBeforeHtml`](#completedBeforeHtml) property.
   */
  public get processedCompletedBeforeHtml(): string {
    return this.locCompletedBeforeHtml.textOrHtml;
  }
  /**
   * Returns HTML content displayed while a survey JSON schema is [being loaded](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#beginLoading).
   *
   * To specify HTML content, use the [`loadingHtml`](#loadingHtml) property.
   */
  public get processedLoadingHtml(): string {
    return this.locLoadingHtml.textOrHtml;
  }
  public getProgressInfo(): IProgressInfo {
    var pages = this.isDesignMode ? this.pages : this.visiblePages;
    return SurveyElement.getProgressInfoByElements(pages, false);
  }
  /**
   * Returns text displayed by the progress bar (for instance, "Page 2 of 3" or "Answered 3/8 questions"). Handle the [`onGetProgressText`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onGetProgressText) event to change this text.
   * @see progressValue
   * @see showProgressBar
   * @see progressBarType
   */
  public get progressText(): string {
    return this.progressBar.progressText;
  }
  /**
   * Returns a percentage value that indicates user progress in the survey.
   * @see showProgressBar
   * @see progressBarType
   * @see progressText
   */
  public get progressValue(): number {
    return this.getPropertyValue("progressValue", undefined, () => this.getProgress());
  }
  public updateProgressText(onValueChanged: boolean = false): void {
    if (this.isShowingPreview) return;
    if (onValueChanged && this.progressBarType == "pages" && this.onGetProgressText.isEmpty) return;
    if(this.progressBarValue) {
      this.progressBarValue.resetProgressText();
    }
    this.resetPropertyValue("progressValue");
  }
  public getProgressText(): string {
    if (!this.isDesignMode && this.currentPage == null) return "";
    const options: GetProgressTextEvent = {
      questionCount: 0,
      answeredQuestionCount: 0,
      requiredQuestionCount: 0,
      requiredAnsweredQuestionCount: 0,
      text: "",
    };
    var type = this.progressBarType.toLowerCase();
    if (
      type === "questions" ||
      type === "requiredquestions" ||
      type === "correctquestions" ||
      !this.onGetProgressText.isEmpty
    ) {
      var info = this.getProgressInfo();
      options.questionCount = info.questionCount;
      options.answeredQuestionCount = info.answeredQuestionCount;
      options.requiredQuestionCount = info.requiredQuestionCount;
      options.requiredAnsweredQuestionCount =
        info.requiredAnsweredQuestionCount;
    }

    options.text = this.getProgressTextCore(options);
    this.onGetProgressText.fire(this, options);
    return options.text;
  }
  private getProgressTextCore(info: IProgressInfo): string {
    var type = this.progressBarType.toLowerCase();
    if (type === "questions") {
      return this.getLocalizationFormatString("questionsProgressText",
        info.answeredQuestionCount,
        info.questionCount
      );
    }
    if (type === "requiredquestions") {
      return this.getLocalizationFormatString("questionsProgressText",
        info.requiredAnsweredQuestionCount,
        info.requiredQuestionCount
      );
    }
    if (type === "correctquestions") {
      var correctAnswersCount = this.getCorrectedAnswerCount();
      return this.getLocalizationFormatString("questionsProgressText",
        correctAnswersCount,
        info.questionCount
      );
    }
    var vPages = this.isDesignMode ? this.pages : this.visiblePages;
    var index = vPages.indexOf(this.currentPage) + 1;
    return this.getLocalizationFormatString("progressText", index, vPages.length);
  }
  @property() rootCss: string;
  public getRootCss(): string {
    return new CssClassBuilder()
      .append(this.css.root)
      .append(this.css.rootProgress + "--" + this.progressBarType)
      .append(this.css.rootMobile, this.isMobile)
      .append(this.css.rootAnimationDisabled, !settings.animationEnabled)
      .append(this.css.rootReadOnly, this.readOnly && !this.isDesignMode)
      .append(this.css.rootCompact, this.isCompact)
      .append(this.css.rootFitToContainer, this.fitToContainer)
      .toString();
  }
  private isSmoothScrollEnabled = false;
  private resizeObserver: ResizeObserver;
  afterRenderSurvey(htmlElement: any) {
    this.destroyResizeObserver();
    if (Array.isArray(htmlElement)) {
      htmlElement = SurveyElement.GetFirstNonTextElement(htmlElement);
    }
    let observedElement: HTMLElement = htmlElement;
    const cssVariables = this.css.variables;
    if (!!cssVariables) {
      const mobileWidth = Number.parseFloat(DomDocumentHelper.getComputedStyle(observedElement).getPropertyValue(cssVariables.mobileWidth));
      if (!!mobileWidth) {
        let isProcessed = false;
        this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
          DomWindowHelper.requestAnimationFrame((): void | undefined => {
            if (isProcessed || !isContainerVisible(observedElement)) {
              isProcessed = false;
            } else {
              isProcessed = this.processResponsiveness(observedElement.offsetWidth, mobileWidth, observedElement.offsetHeight);
            }
          });
        });
        this.resizeObserver.observe(observedElement);
      }
    }
    this.onAfterRenderSurvey.fire(this, {
      survey: this,
      htmlElement: htmlElement,
    });
    this.rootElement = htmlElement;
    this.addScrollEventListener();
  }
  beforeDestroySurveyElement() {
    this.destroyResizeObserver();
    this.removeScrollEventListener();
    this.rootElement = undefined;
  }
  /**
   * An event that is raised when the survey's width or height is changed.
   */
  onResize: EventBase<SurveyModel, ResizeEvent> = new EventBase();
  private processResponsiveness(width: number, mobileWidth: number, height: number): boolean {
    const isMobile = width < mobileWidth;
    const isMobileChanged = this.isMobile !== isMobile;
    this.setIsMobile(isMobile);
    this.layoutElements.forEach(layoutElement => layoutElement.processResponsiveness && layoutElement.processResponsiveness(width));
    const options = {
      height,
      width,
    };
    this.onResize.fire(this, options);
    // this.setResponsiveStartWidth(width);
    return isMobileChanged;
  }

  public triggerResponsiveness(hard: boolean) {
    this.getAllQuestions().forEach(question => {
      question.triggerResponsiveness(hard);
    });
  }

  public destroyResizeObserver(): void {
    if (!!this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }
  updateQuestionCssClasses(question: Question, cssClasses: any) {
    this.onUpdateQuestionCssClasses.fire(this, {
      question: question,
      cssClasses: cssClasses,
    });
  }
  updatePanelCssClasses(panel: PanelModel, cssClasses: any) {
    this.onUpdatePanelCssClasses.fire(this, {
      panel: panel,
      cssClasses: cssClasses,
    });
  }
  updatePageCssClasses(page: PageModel, cssClasses: any) {
    this.onUpdatePageCssClasses.fire(this, {
      page: page,
      cssClasses: cssClasses,
    });
  }
  updateChoiceItemCss(question: IQuestion, options: any): void {
    options.question = question;
    this.onUpdateChoiceItemCss.fire(this, options);
  }
  private isCurrentPageRendering: boolean = true;
  private isCurrentPageRendered: boolean = undefined;
  afterRenderPage(htmlElement: HTMLElement) {
    if (!this.isDesignMode && !this.focusingQuestionInfo) {
      const doScroll = this.isCurrentPageRendered === false;
      setTimeout(() => this.scrollToTopOnPageChange(doScroll), 1);
    }
    this.focusQuestionInfo();
    this.isCurrentPageRendered = true;
    if (this.onAfterRenderPage.isEmpty) return;
    this.onAfterRenderPage.fire(this, {
      page: this.activePage,
      htmlElement: htmlElement,
    });
  }
  afterRenderHeader(htmlElement: HTMLElement) {
    if (this.onAfterRenderHeader.isEmpty) return;
    this.onAfterRenderHeader.fire(this, {
      htmlElement: htmlElement,
    });
  }
  afterRenderQuestion(question: Question, htmlElement: HTMLElement) {
    this.onAfterRenderQuestion.fire(this, {
      question: question,
      htmlElement: htmlElement,
    });
  }
  afterRenderQuestionInput(question: Question, htmlElement: HTMLElement) {
    if (this.onAfterRenderQuestionInput.isEmpty) return;
    let id = (<Question>question).inputId;
    const { root } = settings.environment;
    if (!!id && (!htmlElement || htmlElement.id !== id) && typeof root !== "undefined") {
      let el = root.getElementById(id);
      if (!!el) {
        htmlElement = el;
      }
    }
    this.onAfterRenderQuestionInput.fire(this, {
      question: question,
      htmlElement: htmlElement,
    });
  }
  afterRenderPanel(panel: IElement, htmlElement: HTMLElement) {
    this.onAfterRenderPanel.fire(this, {
      panel: <PanelModel><any>panel,
      htmlElement: htmlElement,
    });
  }
  whenQuestionFocusIn(question: Question) {
    this.onFocusInQuestion.fire(this, {
      question: question
    });
  }
  whenPanelFocusIn(panel: PanelModel) {
    this.onFocusInPanel.fire(this, {
      panel: panel
    });
  }

  private rebuildQuestionChoices() {
    this.getAllQuestions().forEach(q => q.surveyChoiceItemVisibilityChange());
  }
  canChangeChoiceItemsVisibility(): boolean {
    return !this.onShowingChoiceItem.isEmpty;
  }
  getChoiceItemVisibility(question: Question, item: any, val: boolean): boolean {
    const options: ShowingChoiceItemEvent = { question: question, item: item, visible: val };
    this.onShowingChoiceItem.fire(this, options);
    return options.visible;
  }
  loadQuestionChoices(options: { question: Question, filter: string, skip: number, take: number, setItems: (items: Array<any>, totalCount: number) => void }): void {
    this.onChoicesLazyLoad.fire(this, options);
  }
  getChoiceDisplayValue(options: { question: Question, values: Array<any>, setItems: (displayValues: Array<string>, ...customValues: Array<IValueItemCustomPropValues>) => void }): void {
    if (this.onGetChoiceDisplayValue.isEmpty) {
      options.setItems(null);
    } else {
      this.onGetChoiceDisplayValue.fire(this, options);
    }
  }
  matrixBeforeRowAdded(options: any) {
    this.onMatrixRowAdding.fire(this, options);
  }
  matrixRowAdded(question: QuestionMatrixDynamicModel, row: any) {
    this.onMatrixRowAdded.fire(this, { question: question, row: row });
  }
  matrixColumnAdded(question: Question, column: any): void {
    this.onMatrixColumnAdded.fire(this, { question: question, column: column });
  }
  multipleTextItemAdded(question: QuestionMultipleTextModel, item: any): void {
    this.onMultipleTextItemAdded.fire(this, { question: question, item: item });
  }
  getQuestionByValueNameFromArray(
    valueName: string,
    name: string,
    index: number
  ): IQuestion {
    var questions = this.getQuestionsByValueName(valueName);
    if (!questions) return;
    for (var i = 0; i < questions.length; i++) {
      var res = questions[i].getQuestionFromArray(name, index);
      if (!!res) return res;
    }
    return null;
  }
  matrixRowRemoved(question: QuestionMatrixDynamicModel, rowIndex: number, row: any) {
    this.onMatrixRowRemoved.fire(this, {
      question: question,
      rowIndex: rowIndex,
      row: row,
    });
  }
  matrixRowRemoving(question: QuestionMatrixDynamicModel, rowIndex: number, row: any): boolean {
    var options = {
      question: question,
      rowIndex: rowIndex,
      row: row,
      allow: true,
    };
    this.onMatrixRowRemoving.fire(this, options);
    return options.allow;
  }
  matrixAllowRemoveRow(question: QuestionMatrixDynamicModel, rowIndex: number, row: any): boolean {
    const options = { question: question, rowIndex: rowIndex, row: row, allow: true };
    this.onMatrixRenderRemoveButton.fire(this, options);
    return options.allow;
  }
  matrixDetailPanelVisibleChanged(question: QuestionMatrixDropdownModelBase, rowIndex: number, row: any, visible: boolean): void {
    const options = { question: question, rowIndex: rowIndex, row: row, visible: visible, detailPanel: row.detailPanel };
    this.onMatrixDetailPanelVisibleChanged.fire(this, options);
  }
  matrixCellCreating(question: QuestionMatrixDropdownModelBase, options: any): void {
    options.question = question;
    this.onMatrixCellCreating.fire(this, options);
  }
  matrixCellCreated(question: QuestionMatrixDropdownModelBase, options: any): void {
    options.question = question;
    this.onMatrixCellCreated.fire(this, options);
  }
  matrixAfterCellRender(question: QuestionMatrixDropdownModelBase, options: any): void {
    options.question = question;
    this.onAfterRenderMatrixCell.fire(this, options);
  }
  matrixCellValueChanged(question: QuestionMatrixDropdownModelBase, options: any): void {
    options.question = question;
    this.onMatrixCellValueChanged.fire(this, options);
  }
  matrixCellValueChanging(question: QuestionMatrixDropdownModelBase, options: MatrixCellValueChangingEvent): void {
    options.question = question;
    this.onMatrixCellValueChanging.fire(this, options);
  }
  get isValidateOnValueChanging(): boolean {
    return this.checkErrorsMode === "onValueChanging";
  }
  get isValidateOnValueChanged(): boolean {
    return this.checkErrorsMode === "onValueChanged";
  }
  private get isValidateOnValueChange(): boolean {
    return this.isValidateOnValueChanged || this.isValidateOnValueChanging;
  }
  private get isValidateOnComplete(): boolean {
    return this.checkErrorsMode === "onComplete" || this.validationAllowSwitchPages && !this.validationAllowComplete;
  }
  matrixCellValidate(question: QuestionMatrixDropdownModelBase, options: MatrixCellValidateEvent): SurveyError {
    options.question = question;
    this.onMatrixCellValidate.fire(this, options);
    return options.error ? new CustomError(options.error, this) : null;
  }
  dynamicPanelAdded(question: QuestionPanelDynamicModel, panelIndex?: number, panel?: PanelModel): void {
    if (!this.isLoadingFromJson && this.hasQuestionVisibleIndeces(question)) {
      this.updateVisibleIndexes(question.page);
    }
    if (this.onDynamicPanelAdded.isEmpty) return;
    var panels = (<any>question).panels;
    if (panelIndex === undefined) {
      panelIndex = panels.length - 1;
      panel = panels[panelIndex];
    }
    this.onDynamicPanelAdded.fire(this, { question: question, panel: panel, panelIndex: panelIndex });
  }
  dynamicPanelRemoved(question: QuestionPanelDynamicModel, panelIndex: number, panel: PanelModel): void {
    var questions = !!panel ? (<PanelModelBase>panel).questions : [];
    for (var i = 0; i < questions.length; i++) {
      questions[i].clearOnDeletingContainer();
    }
    if(this.hasQuestionVisibleIndeces(question)) {
      this.updateVisibleIndexes(question.page);
    }
    this.onDynamicPanelRemoved.fire(this, {
      question: question,
      panelIndex: panelIndex,
      panel: panel,
    });
  }
  private hasQuestionVisibleIndeces(question: Question): boolean {
    const qList = question.getNestedQuestions(true);
    for(let i = 0; i < qList.length; i ++) {
      if(qList[i].visibleIndex > -1) return true;
    }
    return false;
  }
  dynamicPanelRemoving(question: QuestionPanelDynamicModel, panelIndex: number, panel: PanelModel): boolean {
    const options = {
      question: question,
      panelIndex: panelIndex,
      panel: panel,
      allow: true
    };
    this.onDynamicPanelRemoving.fire(this, options);
    return options.allow;
  }
  dynamicPanelItemValueChanged(question: IQuestion, options: any): void {
    options.question = question;
    this.onDynamicPanelValueChanged.fire(this, options);
  }
  dynamicPanelItemValueChanging(question: IQuestion, options: any): void {
    options.question = question;
    this.onDynamicPanelValueChanging.fire(this, options);
  }
  dynamicPanelGetTabTitle(question: IQuestion, options: any): void {
    options.question = question;
    this.onGetDynamicPanelTabTitle.fire(this, options);
  }
  dynamicPanelCurrentIndexChanged(question: IQuestion, options: any): void {
    options.question = question;
    this.onDynamicPanelCurrentIndexChanged.fire(this, options);
  }
  dragAndDropAllow(options: DragDropAllowEvent): boolean {
    this.onDragDropAllow.fire(this, options);
    return options.allow;
  }
  elementContentVisibilityChanged(element: ISurveyElement): void {
    if (this.currentPage) {
      this.currentPage.ensureRowsVisibility();
    }
    this.onElementContentVisibilityChanged.fire(this, { element });
  }
  public getUpdatedPanelFooterActions(
    panel: PanelModel,
    actions: Array<IAction>, question?: QuestionPanelDynamicModel): Array<IAction> {
    const options: GetPanelFooterActionsEvent = {
      question: question,
      panel: panel,
      actions: actions,
    };
    this.onGetPanelFooterActions.fire(this, options);
    return options.actions;
  }
  getUpdatedElementTitleActions(
    element: ISurveyElement,
    titleActions: Array<IAction>
  ): Array<IAction> {
    if (element.isPage)
      return this.getUpdatedPageTitleActions(<PageModel>element, titleActions);
    if (element.isPanel)
      return this.getUpdatedPanelTitleActions(<PanelModel>element, titleActions);
    return this.getUpdatedQuestionTitleActions(<Question>element, titleActions);
  }

  private getTitleActionsResult(titleActions: Array<IAction>, options: GetTitleActionsEventMixin) {
    if (titleActions != options.actions) return options.actions;
    if (titleActions != options.titleActions) return options.titleActions;
    return titleActions;
  }

  private getUpdatedQuestionTitleActions(
    question: Question,
    titleActions: Array<IAction>
  ) {
    const options: GetQuestionTitleActionsEvent = {
      question: question,
      actions: titleActions,
      titleActions: titleActions,
    };
    this.onGetQuestionTitleActions.fire(this, options);
    return this.getTitleActionsResult(titleActions, options);
  }

  private getUpdatedPanelTitleActions(
    panel: PanelModel,
    titleActions: Array<IAction>
  ) {
    const options: GetPanelTitleActionsEvent = {
      panel: panel,
      actions: titleActions,
      titleActions: titleActions,
    };
    this.onGetPanelTitleActions.fire(this, options);
    return this.getTitleActionsResult(titleActions, options);
  }
  private getUpdatedPageTitleActions(
    page: PageModel,
    titleActions: Array<IAction>
  ) {
    var options: GetPageTitleActionsEvent = {
      page: page,
      actions: titleActions,
      titleActions: titleActions,
    };
    this.onGetPageTitleActions.fire(this, options);
    return this.getTitleActionsResult(titleActions, options);
  }

  getUpdatedMatrixRowActions(
    question: QuestionMatrixDropdownModelBase,
    row: any,
    actions: Array<IAction>
  ) {
    const options: GetMatrixRowActionsEvent = {
      question: question,
      actions: actions,
      row: row,
    };
    this.onGetMatrixRowActions.fire(this, options);
    return options.actions;
  }

  public skeletonHeight: number = undefined;

  scrollElementToTop(
    element: ISurveyElement, question: Question, page: PageModel,
    id: string, scrollIfVisible?: boolean, scrollIntoViewOptions?: ScrollIntoViewOptions,
    passedRootElement?: HTMLElement,
    onScolledCallback?: () => void
  ): any {
    const options: ScrollToTopEvent = {
      element: element,
      question: question,
      page: page,
      elementId: id,
      cancel: false,
      allow: true,
    };
    this.onScrollToTop.fire(this, options);
    if (!options.cancel && options.allow) {
      const elementPage = this.getPageByElement(element as IElement);
      if (this.isLazyRendering && !!elementPage) {
        let elementsToRenderBefore = 1;
        const { rootElement } = settings.environment;
        const surveyRootElement = this.rootElement || passedRootElement || rootElement as any;
        if (!!this.skeletonHeight && !!surveyRootElement && typeof surveyRootElement.getBoundingClientRect === "function") {
          elementsToRenderBefore = surveyRootElement.getBoundingClientRect().height / this.skeletonHeight - 1;
        }
        elementPage.forceRenderElement(element as IElement, () => {
          this.suspendLazyRendering();
          SurveyElement.ScrollElementToTop(options.elementId, scrollIfVisible, scrollIntoViewOptions, () => {
            this.releaseLazyRendering();
            activateLazyRenderingChecks(elementPage.id);
            onScolledCallback && onScolledCallback();
          });
        }, elementsToRenderBefore);
      } else {
        if (element.isPage && !this.isSinglePage && !this.isDesignMode && this.rootElement) {
          const elementToScroll = this.rootElement.querySelector(classesToSelector(this.css.rootWrapper)) as HTMLElement;
          SurveyElement.ScrollElementToViewCore(elementToScroll, false, scrollIfVisible, scrollIntoViewOptions, onScolledCallback);
        } else {
          SurveyElement.ScrollElementToTop(options.elementId, scrollIfVisible, scrollIntoViewOptions, onScolledCallback);
        }
      }
    }
  }

  /**
   * Opens a dialog window for users to select files.
   * @param input A [file input HTML element](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement).
   * @param callback A callback function that you can use to process selected files. Accepts an array of JavaScript <a href="https://developer.mozilla.org/en-US/docs/Web/API/File" target="_blank">File</a> objects.
   * @see onOpenFileChooser
   * @see onUploadFile
   */
  public chooseFiles(
    input: HTMLInputElement,
    callback: (files: File[]) => void,
    context?: { element: Base, item?: any, elementType?: string, propertyName?: string }
  ): void {
    if (this.onOpenFileChooser.isEmpty) {
      chooseFiles(input, callback);
    } else {
      this.onOpenFileChooser.fire(this, {
        input: input,
        element: context && context.element || this.survey,
        elementType: context && context.elementType,
        item: context && context.item,
        propertyName: context && context.propertyName,
        callback: callback,
        context: context
      } as any);
    }
  }
  /**
   * Uploads files to a server.
   *
   * The following code shows how to call this method:
   *
   * ```js
   * const question = survey.getQuestionByName("myFileQuestion");
   * survey.uploadFiles(
   *   question,
   *   question.name,
   *   question.value,
   *   (data, errors) => {
   *     // ...
   *   }
   * );
   * ```
   * @param question A [File Upload question instance](https://surveyjs.io/form-library/documentation/api-reference/file-model) or [Signature Pad question instance](https://surveyjs.io/form-library/documentation/api-reference/signature-pad-model).
   * @param name The File Upload question's [`name`](https://surveyjs.io/form-library/documentation/api-reference/file-model#name) or Signature Pad question's [`name`](https://surveyjs.io/form-library/documentation/api-reference/signature-pad-model#name).
   * @param files An array of JavaScript <a href="https://developer.mozilla.org/en-US/docs/Web/API/File" target="_blank">File</a> objects that represent files to upload.
   * @param callback A callback function that allows you to access successfully uploaded files as the first argument. If any files fail to upload, the second argument contains an array of error messages.
   * @see onUploadFiles
   * @see downloadFile
   */
  public uploadFiles(question: QuestionFileModel | QuestionSignaturePadModel, name: string, files: File[],
    callback: (data: any | Array<any>, errors?: any | Array<any>) => any): void {
    if (this.onUploadFiles.isEmpty) {
      callback("error", this.getLocString("noUploadFilesHandler"));
    } else {
      this.taskManager.runTask("file", (done) => {
        this.onUploadFiles.fire(this, {
          question: question,
          name: name,
          files: files || [],
          callback: (status, data) => {
            callback(status, data);
            done();
          },
        });
      });
    }
    if (this.surveyPostId) {
      this.uploadFilesCore(name, files, callback);
    }
  }
  public downloadFile(
    question: QuestionFileModel,
    questionName: string,
    fileValue: any,
    callback: (status: string, data: any) => any
  ): void {
    if (this.onDownloadFile.isEmpty) {
      !!callback && callback("skipped", fileValue.content || fileValue);
    }
    this.onDownloadFile.fire(this, {
      question: question,
      name: questionName,
      content: fileValue.content || fileValue,
      fileValue: fileValue,
      callback: callback,
    });
  }
  public clearFiles(
    question: QuestionFileModel | QuestionSignaturePadModel,
    name: string,
    value: any,
    fileName: string,
    callback: (status: string, data: any) => any
  ) {
    if (this.onClearFiles.isEmpty) {
      !!callback && callback("success", value);
    }
    this.onClearFiles.fire(this, {
      question: question,
      name: name,
      value: value,
      fileName: fileName,
      callback: callback,
    });
  }
  updateChoicesFromServer(
    question: QuestionSelectBase,
    choices: Array<ItemValue>,
    serverResult: any
  ): Array<ItemValue> {
    var options = {
      question: question,
      choices: choices,
      serverResult: serverResult,
    };
    this.onChoicesLoaded.fire(this, options);
    return options.choices;
  }
  loadedChoicesFromServer(question: IQuestion): void {
    this.locStrsChanged();
  }
  protected uploadFilesCore(name: string, files: File[],
    uploadingCallback: (data: any | Array<any>, errors?: any | Array<any>,) => any): void {
    this.reportWarningOnUsingService();
  }
  getPage(index: number): PageModel {
    return this.pages[index];
  }
  /**
   * Adds an existing page to the survey.
   * @param page A page to add.
   * @param index An index at which to insert the page. If you do not specify this parameter, the page will be added to the end.
   * @see addNewPage
   * @see createNewPage
   */
  public addPage(page: PageModel, index: number = -1) {
    if (page == null) return;
    if (index < 0 || index >= this.pages.length) {
      this.pages.push(page);
    } else {
      this.pages.splice(index, 0, page);
    }
  }
  /**
   * Creates a new page and adds it to the survey.
   *
   * If you want to switch a survey to the newly added page, assign its index to the [`currentPageNo`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#currentPageNo) property or assign the entire page to the [`currentPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#currentPage) property.
   *
   * @param name A page name. If you do not specify this parameter, it will be generated automatically.
   * @param index An index at which to insert the page. If you do not specify this parameter, the page will be added to the end.
   * @returns The created and added page.
   * @see addPage
   * @see createNewPage
   */
  public addNewPage(name: string = null, index: number = -1) {
    var page = this.createNewPage(name);
    this.addPage(page, index);
    return page;
  }
  /**
   * Removes a page from the survey.
   *
   * Pass a `PageModel` object to this method. You can get this object in different ways. For example, you can call the [`getPageByName()`](#getPageByName) method to obtain a `PageModel` object with a specific name or use the [`currentPage`](#currentPage) property to access and delete the current page, as shown in the code below.
   *
   * ```js
   * // Delete the current page
   * survey.removePage(survey.currentPage);
   * ```
   * @param page A page to remove.
   * @see addNewPage
   */
  public removePage(page: PageModel) {
    var index = this.pages.indexOf(page);
    if (index < 0) return;
    this.pages.splice(index, 1);
    if (this.currentPage == page) {
      this.currentPage = this.pages.length > 0 ? this.pages[0] : null;
    }
  }
  /**
   * Returns a question with a specified [`name`](https://surveyjs.io/form-library/documentation/api-reference/question#name).
   * @param name A question name
   * @param caseInsensitive *(Optional)* A Boolean value that specifies case sensitivity when searching for the question. Default value: `false` (uppercase and lowercase letters are treated as distinct).
   * @returns A question with a specified name.
   * @see getAllQuestions
   * @see getQuestionByValueName
   */
  public getQuestionByName(
    name: string,
    caseInsensitive: boolean = false
  ): Question {
    if (!name) return null;
    if (caseInsensitive) {
      name = name.toLowerCase();
    }
    var hash: HashTable<any> = !!caseInsensitive
      ? this.questionHashes.namesInsensitive
      : this.questionHashes.names;
    var res = hash[name];
    if (!res) return null;
    return res[0];
  }
  findQuestionByName(name: string): IQuestion {
    return this.getQuestionByName(name);
  }
  getEditingSurveyElement(): Base { return this.editingObjValue; }
  /**
   * Returns a question with a specified [`valueName`](https://surveyjs.io/form-library/documentation/api-reference/question#valueName).
   *
   * > Since `valueName` does not have to be unique, multiple questions can have the same `valueName` value. In this case, the `getQuestionByValueName()` method returns the first such question. If you need to get all questions with the same `valueName`, call the `getQuestionsByValueName()` method.
   * @param valueName A question's `valueName` property value.
   * @param caseInsensitive *(Optional)* A Boolean value that specifies case sensitivity when searching for the question. Default value: `false` (uppercase and lowercase letters are treated as distinct).
   * @returns A question with a specified `valueName`.
   * @see getAllQuestions
   * @see getQuestionByName
   */
  public getQuestionByValueName(
    valueName: string,
    caseInsensitive: boolean = false
  ): Question {
    var res = this.getQuestionsByValueName(valueName, caseInsensitive);
    return !!res ? res[0] : null;
  }
  /**
   * Returns all questions with a specified [`valueName`](https://surveyjs.io/form-library/documentation/api-reference/question#valueName). If a question's `valueName` is undefined, its [`name`](https://surveyjs.io/form-library/documentation/api-reference/question#name) property is used.
   * @param valueName A question's `valueName` property value.
   * @param caseInsensitive *(Optional)* A Boolean value that specifies case sensitivity when searching for the questions. Default value: `false` (uppercase and lowercase letters are treated as distinct).
   * @returns An array of questions with a specified `valueName`.
   * @see getAllQuestions
   * @see getQuestionByName
   */
  public getQuestionsByValueName(
    valueName: string,
    caseInsensitive: boolean = false
  ): Array<Question> {
    var hash: HashTable<any> = !!caseInsensitive
      ? this.questionHashes.valueNamesInsensitive
      : this.questionHashes.valueNames;
    var res = hash[valueName];
    if (!res) return null;
    return res;
  }
  public getCalculatedValueByName(name: string): CalculatedValue {
    for (var i = 0; i < this.calculatedValues.length; i++) {
      if (name == this.calculatedValues[i].name)
        return this.calculatedValues[i];
    }
    return null;
  }
  public getQuestionsByNames(
    names: string[],
    caseInsensitive: boolean = false
  ): IQuestion[] {
    var result: IQuestion[] = [];
    if (!names) return result;
    for (var i: number = 0; i < names.length; i++) {
      if (!names[i]) continue;
      var question = this.getQuestionByName(names[i], caseInsensitive);
      if (question) result.push(question);
    }
    return result;
  }
  /**
   * Returns a page to which a specified survey element (question or panel) belongs.
   * @param element A question or panel instance.
   */
  public getPageByElement(element: IElement): PageModel {
    for (var i: number = 0; i < this.pages.length; i++) {
      var page = this.pages[i];
      if (page.containsElement(element)) return page;
    }
    return null;
  }
  /**
   * Returns a page to which a specified question belongs.
   * @param question A question instance.
   */
  public getPageByQuestion(question: IQuestion): PageModel {
    return this.getPageByElement(question);
  }
  /**
   * Returns a page with a specified name.
   * @param name A page [name](https://surveyjs.io/form-library/documentation/api-reference/page-model#name).
   */
  public getPageByName(name: string): PageModel {
    for (var i: number = 0; i < this.pages.length; i++) {
      if (this.pages[i].name == name) return this.pages[i];
    }
    return null;
  }
  public getPagesByNames(names: string[]): PageModel[] {
    var result: PageModel[] = [];
    if (!names) return result;
    for (var i: number = 0; i < names.length; i++) {
      if (!names[i]) continue;
      var page = this.getPageByName(names[i]);
      if (page) result.push(page);
    }
    return result;
  }
  /**
   * Returns a list of all [questions](https://surveyjs.io/form-library/documentation/api-reference/question) in the survey.
   * @param visibleOnly A Boolean value that specifies whether to include only visible questions.
   * @param includeDesignTime For internal use.
   * @param includeNested A Boolean value that specifies whether to include nested questions, such as questions within matrix cells.
   * @returns An array of questions.
   * @see getQuestionByName
   */
  public getAllQuestions(
    visibleOnly: boolean = false,
    includeDesignTime: boolean = false,
    includeNested: boolean = false
  ): Array<Question> {
    if (includeNested) includeDesignTime = false;
    var res: Array<Question> = [];
    for (var i: number = 0; i < this.pages.length; i++) {
      this.pages[i].addQuestionsToList(
        res,
        visibleOnly,
        includeDesignTime
      );
    }
    if (!includeNested) return res;
    const res2: Array<Question> = [];
    res.forEach(q => {
      res2.push(q);
      q.getNestedQuestions(visibleOnly).forEach(nQ => res2.push(nQ));
    });
    return res2;
  }
  /**
   * Returns an array of quiz questions. A question counts if it is visible, has an input field, and specifies [`correctAnswer`](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model#correctAnswer).
   *
   * For more information about quizzes, refer to the following tutorial: [Create a Quiz](https://surveyjs.io/form-library/documentation/design-survey/create-a-quiz).
   * @returns An array of quiz questions.
   * @see getQuizQuestionCount
   */
  public getQuizQuestions(): Array<IQuestion> {
    var result = new Array<IQuestion>();
    var startIndex = this.getPageStartIndex();
    for (var i = startIndex; i < this.pages.length; i++) {
      if (!this.pages[i].isVisible) continue;
      var questions = this.pages[i].questions;
      for (var j = 0; j < questions.length; j++) {
        var q = questions[j];
        if (q.quizQuestionCount > 0) {
          result.push(q);
        }
      }
    }
    return result;
  }
  /**
   * Returns a [panel](https://surveyjs.io/form-library/documentation/api-reference/panel-model) with a specified [`name`](https://surveyjs.io/form-library/documentation/api-reference/panel-model#name).
   * @param name A panel name.
   * @param caseInsensitive *(Optional)* A Boolean value that specifies case sensitivity when searching for the panel. Default value: `false` (uppercase and lowercase letters are treated as distinct).
   * @returns A panel with a specified name.
   * @see getAllPanels
   */
  public getPanelByName(
    name: string,
    caseInsensitive: boolean = false
  ): PanelModel {
    var panels = this.getAllPanels();
    if (caseInsensitive) name = name.toLowerCase();
    for (var i: number = 0; i < panels.length; i++) {
      var panelName = panels[i].name;
      if (caseInsensitive) panelName = panelName.toLowerCase();
      if (panelName == name) return <PanelModel>panels[i];
    }
    return null;
  }
  /**
   * Returns a list of all [panels](https://surveyjs.io/form-library/documentation/api-reference/panel-model) in the survey.
   * @param visibleOnly A Boolean value that specifies whether to include only visible panels.
   * @param includeDesignTime For internal use.
   * @returns An array of panels.
   * @see getPanelByName
   */
  public getAllPanels(
    visibleOnly: boolean = false,
    includeDesignTime: boolean = false
  ): Array<IPanel> {
    var result = new Array<IPanel>();
    for (var i: number = 0; i < this.pages.length; i++) {
      this.pages[i].addPanelsIntoList(result, visibleOnly, includeDesignTime);
    }
    return result;
  }
  /**
   * Creates and returns a new page but does not add it to the survey.
   *
   * Call the [`addPage(page)`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#addPage) method to add the created page to the survey later or the [`addNewPage(name, index)`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#addNewPage) method to create _and_ add a page to the survey.
   * @see addPage
   * @see addNewPage
   */
  public createNewPage(name: string): PageModel {
    const page = Serializer.createClass("page");
    page.name = name;
    return page;
  }
  private getValueChangeReason(): "trigger" | "expression" | undefined {
    if(this.isSettingValueOnExpression) return "expression";
    return this.isSettingValueFromTrigger ? "trigger" : undefined;
  }
  protected questionOnValueChanging(valueName: string, newValue: any, questionValueName?: string): any {
    if (!!this.editingObj) {
      const prop = Serializer.findProperty(this.editingObj.getType(), valueName);
      if (!!prop) newValue = prop.settingValue(this.editingObj, newValue);
    }
    if (this.onValueChanging.isEmpty) return newValue;
    var options = {
      name: valueName,
      question: <Question>this.getQuestionByValueName(questionValueName || valueName),
      value: this.getUnbindValue(newValue),
      oldValue: this.getValue(valueName),
      reason: this.getValueChangeReason()
    };
    this.onValueChanging.fire(this, options);
    return options.value;
  }
  protected updateQuestionValue(valueName: string, newValue: any) {
    if (this.isLoadingFromJson) return;
    var questions = this.getQuestionsByValueName(valueName);
    if (!!questions) {
      for (var i: number = 0; i < questions.length; i++) {
        var qValue = questions[i].value;
        if (
          (qValue === newValue && Array.isArray(qValue) && !!this.editingObj) ||
          !this.isTwoValueEquals(qValue, newValue)
        ) {
          questions[i].updateValueFromSurvey(newValue, false);
        }
      }
    }
  }
  private checkQuestionErrorOnValueChanged(question: Question) {
    if (
      !this.isNavigationButtonPressed &&
      (this.isValidateOnValueChanged ||
        question.getAllErrors().length > 0)
    ) {
      this.checkQuestionErrorOnValueChangedCore(question);
    }
  }
  private checkQuestionErrorOnValueChangedCore(question: Question): boolean {
    var oldErrorCount = question.getAllErrors().length;
    var res = !question.validate(true, {
      isOnValueChanged: !this.isValidateOnValueChanging,
    });
    if (
      !!question.page && this.isValidateOnValueChange &&
      (oldErrorCount > 0 || question.getAllErrors().length > 0)
    ) {
      this.fireValidatedErrorsOnPage(<PageModel>question.page);
    }
    return res;
  }
  private checkErrorsOnValueChanging(
    valueName: string,
    newValue: any
  ): boolean {
    if (this.isLoadingFromJson) return false;
    var questions = this.getQuestionsByValueName(valueName);
    if (!questions) return false;
    var res = false;
    for (var i: number = 0; i < questions.length; i++) {
      var q = questions[i];
      if (!this.isTwoValueEquals(q.valueForSurvey, newValue)) {
        q.value = newValue;
      }
      if (this.checkQuestionErrorOnValueChangedCore(q)) res = true;
      res = res || q.errors.length > 0;
    }
    return res;
  }
  private fireOnValueChanged(name: string, value: any, question: Question): void {
    this.onValueChanged.fire(this, {
      name: name,
      question: question,
      value: value,
      reason: this.getValueChangeReason()
    });
  }
  protected notifyQuestionOnValueChanged(valueName: string, newValue: any, questionName: string): void {
    if (this.isLoadingFromJson) return;
    var questions = this.getQuestionsByValueName(valueName);
    if (!!questions) {
      for (var i: number = 0; i < questions.length; i++) {
        var question = questions[i];
        this.checkQuestionErrorOnValueChanged(question);
        question.onSurveyValueChanged(newValue);
      }
    }
    this.fireOnValueChanged(valueName, newValue, !!questionName ? this.getQuestionByName(questionName) : undefined);
    if (this.isDisposed) return;
    this.checkElementsBindings(valueName, newValue);
    this.notifyElementsOnAnyValueOrVariableChanged(valueName, questionName);
  }
  private isRunningElementsBindings: boolean;
  private updateVisibleIndexAfterBindings: boolean;
  private checkElementsBindings(valueName: string, newValue: any): void {
    this.isRunningElementsBindings = true;
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].checkBindings(valueName, newValue);
    }
    this.isRunningElementsBindings = false;
    if (this.updateVisibleIndexAfterBindings) {
      this.updateVisibleIndexes();
      this.updateVisibleIndexAfterBindings = false;
    }
  }
  private notifyElementsOnAnyValueOrVariableChanged(name: string, questionName?: string) {
    if (this.isEndLoadingFromJson === "processing") return;
    if (this.isRunningConditions) {
      this.conditionNotifyElementsOnAnyValueOrVariableChanged = true;
      return;
    }
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].onAnyValueChanged(name, questionName);
    }
    if (!this.isEndLoadingFromJson) {
      this.locStrsChanged();
    }
  }
  private updateAllQuestionsValue(clearData: boolean) {
    var questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      var q = <Question>questions[i];
      var valName = q.getValueName();
      q.updateValueFromSurvey(this.getValue(valName), clearData);
      if (q.requireUpdateCommentValue) {
        q.updateCommentFromSurvey(this.getComment(valName));
      }
    }
  }
  private notifyAllQuestionsOnValueChanged() {
    var questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      questions[i].onSurveyValueChanged(
        this.getValue(questions[i].getValueName())
      );
    }
  }
  private checkOnPageTriggers(isOnComplete: boolean) {
    var questions = this.getCurrentPageQuestions(true);
    var values: { [index: string]: any } = {};
    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      var name = question.getValueName();
      values[name] = this.getValue(name);
    }
    this.addCalculatedValuesIntoFilteredValues(values);
    this.checkTriggers(values, true, isOnComplete);
  }
  private getCurrentPageQuestions(
    includeInvsible: boolean = false
  ): Array<Question> {
    var result: Array<Question> = [];
    var page = this.currentPage;
    if (!page) return result;
    for (var i = 0; i < page.questions.length; i++) {
      var question = page.questions[i];
      if ((!includeInvsible && !question.visible) || !question.name) continue;
      result.push(question);
    }
    return result;
  }
  private isTriggerIsRunning: boolean = false;
  private triggerValues: any = null;
  private triggerKeys: any = null;
  private checkTriggers(key: any, isOnNextPage: boolean, isOnComplete: boolean = false, isOnNavigation: boolean = false, name?: string): void {
    if (this.isCompleted || this.triggers.length == 0 || this.isDisplayMode) return;
    if (this.isTriggerIsRunning) {
      this.triggerValues = this.getFilteredValues();
      for (var k in key) {
        this.triggerKeys[k] = key[k];
      }
      return;
    }
    let isQuestionInvalid = false;
    if (!isOnComplete && name && this.hasRequiredValidQuestionTrigger) {
      const question = <Question>this.getQuestionByValueName(name);
      isQuestionInvalid = question && !question.validate(false);
    }
    this.isTriggerIsRunning = true;
    this.triggerKeys = key;
    this.triggerValues = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    let prevCanBeCompleted = this.canBeCompletedByTrigger;
    for (let i = 0; i < this.triggers.length; i++) {
      const trigger = this.triggers[i];
      if (isQuestionInvalid && trigger.requireValidQuestion) continue;
      const options = { isOnNextPage: isOnNextPage, isOnComplete: isOnComplete, isOnNavigation: isOnNavigation,
        keys: this.triggerKeys, values: this.triggerValues, properties: properties };
      trigger.checkExpression(options);
    }
    if (prevCanBeCompleted !== this.canBeCompletedByTrigger) {
      this.updateButtonsVisibility();
    }
    this.isTriggerIsRunning = false;
  }
  private checkTriggersAndRunConditions(name: string, newValue: any, oldValue: any): void {
    var triggerKeys: { [index: string]: any } = {};
    triggerKeys[name] = { newValue: newValue, oldValue: oldValue };
    this.runConditionOnValueChanged(name, newValue);
    this.checkTriggers(triggerKeys, false, false, false, name);
  }
  private get hasRequiredValidQuestionTrigger(): boolean {
    for (let i = 0; i < this.triggers.length; i++) {
      if (this.triggers[i].requireValidQuestion) return true;
    }
    return false;
  }
  private doElementsOnLoad() {
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].onSurveyLoad();
    }
  }
  private conditionValues: any = null;
  private get isRunningConditions(): boolean {
    return !!this.conditionValues;
  }
  private isValueChangedOnRunningCondition: boolean = false;
  private conditionRunnerCounter: number = 0;
  private conditionUpdateVisibleIndexes: boolean = false;
  private conditionNotifyElementsOnAnyValueOrVariableChanged: boolean = false;
  /**
   * Recalculates all [expressions](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#expressions) in the survey.
   */
  public runExpressions(): void {
    this.runConditions();
  }
  private runConditions() {
    if (
      this.isCompleted ||
      this.isEndLoadingFromJson === "processing" ||
      this.isRunningConditions
    )
      return;
    this.conditionValues = this.getFilteredValues();
    var properties = this.getFilteredProperties();
    var oldCurrentPageIndex = this.pages.indexOf(this.currentPage);
    this.runConditionsCore(properties);
    this.checkIfNewPagesBecomeVisible(oldCurrentPageIndex);
    this.conditionValues = null;
    if (
      this.isValueChangedOnRunningCondition &&
      this.conditionRunnerCounter <
      settings.maxConditionRunCountOnValueChanged
    ) {
      this.isValueChangedOnRunningCondition = false;
      this.conditionRunnerCounter++;
      this.runConditions();
    } else {
      this.isValueChangedOnRunningCondition = false;
      this.conditionRunnerCounter = 0;
      if (this.conditionUpdateVisibleIndexes) {
        this.conditionUpdateVisibleIndexes = false;
        this.updateVisibleIndexes();
      }
      if (this.conditionNotifyElementsOnAnyValueOrVariableChanged) {
        this.conditionNotifyElementsOnAnyValueOrVariableChanged = false;
        this.notifyElementsOnAnyValueOrVariableChanged("");
      }
    }
  }
  private questionTriggersKeys: any;
  private runConditionOnValueChanged(name: string, value: any) {
    if (this.isRunningConditions) {
      this.conditionValues[name] = value;
      if(this.questionTriggersKeys) {
        this.questionTriggersKeys[name] = value;
      }
      this.isValueChangedOnRunningCondition = true;
    } else {
      this.questionTriggersKeys = {};
      this.questionTriggersKeys[name] = value;
      this.runConditions();
      this.runQuestionsTriggers(name, value);
      this.questionTriggersKeys = undefined;
    }
  }
  private runConditionsCore(properties: any) {
    var pages = this.pages;
    for (var i = 0; i < this.calculatedValues.length; i++) {
      this.calculatedValues[i].resetCalculation();
    }
    for (var i = 0; i < this.calculatedValues.length; i++) {
      this.calculatedValues[i].doCalculation(
        this.calculatedValues,
        this.conditionValues,
        properties
      );
    }
    super.runConditionCore(this.conditionValues, properties);
    for (let i = 0; i < pages.length; i++) {
      pages[i].runCondition(this.conditionValues, properties);
    }
  }
  private runQuestionsTriggers(name: string, value: any): void {
    if (this.isDisplayMode || this.isDesignMode) return;
    const questions = this.getAllQuestions();
    questions.forEach(q => {
      q.runTriggers(name, value, this.questionTriggersKeys);
    });
  }
  private checkIfNewPagesBecomeVisible(oldCurrentPageIndex: number) {
    var newCurrentPageIndex = this.pages.indexOf(this.currentPage);
    if (newCurrentPageIndex <= oldCurrentPageIndex + 1) return;
    for (var i = oldCurrentPageIndex + 1; i < newCurrentPageIndex; i++) {
      if (this.pages[i].isVisible) {
        this.currentPage = this.pages[i];
        break;
      }
    }
  }
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public sendResult(postId: string = null, clientId: string = null, isPartial: boolean = false): void {
    if (!this.isEditMode) return;
    if (isPartial && this.onPartialSend) {
      this.onPartialSend.fire(this, null);
    }

    if (!postId && this.surveyPostId) {
      postId = this.surveyPostId;
    }
    if (!postId) return;
    if (clientId) {
      this.clientId = clientId;
    }
    if (isPartial && !this.clientId) return;
    this.reportWarningOnUsingService();
  }
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public getResult(resultId: string, questionName: string): void {
    this.reportWarningOnUsingService();
  }
  /**
   * @deprecated Self-hosted Form Library [no longer supports integration with SurveyJS Demo Service](https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service).
   */
  public loadSurveyFromService(surveyId: string = null, clientId: string = null): void {
    if (surveyId) {
      this.surveyId = surveyId;
    }
    if (clientId) {
      this.clientId = clientId;
    }
    this.reportWarningOnUsingService();
  }
  private reportWarningOnUsingService(): void {
    ConsoleWarnings.warn("Self-hosted Form Library no longer supports integration with SurveyJS Demo Service. Learn more: https://surveyjs.io/stay-updated/release-notes/v2.0.0#form-library-removes-apis-for-integration-with-surveyjs-demo-service");
  }
  private loadSurveyFromServiceJson(json: any) {
    if (!json) return;
    this.fromJSON(json);
    this.notifyAllQuestionsOnValueChanged();
    this.onLoadSurveyFromService();
    this.onLoadedSurveyFromService.fire(this, {});
  }
  protected onLoadingSurveyFromService() { }
  protected onLoadSurveyFromService() { }
  private resetVisibleIndexes() {
    var questions = this.getAllQuestions(true);
    for (var i = 0; i < questions.length; i++) {
      questions[i].setVisibleIndex(-1);
    }
    this.updateVisibleIndexes();
  }
  private updateVisibleIndexes(page?: IPage) {
    if (this.isLoadingFromJson || !!this.isEndLoadingFromJson) return;
    if (
      this.isRunningConditions &&
      this.onQuestionVisibleChanged.isEmpty &&
      this.onPageVisibleChanged.isEmpty
    ) {
      //Run update visible index only one time on finishing running conditions
      this.conditionUpdateVisibleIndexes = true;
      return;
    }
    if (this.isRunningElementsBindings) {
      this.updateVisibleIndexAfterBindings = true;
      return;
    }
    this.updatePageVisibleIndexes();
    this.updatePageElementsVisibleIndexes(page);
    this.updateProgressText(true);
  }
  private updatePageElementsVisibleIndexes(page: IPage): void {
    if (this.showQuestionNumbers == "onPage") {
      var visPages = !!page ? [page] : this.visiblePages;
      for (var i = 0; i < visPages.length; i++) {
        visPages[i].setVisibleIndex(0);
      }
    } else {
      let index = this.getStartVisibleIndex();
      const pages = this.pages;
      for (let i = 0; i < pages.length; i++) {
        index += pages[i].setVisibleIndex(index);
      }
    }
  }
  private getStartVisibleIndex(): number {
    return this.showQuestionNumbers == "on" ? 0 : -1;
  }
  private updatePageVisibleIndexes(): void {
    this.updateButtonsVisibility();
    var index = 0;
    for (var i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const isPageVisible = page.isVisible && (i > 0 || !page.isStartPage);
      page.visibleIndex = isPageVisible ? index++ : -1;
      page.num = isPageVisible ? page.visibleIndex + 1 : -1;
    }
  }
  public fromJSON(json: any, options?: ILoadFromJSONOptions): void {
    if (!json) return;
    this.questionHashesClear();
    this.jsonErrors = null;
    this.sjsVersion = undefined;
    const jsonConverter = new JsonObject();
    jsonConverter.toObject(json, this, options);
    if (jsonConverter.errors.length > 0) {
      this.jsonErrors = jsonConverter.errors;
    }
    this.onStateAndCurrentPageChanged();
    this.endLoading();
    this.updateState();
    if(!!this.sjsVersion && !!settings.version) {
      if(Helpers.compareVerions(this.sjsVersion, settings.version) > 0) {
        ConsoleWarnings.warn("The version of the survey JSON schema (v"
          + this.sjsVersion + ") is newer than your current Form Library version ("
          + settings.version + "). Please update the Form Library to make sure that all survey features work as expected.");
      }
    }
  }
  startLoadingFromJson(json?: any): void {
    super.startLoadingFromJson(json);
    if (json && json.locale) {
      this.locale = json.locale;
    }
  }
  public setJsonObject(jsonObj: any): void {
    this.fromJSON(jsonObj);
  }
  private isEndLoadingFromJson: string = null;
  endLoadingFromJson(): void {
    this.isEndLoadingFromJson = "processing";
    this.onFirstPageIsStartedChanged();
    super.endLoadingFromJson();
    if (this.hasCookie) {
      this.isCompletedBefore = true;
    }
    this.doElementsOnLoad();
    this.onQuestionsOnPageModeChanged("standard");
    this.isEndLoadingFromJson = "conditions";
    this.runConditions();
    this.notifyElementsOnAnyValueOrVariableChanged("");
    this.isEndLoadingFromJson = null;
    this.updateVisibleIndexes();
    this.updateCurrentPage();
    this.setCalculatedWidthModeUpdater();
  }

  private updateNavigationCss() {
    const val = this.navigationBarValue;
    if (!!val) {
      val.cssClasses = this.css.actionBar;
      val.containerCss = this.css.footer;
      !!this.updateNavigationItemCssCallback && this.updateNavigationItemCssCallback();
    }
  }

  private updateNavigationItemCssCallback: (strName?: string) => void;

  protected createNavigationBar(): ActionContainer {
    const res = new ActionContainer();
    res.setItems(this.createNavigationActions());
    res.locOwner = this;
    return res;
  }
  protected createNavigationActions(): Array<IAction> {
    const defaultComponent = "sv-nav-btn";
    const navStart = new Action({
      id: "sv-nav-start",
      visible: <any>new ComputedUpdater<boolean>(() => this.isStartPageActive),
      visibleIndex: 10,
      locTitle: this.locStartSurveyText,
      action: () => this.start(),
      component: defaultComponent
    });
    const navPrev = new Action({
      id: "sv-nav-prev",
      visible: <any>new ComputedUpdater<boolean>(() => this.isShowPrevButton),
      visibleIndex: 20,
      data: {
        mouseDown: () => this.navigationMouseDown(),
      },
      locTitle: this.locPagePrevText,
      action: () => this.performPrevious(),
      component: defaultComponent
    });
    const navNext = new Action({
      id: "sv-nav-next",
      visible: <any>new ComputedUpdater<boolean>(() => this.isShowNextButton),
      visibleIndex: 30,
      data: {
        mouseDown: () => this.nextPageMouseDown(),
      },
      locTitle: this.locPageNextText,
      action: () => this.nextPageUIClick(),
      component: defaultComponent
    });
    const navPreview = new Action({
      id: "sv-nav-preview",
      visible: <any>new ComputedUpdater<boolean>(() => this.isPreviewButtonVisible),
      visibleIndex: 40,
      data: {
        mouseDown: () => this.navigationMouseDown(),
      },
      locTitle: this.locPreviewText,
      action: () => this.showPreview(),
      component: defaultComponent
    });
    const navComplete = new Action({
      id: "sv-nav-complete",
      visible: <any>new ComputedUpdater<boolean>(() => this.isCompleteButtonVisible),
      visibleIndex: 50,
      data: {
        mouseDown: () => this.navigationMouseDown(),
      },
      locTitle: this.locCompleteText,
      action: () => this.taskManager.waitAndExecute(() => this.tryComplete()),
      component: defaultComponent
    });
    this.updateNavigationItemCssCallback = () => {
      navStart.innerCss = this.cssNavigationStart;
      navPrev.innerCss = this.cssNavigationPrev;
      navNext.innerCss = this.cssNavigationNext;
      navPreview.innerCss = this.cssNavigationPreview;
      navComplete.innerCss = this.cssNavigationComplete;
    };
    return [navStart, navPrev, navNext, navPreview, navComplete];
  }
  protected onBeforeRunConstructor() {}
  protected onBeforeCreating() { }
  protected onCreating() { }
  private getProcessedTextValue(textValue: TextPreProcessorValue): void {
    this.getProcessedTextValueCore(textValue);
    if (!this.onProcessDynamicText.isEmpty) {
      var wasEmpty = this.isValueEmpty(textValue.value);
      this.onProcessDynamicText.fire(this, textValue);
      textValue.isExists =
        textValue.isExists || (wasEmpty && !this.isValueEmpty(textValue.value));
    }
  }
  getBuiltInVariableValue(name: string): number {
    if (name === "pageno") {
      var page = this.currentPage;
      return page != null ? this.visiblePages.indexOf(page) + 1 : 0;
    }
    if (name === "pagecount") {
      return this.visiblePageCount;
    }
    if (name === "correctedanswers" || name === "correctanswers" || name === "correctedanswercount") {
      return this.getCorrectedAnswerCount();
    }
    if (name === "incorrectedanswers" || name === "incorrectanswers" || name === "incorrectedanswercount") {
      return this.getInCorrectedAnswerCount();
    }
    if (name === "questioncount") {
      return this.getQuizQuestionCount();
    }
    return undefined;
  }
  private getProcessedTextValueCore(textValue: TextPreProcessorValue): void {
    var name = textValue.name.toLocaleLowerCase();
    if (["no", "require", "title"].indexOf(name) !== -1) {
      return;
    }
    const builtInVar = this.getBuiltInVariableValue(name);
    if (builtInVar !== undefined) {
      textValue.isExists = true;
      textValue.value = builtInVar;
      return;
    }
    if (name === "locale") {
      textValue.isExists = true;
      textValue.value = !!this.locale
        ? this.locale
        : surveyLocalization.defaultLocale;
      return;
    }
    var variable = this.getVariable(name);
    if (variable !== undefined) {
      textValue.isExists = true;
      textValue.value = variable;
      return;
    }
    var question = this.getFirstName(name);
    if (question) {
      const questionUseDisplayText = (<Question>question).useDisplayValuesInDynamicTexts;
      textValue.isExists = true;
      const firstName = question.getValueName().toLowerCase();
      name = firstName + name.substring(firstName.length);
      name = name.toLocaleLowerCase();
      var values: { [index: string]: any } = {};
      values[firstName] = textValue.returnDisplayValue && questionUseDisplayText
        ? question.getDisplayValue(false, undefined)
        : question.value;
      textValue.value = new ProcessValue().getValue(name, values);
      return;
    }
    this.getProcessedValuesWithoutQuestion(textValue);
  }
  private getProcessedValuesWithoutQuestion(textValue: TextPreProcessorValue): void {
    var value = this.getValue(textValue.name);
    if (value !== undefined) {
      textValue.isExists = true;
      textValue.value = value;
      return;
    }
    const processor = new ProcessValue();
    const firstName = processor.getFirstName(textValue.name);
    if (firstName === textValue.name) return;
    const data: any = {};
    let val = this.getValue(firstName);
    if (Helpers.isValueEmpty(val)) {
      val = this.getVariable(firstName);
    }
    if (Helpers.isValueEmpty(val)) return;
    data[firstName] = val;
    textValue.value = processor.getValue(textValue.name, data);
    textValue.isExists = processor.hasValue(textValue.name, data);
  }
  private getFirstName(name: string): Question {
    name = name.toLowerCase();
    var question;
    do {
      question = this.getQuestionByValueName(name, true);
      name = this.reduceFirstName(name);
    } while (!question && !!name);
    return question;
  }
  private reduceFirstName(name: string): string {
    var pos1 = name.lastIndexOf(".");
    var pos2 = name.lastIndexOf("[");
    if (pos1 < 0 && pos2 < 0) return "";
    var pos = Math.max(pos1, pos2);
    return name.substring(0, pos);
  }
  private isClearingUnsedValues: boolean;
  private clearUnusedValues() {
    this.isClearingUnsedValues = true;
    var questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      questions[i].clearUnusedValues();
    }
    this.clearInvisibleQuestionValues();
    this.isClearingUnsedValues = false;
  }
  hasVisibleQuestionByValueName(valueName: string): boolean {
    var questions = this.getQuestionsByValueName(valueName);
    if (!questions) return false;
    for (var i: number = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.isVisible && q.isParentVisible && !q.parentQuestion) return true;
    }
    return false;
  }
  questionsByValueName(valueName: string): Array<IQuestion> {
    var questions = this.getQuestionsByValueName(valueName);
    return !!questions ? questions : [];
  }
  private clearInvisibleQuestionValues() {
    const reason = this.clearInvisibleValues === "none" ? "none" : "onComplete";
    const questions = this.getAllQuestions();
    for (var i: number = 0; i < questions.length; i++) {
      questions[i].clearValueIfInvisible(reason);
    }
  }
  /**
   * Returns a variable value.
   *
   * [Variables help topic](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#variables (linkStyle))
   * @param name A variable name.
   * @return A variable value.
   * @see setVariable
   * @see getVariableNames
   */
  public getVariable(name: string): any {
    if (!name) return null;
    name = name.toLowerCase();
    var res = this.variablesHash[name];
    if (!this.isValueEmpty(res)) return res;
    if (name.indexOf(".") > -1 || name.indexOf("[") > -1) {
      if (new ProcessValue().hasValue(name, this.variablesHash))
        return new ProcessValue().getValue(name, this.variablesHash);
    }
    return res;
  }
  /**
   * Sets a variable value.
   *
   * [Variables help topic](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#variables (linkStyle))
   * @param name A variable name.
   * @param newValue A new variable value.
   * @see getVariable
   * @see getVariableNames
   */
  public setVariable(name: string, newValue: any): void {
    if (!name) return;
    const oldValue = this.getVariable(name);
    if (!!this.valuesHash) {
      delete this.valuesHash[name];
    }
    name = name.toLowerCase();
    this.variablesHash[name] = newValue;
    this.notifyElementsOnAnyValueOrVariableChanged(name);
    if (!Helpers.isTwoValueEquals(oldValue, newValue)) {
      this.checkTriggersAndRunConditions(name, newValue, oldValue);
      this.onVariableChanged.fire(this, { name: name, value: newValue });
    }
  }
  /**
   * Returns the names of all variables in the survey.
   *
   * [Variables help topic](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#variables (linkStyle))
   * @returns An array of variable names.
   * @see getVariable
   * @see setVariable
   */
  public getVariableNames(): Array<string> {
    var res = [];
    for (var key in this.variablesHash) {
      res.push(key);
    }
    return res;
  }
  //ISurvey data
  protected getUnbindValue(value: any): any {
    if (!!this.editingObj) return value;
    return Helpers.getUnbindValue(value);
  }
  /**
   * Returns a value (answer) for a question with a specified `name`.
   * @param name A question name.
   * @returns A question value (answer).
   * @see data
   * @see setValue
   */
  public getValue(name: string): any {
    if (!name || name.length == 0) return null;
    var value = this.getDataValueCore(this.valuesHash, name);
    return this.getUnbindValue(value);
  }
  /**
   * Sets a question value (answer).
   *
   * > This method executes all triggers and reevaluates conditions (`visibleIf`, `requiredId`, and others). It also switches the survey to the next page if the [`autoAdvanceEnabled`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#autoAdvanceEnabled) property is enabled and all questions on the current page have correct answers.
   * @param name A question name.
   * @param newValue A new question value.
   * @param locNotification For internal use.
   * @param allowNotifyValueChanged For internal use.
   * @see data
   * @see getValue
   */
  public setValue(
    name: string,
    newQuestionValue: any,
    locNotification: any = false,
    allowNotifyValueChanged: boolean = true,
    questionName?: string
  ): void {
    var newValue = newQuestionValue;
    if (allowNotifyValueChanged) {
      newValue = this.questionOnValueChanging(name, newQuestionValue);
    }
    if (
      this.isValidateOnValueChanging &&
      this.checkErrorsOnValueChanging(name, newValue)
    )
      return;
    if (
      !this.editingObj &&
      this.isValueEqual(name, newValue) &&
      this.isTwoValueEquals(newValue, newQuestionValue)
    )
      return;
    var oldValue = this.getValue(name);
    if (this.isValueEmpyOnSetValue(name, newValue)) {
      this.deleteDataValueCore(this.valuesHash, name);
    } else {
      newValue = this.getUnbindValue(newValue);
      this.setDataValueCore(this.valuesHash, name, newValue);
    }
    this.updateOnSetValue(
      name,
      newValue,
      oldValue,
      locNotification,
      allowNotifyValueChanged,
      questionName
    );
  }
  private isValueEmpyOnSetValue(name: string, val: any): boolean {
    if (!this.isValueEmpty(val, false)) return false;
    if (!this.editingObj || val === null || val === undefined) return true;
    return this.editingObj.getDefaultPropertyValue(name) === val;
  }
  private updateOnSetValue(
    name: string,
    newValue: any,
    oldValue: any,
    locNotification: any = false,
    allowNotifyValueChanged: boolean = true,
    questionName?: string
  ) {
    this.updateQuestionValue(name, newValue);
    if (locNotification === true || this.isDisposed || this.isRunningElementsBindings) return;
    questionName = questionName || name;
    this.checkTriggersAndRunConditions(name, newValue, oldValue);
    if (allowNotifyValueChanged) {
      this.notifyQuestionOnValueChanged(name, newValue, questionName);
    }
    if (locNotification !== "text") {
      this.tryGoNextPageAutomatic(name);
    }
  }
  private isValueEqual(name: string, newValue: any): boolean {
    if (newValue === "" || newValue === undefined) newValue = null;
    var oldValue = this.getValue(name);
    if (oldValue === "" || oldValue === undefined) oldValue = null;
    if (newValue === null || oldValue === null) return newValue === oldValue;
    return this.isTwoValueEquals(newValue, oldValue);
  }
  protected doOnPageAdded(page: PageModel): void {
    page.setSurveyImpl(this);
    if (!page.name) page.name = this.generateNewName(this.pages, "page");
    this.questionHashesPanelAdded(page);
    this.updateVisibleIndexes();
    if (!!this.runningPages) return;
    if (!this.isLoadingFromJson) {
      this.updateProgressText();
      this.updateCurrentPage();
    }
    var options = { page: page };
    this.onPageAdded.fire(this, options);
  }
  protected doOnPageRemoved(page: PageModel): void {
    page.setSurveyImpl(null);
    if (!!this.runningPages) return;
    if (page === this.currentPage) {
      this.updateCurrentPage();
    }
    this.updateVisibleIndexes();
    this.updateProgressText();
    this.updateLazyRenderingRowsOnRemovingElements();
  }
  private generateNewName(elements: Array<any>, baseName: string): string {
    var keys: { [index: string]: any } = {};
    for (var i = 0; i < elements.length; i++) keys[elements[i]["name"]] = true;
    var index = 1;
    while (keys[baseName + index]) index++;
    return baseName + index;
  }
  protected tryGoNextPageAutomatic(name: string): void {
    if (!!this.isEndLoadingFromJson || !this.autoAdvanceEnabled || !this.currentPage) return;
    const question = <Question>this.getQuestionByValueName(name);
    if (!question || (!!question &&(!question.visible || !question.supportAutoAdvance()))) return;
    if (!question.validate(false) && !question.supportGoNextPageError()) return;
    if(!!this.currentSingleQuestion) {
      const curQuestion = this.currentSingleQuestion;
      const goNextQuestion = () => {
        if (curQuestion !== this.currentSingleQuestion) return;
        if(!this.isLastElement) {
          this.performNext();
        } else {
          if(this.autoAdvanceAllowComplete) {
            this.tryCompleteOrShowPreview();
          }
        }
      };
      surveyTimerFunctions.safeTimeOut(goNextQuestion, settings.autoAdvanceDelay);
    }
    var questions = this.getCurrentPageQuestions();
    if (questions.indexOf(question) < 0) return;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].hasInput && questions[i].isEmpty()) return;
    }
    if (this.isLastPage && (this.autoAdvanceEnabled !== true || !this.autoAdvanceAllowComplete)) return;
    if (this.checkIsCurrentPageHasErrors(false)) return;
    const curPage = this.currentPage;
    const goNextPage = () => {
      if (curPage !== this.currentPage) return;
      if (!this.isLastPage) {
        this.nextPage();
      } else {
        this.tryCompleteOrShowPreview();
      }
    };
    surveyTimerFunctions.safeTimeOut(goNextPage, settings.autoAdvanceDelay);
  }
  private tryCompleteOrShowPreview(): void {
    if (this.showPreviewBeforeComplete) {
      this.showPreview();
    } else {
      this.tryComplete();
    }
  }
  /**
   * Returns a comment value from a question with a specified `name`.
   * @param name A question name.
   * @returns A comment.
   * @see setComment
   */
  public getComment(name: string): string {
    const res = this.getValue(name + this.commentSuffix);
    return res || "";
  }
  /**
   * Sets a comment value to a question with a specified `name`.
   * @param name A question name.
   * @param newValue A new comment value.
   * @param locNotification For internal use.
   * @see getComment
   */
  public setComment(name: string, newValue: string, locNotification: any = false): void {
    if (!newValue) newValue = "";
    if (this.isTwoValueEquals(newValue, this.getComment(name))) return;
    const commentName = name + this.commentSuffix;
    newValue = this.questionOnValueChanging(commentName, newValue, name);
    if (this.isValueEmpty(newValue)) {
      this.deleteDataValueCore(this.valuesHash, commentName);
    } else {
      this.setDataValueCore(this.valuesHash, commentName, newValue);
    }
    var questions = this.getQuestionsByValueName(name);
    if (!!questions) {
      for (var i: number = 0; i < questions.length; i++) {
        questions[i].updateCommentFromSurvey(newValue);
        this.checkQuestionErrorOnValueChanged(questions[i]);
      }
    }
    if (!locNotification) {
      this.checkTriggersAndRunConditions(name, this.getValue(name), undefined);
    }
    if (locNotification !== "text") {
      this.tryGoNextPageAutomatic(name);
    }
    var question = this.getQuestionByValueName(name);
    if (question) {
      this.fireOnValueChanged(commentName, newValue, question);
      question.comment = newValue;
      if (question.comment != newValue) {
        question.comment = newValue;
      }
    }
  }
  /**
   * Deletes an answer from survey results.
   * @param {string} name An object property that stores the answer to delete. Pass a question's [`valueName`](https://surveyjs.io/form-library/documentation/api-reference/question#valueName) or [`name`](https://surveyjs.io/form-library/documentation/api-reference/question#name).
   */
  public clearValue(name: string): void {
    this.setValue(name, null);
    this.setComment(name, null);
  }
  /**
   * Specifies whether to remove disabled choices from the value in [Dropdown](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model), [Checkboxes](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model), and [Radio Button Group](https://surveyjs.io/form-library/documentation/api-reference/radio-button-question-model) questions.
   *
   * Default value: `false`
   *
   * > This property cannot be specified in the survey JSON schema. Use dot notation to specify it.
   */
  public get clearDisabledChoices(): boolean {
    return this.getPropertyValue("clearDisabledChoices", false);
  }
  public set clearDisabledChoices(val: boolean) {
    this.setPropertyValue("clearDisabledChoices", val);
  }
  /**
   * @deprecated Use the [`clearDisabledChoices`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#clearDisabledChoices) property instead.
   */
  public get clearValueOnDisableItems(): boolean {
    return this.clearDisabledChoices;
  }
  public set clearValueOnDisableItems(val: boolean) {
    this.clearDisabledChoices = val;
  }
  getQuestionClearIfInvisible(questionClearIf: string): string {
    if (this.isShowingPreview || this.runningPages) return "none";
    if (questionClearIf !== "default") return questionClearIf;
    return this.clearInvisibleValues;
  }
  questionVisibilityChanged(question: Question, newValue: boolean, resetIndexes: boolean): void {
    if (resetIndexes) {
      this.updateVisibleIndexes(question.page);
    }
    this.onQuestionVisibleChanged.fire(this, {
      question: question,
      name: question.name,
      visible: newValue,
    });
  }
  pageVisibilityChanged(page: PageModel, newValue: boolean) {
    if (this.isLoadingFromJson) return;
    if (newValue && !this.currentPage || page === this.currentPage) {
      this.updateCurrentPage();
    }
    this.updateVisibleIndexes();
    this.onPageVisibleChanged.fire(this, {
      page: page,
      visible: newValue,
    });
  }
  panelVisibilityChanged(panel: PanelModel, newValue: boolean) {
    this.updateVisibleIndexes(panel.page);
    this.onPanelVisibleChanged.fire(this, {
      panel: panel,
      visible: newValue,
    });
  }
  questionCreated(question: Question): any {
    this.onQuestionCreated.fire(this, { question: question });
  }
  questionAdded(question: Question, index: number, parentPanel: any, rootPanel: any): void {
    if (!question.name) {
      question.name = this.generateNewName(this.getAllQuestions(false, true), "question");
    }
    if (!!(<Question>question).page) {
      this.questionHashesAdded(<Question>question);
    }
    if(!this.isLoadingFromJson) {
      if (!this.currentPage) {
        this.updateCurrentPage();
      }
      this.updateVisibleIndexes(question.page);
      this.setCalculatedWidthModeUpdater();
    }
    if (this.canFireAddElement()) {
      this.onQuestionAdded.fire(this, {
        question: question,
        name: question.name,
        index: index,
        parent: parentPanel,
        page: rootPanel,
        parentPanel: parentPanel,
        rootPanel: rootPanel,
      });
    }
  }
  private canFireAddElement(): boolean {
    return !this.isMovingQuestion;
  }
  questionRemoved(question: Question): void {
    this.questionHashesRemoved(
      <Question>question,
      question.name,
      question.getValueName()
    );
    this.updateVisibleIndexes(question.page);
    this.onQuestionRemoved.fire(this, {
      question: question,
      name: question.name,
    });
    this.updateLazyRenderingRowsOnRemovingElements();
  }
  questionRenamed(
    question: IQuestion,
    oldName: string,
    oldValueName: string
  ): any {
    this.questionHashesRemoved(<Question>question, oldName, oldValueName);
    this.questionHashesAdded(<Question>question);
  }
  private questionHashes = {
    names: {},
    namesInsensitive: {},
    valueNames: {},
    valueNamesInsensitive: {},
  };
  private questionHashesClear() {
    this.questionHashes.names = {};
    this.questionHashes.namesInsensitive = {};
    this.questionHashes.valueNames = {};
    this.questionHashes.valueNamesInsensitive = {};
  }
  private questionHashesPanelAdded(panel: PanelModelBase) {
    if (this.isLoadingFromJson) return;
    var questions = panel.questions;
    for (var i = 0; i < questions.length; i++) {
      this.questionHashesAdded(questions[i]);
    }
  }
  private questionHashesAdded(question: Question) {
    this.questionHashAddedCore(
      this.questionHashes.names,
      question,
      question.name
    );
    this.questionHashAddedCore(
      this.questionHashes.namesInsensitive,
      question,
      question.name.toLowerCase()
    );
    this.questionHashAddedCore(
      this.questionHashes.valueNames,
      question,
      question.getValueName()
    );
    this.questionHashAddedCore(
      this.questionHashes.valueNamesInsensitive,
      question,
      question.getValueName().toLowerCase()
    );
  }
  private questionHashesRemoved(
    question: Question,
    name: string,
    valueName: string
  ) {
    if (!!name) {
      this.questionHashRemovedCore(this.questionHashes.names, question, name);
      this.questionHashRemovedCore(
        this.questionHashes.namesInsensitive,
        question,
        name.toLowerCase()
      );
    }
    if (!!valueName) {
      this.questionHashRemovedCore(
        this.questionHashes.valueNames,
        question,
        valueName
      );
      this.questionHashRemovedCore(
        this.questionHashes.valueNamesInsensitive,
        question,
        valueName.toLowerCase()
      );
    }
  }
  private questionHashAddedCore(hash: any, question: Question, name: string) {
    var res = hash[name];
    if (!!res) {
      var res = hash[name];
      if (res.indexOf(question) < 0) {
        res.push(question);
      }
    } else {
      hash[name] = [question];
    }
  }
  private questionHashRemovedCore(hash: any, question: Question, name: string) {
    var res = hash[name];
    if (!res) return;
    var index = res.indexOf(question);
    if (index > -1) {
      res.splice(index, 1);
    }
    if (res.length == 0) {
      delete hash[name];
    }
  }
  panelAdded(panel: PanelModel, index: number, parentPanel: any, rootPanel: any): void {
    if (!panel.name) {
      panel.name = this.generateNewName(
        this.getAllPanels(false, true),
        "panel"
      );
    }
    this.questionHashesPanelAdded(<PanelModelBase>(<any>panel));
    this.updateVisibleIndexes(panel.page);
    if (this.canFireAddElement()) {
      this.onPanelAdded.fire(this, {
        panel: panel,
        name: panel.name,
        index: index,
        parent: parentPanel,
        page: rootPanel,
        parentPanel: parentPanel,
        rootPanel: rootPanel,
      });
    }
  }
  panelRemoved(panel: PanelModel): void {
    this.updateVisibleIndexes(panel.page);
    this.onPanelRemoved.fire(this, { panel: panel, name: panel.name });
    this.updateLazyRenderingRowsOnRemovingElements();
  }
  validateQuestion(question: Question, errors: Array<SurveyError>, fireCallback: boolean): void {
    if (!this.onValidateQuestion.isEmpty) {
      var options = {
        name: question.name,
        question: question,
        value: question.value,
        errors: errors,
        error: <any>null,
      };
      this.onValidateQuestion.fire(this, options);
      if(options.error) {
        errors.push(new CustomError(options.error, this));
      }
    }
    if(fireCallback) {
      this.beforeSettingQuestionErrors(question, errors);
    }
  }
  validatePanel(panel: PanelModel, errors: Array<SurveyError>, fireCallback: boolean): void {
    if (panel.isPanel && !this.onValidatePanel.isEmpty) {
      const options = {
        name: panel.name,
        panel: panel,
        error: <any>null,
        errors: errors
      };
      this.onValidatePanel.fire(this, options);
      if(options.error) {
        errors.push(new CustomError(options.error, this));
      }
    }
    if(fireCallback) {
      this.makeRequiredErrorsInvisible(errors);
    }
  }
  processHtml(html: string, reason?: string): string {
    if (!reason) reason = "";
    var options = { html: html, reason: reason };
    this.onProcessHtml.fire(this, options);
    return this.processText(options.html, true);
  }
  processText(text: string, returnDisplayValue: boolean): string {
    return this.processTextEx({ text: text, returnDisplayValue: returnDisplayValue, doEncoding: false }).text;
  }
  processTextEx(params: ITextProcessorProp): ITextProcessorResult {
    const doEncoding = params.doEncoding === undefined ? settings.web.encodeUrlParams : params.doEncoding;
    let text = params.text;
    if(params.runAtDesign || !this.isDesignMode) {
      text = this.textPreProcessor.process(text, params.returnDisplayValue === true, doEncoding, params.replaceUndefinedValues);
    }
    const res = { text: text, hasAllValuesOnLastRun: true };
    res.hasAllValuesOnLastRun = this.textPreProcessor.hasAllValuesOnLastRun;
    return res;
  }
  private textPreProcessorValue: TextPreProcessor;
  private get textPreProcessor(): TextPreProcessor {
    if (!this.textPreProcessorValue) {
      this.textPreProcessorValue = new TextPreProcessor();
      this.textPreProcessorValue.onProcess = (textValue: TextPreProcessorValue) => {
        this.getProcessedTextValue(textValue);
      };
    }
    return this.textPreProcessorValue;
  }
  getSurveyMarkdownHtml(element: Question | PanelModel | PageModel | SurveyModel, text: string, name: string): string {
    const options: TextMarkdownEvent = {
      element: element,
      text: text,
      name: name,
      html: null,
    };
    this.onTextMarkdown.fire(this, options);
    return options.html;
  }
  public getCorrectedAnswerCount(): number {
    return this.getCorrectAnswerCount();
  }
  /**
   * Returns the number of correct answers in a quiz.
   *
   * For more information about quizzes, refer to the following tutorial: [Create a Quiz](https://surveyjs.io/form-library/documentation/design-survey/create-a-quiz).
   * @returns The number of correct answers in a quiz.
   * @see getQuizQuestionCount
   * @see getIncorrectAnswerCount
   */
  public getCorrectAnswerCount(): number {
    return this.getCorrectedAnswerCountCore(true);
  }
  /**
   * Returns the number of quiz questions. A question counts if it is visible, has an input field, and specifies [`correctAnswer`](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model#correctAnswer).
   *
   * This number may be different from `getQuizQuestions().length` because certain question types (for instance, matrix-like types) include more than one question.
   *
   * For more information about quizzes, refer to the following tutorial: [Create a Quiz](https://surveyjs.io/form-library/documentation/design-survey/create-a-quiz).
   * @returns The number of quiz questions.
   * @see getQuizQuestions
   */
  public getQuizQuestionCount(): number {
    var questions = this.getQuizQuestions();
    var res = 0;
    for (var i = 0; i < questions.length; i++) {
      res += (<Question>questions[i]).quizQuestionCount;
    }
    return res;
  }
  public getInCorrectedAnswerCount(): number {
    return this.getIncorrectAnswerCount();
  }
  public getInCorrectAnswerCount(): number {
    return this.getIncorrectAnswerCount();
  }
  /**
   * Returns the number of incorrect answers in a quiz.
   *
   * For more information about quizzes, refer to the following tutorial: [Create a Quiz](https://surveyjs.io/form-library/documentation/design-survey/create-a-quiz).
   * @returns The number of incorrect answers in a quiz.
   * @see getCorrectAnswerCount
   */
  public getIncorrectAnswerCount(): number {
    return this.getCorrectedAnswerCountCore(false);
  }
  onCorrectQuestionAnswer(question: IQuestion, options: any): void {
    if (this.onIsAnswerCorrect.isEmpty) return;
    options.question = question;
    this.onIsAnswerCorrect.fire(this, options);
  }
  private getCorrectedAnswerCountCore(isCorrect: boolean): number {
    var questions = this.getQuizQuestions();
    var counter = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = <Question>questions[i];
      const correctCount = q.correctAnswerCount;
      if (isCorrect) {
        counter += correctCount;
      } else {
        counter += q.quizQuestionCount - correctCount;
      }
    }
    return counter;
  }
  getCorrectedAnswers(): number {
    return this.getCorrectedAnswerCount();
  }
  getInCorrectedAnswers(): number {
    return this.getInCorrectedAnswerCount();
  }
  /**
   * @deprecated Use the [`showTimer`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showTimer) and [`timerLocation`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timerLocation) properties instead.
   */
  public get showTimerPanel(): string {
    if(!this.showTimer) return "none";
    return this.timerLocation;
  }
  public set showTimerPanel(val: string) {
    this.showTimer = val !== "none";
    if(this.showTimer) {
      this.timerLocation = val;
    }
  }
  /**
   * Specifies the timer's visibility. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   *
   * Default value: `false`
   *
   * If you set this property to `true`, the timer starts automatically when the survey begins. To specify time limits, use the [`timeLimit`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timeLimit) and [`timeLimitPerPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timeLimitPerPage) properties.
   *
   * The timer displays information about time spent on an individual page and the entire survey. If you want to display only the page timer or the survey timer, set the [`timerInfoMode`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timerInfoMode) property to `"page"` or `"survey"`.
   *
   * You can enable the timer without displaying it. In this case, you need to specify the required time limits and use the [`startTimer()`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#startTimer) and [`stopTimer()`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#stopTimer) methods to control the timer.
   * @see timerLocation
   * @see timeSpent
   * @see onTimerTick
   */
  public get showTimer(): boolean {
    return this.getPropertyValue("showTimer");
  }
  public set showTimer(val: boolean) {
    this.setPropertyValue("showTimer", val);
  }
  /**
   * Specifies the timer's position relative to the survey. Applies only if the [`showTimer`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showTimer) property is set to `true`.
   *
   * Possible values:
   *
   * - `"top"` (default) - Displays the timer at the top of the survey.
   * - `"bottom"` - Displays the timer at the bottom of the survey.
   * @see onTimerTick
   */
  public get timerLocation(): string {
    return this.getPropertyValue("timerLocation");
  }
  public set timerLocation(val: string) {
    this.setPropertyValue("timerLocation", val);
  }
  public get isTimerPanelShowingOnTop(): boolean {
    return this.showTimer && this.timerLocation === "top";
  }
  public get isTimerPanelShowingOnBottom(): boolean {
    return this.showTimer && this.timerLocation === "bottom";
  }
  /**
   * Specifies whether the timer panel displays timers for the current page, the entire survey, or both. Applies only if the timer panel is [visible](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#showTimer).
   *
   * Possible values:
   *
   * - `"survey"` - Displays only the survey timer.
   * - `"page"` - Displays only the page timer.
   * - `"combined"` (default) - Displays both the survey and page timers.
   * @see timeSpent
   * @see onTimerTick
   * @see startTimer
   * @see stopTimer
   */
  public get timerInfoMode(): string {
    return this.getTimerInfoVal(this.getPropertyValue("timerInfoMode"));
  }
  public set timerInfoMode(val: string) {
    this.setPropertyValue("timerInfoMode", val);
  }
  private getTimerInfoVal(val: string): string {
    return val === "all" ? "combined" : val;
  }
  /**
   * @deprecated Use the [`timerInfoMode`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timerInfoMode) property instead.
   */
  public get showTimerPanelMode(): string {
    const res = this.timerInfoMode;
    return res === "combined" ? "all" : res;
  }
  public set showTimerPanelMode(val: string) {
    this.timerInfoMode = this.getTimerInfoVal(val);
  }
  /**
   * Enables the grid layout, which structures form elements using a column-based system.
   *
   * Default value: `false`
   *
   * Specify the [`gridLayoutColumns`](https://surveyjs.io/form-library/documentation/api-reference/page-model#gridLayoutColumns) property for pages and panels to configure layout columns. Set the [`colSpan`](https://surveyjs.io/form-library/documentation/api-reference/question#colSpan) property for an individual question or panel to adjust how many columns this survey element spans.
   */
  @property({
    onSet: (newValue: boolean, target: SurveyModel) => {
      target.updateGridColumns();
    }
  }) gridLayoutEnabled: boolean;
  public updateGridColumns(): void {
    this.pages.forEach(page => page.updateGridColumns());
  }
  /**
    * Specifies how to calculate the survey width.
    *
    * Possible values:
    *
    * - `"static"` - A survey has a [fixed width](#width).
    * - `"responsive"` - A survey occupies all available horizontal space and stretches or shrinks horizontally to fit in the screen size.
    * - `"auto"` (default) - Survey width depends on a question type and corresponds to the `"static"` or `"responsive"` mode.
  */
  // `custom/precise` - The survey width is specified by the width property. // in-future
  public get widthMode(): string {
    return this.getPropertyValue("widthMode");
  }
  public set widthMode(val: string) {
    this.setPropertyValue("widthMode", val);
  }
  private calculatedWidthModeUpdater: ComputedUpdater;
  public setCalculatedWidthModeUpdater(): void {
    if(this.isLoadingFromJson) return;
    if (this.calculatedWidthModeUpdater) this.calculatedWidthModeUpdater.dispose();
    this.calculatedWidthModeUpdater = new ComputedUpdater(() => this.calculateWidthMode());
    this.calculatedWidthMode = <any>this.calculatedWidthModeUpdater;
  }
  @property() calculatedWidthMode: string;
  public calculateWidthMode(): string {
    if (this.widthMode == "auto") {
      let isResponsive = false;
      if (this.questionsOnPageMode != "inputPerPage") {
        this.pages.forEach((page) => {
          if (page.needResponsiveWidth())
            isResponsive = true;
        });
      }
      return isResponsive ? "responsive" : "static";
    }
    return this.widthMode;
  }
  /**
   * A survey width in CSS values.
   *
   * Default value: `undefined` (the survey inherits the width from its container)
   * @see onResize
   */
  public get width(): string {
    return this.getPropertyValue("width");
  }
  public set width(val: string) {
    this.setPropertyValue("width", val);
  }
  public get renderedWidth(): string {
    const isStaticWidth = this.getPropertyValue("calculatedWidthMode") == "static";
    let width: any = this.getPropertyValue("width");
    if (this.isScaled && this.responsiveStartWidth > 1) {
      let initialWidth = this.responsiveStartWidth;
      try {
        width = width || this.staticStartWidth;
        initialWidth = !isNaN(width) ? width : parseFloat(width.toString().replace("px", ""));
      } catch (e) { }
      return (isStaticWidth ? initialWidth : this.responsiveStartWidth) * this.widthScale / 100 + "px";
    }
    if (width && !isNaN(width)) width = width + "px";
    return isStaticWidth && width || undefined;
  }
  @property({
    defaultValue: 100, onSet(val: number, target: SurveyModel, prevVal: number) {
      target.pages.forEach(p => p.updateRootStyle());
    },
  }) widthScale: number;
  @property() staticStartWidth: number;
  public setStaticStartWidth(width: number): void {
    this.staticStartWidth = width;
  }
  @property() responsiveStartWidth: number;
  public setResponsiveStartWidth(width: number): void {
    this.responsiveStartWidth = width;
  }
  get isScaled(): boolean {
    return Math.abs(this.widthScale - 100) > 0.001;
  }
  public get timerInfo(): { spent: number, limit?: number } {
    return this.getTimerInfo();
  }
  public get timerClock(): { majorText: string, minorText?: string } {
    let major: string;
    let minor: string;
    if (!!this.currentPage) {
      let { spent, limit, minorSpent, minorLimit } = this.getTimerInfo();
      if (limit > 0) major = this.getDisplayClockTime(limit - spent);
      else { major = this.getDisplayClockTime(spent); }
      if (minorSpent !== undefined) {
        if (minorLimit > 0) {
          minor = this.getDisplayClockTime(minorLimit - minorSpent);
        } else {
          minor = this.getDisplayClockTime(minorSpent);
        }
      }
    }
    return { majorText: major, minorText: minor };
  }
  public get timerInfoText(): string {
    const options: TimerPanelInfoTextEvent = { text: this.getTimerInfoText() };
    this.onTimerPanelInfoText.fire(this, options);
    var loc = new LocalizableString(this, true);
    loc.text = options.text;
    return loc.textOrHtml;
  }
  private getTimerInfo(): { spent: number, limit?: number, minorSpent?: number, minorLimit?: number } {
    let page = this.currentPage;
    if (!page) return { spent: 0, limit: 0 };
    let pageSpent = page.timeSpent;
    let surveySpent = this.timeSpent;
    let pageLimitSec = page.getMaxTimeToFinish();
    let surveyLimit = this.timeLimit;
    if (this.timerInfoMode == "page") {
      return { spent: pageSpent, limit: pageLimitSec };
    }
    if (this.timerInfoMode == "survey") {
      return { spent: surveySpent, limit: surveyLimit };
    }
    else {
      if (pageLimitSec > 0 && surveyLimit > 0) {
        return { spent: pageSpent, limit: pageLimitSec, minorSpent: surveySpent, minorLimit: surveyLimit };
      } else if (pageLimitSec > 0) {
        return { spent: pageSpent, limit: pageLimitSec, minorSpent: surveySpent };
      }
      else if (surveyLimit > 0) {
        return { spent: surveySpent, limit: surveyLimit, minorSpent: pageSpent };
      }
      else {
        return { spent: pageSpent, minorSpent: surveySpent };
      }
    }
  }
  private getTimerInfoText() {
    var page = this.currentPage;
    if (!page) return "";
    var pageSpent = this.getDisplayTime(page.timeSpent);
    var surveySpent = this.getDisplayTime(this.timeSpent);
    var pageLimitSec = page.getMaxTimeToFinish();
    var pageLimit = this.getDisplayTime(pageLimitSec);
    var surveyLimit = this.getDisplayTime(this.timeLimit);
    if (this.timerInfoMode == "page")
      return this.getTimerInfoPageText(page, pageSpent, pageLimit);
    if (this.timerInfoMode == "survey")
      return this.getTimerInfoSurveyText(surveySpent, surveyLimit);
    if (this.timerInfoMode == "combined") {
      if (pageLimitSec <= 0 && this.timeLimit <= 0) {
        return this.getLocalizationFormatString("timerSpentAll",
          pageSpent,
          surveySpent
        );
      }
      if (pageLimitSec > 0 && this.timeLimit > 0) {
        return this.getLocalizationFormatString("timerLimitAll",
          pageSpent,
          pageLimit,
          surveySpent,
          surveyLimit
        );
      }
      let pageText = this.getTimerInfoPageText(page, pageSpent, pageLimit);
      let surveyText = this.getTimerInfoSurveyText(surveySpent, surveyLimit);
      return pageText + " " + surveyText;
    }
    return "";
  }
  private getTimerInfoPageText(
    page: PageModel,
    pageSpent: string,
    pageLimit: string
  ): string {
    return !!page && page.getMaxTimeToFinish() > 0
      ? this.getLocalizationFormatString("timerLimitPage", pageSpent, pageLimit)
      : this.getLocalizationFormatString("timerSpentPage", pageSpent, pageLimit);
  }
  private getTimerInfoSurveyText(
    surveySpent: string,
    surveyLimit: string
  ): string {
    const strName = this.timeLimit > 0 ? "timerLimitSurvey" : "timerSpentSurvey";
    return this.getLocalizationFormatString(strName, surveySpent, surveyLimit);
  }
  private getDisplayClockTime(val: number): string {
    if (val < 0) {
      val = 0;
    }
    const min: number = Math.floor(val / 60);
    const sec: number = val % 60;
    let secStr = sec.toString();
    if (sec < 10) {
      secStr = "0" + secStr;
    }
    return `${min}:${secStr}`;
  }
  private getDisplayTime(val: number): string {
    const min: number = Math.floor(val / 60);
    const sec: number = val % 60;
    let res: string = "";
    if (min > 0) {
      res += min + " " + this.getLocalizationString("timerMin");
    }
    if (res && sec == 0) return res;
    if (res) res += " ";
    return res + sec + " " + this.getLocalizationString("timerSec");
  }
  public get timerModel(): SurveyTimerModel { return this.timerModelValue; }
  /**
   * Starts a timer that calculates how many seconds a respondent has spent on the survey. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   * @see stopTimer
   * @see timeLimit
   * @see timeLimitPerPage
   * @see timeSpent
   * @see onTimerTick
   */
  public startTimer() {
    if (this.isEditMode) {
      this.timerModel.start();
    }
  }
  startTimerFromUI() {
    if (this.showTimer && this.state === "running") {
      this.startTimer();
    }
  }
  /**
   * Stops the timer. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   * @see startTimer
   * @see timeLimit
   * @see timeLimitPerPage
   * @see timeSpent
   * @see onTimerTick
   */
  public stopTimer(): void {
    this.timerModel.stop();
  }
  /**
   * A time period that a respondent has spent on the survey so far; measured in seconds. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   *
   * Assign a number to this property if you need to start the quiz timer from a specific time (for instance, if you want to continue an interrupted quiz).
   *
   * You can also find out how many seconds a respondent has spent on an individual survey page. To do this, use the [`timeSpent`](https://surveyjs.io/form-library/documentation/api-reference/page-model#timeSpent) property of a [`PageModel`](https://surveyjs.io/form-library/documentation/api-reference/page-model) object.
   * @see timeLimit
   * @see timeLimitPerPage
   * @see startTimer
   */
  public get timeSpent(): number { return this.timerModel.spent; }
  public set timeSpent(val: number) { this.timerModel.spent = val; }
  /**
   * A time period that a respondent has to complete the survey; measured in seconds. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   *
   * Default value: 0 (time is unlimited)
   *
   * [View Demo](https://surveyjs.io/form-library/examples/make-quiz-javascript/ (linkStyle))
   * @see timeLimitPerPage
   * @see startTimer
   * @see timeSpent
   */
  public get timeLimit(): number {
    return this.getPropertyValue("timeLimit", 0);
  }
  public set timeLimit(val: number) {
    this.setPropertyValue("timeLimit", val);
  }
  /**
   * @deprecated Use the [`timeLimit`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timeLimit) property instead.
   */
  public get maxTimeToFinish(): number {
    return this.timeLimit;
  }
  public set maxTimeToFinish(val: number) {
    this.timeLimit = val;
  }
  /**
   * A time period that a respondent has to complete each survey page; measured in seconds. Applies only to [quiz surveys](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz).
   *
   * Default value: 0 (time is unlimited)
   *
   * You can also use `PageModel`'s [`timeLimit`](https://surveyjs.io/form-library/documentation/api-reference/page-model#timeLimit) property to specify a time period for an individual survey page.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/make-quiz-javascript/ (linkStyle))
   * @see timeLimit
   * @see startTimer
   * @see timeSpent
   */
  public get timeLimitPerPage(): number {
    return this.getPropertyValue("timeLimitPerPage", 0);
  }
  public set timeLimitPerPage(val: number) {
    this.setPropertyValue("timeLimitPerPage", val);
  }
  /**
   * @deprecated Use the [`timeLimitPerPage`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#timeLimitPerPage) property instead.
   */
  public get maxTimeToFinishPage(): number {
    return this.timeLimitPerPage;
  }
  public set maxTimeToFinishPage(val: number) {
    this.timeLimitPerPage = val;
  }
  private doTimer(page: PageModel): void {
    this.onTimerTick.fire(this, {});
    if (this.timeLimit > 0 && this.timeLimit <= this.timeSpent) {
      this.timeSpent = this.timeLimit;
      this.tryComplete();
    }
    if (page) {
      var pageLimit = page.getMaxTimeToFinish();
      if (pageLimit > 0 && pageLimit == page.timeSpent) {
        if (this.isLastPage) {
          this.tryComplete();
        } else {
          this.nextPage();
        }
      }
    }
  }
  public get inSurvey(): boolean {
    return true;
  }
  //ISurveyImplementor
  getSurveyData(): ISurveyData {
    return this;
  }
  getSurvey(): ISurvey {
    return this;
  }
  getTextProcessor(): ITextProcessor {
    return this;
  }
  //ISurveyTriggerOwner
  getObjects(pages: string[], questions: string[]): any[] {
    var result: any[] = [];
    Array.prototype.push.apply(result, this.getPagesByNames(pages));
    Array.prototype.push.apply(result, this.getQuestionsByNames(questions));
    return result;
  }
  setTriggerValue(name: string, value: any, isVariable: boolean): void {
    if (!name) return;
    if (isVariable) {
      this.setVariable(name, value);
    } else {
      var question = this.getQuestionByName(name);
      this.startSetValueFromTrigger();
      if (!!question) {
        question.value = value;
      } else {
        var processor = new ProcessValue();
        var firstName = processor.getFirstName(name);
        if (firstName == name) {
          this.setValue(name, value);
        } else {
          if (!this.getQuestionByName(firstName)) return;
          var data = this.getUnbindValue(this.getFilteredValues());
          processor.setValue(data, name, value);
          this.setValue(firstName, data[firstName]);
        }
      }
      this.finishSetValueFromTrigger();
    }
  }
  copyTriggerValue(name: string, fromName: string, copyDisplayValue: boolean): void {
    if (!name || !fromName) return;
    let value;
    if (copyDisplayValue) {
      value = this.processText("{" + fromName + "}", true);
    } else {
      const processor = new ProcessValue();
      value = processor.getValue(fromName, this.getFilteredValues());
    }
    this.setTriggerValue(name, value, false);
  }
  triggerExecuted(trigger: Trigger): void {
    this.onTriggerExecuted.fire(this, { trigger: trigger });
  }
  private setValueFromTriggerCounter: number = 0;
  public get isSettingValueFromTrigger(): boolean { return this.setValueFromTriggerCounter > 0; }
  private startSetValueFromTrigger(): void {
    this.setValueFromTriggerCounter ++;
  }
  private finishSetValueFromTrigger(): void {
    this.setValueFromTriggerCounter --;
  }
  private focusingQuestionInfo: any;
  private isMovingQuestion: boolean;
  public startMovingQuestion(): void {
    this.isMovingQuestion = true;
  }
  public stopMovingQuestion(): void {
    this.isMovingQuestion = false;
  }
  get isQuestionDragging(): boolean { return this.isMovingQuestion; }
  public needRenderIcons = true;

  private skippedPages: Array<{ from: any, to: any }> = [];

  /**
   * Focuses a question with a specified name. Switches the current page if needed.
   * @param name A question name.
   * @returns `false` if the survey does not contain a question with a specified name or this question is hidden; otherwise, `true`.
   * @see focusFirstQuestion
   * @see autoFocusFirstQuestion
   */
  public focusQuestion(name: string): boolean {
    return this.focusQuestionByInstance(this.getQuestionByName(name, true));
  }
  focusQuestionByInstance(question: Question, onError: boolean = false): boolean {
    if (!question || !question.isVisible || !question.page) return false;
    const oldQuestion = this.focusingQuestionInfo?.question;
    if (oldQuestion === question) return false;
    this.focusingQuestionInfo = { question: question, onError: onError };
    this.skippedPages.push({ from: this.currentPage, to: question.page });
    const isNeedWaitForPageRendered = this.activePage !== question.page && !question.page.isStartPage;
    if (isNeedWaitForPageRendered) {
      this.currentPage = <PageModel>question.page;
      if(this.isSingleVisibleQuestion && !this.isDesignMode) {
        this.currentSingleQuestion = question;
      }
    }
    if (!isNeedWaitForPageRendered) {
      this.focusQuestionInfo();
    }
    return true;
  }
  private focusQuestionInfo(): void {
    const question = this.focusingQuestionInfo?.question;
    if (!!question && !question.isDisposed) {
      question.focus(this.focusingQuestionInfo.onError);
    }
    this.focusingQuestionInfo = undefined;
  }

  public questionEditFinishCallback(question: Question, event: any): void {
    const enterKeyAction = this.enterKeyAction || settings.enterKeyAction;
    if (enterKeyAction == "loseFocus") event.target.blur();
    if (enterKeyAction == "moveToNextEditor") {
      const allQuestions = this.currentPage.questions;
      const questionIndex = allQuestions.indexOf(question);
      if (questionIndex > -1 && questionIndex < allQuestions.length - 1) {
        allQuestions[questionIndex + 1].focus();
      }
      else {
        event.target.blur();
      }
    }
  }
  private elementWrapperComponentNameCore(componentName: string, element: any, wrapperName: string, reason?: string, item?: ItemValue): string {
    if (this.onElementWrapperComponentName.isEmpty) return componentName;
    const options = { componentName: componentName, element: element, wrapperName: wrapperName, reason: reason, item: item };
    this.onElementWrapperComponentName.fire(this, options);
    return options.componentName;
  }
  private elementWrapperDataCore(data: any, element: any, wrapperName: string, reason?: string, item?: ItemValue): any {
    if (this.onElementWrapperComponentData.isEmpty) return data;
    const options = { data: data, element: element, wrapperName: wrapperName, reason: reason, item: item };
    this.onElementWrapperComponentData.fire(this, options);
    return options.data;
  }
  public getElementWrapperComponentName(element: any, reason?: string): string {
    const res = reason === "logo-image" ? "sv-logo-image" : SurveyModel.TemplateRendererComponentName;
    return this.elementWrapperComponentNameCore(res, element, "component", reason);
  }
  public getQuestionContentWrapperComponentName(element: any): string {
    return this.elementWrapperComponentNameCore(SurveyModel.TemplateRendererComponentName, element, "content-component");
  }
  public getRowWrapperComponentName(row: QuestionRowModel): string {
    return this.elementWrapperComponentNameCore(SurveyModel.TemplateRendererComponentName, row, "row");
  }
  public getItemValueWrapperComponentName(item: ItemValue, question: QuestionSelectBase): string {
    return this.elementWrapperComponentNameCore(SurveyModel.TemplateRendererComponentName, question, "itemvalue", undefined, item);
  }
  public getElementWrapperComponentData(element: any, reason?: string): any {
    return this.elementWrapperDataCore(element, element, "component", reason);
  }
  public getRowWrapperComponentData(row: QuestionRowModel): any {
    return this.elementWrapperDataCore(row, row, "row");
  }
  public getItemValueWrapperComponentData(item: ItemValue, question: QuestionSelectBase): any {
    return this.elementWrapperDataCore(item, question, "itemvalue", undefined, item);
  }
  public getMatrixCellTemplateData(cell: any): any {
    const res: any = cell.question;
    return this.elementWrapperDataCore(res, res, "cell");
  }

  public searchText(text: string): Array<IFindElement> {
    if (!!text) text = text.toLowerCase();
    var res: Array<IFindElement> = [];
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].searchText(text, res);
    }
    return res;
  }
  public skeletonComponentName = "sv-skeleton";
  public getSkeletonComponentName(element: ISurveyElement): string {
    return this.skeletonComponentName;
  }

  @propertyArray() private layoutElements: Array<ISurveyLayoutElement>;

  /**
   * Adds an element to the survey layout.
   *
   * This method accepts an object with the following layout element properties:
   *
   * - `id`: `string` | `"timerpanel"` | `"progress-buttons"` | `"progress-questions"` | `"progress-pages"` | `"progress-correctquestions"` | `"progress-requiredquestions"` | `"toc-navigation"` | `"buttons-navigation"`\
   * A layout element identifier. You can use possible values to access and relocate or customize predefined layout elements.
   *
   * - `container`: `"header"` | `"footer"` | `"left"` | `"right"` | `"contentTop"` | `"contentBottom"`\
   * A layout container that holds the element. If you want to display the element within multiple containers, set this property to an array of possible values.
   *
   * - `component`: `string`\
   * The name of the component that renders the layout element.
   *
   * - `data`: `any`\
   * Data passed as props to `component`.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/progress-bar-with-percentage/ (linkStyle))
   * @param layoutElement A layout element configuration.
   * @returns The configuration of the previous layout element with the same `id`.
   */
  public addLayoutElement(layoutElement: ISurveyLayoutElement): ISurveyLayoutElement {
    const existingLayoutElement = this.removeLayoutElement(layoutElement.id);
    this.layoutElements.push(layoutElement);
    return existingLayoutElement;
  }
  public findLayoutElement(layoutElementId: string): ISurveyLayoutElement {
    const layoutElement = this.layoutElements.filter(a => a.id === layoutElementId)[0];
    return layoutElement;
  }
  public removeLayoutElement(layoutElementId: string): ISurveyLayoutElement {
    const layoutElement = this.findLayoutElement(layoutElementId);
    if (!!layoutElement) {
      const layoutElementIndex = this.layoutElements.indexOf(layoutElement);
      this.layoutElements.splice(layoutElementIndex, 1);
    }
    return layoutElement;
  }

  public getContainerContent(container: LayoutElementContainer): Array<ISurveyLayoutElement> {
    const containerLayoutElements = new Array<ISurveyLayoutElement>();
    for (let layoutElement of this.layoutElements) {
      if (this.mode !== "display" && isStrCiEqual(layoutElement.id, "timerpanel")) {
        if (container === "header") {
          if (this.isTimerPanelShowingOnTop && !this.isStartPageActive) {
            containerLayoutElements.push(layoutElement);
          }
        }
        if (container === "footer") {
          if (this.isTimerPanelShowingOnBottom && !this.isStartPageActive) {
            containerLayoutElements.push(layoutElement);
          }
        }
      } else if (this.state === "running" && isStrCiEqual(layoutElement.id, this.progressBarComponentName)) {
        if (this.questionsOnPageMode != "singlePage" || this.progressBarType == "questions") {
          const headerLayoutElement = this.findLayoutElement("advanced-header");
          const advHeader = headerLayoutElement && headerLayoutElement.data as Cover;
          let isBelowHeader = !advHeader || advHeader.hasBackground;
          if (isStrCiEqual(this.progressBarLocation, "aboveHeader")) {
            isBelowHeader = false;
          }
          if (isStrCiEqual(this.progressBarLocation, "belowHeader")) {
            isBelowHeader = true;
          }
          if (container === "header" && !isBelowHeader) {
            layoutElement.index = -150;
            if (this.isShowProgressBarOnTop && !this.isStartPageActive) {
              containerLayoutElements.push(layoutElement);
            }
          }
          if (container === "center" && isBelowHeader) {
            if (!!layoutElement.index) {
              delete layoutElement.index;
            }
            if (this.isShowProgressBarOnTop && !this.isStartPageActive) {
              containerLayoutElements.push(layoutElement);
            }
          }
          if (container === "footer") {
            if (this.isShowProgressBarOnBottom && !this.isStartPageActive) {
              containerLayoutElements.push(layoutElement);
            }
          }
        }
      } else if (isStrCiEqual(layoutElement.id, "buttons-navigation")) {
        if (container === "contentTop") {
          if (["top", "both"].indexOf(this.isNavigationButtonsShowing) !== -1) {
            containerLayoutElements.push(layoutElement);
          }
        }
        if (container === "contentBottom") {
          if (["bottom", "both"].indexOf(this.isNavigationButtonsShowing) !== -1) {
            containerLayoutElements.push(layoutElement);
          }
        }
      } else if (this.state === "running" && isStrCiEqual(layoutElement.id, "toc-navigation") && this.showTOC) {
        if (container === "left") {
          if (["left", "both"].indexOf(this.tocLocation) !== -1) {
            containerLayoutElements.push(layoutElement);
          }
        }
        if (container === "right") {
          if (["right", "both"].indexOf(this.tocLocation) !== -1) {
            containerLayoutElements.push(layoutElement);
          }
        }
      } else if (isStrCiEqual(layoutElement.id, "advanced-header")) {
        if ((this.state === "running" || this.state === "starting" || (this.showHeaderOnCompletePage === true && this.state === "completed")) && layoutElement.container === container) {
          containerLayoutElements.push(layoutElement);
        }
      } else {
        if (Array.isArray(layoutElement.container) && layoutElement.container.indexOf(container) !== -1 || layoutElement.container === container) {
          containerLayoutElements.push(layoutElement);
        }
      }
    }
    containerLayoutElements.sort((a, b) => (a.index || 0) - (b.index || 0));
    containerLayoutElements.forEach(el => {
      if(!!el.getData) {
        el.data = el.getData();
      }
    });
    return containerLayoutElements;
  }
  public processPopupVisiblityChanged(question: Question, popup: PopupModel<any>, visible: boolean): void {
    this.onPopupVisibleChanged.fire(this, { question, popup, visible });
  }
  public processOpenDropdownMenu(question: Question, options: IDropdownMenuOptions): void {
    const newOptions = Object.assign({ question }, options);
    this.onOpenDropdownMenu.fire(this, newOptions as OpenDropdownMenuEvent);
    options.menuType = newOptions.menuType;
  }
  public getCssTitleExpandableSvg(): string {
    return null;
  }

  /**
   * Applies a specified theme to the survey.
   *
   * [Themes & Styles](https://surveyjs.io/form-library/documentation/manage-default-themes-and-styles (linkStyle))
   * @param theme An [`ITheme`](https://surveyjs.io/form-library/documentation/api-reference/itheme) object with theme settings.
   */
  public applyTheme(theme: ITheme): void {
    if (!theme) return;

    Object.keys(theme).forEach((key: keyof ITheme) => {
      if (key === "header") {
        return;
      }
      if (key === "isPanelless") {
        this.isCompact = theme[key];
      } else {
        (this as any)[key] = theme[key];
      }
    });
    if (this.headerView === "advanced" || "header" in theme) {
      this.headerView = "advanced";
      this.removeLayoutElement("advanced-header");
      const advHeader = new Cover();
      advHeader.fromTheme(theme);
      this.insertAdvancedHeader(advHeader);
    }
    this.themeChanged(theme);
  }
  public themeChanged(theme: ITheme): void {
    this.getAllQuestions().forEach(q => q.themeChanged(theme));
  }

  private taskManager: SurveyTaskManagerModel = new SurveyTaskManagerModel();

  /**
   * Disposes of the survey model.
   *
   * Call this method to release resources if your application contains multiple survey models or if you re-create a survey model at runtime.
   */
  public dispose(): void {
    this.unConnectEditingObj();
    this.removeScrollEventListener();
    this.destroyResizeObserver();
    this.rootElement = undefined;
    if (this.layoutElements) {
      for (var i = 0; i < this.layoutElements.length; i++) {
        if (!!this.layoutElements[i].data && this.layoutElements[i].data !== this && this.layoutElements[i].data.dispose) {
          this.layoutElements[i].data.dispose();
        }
      }
      this.layoutElements.splice(0, this.layoutElements.length);
    }
    super.dispose();
    this.editingObj = null;
    if (!this.pages) return;
    this.currentPage = null;
    for (var i = 0; i < this.pages.length; i++) {
      this.pages[i].setSurveyImpl(undefined);
      this.pages[i].dispose();
    }
    this.pages.splice(0, this.pages.length);
    if (this.disposeCallback) {
      this.disposeCallback();
    }
  }
  disposeCallback: () => void;

  private onScrollCallback: () => void;
  // private _lastScrollTop = 0;
  public _isElementShouldBeSticky(selector: string): boolean {
    if (!selector) return false;
    const topStickyContainer = this.rootElement.querySelector(selector);
    if (!!topStickyContainer) {
      // const scrollDirection = this.rootElement.scrollTop > this._lastScrollTop ? "down" : "up";
      // this._lastScrollTop = this.rootElement.scrollTop;
      return this.rootElement.scrollTop > 0 && topStickyContainer.getBoundingClientRect().y <= this.rootElement.getBoundingClientRect().y;
    }
    return false;
  }
  public onScroll(): void {
    if (!!this.rootElement) {
      if (this._isElementShouldBeSticky(".sv-components-container-center")) {
        this.rootElement.classList && this.rootElement.classList.add("sv-root--sticky-top");
      } else {
        this.rootElement.classList && this.rootElement.classList.remove("sv-root--sticky-top");
      }
    }
    if (this.onScrollCallback) {
      this.onScrollCallback();
    }
  }
  public addScrollEventListener(): void {
    this.scrollHandler = () => { this.onScroll(); };
    this.rootElement.addEventListener("scroll", this.scrollHandler);
    if (!!this.rootElement.getElementsByTagName("form")[0]) {
      this.rootElement.getElementsByTagName("form")[0].addEventListener("scroll", this.scrollHandler);
    }
    if (!!this.css.rootWrapper) {
      this.rootElement.getElementsByClassName(this.css.rootWrapper)[0]?.addEventListener("scroll", this.scrollHandler);
    }
  }
  public removeScrollEventListener(): void {
    if (!!this.rootElement && !!this.scrollHandler) {
      this.rootElement.removeEventListener("scroll", this.scrollHandler);
      if (!!this.rootElement.getElementsByTagName("form")[0]) {
        this.rootElement.getElementsByTagName("form")[0].removeEventListener("scroll", this.scrollHandler);
      }
      if (!!this.css.rootWrapper) {
        this.rootElement.getElementsByClassName(this.css.rootWrapper)[0]?.removeEventListener("scroll", this.scrollHandler);
      }
    }
  }
  public questionErrorComponent = "sv-question-error";
}

function isStrCiEqual(a: string, b: string) {
  if (!a) return false;
  if (!b) return false;
  return a.toUpperCase() === b.toUpperCase();
}

Serializer.addClass("survey", [
  {
    name: "locale",
    choices: () => {
      return surveyLocalization.getLocales(true);
    },
    onGetValue: (obj: any): any => {
      return obj.locale == surveyLocalization.defaultLocale ? null : obj.locale;
    },
  },
  { name: "title", serializationProperty: "locTitle", dependsOn: "locale" },
  {
    name: "description:text",
    serializationProperty: "locDescription",
    dependsOn: "locale",
  },
  { name: "logo:file", serializationProperty: "locLogo" },
  { name: "logoWidth", default: "auto", minValue: 0 },
  { name: "logoHeight", default: "40px", minValue: 0 },
  {
    name: "logoFit",
    default: "contain",
    choices: ["none", "contain", "cover", "fill"],
  },
  {
    name: "logoPosition",
    default: "left",
    choices: ["none", "left", "right", "top", "bottom"],
  },
  { name: "autoFocusFirstQuestion:boolean", alternativeName: "focusFirstQuestionAutomatic" },
  { name: "autoFocusFirstError:boolean", default: true, alternativeName: "focusOnFirstError" },
  { name: "completedHtml:html", serializationProperty: "locCompletedHtml" },
  {
    name: "completedBeforeHtml:html",
    serializationProperty: "locCompletedBeforeHtml",
  },
  {
    name: "completedHtmlOnCondition:htmlconditions",
    className: "htmlconditionitem", isArray: true
  },
  { name: "loadingHtml:html", serializationProperty: "locLoadingHtml" },
  { name: "pages:surveypages", className: "page", isArray: true, onSerializeValue: (obj: any): any => { return obj.originalPages || obj.pages; } },
  {
    name: "elements",
    alternativeName: "questions",
    baseClassName: "question",
    visible: false,
    isLightSerializable: false,
    onGetValue: function (obj: any): any {
      return null;
    },
    onSetValue: function (obj: any, value: any, jsonConverter: any) {
      obj.pages.splice(0, obj.pages.length);
      var page = obj.addNewPage("");
      jsonConverter.toObject({ questions: value }, page, jsonConverter?.options);
    },
  },
  {
    name: "triggers:triggers",
    baseClassName: "surveytrigger",
    classNamePart: "trigger",
  },
  {
    name: "calculatedValues:calculatedvalues",
    className: "calculatedvalue", isArray: true
  },
  { name: "sjsVersion", visible: false },
  { name: "surveyId", visible: false },
  { name: "surveyPostId", visible: false },
  { name: "surveyShowDataSaving:boolean", visible: false },
  "cookieName",
  { name: "partialSendEnabled:boolean", alternativeName: "sendResultOnPageNext" },
  {
    name: "showNavigationButtons:boolean",
    default: true,
  },
  {
    name: "navigationButtonsLocation",
    default: "bottom",
    choices: ["top", "bottom", "topBottom"],
  },
  {
    name: "showPrevButton:boolean",
    default: true,
    visibleIf: (obj: any) => { return obj.showNavigationButtons !== "none"; }
  },
  { name: "showTitle:boolean", default: true },
  { name: "showPageTitles:boolean", default: true },
  { name: "showCompletePage:boolean", default: true, alternativeName: "showCompletedPage" },
  "navigateToUrl",
  {
    name: "navigateToUrlOnCondition:urlconditions",
    className: "urlconditionitem", isArray: true
  },
  {
    name: "questionOrder", alternativeName: "questionsOrder",
    default: "initial",
    choices: ["initial", "random"],
  },
  {
    name: "matrixDragHandleArea",
    visible: false,
    default: "entireItem",
    choices: ["entireItem", "icon"]
  },
  "showPageNumbers:boolean",
  {
    name: "showQuestionNumbers",
    default: "off",
    choices: ["on", "onPage", "off"],
  },
  {
    name: "questionTitleLocation",
    default: "top",
    choices: ["top", "bottom", "left"],
  },
  {
    name: "questionDescriptionLocation",
    default: "underTitle",
    choices: ["underInput", "underTitle"],
  },
  { name: "questionErrorLocation", default: "top", choices: ["top", "bottom"] },
  {
    name: "showProgressBar:boolean",
    default: false,
    onSetValue: (obj: any, value: any, jsonConv: any) => {
      obj && obj.setShowProgressBar(value);
    },

  },
  {
    name: "progressBarLocation",
    default: "auto",
    choices: ["auto", "aboveheader", "belowheader", "bottom", "topbottom"],
  },
  {
    name: "progressBarType",
    default: "pages",
    choices: [
      "pages",
      "questions",
      "requiredQuestions",
      "correctQuestions",
    ],
    visibleIf: (obj: any) => { return obj.showProgressBar; }
  },
  {
    name: "progressBarShowPageTitles:switch",
    category: "navigation",
    visibleIf: (obj: any) => { return obj.showProgressBar && obj.progressBarType === "pages"; }
  },
  {
    name: "progressBarShowPageNumbers:switch",
    default: false,
    category: "navigation",
    visibleIf: (obj: any) => { return obj.showProgressBar && obj.progressBarType === "pages"; }
  },
  {
    name: "progressBarInheritWidthFrom",
    default: "container",
    choices: ["container", "survey"],
    category: "navigation",
    visibleIf: (obj: any) => { return obj.showProgressBar && obj.progressBarType === "pages"; }
  },
  {
    name: "showTOC:switch",
    default: false
  },
  {
    name: "tocLocation", default: "left", choices: ["left", "right"],
    dependsOn: ["showTOC"],
    visibleIf: (survey: any) => { return !!survey && survey.showTOC; }
  },
  { name: "readOnly:boolean", default: false },
  { name: "mode", default: "edit", choices: ["edit", "display"], visible: false },
  { name: "storeOthersAsComment:boolean", default: true },
  { name: "maxTextLength:number", default: 0, minValue: 0 },
  { name: "maxCommentLength:number", default: 0, minValue: 0, alternativeName: "maxOthersLength" },
  {
    name: "autoAdvanceEnabled:boolean", alternativeName: "goNextPageAutomatic",
    onSetValue: function (obj: any, value: any) {
      if (value !== "autogonext") {
        value = Helpers.isTwoValueEquals(value, true);
      }
      if(value === "autogonext") {
        value = true;
      }
      obj.setPropertyValue("autoAdvanceEnabled", value);
    }
  },
  {
    name: "autoAdvanceAllowComplete:boolean", default: true, alternativeName: "allowCompleteSurveyAutomatic",
    visibleIf: (obj: any): boolean => obj.autoAdvanceEnabled === true
  },
  {
    name: "clearInvisibleValues",
    default: "onComplete",
    choices: ["none", "onComplete", "onHidden", "onHiddenContainer"],
  },
  {
    name: "checkErrorsMode",
    default: "onNextPage",
    choices: ["onNextPage", "onValueChanged", "onComplete"],
  },
  { name: "validateVisitedEmptyFields:boolean", dependsOn: "checkErrorsMode", visibleIf: (obj) => obj.checkErrorsMode === "onValueChanged" },
  {
    name: "textUpdateMode",
    default: "onBlur",
    choices: ["onBlur", "onTyping"],
  },
  { name: "autoGrowComment:boolean", default: false },
  { name: "allowResizeComment:boolean", default: true },
  { name: "commentAreaRows:number", minValue: 1 },
  {
    name: "startSurveyText",
    serializationProperty: "locStartSurveyText",
    visibleIf: (obj: any) => { return obj.firstPageIsStartPage; }
  },
  {
    name: "pagePrevText",
    serializationProperty: "locPagePrevText",
    visibleIf: (obj: any) => { return obj.showNavigationButtons !== "none" && obj.showPrevButton; }
  },
  {
    name: "pageNextText",
    serializationProperty: "locPageNextText",
    visibleIf: (obj: any) => { return obj.showNavigationButtons !== "none"; }
  },
  {
    name: "completeText",
    serializationProperty: "locCompleteText",
    visibleIf: (obj: any) => { return obj.showNavigationButtons !== "none"; }
  },
  {
    name: "previewText",
    serializationProperty: "locPreviewText",
    visibleIf: (obj: any) => { return obj.showPreviewBeforeComplete; }
  },
  {
    name: "editText",
    serializationProperty: "locEditText",
    visibleIf: (obj: any) => { return obj.showPreviewBeforeComplete; }
  },
  { name: "requiredMark", default: "*", alternativeName: "requiredText" },
  {
    name: "questionStartIndex",
    dependsOn: ["showQuestionNumbers"],
    visibleIf: (survey: any) => { return !survey || survey.showQuestionNumbers !== "off"; }
  },
  {
    name: "questionTitlePattern",
    default: "numTitleRequire",
    dependsOn: ["questionStartIndex", "requiredMark"],
    choices: (obj: any) => {
      if (!obj) return [];
      return obj.getQuestionTitlePatternOptions();
    },
  },
  {
    name: "questionTitleTemplate",
    visible: false,
    isSerializable: false,
    serializationProperty: "locQuestionTitleTemplate",
  },
  { name: "firstPageIsStartPage:boolean", default: false, alternativeName: "firstPageIsStarted" },
  {
    name: "isSinglePage:boolean",
    default: false,
    visible: false,
    isSerializable: false,
  },
  {
    name: "questionsOnPageMode",
    default: "standard",
    choices: ["standard", "singlePage", "questionPerPage", "inputPerPage"],
  },
  {
    name: "showPreviewBeforeComplete:boolean",
    default: false,
    onSetValue: (obj: any, value: any, jsonConv: any) => {
      obj && obj.setShowPreviewBeforeComplete(value);
    },
  },
  {
    name: "previewMode",
    default: "allQuestions",
    choices: ["allQuestions", "answeredQuestions"],
    visibleIf: (obj: any) => { return obj.showPreviewBeforeComplete; }
  },
  { name: "showTimer:boolean" },
  { name: "timeLimit:number", alternativeName: "maxTimeToFinish", default: 0, minValue: 0, enableIf: (obj) => obj.showTimer },
  { name: "timeLimitPerPage:number", alternativeName: "maxTimeToFinishPage", default: 0, minValue: 0, enableIf: (obj) => obj.showTimer },
  { name: "timerLocation", default: "top", choices: ["top", "bottom"], enableIf: (obj) => obj.showTimer },
  { name: "timerInfoMode", alternativeName: "showTimerPanelMode",
    default: "combined", choices: ["page", "survey", "combined"], enableIf: (obj) => obj.showTimer },
  { name: "showTimerPanel", visible: false, isSerializable: false },
  {
    name: "widthMode",
    default: "auto",
    choices: ["auto", "static", "responsive"],
  },
  { name: "gridLayoutEnabled:boolean", default: false },
  { name: "width", visibleIf: (obj: any) => { return obj.widthMode === "static"; } },
  { name: "fitToContainer:boolean", default: true, visible: false },
  { name: "headerView", default: "basic", choices: ["basic", "advanced"], visible: false },
  { name: "backgroundImage:file", visible: false },
  { name: "backgroundImageFit", default: "cover", choices: ["auto", "contain", "cover"], visible: false },
  { name: "backgroundImageAttachment", default: "scroll", choices: ["scroll", "fixed"], visible: false },
  { name: "backgroundOpacity:number", minValue: 0, maxValue: 1, default: 1, visible: false },
  { name: "showBrandInfo:boolean", default: false, visible: false }
]);
