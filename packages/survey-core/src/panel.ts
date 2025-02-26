import { property, propertyArray, Serializer } from "./jsonobject";
import { HashTable, Helpers } from "./helpers";
import { ArrayChanges, Base } from "./base";
import {
  ISurveyImpl,
  IPage,
  IPanel,
  IConditionRunner,
  IElement,
  ISurveyElement,
  IQuestion,
  ISurveyErrorOwner,
  ITitleOwner,
  IProgressInfo,
  ISurvey,
  IFindElement
} from "./base-interfaces";
import { DragTypeOverMeEnum, SurveyElement, RenderingCompletedAwaiter } from "./survey-element";
import { Question } from "./question";
import { ElementFactory, QuestionFactory } from "./questionfactory";
import { LocalizableString } from "./localizablestring";
import { OneAnswerRequiredError } from "./error";
import { settings } from "./settings";
import { cleanHtmlElementAfterAnimation, findScrollableParent, getElementWidth, isElementVisible, floorTo2Decimals, prepareElementForVerticalAnimation, setPropertiesOnElementForAnimation } from "./utils/utils";
import { SurveyError } from "./survey-error";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { IAction } from "./actions/action";
import { ActionContainer } from "./actions/container";
import { SurveyModel } from "./survey";
import { AnimationGroup, IAnimationConsumer, IAnimationGroupConsumer } from "./utils/animation";
import { DomDocumentHelper, DomWindowHelper } from "./global_variables_utils";
import { PageModel } from "./page";
import { PanelLayoutColumnModel } from "./panel-layout-column";

export class QuestionRowModel extends Base {
  private static rowCounter = 100;
  private static getRowId(): string {
    return "pr_" + QuestionRowModel.rowCounter++;
  }
  protected _scrollableParent: any = undefined;
  protected _updateVisibility: any = undefined;
  private get allowRendering(): boolean {
    return !this.panel || !this.panel.survey || !(this.panel.survey as any)["isLazyRenderingSuspended"];
  }
  public startLazyRendering(rowContainerDiv: HTMLElement, findScrollableContainer = findScrollableParent): void {
    if (!DomDocumentHelper.isAvailable()) return;
    this._scrollableParent = findScrollableContainer(rowContainerDiv);
    // if  this._scrollableParent is html the scroll event isn't fired, so we should use window
    if (this._scrollableParent === DomDocumentHelper.getDocumentElement()) {
      this._scrollableParent = DomWindowHelper.getWindow();
    }
    const hasScroll = this._scrollableParent.scrollHeight > this._scrollableParent.clientHeight;
    this.isNeedRender = !hasScroll;
    if (hasScroll) {
      this._updateVisibility = () => {
        if (!this.allowRendering) {
          return;
        }
        var isRowContainerDivVisible = isElementVisible(rowContainerDiv, 50);
        if (!this.isNeedRender && isRowContainerDivVisible) {
          this.isNeedRender = true;
          this.stopLazyRendering();
        }
      };
      setTimeout(() => {
        if (
          !!this._scrollableParent &&
          !!this._scrollableParent.addEventListener
        ) {
          this._scrollableParent.addEventListener(
            "scroll",
            this._updateVisibility
          );
        }
        this.ensureVisibility();
      }, 10);
    }
  }
  public ensureVisibility() {
    if (!!this._updateVisibility) {
      this._updateVisibility();
    }
  }
  public stopLazyRendering() {
    if (
      !!this._scrollableParent &&
      !!this._updateVisibility &&
      !!this._scrollableParent.removeEventListener
    ) {
      this._scrollableParent.removeEventListener(
        "scroll",
        this._updateVisibility
      );
    }
    this._scrollableParent = undefined;
    this._updateVisibility = undefined;
  }
  private idValue: string;
  constructor(public panel: PanelModelBase) {
    super();
    this.idValue = QuestionRowModel.getRowId();
    this.visible = panel.areInvisibleElementsShowing;
    this.createNewArray("elements");
    this.createNewArray("visibleElements");
  }
  private isLazyRenderingValue: boolean;
  public setIsLazyRendering(val: boolean) {
    this.isLazyRenderingValue = val;
    this.isNeedRender = !val;
  }
  public isLazyRendering(): boolean {
    return this.isLazyRenderingValue === true;
  }
  public get id(): string {
    return this.idValue;
  }
  protected equalsCore(obj: Base): boolean {
    return this == obj;
  }
  public get elements(): Array<IElement> {
    return this.getPropertyValue("elements");
  }
  protected getIsAnimationAllowed(): boolean {
    return super.getIsAnimationAllowed() && this.visible && this.panel?.animationAllowed;
  }
  private getVisibleElementsAnimationOptions(): IAnimationGroupConsumer<IElement> {
    const beforeRunAnimation = (el: HTMLElement) => {
      prepareElementForVerticalAnimation(el);
      setPropertiesOnElementForAnimation(el, { width: getElementWidth(el) + "px" });
    };
    return {
      getRerenderEvent: () => this.onElementRerendered,
      isAnimationEnabled: () => this.animationAllowed,
      allowSyncRemovalAddition: false,
      getAnimatedElement: (element: IElement) => (element as any as SurveyElement).getWrapperElement(),
      getLeaveOptions: (element: IElement) => {
        const surveyElement = element as unknown as SurveyElement;
        const cssClasses = element.isPanel ? surveyElement.cssClasses.panel : surveyElement.cssClasses;
        return {
          cssClass: cssClasses.leave,
          onBeforeRunAnimation: beforeRunAnimation,
          onAfterRunAnimation: cleanHtmlElementAfterAnimation
        };
      },
      getEnterOptions: (element: IElement) => {
        const surveyElement = element as unknown as SurveyElement;
        const cssClasses = element.isPanel ? surveyElement.cssClasses.panel : surveyElement.cssClasses;
        return {
          cssClass: cssClasses.enter,
          onBeforeRunAnimation: beforeRunAnimation,
          onAfterRunAnimation: cleanHtmlElementAfterAnimation
        };
      }
    };
  }
  public visibleElementsAnimation: AnimationGroup<IElement> = new AnimationGroup(this.getVisibleElementsAnimationOptions(), (value) => {
    this.setWidth(value);
    this.setPropertyValue("visibleElements", value);
  }, () => this.visibleElements);
  public set visibleElements(val: Array<IElement>) {
    if(!val.length) {
      this.visible = false;
      this.visibleElementsAnimation.cancel();
      return;
    } else {
      this.visible = true;
    }
    this.visibleElementsAnimation.sync(val);
  }
  public get visibleElements(): Array<IElement> {
    return this.getPropertyValue("visibleElements");
  }

  public onVisibleChangedCallback: () => void;
  public get visible(): boolean {
    return this.getPropertyValue("visible", true);
  }
  public set visible(val: boolean) {
    this.setPropertyValue("visible", val);
    this.onVisibleChangedCallback && this.onVisibleChangedCallback();
  }
  public get isNeedRender(): boolean {
    return this.getPropertyValue("isneedrender", true);
  }
  public set isNeedRender(val: boolean) {
    this.setPropertyValue("isneedrender", val);
  }

  public updateVisible() {
    var visElements: Array<IElement> = [];
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i].isVisible) {
        visElements.push(this.elements[i]);
      }
      if (this.elements[i].isPanel || this.elements[i].getType() === "paneldynamic") {
        this.setIsLazyRendering(false);
        this.stopLazyRendering();
      }
    }
    this.visibleElements = visElements;
    return;
  }
  public addElement(q: IElement) {
    this.elements.push(q);
    this.updateVisible();
  }
  public get index(): number {
    return this.panel.rows.indexOf(this);
  }
  private setWidth(visibleElement: Array<IElement>) {
    var visCount = visibleElement.length;
    if (visCount == 0) return;
    const isSingleInRow = visibleElement.length === 1;
    var counter = 0;
    var preSetWidthElements = [];
    for (var i = 0; i < this.elements.length; i++) {
      var el = this.elements[i];

      if (el.isVisible) {
        (<any>el).isSingleInRow = isSingleInRow;
        var width = this.getElementWidth(el);
        if (!!width) {
          el.renderWidth = this.getRenderedWidthFromWidth(width);
          preSetWidthElements.push(el);
        }
        if(counter < visCount - 1 && !(this.panel.isDefaultV2Theme || this.panel.parentQuestion?.isDefaultV2Theme)) {
          el.rightIndent = 1;
        } else {
          el.rightIndent = 0;
        }
        counter++;
      } else {
        el.renderWidth = "";
      }
    }
    for (var i = 0; i < this.elements.length; i++) {
      var el = this.elements[i];
      if (!el.isVisible || preSetWidthElements.indexOf(el) > -1) continue;
      if (preSetWidthElements.length == 0) {
        el.renderWidth = `${Number.parseFloat((100 / visCount).toFixed(6))}%`;
      } else {
        el.renderWidth = this.getRenderedCalcWidth(
          el,
          preSetWidthElements,
          visCount
        );
      }
    }
  }

  private getRenderedCalcWidth(
    el: IElement,
    preSetWidthElements: Array<IElement>,
    visCount: number
  ): string {
    var expression = "100%";
    for (var i = 0; i < preSetWidthElements.length; i++) {
      expression += " - " + preSetWidthElements[i].renderWidth;
    }
    var calcWidthEl = visCount - preSetWidthElements.length;
    if (calcWidthEl > 1) {
      expression = "(" + expression + ")/" + calcWidthEl.toString();
    }
    return "calc(" + expression + ")";
  }
  private getElementWidth(el: IElement): string {
    var width = el.width;
    if (!width || typeof width !== "string") return "";
    return width.trim();
  }
  private getRenderedWidthFromWidth(width: string): string {
    return Helpers.isNumber(width) ? width + "px" : width;
  }
  @property({ defaultValue: null }) dragTypeOverMe: DragTypeOverMeEnum;
  public dispose(): void {
    super.dispose();
    this.stopLazyRendering();
  }
  public getRowCss() {
    return new CssClassBuilder()
      .append(this.panel.cssClasses.row)
      .append(this.panel.cssClasses.rowCompact, this.panel["isCompact"])
      .append(this.panel.cssClasses.pageRow, this.panel.isPage || (this.panel as PanelModel).showPanelAsPage)
      .append(this.panel.cssClasses.rowMultiple, this.visibleElements.length > 1)
      .toString();
  }
  private rootElement?: HTMLElement;
  public setRootElement(element?: HTMLElement) {
    this.rootElement = element;
  }
  public getRootElement(): HTMLElement {
    return this.rootElement;
  }
}

/**
 * A base class for the [`PanelModel`](https://surveyjs.io/form-library/documentation/panelmodel) and [`PageModel`](https://surveyjs.io/form-library/documentation/pagemodel) classes.
 */
