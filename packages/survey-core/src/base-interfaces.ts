import { ILocalizableOwner, LocalizableString } from "./localizablestring";
import { HashTable } from "./helpers";
import {
  MatrixDropdownRowModelBase,
  QuestionMatrixDropdownModelBase,
} from "./question_matrixdropdownbase";
import { AdaptiveActionContainer } from "./actions/adaptive-container";
import { SurveyError } from "./survey-error";
import { Base } from "./base";
import { IAction } from "./actions/action";
import { PanelModel } from "./panel";
import { PanelLayoutColumnModel } from "./panel-layout-column";
import { QuestionPanelDynamicModel } from "./question_paneldynamic";
import { DragDropAllowEvent } from "./survey-events-api";
import { PopupModel } from "./popup";

export interface ISurveyData {
  getValue(name: string): any;
  setValue(
    name: string,
    newValue: any,
    locNotification: any,
    allowNotifyValueChanged?: boolean,
    questionName?: string
  ): any;
  getVariable(name: string): any;
  setVariable(name: string, newValue: any): void;
  getComment(name: string): string;
  setComment(name: string, newValue: string, locNotification: any): any;
  getAllValues(): any;
  getFilteredValues(): any;
  getFilteredProperties(): any;
  findQuestionByName(name: string): IQuestion;
  getEditingSurveyElement(): Base;
}
export interface ITextProcessorProp {
  text: string;
  returnDisplayValue?: boolean;
  doEncoding?: boolean;
  runAtDesign?: boolean;
  replaceUndefinedValues?: boolean;
}
export interface ITextProcessorResult {
  text: string;
  hasAllValuesOnLastRun: boolean;
}
export interface ITextProcessor {
  processText(text: string, returnDisplayValue: boolean): string;
  processTextEx(params: ITextProcessorProp): ITextProcessorResult;
}
export interface ISurveyErrorOwner extends ILocalizableOwner {
  getErrorCustomText(text: string, error: SurveyError): string;
}
export interface IValueItemCustomPropValues {
  propertyName: string;
  values: Array<any>;
}
export interface ISurvey extends ITextProcessor, ISurveyErrorOwner {
  getSkeletonComponentName(element: ISurveyElement): string;
  currentPage: IPage;
  activePage: IPage;
  pages: Array<IPage>;
  getCss(): any;
  isPageStarted(page: IPage): boolean;
  getQuestionByName(name: string): IQuestion;
  pageVisibilityChanged(page: IPage, newValue: boolean): any;
  panelVisibilityChanged(panel: IPanel, newValue: boolean): any;
  questionVisibilityChanged(question: IQuestion, newValue: boolean, resetIndexes: boolean): any;
  isEditingSurveyElement: boolean;
  getQuestionClearIfInvisible(questionClearIf: string): string;
  questionOrder: string;
  matrixDragHandleArea: string;
  keepIncorrectValues: boolean;
  questionCreated(question: IQuestion): any;
  questionAdded(
    question: IQuestion,
    index: number,
    parentPanel: any,
    rootPanel: any
  ): any;
  panelAdded(
    panel: IElement,
    index: number,
    parentPanel: any,
    rootPanel: any
  ): any;
  questionRemoved(question: IQuestion): any;
  panelRemoved(panel: IElement): any;
  questionRenamed(
    question: IQuestion,
    oldName: string,
    oldValueName: string
  ): any;
  focusQuestionByInstance(question: IQuestion, onError: boolean): boolean;
  validateQuestion(question: IQuestion, errors: Array<SurveyError>, fireCallback: boolean): void;
  validatePanel(panel: IPanel, errors: Array<SurveyError>, fireCallback: boolean): void;
  hasVisibleQuestionByValueName(valueName: string): boolean;
  questionsByValueName(valueName: string): Array<IQuestion>;
  processHtml(html: string, reason: string): string;
  getSurveyMarkdownHtml(element: Base, text: string, name: string): string;
  getRendererForString(element: Base, name: string): string;
  getRendererContextForString(element: Base, locStr: LocalizableString): any;
  getExpressionDisplayValue(
    question: IQuestion,
    value: any,
    displayValue: string
  ): string;
  gridLayoutEnabled: boolean;
  isDisplayMode: boolean;
  isDesignMode: boolean;
  areInvisibleElementsShowing: boolean;
  currentSingleQuestion: IQuestion;
  isSingleVisibleInput: boolean;
  updateNavigationElements(): void;
  areEmptyElementsHidden: boolean;
  isLoadingFromJson: boolean;
  isUpdateValueTextOnTyping: boolean;
  autoGrowComment: boolean;
  allowResizeComment: boolean;
  commentAreaRows: number;

