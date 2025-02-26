import { property, propertyArray, Serializer } from "./jsonobject";
import { SurveyError } from "./survey-error";
import { ISurveyImpl, ISurvey, ISurveyData, IPlainDataOptions, IValueItemCustomPropValues } from "./base-interfaces";
import { SurveyModel } from "./survey";
import { IQuestionPlainData, Question } from "./question";
import { ItemValue } from "./itemvalue";
import { getLocaleString } from "./surveyStrings";
import { OtherEmptyError } from "./error";
import { ChoicesRestful } from "./choicesRestful";
import { LocalizableString } from "./localizablestring";
import { ConditionRunner } from "./conditions";
import { Helpers, HashTable } from "./helpers";
import { settings } from "./settings";
import { SurveyElement } from "./survey-element";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { ITextArea, TextAreaModel } from "./utils/text-area";
import { cleanHtmlElementAfterAnimation, prepareElementForVerticalAnimation, setPropertiesOnElementForAnimation } from "./utils/utils";
import { AnimationGroup, IAnimationGroupConsumer } from "./utils/animation";

/**
 * A base class for multiple-choice question types ([Checkboxes](https://surveyjs.io/form-library/documentation/questioncheckboxmodel), [Dropdown](https://surveyjs.io/form-library/documentation/questiondropdownmodel), [Radio Button Group](https://surveyjs.io/form-library/documentation/questionradiogroupmodel), etc.).
 */
export class QuestionSelectBase extends Question {
  public visibleChoicesChangedCallback: () => void;
  public loadedChoicesFromServerCallback: () => void;
  public renderedChoicesChangedCallback: () => void;
  private otherTextAreaModelValue: TextAreaModel;
  private filteredChoicesValue: Array<ItemValue>;
  private conditionChoicesVisibleIfRunner: ConditionRunner;
  private conditionChoicesEnableIfRunner: ConditionRunner;
  private prevOtherValue: string;
  private otherItemValue: ItemValue = new ItemValue("other");
  private choicesFromUrl: Array<ItemValue>;
  private cachedValueForUrlRequests: any;
  private isChoicesLoaded: boolean;
  private enableOnLoadingChoices: boolean;
  private noneItemValue: ItemValue;
  private refuseItemValue: ItemValue;
  private dontKnowItemValue: ItemValue;
  private newItemValue: ItemValue;
  private canShowOptionItemCallback: (item: ItemValue) => boolean;
  private waitingGetChoiceDisplayValueResponse: boolean;
  private get waitingChoicesByURL(): boolean {
    return !this.isChoicesLoaded && this.hasChoicesUrl;
  }
  protected get selectedItemValues(): any { return this.getPropertyValue("selectedItemValues"); }
  protected set selectedItemValues(val: any) { this.setPropertyValue("selectedItemValues", val); }