export class PanelModelBase extends SurveyElement<Question>
  implements IPanel, IConditionRunner, ISurveyErrorOwner, ITitleOwner {
  private static panelCounter = 100;
  private static getPanelId(): string {
    return "sp_" + PanelModelBase.panelCounter++;
  }

  private elementsValue: Array<IElement>;
  private isQuestionsReady: boolean = false;
  private questionsValue: Array<Question> = new Array<Question>();
  private _columns: Array<PanelLayoutColumnModel> = undefined;
  private _columnsReady = false;

  /**
   * An array of columns used to arrange survey elements within this page or panel. Applies only if you set the `SurveyModel`'s [`gridLayoutEnabled`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#gridLayoutEnabled) property to `true`.
   *
   * Each object in this array configures a single layout column and has the following properties:
   *
   * - `width`: `number`\
   * Column width, in percentage.
   *
   * - `questionTitleWidth`: `string`\
   * The width of question titles, in pixels.
   *
   * The `gridLayoutColumns` array is generated automatically based on the maximum number of questions and panels in the same row. To arrange the survey elements in one or several rows, disable the [`startWithNewLine`](https://surveyjs.io/form-library/documentation/api-reference/question#startWithNewLine) property for those elements that should occupy the same row as the previous question or panel. You can also set the [`colSpan`](https://surveyjs.io/form-library/documentation/api-reference/question#colSpan) property for individual questions and panels to specify how many layout columns they span.
   */
  public get gridLayoutColumns(): Array<PanelLayoutColumnModel> {
    let res = this.getPropertyValue("gridLayoutColumns");
    if(!this._columns) {
      this.generateColumns([].concat(res));
      res = this._columns;
      this.gridLayoutColumns = res;
    }
    return res;
  }
  public set gridLayoutColumns(val: Array<PanelLayoutColumnModel>) {
    this.setPropertyValue("gridLayoutColumns", val);
  }

  addElementCallback: (element: IElement) => void;
  removeElementCallback: (element: IElement) => void;
  onGetQuestionTitleLocation: () => string;

  public onAddRow(row: QuestionRowModel): void {
    this.onRowVisibleChanged();
    row.onVisibleChangedCallback = () => this.onRowVisibleChanged();
  }
  private getRowsAnimationOptions(): IAnimationGroupConsumer<QuestionRowModel> {
    return {
      getRerenderEvent: () => this.onElementRerendered,
      isAnimationEnabled: () => this.animationAllowed,
      getAnimatedElement: (row: QuestionRowModel) => row.getRootElement(),
      getLeaveOptions: (row: QuestionRowModel, info) => {
        return {
          cssClass: this.cssClasses.rowLeave,
          onBeforeRunAnimation: prepareElementForVerticalAnimation,
          onAfterRunAnimation: cleanHtmlElementAfterAnimation,

        };
      },
      getEnterOptions: (_: QuestionRowModel, animationInfo) => {
        const cssClasses = this.cssClasses;
        return {
          cssClass: new CssClassBuilder().append(cssClasses.rowEnter).append(cssClasses.rowDelayedEnter, animationInfo.isDeletingRunning).toString(),
          onBeforeRunAnimation: prepareElementForVerticalAnimation,
          onAfterRunAnimation: cleanHtmlElementAfterAnimation
        };
      }
    };
  }
  private rowsAnimation: AnimationGroup<QuestionRowModel> = new AnimationGroup(this.getRowsAnimationOptions(), (value) => {
    this.setPropertyValue("visibleRows", value);
  }, () => this.visibleRows)
  get visibleRows(): Array<QuestionRowModel> {
    return this.getPropertyValue("visibleRows");
  }
  set visibleRows(val: Array<QuestionRowModel>) {
    this.rowsAnimation.sync(val);
  }

  public onRemoveRow(row: QuestionRowModel): void {
    row.visibleElementsAnimation.cancel();
    this.visibleRows = this.rows.filter(row => row.visible);
    row.onVisibleChangedCallback = undefined;
  }
  onRowVisibleChanged() {
    this.visibleRows = this.rows.filter(row => row.visible);
  }
  constructor(name: string = "") {
    super(name);
    this.createNewArray("rows", (el: QuestionRowModel, index: number) => { this.onAddRow(el); }, (el: QuestionRowModel) => { this.onRemoveRow(el); });
    this.createNewArray("visibleRows");
    this.createNewArray("gridLayoutColumns", (col: PanelLayoutColumnModel) => {
      col.onPropertyValueChangedCallback = this.onColumnPropertyValueChangedCallback;
    });

    this.elementsValue = this.createNewArray(
      "elements",
      this.onAddElement.bind(this),
      this.onRemoveElement.bind(this)
    );
    this.setPropertyValueDirectly("id", PanelModelBase.getPanelId());

    this.addExpressionProperty("visibleIf",
      (obj: Base, res: any) => { this.visible = res === true; },
      (obj: Base) => { return !this.areInvisibleElementsShowing; });
    this.addExpressionProperty("enableIf", (obj: Base, res: any) => { this.readOnly = res === false; });
    this.addExpressionProperty("requiredIf", (obj: Base, res: any) => { this.isRequired = res === true; });

    this.createLocalizableString("requiredErrorText", this);
    this.createLocalizableString("navigationTitle", this, true).onGetTextCallback = (text: string) => {
      return text || this.title || this.name;
    };
    this.registerPropertyChangedHandlers(["questionTitleLocation"], () => {
      this.onVisibleChanged.bind(this);
      this.updateElementCss(true);
    });
    this.registerPropertyChangedHandlers(
      ["questionStartIndex", "showQuestionNumbers"],
      () => {
        this.updateVisibleIndexes();
      }
    );
    this.registerPropertyChangedHandlers(["title"], () => {
      this.resetHasTextInTitle();
    });
  }
  public getType(): string {
    return "panelbase";
  }
  public setSurveyImpl(value: ISurveyImpl, isLight?: boolean): void {
    //if(this.surveyImpl === value) return; TODO refactor
    this.blockAnimations();
    super.setSurveyImpl(value, isLight);
    if (this.isDesignMode) this.onVisibleChanged();
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].setSurveyImpl(value, isLight);
    }
    this.releaseAnimations();
  }
  endLoadingFromJson(): void {
    super.endLoadingFromJson();
    this.markQuestionListDirty();
    this.onRowsChanged();
  }

  @property({ defaultValue: true }) showTitle: boolean;

  public get hasTextInTitle(): boolean {
    return this.getPropertyValue("hasTextInTitle", undefined, (): boolean => !!this.title);
  }
  private resetHasTextInTitle(): void {
    this.resetPropertyValue("hasTextInTitle");
  }
  get hasTitle(): boolean {
    return (
      (this.canShowTitle(this.survey) && (this.hasTextInTitle || this.locTitle.textOrHtml.length > 0)) ||
      (this.isDesignMode && !this.isPanel && this.showTitle && settings.designMode.showEmptyTitles)
    );
  }
  public delete(doDispose: boolean = true): void {
    this.deletePanel();
    this.removeFromParent();
    if(doDispose) {
      this.dispose();
    }
  }
  private deletePanel(): void {
    const els = this.elements;
    for(let i = 0; i < els.length; i ++) {
      const el = els[i];
      if(el.isPanel) {
        (<PanelModelBase><any>el).deletePanel();
      }
      this.onRemoveElementNotifySurvey(el);
    }
  }
  protected removeFromParent(): void {}
  protected canShowTitle(survey: ISurvey): boolean { return true; }
  @property({ defaultValue: true }) showDescription: boolean;
  get _showDescription(): boolean {
    if(!this.hasTitle && this.isDesignMode) return false;
    return this.survey && (<any>this.survey).showPageTitles && this.hasDescription ||
      (this.showDescription && this.isDesignMode &&
        settings.designMode.showEmptyDescriptions);
  }
  public localeChanged(): void {
    super.localeChanged();
    for (var i = 0; i < this.elements.length; i++) {
      (<Base>(<any>this.elements[i])).localeChanged();
    }
  }
  public locStrsChanged(): void {
    super.locStrsChanged();
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].locStrsChanged();
    }
  }
  getMarkdownHtml(text: string, name: string): string {
    if(name === "navigationTitle" && this.locNavigationTitle.isEmpty) {
      return this.locTitle.renderedHtml || this.name;
    }
    return super.getMarkdownHtml(text, name);
  }
  public get locNavigationTitle(): LocalizableString {
    return this.getLocalizableString("navigationTitle");
  }
  public get renderedNavigationTitle(): string {
    return this.locNavigationTitle.renderedHtml;
  }
  /**
   * Returns a character or text string that indicates a required panel/page.
   * @see SurveyModel.requiredMark
   * @see isRequired
   */
  public get requiredMark(): string {
    return !!this.survey && this.isRequired
      ? this.survey.requiredMark
      : "";
  }
  /**
   * @deprecated Use the [`requiredMark`](https://surveyjs.io/form-library/documentation/api-reference/panel-model#requiredMark) property instead.
   */
  public get requiredText(): string {
    return this.requiredMark;
  }
  protected get titlePattern(): string {
    return !!this.survey ? this.survey.questionTitlePattern : "numTitleRequire";
  }
  public get isRequireTextOnStart() {
    return this.isRequired && this.titlePattern == "requireNumTitle";
  }
  public get isRequireTextBeforeTitle() {
    return this.isRequired && this.titlePattern == "numRequireTitle";
  }
  public get isRequireTextAfterTitle() {
    return this.isRequired && this.titlePattern == "numTitleRequire";
  }
  /**
   * Specifies a custom error message for a required panel/page.
   * @see isRequired
   * @see requiredIf
   */
  public get requiredErrorText(): string {
    return this.getLocalizableStringText("requiredErrorText");
  }
  public set requiredErrorText(val: string) {
    this.setLocalizableStringText("requiredErrorText", val);
  }
  get locRequiredErrorText(): LocalizableString {
    return this.getLocalizableString("requiredErrorText");
  }
  /**
   * Specifies the sort order of questions in the panel/page.
   *
   * Possible values:
   *
   * - `"initial"` - Preserves the original order of questions.
   * - `"random"` - Displays questions in random order.
   * - `"default"` (default) - Inherits the setting from the `SurveyModel`'s [`questionOrder`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#questionOrder) property.
   * @see areQuestionsRandomized
   */
  public get questionOrder(): string {
    return this.getPropertyValue("questionOrder");
  }
  public set questionOrder(val: string) {
    this.setPropertyValue("questionOrder", val);
  }
  /**
   * @deprecated Use the [`questionOrder`](https://surveyjs.io/form-library/documentation/api-reference/panel-model#questionOrder) property instead.
   */
  public get questionsOrder(): string {
    return this.questionOrder;
  }
  public set questionsOrder(val: string) {
    this.questionOrder = val;
  }
  private canRandomize(isRandom: boolean): boolean {
    return isRandom && (this.questionOrder !== "initial") || this.questionOrder === "random";
  }
  protected isRandomizing = false;
  randomizeElements(isRandom: boolean): boolean {
    if (!this.canRandomize(isRandom) || this.isRandomizing) return false;
    this.isRandomizing = true;
    var oldElements = [];
    var elements = this.elements;
    for (var i = 0; i < elements.length; i++) {
      oldElements.push(elements[i]);
    }
    const newElements = Helpers.randomizeArray<IElement>(oldElements);
    this.setArrayPropertyDirectly("elements", newElements, false);
    this.updateRows();
    this.updateVisibleIndexes();
    this.isRandomizing = false;
    return true;
  }
  /**
   * Returns `true` if elements in this panel/page are arranged in random order.
   * @see questionOrder
   */
  public get areQuestionsRandomized(): boolean {
    var order =
      this.questionOrder == "default" && this.survey
        ? this.survey.questionOrder
        : this.questionOrder;
    return order == "random";
  }
  /**
   * Returns a survey element (panel or page) that contains this panel and allows you to move the panel to a different survey element.
   *
   * For `PageModel` objects, the `parent` property is `null`, except in the following cases:
   *
   * - `SurveyModel`'s [`questionsOnPageMode`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#questionsOnPageMode) is set to `"singlePage"`.
   * - The page is included in a [preview of given answers](https://surveyjs.io/form-library/documentation/design-survey/create-a-multi-page-survey#preview-page).
   *
   * In those cases, the survey creates an internal `PageModel` object to show all questions on one page, and the `parent` property contains this object.
   */
  public get parent(): PanelModelBase {
    return this.getPropertyValue("parent", null);
  }
  public set parent(val: PanelModelBase) {
    this.setPropertyValue("parent", val);
  }
  public get depth(): number {
    if (this.parent == null) return 0;
    return this.parent.depth + 1;
  }
  /**
   * A Boolean expression. If it evaluates to `false`, this panel/page becomes hidden.
   *
   * A survey parses and runs all expressions on startup. If any values used in the expression change, the survey re-evaluates it.
   *
   * Refer to the following help topic for more information: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#conditional-visibility).
   * @see visible
   * @see isVisible
   */
  public get visibleIf(): string {
    return this.getPropertyValue("visibleIf", "");
  }
  public set visibleIf(val: string) {
    this.setPropertyValue("visibleIf", val);
  }
  protected calcCssClasses(css: any): any {
    var classes = { panel: {}, error: {}, row: "", rowEnter: "", rowLeave: "", rowDelayedEnter: "", rowMultiple: "", pageRow: "", rowCompact: "" };
    this.copyCssClasses(classes.panel, css.panel);
    this.copyCssClasses(classes.error, css.error);
    if (!!css.pageRow) {
      classes.pageRow = css.pageRow;
    }
    if (!!css.rowCompact) {
      classes.rowCompact = css.rowCompact;
    }
    if (!!css.row) {
      classes.row = css.row;
    }
    if (!!css.rowEnter) {
      classes.rowEnter = css.rowEnter;
    }
    if (!!css.rowLeave) {
      classes.rowLeave = css.rowLeave;
    }
    if (!!css.rowDelayedEnter) {
      classes.rowDelayedEnter = css.rowDelayedEnter;
    }
    if (!!css.rowMultiple) {
      classes.rowMultiple = css.rowMultiple;
    }
    if (this.survey) {
      this.survey.updatePanelCssClasses(this, classes);
    }
    return classes;
  }
  /**
   * An auto-generated unique element identifier.
   */
  public get id(): string {
    return this.getPropertyValue("id");
  }
  public set id(val: string) {
    this.setPropertyValue("id", val);
  }
  public get isPanel(): boolean {
    return false;
  }
  public getPanel(): IPanel {
    return this;
  }
  getLayoutType(): string {
    return "row";
  }
  isLayoutTypeSupported(layoutType: string): boolean {
    return layoutType !== "flow";
  }
  /**
   * An array of all questions within this panel/page. Includes questions within nested panels.
   * @see elements
   */
  public get questions(): Array<Question> {
    if (!this.isQuestionsReady) {
      this.questionsValue = [];
      for (var i = 0; i < this.elements.length; i++) {
        var el = this.elements[i];
        if (el.isPanel) {
          var qs = (<PanelModel>el).questions;
          for (var j = 0; j < qs.length; j++) {
            this.questionsValue.push(qs[j]);
          }
        } else {
          this.questionsValue.push(<Question>el);
        }
      }
      this.isQuestionsReady = true;
    }

    return this.questionsValue;
  }
  public get visibleQuestions(): Array<Question> {
    const res = new Array<Question>();
    this.questions.forEach(q => {
      if(q.isVisible) res.push(q);
    });
    return res;
  }
  public getQuestions(includeNested: boolean): Array<Question> {
    const res = this.questions;
    if(!includeNested) return res;
    const res2: Array<Question> = [];
    res.forEach(q => {
      res2.push(q);
      q.getNestedQuestions().forEach(nQ => res2.push(nQ));
    });
    return res2;
  }
  protected getValidName(name: string): string {
    if (!!name) return name.trim();
    return name;
  }
  /**
   * Returns a question with a specified `name`. This method does not find questions within nested panels.
   * @param name A question name.
   */
  public getQuestionByName(name: string): Question {
    var questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].name == name) return questions[i];
    }
    return null;
  }
  /**
   * Returns a survey element with a specified `name`. This method can find survey elements within nested elements.
   * @param name An element name.
   */
  public getElementByName(name: string): IElement {
    var elements = this.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.name == name) return el;
      var pnl = el.getPanel();
      if (!!pnl) {
        var res = (<PanelModelBase>pnl).getElementByName(name);
        if (!!res) return res;
      }
    }
    return null;
  }
  public getQuestionByValueName(valueName: string): Question {
    const res = this.getQuestionsByValueName(valueName);
    return res.length > 0 ? res[0] : null;
  }
  public getQuestionsByValueName(valueName: string): Array<Question> {
    const res = [];
    var questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      if (questions[i].getValueName() == valueName) res.push(questions[i]);
    }
    return res;
  }
  /**
   * Returns a JSON object with question values nested in the panel/page.
   * @see getDisplayValue
   */
  public getValue(): any {
    var data: any = {};
    this.collectValues(data, 0);
    return Helpers.getUnbindValue(data);
  }
  collectValues(data: any, level: number): boolean {
    let elements = this.elements;
    if(level === 0) {
      elements = this.questions;
    }
    let hasValue = false;
    for (var i = 0; i < elements.length; i++) {
      const el = elements[i];
      if(el.isPanel || el.isPage) {
        const panelData = {};
        if((<PanelModelBase><any>el).collectValues(panelData, level - 1)) {
          data[el.name] = panelData;
          hasValue = true;
        }
      } else {
        const q = <Question>el;
        if (!q.isEmpty()) {
          var valueName = q.getValueName();
          data[valueName] = q.value;
          if (!!this.data) {
            var comment = this.data.getComment(valueName);
            if (!!comment) {
              data[valueName + Base.commentSuffix] = comment;
            }
          }
        }
        hasValue = true;
      }
    }
    return true;
  }
  /**
   * Returns a JSON object with display texts that correspond to question values nested in the panel/page.
   * @param keysAsText Pass `true` if not only values in the object should be display texts, but also keys. Default value: `false`.
   * @see getValue
   */
  public getDisplayValue(keysAsText: boolean): any {
    var data: any = {};
    var questions = this.questions;

    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (q.isEmpty()) continue;
      var valueName = keysAsText ? q.title : q.getValueName();
      data[valueName] = q.getDisplayValue(keysAsText);
    }
    return data;
  }
  /**
   * Returns a JSON object with comments left to questions within this panel/page. Question names are used as keys.
   */
  public getComments(): any {
    var comments = {};
    if (!this.data) return comments;
    var questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var comment = this.data.getComment(q.getValueName());
      if (!!comment) {
        (<any>comments)[q.getValueName()] = comment;
      }
    }
    return comments;
  }
  /**
   * Removes values that cannot be assigned to nested questions, for example, choices unlisted in the `choices` array.
   *
   * Call this method after you assign new question values in code to ensure that they are acceptable.
   *
   * > This method does not remove values for invisible questions and values that fail validation. Call the `validate()` method to validate newly assigned values.
   *
   * @see validate
   */
  public clearIncorrectValues() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].clearIncorrectValues();
    }
  }
  /**
   * Empties the `errors` array for this panel/page and all its child elements (panels and questions).
   * @see errors
   */
  public clearErrors() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].clearErrors();
    }
    this.errors = [];
  }
  private markQuestionListDirty() {
    this.isQuestionsReady = false;
    if (this.parent) this.parent.markQuestionListDirty();
  }
  /**
   * An array of all survey elements (questions or panels) within this panel/page. Does not include questions within nested panels.
   * @see questions
   */
  public get elements(): Array<IElement> {
    Base.collectDependency(this, "elements");
    return this.elementsValue;
  }
  public getElementsInDesign(includeHidden: boolean = false): Array<IElement> {
    return this.elements;
  }
  /**
   * Checks whether a given element belongs to this panel/page or nested panels.
   * @param element A survey element to check.
   */
  public containsElement(element: IElement): boolean {
    for (var i = 0; i < this.elements.length; i++) {
      var el: any = this.elements[i];
      if (el == element) return true;
      var pnl = el.getPanel();
      if (!!pnl) {
        if ((<PanelModelBase>pnl).containsElement(element)) return true;
      }
    }
    return false;
  }
  /**
   * Makes the panel/page require an answer at least in one nested question. If a respondent leaves the panel/page without any answers, the survey displays a validation error.
   * @see requiredIf
   * @see [Data Validation](https://surveyjs.io/form-library/documentation/data-validation)
   */
  public get isRequired(): boolean {
    return this.getPropertyValue("isRequired");
  }
  public set isRequired(val: boolean) {
    this.setPropertyValue("isRequired", val);
  }
  /**
   * A Boolean expression. If it evaluates to `true`, this panel/page becomes required (at least one question in the panel/page should have an answer).
   *
   * A survey parses and runs all expressions on startup. If any values used in the expression change, the survey re-evaluates it.
   *
   * Refer to the following help topic for more information: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#conditional-visibility).
   * @see isRequired
   */
  public get requiredIf(): string {
    return this.getPropertyValue("requiredIf", "");
  }
  public set requiredIf(val: string) {
    this.setPropertyValue("requiredIf", val);
  }
  public searchText(text: string, founded: Array<IFindElement>): void {
    super.searchText(text, founded);
    for (var i = 0; i < this.elements.length; i++) {
      (<Base>(<any>this.elements[i])).searchText(text, founded);
    }
  }
  public hasErrors(fireCallback: boolean = true, focusOnFirstError: boolean = false, rec: any = null): boolean {
    return !this.validate(fireCallback, focusOnFirstError, rec);
  }
  /**
   * Validates questions within this panel or page and returns `false` if the validation fails.
   * @param fireCallback *(Optional)* Pass `false` if you do not want to show validation errors in the UI.
   * @param focusFirstError *(Optional)* Pass `true` if you want to focus the first question with a validation error.
   * @see [Data Validation](https://surveyjs.io/form-library/documentation/data-validation)
   */
  public validate(fireCallback: boolean = true, focusFirstError: boolean = false, rec: any = null): boolean {
    rec = !!rec
      ? rec
      : {
        fireCallback: fireCallback,
        focusOnFirstError: focusFirstError,
        firstErrorQuestion: <any>null,
        result: false,
      };
    if(rec.result !== true) rec.result = false;
    this.hasErrorsCore(rec);
    return !rec.result;
  }
  public validateContainerOnly(): void {
    this.hasErrorsInPanels({ fireCallback: true });
    if(!!this.parent) {
      this.parent.validateContainerOnly();
    }
  }
  onQuestionValueChanged(el: IElement): void {
    const index = this.questions.indexOf(<any>el);
    if(index < 0) return;
    const dif = 5;
    const max = this.questions.length - 1;
    const start = index - dif > 0 ? index - dif : 0;
    const end = index + dif < max ? index + dif : max;
    for(let i = start; i <= end; i ++) {
      if(i === index) continue;
      const q = this.questions[i];
      if(q.errors.length > 0 && q.validate(false)) {
        q.validate(true);
      }
    }
  }
  private hasErrorsInPanels(rec: any): void {
    var errors = <Array<any>>[];
    this.hasRequiredError(rec, errors);
    if (this.survey) {
      this.survey.validatePanel(this, errors, rec.fireCallback);
      if(errors.length > 0) {
        rec.result = true;
      }
    }
    if (!!rec.fireCallback) {
      this.errors = errors;
    }
  }
  //ISurveyErrorOwner
  getErrorCustomText(text: string, error: SurveyError): string {
    if (!!this.survey) return this.survey.getSurveyErrorCustomText(this, text, error);
    return text;
  }

  private hasRequiredError(rec: any, errors: Array<SurveyError>): void {
    if (!this.isRequired) return;
    var visQuestions = <Array<any>>[];
    this.addQuestionsToList(visQuestions, true);
    if (visQuestions.length == 0) return;
    for (var i = 0; i < visQuestions.length; i++) {
      if (!visQuestions[i].isEmpty()) return;
    }
    rec.result = true;
    errors.push(new OneAnswerRequiredError(this.requiredErrorText, this));
    if (rec.focusOnFirstError && !rec.firstErrorQuestion) {
      rec.firstErrorQuestion = visQuestions[0];
    }
  }
  protected hasErrorsCore(rec: any): void {
    const elements = this.elements;
    let element = null;
    let firstErroredEl = null;
    for (var i = 0; i < elements.length; i++) {
      element = elements[i];

      if (!element.isVisible) continue;

      if (element.isPanel) {
        (<PanelModelBase>(<any>element)).hasErrorsCore(rec);
      } else {
        var question = <Question>element;
        if (!question.validate(rec.fireCallback, rec)) {
          if(!firstErroredEl) {
            firstErroredEl = question;
          }
          if (!rec.firstErrorQuestion) {
            rec.firstErrorQuestion = question;
          }
          rec.result = true;
        }
      }
    }
    this.hasErrorsInPanels(rec);
    this.updateContainsErrors();
    if(!firstErroredEl && this.errors.length > 0) {
      firstErroredEl = this.getFirstQuestionToFocus(false, true);
      if(!rec.firstErrorQuestion) {
        rec.firstErrorQuestion = firstErroredEl;
      }
    }
    if(rec.fireCallback && firstErroredEl) {
      if(firstErroredEl === rec.firstErrorQuestion && rec.focusOnFirstError) {
        firstErroredEl.focus(true);
      } else {
        firstErroredEl.expandAllParents();
      }
    }
  }
  protected getContainsErrors(): boolean {
    var res = super.getContainsErrors();
    if (res) return res;
    var elements = this.elements;
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].containsErrors) return true;
    }
    return false;
  }
  updateElementVisibility(): void {
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i].updateElementVisibility();
    }
    super.updateElementVisibility();
  }
  getFirstQuestionToFocus(withError: boolean = false, ignoreCollapseState: boolean = false): Question {
    if (!withError && !ignoreCollapseState && this.isCollapsed) return null;
    var elements = this.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (!el.isVisible || !ignoreCollapseState && el.isCollapsed) continue;
      if (el.isPanel) {
        var res = (<PanelModelBase>(<any>el)).getFirstQuestionToFocus(withError, ignoreCollapseState);
        if (!!res) return res;
      } else {
        const q = (<Question>el).getFirstQuestionToFocus(withError);
        if (!!q) return q;
      }
    }
    return null;
  }
  getFirstVisibleQuestion(): Question {
    const qs = this.questions;
    for (let i = 0; i < qs.length; i++) {
      if (qs[i].isVisible) return qs[i];
    }
    return null;
  }
  /**
   * Focuses the first question in this panel/page.
   * @see focusFirstErrorQuestion
   */
  public focusFirstQuestion(): void {
    const q = this.getFirstQuestionToFocus();
    if (!!q) {
      q.focus();
    }
  }
  /**
   * Focuses the first question with a validation error in this panel/page.
   * @see validate
   * @see focusFirstQuestion
   */
  public focusFirstErrorQuestion() {
    var q = this.getFirstQuestionToFocus(true);
    if (!!q) {
      q.focus();
    }
  }
  public addQuestionsToList(
    list: Array<IQuestion>,
    visibleOnly: boolean = false,
    includingDesignTime: boolean = false
  ) {
    this.addElementsToList(list, visibleOnly, includingDesignTime, false);
  }
  public addPanelsIntoList(
    list: Array<IPanel>,
    visibleOnly: boolean = false,
    includingDesignTime: boolean = false
  ) {
    this.addElementsToList(
      <Array<IElement>>(<Array<any>>list),
      visibleOnly,
      includingDesignTime,
      true
    );
  }
  private addElementsToList(
    list: Array<IElement>,
    visibleOnly: boolean,
    includingDesignTime: boolean,
    isPanel: boolean
  ) {
    if (visibleOnly && !this.visible) return;
    this.addElementsToListCore(
      list,
      this.elements,
      visibleOnly,
      includingDesignTime,
      isPanel
    );
  }
  private addElementsToListCore(
    list: Array<IElement>,
    elements: Array<IElement>,
    visibleOnly: boolean,
    includingDesignTime: boolean,
    isPanel: boolean
  ) {
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (visibleOnly && !el.visible) continue;
      if ((isPanel && el.isPanel) || (!isPanel && !el.isPanel)) {
        list.push(el);
      }
      if (el.isPanel) {
        (<PanelModel>el).addElementsToListCore(
          list,
          (<PanelModel>el).elements,
          visibleOnly,
          includingDesignTime,
          isPanel
        );
      } else {
        if (includingDesignTime) {
          this.addElementsToListCore(
            list,
            (<SurveyElement>(<any>el)).getElementsInDesign(false),
            visibleOnly,
            includingDesignTime,
            isPanel
          );
        }
      }
    }
  }
  private calcMaxRowColSpan(): number {
    let maxRowColSpan = 0;
    this.rows.forEach(row => {
      let curRowSpan = 0;
      let userDefinedRow = false;
      row.elements.forEach(el => {
        if (!!el.width) {
          userDefinedRow = true;
        }
        curRowSpan += (el.colSpan || 1);
      });
      if (!userDefinedRow && curRowSpan > maxRowColSpan) maxRowColSpan = curRowSpan;
    });
    return maxRowColSpan;
  }
  private updateColumnWidth(columns: Array<PanelLayoutColumnModel>): void {
    let remainingSpace = 0, remainingColCount = 0;
    columns.forEach(col => {
      if (!col.width) {
        remainingColCount++;
      } else {
        remainingSpace += col.width;
        col.setPropertyValue("effectiveWidth", col.width);
      }
    });
    if (!!remainingColCount) {
      const oneColumnWidth = floorTo2Decimals((100 - remainingSpace) / remainingColCount);
      for (let index = 0; index < columns.length; index++) {
        if (!columns[index].width) {
          columns[index].setPropertyValue("effectiveWidth", oneColumnWidth);
        }
      }
    }
  }
  private onColumnPropertyValueChangedCallback = (
    name: string,
    oldValue: any,
    newValue: any,
    sender: Base,
    arrayChanges: ArrayChanges
  ) => {
    if (this._columnsReady) {
      this.updateColumnWidth(this.gridLayoutColumns);
      this.updateRootStyle();
    }
  }
  public updateColumns() {
    this._columns = undefined;
    this.updateRootStyle();
  }
  public updateRootStyle() {
    super.updateRootStyle();
    this.elements?.forEach(el => el.updateRootStyle());
  }
  public updateCustomWidgets() {
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].updateCustomWidgets();
    }
  }
  /**
   * Sets a title location relative to the input field for questions that belong to this panel/page.
   *
   * Use this property to override the [`questionTitleLocation`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#questionTitleLocation) property specified for the survey or parent page. You can also set the [`titleLocation`](https://surveyjs.io/form-library/documentation/api-reference/question#titleLocation) property for individual questions.
   *
   * Possible values:
   *
   * - `"default"` (default) - Inherits the setting from the `questionTitleLocation` property specified for the survey or parent page.
   * - `"top"` - Displays the title above the input field.
   * - `"bottom"` - Displays the title below the input field.
   * - `"left"` - Displays the title to the left of the input field.
   * - `"hidden"` - Hides the question title.
   *
   * > Certain question types (Matrix, Multiple Text) do not support the `"left"` value. For them, the `"top"` value is used.
   */
  public get questionTitleLocation(): string {
    return this.getPropertyValue("questionTitleLocation");
  }
  public set questionTitleLocation(value: string) {
    this.setPropertyValue("questionTitleLocation", value.toLowerCase());
  }
  getQuestionTitleLocation(): string {
    if (this.onGetQuestionTitleLocation)
      return this.onGetQuestionTitleLocation();
    if (this.questionTitleLocation != "default")
      return this.questionTitleLocation;
    if (this.parent) return this.parent.getQuestionTitleLocation();
    return this.survey ? this.survey.questionTitleLocation : "top";
  }
  availableQuestionTitleWidth(): boolean {
    const questionTitleLocation = this.getQuestionTitleLocation();
    if (questionTitleLocation === "left") return true;
    return this.hasElementWithTitleLocationLeft();
  }
  hasElementWithTitleLocationLeft(): boolean {
    const result = this.elements.some(el => {
      if (el instanceof PanelModelBase) {
        return el.hasElementWithTitleLocationLeft();
      } else if (el instanceof Question) {
        return el.getTitleLocation() === "left";
      }
    });
    return result;
  }
  /**
   * Sets consistent width for question titles in CSS values. Applies only when [`questionTitleLocation`](#questionTitleLocation) evaluates to `"left"`.
   *
   * Default value: `undefined`
   */
  @property() questionTitleWidth: string;
  getQuestionTitleWidth(): string {
    return this.questionTitleWidth || this.parent && this.parent.getQuestionTitleWidth();
  }
  public get columns(): Array<PanelLayoutColumnModel> {
    if (!this._columns) {
      this.generateColumns(this.gridLayoutColumns);
      this.gridLayoutColumns = this._columns;
    }
    return this._columns || [];
  }

  private generateColumns(gridColumns: Array<PanelLayoutColumnModel>): void {
    const isEnabled = this.survey?.gridLayoutEnabled;
    let columns = [].concat(gridColumns);
    if(isEnabled) {
      let maxRowColSpan = this.calcMaxRowColSpan();
      if (maxRowColSpan <= gridColumns.length) {
        columns = gridColumns.slice(0, maxRowColSpan);
      } else {
        for (let index = gridColumns.length; index < maxRowColSpan; index++) {
          const newCol = new PanelLayoutColumnModel();
          columns.push(newCol);
        }
      }
    }
    this._columns = columns;
    try {
      this._columnsReady = false;
      this.updateColumnWidth(columns);
    }
    finally {
      this._columnsReady = true;
    }
  }
  private createGridLayoutColumns(): Array<PanelLayoutColumnModel> {
    this.generateColumns([]);
    return this._columns;
  }
  public updateGridColumns(): void {
    this.updateColumns();
    this.elements.forEach(el => {
      el.isPanel && (<any>el as PanelModelBase).updateGridColumns();
    });
  }
  public getColumsForElement(el: IElement): Array<PanelLayoutColumnModel> {
    const row = this.findRowByElement(el);
    if (!row || !this.survey || !this.survey.gridLayoutEnabled) return [];

    let lastExpandableElementIndex = row.elements.length - 1;
    while (lastExpandableElementIndex >= 0) {
      if (!(row.elements[lastExpandableElementIndex] as any).getPropertyValueWithoutDefault("colSpan")) {
        break;
      }
      lastExpandableElementIndex--;
    }

    const elementIndex = row.elements.indexOf(el);
    let startIndex = 0;
    for (let index = 0; index < elementIndex; index++) {
      startIndex += row.elements[index].colSpan;
    }
    let currentColSpan = (el as any).getPropertyValueWithoutDefault("colSpan");
    if (!currentColSpan && elementIndex === lastExpandableElementIndex) {
      let usedSpans = 0;
      for (let index = 0; index < row.elements.length; index++) {
        if (index !== lastExpandableElementIndex) {
          usedSpans += row.elements[index].colSpan;
        }
      }
      currentColSpan = this.columns.length - usedSpans;
    }
    const result = this.columns.slice(startIndex, startIndex + (currentColSpan || 1));
    (el as any).setPropertyValueDirectly("effectiveColSpan", result.length);
    return result;
  }
  protected getStartIndex(): string {
    if (!!this.parent) return this.parent.getQuestionStartIndex();
    if (!!this.survey) return this.survey.questionStartIndex;
    return "";
  }
  getQuestionStartIndex(): string {
    return this.getStartIndex();
  }
  getChildrenLayoutType(): string {
    return "row";
  }
  public getProgressInfo(): IProgressInfo {
    return SurveyElement.getProgressInfoByElements(
      <Array<SurveyElement>>(<any>this.elements),
      this.isRequired
    );
  }
  public get root(): PanelModelBase {
    var res = <PanelModelBase>this;
    while (res.parent) res = res.parent;
    return res;
  }
  protected childVisibilityChanged() {
    var newIsVisibleValue = this.getIsPageVisible(null);
    var oldIsVisibleValue = this.getPropertyValue("isVisible", true);
    if (newIsVisibleValue !== oldIsVisibleValue) {
      this.onVisibleChanged();
    }
  }
  protected canRenderFirstRows(): boolean {
    return this.isPage;
  }
  private isLazyRenderInRow(rowIndex: number): boolean {
    if (!this.survey || !this.survey.isLazyRendering) return false;
    return (
      rowIndex >= this.survey.lazyRenderFirstBatchSize ||
      !this.canRenderFirstRows()
    );
  }
  private createRowAndSetLazy(index: number): QuestionRowModel {
    const row = this.createRow();
    row.setIsLazyRendering(this.isLazyRenderInRow(index));
    return row;
  }
  protected createRow(): QuestionRowModel {
    return new QuestionRowModel(this);
  }
  public onSurveyLoad(): void {
    this.blockAnimations();
    super.onSurveyLoad();
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].onSurveyLoad();
    }
    this.onElementVisibilityChanged(this);
    this.releaseAnimations();
  }
  protected onFirstRenderingCore(): void {
    super.onFirstRenderingCore();
    this.onRowsChanged();
    this.elements.forEach(el => el.onFirstRendering());
  }
  public updateRows(): void {
    if (this.isLoadingFromJson) return;
    this.getElementsForRows().forEach(el => {
      if(el.isPanel) {
        (<PanelModel>el).updateRows();
      }
    });
    this.onRowsChanged();
  }
  get rows(): Array<QuestionRowModel> {
    return this.getPropertyValue("rows");
  }

  public ensureRowsVisibility(): void {
    this.rows.forEach((row) => {
      row.ensureVisibility();
    });
  }

  protected onRowsChanged(): void {
    if (this.isLoadingFromJson) return;
    this.blockAnimations();
    this.setArrayPropertyDirectly("rows", this.buildRows());
    this.updateColumns();
    this.releaseAnimations();
  }

  private locCountRowUpdates = 0;
  private blockRowsUpdates() {
    this.locCountRowUpdates++;
  }
  private releaseRowsUpdates() {
    this.locCountRowUpdates--;
  }
  private updateRowsBeforeElementRemoved(element: IElement): void {
    const elementRow = this.findRowByElement(element);
    const elementRowIndex = this.rows.indexOf(elementRow);
    const elementIndexInRow = elementRow.elements.indexOf(element);
    elementRow.elements.splice(elementIndexInRow, 1);
    if(elementRow.elements.length == 0) {
      this.rows.splice(elementRowIndex, 1);
    } else if(!elementRow.elements[0].startWithNewLine && this.rows[elementRowIndex - 1]) {
      elementRow.elements.forEach(el => this.rows[elementRowIndex - 1].addElement(el));
      this.rows.splice(elementRowIndex, 1);
    }
    else {
      elementRow.updateVisible();
    }
  }
  private updateRowsOnElementAdded(element: IElement): void {
    const index = this.elements.indexOf(element);
    const targetElement = this.elements[index + 1];
    const createRowAtIndex = (index: number) => {
      const row = this.createRowAndSetLazy(index);
      if (this.isDesignMode) {
        row.setIsLazyRendering(false);
      }
      this.rows.splice(index, 0, row);
      return row;
    };
    const updateRow = (row: QuestionRowModel, start: number, deleteCount: number, ...elements: IElement[]) => {
      const removedElements = row.elements.splice(start, deleteCount, ...elements);
      row.updateVisible();
      return removedElements;
    };
    if(!targetElement) {
      if(index == 0 || element.startWithNewLine) {
        updateRow(createRowAtIndex(this.rows.length), 0, 0, element);
      } else {
        this.rows[this.rows.length - 1].addElement(element);
      }
      return;
    }
    const targetRow = this.findRowByElement(targetElement);
    if(!targetRow) return;
    const targetRowIndex = this.rows.indexOf(targetRow);
    const targetElementIndexInRow = targetRow.elements.indexOf(targetElement);
    if(targetElementIndexInRow == 0) {
      if(!targetElement.startWithNewLine) {
        updateRow(targetRow, 0, 0, element);
      }
      else if(element.startWithNewLine || targetRowIndex < 1) {
        createRowAtIndex(targetRowIndex).addElement(element);
      } else {
        this.rows[targetRowIndex - 1].addElement(element);
      }
    } else {
      if(element.startWithNewLine) {
        updateRow(createRowAtIndex(targetRowIndex + 1), 0, 0, ...[element].concat(updateRow(targetRow, targetElementIndexInRow, targetRow.elements.length)));
      } else {
        updateRow(targetRow, targetElementIndexInRow, 0, element);
      }
    }
  }
  private canFireAddRemoveNotifications(element: IElement): boolean {
    return !!this.survey && (<any>element).prevSurvey !== this.survey;
  }
  protected onAddElement(element: IElement, index: number): void {
    const survey = this.survey;
    const fireNotification = this.canFireAddRemoveNotifications(element);
    if(!!this.surveyImpl) {
      element.setSurveyImpl(this.surveyImpl);
    }
    element.parent = this;
    this.markQuestionListDirty();
    if (this.canBuildRows()) {
      this.updateRowsOnElementAdded(element);
    }
    if(fireNotification) {
      if (element.isPanel) {
        survey.panelAdded(<PanelModel>element, index, this, this.root);
      } else {
        survey.questionAdded(<Question>element, index, this, this.root);
      }
    }
    if (!!this.addElementCallback) this.addElementCallback(element);
    (<Base>(<any>element)).registerPropertyChangedHandlers(
      ["visible", "isVisible"], () => {
        this.onElementVisibilityChanged(element);
      },
      this.id
    );
    (<Base>(<any>element)).registerPropertyChangedHandlers(["startWithNewLine"], () => {
      this.onElementStartWithNewLineChanged(element);
    }, this.id);
    this.onElementVisibilityChanged(this);
  }
  protected onRemoveElement(element: IElement): void {
    element.parent = null;
    this.unregisterElementPropertiesChanged(element);
    this.markQuestionListDirty();
    this.updateRowsOnElementRemoved(element);
    if (this.isRandomizing) return;
    this.onRemoveElementNotifySurvey(element);
    if (!!this.removeElementCallback) this.removeElementCallback(element);
    this.onElementVisibilityChanged(this);
  }
  protected unregisterElementPropertiesChanged(element: IElement): void {
    (<Base>(<any>element)).unregisterPropertyChangedHandlers(["visible", "isVisible", "startWithNewLine"], this.id);
  }
  private onRemoveElementNotifySurvey(element: IElement): void {
    if(!this.canFireAddRemoveNotifications(element)) return;
    if (!element.isPanel) {
      this.survey.questionRemoved(<Question>element);
    } else {
      this.survey.panelRemoved(element);
    }
  }
  private onElementVisibilityChanged(element: any) {
    if (this.isLoadingFromJson || this.isRandomizing) return;
    this.updateRowsVisibility(element);
    this.childVisibilityChanged();
    if (!!this.parent) {
      this.parent.onElementVisibilityChanged(this);
    }
  }
  private onElementStartWithNewLineChanged(element: any) {
    if(this.locCountRowUpdates > 0) return;
    this.blockAnimations();
    this.updateRowsBeforeElementRemoved(element);
    this.updateRowsOnElementAdded(element);
    this.releaseAnimations();
  }
  private updateRowsVisibility(element: any) {
    var rows = this.rows;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.elements.indexOf(element) > -1) {
        row.updateVisible();
        if (row.visible && !row.isNeedRender) {
          row.isNeedRender = true;
        }
        break;
      }
    }
  }
  public canBuildRows(): boolean {
    return !this.isLoadingFromJson && this.getChildrenLayoutType() == "row";
  }
  private buildRows(): Array<QuestionRowModel> {
    if (!this.canBuildRows()) return [];
    const res = new Array<QuestionRowModel>();
    const els = this.getElementsForRows();
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const isNewRow = i == 0 || el.startWithNewLine;
      const row = isNewRow ? this.createRowAndSetLazy(res.length) : res[res.length - 1];
      if (isNewRow) res.push(row);
      row.addElement(el);
    }
    res.forEach(row => row.updateVisible());
    return res;
  }
  protected getElementsForRows(): Array<IElement> {
    return this.elements;
  }
  public getDragDropInfo(): any {
    const page: PanelModelBase = <any>this.getPage(this.parent);
    return !!page ? page.getDragDropInfo() : undefined;
  }
  private updateRowsOnElementRemoved(element: IElement) {
    if (!this.canBuildRows()) return;
    this.updateRowsRemoveElementFromRow(element, this.findRowByElement(element));
    this.updateColumns();
  }
  private updateRowsRemoveElementFromRow(element: IElement, row: QuestionRowModel): void {
    if (!row || !row.panel) return;
    var elIndex = row.elements.indexOf(element);
    if (elIndex < 0) return;
    row.elements.splice(elIndex, 1);
    if (row.elements.length > 0) {
      this.blockRowsUpdates();
      row.elements[0].startWithNewLine = true;
      this.releaseRowsUpdates();
      row.updateVisible();
    } else {
      if (row.index >= 0) {
        row.panel.rows.splice(row.index, 1);
      }
    }
  }
  public getAllRows(): Array<QuestionRowModel> {
    const allRows: Array<QuestionRowModel> = [];
    this.rows.forEach(row => {
      const nestedRows: Array<QuestionRowModel> = [];
      row.elements.forEach(element => {
        if (element.isPanel) {
          nestedRows.push(...(<any>element as PanelModelBase).getAllRows());
        } else if (element.getType() == "paneldynamic") {
          if (this.isDesignMode) {
            nestedRows.push(...(element as any).template.getAllRows());
          } else {
            (element as any).panels.forEach((panel: PanelModelBase) => nestedRows.push(...panel.getAllRows()));
          }
        }
      });
      allRows.push(row);
      allRows.push(...nestedRows);
    });
    return allRows;
  }
  private findRowAndIndexByElement(el: IElement, rows?: Array<QuestionRowModel>): { row: QuestionRowModel, index: number } {
    if (!el) {
      return { row: undefined, index: this.rows.length - 1 };
    }
    rows = rows || this.rows;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].elements.indexOf(el) > -1) return { row: rows[i], index: i };
    }
    return { row: null, index: -1 };
  }
  private forceRenderRow(row: QuestionRowModel): void {
    if (!!row && !row.isNeedRender) {
      row.isNeedRender = true;
      row.stopLazyRendering();
    }
  }
  public forceRenderElement(el: IElement, elementsRendered = () => { }, gap = 0): void {
    const allRows = this.getAllRows();
    const { row, index } = this.findRowAndIndexByElement(el, allRows);
    if (index >= 0 && index < allRows.length) {
      const rowsToRender = [];
      rowsToRender.push(row);
      for (let i = index - 1; i >= index - gap && i >= 0; i--) {
        rowsToRender.push(allRows[i]);
      }
      this.forceRenderRows(rowsToRender, elementsRendered);
    }
  }
  public forceRenderRows(rows: Array<QuestionRowModel>, elementsRendered = () => { }): void {
    const rowRenderedHandler = (rowsCount => () => {
      rowsCount--;
      if (rowsCount <= 0) {
        elementsRendered();
      }
    })(rows.length);
    rows.forEach(row => new RenderingCompletedAwaiter(row.visibleElements as any, rowRenderedHandler));
    rows.forEach(row => this.forceRenderRow(row));
  }
  public findRowByElement(el: IElement): QuestionRowModel {
    return this.findRowAndIndexByElement(el).row;
  }
  elementWidthChanged(el: IElement) {
    if (this.isLoadingFromJson) return;
    var row = this.findRowByElement(el);
    if (!!row) {
      row.updateVisible();
    }
  }
  public get processedTitle() {
    return this.getRenderedTitle(this.locTitle.textOrHtml);
  }
  protected getRenderedTitle(str: string): string {
    return this.textProcessor != null
      ? this.textProcessor.processText(str, true)
      : str;
  }
  /**
   * Gets or sets panel/page visibility.
   *
   * If you want to display or hide a survey element based on a condition, specify the `visibleIf` property. Refer to the following help topic for information: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#conditional-visibility).
   * @see visibleIf
   * @see isVisible
   */
  public get visible(): boolean {
    return this.getPropertyValue("visible", true);
  }
  public set visible(value: boolean) {
    if (value === this.visible) return;
    this.setPropertyValue("visible", value);
    this.setPropertyValue("isVisible", this.isVisible);
    if (!this.isLoadingFromJson) this.onVisibleChanged();
  }
  public onHidingContent(): void {
    this.questions.forEach(q => q.onHidingContent());
  }
  protected onVisibleChanged(): void {
    if (this.isRandomizing) return;
    this.setPropertyValue("isVisible", this.isVisible);
    if (
      !!this.survey && this.survey.getQuestionClearIfInvisible("default") !== "none" &&
      !this.isLoadingFromJson
    ) {
      const questions = this.questions;
      const isVisible = this.isVisible;
      for (var i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!isVisible) {
          q.clearValueIfInvisible("onHiddenContainer");
          q.onHidingContent();
        } else {
          q.updateValueWithDefaults();
        }
      }
    }
  }
  protected notifyStateChanged(prevState: string): void {
    super.notifyStateChanged(prevState);
    if(this.isCollapsed) {
      this.questions.forEach(q => q.onHidingContent());
    }
  }

  /**
   * Returns `true` if the panel/page is visible or the survey is currently in design mode.
   *
   * If you want to display or hide a question based on a condition, specify the `visibleIf` property. Refer to the following help topic for information: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#conditional-visibility).
   * @see visibleIf
   * @see visible
   */
  public get isVisible(): boolean {
    return this.areInvisibleElementsShowing || this.getIsPageVisible(null);
  }
  getIsContentVisible(exceptionQuestion?: IQuestion) {
    if(this.areInvisibleElementsShowing) return true;
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i] == exceptionQuestion) continue;
      if (this.elements[i].isVisible) return true;
    }
    return false;
  }
  getIsPageVisible(exceptionQuestion?: IQuestion): boolean {
    const isContentVisible = this.getIsContentVisible(exceptionQuestion);
    return this.visible && isContentVisible;
  }
  private lastVisibleIndex: number;
  public setVisibleIndex(index: number): number {
    if (!this.isVisible || index < 0) {
      this.resetVisibleIndexes();
      return 0;
    }
    this.lastVisibleIndex = index;
    var startIndex = index;
    index += this.beforeSetVisibleIndex(index);
    var panelStartIndex = this.getPanelStartIndex(index);
    var panelIndex = panelStartIndex;
    const elements = this.elements;
    for (var i = 0; i < elements.length; i++) {
      panelIndex += elements[i].setVisibleIndex(panelIndex);
    }
    if (this.isContinueNumbering()) {
      index += panelIndex - panelStartIndex;
    }
    return index - startIndex;
  }
  private updateVisibleIndexes() {
    if (this.lastVisibleIndex === undefined) return;
    this.resetVisibleIndexes();
    this.setVisibleIndex(this.lastVisibleIndex);
  }
  private resetVisibleIndexes() {
    const elements = this.elements;
    for (var i = 0; i < elements.length; i++) {
      elements[i].setVisibleIndex(-1);
    }
  }
  protected beforeSetVisibleIndex(index: number): number {
    return 0;
  }
  protected getPanelStartIndex(index: number): number {
    return index;
  }
  protected isContinueNumbering(): boolean { return true; }
  public get isReadOnly(): boolean {
    var isParentReadOnly = !!this.parent && this.parent.isReadOnly;
    var isSurveyReadOnly = !!this.survey && this.survey.isDisplayMode;
    return this.readOnly || isParentReadOnly || isSurveyReadOnly;
  }
  protected onReadOnlyChanged(): void {
    for (var i = 0; i < this.elements.length; i++) {
      var el = <SurveyElement>(<any>this.elements[i]);
      el.setPropertyValue("isReadOnly", el.isReadOnly);
    }
    super.onReadOnlyChanged();
  }
  public updateElementCss(reNew?: boolean): void {
    super.updateElementCss(reNew);
    for (let i = 0; i < this.elements.length; i++) {
      const el = <SurveyElement>(<any>this.elements[i]);
      el.updateElementCss(reNew);
    }
  }
  /**
   * A Boolean expression. If it evaluates to `false`, this panel/page becomes read-only.
   *
   * A survey parses and runs all expressions on startup. If any values used in the expression change, the survey re-evaluates it.
   *
   * Refer to the following help topic for more information: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#conditional-visibility).
   * @see readOnly
   * @see isReadOnly
   */
  public get enableIf(): string {
    return this.getPropertyValue("enableIf", "");
  }
  public set enableIf(val: string) {
    this.setPropertyValue("enableIf", val);
  }
  /**
   * Adds a survey element (question or panel) to this panel/page. Returns `true` if the element was added successfully; `false` otherwise.
   * @param element A survey element to add.
   * @param index A desired index of this element in the `elements` array.
   * @see addNewQuestion
   * @see addNewPanel
   */
  public addElement(element: IElement, index: number = -1): boolean {
    if (!this.canAddElement(element)) return false;
    if (index < 0 || index >= this.elements.length) {
      this.elements.push(element);
    } else {
      this.elements.splice(index, 0, element);
    }
    if(this.wasRendered) {
      element.onFirstRendering();
    }
    this.updateColumns();
    return true;
  }
  public insertElement(element: IElement, dest?: IElement, location: "bottom" | "top" | "left" | "right" = "bottom"): void {
    if(!dest) {
      this.addElement(element);
      return;
    }
    this.blockRowsUpdates();
    let index = this.elements.indexOf(dest);
    const destRow = this.findRowByElement(dest);
    if(location == "left" || location == "right") {
      if(location == "right") {
        element.startWithNewLine = false;
        index++;
      }
      else {
        if(destRow.elements.indexOf(dest) == 0) {
          dest.startWithNewLine = false;
          element.startWithNewLine = true;
        } else {
          element.startWithNewLine = false;
        }
      }
    }
    else {
      element.startWithNewLine = true;
      if(location == "top") {
        index = this.elements.indexOf(destRow.elements[0]);
      } else {
        index = this.elements.indexOf(destRow.elements[destRow.elements.length - 1]) + 1;
      }
    }
    this.releaseRowsUpdates();
    this.addElement(element, index);
  }
  public insertElementAfter(element: IElement, after: IElement) {
    const index = this.elements.indexOf(after);
    if (index >= 0) this.addElement(element, index + 1);
  }
  public insertElementBefore(element: IElement, before: IElement) {
    const index = this.elements.indexOf(before);
    if (index >= 0) this.addElement(element, index);
  }

  protected canAddElement(element: IElement): boolean {
    return (
      !!element && element.isLayoutTypeSupported(this.getChildrenLayoutType())
    );
  }
  public addQuestion(question: Question, index: number = -1): boolean {
    return this.addElement(question, index);
  }
  public addPanel(panel: PanelModel, index: number = -1): boolean {
    return this.addElement(panel, index);
  }
  /**
   * Creates a new question of a given type and adds it to the `elements` array at a specified index.
   *
   * This method returns `null` if the question cannot be created or added to this panel/page; otherwise, the method returns the created question.
   *
   * @param questionType A [question type](https://surveyjs.io/form-library/documentation/question#getType).
   * @param name A question name.
   * @param index A desired index of the new question in the `elements` array.
   * @see elements
   * @see addElement
   */
  public addNewQuestion(
    questionType: string,
    name: string = null,
    index: number = -1
  ): Question {
    var question = QuestionFactory.Instance.createQuestion(questionType, name);
    if (!this.addQuestion(question, index)) return null;
    return question;
  }
  /**
   * Creates a new panel and adds it to the end of the `elements` array.
   *
   * This method returns `null` if the panel cannot be created or added to this panel/page; otherwise, the method returns the created panel.
   * @param name A panel name.
   * @see elementsup
   * @see addElement
   */
  public addNewPanel(name: string = null): PanelModel {
    var panel = this.createNewPanel(name);
    if (!this.addPanel(panel)) return null;
    return panel;
  }
  public indexOf(element: IElement): number {
    return this.elements.indexOf(element);
  }
  protected createNewPanel(name: string): PanelModel {
    var res = Serializer.createClass("panel");
    res.name = name;
    return res;
  }
  /**
   * Deletes a survey element (question or panel) from this panel/page. Returns `true` if the element was deleted successfully; `false` otherwise.
   * @param element A survey element to delete.
   * @see elements
   */
  public removeElement(element: IElement): boolean {
    var index = this.elements.indexOf(element);
    if (index < 0) {
      for (var i = 0; i < this.elements.length; i++) {
        if (this.elements[i].removeElement(element)) return true;
      }
      return false;
    }
    this.elements.splice(index, 1);
    this.updateColumns();
    return true;
  }
  public removeQuestion(question: Question) {
    this.removeElement(question);
  }
  runCondition(values: HashTable<any>, properties: HashTable<any>) {
    if (this.isDesignMode || this.isLoadingFromJson) return;
    var elements = this.elements.slice();
    for (var i = 0; i < elements.length; i++) {
      elements[i].runCondition(values, properties);
    }
    this.runConditionCore(values, properties);
  }
  onAnyValueChanged(name: string, questionName: string): void {
    var els = this.elements;
    for (var i = 0; i < els.length; i++) {
      els[i].onAnyValueChanged(name, questionName);
    }
  }
  checkBindings(valueName: string, value: any) {
    var els = this.elements;
    for (var i = 0; i < els.length; i++) {
      (<Base>(<any>els[i])).checkBindings(valueName, value);
    }
  }

  // TODO: remove it or not?
  public dragDropFindRow(findElement: ISurveyElement): QuestionRowModel {
    if (!findElement || findElement.isPage) return null;
    var element = <IElement>findElement;
    var rows = this.rows;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].elements.indexOf(element) > -1) return rows[i];
    }
    for (var i = 0; i < this.elements.length; i++) {
      var pnl = this.elements[i].getPanel();
      if (!pnl) continue;
      var row = (<PanelModelBase>pnl).dragDropFindRow(element);
      if (!!row) return row;
    }
    return null;

  }

  public needResponsiveWidth() {
    let result = false;
    this.elements.forEach((e) => {
      if (e.needResponsiveWidth())
        result = true;
    });
    this.rows.forEach((r) => {
      if (r.elements.length > 1)
        result = true;
    });

    return result;
  }

  public get hasDescriptionUnderTitle(): boolean {
    return this.hasDescription;
  }
  public get cssHeader(): string {
    return this.cssClasses.panel.header;
  }
  public get cssDescription(): string {
    return this.cssClasses.panel.description;
  }
  /**
   * Specifies the error message position for questions that belong to this page/panel.
   *
   * Use this property to override the [`questionErrorLocation`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#questionErrorLocation) property specified for the survey. You can also set the [`errorLocation`](https://surveyjs.io/form-library/documentation/question#errorLocation) property for individual questions.
   *
   * Possible values:
   *
   * - `"default"` (default) - Inherits the setting from the `questionErrorLocation` property specified for the survey.
   * - `"top"` - Displays error messages above questions.
   * - `"bottom"` - Displays error messages below questions.
   */
  public get questionErrorLocation(): string {
    return this.getPropertyValue("questionErrorLocation");
  }
  public set questionErrorLocation(val: string) {
    this.setPropertyValue("questionErrorLocation", val);
  }
  public getQuestionErrorLocation(): string {
    if(this.questionErrorLocation !== "default") return this.questionErrorLocation;
    if(this.parent) return this.parent.getQuestionErrorLocation();
    return this.survey ? this.survey.questionErrorLocation : "top";
  }
  //ITitleOwner
  public getTitleOwner(): ITitleOwner { return this; }
  public get no(): string { return ""; }
  public get cssTitleNumber(): string {
    return this.cssClasses.panel.number;
  }
  public get cssRequiredMark(): string {
    return this.cssClasses.panel.requiredMark;
  }

  public get cssError(): string {
    return this.getCssError(this.cssClasses);
  }
  protected getCssError(cssClasses: any): string {
    return new CssClassBuilder().append(cssClasses.error.root).toString();
  }

  public getSerializableColumnsValue(): Array<PanelLayoutColumnModel> {
    let tailIndex = -1;
    for (let index = this.gridLayoutColumns.length - 1; index >= 0; index--) {
      if (!this.gridLayoutColumns[index].isEmpty()) {
        tailIndex = index;
        break;
      }
    }
    return this.gridLayoutColumns.slice(0, tailIndex + 1);
  }
  public afterRender(el: HTMLElement): void {
    this.afterRenderCore(el);
  }
  public dispose(): void {
    super.dispose();
    if (this.rows) {
      for (let i = 0; i < this.rows.length; i++) {
        this.rows[i].dispose();
      }
      this.rows.splice(0, this.rows.length);
    }
    this.disposeElements();
    this.elements.splice(0, this.elements.length);
  }
  protected disposeElements(): void {
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i].dispose();
    }
  }
}

