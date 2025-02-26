import { Question, IConditionObject } from "./question";
import { Serializer, CustomPropertiesCollection, JsonObjectProperty } from "./jsonobject";
import { Base, ArrayChanges } from "./base";
import {
  ISurveyImpl,
  ISurveyData,
  ISurvey,
  ITextProcessor,
  IPanel,
  IElement,
  IQuestion,
  IProgressInfo
} from "./base-interfaces";
import { SurveyElement } from "./survey-element";
import { PanelModel } from "./panel";
import { PanelLayoutColumnModel } from "./panel-layout-column";
import { Helpers, HashTable } from "./helpers";
import { ItemValue } from "./itemvalue";
import { QuestionTextProcessor } from "./textPreProcessor";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { LocalizableString } from "./localizablestring";
import { SurveyError } from "./survey-error";
import { CustomError } from "./error";
import { ConsoleWarnings } from "./console-warnings";
import { settings } from "./settings";

/**
 * An interface used to create custom question types.
 *
 * Refer to the following articles for more information:
 *
 * - [Create Specialized Question Types](https://surveyjs.io/form-library/documentation/customize-question-types/create-specialized-question-types)
 * - [Create Composite Question Types](https://surveyjs.io/form-library/documentation/customize-question-types/create-composite-question-types)
 */
export interface ICustomQuestionTypeConfiguration {
  /**
   * A name used to identify a custom question type.
   *
   * @see title
   */
  name: string;
  /**
   * A title used for this custom question type in the UI. When `title` is not specified, the `name` property value is used.
   *
   * @see name
   */
  title?: string;
  /**
   * The name of an icon to use for the custom question type.
   *
   * [UI Icons](https://surveyjs.io/form-library/documentation/icons (linkStyle))
   */
  iconName?: string;
  internal?: boolean;
  /**
   * A function that is called when the custom question type is initialized. Use it to add, remove, or modify the type's properties (see [Override Base Question Properties](https://surveyjs.io/form-library/documentation/customize-question-types/create-composite-question-types#override-base-question-properties)).
   */
  onInit?(): void;
  /**
   * Specifies whether the custom question type is available in the Toolbox and the Add Question menu in Survey Creator.
   *
   * Default value: `true`
   *
   * Set this property to `false` if your custom question type is used only to customize Property Grid content and is not meant for a survey.
   */
  showInToolbox?: boolean;
  /**
   * A default title for questions created with this question type. Survey authors can change the default title in the JSON object or in Survey Creator's Property Grid.
   *
   * You can specify the question title with a string value or with an object that defines different titles for different locales:
   *
   * ```js
   * import { ComponentCollection } from "survey-core";
   *
   * ComponentCollection.Instance.add({
   *   // ...
   *   defaultQuestionTitle: "Default title"
   * });
   * // ===== OR =====
   * ComponentCollection.Instance.add({
   *   // ...
   *   defaultQuestionTitle: {
   *     en: "Default title",
   *     de: "Standardtitel",
   *     fr: "Titre par défaut"
   *   }
   * });
   * ```
   */
  defaultQuestionTitle?: any;
  /**
   * An array of property names to inherit from a base question or a Boolean value that specifies whether or not to inherit all properties.
   *
   * Default value: `false`
   *
   * When you create a [custom specialized question type](https://surveyjs.io/form-library/documentation/customize-question-types/create-specialized-question-types), you base it on another question type configured within the [`questionJSON`](#questionJSON) object. If the custom question type should inherit all properties from the base type, set the `inheritBaseProps` property to `true`. If you want to inherit only certain properties, set the `inheritBaseProps` property to an array of their names.
   *
   * [Create Specialized Question Types](https://surveyjs.io/form-library/documentation/customize-question-types/create-specialized-question-types (linkStyle))
   */
  inheritBaseProps?: false | true | Array<string>;
  /**
   * A function that is called when the custom question is created. Use it to access questions nested within a [composite question type](https://surveyjs.io/form-library/documentation/customize-question-types/create-composite-question-types).
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * The custom question.
   */
  onCreated?(question: Question): void;
  /**
   * A function that is called when JSON schemas are loaded.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A custom question.
   */
  onLoaded?(question: Question): void;
  /**
   * A function that is called after the entire question is rendered.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A custom question.
   * - `htmlElement`: `any`\
   * An HTML element that represents the custom question.
   */
  onAfterRender?(question: Question, htmlElement: any): void;
  /**
   * A function that is called each time a question nested within a [composite question](https://surveyjs.io/form-library/documentation/customize-question-types/create-composite-question-types) is rendered.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A composite question.
   * - `element`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A nested question.
   * - `htmlElement`: `any`\
   * An HTML element that represents a nested question.
   */
  onAfterRenderContentElement?(
    question: Question,
    element: Question,
    htmlElement: any
  ): void;
  /**
   * A function that is called each time a question nested within a [composite question](https://surveyjs.io/form-library/documentation/customize-question-types/create-composite-question-types) requires an update of its CSS classes.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A composite question.
   * - `element`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A nested question.
   * - `cssClasses`: `any`\
   * An object with CSS classes applied to a nested question, for example, `{ root: "class1", button: "class2" }`. You can modify this object to apply custom CSS classes.
   */
  onUpdateQuestionCssClasses?(question: Question, element: Question, cssClasses: any): void;
  /**
   * A function that is called when a custom question type property is changed. Use it to handle property changes.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A custom question.
   * - `propertyName`: `string`\
   * The name of the changed property.
   * - `newValue`: `any`\
   * A new value for the property.
   */
  onPropertyChanged?(
    question: Question,
    propertyName: string,
    newValue: any
  ): void;
  /**
   * A function that is called after the question value is changed in the UI.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A custom question.
   * - `name`: `string`\
   * The question's [name](https://surveyjs.io/Documentation/Library?id=Question#name).
   * - `newValue`: `any`\
   * A new value for the question.
   *
   * If you want to perform some actions when the value is changed in code as well as in the UI, implement the [`onValueSet`](https://surveyjs.io/form-library/documentation/api-reference/icustomquestiontypeconfiguration#onValueSet) function.
   */
  onValueChanged?(question: Question, name: string, newValue: any): void;
  /**
   * A function that is called before a question value is changed in the UI.
   *
   * This function should return the value you want to save: `newValue`, a custom value, or `undefined` if you want to clear the question value.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A custom question.
   * - `name`: `string`\
   * The question's [name](https://surveyjs.io/Documentation/Library?id=Question#name).
   * - `newValue`: `any`\
   * A new value for the question.
   */
  onValueChanging?(question: Question, name: string, newValue: any): any;
  /**
   * A function that is called when an [ItemValue](https://surveyjs.io/Documentation/Library?id=itemvalue) property is changed.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A custom question.
   * - `options.obj`: [ItemValue](https://surveyjs.io/Documentation/Library?id=itemvalue)\
   * An `ItemValue` object.
   * - `options.propertyName`: `string`\
   * The name of the property to which an array of `ItemValue` objects is assigned (for example, `"choices"` or `"rows"`).
   * - `options.name`: `string`\
   * The name of the changed property: `"text"` or `"value"`.
   * - `options.newValue`: `any`\
   * A new value for the property.
   */
  onItemValuePropertyChanged?(
    question: Question,
    options: { obj: ItemValue, propertyName: string, name: string, newValue: any }
  ): void;
  /**
   * A function that allows you to override the default `getDisplayValue()` implementation.
   */
  getDisplayValue?: ((keyAsText: boolean, value: any) => any) | ((question: Question) => any);
  /**
   * JSON schemas of nested questions. Specify this property to create a [composite question type](https://surveyjs.io/form-library/documentation/customize-question-types/create-composite-question-types).
   */
  elementsJSON?: any;
  /**
   * A function that allows you to create nested questions if you do not specify the `elementsJSON` property.
   *
   * @see elementsJSON
   */
  createElements?: any;
  /**
   * A JSON schema for a built-in question type on which the custom question type is based.
   *
   * Refer to the [Create Specialized Question Types](https://surveyjs.io/form-library/documentation/customize-question-types/create-specialized-question-types) help topic for more information.
   */
  questionJSON?: any;
  /**
   * A function that allows you to create a custom question if you do not specify the `questionJSON` property.
   *
   * @see questionJSON
   */
  createQuestion?: any;
  /**
   * A function that allows you to display different error texts based on conditions.
   * @param question A custom question. Use the `question.value` property to access the question's value.
   * @returns An error text.
   */
  getErrorText?: (question: Question) => string;
  /**
   * A function that is called after the question value is set.
   *
   * Parameters:
   *
   * - `question`: [Question](https://surveyjs.io/Documentation/Library?id=Question)\
   * A custom question.
   * - `newValue`: `any`\
   * A new value for the question.
   *
   * Unlike the [`onValueChanged`](https://surveyjs.io/form-library/documentation/api-reference/icustomquestiontypeconfiguration#onValueChanged) function, which is called only when the question value is changed in the UI, `onValueSet` is called when the value is changed in code as well.
   *
   * [View Demo](https://surveyjs.io/survey-creator/examples/smart-search-input/ (linkStyle))
   */
  onValueSet?: (question: Question, newValue: any) => void;
  onSetQuestionValue?: (question: Question, newValue: any) => void;
  valueToQuestion?: (val: any) => any;
  valueFromQuestion?: (val: any) => any;
  getValue?: (val: any) => any;
  setValue?: (val: any) => any;
}