  constructor(name: string) {
    super(name);
    this.noneItemValue = this.createDefaultItem(settings.noneItemValue, "noneText", "noneItemText");
    this.refuseItemValue = this.createDefaultItem(settings.refuseItemValue, "refuseText", "refuseItemText");
    this.dontKnowItemValue = this.createDefaultItem(settings.dontKnowItemValue, "dontKnowText", "dontKnowItemText");
    this.createItemValues("choices");
    this.registerPropertyChangedHandlers(["choices"], () => {
      if (!this.filterItems()) {
        this.onVisibleChoicesChanged();
      }
    });
    this.registerPropertyChangedHandlers(
      ["choicesFromQuestion", "choicesFromQuestionMode", "choiceValuesFromQuestion",
        "choiceTextsFromQuestion", "showNoneItem", "showRefuseItem", "showDontKnowItem", "isUsingRestful", "isMessagePanelVisible"],
      () => {
        this.onVisibleChoicesChanged();
      }
    );
    this.registerPropertyChangedHandlers(["hideIfChoicesEmpty"], () => {
      this.onVisibleChanged();
    });
    this.registerPropertyChangedHandlers(["selecteditemValues"], (newVal: any) => {
      this.onSelectedItemValuesChangedHandler(newVal);
    });
    this.createNewArray("visibleChoices", () => this.updateRenderedChoices(), () => this.updateRenderedChoices());
    this.setNewRestfulProperty();
    var locOtherText = this.createLocalizableString("otherText", this.otherItemValue, true, "otherItemText");
    this.createLocalizableString("otherErrorText", this, true, "otherRequiredError");
    this.createLocalizableString("otherPlaceholder", this, false, true);
    this.otherItemValue.locOwner = this;
    this.otherItemValue.setLocText(locOtherText);
    this.choicesByUrl.createItemValue = (value: any): ItemValue => {
      return this.createItemValue(value);
    };
    this.choicesByUrl.beforeSendRequestCallback = (): void => {
      this.onBeforeSendRequest();
    };
    this.choicesByUrl.getResultCallback = (items: Array<ItemValue>): void => {
      this.onLoadChoicesFromUrl(items);
    };
    this.choicesByUrl.updateResultCallback = (
      items: Array<ItemValue>,
      serverResult: any
    ): Array<ItemValue> => {
      if (this.survey) {
        return this.survey.updateChoicesFromServer(this, items, serverResult);
      }
      return items;
    };
  }
  public getType(): string {
    return "selectbase";
  }
  public dispose(): void {
    super.dispose();
    const q = this.getQuestionWithChoices();
    if (!!q) {
      q.removeDependedQuestion(this);
    }
  }
  public get otherTextAreaModel(): TextAreaModel {
    if(!this.otherTextAreaModelValue) {
      this.otherTextAreaModelValue = new TextAreaModel(this.getOtherTextAreaOptions());
    }
    return this.otherTextAreaModelValue;
  }
  private getOtherTextAreaOptions(): ITextArea {
    const options: ITextArea = {
      question: this,
      id: () => this.otherId,
      propertyName: "otherValue",
      className: () => this.cssClasses.other,
      placeholder: () => this.otherPlaceholder,
      isDisabledAttr: () => this.isInputReadOnly || false,
      rows: () => this.commentAreaRows,
      maxLength: () => this.getOthersMaxLength(),
      autoGrow: () => this.survey && this.survey.autoGrowComment,
      ariaRequired: () => this.ariaRequired || this.a11y_input_ariaRequired,
      ariaLabel: () => this.ariaLabel || this.a11y_input_ariaLabel,
      getTextValue: () => { return this.otherValue; },
      onTextAreaChange: (e) => { this.onOtherValueChange(e); },
      onTextAreaInput: (e) => { this.onOtherValueInput(e); },
    };
    return options;
  }
  protected resetDependedQuestion(): void {
    this.choicesFromQuestion = "";
  }
  public get otherId(): string {
    return this.id + "_other";
  }
  protected getCommentElementsId(): Array<string> {
    return [this.commentId, this.otherId];
  }
  protected getItemValueType(): string {
    return "itemvalue";
  }
  public createItemValue(value: any, text?: string): ItemValue {
    const res = <ItemValue>Serializer.createClass(this.getItemValueType(), { value: value });
    res.locOwner = this;
    if (!!text) res.text = text;
    return res;
  }
  public hasErrors(fireCallback: boolean = true, rec: any = null): boolean {
    if(!rec || rec.isOnValueChanged !== true) {
      this.clearIncorrectValues();
    }
    return super.hasErrors(fireCallback, rec);
  }
  public get isUsingCarryForward(): boolean {
    return !!this.carryForwardQuestionType;
  }
  public get carryForwardQuestionType(): string {
    return this.getPropertyValue("carryForwardQuestionType");
  }
  private setCarryForwardQuestionType(selBaseQuestion: boolean, arrayQuestion: boolean): void {
    const mode = selBaseQuestion ? "select" : (arrayQuestion ? "array" : undefined);
    this.setPropertyValue("carryForwardQuestionType", mode);
  }
  public get isUsingRestful(): boolean {
    return this.getPropertyValueWithoutDefault("isUsingRestful") || false;
  }
  public updateIsUsingRestful(): void {
    this.setPropertyValueDirectly("isUsingRestful", this.hasChoicesUrl);
  }
  public supportGoNextPageError(): boolean {
    return !this.isOtherSelected || !!this.otherValue;
  }
  isLayoutTypeSupported(layoutType: string): boolean {
    return true;
  }
  public localeChanged(): void {
    super.localeChanged();
    if (this.choicesOrder !== "none") {
      this.updateVisibleChoices();
      this.onVisibleChoicesChanged();
    }
  }
  public locStrsChanged(): void {
    super.locStrsChanged();
    if (!!this.choicesFromUrl) {
      ItemValue.locStrsChanged(this.choicesFromUrl);
      ItemValue.locStrsChanged(this.visibleChoices);
    }
    if (this.isUsingCarryForward) {
      ItemValue.locStrsChanged(this.visibleChoices);
    }
  }
  private prevOtherErrorValue: string;
  private updatePrevOtherErrorValue(val: string): void {
    const oldVal = this.otherValue;
    if (val !== oldVal) {
      this.prevOtherErrorValue = oldVal;
    }
  }
  public get otherValue(): string {
    if (!this.showCommentArea) return this.comment;
    return this.otherValueCore;
  }
  public set otherValue(val: string) {
    this.updatePrevOtherErrorValue(val);
    if (!this.showCommentArea) {
      this.comment = val;
    } else {
      this.setOtherValueInternally(val);
    }
  }
  protected get otherValueCore(): string {
    return this.getPropertyValue("otherValue");
  }
  protected set otherValueCore(val: string) {
    this.setPropertyValue("otherValue", val);
  }
  /**
   * Returns the "Other" choice item. Use this property to change the item's `value` or `text`.
   * @see showOtherItem
   */
  public get otherItem(): ItemValue {
    return this.otherItemValue;
  }
  /**
   * Returns `true` if the "Other" choice item is selected.
   * @see showOtherItem
   */
  public get isOtherSelected(): boolean {
    return this.hasOther && this.getHasOther(this.renderedValue);
  }
  public get isNoneSelected(): boolean {
    return this.showNoneItem && this.getIsItemValue(this.renderedValue, this.noneItem);
  }
  /**
   * Specifies whether to display the "None" choice item.
   *
   * When users select the "None" item in multi-select questions, all other items become unselected.
   * @see noneItem
   * @see noneText
   * @see [settings.noneItemValue](https://surveyjs.io/form-library/documentation/api-reference/settings#noneItemValue)
   * @see [settings.specialChoicesOrder](https://surveyjs.io/form-library/documentation/api-reference/settings#specialChoicesOrder)
   */
  public get showNoneItem(): boolean {
    return this.getPropertyValue("showNoneItem");
  }
  public set showNoneItem(val: boolean) {
    this.setPropertyValue("showNoneItem", val);
  }
  public get hasNone(): boolean {
    return this.showNoneItem;
  }
  public set hasNone(val: boolean) {
    this.showNoneItem = val;
  }
  /**
   * Returns the "None" choice item. Use this property to change the item's `value` or `text`.
   * @see showNoneItem
   */
  public get noneItem(): ItemValue {
    return this.noneItemValue;
  }
  /**
   * Gets or sets a caption for the "None" choice item.
   * @see showNoneItem
   */
  public get noneText(): string {
    return this.getLocalizableStringText("noneText");
  }
  public set noneText(val: string) {
    this.setLocalizableStringText("noneText", val);
  }
  get locNoneText(): LocalizableString {
    return this.getLocalizableString("noneText");
  }
  /**
   * Specifies whether to display the "Refuse to answer" choice item.
   *
   * When users select the "Refuse to answer" item in multi-select questions, all other items become unselected.
   * @see refuseItem
   * @see refuseItemText
   * @see [settings.refuseItemValue](https://surveyjs.io/form-library/documentation/api-reference/settings#refuseItemValue)
   * @see [settings.specialChoicesOrder](https://surveyjs.io/form-library/documentation/api-reference/settings#specialChoicesOrder)
   */
  public get showRefuseItem(): boolean {
    return this.getPropertyValue("showRefuseItem");
  }
  public set showRefuseItem(val: boolean) {
    this.setPropertyValue("showRefuseItem", val);
  }
  /**
   * Returns the "Refuse to answer" choice item. Use this property to change the item's `value` or `text`.
   * @see showRefuseItem
   */
  public get refuseItem(): ItemValue {
    return this.refuseItemValue;
  }
  /**
   * Gets or sets a caption for the "Refuse to answer" choice item.
   * @see showRefuseItem
   */
  public get refuseText(): string {
    return this.getLocalizableStringText("refuseText");
  }
  public set refuseText(val: string) {
    this.setLocalizableStringText("refuseText", val);
  }
  get locRefuseText(): LocalizableString {
    return this.getLocalizableString("refuseText");
  }
  /**
   * Specifies whether to display the "Don't know" choice item.
   *
   * When users select the "Don't know" item in multi-select questions, all other items become unselected.
   * @see dontKnowItem
   * @see dontKnowItemText
   * @see [settings.dontKnowItemValue](https://surveyjs.io/form-library/documentation/api-reference/settings#dontKnowItemValue)
   * @see [settings.specialChoicesOrder](https://surveyjs.io/form-library/documentation/api-reference/settings#specialChoicesOrder)
   */
  public get showDontKnowItem(): boolean {
    return this.getPropertyValue("showDontKnowItem");
  }
  public set showDontKnowItem(val: boolean) {
    this.setPropertyValue("showDontKnowItem", val);
  }
  /**
   * Returns the "Don't know" choice item. Use this property to change the item's `value` or `text`.
   * @see showDontKnowItem
   */
  public get dontKnowItem(): ItemValue {
    return this.dontKnowItemValue;
  }
  /**
   * Gets or sets a caption for the "Don't know" choice item.
   * @see showDontKnowItem
   */
  public get dontKnowText(): string {
    return this.getLocalizableStringText("dontKnowText");
  }
  public set dontKnowText(val: string) {
    this.setLocalizableStringText("dontKnowText", val);
  }
  get locDontKnowText(): LocalizableString {
    return this.getLocalizableString("dontKnowText");
  }
  private createDefaultItem(defaultValue: any, name: string, locName: string): ItemValue {
    const item = new ItemValue(defaultValue);
    const locStr = this.createLocalizableString(name, item, true, locName);
    item.locOwner = this;
    item.setLocText(locStr);
    return item;
  }
  /**
   * A Boolean expression that is evaluated against each choice item. If the expression evaluates to `false`, the choice item becomes hidden.
   *
   * A survey parses and runs all expressions on startup. If any values used in the expression change, the survey re-evaluates it.
   *
   * Use the `{item}` placeholder to reference the current choice item in the expression.
   *
   * Refer to the following help topic for more information: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#conditional-visibility).
   * @see visibleIf
   * @see choicesEnableIf
   */
  public get choicesVisibleIf(): string {
    return this.getPropertyValue("choicesVisibleIf", "");
  }
  public set choicesVisibleIf(val: string) {
    this.setPropertyValue("choicesVisibleIf", val);
    this.filterItems();
  }
  /**
   * A Boolean expression that is evaluated against each choice item. If the expression evaluates to `false`, the choice item becomes read-only.
   *
   * A survey parses and runs all expressions on startup. If any values used in the expression change, the survey re-evaluates it.
   *
   * Use the `{item}` placeholder to reference the current choice item in the expression.
   *
   * Refer to the following help topic for more information: [Conditional Visibility](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#conditional-visibility).
   * @see enableIf
   * @see choicesVisibleIf
   */
  public get choicesEnableIf(): string {
    return this.getPropertyValue("choicesEnableIf", "");
  }
  public set choicesEnableIf(val: string) {
    this.setPropertyValue("choicesEnableIf", val);
    this.filterItems();
  }
  public surveyChoiceItemVisibilityChange(): void {
    this.filterItems();
  }
  protected runConditionCore(values: HashTable<any>, properties: HashTable<any>): void {
    super.runConditionCore(values, properties);
    this.runItemsEnableCondition(values, properties);
    this.runItemsCondition(values, properties);
    this.choices.forEach(item => {
      item.runConditionCore(values, properties);
    });
  }
  protected isTextValue(): boolean {
    return true; //for comments and others
  }
  private isSettingDefaultValue: boolean = false;
  protected setDefaultValue(): void {
    this.isSettingDefaultValue =
      !this.isValueEmpty(this.defaultValue) &&
      this.hasUnknownValue(this.defaultValue);
    this.prevOtherValue = undefined;
    const prevComment = this.comment;
    super.setDefaultValue();
    this.isSettingDefaultValue = false;
    if (this.comment && this.getStoreOthersAsComment() && prevComment !== this.comment) {
      this.setValueCore(this.setOtherValueIntoValue(this.value));
      this.setCommentIntoData(this.comment);
    }
  }
  protected getIsMultipleValue(): boolean {
    return false;
  }
  protected convertDefaultValue(val: any): any {
    if (val == null || val == undefined) return val;
    if (this.getIsMultipleValue()) {
      if (!Array.isArray(val)) return [val];
    } else {
      if (Array.isArray(val) && val.length > 0) return val[0];
    }
    return val;
  }
  protected filterItems(): boolean {
    if (
      this.isLoadingFromJson ||
      !this.data ||
      this.areInvisibleElementsShowing
    )
      return false;
    var values = this.getDataFilteredValues();
    var properties = this.getDataFilteredProperties();
    this.runItemsEnableCondition(values, properties);
    return this.runItemsCondition(values, properties);
  }
  protected runItemsCondition(
    values: HashTable<any>,
    properties: HashTable<any>
  ): boolean {
    this.setConditionalChoicesRunner();
    var hasChanges = this.runConditionsForItems(values, properties);
    if (
      !!this.filteredChoicesValue &&
      this.filteredChoicesValue.length === this.activeChoices.length
    ) {
      this.filteredChoicesValue = undefined;
    }
    if (hasChanges) {
      this.onVisibleChoicesChanged();
      this.clearIncorrectValues();
    }
    return hasChanges;
  }
  protected runItemsEnableCondition(
    values: HashTable<any>,
    properties: HashTable<any>
  ): any {
    this.setConditionalEnableChoicesRunner();
    var hasChanged = ItemValue.runEnabledConditionsForItems(
      this.activeChoices,
      this.conditionChoicesEnableIfRunner,
      values,
      properties,
      (item: ItemValue, val: boolean): boolean => {
        return val && this.onEnableItemCallBack(item);
      }
    );
    if (hasChanged) {
      this.clearDisabledValues();
    }
    this.onAfterRunItemsEnableCondition();
  }
  protected onAfterRunItemsEnableCondition() { }
  protected onEnableItemCallBack(item: ItemValue): boolean {
    return true;
  }
  protected onSelectedItemValuesChangedHandler(newValue: any): void {
    this.survey?.loadedChoicesFromServer(this);
  }
  protected getItemIfChoicesNotContainThisValue(value: any, text?: string): any {
    if (this.waitingChoicesByURL) {
      return this.createItemValue(value, text);
    } else {
      return null;
    }
  }
  protected getSingleSelectedItem(): ItemValue {
    const selectedItemValues = this.selectedItemValues;
    if (this.isEmpty()) return null;

    const itemValue = ItemValue.getItemByValue(this.visibleChoices, this.value);
    this.onGetSingleSelectedItem(itemValue);
    if (!itemValue && (!selectedItemValues || this.value != selectedItemValues.id)) {
      this.updateSelectedItemValues();
    }
    return itemValue || selectedItemValues || (this.isOtherSelected ? this.otherItem : this.getItemIfChoicesNotContainThisValue(this.value));
  }
  protected onGetSingleSelectedItem(selectedItemByValue: ItemValue): void { }
  protected getMultipleSelectedItems(): Array<ItemValue> {
    return [];
  }
  private setConditionalChoicesRunner() {
    if (this.choicesVisibleIf) {
      if (!this.conditionChoicesVisibleIfRunner) {
        this.conditionChoicesVisibleIfRunner = new ConditionRunner(
          this.choicesVisibleIf
        );
      }
      this.conditionChoicesVisibleIfRunner.expression = this.choicesVisibleIf;
    } else {
      this.conditionChoicesVisibleIfRunner = null;
    }
  }
  private setConditionalEnableChoicesRunner() {
    if (this.choicesEnableIf) {
      if (!this.conditionChoicesEnableIfRunner) {
        this.conditionChoicesEnableIfRunner = new ConditionRunner(
          this.choicesEnableIf
        );
      }
      this.conditionChoicesEnableIfRunner.expression = this.choicesEnableIf;
    } else {
      this.conditionChoicesEnableIfRunner = null;
    }
  }
  private canSurveyChangeItemVisibility(): boolean {
    return !!this.survey && this.survey.canChangeChoiceItemsVisibility();
  }
  private changeItemVisibility() {
    return this.canSurveyChangeItemVisibility() ?
      (item: ItemValue, val: boolean): boolean => this.survey.getChoiceItemVisibility(this, item, val)
      : null;
  }
  private runConditionsForItems(
    values: HashTable<any>,
    properties: HashTable<any>
  ): boolean {
    this.filteredChoicesValue = [];
    const calcVisibility = this.changeItemVisibility();
    return ItemValue.runConditionsForItems(
      this.activeChoices,
      this.getFilteredChoices(),
      this.areInvisibleElementsShowing
        ? null
        : this.conditionChoicesVisibleIfRunner,
      values,
      properties,
      !this.survey || !this.survey.areInvisibleElementsShowing,
      (item: ItemValue, val: boolean): boolean => {
        return !!calcVisibility ? calcVisibility(item, val) : val;
      }
    );
  }
  protected getHasOther(val: any): boolean {
    return this.getIsItemValue(val, this.otherItem);
  }
  protected getIsItemValue(val: any, item: ItemValue): boolean {
    return val === item.value;
  }
  get validatedValue(): any {
    return this.rendredValueToDataCore(this.value);
  }
  protected createRestful(): ChoicesRestful {
    return new ChoicesRestful();
  }
  private setNewRestfulProperty() {
    this.setPropertyValue("choicesByUrl", this.createRestful());
    this.choicesByUrl.owner = this;
    this.choicesByUrl.loadingOwner = this;
  }
  get autoOtherMode(): boolean {
    return this.getPropertyValue("autoOtherMode");
  }
  set autoOtherMode(val: boolean) {
    this.setPropertyValue("autoOtherMode", val);
  }
  protected getQuestionComment(): string {
    if (this.showCommentArea) return super.getQuestionComment();
    if (!!this.otherValueCore) return this.otherValueCore;
    if (this.hasComment || this.getStoreOthersAsComment())
      return super.getQuestionComment();
    return this.otherValueCore;
  }
  protected selectOtherValueFromComment(val: boolean): void {
    if(val) {
      this.prevIsOtherSelected = true;
    }
    this.value = val ? this.otherItem.value : undefined;
  }
  private isSettingComment: boolean = false;
  protected setQuestionComment(newValue: string): void {
    this.updatePrevOtherErrorValue(newValue);
    if (this.showCommentArea) {
      super.setQuestionComment(newValue);
      return;
    }
    this.onUpdateCommentOnAutoOtherMode(newValue);
    if (this.getStoreOthersAsComment())
      super.setQuestionComment(newValue);
    else {
      this.setOtherValueInternally(newValue);
    }
    this.updateChoicesDependedQuestions();
  }
  private onUpdateCommentOnAutoOtherMode(newValue: string): void {
    if (!this.autoOtherMode) return;
    this.prevOtherValue = undefined;
    const isSelected = this.isOtherSelected;
    if (!isSelected && !!newValue || isSelected && !newValue) {
      this.selectOtherValueFromComment(!!newValue);
    }
  }
  private setOtherValueInternally(newValue: string): void {
    if (!this.isSettingComment && newValue != this.otherValueCore) {
      this.isSettingComment = true;
      this.otherValueCore = newValue;
      if (this.isOtherSelected && !this.isRenderedValueSetting) {
        this.value = this.rendredValueToData(this.renderedValue);
      }
      this.isSettingComment = false;
    }
  }
  public clearValue(keepComment?: boolean) {
    super.clearValue(keepComment);
    this.prevOtherValue = undefined;
    this.selectedItemValues = undefined;
  }
  updateCommentFromSurvey(newValue: any): any {
    super.updateCommentFromSurvey(newValue);
    this.prevOtherValue = undefined;
  }
  public get renderedValue(): any {
    return this.getPropertyValue("renderedValue", null);
  }
  public set renderedValue(val: any) {
    if (this.isReadOnlyAttr) return;
    this.setPropertyValue("renderedValue", val);
    var val = this.rendredValueToData(val);
    if (!this.isTwoValueEquals(val, this.value)) {
      this.value = val;
    }
  }
  private makeCommentEmpty: boolean;
  protected setQuestionValue(newValue: any, updateIsAnswered: boolean = true, updateComment: boolean = true): void {
    if (
      this.isLoadingFromJson ||
      this.isTwoValueEquals(this.value, newValue)
    )
      return;
    super.setQuestionValue(newValue, updateIsAnswered);
    this.setPropertyValue("renderedValue", this.rendredValueFromData(newValue));
    this.updateChoicesDependedQuestions();
    if (this.hasComment || !updateComment) return;
    var isOtherSel = this.isOtherSelected;
    if (isOtherSel && !!this.prevOtherValue) {
      var oldOtherValue = this.prevOtherValue;
      this.prevOtherValue = undefined;
      this.otherValue = oldOtherValue;
    }
    if (!isOtherSel && !!this.otherValue) {
      if (this.getStoreOthersAsComment() && !this.autoOtherMode) {
        this.prevOtherValue = this.otherValue;
      }
      this.makeCommentEmpty = true;
      this.otherValueCore = "";
      this.setPropertyValue("comment", "");
    }
  }
  protected setValueCore(newValue: any): void {
    super.setValueCore(newValue);
    if (this.makeCommentEmpty) {
      this.setCommentIntoData("");
      this.makeCommentEmpty = false;
    }
  }
  protected setNewValue(newValue: any) {
    newValue = this.valueFromData(newValue);
    if (
      (!this.choicesByUrl.isRunning &&
        !this.choicesByUrl.isWaitingForParameters) ||
      !this.isValueEmpty(newValue)
    ) {
      this.cachedValueForUrlRequests = newValue;
    }
    super.setNewValue(newValue);
  }
  protected valueFromData(val: any): any {
    let choiceitem = ItemValue.getItemByValue(this.activeChoices, val);
    if (!!choiceitem) {
      return choiceitem.value;
    }
    return super.valueFromData(val);
  }
  protected rendredValueFromData(val: any): any {
    if (this.getStoreOthersAsComment()) return val;
    return this.renderedValueFromDataCore(val);
  }
  protected rendredValueToData(val: any): any {
    if (this.getStoreOthersAsComment()) return val;
    return this.rendredValueToDataCore(val);
  }
  protected renderedValueFromDataCore(val: any): any {
    if (!this.hasUnknownValue(val, true, false)) return this.valueFromData(val);
    this.otherValue = val;
    return this.otherItem.value;
  }
  protected rendredValueToDataCore(val: any): any {
    if (val == this.otherItem.value && this.needConvertRenderedOtherToDataValue()) {
      val = this.otherValue;
    }
    return val;
  }
  protected needConvertRenderedOtherToDataValue(): boolean {
    let val = this.otherValue;
    if (!val) return false;
    val = val.trim();
    if (!val) return false;
    return this.hasUnknownValue(val, true, false);
  }
  protected getIsQuestionReady(): boolean {
    return super.getIsQuestionReady() && !this.waitingChoicesByURL && !this.waitingGetChoiceDisplayValueResponse;
  }
  protected updateSelectedItemValues(): void {
    if (this.waitingGetChoiceDisplayValueResponse || !this.survey || this.isEmpty()) return;
    const value = this.value;
    const valueArray: Array<any> = Array.isArray(value) ? value : [value];
    const hasItemWithoutValues = valueArray.some(val => !ItemValue.getItemByValue(this.choices, val));
    if (hasItemWithoutValues && (this.choicesLazyLoadEnabled || this.hasChoicesUrl)) {
      this.waitingGetChoiceDisplayValueResponse = true;
      this.updateIsReady();
      this.survey.getChoiceDisplayValue({
        question: this,
        values: valueArray,
        setItems: (displayValues: Array<string>, ...customValues: Array<IValueItemCustomPropValues>) => {
          this.waitingGetChoiceDisplayValueResponse = false;
          if (!displayValues || !displayValues.length) {
            this.updateIsReady();
            return;
          }
          const items = displayValues.map((displayValue, index) => this.createItemValue(valueArray[index], displayValue));
          this.setCustomValuesIntoItems(items, customValues);
          if (Array.isArray(value)) {
            this.selectedItemValues = items;
          }
          else {
            this.selectedItemValues = items[0];
          }
          this.updateIsReady();
        }
      });
    }
  }
  private setCustomValuesIntoItems(items: Array<ItemValue>, customValues: Array<IValueItemCustomPropValues>): void {
    if (!Array.isArray(customValues) || customValues.length === 0) return;
    customValues.forEach(customValue => {
      const vals = customValue.values;
      const propName = customValue.propertyName;
      if (Array.isArray(vals)) {
        for (let i = 0; i < items.length && i < vals.length; i++) {
          items[i][propName] = vals[i];
        }
      }
    });
  }
  protected hasUnknownValue(val: any, includeOther: boolean = false,
    isFilteredChoices: boolean = true, checkEmptyValue: boolean = false): boolean {
    if (!Array.isArray(val)) return this.hasUnknownValueItem(val, includeOther, isFilteredChoices, checkEmptyValue);
    for (let i = 0; i < val.length; i++) {
      if (this.hasUnknownValueItem(val, includeOther, isFilteredChoices, checkEmptyValue)) return true;
    }
    return false;
  }
  protected hasUnknownValueItem(val: any, includeOther: boolean = false,
    isFilteredChoices: boolean = true, checkEmptyValue: boolean = false): boolean {
    if (!checkEmptyValue && this.isValueEmpty(val)) return false;
    if (includeOther && val == this.otherItem.value) return false;
    if (this.showNoneItem && val == this.noneItem.value) return false;
    if (this.showRefuseItem && val == this.refuseItem.value) return false;
    if (this.showDontKnowItem && val == this.dontKnowItem.value) return false;
    var choices = isFilteredChoices
      ? this.getFilteredChoices()
      : this.activeChoices;
    return ItemValue.getItemByValue(choices, val) == null;
  }
  protected isValueDisabled(val: any): boolean {
    var itemValue = ItemValue.getItemByValue(this.getFilteredChoices(), val);
    return !!itemValue && !itemValue.isEnabled;
  }
  endLoadingFromJson(): void {
    super.endLoadingFromJson();
    this.updateVisibleChoices();
  }
  public clearIncorrectValuesCallback: () => void;
  /**
   * Configures access to a RESTful service that returns choice items. Refer to the [`ChoicesRestful`](https://surveyjs.io/form-library/documentation/choicesrestful) class description for more information. You can also specify additional application-wide settings using the [`settings.web`](https://surveyjs.io/form-library/documentation/api-reference/settings#web) object.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/dropdown-menu-load-data-from-restful-service/ (linkStyle))
   * @see choices
   * @see [settings.specialChoicesOrder](https://surveyjs.io/form-library/documentation/api-reference/settings#specialChoicesOrder)
   */
  public get choicesByUrl(): ChoicesRestful {
    return this.getPropertyValue("choicesByUrl");
  }
  public set choicesByUrl(val: ChoicesRestful) {
    if (!val) return;
    this.setNewRestfulProperty();
    this.choicesByUrl.fromJSON(val.toJSON());
  }
  /**
   * Gets or sets choice items. This property accepts an array of objects with the following structure:
   *
   * ```js
   * {
   *   "value": any, // A unique value to be saved in the survey results.
   *   "text": String, // A display text. This property supports Markdown. When `text` is undefined, `value` is used.
   *   "imageLink": String // A link to the image or video that represents this choice value. Applies only to Image Picker questions.
   *   "customProperty": any // Any property that you find useful.
   * }
   * ```
   *
   * To enable Markdown support for the `text` property, implement Markdown-to-HTML conversion in the [`onTextMarkdown`](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onTextMarkdown) event handler. For an example, refer to the following demo: [Convert Markdown to HTML with markdown-it](https://surveyjs.io/form-library/examples/edit-survey-questions-markdown/).
   *
   * If you add custom properties, refer to the following help topic to learn how to serialize them into JSON: [Add Custom Properties to Property Grid](https://surveyjs.io/survey-creator/documentation/property-grid#add-custom-properties-to-the-property-grid).
   *
   * If you need to specify only the `value` property, you can set the `choices` property to an array of primitive values, for example, `[ "item1", "item2", "item3" ]`. These values are both saved in survey results and used as display text.
   * @see choicesByUrl
   * @see choicesFromQuestion
   * @see [settings.specialChoicesOrder](https://surveyjs.io/form-library/documentation/api-reference/settings#specialChoicesOrder)
   */
  public get choices(): Array<any> {
    return this.getPropertyValue("choices");
  }
  public set choices(newValue: Array<any>) {
    this.setPropertyValue("choices", newValue);
  }
  /**
   * Copies choice items from a specified question. Accepts a question name.
   *
   * If you specify this property, the `choices`, `choicesVisibleIf`, `choicesEnableIf`, and `choicesOrder` properties do not apply because their values are copied.
   *
   * In addition, you can specify the `choicesFromQuestionMode` property if you do not want to copy all choice items.
   * @see choicesFromQuestionMode
   * @see choices
   */
  public get choicesFromQuestion(): string {
    return this.getPropertyValue("choicesFromQuestion");
  }
  public set choicesFromQuestion(val: string) {
    var question = this.getQuestionWithChoices();
    this.isLockVisibleChoices = !!question && question.name === val;
    if (!!question && question.name !== val) {
      question.removeDependedQuestion(this);
      if (this.isInDesignMode && !this.isLoadingFromJson && !!val) {
        this.setPropertyValue("choicesFromQuestion", undefined);
      }
    }
    this.setPropertyValue("choicesFromQuestion", val);
    this.isLockVisibleChoices = false;
  }
  private isLockVisibleChoices: boolean;
  /**
   * Specifies which choice items to copy from another question. Applies only when the `choicesFromQuestion` property is specified.
   *
   * Possible values:
   *
   * - `"all"` (default) - Copies all choice items.
   * - `"selected"` - Copies only selected choice items.
   * - `"unselected"` - Copies only unselected choice items.
   *
   * Use the `visibleChoices` property to access copied choice items.
   * @see choicesFromQuestion
   * @see visibleChoices
   */
  public get choicesFromQuestionMode(): string {
    return this.getPropertyValue("choicesFromQuestionMode");
  }
  public set choicesFromQuestionMode(val: string) {
    this.setPropertyValue("choicesFromQuestionMode", val);
  }
  /**
   * Specifies which matrix column or dynamic panel question supplies choice values. Use this property to construct choice items based on cell values in Dynamic Matrix and question values in Dynamic Panel.
   *
   * Each choice item consists of a value saved in survey results and a text displayed in the UI. To construct a choice item, assign the `name` of a Dynamic Matrix or Dynamic Panel to the [`choicesFromQuestion`](#choicesFromQuestion) property and specify which dynamic panel question or matrix column supplies values and which provides texts. Use the `choiceValuesFromQuestion` and [`choiceTextsFromQuestion`](#choiceTextsFromQuestion) properties for this purpose. If a choice text is empty, a choice value is used as a display text and saved in survey results.
   */
  public get choiceValuesFromQuestion(): string {
    return this.getPropertyValue("choiceValuesFromQuestion");
  }
  public set choiceValuesFromQuestion(val: string) {
    this.setPropertyValue("choiceValuesFromQuestion", val);
  }
  /**
   * Specifies which matrix column or dynamic panel question supplies choice texts. Use this property to construct choice items based on cell values in Dynamic Matrix and question values in Dynamic Panel.
   *
   * Each choice item consists of a value saved in survey results and a text displayed in the UI. To construct a choice item, assign the `name` of a Dynamic Matrix or Dynamic Panel to the [`choicesFromQuestion`](#choicesFromQuestion) property and specify which dynamic panel question or matrix column supplies values and which provides texts. Use the [`choiceValuesFromQuestion`](#choiceValuesFromQuestion) and `choiceTextsFromQuestion` properties for this purpose. If a choice text is empty, a choice value is used as a display text and saved in survey results.
   */
  public get choiceTextsFromQuestion(): string {
    return this.getPropertyValue("choiceTextsFromQuestion");
  }
  public set choiceTextsFromQuestion(val: string) {
    this.setPropertyValue("choiceTextsFromQuestion", val);
  }
  /**
   * Specifies whether to hide the question if no choice items are visible.
   *
   * This property is useful if you show or hide choice items at runtime based on a [condition](https://surveyjs.io/form-library/documentation/questionselectbase#choicesVisibleIf).
   */
  public get hideIfChoicesEmpty(): boolean {
    return this.getPropertyValue("hideIfChoicesEmpty");
  }
  public set hideIfChoicesEmpty(val: boolean) {
    this.setPropertyValue("hideIfChoicesEmpty", val);
  }
  /**
   * Specifies whether to keep values that cannot be assigned to this question, for example, choices unlisted in the `choices` array.
   *
   * > This property cannot be specified in the survey JSON schema. Use dot notation to specify it.
   * @see clearIncorrectValues
   */
  public get keepIncorrectValues(): boolean {
    return this.getPropertyValue("keepIncorrectValues", false);
  }
  public set keepIncorrectValues(val: boolean) {
    this.setPropertyValue("keepIncorrectValues", val);
  }