/**
 * A class that describes the Panel container element.
 *
 * A panel can contain questions and other panels. Refer to the following help topic for an illustration: [Survey Structure](https://surveyjs.io/form-library/documentation/design-survey-create-a-simple-survey#survey-structure).
 *
 * [View Demo](https://surveyjs.io/form-library/examples/questiontype-panel/ (linkStyle))
 */
export class PanelModel extends PanelModelBase implements IElement {
  constructor(name: string = "") {
    super(name);
    this.createNewArray("footerActions");
    this.registerPropertyChangedHandlers(["width"], () => {
      if (!!this.parent) {
        this.parent.elementWidthChanged(this);
      }
    });
    this.registerPropertyChangedHandlers(
      ["indent", "innerIndent", "rightIndent"], () => { this.resetIndents(); });
    this.registerPropertyChangedHandlers(["colSpan"], () => { this.parent?.updateColumns(); });
  }
  public getType(): string {
    return "panel";
  }
  public get contentId(): string {
    return this.id + "_content";
  }
  public getSurvey(live: boolean = false): ISurvey {
    if (live && this.isPanel) {
      return !!this.parent ? this.parent.getSurvey(live) : null;
    }
    return super.getSurvey(live);
  }
  public get isPanel(): boolean {
    return true;
  }
  /**
   * Returns a page to which the panel belongs and allows you to move this panel to a different page.
   * @see PanelModelBase.parent
   */
  public get page(): IPage {
    return this.getPage(this.parent);
  }
  public set page(val: IPage) {
    this.setPage(this.parent, val);
  }
  protected removeFromParent(): void {
    if (!!this.parent) {
      this.removeSelfFromList(this.parent.elements);
    }
  }
  public moveTo(container: IPanel, insertBefore: any = null): boolean {
    return this.moveToBase(this.parent, container, insertBefore);
  }
  /**
   * Returns the visible index of the panel in the survey. Commonly it is -1 and it doesn't show.
   * You have to set showNumber to true to show index/numbering for the Panel
   * @see showNumber
   */
  public get visibleIndex(): number {
    return this.getPropertyValue("visibleIndex", -1);
  }
  /**
   * Specifies whether to show the panel number in the title.
   *
   * Default value: `false`
   * @see SurveyModel.showQuestionNumbers
   * @see SurveyModel.questionTitlePattern
   */
  public get showNumber(): boolean {
    return this.getPropertyValue("showNumber");
  }
  public set showNumber(val: boolean) {
    this.setPropertyValue("showNumber", val);
    this.notifySurveyOnVisibilityChanged();
  }
  /**
   * Gets or sets a value that specifies how the elements numbers inside panel are displayed.
   *
   * The following options are available:
   *
   * - `default` - display questions numbers as defined in parent panel or survey
   * - `onpanel` - display questions numbers, start numbering from beginning of this page
   * - `off` - turn off the numbering for questions titles
   * @see showNumber
   */
  public get showQuestionNumbers(): string {
    return this.getPropertyValue("showQuestionNumbers");
  }
  public set showQuestionNumbers(value: string) {
    this.setPropertyValue("showQuestionNumbers", value);
    this.notifySurveyOnVisibilityChanged();
  }
  /**
   * Specifies a number or letter used to start numbering of elements inside the panel.
   *
   * You can include desired prefixes and postfixes alongside the number or letter:
   *
   * ```js
   * "questionStartIndex": "a.", // a., b., c., ...
   * "questionStartIndex": "#3", // #3, #4, #5, ...
   * "questionStartIndex": "(B)." // (B)., (C)., (D)., ...
   * ```
   * Default value: `"1."` (inherited from `SurveyModel`'s `questionStartIndex` property)
   * @see SurveyModel.questionStartIndex
   * @see showQuestionNumbers
   */
  public get questionStartIndex(): string {
    return this.getPropertyValue("questionStartIndex", "");
  }
  public set questionStartIndex(val: string) {
    this.setPropertyValue("questionStartIndex", val);
  }
  getQuestionStartIndex(): string {
    if (!!this.questionStartIndex) return this.questionStartIndex;
    return super.getQuestionStartIndex();
  }
  /**
   * A question number or letter (depends on the `questionStartIndex` property).
   *
   * When the question number, title, or the entire question is invisible, this property returns an empty string.
   * @see questionStartIndex
   * @see showNumber
   * @see visibleIf
   */
  public get no(): string {
    return this.getPropertyValue("no", undefined, () => this.calcNo());
  }
  private calcNo(): string {
    let no = Helpers.getNumberByIndex(this.visibleIndex, this.getStartIndex());
    if(this.survey) {
      no = this.survey.getUpdatedPanelNo(this, no);
    }
    return no || "";
  }
  protected notifyStateChanged(prevState: string): void {
    if(!this.isLoadingFromJson) {
      this.locTitle.strChanged();
    }
    super.notifyStateChanged(prevState);
  }
  protected createLocTitleProperty(): LocalizableString {
    const locTitleValue = super.createLocTitleProperty();
    locTitleValue.onGetTextCallback = (text: string): string => {
      if (!text && (this.state !== "default")) {
        text = this.name;
      }
      return text;
    };
    return locTitleValue;
  }
  protected beforeSetVisibleIndex(index: number): number {
    if(this.isPage) return super.beforeSetVisibleIndex(index);
    let visibleIndex = -1;
    if (this.showNumber && (this.isDesignMode || !this.locTitle.isEmpty || this.hasParentInQuestionIndex())) {
      visibleIndex = index;
    }
    this.setPropertyValue("visibleIndex", visibleIndex);
    this.resetPropertyValue("no");
    return visibleIndex < 0 ? 0 : 1;
  }
  protected getPanelStartIndex(index: number): number {
    if (this.showQuestionNumbers === "off") return -1;
    if (this.showQuestionNumbers === "onpanel") return 0;
    return index;
  }
  private hasParentInQuestionIndex(): boolean {
    if(this.showQuestionNumbers !== "onpanel") return false;
    const str = this.questionStartIndex;
    const index = str.indexOf(".");
    return index > -1 && index < str.length - 1;
  }
  protected isContinueNumbering(): boolean {
    return this.showQuestionNumbers !== "off" && this.showQuestionNumbers !== "onpanel";
  }
  private notifySurveyOnVisibilityChanged() {
    if (this.survey != null && !this.isLoadingFromJson && !!this.page) {
      this.survey.panelVisibilityChanged(this, this.isVisible);
    }
  }
  protected getRenderedTitle(str: string): string {
    if (this.isPanel && !str) {
      if (this.isCollapsed || this.isExpanded) return this.name;
      if (this.isDesignMode) return "[" + this.name + "]";
    }
    return super.getRenderedTitle(str);
  }
  /**
   * Increases or decreases an indent of panel content from the left edge. Accepts positive integer values and 0.
   */
  public get innerIndent(): number {
    return this.getPropertyValue("innerIndent");
  }
  public set innerIndent(val: number) {
    this.setPropertyValue("innerIndent", val);
  }
  /**
   * Disable this property if you want to render the current panel on the same line or row with the previous question or panel.
   */
  public get startWithNewLine(): boolean {
    return this.getPropertyValue("startWithNewLine");
  }
  public set startWithNewLine(value: boolean) {
    this.setPropertyValue("startWithNewLine", value);
  }
  public get allowAdaptiveActions(): boolean {
    return this.getPropertyValue("allowAdaptiveActions");
  }
  public set allowAdaptiveActions(val: boolean) {
    this.setPropertyValue("allowAdaptiveActions", val);
  }
  get innerPaddingLeft(): string {
    const func = (): string => {
      return this.getIndentSize(this.innerIndent);
    };
    return this.getPropertyValue("innerPaddingLeft", undefined, func);
  }
  set innerPaddingLeft(val: string) {
    this.setPropertyValue("innerPaddingLeft", val);
  }
  protected calcPaddingLeft(): string {
    return this.getIndentSize(this.indent);
  }
  protected calcPaddingRight(): string {
    return this.getIndentSize(this.rightIndent);
  }
  protected resetIndents(): void {
    this.resetPropertyValue("innerPaddingLeft");
    super.resetIndents();
  }