export class ComponentQuestionJSON {
  private dynamicProperties: Array<JsonObjectProperty>;
  public constructor(public name: string, public json: ICustomQuestionTypeConfiguration) {
    var self = this;
    Serializer.addClass(
      name,
      [],
      function (json: any) {
        return ComponentCollection.Instance.createQuestion(
          !!json ? json.name : "",
          self
        );
      },
      "question"
    );
    this.onInit();
  }
  public onInit() {
    if (!this.json.onInit) return;
    this.json.onInit();
  }
  public onCreated(question: Question) {
    if (!this.json.onCreated) return;
    this.json.onCreated(question);
  }
  public onLoaded(question: Question) {
    if (!this.json.onLoaded) return;
    this.json.onLoaded(question);
  }
  public onAfterRender(question: Question, htmlElement: any): void {
    if (!this.json.onAfterRender) return;
    this.json.onAfterRender(question, htmlElement);
  }
  public onAfterRenderContentElement(
    question: Question,
    element: Question,
    htmlElement: any
  ): void {
    if (!this.json.onAfterRenderContentElement) return;
    this.json.onAfterRenderContentElement(question, element, htmlElement);
  }
  public onUpdateQuestionCssClasses(question: Question, element: Question, css: any): void {
    if (!this.json.onUpdateQuestionCssClasses) return;
    this.json.onUpdateQuestionCssClasses(question, element, css);
  }
  public onSetQuestionValue(question: Question, newValue: any): void {
    if (this.json.onSetQuestionValue) {
      this.json.onSetQuestionValue(question, newValue);
    }
    if (this.json.onValueSet) {
      this.json.onValueSet(question, newValue);
    }
  }
  public onPropertyChanged(
    question: Question,
    propertyName: string,
    newValue: any
  ): void {
    if (!this.json.onPropertyChanged) return;
    this.json.onPropertyChanged(question, propertyName, newValue);
  }
  public onValueChanged(question: Question, name: string, newValue: any): void {
    if (!this.json.onValueChanged) return;
    this.json.onValueChanged(question, name, newValue);
  }
  public onValueChanging(question: Question, name: string, newValue: any): any {
    if (!this.json.onValueChanging) return newValue;
    return this.json.onValueChanging(question, name, newValue);
  }
  public onGetErrorText(question: Question): string {
    if (!this.json.getErrorText) return undefined;
    return this.json.getErrorText(question);
  }
  public onItemValuePropertyChanged(
    question: Question,
    item: ItemValue,
    propertyName: string,
    name: string,
    newValue: any
  ): void {
    if (!this.json.onItemValuePropertyChanged) return;
    this.json.onItemValuePropertyChanged(question, {
      obj: item,
      propertyName: propertyName,
      name: name,
      newValue: newValue,
    });
  }
  public getDisplayValue(keyAsText: boolean, value: any, question: Question) {
    if (!this.json.getDisplayValue) return question.getDisplayValue(keyAsText, value);
    return (this.json as any).getDisplayValue(question);
  }
  public get defaultQuestionTitle(): any {
    return this.json.defaultQuestionTitle;
  }
  public setValueToQuestion(val: any): any {
    const converter = this.json.valueToQuestion || this.json.setValue;
    return !!converter ? converter(val): val;
  }
  public getValueFromQuestion(val: any): any {
    const converter = this.json.valueFromQuestion || this.json.getValue;
    return !!converter ? converter(val): val;
  }
  public get isComposite(): boolean {
    return !!this.json.elementsJSON || !!this.json.createElements;
  }
  public getDynamicProperties(): Array<JsonObjectProperty> {
    if(!Array.isArray(this.dynamicProperties)) {
      this.dynamicProperties = this.calcDynamicProperties();
    }
    return this.dynamicProperties;
  }
  private calcDynamicProperties(): Array<JsonObjectProperty> {
    const baseProps = this.json.inheritBaseProps;
    if(!baseProps || !this.json.questionJSON) return [];
    const type = this.json.questionJSON.type;
    if(!type) return [];
    if(Array.isArray(baseProps)) {
      const props: Array<JsonObjectProperty> = [];
      baseProps.forEach(name => {
        const prop = Serializer.findProperty(type, name);
        if(prop) {
          props.push(prop);
        }
      });
      return props;
    }
    const invalidNames = [];
    for(let key in this.json.questionJSON) {
      invalidNames.push(key);
    }
    return Serializer.getDynamicPropertiesByTypes(this.name, type, invalidNames);
  }
}