  state: string;
  isLazyRendering: boolean;
  lazyRenderFirstBatchSize: number;
  cancelPreviewByPage(panel: IPanel): any;
  locEditText: LocalizableString;
  cssNavigationEdit: string;
  rootElement?: HTMLElement;

  requiredMark: string;
  getQuestionDisplayValue(question: IElement, displayValue: any): any;
  getSurveyErrorCustomText(obj: Base, text: string, error: SurveyError): string;
  getElementTitleTagName(element: Base, tagName: string): string;
  questionTitlePattern: string;
  getUpdatedQuestionTitle(question: IQuestion, title: string): string;
  getUpdatedQuestionNo(question: IQuestion, no: string): string;
  getUpdatedPanelNo(question: IPanel, no: string): string;
  getUpdatedPageNo(question: IPage, no: string): string;
  getUpdatedElementTitleActions(
    element: ISurveyElement,
    titleActions: Array<IAction>
  ): Array<IAction>;
  getUpdatedMatrixRowActions(
    question: QuestionMatrixDropdownModelBase,
    row: MatrixDropdownRowModelBase,
    actions: Array<IAction>
  ): Array<IAction>;
  getUpdatedPanelFooterActions(
    panel: PanelModel,
    actions: Array<IAction>,
    question?: QuestionPanelDynamicModel
  ): Array<IAction>;
  questionStartIndex: string;
  questionTitleLocation: string;
  questionDescriptionLocation: string;
  questionErrorLocation: string;
  storeOthersAsComment: boolean;

  maxTextLength: number;
  /**
   * @deprecated Use `maxCommentLength` instead.
   */
  maxOthersLength: number;
  maxCommentLength: number;
  /**
   * @deprecated Use `clearDisabledChoices` instead.
   */
  clearValueOnDisableItems: boolean;
  clearDisabledChoices: boolean;

  timeLimitPerPage: number;

  uploadFiles(
    question: IQuestion,
    name: string,
    files: File[],
    // uploadingCallback: (status: string | Array<any>, data: any) => any
    uploadingCallback: (data: any | Array<any>, errors?: any | Array<any>) => any
  ): any;
  downloadFile(
    question: IQuestion,
    name: string,
    content: string,
    callback: (status: string, data: any) => any
  ): any;
  clearFiles(
    question: IQuestion,
    name: string,
    value: any,
    fileName: string,
    clearCallback: (status: string, data: any) => any
  ): any;
  updateChoicesFromServer(
    question: IQuestion,
    choices: Array<any>,
    serverResult: any
  ): Array<any>;
  loadedChoicesFromServer(question: IQuestion): void;
  updateQuestionCssClasses(question: IQuestion, cssClasses: any): any;
  updatePanelCssClasses(panel: IPanel, cssClasses: any): any;
  updatePageCssClasses(panel: IPanel, cssClasses: any): any;
  updateChoiceItemCss(question: IQuestion, options: any): any;
  afterRenderQuestion(question: IQuestion, htmlElement: HTMLElement): any;
  afterRenderQuestionInput(question: IQuestion, htmlElement: HTMLElement): any;
  afterRenderPanel(panel: IElement, htmlElement: HTMLElement): any;
  afterRenderPage(htmlElement: HTMLElement): any;