  private getIndentSize(indent: number): string {
    if(!this.survey) return undefined;
    if (indent < 1) return "";
    var css = (<any>this).survey["css"];
    if (!css || !css.question || !css.question.indent) return "";
    return indent * css.question.indent + "px";
  }
  public clearOnDeletingContainer(): void {
    this.elements.forEach((element) => {
      if (element instanceof Question || element instanceof PanelModel) {
        element.clearOnDeletingContainer();
      }
    });
  }
  public get footerActions(): Array<IAction> {
    return this.getPropertyValue("footerActions");
  }
  private footerToolbarValue: ActionContainer;

  public onGetFooterActionsCallback: () => Array<IAction>;
  public onGetFooterToolbarCssCallback: () => string;
  public getFooterToolbar(): ActionContainer {
    if (!this.footerToolbarValue) {
      var actions = this.footerActions;
      if (this.hasEditButton) {
        actions.push({
          id: "cancel-preview",
          locTitle: this.survey.locEditText,
          innerCss: this.survey.cssNavigationEdit,
          component: "sv-nav-btn",
          action: () => { this.cancelPreview(); }
        });
      }
      if(!!this.onGetFooterActionsCallback) {
        actions = this.onGetFooterActionsCallback();
      } else {
        actions = this.survey?.getUpdatedPanelFooterActions(this, actions);
      }
      this.footerToolbarValue = this.createActionContainer(this.allowAdaptiveActions);
      let footerCss = this.onGetFooterToolbarCssCallback ? this.onGetFooterToolbarCssCallback() : "";
      if(!footerCss) {
        footerCss = this.cssClasses.panel?.footer;
      }
      if(footerCss) {
        this.footerToolbarValue.containerCss = footerCss;
      }
      this.footerToolbarValue.setItems(actions);
    }
    return this.footerToolbarValue;
  }
  public get hasEditButton(): boolean { return false; }
  public cancelPreview(): void {
    if (!this.hasEditButton) return;
    this.survey.cancelPreviewByPage(this);
  }
  public get cssTitle(): string {
    return this.getCssPanelTitle();
  }
  protected getCssPanelTitle(): string {
    return this.getCssTitle(this.cssClasses.panel);
  }
  public getCssTitleExpandableSvg(): string {
    if (this.state === "default") return null;
    return this.cssClasses.panel.titleExpandableSvg;
  }
  public get showErrorsAbovePanel(): boolean {
    return this.isDefaultV2Theme && !this.showPanelAsPage;
  }
  protected getCssError(cssClasses: any): string {
    if(this.isPage) return super.getCssError(cssClasses);
    const builder = new CssClassBuilder()
      .append(super.getCssError(cssClasses))
      .append(cssClasses.panel.errorsContainer);
    return builder.append("panel-error-root", builder.isEmpty()).toString();
  }
  protected onVisibleChanged() {
    super.onVisibleChanged();
    this.notifySurveyOnVisibilityChanged();
  }
  public needResponsiveWidth() {
    if (!this.startWithNewLine) {
      return true;
    }
    else {
      return super.needResponsiveWidth();
    }
  }
  public focusIn(): void {
    if(!this.survey) return;
    (this.survey as SurveyModel).whenPanelFocusIn(this);
  }
  protected getHasFrameV2(): boolean {
    return super.getHasFrameV2() && !this.showPanelAsPage;
  }
  protected getIsNested(): boolean {
    return super.getIsNested() && this.parent !== undefined;
  }
  public get showPanelAsPage(): boolean {
    return false;
  }
  private forcusFirstQuestionOnExpand = true;
  public expand(focusFirstQuestion: boolean = true) {
    this.forcusFirstQuestionOnExpand = focusFirstQuestion;
    super.expand();
  }
  protected onElementExpanded(elementIsRendered: boolean): void {
    if(!this.forcusFirstQuestionOnExpand) { return; }
    if(this.survey != null && !this.isLoadingFromJson) {
      const q = this.getFirstQuestionToFocus(false);
      if(!!q) {
        setTimeout(() => {
          if(!this.isDisposed && !!this.survey) {
            this.survey.scrollElementToTop(q, q, null, q.inputId, false, { behavior: "smooth" });
          }
        }, elementIsRendered ? 0: 15);
      }
    }
  }
  protected getCssRoot(cssClasses: { [index: string]: string }): string {
    return new CssClassBuilder()
      .append(super.getCssRoot(cssClasses))
      .append(cssClasses.container)
      .append(cssClasses.asPage, this.showPanelAsPage)
      .append(cssClasses.invisible, !this.isDesignMode && this.areInvisibleElementsShowing && !this.visible)
      .toString();
  }
  public getContainerCss(): string {
    return this.getCssRoot(this.cssClasses.panel);
  }
  public afterRenderCore(element: HTMLElement): void {
    super.afterRenderCore(element);
    if(this.isPanel) {
      this.survey?.afterRenderPanel(this, element);
    }
  }
}