  public get storeOthersAsComment(): any {
    return this.getPropertyValue("storeOthersAsComment");
  }
  public set storeOthersAsComment(val: any) {
    this.setPropertyValue("storeOthersAsComment", val);
  }
  protected hasOtherChanged() {
    this.onVisibleChoicesChanged();
  }
  /**
   * Specifies the sort order of choice items.
   *
   * Possible values:
   *
   * - `"none"` (default) - Preserves the original order of choice items.
   * - `"asc"`- Sorts choice items in ascending order.
   * - `"desc"`- Sorts choice items in ascending order.
   * - `"random"` - Displays choice items in random order.
   * @see [settings.specialChoicesOrder](https://surveyjs.io/form-library/documentation/api-reference/settings#specialChoicesOrder)
   */
  public get choicesOrder(): string {
    return this.getPropertyValue("choicesOrder");
  }
  public set choicesOrder(val: string) {
    val = val.toLowerCase();
    if (val == this.choicesOrder) return;
    this.setPropertyValue("choicesOrder", val);
    this.onVisibleChoicesChanged();
  }
  /**
   * Gets or sets a caption for the "Other" choice item.
   * @see showOtherItem
   */
  public get otherText(): string {
    return this.getLocalizableStringText("otherText");
  }
  public set otherText(val: string) {
    this.setLocalizableStringText("otherText", val);
    this.onVisibleChoicesChanged();
  }
  get locOtherText(): LocalizableString {
    return this.getLocalizableString("otherText");
  }
  /**
   * Displays the "Select All", "None", and "Other" choices on individual rows.
   * @see showNoneItem
   * @see showOtherItem
   * @see [settings.specialChoicesOrder](https://surveyjs.io/form-library/documentation/api-reference/settings#specialChoicesOrder)
   */
  public get separateSpecialChoices(): boolean { return this.getPropertyValue("separateSpecialChoices"); }
  public set separateSpecialChoices(val: boolean) { this.setPropertyValue("separateSpecialChoices", val); }
  /**
   * A placeholder for the comment area. Applies when the `showOtherItem` or `showCommentArea` property is `true`.
   * @see showOtherItem
   * @see showCommentArea
   */
  public get otherPlaceholder(): string { return this.getLocalizableStringText("otherPlaceholder"); }
  public set otherPlaceholder(val: string) { this.setLocalizableStringText("otherPlaceholder", val); }
  public get locOtherPlaceholder(): LocalizableString { return this.getLocalizableString("otherPlaceholder"); }