  getQuestionByValueNameFromArray(
    valueName: string,
    name: string,
    index: number
  ): IQuestion;
  canChangeChoiceItemsVisibility(): boolean;
  getChoiceItemVisibility(question: IQuestion, item: any, val: boolean): boolean;
  loadQuestionChoices(options: { question: IQuestion, filter: string, skip: number, take: number, setItems: (items: Array<any>, totalCount: number) => void }): void;
  getChoiceDisplayValue(options: { question: IQuestion, values: Array<any>, setItems: (displayValues: Array<string>, ...customValues: Array<IValueItemCustomPropValues>) => void }): void;
  matrixRowAdded(question: IQuestion, row: any): any;
  matrixColumnAdded(question: IQuestion, column: any): void;
  matrixBeforeRowAdded(options: {
    question: IQuestion,
    canAddRow: boolean,
  }): any;
  matrixRowRemoved(question: IQuestion, rowIndex: number, row: any): any;
  matrixRowRemoving(question: IQuestion, rowIndex: number, row: any): boolean;
  matrixAllowRemoveRow(question: IQuestion, rowIndex: number, row: any): boolean;
  matrixDetailPanelVisibleChanged(question: IQuestion, rowIndex: number, row: any, visible: boolean): void;
  matrixCellCreating(question: IQuestion, options: any): any;
  matrixCellCreated(question: IQuestion, options: any): any;
  matrixAfterCellRender(question: IQuestion, options: any): any;
  matrixCellValueChanged(question: IQuestion, options: any): any;
  matrixCellValueChanging(question: IQuestion, options: any): any;
  isValidateOnValueChanging: boolean;
  isValidateOnValueChanged: boolean;
  getValidateVisitedEmptyFields(): boolean;
  multipleTextItemAdded(question: IQuestion, item: any): void;
  matrixCellValidate(question: IQuestion, options: any): SurveyError;
  dynamicPanelAdded(question: IQuestion, panelIndex?: number, panel?: IPanel): void;
  dynamicPanelRemoved(question: IQuestion, panelIndex: number, panel: IPanel): void;
  dynamicPanelRemoving(question: IQuestion, panelIndex: number, panel: IPanel): boolean;
  dynamicPanelItemValueChanged(question: IQuestion, options: any): void;
  dynamicPanelItemValueChanging(question: IQuestion, options: any): void;
  dynamicPanelGetTabTitle(question: IQuestion, options: any): any;
  dynamicPanelCurrentIndexChanged(question: IQuestion, options: any): void;

  dragAndDropAllow(options: DragDropAllowEvent): boolean;

  scrollElementToTop(
    element: ISurveyElement,
    question: IQuestion,
    page: IPage,
    id: string, scrollIfVisible?: boolean,
    scrollIntoViewOptions?: ScrollIntoViewOptions,
    passedRootElement?: HTMLElement,
    onScolledCallback?: () => void
  ): any;
  runExpression(expression: string, callback?: (res: any) => void): any;
  startSetValueOnExpression(): void;
  finishSetValueOnExpression(): void;

  elementContentVisibilityChanged(element: ISurveyElement): void;
  onCorrectQuestionAnswer(question: IQuestion, options: any): void;
  processPopupVisiblityChanged(question: IQuestion, popupModel: PopupModel, visible: boolean): void;
  processOpenDropdownMenu(question: IQuestion, options: IDropdownMenuOptions): void;
  chooseFiles(input: HTMLInputElement, callback: (files: File[]) => void, context?: { element: Base, item?: any, elementType?: string, propertyName?: string }): void;
}
export interface ISurveyImpl {
  getSurveyData(): ISurveyData;
  getSurvey(): ISurvey;
  getTextProcessor(): ITextProcessor;
}
export interface IConditionRunner {
  runCondition(values: HashTable<any>, properties: HashTable<any>): any;
}
export interface IShortcutText {
  shortcutText: string;
}
export interface ISurveyElement extends IShortcutText {
  name: string;
  isVisible: boolean;
  isReadOnly: boolean;
  isPage: boolean;
  isPanel: boolean;
  containsErrors: boolean;
  parent: IPanel;
  skeletonComponentName: string;
  setSurveyImpl(value: ISurveyImpl, isLight?: boolean): any;
  onSurveyLoad(): any;
  onFirstRendering(): any;
  getType(): string;
  setVisibleIndex(value: number): number;
  locStrsChanged(): any;
  delete(doDispose?: boolean): void;
  toggleState(): void;
  stateChangedCallback(): void;
  getTitleToolbar(): AdaptiveActionContainer;
  isCollapsed: boolean;
  isExpanded: boolean;
  expand(): void;
  collapse(): void;
}
export interface IElement extends IConditionRunner, ISurveyElement {
  visible: boolean;
  renderWidth: string;
  width: string;
  minWidth?: string;
  maxWidth?: string;
  isExpanded: boolean;
  isCollapsed: boolean;
  rightIndent: number;
  startWithNewLine: boolean;
  colSpan?: number;
  registerPropertyChangedHandlers(propertyNames: Array<string>, handler: any, key: string): void;
  registerFunctionOnPropertyValueChanged(name: string, func: any, key: string): void;
  unRegisterFunctionOnPropertyValueChanged(name: string, key: string): void;
  getPanel(): IPanel;
  getLayoutType(): string;
  isLayoutTypeSupported(layoutType: string): boolean;
  removeElement(el: IElement): boolean;
  onAnyValueChanged(name: string, questionName: string): void;
  updateCustomWidgets(): any;
  clearIncorrectValues(): any;
  clearErrors(): any;
  dispose(): void;
  needResponsiveWidth(): boolean;
  updateRootStyle(): void;
  updateElementVisibility(): void;
}