export class ComponentCollection {
  public static Instance: ComponentCollection = new ComponentCollection();
  private customQuestionValues: Array<ComponentQuestionJSON> = [];
  public onCreateComposite: (
    name: string,
    questionJSON: ComponentQuestionJSON
  ) => QuestionCompositeModel;
  public onCreateCustom: (
    name: string,
    questionJSON: ComponentQuestionJSON
  ) => QuestionCustomModel;
  public onAddingJson: (name: string, isComposite: boolean) => void;
  public add(json: ICustomQuestionTypeConfiguration): void {
    if (!json) return;
    let name = json.name;
    if (!name) {
      throw "Attribute name is missed";
    }
    name = name.toLowerCase();
    if (!!this.getCustomQuestionByName(name)) {
      throw "There is already registered custom question with name '" +
      name +
      "'";
    }
    if (!!Serializer.findClass(name)) {
      throw "There is already class with name '" + name + "'";
    }
    var customQuestion = new ComponentQuestionJSON(name, json);
    if (!!this.onAddingJson)
      this.onAddingJson(name, customQuestion.isComposite);
    this.customQuestionValues.push(customQuestion);
  }
  public remove(componentName: string): boolean {
    if(!componentName) return false;
    const index = this.getCustomQuestionIndex(componentName.toLowerCase());
    if(index < 0) return false;
    this.removeByIndex(index);
    return true;
  }
  public get items(): Array<ComponentQuestionJSON> {
    return this.customQuestionValues;
  }
  public getCustomQuestionByName(name: string): ComponentQuestionJSON {
    const index = this.getCustomQuestionIndex(name);
    return index >= 0 ? this.customQuestionValues[index] : undefined;
  }
  private getCustomQuestionIndex(name: string): number {
    for (var i = 0; i < this.customQuestionValues.length; i++) {
      if (this.customQuestionValues[i].name === name) return i;
    }
    return -1;
  }
  private removeByIndex(index: number): void {
    Serializer.removeClass(this.customQuestionValues[index].name);
    this.customQuestionValues.splice(index, 1);
  }
  public clear(includeInternal?: boolean): void {
    for (let i = this.customQuestionValues.length - 1; i >= 0; i--) {
      if(includeInternal || !this.customQuestionValues[i].json.internal) {
        this.removeByIndex(i);
      }
    }
  }
  public createQuestion(
    name: string,
    questionJSON: ComponentQuestionJSON
  ): Question {
    if (!!questionJSON.isComposite)
      return this.createCompositeModel(name, questionJSON);
    return this.createCustomModel(name, questionJSON);
  }
  protected createCompositeModel(
    name: string,
    questionJSON: ComponentQuestionJSON
  ): QuestionCompositeModel {
    if (!!this.onCreateComposite)
      return this.onCreateComposite(name, questionJSON);
    return new QuestionCompositeModel(name, questionJSON);
  }
  protected createCustomModel(
    name: string,
    questionJSON: ComponentQuestionJSON
  ): QuestionCustomModel {
    if (!!this.onCreateCustom) return this.onCreateCustom(name, questionJSON);
    return new QuestionCustomModel(name, questionJSON);
  }
}