Serializer.addClass(
  "panelbase",
  [
    "name",
    {
      name: "elements",
      alternativeName: "questions",
      baseClassName: "question",
      visible: false,
      isLightSerializable: false,
    },
    { name: "visible:switch", default: true, overridingProperty: "visibleIf" },
    { name: "readOnly:boolean", overridingProperty: "enableIf" },
    "visibleIf:condition",
    "enableIf:condition",
    "requiredIf:condition",
    {
      name: "questionTitleWidth",
      visibleIf: function (obj: any) {
        return !!obj && obj["availableQuestionTitleWidth"]();
      }
    },
    {
      name: "questionTitleLocation",
      default: "default",
      choices: ["default", "top", "bottom", "left", "hidden"],
    },
    {
      name: "gridLayoutColumns:panellayoutcolumns",
      className: "panellayoutcolumn", isArray: true,
      onSerializeValue: (obj: any): any => { return obj.getSerializableColumnsValue(); },
      visibleIf: function (obj: any) { return !!obj && !!obj.survey && obj.survey.gridLayoutEnabled; }
    },
    { name: "title:text", serializationProperty: "locTitle" },
    { name: "description:text", serializationProperty: "locDescription" },
    {
      name: "questionOrder", alternativeName: "questionsOrder",
      default: "default",
      choices: ["default", "initial", "random"],
    },
    { name: "questionErrorLocation", default: "default", choices: ["default", "top", "bottom"] }
  ],
  function () {
    return new PanelModelBase();
  }
);

