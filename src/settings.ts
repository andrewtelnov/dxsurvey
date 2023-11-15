import { IDialogOptions } from "./popup";
import { showConfirmDialog } from "./utils/utils";

export type ISurveyEnvironment = {
  root: Document | ShadowRoot,
  rootElement: HTMLElement | ShadowRoot,
  popupMountContainer: HTMLElement | string,
  svgMountContainer: HTMLElement | string,
  stylesSheetsMountContainer: HTMLElement,
}
const document = globalThis.document;
const defaultEnvironment: ISurveyEnvironment = <ISurveyEnvironment>(!!document ? {
  root: document,

  _rootElement: document.body,
  get rootElement(): HTMLElement | ShadowRoot {
    return this._rootElement ?? document.body;
  },
  set rootElement(rootElement: HTMLElement | ShadowRoot) {
    (this._rootElement as any) = rootElement;
  },

  _popupMountContainer: document.body,
  get popupMountContainer(): HTMLElement | string {
    return this._popupMountContainer ?? document.body;
  },
  set popupMountContainer(popupMountContainer: HTMLElement | string) {
    (this._popupMountContainer as any) = popupMountContainer;
  },
  svgMountContainer: document.head,
  stylesSheetsMountContainer: document.head,
} : undefined);
const columnWidthsByType: { [index: string]: { minWidth?: string, width?: string } } = {
  "file": { minWidth: "240px" },
  "comment": { minWidth: "200px" }
};
/**
 * Global settings that apply to all surveys on the page. To specify one of the settings, use the code below:
 *
 * ```js
 * import { settings } from "survey-core";
 *
 * settings.settingName = "value";
 * ```
 */