  public get otherPlaceHolder(): string {
    return this.otherPlaceholder;
  }
  public set otherPlaceHolder(newValue: string) {
    this.otherPlaceholder = newValue;
  }
  /**
   * Gets or sets an error message displayed when users select the "Other" choice item but leave the comment area empty.
   * @see showOtherItem
   */
  public get otherErrorText(): string {
    return this.getLocalizableStringText("otherErrorText");
  }
  public set otherErrorText(val: string) {
    this.setLocalizableStringText("otherErrorText", val);
  }
  get locOtherErrorText(): LocalizableString {
    return this.getLocalizableString("otherErrorText");
  }
  /**
   * An array of visible choice items. Includes the "Select All", "Other", and "None" choice items if they are visible. Items are sorted according to the `choicesOrder` value.
   * @see showNoneItem
   * @see showOtherItem
   * @see choicesOrder
   * @see choices
   * @see enabledChoices
   */
  public get visibleChoices(): Array<ItemValue> {
    return this.getPropertyValue("visibleChoices");
  }
  /**
   * An array of choice items with which users can interact. Includes the "Select All", "Other", and "None" choice items if they are not disabled. Items are sorted according to the `choicesOrder` value.
   * @see showNoneItem
   * @see showOtherItem
   * @see choicesOrder
   * @see choices
   * @see visibleChoices
   */
  public get enabledChoices(): Array<ItemValue> {
    var res = [];
    var items = this.visibleChoices;
    for (var i = 0; i < items.length; i++) {
      if (items[i].isEnabled) res.push(items[i]);
    }
    return res;
  }
  protected updateVisibleChoices(): void {
    if (this.isLoadingFromJson || this.isDisposed) return;
    var newValue = new Array<ItemValue>();
    var calcValue = this.calcVisibleChoices();
    if (!calcValue) calcValue = [];
    for (var i = 0; i < calcValue.length; i++) {
      newValue.push(calcValue[i]);
    }
    const oldValue = this.visibleChoices;
    if (!this.isTwoValueEquals(oldValue, newValue) || this.choicesLazyLoadEnabled) {
      this.setArrayPropertyDirectly("visibleChoices", newValue);
      this.updateRenderedChoices();
    }
  }
  private calcVisibleChoices(): Array<ItemValue> {
    if (this.canUseFilteredChoices()) return this.getFilteredChoices();
    var res = this.sortVisibleChoices(this.getFilteredChoices().slice());
    this.addToVisibleChoices(res, this.isAddDefaultItems);
    return res;
  }
  protected canUseFilteredChoices(): boolean {
    return (
      !this.isAddDefaultItems &&
      !this.showNoneItem &&
      !this.showRefuseItem &&
      !this.showDontKnowItem &&
      !this.hasOther &&
      this.choicesOrder == "none"
    );
  }
  public setCanShowOptionItemCallback(func: (item: ItemValue) => boolean) {
    this.canShowOptionItemCallback = func;
    if (!!func) {
      this.onVisibleChoicesChanged();
    }
  }
  public get newItem(): ItemValue { return this.newItemValue; }
  protected addToVisibleChoices(items: Array<ItemValue>, isAddAll: boolean): void {
    this.headItemsCount = 0;
    this.footItemsCount = 0;
    if (!this.isEmptyActiveChoicesInDesign) {
      this.addNewItemToVisibleChoices(items, isAddAll);
    }
    const dict = new Array<{ index: number, item: ItemValue }>();
    this.addNonChoicesItems(dict, isAddAll);
    dict.sort((a: { index: number, item: ItemValue }, b: { index: number, item: ItemValue }): number => {
      if (a.index === b.index) return 0;
      return a.index < b.index ? -1 : 1;
    });
    for (let i = 0; i < dict.length; i++) {
      const rec = dict[i];
      if (rec.index < 0) {
        items.splice(i, 0, rec.item);
        this.headItemsCount++;
      }
      else {
        items.push(rec.item);
        this.footItemsCount++;
      }
    }
  }
  protected addNewItemToVisibleChoices(items: Array<ItemValue>, isAddAll: boolean): void {
    if (!isAddAll) return;
    if (!this.newItemValue) {
      this.newItemValue = this.createItemValue("newitem"); //TODO
      this.newItemValue.isGhost = true;
      this.newItemValue.registerFunctionOnPropertyValueChanged("isVisible", () => {
        this.updateVisibleChoices();
      });
    }
    if (this.newItemValue.isVisible && !this.isUsingCarryForward
      && this.canShowOptionItem(this.newItemValue, isAddAll, false)) {
      this.footItemsCount = 1;
      items.push(this.newItemValue);
    }
  }
  protected addNonChoicesItems(dict: Array<{ index: number, item: ItemValue }>, isAddAll: boolean): void {
    if (this.supportNone()) {
      this.addNonChoiceItem(dict, this.noneItem, isAddAll, this.showNoneItem, settings.specialChoicesOrder.noneItem);
    }
    if (this.supportRefuse()) {
      this.addNonChoiceItem(dict, this.refuseItem, isAddAll, this.showRefuseItem, settings.specialChoicesOrder.refuseItem);
    }
    if (this.supportDontKnow()) {
      this.addNonChoiceItem(dict, this.dontKnowItem, isAddAll, this.showDontKnowItem, settings.specialChoicesOrder.dontKnowItem);
    }
    if (this.supportOther()) {
      this.addNonChoiceItem(dict, this.otherItem, isAddAll, this.hasOther, settings.specialChoicesOrder.otherItem);
    }
  }
  protected addNonChoiceItem(dict: Array<{ index: number, item: ItemValue }>, item: ItemValue, isAddAll: boolean, showItem: boolean, order: Array<number>): void {
    if (this.canShowOptionItem(item, isAddAll, showItem)) {
      order.forEach(val => dict.push({ index: val, item: item }));
    }
  }
  protected canShowOptionItem(item: ItemValue, isAddAll: boolean, hasItem: boolean): boolean {
    let res: boolean = (isAddAll && (!!this.canShowOptionItemCallback ? this.canShowOptionItemCallback(item) : true)) || hasItem;
    if (this.canSurveyChangeItemVisibility()) {
      const calc = this.changeItemVisibility();
      return calc(item, res);
    }
    return res;
  }
  public isItemInList(item: ItemValue): boolean {
    if (item === this.otherItem) return this.hasOther;
    if (item === this.noneItem) return this.showNoneItem;
    if (item === this.refuseItem) return this.showRefuseItem;
    if (item === this.dontKnowItem) return this.showDontKnowItem;
    if (item === this.newItemValue) return false;
    return true;
  }
  protected get isAddDefaultItems(): boolean {
    return settings.showDefaultItemsInCreator && this.isInDesignMode &&
      !this.customWidget;
  }
  public getPlainData(
    options: IPlainDataOptions = {
      includeEmpty: true,
      includeQuestionTypes: false,
    }
  ): IQuestionPlainData {
    var questionPlainData = super.getPlainData(options);
    if (!!questionPlainData) {
      var values = Array.isArray(this.value) ? this.value : [this.value];
      questionPlainData.isNode = true;
      questionPlainData.data = (questionPlainData.data || []).concat(
        values.map((dataValue, index) => {
          var choice = ItemValue.getItemByValue(this.visibleChoices, dataValue);
          var choiceDataItem = <any>{
            name: index,
            title: this.getLocalizationString("choices_Choice"),
            value: dataValue,
            displayValue: this.getChoicesDisplayValue(
              this.visibleChoices,
              dataValue
            ),
            getString: (val: any) =>
              typeof val === "object" ? JSON.stringify(val) : val,
            isNode: false,
          };
          if (!!choice) {
            (options.calculations || []).forEach((calculation) => {
              choiceDataItem[calculation.propertyName] =
                choice[calculation.propertyName];
            });
          }
          if (this.isOtherSelected && this.otherItemValue === choice) {
            choiceDataItem.isOther = true;
            choiceDataItem.displayValue = this.otherValue;
          }
          return choiceDataItem;
        })
      );
    }
    return questionPlainData;
  }
  protected getDisplayValueCore(keysAsText: boolean, value: any): any {
    if (!this.useDisplayValuesInDynamicTexts) return value;
    return this.getChoicesDisplayValue(this.visibleChoices, value);
  }
  protected getDisplayValueEmpty(): string {
    return ItemValue.getTextOrHtmlByValue(this.visibleChoices, undefined);
  }
  private getChoicesDisplayValue(items: ItemValue[], val: any): any {
    if (val == this.otherItemValue.value)
      return this.otherValue ? this.otherValue : this.locOtherText.textOrHtml;
    const selItem = this.getSingleSelectedItem();
    if (!!selItem && this.isTwoValueEquals(selItem.value, val)) return selItem.locText.textOrHtml;
    var str = ItemValue.getTextOrHtmlByValue(items, val);
    return str == "" && val ? val : str;
  }
  protected getDisplayArrayValue(keysAsText: boolean, value: any,
    onGetValueCallback?: (index: number) => any): string {
    var items = this.visibleChoices;
    var strs = [] as Array<string>;
    const vals = [] as Array<any>;
    for (var i = 0; i < value.length; i++) {
      vals.push(!onGetValueCallback ? value[i] : onGetValueCallback(i));
    }
    if (Helpers.isTwoValueEquals(this.value, vals)) {
      this.getMultipleSelectedItems().forEach((item, index) => strs.push(this.getItemDisplayValue(item, vals[index])));
    }
    if (strs.length === 0) {
      for (var i = 0; i < vals.length; i++) {
        let valStr = this.getChoicesDisplayValue(items, vals[i]);
        if (valStr) {
          strs.push(valStr);
        }
      }
    }
    return strs.join(settings.choicesSeparator);
  }
  private getItemDisplayValue(item: ItemValue, val?: any): string {
    if (item === this.otherItem) {
      if (this.hasOther && this.showCommentArea && !!val) {
        return val;
      }
      if (this.comment) {
        return this.comment;
      }
    }
    return item.locText.textOrHtml;
  }
  private getFilteredChoices(): Array<ItemValue> {
    return this.filteredChoicesValue
      ? this.filteredChoicesValue
      : this.activeChoices;
  }
  private get activeChoices(): Array<ItemValue> {
    const question = this.getCarryForwardQuestion();
    if (this.carryForwardQuestionType === "select") {
      (<QuestionSelectBase>question).addDependedQuestion(this);
      return this.getChoicesFromSelectQuestion((<QuestionSelectBase>question));
    }
    if (this.carryForwardQuestionType === "array") {
      (<any>question).addDependedQuestion(this);
      return this.getChoicesFromArrayQuestion(question);
    }
    if (this.isEmptyActiveChoicesInDesign) return [];
    return this.choicesFromUrl ? this.choicesFromUrl : this.getChoices();
  }
  public get isMessagePanelVisible(): boolean {
    return this.getPropertyValue("isMessagePanelVisible", false);
  }
  public set isMessagePanelVisible(val: boolean) {
    this.setPropertyValue("isMessagePanelVisible", val);
  }
  private get isEmptyActiveChoicesInDesign(): boolean {
    return this.isInDesignMode && (this.hasChoicesUrl || this.isMessagePanelVisible);
  }
  getCarryForwardQuestion(data?: ISurveyData): Question {
    const question = this.findCarryForwardQuestion(data);
    const selBaseQuestion = this.getQuestionWithChoicesCore(question);
    const arrayQuestion = !selBaseQuestion ? this.getQuestionWithArrayValue(question) : null;
    this.setCarryForwardQuestionType(!!selBaseQuestion, !!arrayQuestion);
    return !!selBaseQuestion || !!arrayQuestion ? question : null;
  }
  protected getIsReadyDependsOn(): Array<Question> {
    const res = super.getIsReadyDependsOn();
    if (this.carryForwardQuestion) {
      res.push(this.carryForwardQuestion);
    }
    return res;
  }
  private getQuestionWithChoices(): QuestionSelectBase {
    return this.getQuestionWithChoicesCore(this.findCarryForwardQuestion());
  }
  private carryForwardQuestion: Question;
  private findCarryForwardQuestion(data?: ISurveyData): Question {
    if (!data) data = this.data;
    this.carryForwardQuestion = null;
    if (this.choicesFromQuestion && data) {
      this.carryForwardQuestion = <Question>data.findQuestionByName(this.choicesFromQuestion);
    }
    return this.carryForwardQuestion;
  }
  private getQuestionWithChoicesCore(question: Question): QuestionSelectBase {
    if (!!question && !!question.visibleChoices && (Serializer.isDescendantOf(question.getType(), "selectbase")) && question !== this)
      return <QuestionSelectBase>question;
    return null;
  }
  private getQuestionWithArrayValue(question: Question): Question {
    return !!question && question.isValueArray ? question : null;
  }
  private getChoicesFromArrayQuestion(question: Question): Array<ItemValue> {
    if (this.isInDesignMode) return [];
    const val = question.value;
    if (!Array.isArray(val)) return [];
    const res: Array<ItemValue> = [];
    for (var i = 0; i < val.length; i++) {
      const obj = val[i];
      if (!Helpers.isValueObject(obj)) continue;
      const key = this.getValueKeyName(obj);
      if (!!key && !this.isValueEmpty(obj[key])) {
        const text = !!this.choiceTextsFromQuestion ? obj[this.choiceTextsFromQuestion] : undefined;
        res.push(this.createItemValue(obj[key], text));
      }
    }
    return res;
  }
  private getValueKeyName(obj: any): string {
    if (this.choiceValuesFromQuestion) return this.choiceValuesFromQuestion;
    const keys = Object.keys(obj);
    return keys.length > 0 ? keys[0] : undefined;
  }
  private getChoicesFromSelectQuestion(question: QuestionSelectBase): Array<ItemValue> {
    if (this.isInDesignMode) return [];
    const res: Array<ItemValue> = [];
    var isSelected =
      this.choicesFromQuestionMode == "selected"
        ? true
        : this.choicesFromQuestionMode == "unselected"
          ? false
          : undefined;
    const choices = question.visibleChoices;
    for (var i = 0; i < choices.length; i++) {
      if (question.isBuiltInChoice(choices[i])) continue;
      if (isSelected === undefined) {
        res.push(this.copyChoiceItem(choices[i]));
        continue;
      }
      var itemsSelected = question.isItemSelected(choices[i]);
      if ((itemsSelected && isSelected) || (!itemsSelected && !isSelected)) {
        res.push(this.copyChoiceItem(choices[i]));
      }
    }
    if (this.choicesFromQuestionMode === "selected" && !this.showOtherItem && question.isOtherSelected && !!question.comment) {
      res.push(this.createItemValue(question.otherItem.value, question.comment));
    }
    return res;
  }
  private copyChoiceItem(item: ItemValue): ItemValue {
    const res = this.createItemValue(item.value);
    res.setData(item);
    return res;
  }
  protected get hasActiveChoices(): boolean {
    var choices = this.visibleChoices;
    if (!choices || choices.length == 0) {
      this.onVisibleChoicesChanged();
      choices = this.visibleChoices;
    }
    for (var i = 0; i < choices.length; i++) {
      if (!this.isBuiltInChoice(choices[i])) return true;
    }
    return false;
  }
  protected isBuiltInChoice(item: ItemValue): boolean {
    return this.isNoneItem(item) ||
      item === this.otherItem ||
      item === this.newItemValue;
  }
  public isNoneItem(item: ItemValue): boolean {
    return this.getNoneItems().indexOf(item) > -1;
  }
  protected getNoneItems(): Array<ItemValue> {
    return [this.noneItem, this.refuseItem, this.dontKnowItem];
  }
  protected getChoices(): Array<ItemValue> {
    return this.choices;
  }
  public supportOther(): boolean {
    return this.isSupportProperty("showOtherItem");
  }
  public supportNone(): boolean {
    return this.isSupportProperty("showNoneItem");
  }
  public supportRefuse(): boolean {
    return this.isSupportProperty("showRefuseItem");
  }
  public supportDontKnow(): boolean {
    return this.isSupportProperty("showDontKnowItem");
  }
  protected isSupportProperty(propName: string): boolean {
    return (
      !this.isDesignMode ||
      this.getPropertyByName(propName).visible
    );
  }
  protected onCheckForErrors(errors: Array<SurveyError>, isOnValueChanged: boolean, fireCallback: boolean): void {
    super.onCheckForErrors(errors, isOnValueChanged, fireCallback);
    if (!this.hasOther || !this.isOtherSelected || this.otherValue
      || isOnValueChanged && !this.prevOtherErrorValue) return;
    const otherEmptyError = new OtherEmptyError(this.otherErrorText, this);
    otherEmptyError.onUpdateErrorTextCallback = err => { err.text = this.otherErrorText; };
    errors.push(otherEmptyError);
  }
  public setSurveyImpl(value: ISurveyImpl, isLight?: boolean): void {
    this.isRunningChoices = true;
    super.setSurveyImpl(value, isLight);
    this.isRunningChoices = false;
    this.runChoicesByUrl();
    if (this.isAddDefaultItems) {
      this.updateVisibleChoices();
    }
  }
  protected setSurveyCore(value: ISurvey): void {
    super.setSurveyCore(value);
    if (!!value && !!this.choicesFromQuestion) {
      this.onVisibleChoicesChanged();
    }
  }
  public getStoreOthersAsComment(): boolean {
    if (this.isSettingDefaultValue) return false;
    if (this.showCommentArea) return false;
    return (
      this.storeOthersAsComment === true ||
      (this.storeOthersAsComment == "default" &&
        (this.survey != null ? this.survey.storeOthersAsComment : true)) ||
      (this.hasChoicesUrl && !this.choicesFromUrl)
    );
  }
  onSurveyLoad(): void {
    this.runChoicesByUrl();
    this.onVisibleChoicesChanged();
    super.onSurveyLoad();
  }
  onAnyValueChanged(name: string, questionName: string): void {
    super.onAnyValueChanged(name, questionName);
    if (name != this.getValueName()) {
      this.runChoicesByUrl();
    }
    const chQuestion = this.choicesFromQuestion;
    if (!!name && chQuestion && (name === chQuestion || questionName === chQuestion)) {
      this.onVisibleChoicesChanged();
      this.clearIncorrectValues();
    }
  }
  updateValueFromSurvey(newValue: any, clearData: boolean): void {
    var newComment = "";
    if (
      this.hasOther &&
      !this.isRunningChoices &&
      !this.choicesByUrl.isRunning &&
      this.getStoreOthersAsComment()
    ) {
      if (this.hasUnknownValue(newValue) && !this.getHasOther(newValue)) {
        newComment = this.getCommentFromValue(newValue);
        newValue = this.setOtherValueIntoValue(newValue);
      } else {
        if (this.data) {
          newComment = this.data.getComment(this.getValueName());
        }
      }
    }
    super.updateValueFromSurvey(newValue, clearData);
    if ((this.isRunningChoices || this.choicesByUrl.isRunning) && !this.isEmpty()) {
      this.cachedValueForUrlRequests = this.value;
    }
    if (!!newComment) {
      this.setNewComment(newComment);
    }
  }
  protected getCommentFromValue(newValue: any): string {
    return newValue;
  }
  protected setOtherValueIntoValue(newValue: any): any {
    return this.otherItem.value;
  }
  public onOtherValueInput(event: any): void {
    if (this.isInputTextUpdate) {
      if (event.target) {
        this.otherValue = event.target.value;
      }
    }
    else {
      this.updateCommentElements();
    }
  }
  public onOtherValueChange(event: any): void {
    this.otherValue = event.target.value;
    if (this.otherValue !== event.target.value) {
      event.target.value = this.otherValue;
    }
  }
  private isRunningChoices: boolean = false;
  private runChoicesByUrl() {
    this.updateIsUsingRestful();
    if (!this.choicesByUrl || this.isLoadingFromJson || this.isRunningChoices || this.isInDesignMode)
      return;
    var processor = this.surveyImpl
      ? this.surveyImpl.getTextProcessor()
      : this.textProcessor;
    if (!processor) processor = this.survey;
    if (!processor) return;
    this.updateIsReady();
    this.isRunningChoices = true;
    this.choicesByUrl.run(processor);
    this.isRunningChoices = false;
  }
  private isFirstLoadChoicesFromUrl = true;
  protected onBeforeSendRequest() {
    if (settings.web.disableQuestionWhileLoadingChoices === true && !this.isReadOnly) {
      this.enableOnLoadingChoices = true;
      this.readOnly = true;
    }
  }
  protected onLoadChoicesFromUrl(array: Array<ItemValue>): void {
    if (this.enableOnLoadingChoices) {
      this.readOnly = false;
    }
    const errors = [];
    if (!this.isReadOnly) {
      if (this.choicesByUrl && this.choicesByUrl.error) {
        errors.push(this.choicesByUrl.error);
      }
    }
    var newChoices = null;
    var checkCachedValuesOnExisting = true;
    if (
      this.isFirstLoadChoicesFromUrl &&
      !this.cachedValueForUrlRequests &&
      this.defaultValue
    ) {
      this.cachedValueForUrlRequests = this.defaultValue;
      checkCachedValuesOnExisting = false;
    }
    if (this.isValueEmpty(this.cachedValueForUrlRequests)) {
      this.cachedValueForUrlRequests = this.value;
    }
    var cachedValues = this.createCachedValueForUrlRequests(
      this.cachedValueForUrlRequests,
      checkCachedValuesOnExisting
    );
    if (array && (array.length > 0 || this.choicesByUrl.allowEmptyResponse)) {
      newChoices = new Array<ItemValue>();
      ItemValue.setData(newChoices, array);
    }
    if (!!newChoices) {
      for (var i = 0; i < newChoices.length; i++) {
        newChoices[i].locOwner = this;
      }
    }
    this.setChoicesFromUrl(newChoices, errors, cachedValues);
  }
  private canAvoidSettChoicesFromUrl(newChoices: Array<ItemValue>): boolean {
    if (this.isFirstLoadChoicesFromUrl) return false;
    const chocesAreEmpty = !newChoices || Array.isArray(newChoices) && newChoices.length === 0;
    if (chocesAreEmpty && !this.isEmpty()) return false;
    return Helpers.isTwoValueEquals(this.choicesFromUrl, newChoices);
  }
  private setChoicesFromUrl(newChoices: Array<ItemValue>, errors: Array<any>, cachedValues: any): void {
    if (this.canAvoidSettChoicesFromUrl(newChoices)) return;
    this.isFirstLoadChoicesFromUrl = false;
    this.choicesFromUrl = newChoices;
    this.filterItems();
    this.onVisibleChoicesChanged();
    if (newChoices) {
      var newValue = this.updateCachedValueForUrlRequests(
        cachedValues,
        newChoices
      );
      if (!!newValue && !this.isReadOnly) {
        var hasChanged = !this.isTwoValueEquals(this.value, newValue.value);
        try {
          if (!this.isValueEmpty(newValue.value)) {
            this.allowNotifyValueChanged = false;
            this.setQuestionValue(undefined, true, false);
          }
          this.allowNotifyValueChanged = hasChanged;
          if (hasChanged) {
            this.value = newValue.value;
          } else {
            this.setQuestionValue(newValue.value);
          }
        } finally {
          this.allowNotifyValueChanged = true;
        }
      }
    }
    if (!this.isReadOnly && !newChoices && !this.isFirstLoadChoicesFromUrl) {
      this.value = null;
    }
    this.errors = errors;
    this.choicesLoaded();
  }
  private createCachedValueForUrlRequests(
    val: any,
    checkOnExisting: boolean
  ): any {
    if (this.isValueEmpty(val)) return null;
    if (Array.isArray(val)) {
      var res = [];
      for (var i = 0; i < val.length; i++) {
        res.push(this.createCachedValueForUrlRequests(val[i], true));
      }
      return res;
    }
    var isExists = checkOnExisting ? !this.hasUnknownValue(val) : true;
    return { value: val, isExists: isExists };
  }
  private updateCachedValueForUrlRequests(
    val: any,
    newChoices: Array<ItemValue>
  ): any {
    if (this.isValueEmpty(val)) return null;
    if (Array.isArray(val)) {
      var res = [];
      for (var i = 0; i < val.length; i++) {
        var updatedValue = this.updateCachedValueForUrlRequests(
          val[i],
          newChoices
        );
        if (updatedValue && !this.isValueEmpty(updatedValue.value)) {
          var newValue = updatedValue.value;
          var item = ItemValue.getItemByValue(newChoices, updatedValue.value);
          if (!!item) {
            newValue = item.value;
          }
          res.push(newValue);
        }
      }
      return { value: res };
    }
    var value =
      val.isExists && this.hasUnknownValue(val.value) ? null : val.value;
    var item = ItemValue.getItemByValue(newChoices, value);
    if (!!item) {
      value = item.value;
    }
    return { value: value };
  }
  private isUpdatingChoicesDependedQuestions = false;
  protected updateChoicesDependedQuestions(): void {
    if (this.isLoadingFromJson || this.isUpdatingChoicesDependedQuestions ||
      !this.allowNotifyValueChanged || this.choicesByUrl.isRunning) return;
    this.isUpdatingChoicesDependedQuestions = true;
    this.updateDependedQuestions();
    this.isUpdatingChoicesDependedQuestions = false;
  }
  protected updateDependedQuestion(): void {
    this.onVisibleChoicesChanged();
    this.clearIncorrectValues();
  }
  onSurveyValueChanged(newValue: any): void {
    super.onSurveyValueChanged(newValue);
    this.updateChoicesDependedQuestions();
  }
  protected onVisibleChoicesChanged(): void {
    if (this.isLoadingFromJson || this.isLockVisibleChoices) return;
    this.updateVisibleChoices();
    this.onVisibleChanged();
    if (!!this.visibleChoicesChangedCallback) {
      this.visibleChoicesChangedCallback();
    }
    this.updateChoicesDependedQuestions();
  }
  protected isVisibleCore(): boolean {
    const superVal = super.isVisibleCore();
    if (!this.hideIfChoicesEmpty || !superVal) return superVal;
    var choices = this.isUsingCarryForward ? this.visibleChoices : this.getFilteredChoices();
    return !choices || choices.length > 0;
  }
  private sortVisibleChoices(array: Array<ItemValue>): Array<ItemValue> {
    if (this.isInDesignMode) return array;
    var order = this.choicesOrder.toLowerCase();
    if (order == "asc") return this.sortArray(array, 1);
    if (order == "desc") return this.sortArray(array, -1);
    if (order == "random") return this.randomizeArray(array);
    return array;
  }
  private sortArray(array: Array<ItemValue>, mult: number): Array<ItemValue> {
    return array.sort(function (a, b) {
      return Helpers.compareStrings(a.calculatedText, b.calculatedText) * mult;
    });
  }
  private randomizeArray(array: Array<ItemValue>): Array<ItemValue> {
    return Helpers.randomizeArray<ItemValue>(array);
  }
  private get hasChoicesUrl(): boolean {
    return this.choicesByUrl && !!this.choicesByUrl.url;
  }
  public clearIncorrectValues(): void {
    if (!this.hasValueToClearIncorrectValues() || !this.canClearIncorrectValues()) return;
    if (this.clearIncorrectValuesCallback) {
      this.clearIncorrectValuesCallback();
    } else {
      this.clearIncorrectValuesCore();
    }
  }
  private canClearIncorrectValues(): boolean {
    if (this.carryForwardQuestion && !this.carryForwardQuestion.isReady) return false;
    if (!!this.survey && this.survey.questionsByValueName(this.getValueName()).length > 1) return false;
    if (this.hasChoicesUrl && (!this.choicesFromUrl || this.choicesFromUrl.length == 0)) return false;
    return true;
  }
  protected hasValueToClearIncorrectValues(): boolean {
    if (!!this.survey && this.survey.keepIncorrectValues) return false;
    return !this.keepIncorrectValues && !this.isEmpty();
  }
  protected clearValueIfInvisibleCore(reason: string): void {
    super.clearValueIfInvisibleCore(reason);
    this.clearIncorrectValues();
  }
  /**
   * Returns `true` if a passed choice item is selected.
   *
   * To obtain a choice item to check, use the `noneItem` or `otherItem` property or the `choices` array.
   * @param item A choice item.
   * @see noneItem
   * @see otherItem
   * @see choices
   */
  public isItemSelected(item: ItemValue): boolean {
    if (item === this.otherItem) return this.isOtherSelected;
    return this.isItemSelectedCore(item);
  }
  protected isItemSelectedCore(item: ItemValue): boolean {
    return item.value === this.value;
  }
  private clearDisabledValues() {
    if (!this.survey || !this.survey.clearDisabledChoices) return;
    this.clearDisabledValuesCore();
  }
  protected clearIncorrectValuesCore(): void {
    var val = this.value;
    if (this.canClearValueAnUnknown(val)) {
      this.clearValue(true);
    }
  }
  protected canClearValueAnUnknown(val: any): boolean {
    if (!this.getStoreOthersAsComment() && this.isOtherSelected) return false;
    return this.hasUnknownValue(val, true, true, true);
  }
  protected clearDisabledValuesCore() {
    if (this.isValueDisabled(this.value)) {
      this.clearValue(true);
    }
  }
  clearUnusedValues() {
    super.clearUnusedValues();
    if (!this.isOtherSelected) {
      this.otherValue = "";
    }
    if (!this.showCommentArea && (!this.getStoreOthersAsComment() && !this.isOtherSelected)) {
      this.comment = "";
    }
  }
  getColumnClass(): string {
    return new CssClassBuilder()
      .append(this.cssClasses.column)
      .append("sv-q-column-" + this.colCount, this.hasColumns)
      .toString();
  }
  getItemIndex(item: any): number {
    return this.visibleChoices.indexOf(item);
  }
  getItemClass(item: any): string {
    const options: any = { item: item };
    var res = this.getItemClassCore(item, options);
    options.css = res;
    if (!!this.survey) {
      this.survey.updateChoiceItemCss(this, options);
    }
    return options.css;
  }
  protected getCurrentColCount(): number {
    return this.colCount;
  }
  protected getItemClassCore(item: any, options: any): string {
    const builder = new CssClassBuilder()
      .append(this.cssClasses.item)
      .append(this.cssClasses.itemInline, !this.hasColumns && this.colCount === 0)
      .append("sv-q-col-" + this.getCurrentColCount(), !this.hasColumns && this.colCount !== 0)
      .append(this.cssClasses.itemOnError, this.hasCssError());

    const readOnlyStyles = this.getIsDisableAndReadOnlyStyles(!item.isEnabled);
    const isReadOnly = readOnlyStyles[0];
    const isDisabled = readOnlyStyles[1];
    const isChecked = this.isItemSelected(item) ||
      (this.isOtherSelected && this.otherItem.value === item.value);
    const allowHover = !isDisabled && !isChecked && !(!!this.survey && this.survey.isDesignMode);
    const isNone = item === this.noneItem;
    options.isDisabled = isDisabled || isReadOnly;
    options.isChecked = isChecked;
    options.isNone = isNone;

    return builder
      .append(this.cssClasses.itemDisabled, isDisabled)
      .append(this.cssClasses.itemReadOnly, isReadOnly)
      .append(this.cssClasses.itemPreview, this.isPreviewStyle)
      .append(this.cssClasses.itemChecked, isChecked)
      .append(this.cssClasses.itemHover, allowHover)
      .append(this.cssClasses.itemNone, isNone)
      .toString();
  }