Serializer.addClass(
  "panel",
  [
    { name: "state", default: "default", choices: ["default", "collapsed", "expanded"] },
    { name: "isRequired:switch", overridingProperty: "requiredIf" },
    { name: "requiredErrorText:text", serializationProperty: "locRequiredErrorText" },
    { name: "startWithNewLine:boolean", default: true },
    { name: "width" },
    { name: "minWidth", defaultFunc: () => "auto" },
    { name: "maxWidth", defaultFunc: () => settings.maxWidth },
    { name: "colSpan:number", visible: false, onSerializeValue: (obj) => { return obj.getPropertyValue("colSpan"); } },
    {
      name: "effectiveColSpan:number", minValue: 1, isSerializable: false,
      visibleIf: function (obj: any) { return !!obj.survey && obj.survey.gridLayoutEnabled; }
    },
    { name: "innerIndent:number", default: 0, choices: [0, 1, 2, 3] },
    { name: "indent:number", default: 0, choices: [0, 1, 2, 3], visible: false },
    {
      name: "page",
      isSerializable: false,
      visibleIf: function (obj: any) {
        var survey = obj ? obj.survey : null;
        return !survey || !survey.pages || survey.pages.length > 1;
      },
      choices: function (obj: any) {
        var survey = obj ? obj.survey : null;
        return survey
          ? survey.pages.map((p: any) => {
            return { value: p.name, text: p.title };
          })
          : [];
      },
    },
    { name: "showNumber:boolean" },
    { name: "showQuestionNumbers", default: "default", choices: ["default", "onpanel", "off"] },
    { name: "questionStartIndex", visibleIf: (obj: PanelModel): boolean => obj.isPanel },
    { name: "allowAdaptiveActions:boolean", default: true, visible: false },
  ],
  function () {
    return new PanelModel();
  },
  "panelbase"
);

ElementFactory.Instance.registerElement("panel", (name) => {
  return new PanelModel(name);
});