export abstract class QuestionCustomModelBase extends Question
  implements ISurveyImpl, ISurveyData, IPanel {
  private locQuestionTitle: LocalizableString;
  constructor(name: string, public customQuestion: ComponentQuestionJSON) {
    super(name);
    CustomPropertiesCollection.createProperties(this);
    SurveyElement.CreateDisabledDesignElements = true;
    this.locQuestionTitle = this.createLocalizableString("questionTitle", this);
    this.locQuestionTitle.setJson(this.customQuestion.defaultQuestionTitle);
    this.createWrapper();
    SurveyElement.CreateDisabledDesignElements = false;
    if (!!this.customQuestion) {
      this.customQuestion.onCreated(this);
    }
  }
  public getType(): string {
    return !!this.customQuestion ? this.customQuestion.name : "custom";
  }
  public locStrsChanged(): void {
    super.locStrsChanged();
    if (!!this.getElement()) {
      this.getElement().locStrsChanged();
    }
  }
  public localeChanged(): void {
    super.locStrsChanged();
    if(!!this.getElement()) {
      this.getElement().localeChanged();
    }
  }
  protected getDefaultTitle(): string {
    if(!this.locQuestionTitle.isEmpty) {
      return this.getProcessedText(this.locQuestionTitle.textOrHtml);
    }
    return super.getDefaultTitle();
  }
  public addUsedLocales(locales: Array<string>): void {
    super.addUsedLocales(locales);
    if(!!this.getElement()) {
      this.getElement().addUsedLocales(locales);
    }
  }
  public needResponsiveWidth(): boolean {
    const el: any = this.getElement();
    return !!el ? el.needResponsiveWidth() : false;
  }
  protected createWrapper(): void { }
  protected onPropertyValueChanged(name: string, oldValue: any, newValue: any): void {
    super.onPropertyValueChanged(name, oldValue, newValue);
    if (!!this.customQuestion && !this.isLoadingFromJson) {
      this.customQuestion.onPropertyChanged(this, name, newValue);
    }
  }
  public itemValuePropertyChanged(
    item: ItemValue,
    name: string,
    oldValue: any,
    newValue: any
  ) {
    super.itemValuePropertyChanged(item, name, oldValue, newValue);
    if (!!this.customQuestion && !this.isLoadingFromJson) {
      this.customQuestion.onItemValuePropertyChanged(
        this,
        item,
        item.ownerPropertyName,
        name,
        newValue
      );
    }
  }
  protected onFirstRenderingCore(): void {
    super.onFirstRenderingCore();
    const el = this.getElement();
    if (!!el) {
      el.onFirstRendering();
    }
  }
  public onHidingContent(): void {
    super.onHidingContent();
    const el: any = this.getElement();
    if (!!el) {
      el.onHidingContent();
    }
  }
  public getProgressInfo(): IProgressInfo {
    let res = super.getProgressInfo();
    if (!!this.getElement()) {
      res = this.getElement().getProgressInfo();
    }
    if(this.isRequired && res.requiredQuestionCount == 0) {
      res.requiredQuestionCount = 1;
      if(!this.isEmpty()) {
        res.answeredQuestionCount = 1;
      }
    }
    return res;
  }
  protected abstract getElement(): SurveyElement;
  protected initElement(el: SurveyElement) {
    if (!el) return;
    el.setSurveyImpl(this);
    el.disableDesignActions = true;
  }
  protected isSettingValOnLoading: boolean;
  public setSurveyImpl(value: ISurveyImpl, isLight?: boolean) {
    this.isSettingValOnLoading = true;
    super.setSurveyImpl(value, isLight);
    this.initElement(this.getElement());
    this.isSettingValOnLoading = false;
  }
  public onSurveyLoad() {
    super.onSurveyLoad();
    if (!!this.getElement()) {
      this.getElement().onSurveyLoad();
      this.customQuestion.onLoaded(this);
    }
  }
  public afterRenderQuestionElement(el: HTMLElement) {
    //Do nothing
  }
  public afterRenderCore(el: any): void {
    super.afterRenderCore(el);
    if (!!this.customQuestion) {
      this.customQuestion.onAfterRender(this, el);
    }
  }
  protected onUpdateQuestionCssClasses(element: Question, css: any): void {
    if (!!this.customQuestion) {
      this.customQuestion.onUpdateQuestionCssClasses(this, element, css);
    }
  }
  protected setQuestionValue(newValue: any, updateIsAnswered: boolean = true) {
    super.setQuestionValue(newValue, updateIsAnswered);
    this.updateElementCss();
    if (!!this.customQuestion) {
      this.customQuestion.onSetQuestionValue(this, newValue);
    }
  }
  protected setNewValue(newValue: any) {
    super.setNewValue(newValue);
    this.updateElementCss();
  }
  protected onCheckForErrors(errors: Array<SurveyError>, isOnValueChanged: boolean, fireCallback: boolean): void {
    super.onCheckForErrors(errors, isOnValueChanged, fireCallback);
    if (!!this.customQuestion) {
      const text = this.customQuestion.onGetErrorText(this);
      if(!!text) {
        errors.push(new CustomError(text, this));
      }
    }
  }
  //ISurveyImpl
  getSurveyData(): ISurveyData {
    return this;
  }
  getTextProcessor(): ITextProcessor {
    return this.textProcessor;
  }
  //ISurveyData
  getValue(name: string): any {
    return this.value;
  }
  setValue(name: string, newValue: any, locNotification: any, allowNotifyValueChanged?: boolean): any {
    if (!this.data) return;
    if (!!this.customQuestion) {
      this.customQuestion.onValueChanged(this, name, newValue);
    }
    var newName = this.convertDataName(name);
    let valueForSurvey = this.convertDataValue(name, newValue);
    if(this.valueToDataCallback) {
      valueForSurvey = this.valueToDataCallback(valueForSurvey);
    }
    this.data.setValue(
      newName,
      valueForSurvey,
      locNotification,
      allowNotifyValueChanged
    );
    this.updateIsAnswered();
    this.updateElementCss();
  }
  protected getQuestionByName(name: string): IQuestion {
    return undefined;
  }
  protected isValueChanging(name: string, newValue: any): boolean {
    if (!!this.customQuestion) {
      const qValue = newValue;
      newValue = this.customQuestion.onValueChanging(this, name, newValue);
      if(!Helpers.isTwoValueEquals(newValue, qValue)) {
        const q = this.getQuestionByName(name);
        if(!!q) {
          q.value = newValue;
          return true;
        }
      }
    }
    return false;
  }
  protected convertDataName(name: string): string {
    return this.getValueName();
  }
  protected convertDataValue(name: string, newValue: any): any {
    return newValue;
  }
  getVariable(name: string): any {
    return !!this.data ? this.data.getVariable(name) : null;
  }
  setVariable(name: string, newValue: any): void {
    if (!this.data) return;
    this.data.setVariable(name, newValue);
  }
  getComment(name: string): string {
    return !!this.data ? this.data.getComment(this.getValueName()) : "";
  }
  setComment(name: string, newValue: string, locNotification: any): any {
    if (!this.data) return;
    this.data.setComment(this.getValueName(), newValue, locNotification);
  }
  getAllValues(): any {
    return !!this.data ? this.data.getAllValues() : {};
  }
  getFilteredValues(): any {
    return !!this.data ? this.data.getFilteredValues() : {};
  }
  getFilteredProperties(): any {
    return !!this.data ? this.data.getFilteredProperties() : {};
  }
  findQuestionByName(name: string): IQuestion {
    return !!this.data ? this.data.findQuestionByName(name): null;
  }
  getEditingSurveyElement(): Base {
    return undefined;
  }
  //IPanel
  addElement(element: IElement, index: number) { }
  removeElement(element: IElement): boolean {
    return false;
  }
  getQuestionTitleLocation(): string {
    return "left";
  }
  getQuestionTitleWidth(): string {
    return undefined;
  }
  getColumsForElement(el: IElement): Array<PanelLayoutColumnModel> {
    return [];
  }
  updateColumns() { }
  getQuestionStartIndex(): string {
    return this.getStartIndex();
  }
  getChildrenLayoutType(): string {
    return "row";
  }
  elementWidthChanged(el: IElement) { }
  get elements(): Array<IElement> {
    return [];
  }
  indexOf(el: IElement): number {
    return -1;
  }
  ensureRowsVisibility(): void {
    // do nothing
  }
  validateContainerOnly(): void {
    // do nothing
  }
  onQuestionValueChanged(el: IElement): void {
    // do nothing
  }
  getQuestionErrorLocation(): string {
    return this.getErrorLocation();
  }
  protected getContentDisplayValueCore(keyAsText: boolean, value: any, question: Question): any {
    if (!question) return super.getDisplayValueCore(keyAsText, value);
    return this.customQuestion.getDisplayValue(keyAsText, value, question);
  }
}