  getLabelClass(item: ItemValue): string {
    return new CssClassBuilder()
      .append(this.cssClasses.label)
      .append(this.cssClasses.labelChecked, this.isItemSelected(item))
      .toString();
  }
  getControlLabelClass(item: ItemValue): string {
    return new CssClassBuilder()
      .append(this.cssClasses.controlLabel)
      .append(this.cssClasses.controlLabelChecked, this.isItemSelected(item))
      .toString() || undefined;
  }

  @propertyArray() _renderedChoices: Array<ItemValue> = [];

  public onGetRenderedChoicesCallback?: (visibleChoices: Array<ItemValue>) => Array<ItemValue>;

  private updateRenderedChoices() {
    this.renderedChoices = this.onGetRenderedChoicesCallback ? this.onGetRenderedChoicesCallback(this.visibleChoices) : this.visibleChoices;
  }

  private getRenderedChoicesAnimationOptions(): IAnimationGroupConsumer<ItemValue> {
    return {
      isAnimationEnabled: () => {
        return this.animationAllowed;
      },
      getRerenderEvent: () => {
        return this.onElementRerendered;
      },
      getKey: (item) => item != this.newItemValue ? item.value : this.newItemValue,
      getLeaveOptions: (item: ItemValue) => {
        let cssClass = this.cssClasses.itemLeave;
        if (this.hasColumns) {
          const index = this.bodyItems.indexOf(item);
          if (index !== -1 && index !== this.bodyItems.length - 1) {
            cssClass = "";
          }
        }
        return {
          cssClass,
          onBeforeRunAnimation: prepareElementForVerticalAnimation,
          onAfterRunAnimation: cleanHtmlElementAfterAnimation
        };
      },
      getAnimatedElement: (item: ItemValue) => {
        return item.getRootElement();
      },
      getEnterOptions: (item: ItemValue) => {
        let cssClass = this.cssClasses.itemEnter;
        if (this.hasColumns) {
          const index = this.bodyItems.indexOf(item);
          if (index !== -1 && index !== this.bodyItems.length - 1) {
            cssClass = "";
          }
        }
        return {
          cssClass: cssClass,
          onBeforeRunAnimation: (el) => {
            if (this.getCurrentColCount() == 0 && this.bodyItems.indexOf(item) >= 0) {
              const leftPosition = (el.parentElement.firstElementChild as HTMLElement).offsetLeft;
              if (el.offsetLeft > leftPosition) {
                setPropertiesOnElementForAnimation(el, { moveAnimationDuration: "0s", fadeAnimationDelay: "0s" }, "--");
              }
            }
            prepareElementForVerticalAnimation(el);
          },
          onAfterRunAnimation: cleanHtmlElementAfterAnimation
        };
      }
    };
  }
  private renderedChoicesAnimation = new AnimationGroup(
    this.getRenderedChoicesAnimationOptions(),
    (val) => {
      this._renderedChoices = val;
      this.renderedChoicesChangedCallback && this.renderedChoicesChangedCallback();
    },
    () => this._renderedChoices
  )