export var settings = {
  /**
   * An object that configures survey appearance when the survey is being designed in Survey Creator.
   *
   * Nested properties:
   *
   * - `showEmptyDescriptions`: `boolean`\
   * Specifies whether to display an empty description for pages and panels. Default value: `true`.
   *
   * - `showEmptyTitles`: `boolean`\
   * Specifies whether to display an empty title for pages and panels. Default value: `true`.
   */
  designMode: {
    showEmptyDescriptions: true,
    showEmptyTitles: true
  },
  //#region designMode section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.designMode.showEmptyDescriptions`](https://surveyjs.io/form-library/documentation/api-reference/settings#designMode) property instead.
   */
  get allowShowEmptyDescriptionInDesignMode(): boolean { return this.designMode.showEmptyDescriptions; },
  set allowShowEmptyDescriptionInDesignMode(val: boolean) { this.designMode.showEmptyDescriptions = val; },
  /**
   * This property is obsolete. Use the [`settings.designMode.showEmptyTitles`](https://surveyjs.io/form-library/documentation/api-reference/settings#designMode) property instead.
   */
  get allowShowEmptyTitleInDesignMode(): boolean { return this.designMode.showEmptyTitles; },
  set allowShowEmptyTitleInDesignMode(val: boolean) { this.designMode.showEmptyTitles = val; },
  //#endregion

  /**
   * An object that contains properties related to localization.
   *
   * Nested properties:
   *
   * - `useLocalTimeZone`: `boolean`\
   * Disable this property if you want internal SurveyJS functions to use methods that work with UTC date and time (`setUTCDate()` `setUTCHours()`, etc.) instead of methods that work with local date and time (`setYear`, `setHours()`, etc.). Default value: `true`.
   *
   * - `defaultLocaleName`: `string`\
   * A property key that stores a translation for the default locale. Default value: `"default"`.
   *
   * - `storeDuplicatedTranslations`: `boolean`\
   * Specifies whether surveys should store translation strings that equal the translation strings in the default locale. Default value: `false`.
   */
  localization: {
    useLocalTimeZone: true,
    storeDuplicatedTranslations: false,
    defaultLocaleName: "default"
  },
  //#region localization section, obsolete properties
  /**
   * This property is obsolete. Use the [`settings.localization.useLocalTimeZone`](https://surveyjs.io/form-library/documentation/api-reference/settings#localization) property instead.
   */
  get useLocalTimeZone(): boolean { return this.localization.useLocalTimeZone; },
  set useLocalTimeZone(val: boolean) { this.localization.useLocalTimeZone = val; },
  /**
   * This property is obsolete. Use the [`settings.localization.storeDuplicatedTranslations`](https://surveyjs.io/form-library/documentation/api-reference/settings#localization) property instead.
   */
  get storeDuplicatedTranslations(): boolean { return this.localization.storeDuplicatedTranslations; },
  set storeDuplicatedTranslations(val: boolean) { this.localization.storeDuplicatedTranslations = val; },
  /**
   * This property is obsolete. Use the [`settings.localization.defaultLocaleName`](https://surveyjs.io/form-library/documentation/api-reference/settings#localization) property instead.
   */
  get defaultLocaleName(): string { return this.localization.defaultLocaleName; },
  set defaultLocaleName(val: string) { this.localization.defaultLocaleName = val; },
  //#endregion
  /**
   * An object with properties that configure surveys when they work with a web service.
   *
   * Nested properties:
   *
   * - `encodeUrlParams`: `boolean`\
   * Specifies whether to encode URL parameters when you access a web service. Default value: `true`.
   *
   * - `cacheLoadedChoices`: `boolean`\
   * Specifies whether to cache [choices](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model#choicesByUrl) loaded from a web service. Default value: `true`.
   *
   * - `disableQuestionWhileLoadingChoices`: `boolean`\
   * Disables a question while its choices are being loaded from a web service. Default value: `false`.
   *
   * - `surveyServiceUrl`: `string`\
   * The URL of the SurveyJS Service API endpoint.
   */
  web: {
    encodeUrlParams: true,
    cacheLoadedChoices: true,
    disableQuestionWhileLoadingChoices: false,
    surveyServiceUrl: "https://api.surveyjs.io/public/v1/Survey"
  },
  //#region web section, obsolete properties
  /**
   * This property is obsolete. Use the [`settings.web.encodeUrlParams`](https://surveyjs.io/form-library/documentation/api-reference/settings#web) property instead.
   */
  get webserviceEncodeParameters(): boolean { return this.web.encodeUrlParams; },
  set webserviceEncodeParameters(val: boolean) { this.web.encodeUrlParams = val; },
  /**
   * This property is obsolete. Use the [`settings.web.cacheLoadedChoices`](https://surveyjs.io/form-library/documentation/api-reference/settings#web) property instead.
   */
  get useCachingForChoicesRestful(): boolean { return this.web.cacheLoadedChoices; },
  set useCachingForChoicesRestful(val: boolean) { this.web.cacheLoadedChoices = val; },
  get useCachingForChoicesRestfull(): boolean { return this.web.cacheLoadedChoices; },
  set useCachingForChoicesRestfull(val: boolean) { this.web.cacheLoadedChoices = val; },
  /**
   * This property is obsolete. Use the [`settings.web.disableQuestionWhileLoadingChoices`](https://surveyjs.io/form-library/documentation/api-reference/settings#web) property instead.
   */
  get disableOnGettingChoicesFromWeb(): boolean { return this.web.disableQuestionWhileLoadingChoices; },
  set disableOnGettingChoicesFromWeb(val: boolean) { this.web.disableQuestionWhileLoadingChoices = val; },
  /**
   * This property is obsolete. Use the [`settings.web.surveyServiceUrl`](https://surveyjs.io/form-library/documentation/api-reference/settings#web) property instead.
   */
  get surveyServiceUrl(): string { return this.web.surveyServiceUrl; },
  set surveyServiceUrl(val: string) { this.web.surveyServiceUrl = val; },
  //#endregion

  /**
   * An object that contains properties related to [triggers](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#conditional-survey-logic-triggers).
   *
   * Nested properties:
   *
   * - `changeNavigationButtonsOnComplete`: `boolean`\
   * Specifies whether to re-evaluate an expression associated with the [Complete trigger](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#complete) immediately when a question value changes. If the expression evaluates to `true`, the trigger is executed. Default value: `false`.\
   * Keep this property set to `false` if you want to re-evaluate the Complete trigger's expression only when the respondents navigate to another page.
   *
   * - `executeCompleteOnValueChanged`: `boolean`\
   * Specifies whether to replace the Next button with the Complete button when the [Complete trigger](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#complete) is going to be executed. Default value: `true`.
   *
   * - `executeSkipOnValueChanged`: `boolean`\
   * Specifies whether to re-evaluate an expression associated with the [Skip trigger](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic#skip) immediately when a question value changes. If the expression evaluates to `true`, the trigger is executed. Default value: `true`.\
   * Disable this property if you want to re-evaluate the Skip trigger's expression only when respondents navigate to another page.
   */
  triggers: {
    changeNavigationButtonsOnComplete: true,
    executeCompleteOnValueChanged: false,
    executeSkipOnValueChanged: true
  },
  //#region triggers section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.triggers.executeCompleteOnValueChanged`](https://surveyjs.io/form-library/documentation/api-reference/settings#triggers) property instead.
   */
  get executeCompleteTriggerOnValueChanged(): boolean { return this.triggers.executeCompleteOnValueChanged; },
  set executeCompleteTriggerOnValueChanged(val: boolean) { this.triggers.executeCompleteOnValueChanged = val; },
  /**
   * This property is obsolete. Use the [`settings.triggers.changeNavigationButtonsOnComplete`](https://surveyjs.io/form-library/documentation/api-reference/settings#triggers) property instead.
   */
  get changeNavigationButtonsOnCompleteTrigger(): boolean { return this.triggers.changeNavigationButtonsOnComplete; },
  set changeNavigationButtonsOnCompleteTrigger(val: boolean) { this.triggers.changeNavigationButtonsOnComplete = val; },
  /**
   * This property is obsolete. Use the [`settings.triggers.executeSkipOnValueChanged`](https://surveyjs.io/form-library/documentation/api-reference/settings#triggers) property instead.
   */
  get executeSkipTriggerOnValueChanged(): boolean { return this.triggers.executeSkipOnValueChanged; },
  set executeSkipTriggerOnValueChanged(val: boolean) { this.triggers.executeSkipOnValueChanged = val; },
  //#endregion

  /**
   * An object that contains properties related to JSON serialization.
   *
   * Nested properties:
   *
   * - `itemValueSerializeAsObject`: `boolean`\
   * Enable this property if you want to serialize [`ItemValue`](https://surveyjs.io/form-library/documentation/api-reference/itemvalue) instances as objects even when they include only the `value` property. Default value: `false`. View an example below.
   *
   * - `itemValueSerializeDisplayText`: `boolean`\
   * Enable this property if you want to serialize the `text` property of [`ItemValue`](https://surveyjs.io/form-library/documentation/api-reference/itemvalue) objects even when it is empty or equal to the `value` property. Default value: `false`. View an example below.
   *
   * - `localizableStringSerializeAsObject`: `boolean`\
   * Enable this property if you want to serialize [`LocalizableString`](https://surveyjs.io/form-library/documentation/api-reference/localizablestring) instances as objects even when they include only a translation string for the default locale. For example, `"Custom String"` will be serialized as `{ default: "Custom String" }`. Default value: `false`.
   *
   * ```js
   * import { ItemValue, settings } from "survey-core";
   *
   * // `itemValueSerializeAsObject` example
   * settings.localization.itemValueSerializeAsObject = true;
   * const item = new ItemValue(5);
   * const itemString = item.toJSON(); // Produces { value: 5 } instead of 5
   *
   * // `itemValueSerializeDisplayText` example
   * settings.localization.itemValueSerializeDisplayText = true;
   * const item = new ItemValue("item1");
   * const itemString = item.toJSON(); // Produces { value: "item1", text: "item1" } instead of "item1"
   * ```
   */
  serialization: {
    itemValueSerializeAsObject: false,
    itemValueSerializeDisplayText: false,
    localizableStringSerializeAsObject: false
  },
  //#region serialization section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.serialization.itemValueSerializeAsObject`](https://surveyjs.io/form-library/documentation/api-reference/settings#serialization) property instead.
   */
  get itemValueAlwaysSerializeAsObject(): boolean { return this.serialization.itemValueSerializeAsObject; },
  set itemValueAlwaysSerializeAsObject(val: boolean) { this.serialization.itemValueSerializeAsObject = val; },
  /**
   * This property is obsolete. Use the [`settings.serialization.itemValueSerializeDisplayText`](https://surveyjs.io/form-library/documentation/api-reference/settings#serialization) property instead.
   */
  get itemValueAlwaysSerializeText(): boolean { return this.serialization.itemValueSerializeDisplayText; },
  set itemValueAlwaysSerializeText(val: boolean) { this.serialization.itemValueSerializeDisplayText = val; },
  /**
   * This property is obsolete. Use the [`settings.serialization.localizableStringSerializeAsObject`](https://surveyjs.io/form-library/documentation/api-reference/settings#serialization) property instead.
   */
  get serializeLocalizableStringAsObject(): boolean { return this.serialization.localizableStringSerializeAsObject; },
  set serializeLocalizableStringAsObject(val: boolean) { this.serialization.localizableStringSerializeAsObject = val; },
  //#endregion
  /**
   * An object that configures lazy rendering.
   *
   * Nested properties:
   *
   * - `enabled`: `boolean`\
   * Specifies whether to add questions to the DOM only when they get into the viewport. Default value: `false`.
   *
   * > Lazy rendering is an experimental feature that may not work as expected in all use cases.
   */
  lazyRender: {
    enabled: false,
    firstBatchSize: 3
  },
  //#region lazyRender section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.lazyRender.enabled`](https://surveyjs.io/form-library/documentation/api-reference/settings#lazyRender) property instead.
   */
  get lazyRowsRendering(): boolean { return this.lazyRender.enabled; },
  set lazyRowsRendering(val: boolean) { this.lazyRender.enabled = val; },
  get lazyRowsRenderingStartRow(): number { return this.lazyRender.firstBatchSize; },
  set lazyRowsRenderingStartRow(val: number) { this.lazyRender.firstBatchSize = val; },
  //#endregion
  /**
   * An object with properties that apply to [Single-Choice](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-question-model), [Multiple-Choice](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list), and [Dynamic Matrix](https://surveyjs.io/form-library/documentation/api-reference/dynamic-matrix-table-question-model) questions.
   *
   * Nested properties:
   *
   * - `defaultRowName`: `string`\
   * A property key that stores an object with default cell values. Default value: "default".
   *
   * - `defaultCellType`: `string`\
   * The default type of matrix cells. Default value: `"dropdown"`.\
   * You can specify this setting for individual questions or matrix columns: [`cellType`](https://surveyjs.io/form-library/documentation/api-reference/dynamic-matrix-table-question-model#cellType). Refer to the `cellType` property description for information on possible values.
   *
   * - `totalsSuffix`: `string`\
   * A suffix added to the name of the property that stores total values. The resulting property name consists of the matrix name and the suffix. Default value: `"-total"`.
   *
   * - `maxRowCount`: `number`\
   * A maximum number of rows in a Dynamic Matrix. Default value: 1000.\
   * You can specify this setting for an individual Dynamic Matrix: [`maxRowCount`](https://surveyjs.io/form-library/documentation/api-reference/dynamic-matrix-table-question-model#maxRowCount).
   *
   * - `maxRowCountInCondition`: `number`\
   * A maximum number of matrix rows included in the Condition drop-down menu in Survey Creator. This menu is used to configure conditional survey logic. Default value: 1.\
   * If you set this property to 0, the Condition menu does not include any matrix rows. Users still can specify conditions that use matrix rows but only with Manual Entry.
   *
   * - `renderRemoveAsIcon`: `boolean`\
   * Disable this property if you want to render the Remove action in Dynamic Matrix as a button. Otherwise, the action is rendered as an icon. Default value: `true`.
   *
   * - `columnWidthsByType`: `object`\
   * An object that specifies fixed and minimum column width based on the column type.\
   * Example: `settings.matrix.columnWidthsByType = { "tagbox": { minWidth: "240px", width: "300px" } }`
   *
   * - `rateSize`: `"small"` (default) | `"normal"`\
   * Specifies the size of rate values. Applies to [Rating Scale](https://surveyjs.io/form-library/examples/rating-scale/) questions within matrixes.
   */
  matrix: {
    defaultCellType: "dropdown",
    defaultRowName: "default",
    totalsSuffix: "-total",
    maxRowCount: 1000,
    maxRowCountInCondition: 1,
    renderRemoveAsIcon: true,
    columnWidthsByType: columnWidthsByType,
    rateSize: "small" as "small" | "normal",
  },
  //#region matrix section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.matrix.defaultRowName`](https://surveyjs.io/form-library/documentation/api-reference/settings#matrix) property instead.
   */
  get matrixDefaultRowName(): string { return this.matrix.defaultRowName; },
  set matrixDefaultRowName(val: string) { this.matrix.defaultRowName = val; },
  /**
   * This property is obsolete. Use the [`settings.matrix.defaultCellType`](https://surveyjs.io/form-library/documentation/api-reference/settings#matrix) property instead.
   */
  get matrixDefaultCellType(): string { return this.matrix.defaultCellType; },
  set matrixDefaultCellType(val: string) { this.matrix.defaultCellType = val; },
  /**
   * This property is obsolete. Use the [`settings.matrix.totalsSuffix`](https://surveyjs.io/form-library/documentation/api-reference/settings#matrix) property instead.
   */
  get matrixTotalValuePostFix(): string { return this.matrix.totalsSuffix; },
  set matrixTotalValuePostFix(val: string) { this.matrix.totalsSuffix = val; },
  /**
   * This property is obsolete. Use the [`settings.matrix.maxRowCount`](https://surveyjs.io/form-library/documentation/api-reference/settings#matrix) property instead.
   */
  get matrixMaximumRowCount(): number { return this.matrix.maxRowCount; },
  set matrixMaximumRowCount(val: number) { this.matrix.maxRowCount = val; },
  /**
   * This property is obsolete. Use the [`settings.matrix.maxRowCountInCondition`](https://surveyjs.io/form-library/documentation/api-reference/settings#matrix) property instead.
   */
  get matrixMaxRowCountInCondition(): number { return this.matrix.maxRowCountInCondition; },
  set matrixMaxRowCountInCondition(val: number) { this.matrix.maxRowCountInCondition = val; },
  /**
   * This property is obsolete. Use the [`settings.matrix.renderRemoveAsIcon`](https://surveyjs.io/form-library/documentation/api-reference/settings#matrix) property instead.
   */
  get matrixRenderRemoveAsIcon(): boolean { return this.matrix.renderRemoveAsIcon; },
  set matrixRenderRemoveAsIcon(val: boolean) { this.matrix.renderRemoveAsIcon = val; },
  //#endregion
  /**
   * An object with properties that apply to [Dynamic Panel](https://surveyjs.io/form-library/documentation/api-reference/dynamic-panel-model) questions.
   *
   * Nested properties:
   *
   * - `maxPanelCount`: `number`\
   * A maximum number of panels in Dynamic Panel. Default value: 100.\
   * You can specify this setting for an individual Dynamic Panel: [`maxPanelCount`](https://surveyjs.io/form-library/documentation/api-reference/dynamic-panel-model#maxPanelCount).
   *
   * - `maxPanelCountInCondition`: `number`\
   * A maximum number of Dynamic Panel panels included in the Condition drop-down menu in Survey Creator. This menu is used to configure conditional survey logic. Default value: 1.\
   * If you set this property to 0, the Condition menu does not include any panel questions. Users still can specify conditions that use panel questions but only with Manual Entry.
   */
  panel: {
    maxPanelCount: 100,
    maxPanelCountInCondition: 1
  },
  //#region panel section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.panel.maxPanelCountInCondition`](https://surveyjs.io/form-library/documentation/api-reference/settings#panel) property instead.
   */
  get panelDynamicMaxPanelCountInCondition(): number { return this.panel.maxPanelCountInCondition; },
  set panelDynamicMaxPanelCountInCondition(val: number) { this.panel.maxPanelCountInCondition = val; },
  /**
   * This property is obsolete. Use the [`settings.panel.maxPanelCount`](https://surveyjs.io/form-library/documentation/api-reference/settings#panel) property instead.
   */
  get panelMaximumPanelCount(): number { return this.panel.maxPanelCount; },
  set panelMaximumPanelCount(val: number) { this.panel.maxPanelCount = val; },
  //#endregion
  /**
   * An object with properties that configure questions in read-only mode.
   *
   * Nested properties:
   *
   * - `commentRenderMode`: `"textarea"` (default) | `"div"`\
   * Specifies how to render the input field of [Comment](https://surveyjs.io/form-library/documentation/api-reference/comment-field-model) questions in [read-only](https://surveyjs.io/form-library/documentation/api-reference/comment-field-model#readOnly) mode: as a disabled `<textarea>` element or as a `<div>` element with a non-editable question value within it.
   *
   * - `textRenderMode`: `"input"` (default) | `"div"`\
   * Specifies how to render the input field of [Text](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model) questions in [read-only](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model#readOnly) mode: as a disabled `<input>` element or as a `<div>` element with a non-editable question value within it.
   */
  readOnly: {
    enableValidation: false,
    commentRenderMode: "textarea",
    textRenderMode: "input"
  },
  //#region readOnly section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.readOnly.commentRenderMode`](https://surveyjs.io/form-library/documentation/api-reference/settings#readOnly) property instead.
   */
  get readOnlyCommentRenderMode(): string { return this.readOnly.commentRenderMode; },
  set readOnlyCommentRenderMode(val: string) { this.readOnly.commentRenderMode = val; },
  /**
   * This property is obsolete. Use the [`settings.readOnly.textRenderMode`](https://surveyjs.io/form-library/documentation/api-reference/settings#readOnly) property instead.
   */
  get readOnlyTextRenderMode(): string { return this.readOnly.textRenderMode; },
  set readOnlyTextRenderMode(val: string) { this.readOnly.textRenderMode = val; },
  //#endregion
  /**
   * An object with properties that configure question numbering.
   *
   * Nested properties:
   *
   * - `includeQuestionsWithHiddenNumber`: `boolean`\
   * Specifies whether to number questions whose [`hideNumber`](https://surveyjs.io/form-library/documentation/api-reference/question#hideNumber) property is enabled. Default value: `false`.
   *
   * - `includeQuestionsWithHiddenTitle`: `boolean`\
   * Specifies whether to number questions whose [`titleLocation`](https://surveyjs.io/form-library/documentation/api-reference/question#titleLocation) property is set to `"hidden"`. Default value: `false`.
   */
  numbering: {
    includeQuestionsWithHiddenNumber: false,
    includeQuestionsWithHiddenTitle: false
  },
  //#region numbering section, Obsolete properties
  /**
   * This property is obsolete. Use the [`settings.numbering.includeQuestionsWithHiddenTitle`](https://surveyjs.io/form-library/documentation/api-reference/settings#numbering) property instead.
   */
  get setQuestionVisibleIndexForHiddenTitle(): boolean { return this.numbering.includeQuestionsWithHiddenTitle; },
  set setQuestionVisibleIndexForHiddenTitle(val: boolean) { this.numbering.includeQuestionsWithHiddenTitle = val; },
  /**
   * This property is obsolete. Use the [`settings.numbering.includeQuestionsWithHiddenNumber`](https://surveyjs.io/form-library/documentation/api-reference/settings#numbering) property instead.
   */
  get setQuestionVisibleIndexForHiddenNumber(): boolean { return this.numbering.includeQuestionsWithHiddenNumber; },
  set setQuestionVisibleIndexForHiddenNumber(val: boolean) { this.numbering.includeQuestionsWithHiddenNumber = val; },
  //#endregion
  /**
   * Specifies an action to perform when users press the Enter key within a survey.
   *
   * Possible values:
   *
   * - `"moveToNextEditor"` - Moves focus to the next editor.
   * - `"loseFocus"` - Removes focus from the current editor.
   * - `"default"` - Behaves as a standard `<input>` element.
   */
  enterKeyAction: "default" as "moveToNextEditor" | "loseFocus" | "default",
  /**
   * An object that configures string comparison.
   *
   * Nested properties:
   *
   * - `trimStrings`: `boolean`\
   * Specifies whether to remove whitespace from both ends of a string before the comparison. Default value: `true`.
   *
   * - `caseSensitive`: `boolean`\
   * Specifies whether to differentiate between capital and lower-case letters. Default value: `false`.
   */
  comparator: {
    trimStrings: true,
    caseSensitive: false,
    normalizeTextCallback: (str: string, reason: string): string => { return str; }
  },
  expressionDisableConversionChar: "#",
  get commentPrefix(): string { return settings.commentSuffix; },
  set commentPrefix(val: string) { settings.commentSuffix = val; },
  /**
   * A suffix added to the name of the property that stores comments.
   *
   * Default value: "-Comment"
   *
   * You can specify this setting for an individual survey: [`commentSuffix`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#commentSuffix).
   */
  commentSuffix: "-Comment",
  /**
   * A separator used in a shorthand notation that specifies a value and display text for an [`ItemValue`](https://surveyjs.io/form-library/documentation/api-reference/itemvalue) object: `"value|text"`.
   *
   * Default value: `"|"`
   */
  itemValueSeparator: "|",
  /**
   * A maximum number of rate values in a [Rating](https://surveyjs.io/form-library/documentation/api-reference/rating-scale-question-model) question.
   *
   * Default value: 20
   */
  ratingMaximumRateValueCount: 20,
  /**
   * Specifies whether to close the drop-down menu of a [TagBox](https://surveyjs.io/form-library/examples/how-to-create-multiselect-tag-box/) question after a user selects a value.
   *
   * This setting applies to all TagBox questions on a page. You can use the [closeOnSelect](https://surveyjs.io/form-library/documentation/api-reference/dropdown-tag-box-model#closeOnSelect) property to specify the same setting for an individual TagBox question.
   */
  tagboxCloseOnSelect: false,
  /**
   * A property that allows you to display a custom confirm dialog.
   *
   * Set this property to a function that renders your custom dialog window. This function should return `true` if a user confirms an action or `false` otherwise.
   * @param message A message to be displayed in the confirm dialog window.
   */
  confirmActionFunc: function (message: string): boolean {
    return confirm(message);
  },
  /**
   * A property that allows you to display a custom confirm dialog in async mode or activate the standard browser dialog.
   *
   * To display a custom confirm dialog, set this property to a function that renders it. This function should return `true` to be enabled; otherwise, a survey executes the [`confirmActionFunc`](#confirmActionFunc) function. Pass the dialog result as the `callback` parameter: `true` if a user confirms an action, `false` otherwise.
   *
   * To activate the standard browser dialog, set the `confirmActionAsync` property to a function that returns `false`. With this configuration, a survey falls back to the [`confirmActionFunc`](#confirmActionFunc) function, which renders the standard browser dialog by default.
   *
   * ```js
   * import { settings } from "survey-core";
   *
   * // Display the standard browser dialog
   * settings.confirmActionAsync = () => {
   *    return false;
   * }
   * ```
   * @param message A message to be displayed in the confirm dialog window.
   * @param callback A callback function that should be called with `true` if a user confirms an action or `false` otherwise.
   */
  confirmActionAsync: function (message: string, callback: (res: boolean) => void, applyTitle?: string): boolean {
    return showConfirmDialog(message, callback, applyTitle);
  },
  /**
   * A minimum width value for all survey elements.
   *
   * Default value: `"300px"`
   *
   * You can override this setting for individual elements: [`minWidth`](https://surveyjs.io/form-library/documentation/api-reference/surveyelement#minWidth).
   */
  minWidth: "300px",
  /**
   * A maximum width value for all survey elements.
   *
   * Default value: `"100%"`
   *
   * You can override this setting for individual elements: [`maxWidth`](https://surveyjs.io/form-library/documentation/api-reference/surveyelement#maxWidth).
   */
  maxWidth: "100%",
  /**
   * Specifies how many times surveys can re-evaluate expressions when a question value changes. This limit helps avoid recursions in expressions.
   *
   * Default value: 10
   */
  maxConditionRunCountOnValueChanged: 10,
  /**
   * An object that configures notifications.
   *
   * Nested properties:
   *
   * - `lifetime`: `number`\
   * Specifies a time period during which a notification is displayed; measured in milliseconds.
   */
  notifications: {
    lifetime: 2000
  },
  /**
   * Specifies how many milliseconds a survey should wait before it automatically switches to the next page. Applies only when [auto-advance](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#goNextPageAutomatic) is enabled.
   *
   * Default value: 300
   */
  autoAdvanceDelay: 300,
  /**
   * Specifies the direction in which to lay out Checkbox and Radiogroup items. This setting affects the resulting UI when items are arranged in [more than one column](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model#colCount).
   *
   * Possible values:
   *
   * - `"row"` (default) - Items fill the current row, then move on to the next row.
   * - `"column"` - Items fill the current column, then move on to the next column.
   */
  showItemsInOrder: "default",
  /**
   * A value to save in survey results when respondents select the None choice item.
   *
   * Default value: `"none"`
   */
  noneItemValue: "none",
  /**
   * An object whose properties specify the order of the special choice items (None, Other, Select All) in select-based questions.
   *
   * Default value: `{ selectAllItem: [-1], noneItem: [1], otherItem: [2] }`
   *
   * Use this object to reorder special choices. Each property accepts an array of integer numbers. Negative numbers place a special choice item above regular choice items, positive numbers place it below them. For instance, the code below specifies the following order of choices: None, Select All, regular choices, Other.
   *
   * ```js
   * import { settings } from "survey-core";
   *
   * settings.specialChoicesOrder.noneItem = [-2];
   * settings.specialChoicesOrder.selectAllItem = [-1];
   * settings.specialChoicesOrder.otherItem = [1];
   * ```
   *
   * If you want to duplicate a special choice item above and below other choices, add two numbers to the corresponding array:
   *
   * ```js
   * settings.specialChoicesOrder.selectAllItem = [-1, 3] // Displays Select All above and below other choices
   * ```
   */
  specialChoicesOrder: {
    selectAllItem: [-1],
    noneItem: [1],
    otherItem: [2]
  },
  /**
   * A list of supported validators by question type.
   */
  supportedValidators: {
    question: ["expression"],
    comment: ["text", "regex"],
    text: ["numeric", "text", "regex", "email"],
    checkbox: ["answercount"],
    imagepicker: ["answercount"],
  },
  /**
   * Specifies a minimum date that users can enter into a [Text](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model) question with [`inputType`](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model#inputType) set to `"date"` or `"datetime-local"`. Set this property to a string with the folllowing format: `"yyyy-mm-dd"`.
   */
  minDate: "",
  /**
   * Specifies a maximum date that users can enter into a [Text](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model) question with [`inputType`](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model#inputType) set to `"date"` or `"datetime-local"`. Set this property to a string with the folllowing format: `"yyyy-mm-dd"`.
   */
  maxDate: "",
  showModal: <
    (
      componentName: string,
      data: any,
      onApply: () => boolean,
      onCancel?: () => void,
      cssClass?: string,
      title?: string,
      displayMode?: "popup" | "overlay"
    ) => any
    >undefined,
  showDialog: <(options: IDialogOptions, rootElement?: HTMLElement) => any>undefined,
  supportCreatorV2: false,
  showDefaultItemsInCreatorV2: true,
  /**
   * An object that specifies icon replacements. Object keys are built-in icon names. To use a custom icon, assign its name to the key of the icon you want to replace:
   *
   * ```js
   * import { settings } from "survey-core";
   *
   * settings.customIcons["icon-redo"] = "custom-redo-icon";
   * ```
   *
   * For more information about icons in SurveyJS, refer to the following help topic: [UI Icons](https://surveyjs.io/form-library/documentation/icons).
   */
  customIcons: {},
  /**
   * Specifies which part of a choice item responds to a drag gesture in Ranking questions.
   *
   * Possible values:
   *
   * - `"entireItem"` (default) - Users can use the entire choice item as a drag handle.
   * - `"icon"` - Users can only use the choice item icon as a drag handle.
   */
  rankingDragHandleArea: "entireItem",

  environment: defaultEnvironment,

  /**
   * Allows you to hide the maximum length indicator in text input questions.
   *
   * If you specify a question's [`maxLength`](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model#maxLength) property or a survey's [`maxTextLength`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#maxTextLength) property, text input questions indicate the number of entered characters and the character limit. Assign `false` to the `settings.showMaxLengthIndicator` property if you want to hide this indicator.
   *
   * Default value: `true`
   */
  showMaxLengthIndicator: true,

  /**
   * An object that specifies heading levels (`<h1>`, `<h2>`, etc.) to use when rendering survey, page, panel, and question titles.
   *
   * Default value: `{ survey: "h3", page: "h4", panel: "h4", question: "h5" }`
   *
   * If you want to modify heading levels for individual titles, handle `SurveyModel`'s [`onGetTitleTagName`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onGetTitleTagName) event.
   */
  titleTags: {
    survey: "h3",
    page: "h4",
    panel: "h4",
    question: "h5",
  },
  questions: {
    inputTypes: [
      "color",
      "date",
      "datetime-local",
      "email",
      "month",
      "number",
      "password",
      "range",
      "tel",
      "text",
      "time",
      "url",
      "week",
    ],
    dataList: [
      "",
      "name",
      "honorific-prefix",
      "given-name",
      "additional-name",
      "family-name",
      "honorific-suffix",
      "nickname",
      "organization-title",
      "username",
      "new-password",
      "current-password",
      "organization",
      "street-address",
      "address-line1",
      "address-line2",
      "address-line3",
      "address-level4",
      "address-level3",
      "address-level2",
      "address-level1",
      "country",
      "country-name",
      "postal-code",
      "cc-name",
      "cc-given-name",
      "cc-additional-name",
      "cc-family-name",
      "cc-number",
      "cc-exp",
      "cc-exp-month",
      "cc-exp-year",
      "cc-csc",
      "cc-type",
      "transaction-currency",
      "transaction-amount",
      "language",
      "bday",
      "bday-day",
      "bday-month",
      "bday-year",
      "sex",
      "url",
      "photo",
      "tel",
      "tel-country-code",
      "tel-national",
      "tel-area-code",
      "tel-local",
      "tel-local-prefix",
      "tel-local-suffix",
      "tel-extension",
      "email",
      "impp",
    ]
  }
};