export class QuestionCustomModel extends QuestionCustomModelBase {
  private questionWrapper: Question;
  private hasJSONTitle: boolean;
  public getTemplate(): string {
    return "custom";
  }
  public getDynamicProperties(): Array<JsonObjectProperty> {
    return this.customQuestion.getDynamicProperties() || [];
  }
  public getDynamicType(): string {
    return this.questionWrapper ? this.questionWrapper.getType() : "question";
  }
  public getOriginalObj(): Base {
    return this.questionWrapper;
  }
  protected createWrapper(): void {
    this.questionWrapper = this.createQuestion();
    this.createDynamicProperties(this.questionWrapper);
    if(this.getDynamicProperties().length > 0) {
      this.questionWrapper.onPropertyValueChangedCallback = (name: string, oldValue: any, newValue: any, sender: Base, arrayChanges: ArrayChanges): void => {
        const prop = this.getDynamicProperty(name);
        if(prop) {
          this.propertyValueChanged(name, oldValue, newValue, arrayChanges);
        }
      };
    }
  }
  private getDynamicProperty(name: string): JsonObjectProperty {
    const props = this.getDynamicProperties();
    for(let i = 0; i < props.length; i ++) {
      if(props[i].name === name) return props[i];
    }
    return null;
  }
  protected getElement(): SurveyElement {
    return this.contentQuestion;
  }
  onAnyValueChanged(name: string, questionName: string): void {
    super.onAnyValueChanged(name, questionName);
    if (!!this.contentQuestion) {
      this.contentQuestion.onAnyValueChanged(name, questionName);
    }
  }
  protected getQuestionByName(name: string): IQuestion {
    return this.contentQuestion;
  }
  protected getDefaultTitle(): string {
    if(this.hasJSONTitle && this.contentQuestion) {
      return this.getProcessedText(this.contentQuestion.title);
    }
    return super.getDefaultTitle();
  }
  setValue(name: string, newValue: any, locNotification: any, allowNotifyValueChanged?: boolean): any {
    if(this.isValueChanging(name, newValue)) return;
    super.setValue(name, newValue, locNotification, allowNotifyValueChanged);
  }
  protected onSetData(): void {
    super.onSetData();
    if (!!this.survey && !this.isEmpty()) {
      this.setValue(this.name, this.value, false, this.allowNotifyValueChanged);
    }
  }
  public hasErrors(fireCallback: boolean = true, rec: any = null): boolean {
    if (!this.contentQuestion) return false;
    var res = this.contentQuestion.hasErrors(fireCallback, rec);
    this.errors = [];
    for (var i = 0; i < this.contentQuestion.errors.length; i++) {
      this.errors.push(this.contentQuestion.errors[i]);
    }
    if (!res) {
      res = super.hasErrors(fireCallback, rec);
    }
    this.updateElementCss();
    return res;
  }
  public focus(onError: boolean = false): void {
    if (!!this.contentQuestion) {
      this.contentQuestion.focus(onError);
    } else {
      super.focus(onError);
    }
  }
  public afterRenderCore(el: any): void {
    super.afterRenderCore(el);
    if (!!this.contentQuestion) {
      this.contentQuestion.afterRender(el);
    }
  }
  public get contentQuestion(): Question {
    return this.questionWrapper;
  }
  protected createQuestion(): Question {
    var json = this.customQuestion.json;
    var res: any = null;
    if (!!json.questionJSON) {
      this.hasJSONTitle = !!json.questionJSON.title;
      let qType = json.questionJSON.type;
      if (!qType || !Serializer.findClass(qType))
        throw "type attribute in questionJSON is empty or incorrect";
      res = <Question>Serializer.createClass(qType);
      res.fromJSON(json.questionJSON);
      res = this.checkCreatedQuestion(res);
    } else {
      if (!!json.createQuestion) {
        res = this.checkCreatedQuestion(json.createQuestion());
      }
    }
    this.initElement(res);
    if (!!res) {
      res.isContentElement = true;
      if (!res.name) {
        res.name = "question";
      }
      res.onUpdateCssClassesCallback = (css: any): void => {
        this.onUpdateQuestionCssClasses(res, css);
      };
      res.hasCssErrorCallback = (): boolean => this.errors.length > 0;
      res.setValueChangedDirectlyCallback = (val: boolean): void => { this.setValueChangedDirectly(val); };
    }

    return res;
  }
  private checkCreatedQuestion(res: Question): Question {
    if(!res) return res;
    if(!res.isQuestion) {
      if(Array.isArray(res.questions) && res.questions.length > 0) {
        res = res.questions[0];
      } else {
        res = Serializer.createClass("text");
      }
      ConsoleWarnings.error("Could not create component: '" + this.getType() + "'. questionJSON should be a question.");
    }
    return res;
  }
  public onSurveyLoad() {
    super.onSurveyLoad();
    if (!this.contentQuestion) return;
    if (this.isEmpty() && !this.contentQuestion.isEmpty()) {
      this.value = this.getContentQuestionValue();
    }
  }
  protected runConditionCore(values: HashTable<any>, properties: HashTable<any>): void {
    super.runConditionCore(values, properties);
    if (!!this.contentQuestion) {
      this.contentQuestion.runCondition(values, properties);
    }
  }
  protected convertDataName(name: string): string {
    const q = this.contentQuestion;
    if (!q || name === this.getValueName()) return super.convertDataName(name);
    var newName = name.replace(q.getValueName(), this.getValueName());
    return newName.indexOf(this.getValueName()) == 0
      ? newName
      : super.convertDataName(name);
  }
  protected convertDataValue(name: string, newValue: any): any {
    return this.convertDataName(name) == super.convertDataName(name)
      ? this.getContentQuestionValue()
      : newValue;
  }
  protected getContentQuestionValue(): any {
    if(!this.contentQuestion) return undefined;
    let val = this.contentQuestion.value;
    if(!!this.customQuestion) val = this.customQuestion.getValueFromQuestion(val);
    return val;
  }
  protected setContentQuestionValue(val: any): void {
    if(!this.contentQuestion) return;
    if(!!this.customQuestion) val = this.customQuestion.setValueToQuestion(val);
    this.contentQuestion.value = val;
  }
  protected canSetValueToSurvey(): boolean {
    return false;
  }
  protected setQuestionValue(newValue: any, updateIsAnswered: boolean = true) {
    super.setQuestionValue(newValue, updateIsAnswered);
    if (!this.isLoadingFromJson && !!this.contentQuestion &&
      !this.isTwoValueEquals(this.getContentQuestionValue(), newValue)
    ) {
      this.setContentQuestionValue(this.getUnbindValue(newValue));
    }
  }
  onSurveyValueChanged(newValue: any): void {
    super.onSurveyValueChanged(newValue);
    if (!!this.contentQuestion) {
      this.contentQuestion.onSurveyValueChanged(newValue);
    }
  }
  protected getValueCore(): any {
    if (!!this.contentQuestion) return this.getContentQuestionValue();
    return super.getValueCore();
  }
  private isSettingValueChanged: boolean;
  protected setValueChangedDirectly(val: boolean): void {
    if(this.isSettingValueChanged) return;
    this.isSettingValueChanged = true;
    super.setValueChangedDirectly(val);
    if(!!this.contentQuestion) {
      (<any>this.contentQuestion).setValueChangedDirectly(val);
    }
    this.isSettingValueChanged = false;
  }
  private createDynamicProperties(el: SurveyElement): void {
    if(!el) return;
    const props = this.getDynamicProperties();
    if(Array.isArray(props)) {
      Serializer.addDynamicPropertiesIntoObj(this, el, props);
    }
  }
  protected initElement(el: SurveyElement): void {
    super.initElement(el);
    if (!!el) {
      (<Question>el).parent = this;
      (<Question>el).afterRenderQuestionCallback = (
        question: Question,
        element: any
      ) => {
        if (!!this.customQuestion) {
          this.customQuestion.onAfterRenderContentElement(
            this,
            question,
            element
          );
        }
      };
    }
  }
  public updateElementCss(reNew?: boolean): void {
    if (!!this.contentQuestion) {
      this.questionWrapper.updateElementCss(reNew);
    }
    super.updateElementCss(reNew);
  }
  protected updateElementCssCore(cssClasses: any) {
    if (!!this.contentQuestion) {
      cssClasses = this.contentQuestion.cssClasses;
    }
    super.updateElementCssCore(cssClasses);
  }
  protected getDisplayValueCore(keyAsText: boolean, value: any): any {
    return super.getContentDisplayValueCore(keyAsText, value, this.contentQuestion);
  }
}