  public get renderedChoices(): Array<ItemValue> {
    return this._renderedChoices;
  }
  public set renderedChoices(val: Array<ItemValue>) {
    this.renderedChoicesAnimation.sync(val);
  }

  private headItemsCount: number = 0;
  private footItemsCount: number = 0;
  get headItems(): ItemValue[] {
    const count = (this.separateSpecialChoices || this.isInDesignMode) ? this.headItemsCount : 0;
    const res = [];
    for (let i = 0; i < count; i++) {
      if (this.renderedChoices[i]) {
        res.push(this.renderedChoices[i]);
      }
    }
    return res;
  }
  get footItems(): ItemValue[] {
    const count = (this.separateSpecialChoices || this.isInDesignMode) ? this.footItemsCount : 0;
    const res = [];
    const items = this.renderedChoices;
    for (let i = 0; i < count; i++) {
      if (this.renderedChoices[items.length - count + i]) {
        res.push(this.renderedChoices[items.length - count + i]);
      }
    }
    return res;
  }
  get dataChoices(): ItemValue[] {
    return this.renderedChoices.filter((item) => !this.isBuiltInChoice(item));
  }
  get bodyItems(): ItemValue[] {
    return (this.hasHeadItems || this.hasFootItems) ? this.dataChoices : this.renderedChoices;
  }
  get hasHeadItems(): boolean {
    return this.headItems.length > 0;
  }
  get hasFootItems(): boolean {
    return this.footItems.length > 0;
  }
  protected get itemFlowDirection() {
    return settings.itemFlowDirection;
  }
  get columns() {
    if (!this.hasColumns || this.renderedChoices.length === 0) return [];

    const colCount = this.getCurrentColCount();
    let choicesToBuildColumns = (!this.separateSpecialChoices && !this.isInDesignMode) ?
      this.renderedChoices : this.dataChoices;

    if (this.itemFlowDirection === "column") {
      return this.getColumnsWithColumnItemFlow(choicesToBuildColumns, colCount);
    } else {
      return this.getColumnsWithRowItemFlow(choicesToBuildColumns, colCount);
    }
  }
  private getColumnsWithColumnItemFlow(choices, colCount) {
    const columns =[];
    let maxColumnHeight = Math.floor(choices.length / colCount);

    if (choices.length % colCount) {
      maxColumnHeight += 1;
    }

    let choicesLeft = choices.length;
    let columnsLeft = colCount;
    let indexShift = 0;

    for (let i = 0; i < colCount; i++) {
      const column = [];

      for (let j = 0; j < maxColumnHeight; j++) {
        if (choicesLeft <= columnsLeft) {
          maxColumnHeight = 1;
        }
        const choice = choices[j + indexShift];
        if (choice) {
          column.push(choice);
          choicesLeft--;
        }
      }
      columns.push(column);
      columnsLeft--;
      indexShift += column.length;
    }

    return columns;
  }
  private getColumnsWithRowItemFlow(choices, colCount) {
    const columns = [];
    for (let i = 0; i < colCount; i++) {
      const column = [];
      for (let j = i; j < choices.length; j += colCount) {
        column.push(choices[j]);
      }
      columns.push(column);
    }
    return columns;
  }
  getItemsColumnKey(itemsColumn: Array<ItemValue>) {
    return (itemsColumn || []).map(c => c.value || "").join("");
  }
  get hasColumns() {
    return !this.isMobile &&
      (this.getCurrentColCount() > 1);
  }
  get rowLayout() {
    return this.getCurrentColCount() == 0 && !(this.hasFootItems || this.hasHeadItems);
  }
  get blockedRow() {
    return this.getCurrentColCount() == 0 && (this.hasFootItems || this.hasHeadItems);
  }