export interface IQuestion extends IElement, ISurveyErrorOwner {
  hasTitle: boolean;
  isEmpty(): boolean;
  onSurveyValueChanged(newValue: any): any;
  updateValueFromSurvey(newValue: any, clearData: boolean): void;
  updateCommentFromSurvey(newValue: any): any;
  supportAutoAdvance(): boolean;
  clearUnusedValues(): any;
  getDisplayValue(keysAsText: boolean, value: any): any;
  getValueName(): string;
  clearValue(): any;
  clearValueIfInvisible(): any;
  isAnswerCorrect(): boolean;
  updateValueWithDefaults(): any;
  getQuestionFromArray(name: string, index: number): IQuestion;
  value: any;
  survey: any;
}
export interface IParentElement {
  addElement(element: IElement, index: number): any;
  removeElement(element: IElement): boolean;
  isReadOnly: boolean;
}

export interface IPanel extends ISurveyElement, IParentElement {
  getChildrenLayoutType(): string;
  getQuestionTitleLocation(): string;
  getQuestionTitleWidth(): string;
  getQuestionStartIndex(): string;
  getQuestionErrorLocation(): string;
  getColumsForElement(el: IElement): Array<PanelLayoutColumnModel>;
  updateColumns(): void;
  parent: IPanel;
  elementWidthChanged(el: IElement): any;
  indexOf(el: IElement): number;
  elements: Array<IElement>;
  ensureRowsVisibility(): void;
  validateContainerOnly(): void;
  onQuestionValueChanged(el: IElement): void;
}
export interface IPage extends IPanel, IConditionRunner {
  isStartPage: boolean;
}
export interface ITitleOwner {
  name: string;
  no: string;
  requiredMark: string;
  cssTitleNumber: string;
  cssRequiredMark?: string;
  isRequireTextOnStart: boolean;
  isRequireTextBeforeTitle: boolean;
  isRequireTextAfterTitle: boolean;
  locTitle: LocalizableString;
}
export interface IProgressInfo {
  questionCount: number;
  answeredQuestionCount: number;
  requiredQuestionCount: number;
  requiredAnsweredQuestionCount: number;
}

export interface IWrapperObject {
  getOriginalObj(): Base;
  getClassNameProperty(): string;
}

export interface IFindElement {
  element: Base;
  str: LocalizableString;
}

export type ISurveyEnvironment = {
  root: Document | ShadowRoot,
  rootElement: HTMLElement | ShadowRoot,
  popupMountContainer: HTMLElement | string,
  svgMountContainer: HTMLElement | string,
  stylesSheetsMountContainer: HTMLElement,
}

export type LayoutElementContainer = "header" | "footer" | "left" | "right" | "contentTop" | "contentBottom" | "center";
export type HorizontalAlignment = "left" | "center" | "right";
export type VerticalAlignment = "top" | "middle" | "bottom";

export interface ISurveyLayoutElement {
  id: string;
  container?: LayoutElementContainer | Array<LayoutElementContainer>;
  component?: string;
  template?: string;
  data?: any;
  index?: number;
  getData?: () => any;
  processResponsiveness?: (width: number) => void;
}
export interface IPlainDataOptions {
  includeEmpty?: boolean;
  includeQuestionTypes?: boolean;
  includeValues?: boolean;
  calculations?: Array<{
    propertyName: string,
  }>;
}
export interface ILoadFromJSONOptions {
  validatePropertyValues?: boolean;
}
export interface ISaveToJSONOptions {
  storeDefaults?: boolean;
  version?: string;
}

export interface IDropdownMenuOptions {
  menuType: "dropdown" | "popup" | "overlay";
  deviceType: "mobile" | "tablet" | "desktop";
  hasTouchScreen: boolean;
  screenHeight: number;
  screenWidth: number;
}