class QuestionCompositeTextProcessor extends QuestionTextProcessor {
  constructor(
    protected composite: QuestionCompositeModel,
    protected variableName: string
  ) {
    super(variableName);
  }
  protected get survey(): ISurvey {
    return this.composite.survey;
  }
  protected get panel(): PanelModel {
    return this.composite.contentPanel;
  }
}

export class QuestionCompositeModel extends QuestionCustomModelBase {
  public static ItemVariableName = "composite";
  private panelWrapper: PanelModel;
  private textProcessing: QuestionCompositeTextProcessor;
  constructor(name: string, public customQuestion: ComponentQuestionJSON) {
    super(name, customQuestion);
    this.textProcessing = new QuestionCompositeTextProcessor(
      this,
      QuestionCompositeModel.ItemVariableName
    );
  }
  protected createWrapper(): void {
    this.panelWrapper = this.createPanel();
  }
  public getTemplate(): string {
    return "composite";
  }
  protected getElement(): SurveyElement {
    return this.contentPanel;
  }
  protected getCssRoot(cssClasses: any): string {
    return new CssClassBuilder().append(super.getCssRoot(cssClasses)).append(cssClasses.composite).toString();
  }
  public get contentPanel(): PanelModel {
    return this.panelWrapper;
  }
  public hasErrors(fireCallback: boolean = true, rec: any = null): boolean {
    var res = super.hasErrors(fireCallback, rec);
    if (!this.contentPanel) return res;
    return this.contentPanel.hasErrors(fireCallback, false, rec) || res;
  }
  public updateElementCss(reNew?: boolean) {
    super.updateElementCss(reNew);
    if (this.contentPanel) {
      this.contentPanel.updateElementCss(reNew);
    }
  }
  public dispose(): void {
    this.unConnectEditingObj();
    super.dispose();
  }
  private editingObjValue: Base;
  private onEditingObjPropertyChanged: (sender: Base, options: any) => void;
  private updateEditingObj(): Base {
    const obj = this.data?.getEditingSurveyElement();
    if(!obj) return undefined;
    let newObj: Base = (<any>obj)[this.getValueName()];
    if(!!newObj && !newObj.onPropertyChanged) {
      newObj = undefined;
    }
    if(newObj !== this.editingObjValue) {
      this.unConnectEditingObj();
      this.editingObjValue = newObj;
      if(!!newObj) {
        this.onEditingObjPropertyChanged = (sender: Base, options: any): void => {
          this.setNewValueIntoQuestion(options.name, (<any>this.editingObjValue)[options.name]);
        };
        newObj.onPropertyChanged.add(this.onEditingObjPropertyChanged);
      }
    }

    return this.editingObjValue;
  }
  private unConnectEditingObj(): void {
    if(!!this.editingObjValue && !this.editingObjValue.isDisposed) {
      this.editingObjValue.onPropertyChanged.remove(this.onEditingObjPropertyChanged);
    }
  }
  getEditingSurveyElement(): Base {
    return this.editingObjValue;
  }
  getTextProcessor(): ITextProcessor {
    return this.textProcessing;
  }
  findQuestionByName(name: string): IQuestion {
    const res = this.getQuestionByName(name);
    if(!!res) return res;
    return super.findQuestionByName(name);
  }
  protected clearValueIfInvisibleCore(reason: string): void {
    super.clearValueIfInvisibleCore(reason);
    const questions = this.contentPanel.questions;
    for (var i = 0; i < questions.length; i++) {
      questions[i].clearValueIfInvisible(reason);
    }
  }
  onAnyValueChanged(name: string, questionName: string): void {
    super.onAnyValueChanged(name, questionName);
    var questions = this.contentPanel.questions;
    for (var i = 0; i < questions.length; i++) {
      questions[i].onAnyValueChanged(name, questionName);
    }
  }
  public get hasSingleInput(): boolean { return false; }
  public get isContainer(): boolean { return true; }
  protected createPanel(): PanelModel {
    var res = <PanelModel>Serializer.createClass("panel");
    res.showQuestionNumbers = "off";
    res.renderWidth = "100%";
    var json = this.customQuestion.json;
    if (!!json.elementsJSON) {
      res.fromJSON({ elements: json.elementsJSON });
    }
    if (!!json.createElements) {
      json.createElements(res, this);
    }
    this.initElement(res);
    res.readOnly = this.isReadOnly;
    res.questions.forEach(q => {
      q.setParentQuestion(this);
      q.onUpdateCssClassesCallback = (css: any): void => { this.onUpdateQuestionCssClasses(q, css); };
    });
    this.setAfterRenderCallbacks(res);
    return res;
  }
  protected onReadOnlyChanged() {
    if (!!this.contentPanel) {
      this.contentPanel.readOnly = this.isReadOnly;
    }
    super.onReadOnlyChanged();
  }
  updateValueFromSurvey(newValue: any, clearData: boolean = false): void {
    this.updateEditingObj();
    super.updateValueFromSurvey(newValue, clearData);
  }
  public onSurveyLoad(): void {
    this.isSettingValOnLoading = true;
    if (!!this.contentPanel) {
      this.contentPanel.readOnly = this.isReadOnly;
      this.setIsContentElement(this.contentPanel);
    }
    super.onSurveyLoad();
    if (!!this.contentPanel) {
      const val = this.getContentPanelValue();
      if (!Helpers.isValueEmpty(val)) {
        this.value = val;
      }
    }
    this.isSettingValOnLoading = false;
  }
  private setIsContentElement(panel: PanelModel) {
    panel.isContentElement = true;
    var elements = panel.elements;
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.isPanel) {
        this.setIsContentElement(<PanelModel>el);
      } else {
        (<Question>el).isContentElement = true;
      }
    }
  }
  public setVisibleIndex(val: number): number {
    var res = super.setVisibleIndex(val);
    if (this.isVisible && !!this.contentPanel) {
      res += this.contentPanel.setVisibleIndex(val);
    }
    return res;
  }
  protected runConditionCore(values: HashTable<any>, properties: HashTable<any>): void {
    super.runConditionCore(values, properties);
    if (!!this.contentPanel) {
      var oldComposite = values[QuestionCompositeModel.ItemVariableName];
      values[
        QuestionCompositeModel.ItemVariableName
      ] = this.contentPanel.getValue();
      this.contentPanel.runCondition(values, properties);
      delete values[QuestionCompositeModel.ItemVariableName];
      if (!!oldComposite) {
        values[QuestionCompositeModel.ItemVariableName] = oldComposite;
      }
    }
  }
  onSurveyValueChanged(newValue: any): void {
    super.onSurveyValueChanged(newValue);
    const val = !!newValue ? newValue : {};
    if (!!this.contentPanel) {
      this.contentPanel.questions.forEach(q => {
        q.onSurveyValueChanged(val[q.getValueName()]);
      });
    }
  }
  getValue(name: string): any {
    var val = this.value;
    return !!val ? val[name] : null;
  }
  protected getQuestionByName(name: string): IQuestion {
    return !!this.contentPanel ? this.contentPanel.getQuestionByName(name) : undefined;
  }
  private settingNewValue: boolean = false;
  setValue(name: string, newValue: any, locNotification: any, allowNotifyValueChanged?: boolean): any {
    if (this.settingNewValue) {
      this.setNewValueIntoQuestion(name, newValue);
      return;
    }
    if(this.isValueChanging(name, newValue)) return;
    this.settingNewValue = true;
    if (!this.isEditingSurveyElement && !!this.contentPanel) {
      let index = 0;
      const maxTimes = this.contentPanel.questions.length + 1;
      while(index < maxTimes && this.updateValueCoreWithPanelValue()) index ++;
    }
    this.setNewValueIntoQuestion(name, newValue);
    super.setValue(name, newValue, locNotification, allowNotifyValueChanged);
    this.settingNewValue = false;
    this.runPanelTriggers(QuestionCompositeModel.ItemVariableName + "." + name, newValue);
  }
  setComment(name: string, newValue: string, locNotification: any): any {
    let val = this.getUnbindValue(this.value);
    const commentName = this.getCommentName(name);
    if(!val && !newValue || !!newValue && !!val && val[commentName] === newValue) return;
    if(!!newValue) {
      if(!val) { val = {}; }
      val[commentName] = newValue;
    } else {
      delete val[commentName];
    }
    const q = <Question>this.getQuestionByName(name);
    if(!!q && q.comment !== newValue) {
      q.comment = newValue;
    }
    this.value = val;
  }
  getComment(name: string): string {
    const q = <Question>this.getQuestionByName(name);
    if(!!q) return q.comment;
    const val = this.value;
    return !!val && val[this.getCommentName(name)] || "";
  }
  private getCommentName(name: string): string {
    return name + settings.commentSuffix;
  }
  private runPanelTriggers(name: string, value: any): void {
    if(!!this.contentPanel) {
      this.contentPanel.questions.forEach(q => {
        q.runTriggers(name, value);
      });
    }
  }
  getFilteredValues(): any {
    const values = !!this.data ? this.data.getFilteredValues() : {};
    if (!!this.contentPanel) {
      values[
        QuestionCompositeModel.ItemVariableName
      ] = this.contentPanel.getValue();
    }
    return values;
  }
  private updateValueCoreWithPanelValue(): boolean {
    const panelValue = this.getContentPanelValue();
    if(this.isTwoValueEquals(this.getValueCore(), panelValue)) return false;
    this.setValueCore(panelValue);
    return true;
  }
  private getContentPanelValue(val?: any): any {
    if(!val) val = this.contentPanel.getValue();
    return this.customQuestion.setValueToQuestion(val);
  }
  private getValueForContentPanel(val: any): any {
    return this.customQuestion.getValueFromQuestion(val);
  }
  private setNewValueIntoQuestion(name: string, newValue: any): void {
    var q = this.getQuestionByName(name);
    if (!!q && !this.isTwoValueEquals(newValue, q.value)) {
      q.value = newValue;
    }
  }
  public addConditionObjectsByContext(
    objects: Array<IConditionObject>,
    context: any
  ): void {
    if (!this.contentPanel) return;
    var questions = this.contentPanel.questions;
    var prefixName = this.name;
    var prefixText = this.title;
    for (var i = 0; i < questions.length; i++) {
      objects.push({
        name: prefixName + "." + questions[i].name,
        text: prefixText + "." + questions[i].title,
        question: questions[i],
      });
    }
  }
  protected collectNestedQuestionsCore(questions: Question[], visibleOnly: boolean, includeNested: boolean): void {
    if (!this.contentPanel) return;
    this.contentPanel.questions.forEach(q => q.addNestedQuestion(questions, visibleOnly, includeNested));
  }
  protected convertDataValue(name: string, newValue: any): any {
    var val = !!this.contentPanel && !this.isEditingSurveyElement ?
      this.contentPanel.getValue() : this.getValueForContentPanel(this.value);
    if (!val) val = {};
    if(!val.getType) {
      val = Helpers.getUnbindValue(val);
    }
    if (this.isValueEmpty(newValue) && !this.isEditingSurveyElement) {
      delete val[name];
    } else {
      val[name] = newValue;
    }
    return this.getContentPanelValue(val);
  }
  protected setQuestionValue(newValue: any, updateIsAnswered: boolean = true): void {
    this.setValuesIntoQuestions(newValue);
    if (!this.isEditingSurveyElement && !!this.contentPanel) {
      newValue = this.getContentPanelValue();
    }
    super.setQuestionValue(newValue, updateIsAnswered);
  }
  private setValuesIntoQuestions(newValue: any): void {
    if(!this.contentPanel || this.settingNewValue) return;
    newValue = this.getValueForContentPanel(newValue);
    const oldSettingNewValue = this.settingNewValue;
    this.settingNewValue = true;
    const questions = this.contentPanel.questions;
    for (var i = 0; i < questions.length; i++) {
      const q = questions[i];
      const key = q.getValueName();
      const commentKey = this.getCommentName(key);
      const val = !!newValue ? newValue[key] : undefined;
      const commentVal = !!newValue && newValue[commentKey] || "";
      if(!this.isTwoValueEquals(q.value, val) && (val !== undefined || !q.isEmpty())) {
        q.value = val;
      }
      if(q.comment !== commentVal) {
        q.comment = commentVal;
      }
    }
    this.settingNewValue = oldSettingNewValue;
  }
  protected getDisplayValueCore(keyAsText: boolean, value: any): any {
    return super.getContentDisplayValueCore(keyAsText, value, <any>this.contentPanel);
  }
  private setAfterRenderCallbacks(panel: PanelModel) {
    if (!panel || !this.customQuestion) return;
    var questions = panel.questions;
    for (var i = 0; i < questions.length; i++) {
      questions[i].afterRenderQuestionCallback = (
        question: Question,
        element: any
      ) => {
        this.customQuestion.onAfterRenderContentElement(
          this,
          question,
          element
        );
      };
    }
  }
  public get ariaRole(): string {
    return "group";
  }
}