  public choicesLoaded(): void {
    this.isChoicesLoaded = true;
    this.updateIsReady();
    if (this.survey) {
      this.survey.loadedChoicesFromServer(this);
    }
    if (this.loadedChoicesFromServerCallback) {
      this.loadedChoicesFromServerCallback();
    }
  }
  public getItemValueWrapperComponentName(item: ItemValue): string {
    const survey: SurveyModel = this.survey as SurveyModel;
    if (survey) {
      return survey.getItemValueWrapperComponentName(item, this);
    }
    return SurveyModel.TemplateRendererComponentName;
  }
  public getItemValueWrapperComponentData(item: ItemValue): any {
    const survey: SurveyModel = this.survey as SurveyModel;
    if (survey) {
      return survey.getItemValueWrapperComponentData(item, this);
    }
    return item;
  }
  public ariaItemChecked(item: ItemValue) {
    return this.renderedValue === item.value ? "true" : "false";
  }
  public isOtherItem(item: ItemValue) {
    return this.hasOther && item.value == this.otherItem.value;
  }
  public get itemSvgIcon(): string {
    if (this.isPreviewStyle && this.cssClasses.itemPreviewSvgIconId) {
      return this.cssClasses.itemPreviewSvgIconId;
    }
    return this.cssClasses.itemSvgIconId;
  }
  public getSelectBaseRootCss(): string {
    return new CssClassBuilder()
      .append(this.getQuestionRootCss())
      .append(this.cssClasses.rootRow, this.rowLayout)
      .toString();
  }
  protected allowMobileInDesignMode(): boolean {
    return true;
  }

  public getAriaItemLabel(item: ItemValue) {
    return item.locText.renderedHtml;
  }
  public getItemId(item: ItemValue) {
    return this.inputId + "_" + this.getItemIndex(item);
  }
  public get questionName() {
    return this.name + "_" + this.id;
  }
  public getItemEnabled(item: ItemValue): boolean {
    return !this.isDisabledAttr && item.isEnabled;
  }
  private focusOtherComment() {
    SurveyElement.FocusElement(this.otherId, false, this.survey?.rootElement);
  }
  private prevIsOtherSelected: boolean = false;
  protected onValueChanged(): void {
    super.onValueChanged();
    if (!this.isDesignMode && !this.prevIsOtherSelected && this.isOtherSelected) {
      this.focusOtherComment();
    }
    this.prevIsOtherSelected = this.isOtherSelected;
  }
  protected getDefaultItemComponent(): string {
    return "";
  }
  /**
   * The name of a component used to render items.
   *
   * [View Dropdown Demo](https://surveyjs.io/form-library/examples/dropdown-box-with-custom-items/ (linkStyle))
   *
   * [View Ranking Demo](https://surveyjs.io/form-library/examples/ranking-with-custom-items/ (linkStyle))
   */
  public get itemComponent(): string {
    return this.getPropertyValue("itemComponent", this.getDefaultItemComponent());
  }
  public set itemComponent(value: string) {
    this.setPropertyValue("itemComponent", value);
  }
}
/**
 * A base class for multiple-selection question types that can display choice items in multiple columns ([Checkbox](https://surveyjs.io/form-library/documentation/questioncheckboxmodel), [Radiogroup](https://surveyjs.io/form-library/documentation/questionradiogroupmodel), [Image Picker](https://surveyjs.io/form-library/documentation/questionimagepickermodel)).
 */
export class QuestionCheckboxBase extends QuestionSelectBase {
  colCountChangedCallback: () => void;
  constructor(name: string) {
    super(name);
  }
  /**
   * Gets or sets the number of columns used to arrange choice items.
   *
   * Set this property to 0 if you want to display all items in one line. The default value depends on the available width.
   * @see separateSpecialChoices
   */
  public get colCount(): number {
    return this.getPropertyValue("colCount", this.isFlowLayout ? 0 : undefined);
  }
  public set colCount(value: number) {
    if (value < 0 || value > 5 || this.isFlowLayout) return;
    this.setPropertyValue("colCount", value);
    this.fireCallback(this.colCountChangedCallback);
  }
  protected onParentChanged() {
    super.onParentChanged();
    if (this.isFlowLayout) {
      this.setPropertyValue("colCount", null);
    }
  }
  protected onParentQuestionChanged() {
    this.onVisibleChoicesChanged();
  }
  protected getSearchableItemValueKeys(keys: Array<string>) {
    keys.push("choices");
  }
}

function checkCopyPropVisibility(obj: any, mode: string): boolean {
  if (!obj) return false;
  if (!!obj.templateQuestion) {
    const data = obj.colOwner?.data;
    obj = obj.templateQuestion;
    if (!obj.getCarryForwardQuestion(data)) return false;
  }
  return obj.carryForwardQuestionType === mode;
}
Serializer.addClass(
  "selectbase",
  [
    { name: "showCommentArea:switch", layout: "row", visible: true, category: "general" },
    "choicesFromQuestion:question_carryforward",
    {
      name: "choices:itemvalue[]", uniqueProperty: "value",
      baseValue: function () {
        return getLocaleString("choices_Item");
      },
      dependsOn: "choicesFromQuestion",
      visibleIf: (obj: any) => {
        return !obj.choicesFromQuestion;
      },
    },
    {
      name: "choicesFromQuestionMode",
      default: "all",
      choices: ["all", "selected", "unselected"],
      dependsOn: "choicesFromQuestion",
      visibleIf: (obj: any) => {
        return checkCopyPropVisibility(obj, "select");
      },
    },
    {
      name: "choiceValuesFromQuestion",
      dependsOn: "choicesFromQuestion",
      visibleIf: (obj: any) => {
        return checkCopyPropVisibility(obj, "array");
      },
    },
    {
      name: "choiceTextsFromQuestion",
      dependsOn: "choicesFromQuestion",
      visibleIf: (obj: any) => {
        return checkCopyPropVisibility(obj, "array");
      },
    },
    {
      name: "choicesOrder",
      default: "none",
      choices: ["none", "asc", "desc", "random"],
      dependsOn: "choicesFromQuestion",
      visibleIf: (obj: any) => {
        return !obj.choicesFromQuestion;
      },
    },

    {
      name: "choicesByUrl:restfull",
      className: "choicesByUrl",
      onGetValue: function (obj: any) {
        return obj.choicesByUrl.getData();
      },
      onSetValue: function (obj: any, value: any) {
        obj.choicesByUrl.setData(value);
      },
    },
    "hideIfChoicesEmpty:boolean",
    "choicesVisibleIf:condition",
    {
      name: "choicesEnableIf:condition",
      dependsOn: "choicesFromQuestion",
      visibleIf: (obj: any) => {
        return !obj.choicesFromQuestion;
      },
    },
    { name: "defaultValue:value", visibleIf: (obj: any): boolean => !obj.choicesFromQuestion, dependsOn: "choicesFromQuestion" },
    { name: "correctAnswer:value", visibleIf: (obj: any): boolean => !obj.choicesFromQuestion, dependsOn: "choicesFromQuestion" },
    { name: "separateSpecialChoices:boolean", visible: false },
    { name: "showOtherItem:boolean", alternativeName: "hasOther" },
    { name: "showNoneItem:boolean", alternativeName: "hasNone" },
    { name: "showRefuseItem:boolean", visible: false, version: "1.9.128" },
    { name: "showDontKnowItem:boolean", visible: false, version: "1.9.128" },
    {
      name: "otherPlaceholder",
      alternativeName: "otherPlaceHolder",
      serializationProperty: "locOtherPlaceholder",
      dependsOn: "showOtherItem",
      visibleIf: function (obj: any) {
        return obj.hasOther;
      },
    },
    {
      name: "noneText",
      serializationProperty: "locNoneText",
      dependsOn: "showNoneItem",
      visibleIf: function (obj: any) {
        return obj.showNoneItem;
      },
    },
    {
      name: "refuseText",
      serializationProperty: "locRefuseText",
      dependsOn: "showRefuseItem",
      visibleIf: function (obj: any) {
        return obj.showRefuseItem;
      },
    },
    {
      name: "dontKnowText",
      serializationProperty: "locDontKnowText",
      dependsOn: "showDontKnowItem",
      visibleIf: function (obj: any) {
        return obj.showDontKnowItem;
      },
    },
    {
      name: "otherText",
      serializationProperty: "locOtherText",
      dependsOn: "showOtherItem",
      visibleIf: function (obj: any) {
        return obj.hasOther;
      },
    },
    {
      name: "otherErrorText",
      serializationProperty: "locOtherErrorText",
      dependsOn: "showOtherItem",
      visibleIf: function (obj: any) {
        return obj.hasOther;
      },
    },
    {
      name: "storeOthersAsComment",
      default: "default",
      choices: ["default", true, false],
      visible: false,
    }
  ],
  null,
  "question"
);

Serializer.addClass(
  "checkboxbase",
  [
    {
      name: "colCount:number",
      default: 1,
      choices: [0, 1, 2, 3, 4, 5],
      layout: "row",
    }
  ],
  null,
  "selectbase"
);
