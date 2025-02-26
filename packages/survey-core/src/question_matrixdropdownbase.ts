import { JsonObject, CustomPropertiesCollection, Serializer, property } from "./jsonobject";
import { QuestionMatrixBaseModel } from "./martixBase";
import { Question, IConditionObject, IQuestionPlainData } from "./question";
import { HashTable, Helpers } from "./helpers";
import { Base } from "./base";
import { IElement, IQuestion, ISurveyData, ISurvey, ISurveyImpl, ITextProcessor, IProgressInfo, IPanel, IPlainDataOptions } from "./base-interfaces";
import { SurveyElement } from "./survey-element";
import { TextPreProcessorValue, QuestionTextProcessor } from "./textPreProcessor";
import { ItemValue } from "./itemvalue";
import { QuestionFactory } from "./questionfactory";
import { ILocalizableOwner, LocalizableString } from "./localizablestring";
import { FunctionFactory } from "./functionsfactory";
import { PanelModel } from "./panel";
import { settings } from "./settings";
import { KeyDuplicationError } from "./error";
import { SurveyModel } from "./survey";
import { SurveyError } from "./survey-error";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { IMatrixColumnOwner, MatrixDropdownColumn } from "./question_matrixdropdowncolumn";
import { QuestionMatrixDropdownRenderedCell, QuestionMatrixDropdownRenderedRow, QuestionMatrixDropdownRenderedTable } from "./question_matrixdropdownrendered";
import { mergeValues } from "./utils/utils";
import { ConditionRunner } from "./conditions";

export interface IMatrixDropdownData {
  value: any;
  getFilteredData(): any;
  onRowChanged(
    row: MatrixDropdownRowModelBase,
    columnName: string,
    newRowValue: any,
    isDeletingValue: boolean
  ): void;
  onRowChanging(
    row: MatrixDropdownRowModelBase,
    columnName: string,
    rowValue: any
  ): any;
  isValidateOnValueChanging: boolean;
  getRowIndex(row: MatrixDropdownRowModelBase): number;
  getRowValue(rowIndex: number): any;
  checkIfValueInRowDuplicated(
    checkedRow: MatrixDropdownRowModelBase,
    cellQuestion: Question
  ): boolean;
  hasDetailPanel(row: MatrixDropdownRowModelBase): boolean;
  getIsDetailPanelShowing(row: MatrixDropdownRowModelBase): boolean;
  setIsDetailPanelShowing(row: MatrixDropdownRowModelBase, val: boolean): void;
  createRowDetailPanel(row: MatrixDropdownRowModelBase): PanelModel;
  validateCell(
    row: MatrixDropdownRowModelBase,
    columnName: string,
    rowValue: any
  ): SurveyError;
  columns: Array<MatrixDropdownColumn>;
  createQuestion(
    row: MatrixDropdownRowModelBase,
    column: MatrixDropdownColumn
  ): Question;
  choices: Array<ItemValue>;
  getLocale(): string;
  getMarkdownHtml(text: string, name: string): string;
  getRenderer(name: string): string;
  getRendererContext(locStr: LocalizableString): any;
  getProcessedText(text: string): string;
  getParentTextProcessor(): ITextProcessor;
  getSharedQuestionByName(
    columnName: string,
    row: MatrixDropdownRowModelBase
  ): Question;
  onTotalValueChanged(): any;
  getSurvey(): ISurvey;
  getDataFilteredValues(): any;
  isMatrixReadOnly(): boolean;
  onRowVisibilityChanged(row: MatrixDropdownRowModelBase): void;
}

export class MatrixDropdownCell {
  private questionValue: Question;
  constructor(
    public column: MatrixDropdownColumn,
    public row: MatrixDropdownRowModelBase,
    public data: IMatrixDropdownData
  ) {
    this.questionValue = this.createQuestion(column, row, data);
    this.questionValue.updateCustomWidget();
    this.updateCellQuestionTitleDueToAccessebility(row);
  }
  private updateCellQuestionTitleDueToAccessebility(row: MatrixDropdownRowModelBase): void {
    this.questionValue.locTitle.onGetTextCallback = (str: string): string => {
      const survey = row?.getSurvey();
      if (!survey || survey.isSingleVisibleInput) return this.questionValue.title;
      const rowTitle = row.getAccessbilityText();
      if (!rowTitle) return this.questionValue.title;
      return this.column.colOwner.getCellAriaLabel(rowTitle, this.questionValue.title);
    };
  }
  public locStrsChanged(): void {
    this.question.locStrsChanged();
  }
  protected createQuestion(
    column: MatrixDropdownColumn,
    row: MatrixDropdownRowModelBase,
    data: IMatrixDropdownData
  ): Question {
    const res = data.createQuestion(this.row, this.column);
    res.readOnlyCallback = (): boolean => !this.row.isRowEnabled();
    res.validateValueCallback = function () {
      return data.validateCell(row, column.name, row.value);
    };
    CustomPropertiesCollection.getProperties(column.getType()).forEach(
      (property) => {
        let propertyName = property.name;
        if ((<any>column)[propertyName] !== undefined) {
          res[propertyName] = (<any>column)[propertyName];
        }
      }
    );
    return res;
  }
  public get question(): Question {
    return this.questionValue;
  }
  public get value(): any {
    return this.question.value;
  }
  public set value(value: any) {
    this.question.value = value;
  }
  public getQuestionWrapperClassName(className: string): string {
    return className;
  }
  public runCondition(values: HashTable<any>, properties: HashTable<any>): void {
    this.question.runCondition(values, properties);
  }
}

export class MatrixDropdownTotalCell extends MatrixDropdownCell {
  constructor(
    public column: MatrixDropdownColumn,
    public row: MatrixDropdownRowModelBase,
    public data: IMatrixDropdownData
  ) {
    super(column, row, data);
    this.updateCellQuestion();
  }
  protected createQuestion(
    column: MatrixDropdownColumn,
    row: MatrixDropdownRowModelBase,
    data: IMatrixDropdownData
  ): Question {
    var res = <Question>Serializer.createClass("expression");
    res.setSurveyImpl(row);
    return res;
  }
  public locStrsChanged() {
    this.updateCellQuestion();
    super.locStrsChanged();
  }
  public updateCellQuestion() {
    this.question.locCalculation();
    this.column.updateCellQuestion(this.question, null, function (json) {
      delete json["defaultValue"];
    });
    this.question.expression = this.getTotalExpression();
    this.question.format = this.column.totalFormat;
    this.question.currency = this.column.totalCurrency;
    this.question.displayStyle = this.column.totalDisplayStyle;
    this.question.maximumFractionDigits = this.column.totalMaximumFractionDigits;
    this.question.minimumFractionDigits = this.column.totalMinimumFractionDigits;
    this.question.unlocCalculation();
    this.question.runIfReadOnly = true;
  }
  public getQuestionWrapperClassName(className: string): string {
    let result = super.getQuestionWrapperClassName(className);
    if (!result) {
      return result;
    }
    if (this.question.expression && this.question.expression != "''") {
      result += " " + className + "--expression";
    }
    let alignment = this.column.totalAlignment;
    if (alignment === "auto") {
      if (this.column.cellType === "dropdown") {
        alignment = "left";
      }
    }
    return result + " " + className + "--" + alignment;
  }
  public getTotalExpression(): string {
    if (!!this.column.totalExpression) return this.column.totalExpression;
    if (this.column.totalType == "none") return "''";
    var funName = this.column.totalType + "InArray";
    if (!FunctionFactory.Instance.hasFunction(funName)) return "";
    return funName + "({self}, '" + this.column.name + "')";
  }
}

class MatrixDropdownRowTextProcessor extends QuestionTextProcessor {
  constructor(
    protected row: MatrixDropdownRowModelBase,
    protected variableName: string,
    private parentTextProcessor: ITextProcessor
  ) {
    super(variableName);
  }
  protected getParentTextProcessor(): ITextProcessor { return this.parentTextProcessor; }
  protected get survey(): ISurvey {
    return this.row.getSurvey();
  }
  protected getValues(): any {
    return this.row.value;
  }
  protected getQuestionByName(name: string): Question {
    return this.row.getQuestionByName(name);
  }
  protected onCustomProcessText(textValue: TextPreProcessorValue): boolean {
    if (textValue.name == MatrixDropdownRowModelBase.IndexVariableName) {
      textValue.isExists = true;
      textValue.value = this.row.rowIndex;
      return true;
    }
    if ([MatrixDropdownRowModelBase.RowValueVariableName, MatrixDropdownRowModelBase.RowNameVariableName].indexOf(textValue.name) > -1) {
      textValue.isExists = true;
      textValue.value = this.row.rowName;
      return true;
    }
    return false;
  }
}

export class MatrixDropdownRowModelBase implements ISurveyData, ISurveyImpl, ILocalizableOwner {
  public static RowVariableName = "row";
  public static OwnerVariableName = "self";
  public static IndexVariableName = "rowIndex";
  public static RowValueVariableName = "rowValue";
  public static RowNameVariableName = "rowName";

  private static idCounter: number = 1;
  private static getId(): string {
    return "srow_" + MatrixDropdownRowModelBase.idCounter++;
  }
  protected data: IMatrixDropdownData;
  protected isSettingValue: boolean = false;
  private idValue: string;
  private textPreProcessor: MatrixDropdownRowTextProcessor;
  private detailPanelValue: PanelModel = null;
  private visibleValue: boolean = true;

  public cells: Array<MatrixDropdownCell> = [];
  public showHideDetailPanelClick: any;
  public onDetailPanelShowingChanged: () => void;
  public visibleIndex: number = -1;

  constructor(data: IMatrixDropdownData, value: any) {
    this.data = data;
    this.subscribeToChanges(value);
    this.textPreProcessor = new MatrixDropdownRowTextProcessor(
      this,
      MatrixDropdownRowModelBase.RowVariableName, !!data ? data.getParentTextProcessor() : null
    );
    this.showHideDetailPanelClick = () => {
      if (this.getSurvey().isDesignMode) return true;
      this.showHideDetailPanel();
    };
    this.idValue = MatrixDropdownRowModelBase.getId();
  }
  public get id(): string {
    return this.idValue;
  }
  public get rowName(): any {
    return null;
  }
  public get dataName(): string {
    return this.rowName;
  }
  public get text(): any {
    return this.rowName;
  }
  public isRowEnabled(): boolean { return true; }
  protected isRowHasEnabledCondition(): boolean { return false; }
  public get isVisible(): boolean { return this.visible && this.isItemVisible(); }
  public get visible(): boolean { return this.visibleValue; }
  public set visible(val: boolean) {
    if(this.visible !== val) {
      this.visibleValue = val;
      this.data?.onRowVisibilityChanged(this);
    }
  }
  protected isItemVisible(): boolean { return true; }
  public get value(): any {
    var result: any = {};
    var questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      if (!question.isEmpty()) {
        result[question.getValueName()] = question.value;
      }
      if (
        !!question.comment &&
        !!this.getSurvey() &&
        this.getSurvey().storeOthersAsComment
      ) {
        result[question.getValueName() + Base.commentSuffix] =
          question.comment;
      }
    }
    return result;
  }
  public set value(value: any) {
    this.isSettingValue = true;
    this.subscribeToChanges(value);
    var questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      var val = this.getCellValue(value, question.getValueName());
      var oldComment = question.comment;
      var comment = !!value
        ? value[question.getValueName() + Base.commentSuffix]
        : "";
      if (comment == undefined) comment = "";
      question.updateValueFromSurvey(val);
      if (!!comment || this.isTwoValueEquals(oldComment, question.comment)) {
        question.updateCommentFromSurvey(comment);
      }
      question.onSurveyValueChanged(val);
    }
    this.isSettingValue = false;
  }
  public get locText(): LocalizableString {
    return null;
  }
  public getAccessbilityText(): string {
    return this.locText && this.locText.renderedHtml;
  }
  public get hasPanel(): boolean {
    if (!this.data) return false;
    return this.data.hasDetailPanel(this);
  }
  public get detailPanel(): PanelModel {
    return this.detailPanelValue;
  }
  public get detailPanelId(): string {
    return !!this.detailPanel ? this.detailPanel.id : "";
  }
  public get isDetailPanelShowing(): boolean {
    return !!this.data ? this.data.getIsDetailPanelShowing(this) : false;
  }
  private setIsDetailPanelShowing(val: boolean) {
    if (!val && this.detailPanel) {
      this.detailPanel.onHidingContent();
    }
    if (!!this.data) {
      this.data.setIsDetailPanelShowing(this, val);
    }
    if (!!this.onDetailPanelShowingChanged) {
      this.onDetailPanelShowingChanged();
    }
  }
  private showHideDetailPanel() {
    if (this.isDetailPanelShowing) {
      this.hideDetailPanel();
    } else {
      this.showDetailPanel();
    }
  }
  private isCreatingDetailPanel = false;
  public showDetailPanel() {
    this.ensureDetailPanel();
    if (!this.detailPanelValue) return;
    this.setIsDetailPanelShowing(true);
  }
  public hideDetailPanel(destroyPanel: boolean = false) {
    this.setIsDetailPanelShowing(false);
    if (destroyPanel) {
      this.detailPanelValue = null;
    }
  }
  private ensureDetailPanel() {
    if (this.isCreatingDetailPanel) return;
    if (!!this.detailPanelValue || !this.hasPanel || !this.data) return;
    this.isCreatingDetailPanel = true;
    this.detailPanelValue = this.data.createRowDetailPanel(this);
    var questions = this.detailPanelValue.questions;
    var value = this.data.getRowValue(this.data.getRowIndex(this));
    if (!Helpers.isValueEmpty(value)) {
      for (var i = 0; i < questions.length; i++) {
        const key = questions[i].getValueName();
        const val = !!this.editingObj ? Serializer.getObjPropertyValue(this.editingObj, key) : value[key];
        if (!Helpers.isValueEmpty(val)) {
          questions[i].value = val;
        }
      }
    }
    this.detailPanelValue.setSurveyImpl(this);
    this.isCreatingDetailPanel = false;
  }
  getAllValues(): any {
    return this.value;
  }
  getFilteredValues(): any {
    const res = this.data ? this.data.getDataFilteredValues() : {};
    var values: any = this.validationValues;
    if (values) {
      for (var key in values) {
        res[key] = values[key];
      }
    }
    res.row = this.getAllValues();
    this.applyRowVariablesToValues(res, this.rowIndex);
    return res;
  }
  getFilteredProperties(): any {
    return { survey: this.getSurvey(), row: this };
  }
  private applyRowVariablesToValues(res: any, rowIndex: number): void {
    res[MatrixDropdownRowModelBase.IndexVariableName] = rowIndex;
    res[MatrixDropdownRowModelBase.RowValueVariableName] = this.rowName;
    res[MatrixDropdownRowModelBase.RowNameVariableName] = this.rowName;
  }
  public runCondition(values: HashTable<any>, properties: HashTable<any>, rowsVisibleIf?: string): void {
    if(!this.data) return;
    values[MatrixDropdownRowModelBase.OwnerVariableName] = this.data.getFilteredData();
    const rowIndex = this.rowIndex;
    this.applyRowVariablesToValues(values, rowIndex);
    const newProps = Helpers.createCopy(properties);
    newProps[MatrixDropdownRowModelBase.RowVariableName] = this;
    const rowValues = rowIndex > 0 ? this.data.getRowValue(this.rowIndex - 1) : this.value;
    if(!!rowsVisibleIf) {
      values[MatrixDropdownRowModelBase.RowVariableName] = rowValues;
      this.setRowsVisibleIfValues(values);
      this.visible = new ConditionRunner(rowsVisibleIf).run(values, properties);
    } else {
      this.visible = true;
    }
    for (var i = 0; i < this.cells.length; i++) {
      if (i > 0) {
        mergeValues(this.value, rowValues);
      }
      values[MatrixDropdownRowModelBase.RowVariableName] = rowValues;
      this.cells[i].runCondition(values, newProps);
    }
    if (!!this.detailPanel) {
      this.detailPanel.runCondition(values, newProps);
    }
    if(this.isRowHasEnabledCondition()) {
      this.onQuestionReadOnlyChanged();
    }
  }
  public updateElementVisibility(): void {
    this.cells.forEach(cell => cell.question.updateElementVisibility());
    if (!!this.detailPanel) {
      this.detailPanel.updateElementVisibility();
    }
  }
  protected setRowsVisibleIfValues(values: any): void {}
  public getNamesWithDefaultValues(): Array<string> {
    const res: Array<string> = [];
    this.questions.forEach(q => {
      if(q.isValueDefault) {
        res.push(q.getValueName());
      }
    });
    return res;
  }
  public clearValue(keepComment?: boolean): void {
    var questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      questions[i].clearValue(keepComment);
    }
  }
  public onAnyValueChanged(name: string, questionName: string): void {
    var questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      questions[i].onAnyValueChanged(name, questionName);
    }
  }
  public getDataValueCore(valuesHash: any, key: string): any {
    var survey = this.getSurvey();
    if (!!survey) {
      return (<any>survey).getDataValueCore(valuesHash, key);
    } else {
      return valuesHash[key];
    }
  }
  public getValue(name: string): any {
    var question = this.getQuestionByName(name);
    return !!question ? question.value : null;
  }
  public setValue(name: string, newColumnValue: any) {
    this.setValueCore(name, newColumnValue, false);
  }
  getVariable(name: string): any {
    return undefined;
  }
  setVariable(name: string, newValue: any) { }
  public getComment(name: string): string {
    var question = this.getQuestionByName(name);
    return !!question ? question.comment : "";
  }
  public setComment(name: string, newValue: string, locNotification: any) {
    this.setValueCore(name, newValue, true);
  }
  findQuestionByName(name: string): IQuestion {
    if (!name) return undefined;
    const prefix = MatrixDropdownRowModelBase.RowVariableName + ".";
    if (name.indexOf(prefix) === 0) {
      return this.getQuestionByName(name.substring(prefix.length));
    }
    const survey = this.getSurvey();
    return !!survey ? survey.getQuestionByName(name) : null;
  }
  getEditingSurveyElement(): Base { return undefined; }
  private setValueCore(name: string, newColumnValue: any, isComment: boolean) {
    if (this.isSettingValue) return;
    this.updateQuestionsValue(name, newColumnValue, isComment);
    if(!isComment) {
      this.updateSharedQuestionsValue(name, newColumnValue);
    }
    var newValue = this.value;
    var changedName = isComment ? name + Base.commentSuffix : name;
    var changedValue = newColumnValue;
    var changedQuestion = this.getQuestionByName(name);
    var changingValue = this.data.onRowChanging(this, changedName, newValue);
    if (
      !!changedQuestion &&
      !this.isTwoValueEquals(changingValue, changedValue)
    ) {
      this.isSettingValue = true;
      if (isComment) {
        changedQuestion.comment = changingValue;
      } else {
        changedQuestion.value = changingValue;
      }
      this.isSettingValue = false;
      newValue = this.value;
    }
    if (this.data.isValidateOnValueChanging && this.hasQuestonError(changedQuestion)) return;
    const isDeleting = newColumnValue == null && !changedQuestion ||
      isComment && !newColumnValue && !!changedQuestion;
    this.data.onRowChanged(this, changedName, newValue, isDeleting);
    if (changedName) {
      this.runTriggers(MatrixDropdownTotalRowModel.RowVariableName + "." + changedName, newValue);
    }
    this.onAnyValueChanged(MatrixDropdownRowModelBase.RowVariableName, "");
  }

  private updateQuestionsValue(
    name: string,
    newColumnValue: any,
    isComment: boolean
  ) {
    if (!this.detailPanel) return;
    var colQuestion = this.getQuestionByColumnName(name);
    var detailQuestion = this.detailPanel.getQuestionByName(name);
    if (!colQuestion || !detailQuestion) return;
    var isColQuestion = this.isTwoValueEquals(
      newColumnValue,
      isComment ? colQuestion.comment : colQuestion.value
    );
    var question = isColQuestion ? detailQuestion : colQuestion;
    this.isSettingValue = true;
    if (!isComment) {
      question.value = newColumnValue;
    } else {
      question.comment = newColumnValue;
    }
    this.isSettingValue = false;
  }
  private updateSharedQuestionsValue(name: string, value: any): void {
    const questions = this.getQuestionsByValueName(name);
    if(questions.length > 1) {
      for(let i = 0; i < questions.length; i ++) {
        if(!Helpers.isTwoValueEquals(questions[i].value, value)) {
          this.isSettingValue = true;
          questions[i].updateValueFromSurvey(value);
          this.isSettingValue = false;
        }
      }
    }
  }
  public runTriggers(name: string, value: any): void {
    if (!name) return;
    this.questions.forEach(q => q.runTriggers(name, value));
  }
  private hasQuestonError(question: Question): boolean {
    if (!question) return false;
    if (
      question.hasErrors(true, {
        isOnValueChanged: !this.data.isValidateOnValueChanging,
      })
    )
      return true;
    if (question.isEmpty()) return false;
    var cell = this.getCellByColumnName(question.name);
    if (!cell || !cell.column || !cell.column.isUnique) return false;
    return this.data.checkIfValueInRowDuplicated(this, question);
  }
  public get isEmpty() {
    var val = this.value;
    if (Helpers.isValueEmpty(val)) return true;
    for (var key in val) {
      if (val[key] !== undefined && val[key] !== null) return false;
    }
    return true;
  }
  public getQuestionByColumn(column: MatrixDropdownColumn): Question {
    var cell = this.getCellByColumn(column);
    return !!cell ? cell.question : null;
  }
  public getCellByColumn(column: MatrixDropdownColumn): MatrixDropdownCell {
    for (var i = 0; i < this.cells.length; i++) {
      if (this.cells[i].column == column) return this.cells[i];
    }
    return null;
  }
  private getCellByColumnName(columnName: string): MatrixDropdownCell {
    for (var i = 0; i < this.cells.length; i++) {
      if (this.cells[i].column.name == columnName) return this.cells[i];
    }
    return null;
  }
  public getQuestionByColumnName(columnName: string): Question {
    var cell = this.getCellByColumnName(columnName);
    return !!cell ? cell.question : null;
  }
  public get questions(): Array<Question> {
    var res: Array<Question> = [];
    for (var i = 0; i < this.cells.length; i++) {
      res.push(this.cells[i].question);
    }
    var detailQuestions = !!this.detailPanel ? this.detailPanel.questions : [];
    for (var i = 0; i < detailQuestions.length; i++) {
      res.push(detailQuestions[i]);
    }
    return res;
  }
  public get visibleQuestions(): Array<Question> {
    const res: Array<Question> = [];
    this.questions.forEach(q => {
      if (q.isVisible) {
        res.push(q);
      }
    });
    return res;
  }
  public getQuestionByName(name: string): Question {
    var res = this.getQuestionByColumnName(name);
    if (!!res) return res;
    return !!this.detailPanel ? this.detailPanel.getQuestionByName(name) : null;
  }
  public getQuestionsByName(name: string): Array<Question> {
    let res = [];
    let q = this.getQuestionByColumnName(name);
    if (!!q) res.push(q);
    if (!!this.detailPanel) {
      q = this.detailPanel.getQuestionByName(name);
      if (!!q) res.push(q);
    }
    return res;
  }
  public getQuestionsByValueName(name: string): Array<Question> {
    let res = [];
    for (var i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      if(cell.question && cell.question.getValueName() === name) {
        res.push(cell.question);
      }
    }
    if (!!this.detailPanel) {
      res = res.concat(this.detailPanel.getQuestionsByValueName(name));
    }
    return res;
  }
  protected getSharedQuestionByName(columnName: string): Question {
    return !!this.data
      ? this.data.getSharedQuestionByName(columnName, this)
      : null;
  }
  public clearIncorrectValues(val: any): void {
    for (var key in val) {
      var question = this.getQuestionByName(key);
      if (question) {
        var qVal = question.value;
        question.clearIncorrectValues();
        if (!this.isTwoValueEquals(qVal, question.value)) {
          this.setValue(key, question.value);
        }
      } else {
        if (
          !this.getSharedQuestionByName(key) &&
          key.indexOf(settings.matrix.totalsSuffix) < 0
        ) {
          this.setValue(key, null);
        }
      }
    }
  }
  public getLocale(): string {
    return this.data ? this.data.getLocale() : "";
  }
  public getMarkdownHtml(text: string, name: string): string {
    return this.data ? this.data.getMarkdownHtml(text, name) : undefined;
  }
  public getRenderer(name: string): string {
    return this.data ? this.data.getRenderer(name) : null;
  }
  public getRendererContext(locStr: LocalizableString): any {
    return this.data ? this.data.getRendererContext(locStr) : locStr;
  }
  public getProcessedText(text: string): string {
    return this.data ? this.data.getProcessedText(text) : text;
  }
  public locStrsChanged() {
    for (var i = 0; i < this.cells.length; i++) {
      this.cells[i].locStrsChanged();
    }
    if (!!this.detailPanel) {
      this.detailPanel.locStrsChanged();
    }
  }
  public updateCellQuestionOnColumnChanged(column: MatrixDropdownColumn, name: string, newValue: any): void {
    var cell = this.getCellByColumn(column);
    if (!cell) return;
    this.updateCellOnColumnChanged(cell, name, newValue);
  }
  public updateCellQuestionOnColumnItemValueChanged(
    column: MatrixDropdownColumn,
    propertyName: string,
    obj: ItemValue,
    name: string,
    newValue: any,
    oldValue: any
  ) {
    var cell = this.getCellByColumn(column);
    if (!cell) return;
    this.updateCellOnColumnItemValueChanged(
      cell,
      propertyName,
      obj,
      name,
      newValue,
      oldValue
    );
  }
  public onQuestionReadOnlyChanged() {
    const questions = this.questions;
    for (var i = 0; i < questions.length; i++) {
      const q = questions[i];
      q.setPropertyValue("isReadOnly", q.isReadOnly);
    }
    if (!!this.detailPanel) {
      const parentIsReadOnly = !!this.data && this.data.isMatrixReadOnly();
      this.detailPanel.readOnly = parentIsReadOnly || !this.isRowEnabled();
    }
  }
  private validationValues: any;
  public hasErrors(
    fireCallback: boolean,
    rec: any,
    raiseOnCompletedAsyncValidators: () => void
  ): boolean {
    var res = false;
    var cells = this.cells;
    if (!cells) return res;
    this.validationValues = rec.validationValues;
    for (var colIndex = 0; colIndex < cells.length; colIndex++) {
      if (!cells[colIndex]) continue;
      var question = cells[colIndex].question;
      if (!question || !question.visible) continue;
      question.onCompletedAsyncValidators = (hasErrors: boolean) => {
        raiseOnCompletedAsyncValidators();
      };
      if (!!rec && rec.isOnValueChanged === true && question.isEmpty())
        continue;
      res = question.hasErrors(fireCallback, rec) || res;
    }
    if (this.hasPanel) {
      this.ensureDetailPanel();
      var panelHasError = this.detailPanel.hasErrors(fireCallback, false, rec);
      if (!rec.hideErroredPanel && panelHasError && fireCallback) {
        if (rec.isSingleDetailPanel) {
          rec.hideErroredPanel = true;
        }
        this.showDetailPanel();
      }
      res = panelHasError || res;
    }
    this.validationValues = undefined;
    return res;
  }

  protected updateCellOnColumnChanged(cell: MatrixDropdownCell, name: string, newValue: any): void {
    if(name === "choices" && Array.isArray(newValue) && newValue.length === 0 && this.data) {
      newValue = this.data.choices;
    }
    cell.question[name] = newValue;
  }
  public updateCellOnColumnItemValueChanged(
    cell: MatrixDropdownCell,
    propertyName: string,
    obj: ItemValue,
    name: string,
    newValue: any,
    oldValue: any
  ) {
    var items = cell.question[propertyName];
    if (!Array.isArray(items)) return;
    var val = name === "value" ? oldValue : obj["value"];
    var item = ItemValue.getItemByValue(items, val);
    if (!item) return;
    item[name] = newValue;
  }
  protected buildCells(value: any) {
    this.isSettingValue = true;
    var columns = this.data.columns;
    for (var i = 0; i < columns.length; i++) {
      var column = columns[i];
      var cell = this.createCell(column);
      this.cells.push(cell);
      var cellValue = this.getCellValue(value, column.name);
      if (!Helpers.isValueEmpty(cellValue)) {
        cell.question.value = cellValue;
        var commentKey = column.name + Base.commentSuffix;
        if (!!value && !Helpers.isValueEmpty(value[commentKey])) {
          cell.question.comment = value[commentKey];
        }
      }
    }
    this.isSettingValue = false;
  }
  protected isTwoValueEquals(val1: any, val2: any): boolean {
    return Helpers.isTwoValueEquals(val1, val2, false, true, false);
  }
  private getCellValue(value: any, name: string): any {
    if (!!this.editingObj)
      return Serializer.getObjPropertyValue(this.editingObj, name);
    return !!value ? value[name] : undefined;
  }
  protected createCell(column: MatrixDropdownColumn): MatrixDropdownCell {
    return new MatrixDropdownCell(column, this, this.data);
  }
  getSurveyData(): ISurveyData {
    return this;
  }
  getSurvey(): ISurvey {
    return this.data ? this.data.getSurvey() : null;
  }
  getTextProcessor(): ITextProcessor {
    return this.textPreProcessor;
  }
  public get rowIndex(): number {
    return this.getRowIndex();
  }
  protected getRowIndex(): number {
    return !!this.data ? this.data.getRowIndex(this) + 1 : -1;
  }
  public get editingObj(): Base {
    return this.editingObjValue;
  }
  private onEditingObjPropertyChanged: (sender: Base, options: any) => void;
  private editingObjValue: Base;
  public dispose(): void {
    if (!!this.editingObj) {
      this.editingObj.onPropertyChanged.remove(
        this.onEditingObjPropertyChanged
      );
      this.editingObjValue = null;
    }
  }
  private subscribeToChanges(value: any) {
    if (!value || !value.getType || !value.onPropertyChanged) return;
    if (value === this.editingObj) return;
    this.editingObjValue = <Base>value;
    this.onEditingObjPropertyChanged = (sender: Base, options: any) => {
      this.updateOnSetValue(options.name, options.newValue);
    };
    this.editingObj.onPropertyChanged.add(this.onEditingObjPropertyChanged);
  }
  private updateOnSetValue(name: string, newValue: any) {
    this.isSettingValue = true;
    let questions = this.getQuestionsByName(name);
    for (let i = 0; i < questions.length; i++) {
      questions[i].value = newValue;
    }
    this.isSettingValue = false;
  }
}
export class MatrixDropdownTotalRowModel extends MatrixDropdownRowModelBase {
  constructor(data: IMatrixDropdownData) {
    super(data, null);
    this.buildCells(null);
  }
  protected createCell(column: MatrixDropdownColumn): MatrixDropdownCell {
    return new MatrixDropdownTotalCell(column, this, this.data);
  }
  public setValue(name: string, newValue: any) {
    if (!!this.data && !this.isSettingValue) {
      this.data.onTotalValueChanged();
    }
  }
  public runCondition(values: HashTable<any>, properties: HashTable<any>, rowsVisibleIf?: string): void {
    var counter = 0;
    var prevValue;
    do {
      prevValue = Helpers.getUnbindValue(this.value);
      super.runCondition(values, properties, "");
      counter++;
    } while (!Helpers.isTwoValueEquals(prevValue, this.value) && counter < 3);
  }
  protected updateCellOnColumnChanged(cell: MatrixDropdownCell, name: string, newValue: any): void {
    (<MatrixDropdownTotalCell>cell).updateCellQuestion();
  }
}

/**
 * A base class for the [QuestionMatrixDropdownModel](https://surveyjs.io/form-library/documentation/questionmatrixdropdownmodel) and [QuestionMatrixDynamicModel](https://surveyjs.io/form-library/documentation/questionmatrixdynamicmodel) classes.
 */
export class QuestionMatrixDropdownModelBase extends QuestionMatrixBaseModel<MatrixDropdownRowModelBase, MatrixDropdownColumn> implements IMatrixDropdownData, IMatrixColumnOwner {
  public static get defaultCellType() {
    return settings.matrix.defaultCellType;
  }
  public static set defaultCellType(val: string) {
    settings.matrix.defaultCellType = val;
  }
  public static addDefaultColumns(matrix: QuestionMatrixDropdownModelBase) {
    var colNames = QuestionFactory.DefaultColums;
    for (var i = 0; i < colNames.length; i++) matrix.addColumn(colNames[i]);
  }
  private detailPanelValue: PanelModel;
  private useCaseSensitiveComparisonValue: boolean;
  protected isRowChanging = false;
  columnsChangedCallback: () => void;
  onRenderedTableResetCallback: () => void;
  onRenderedTableCreatedCallback: (
    table: QuestionMatrixDropdownRenderedTable
  ) => void;
  onCellCreatedCallback: (options: any) => void;
  onCellValueChangedCallback: (options: any) => void;
  onHasDetailPanelCallback: (row: MatrixDropdownRowModelBase) => boolean;
  onCreateDetailPanelCallback: (
    row: MatrixDropdownRowModelBase,
    panel: PanelModel
  ) => void;
  onCreateDetailPanelRenderedRowCallback: (
    renderedRow: QuestionMatrixDropdownRenderedRow
  ) => void;
  onAddColumn: (column: MatrixDropdownColumn) => void;
  onRemoveColumn: (column: MatrixDropdownColumn) => void;
  cellValueChangingCallback: (row: any, columnName: string, value: any, oldValue: any) => any;

  protected createColumnValues() {
    return this.createNewArray(
      "columns",
      (item: any) => {
        item.colOwner = this;
        if (this.onAddColumn) this.onAddColumn(item);
        if (this.survey) {
          this.survey.matrixColumnAdded(this, item);
        }
      },
      (item: any) => {
        item.colOwner = null;
        if (this.onRemoveColumn) this.onRemoveColumn(item);
      }
    );
  }

  constructor(name: string) {
    super(name);
    this.createItemValues("choices");
    this.createLocalizableString("placeholder", this, false, true);
    this.createLocalizableString("keyDuplicationError", this, false, true);
    this.createLocalizableString("singleInputRowTitle", this, true, this.getSingleInputRowLocalizationTitle()).onGetTextCallback = (text: string) => {
      return this.processSingleInputTitle(text);
    };
    this.detailPanelValue = this.createNewDetailPanel();
    this.detailPanel.selectedElementInDesign = this;
    this.detailPanel.renderWidth = "100%";
    this.detailPanel.isInteractiveDesignElement = false;
    this.detailPanel.showTitle = false;
    this.registerPropertyChangedHandlers(["columns", "cellType"], () => { this.updateColumnsAndRows(); });
    this.registerPropertyChangedHandlers(
      ["placeholder", "columnColCount", "rowTitleWidth", "choices"],
      () => {
        this.clearRowsAndResetRenderedTable();
      }
    );
    this.registerPropertyChangedHandlers(
      [
        "transposeData",
        "addRowButtonLocation",
        "hideColumnsIfEmpty",
        "showHeader",
        "minRowCount",
        "isReadOnly",
        "rowCount",
        "hasFooter",
        "detailPanelMode",
        "displayMode"
      ],
      () => {
        this.resetRenderedTable();
      });
  }
  public getType(): string {
    return "matrixdropdownbase";
  }
  public dispose(): void {
    super.dispose();
    this.clearGeneratedRows();
  }
  public get hasSingleInput(): boolean { return false; }
  public get isContainer(): boolean { return true; }
  public get isRowsDynamic(): boolean {
    return false;
  }
  private isUpdating: boolean;
  protected get isUpdateLocked(): boolean {
    return this.isLoadingFromJson || this.isUpdating;
  }
  public beginUpdate(): void {
    this.isUpdating = true;
  }
  public endUpdate(): void {
    this.isUpdating = false;
    this.updateColumnsAndRows();
  }
  protected updateColumnsAndRows(): void {
    this.updateColumnsIndexes(this.columns);
    this.updateColumnsCellType();
    this.generatedTotalRow = null;
    this.clearRowsAndResetRenderedTable();
  }
  public itemValuePropertyChanged(
    item: ItemValue,
    name: string,
    oldValue: any,
    newValue: any
  ) {
    super.itemValuePropertyChanged(item, name, oldValue, newValue);
    if (item.ownerPropertyName === "choices") {
      this.clearRowsAndResetRenderedTable();
    }
  }
  /**
   * Specifies whether to display [`columns`](#columns) as rows and [`rows`](#rows) as columns.
   *
   * Default value: `false`
   *
   * [View Demo](https://surveyjs.io/form-library/examples/transpose-dynamic-rows-to-columns-in-matrix/ (linkStyle))
   */
  public get transposeData(): boolean {
    return this.getPropertyValue("transposeData");
  }
  public set transposeData(val: boolean) {
    this.setPropertyValue("transposeData", val);
  }
  /**
   * @deprecated Use the [`transposeData`](#transposeData) property instead.
   */
  public get columnLayout(): string {
    return this.transposeData ? "vertical" : "horizontal";
  }
  public set columnLayout(val: string) {
    this.transposeData = val === "vertical";
  }
  get columnsLocation(): string {
    return this.columnLayout;
  }
  set columnsLocation(val: string) {
    this.columnLayout = val;
  }
  /**
   * Specifies the error message position for questions within detail sections.
   *
   * Possible values:
   *
   * - `"default"` (default) - Inherits the setting from the [`errorLocation`](#errorLocation) property.
   * - `"top"` - Displays error messages above questions.
   * - `"bottom"` - Displays error messages below questions.
   * @see cellErrorLocation
   */
  public get detailErrorLocation(): string {
    return this.getPropertyValue("detailErrorLocation");
  }
  public set detailErrorLocation(value: string) {
    this.setPropertyValue("detailErrorLocation", value.toLowerCase());
  }
  /**
   * Specifies the error message position relative to matrix cells.
   *
   * Possible values:
   *
   * - `"default"` (default) - Inherits the setting from the [`errorLocation`](#errorLocation) property.
   * - `"top"` - Displays error messages above matrix cells.
   * - `"bottom"` - Displays error messages below matrix cells.
   * @see detailErrorLocation
   */
  public get cellErrorLocation(): string {
    return this.getPropertyValue("cellErrorLocation");
  }
  public set cellErrorLocation(value: string) {
    this.setPropertyValue("cellErrorLocation", value.toLowerCase());
  }
  public getChildErrorLocation(child: Question): string {
    const errLocation = !!child.parent ? this.detailErrorLocation : this.cellErrorLocation;
    if (errLocation !== "default") return errLocation;
    return super.getChildErrorLocation(child);
  }
  /**
   * Returns `true` if [`columns`](#columns) are placed in the horizontal direction and [`rows`](#columns) in the vertical direction.
   *
   * To specify the layout, use the [`transposeData`](#transposeData) property. If you set it to `true`, the survey applies it only when the screen has enough space. Otherwise, the survey falls back to the original layout, but the `transposeData` property remains set to `true`. Unlike `transposeData`, the `isColumnLayoutHorizontal` property always indicates the current layout.
   * @see transposeData
   */
  public get isColumnLayoutHorizontal(): boolean {
    return this.isMobile ? true : !this.transposeData;
  }
  /**
   * Enables case-sensitive comparison in columns with the `isUnique` property set to `true`.
   *
   * When this property is `true`, `"ABC"` and `"abc"` are considered different values.
   *
   * Default value: `false`
   * @see keyDuplicationError
   */
  public get useCaseSensitiveComparison(): boolean {
    return this.useCaseSensitiveComparisonValue !== undefined ? this.useCaseSensitiveComparisonValue : settings.comparator.caseSensitive;
  }
  public set useCaseSensitiveComparison(val: boolean) {
    this.useCaseSensitiveComparisonValue = val;
  }
  /**
   * @deprecated Use the [`useCaseSensitiveComparison`](#useCaseSensitiveComparison) property instead.
   */
  public get isUniqueCaseSensitive(): boolean {
    return this.useCaseSensitiveComparison;
  }
  public set isUniqueCaseSensitive(val: boolean) {
    this.useCaseSensitiveComparison = val;
  }
  /**
   * Specifies the location of detail sections.
   *
   * Possible values:
   *
   * - `"underRow"` - Displays detail sections under their respective rows. Users can expand any number of detail sections.
   * - `"underRowSingle"` - Displays detail sections under their respective rows, but only one detail section can be expanded at a time.
   * - `"none"` (default) - Hides detail sections.
   *
   * Use the `detailElements` property to specify content of detail sections.
   * @see detailElements
   * @see detailPanel
   */
  public get detailPanelMode(): string {
    return this.getPropertyValue("detailPanelMode");
  }
  public set detailPanelMode(val: string) {
    this.setPropertyValue("detailPanelMode", val);
  }
  /**
   * Contains a [`PanelModel`](https://surveyjs.io/form-library/documentation/panelmodel) instance that represents a detail section template.
   * @see detailElements
   * @see detailPanelMode
   */
  public get detailPanel(): PanelModel {
    return this.detailPanelValue;
  }
  public getPanel(): IPanel {
    return this.detailPanel;
  }
  /**
   * An array of survey elements (questions and panels) to be displayed in detail sections.
   *
   * Detail sections are expandable panels displayed under each matrix row. You can use them to display questions that do not fit into the row.
   *
   * Set the `detailPanelMode` property to `"underRow"` or `"underRowSingle"` to display detail sections.
   * @see detailPanelMode
   * @see detailPanel
   */
  public get detailElements(): Array<IElement> {
    return this.detailPanel.elements;
  }
  protected createNewDetailPanel(): PanelModel {
    return Serializer.createClass("panel");
  }
  public get hasRowText(): boolean {
    return true;
  }
  public getFooterText(): LocalizableString {
    return null;
  }
  public get canAddRow(): boolean {
    return false;
  }
  public get canRemoveRows(): boolean {
    return false;
  }
  public canRemoveRow(row: MatrixDropdownRowModelBase): boolean {
    return true;
  }
  public onPointerDown(pointerDownEvent: PointerEvent, row: MatrixDropdownRowModelBase): void { }
  protected onRowsChanged(): void {
    this.clearVisibleRows();
    this.resetRenderedTable();
    super.onRowsChanged();
    const rows = this.visibleRows;
    for(let i = 0; i < rows.length; i ++) {
      rows[i].visibleIndex = i;
    }
  }
  private lockResetRenderedTable: boolean = false;
  protected onStartRowAddingRemoving() {
    this.lockResetRenderedTable = true;
    this.setValueChangedDirectly(true);
  }
  protected onEndRowAdding() {
    this.lockResetRenderedTable = false;
    if (!this.renderedTable) return;
    if (this.renderedTable.isRequireReset()) {
      this.resetRenderedTable();
    } else {
      const index = this.visibleRows.length - 1;
      this.renderedTable.onAddedRow(this.visibleRows[index], index);
    }
  }
  protected onEndRowRemoving(row: MatrixDropdownRowModelBase) {
    this.lockResetRenderedTable = false;
    if (this.renderedTable.isRequireReset()) {
      this.resetRenderedTable();
    } else {
      if (!!row) {
        this.renderedTable.onRemovedRow(row);
      }
    }
  }
  private get renderedTableValue(): QuestionMatrixDropdownRenderedTable {
    return this.getPropertyValue("renderedTable", null);
  }
  private set renderedTableValue(val: QuestionMatrixDropdownRenderedTable) {
    this.setPropertyValue("renderedTable", val);
  }
  protected clearRowsAndResetRenderedTable() {
    this.clearGeneratedRows();
    this.resetRenderedTable();
    this.fireCallback(this.columnsChangedCallback);
  }
  //For internal use
  public resetRenderedTable(): void {
    if (this.lockResetRenderedTable || this.isUpdateLocked) return;
    this.renderedTableValue = null;
    this.fireCallback(this.onRenderedTableResetCallback);
  }
  protected clearGeneratedRows(): void {
    this.clearVisibleRows();
    if (!this.generatedVisibleRows) return;
    for (var i = 0; i < this.generatedVisibleRows.length; i++) {
      this.generatedVisibleRows[i].dispose();
    }
    super.clearGeneratedRows();
  }
  protected get isRendredTableCreated(): boolean {
    return !!this.renderedTableValue;
  }
  public get renderedTable(): QuestionMatrixDropdownRenderedTable {
    if (!this.renderedTableValue) {
      this.renderedTableValue = this.createRenderedTable();
      if (!!this.onRenderedTableCreatedCallback) {
        this.onRenderedTableCreatedCallback(this.renderedTableValue);
      }
    }
    return this.renderedTableValue;
  }
  protected createRenderedTable(): QuestionMatrixDropdownRenderedTable {
    return new QuestionMatrixDropdownRenderedTable(this);
  }
  protected getRowByQuestion(question: Question): MatrixDropdownRowModelBase {
    if(!question) return undefined;
    return <MatrixDropdownRowModelBase>question.data;
  }
  protected onMatrixRowCreated(row: MatrixDropdownRowModelBase): void {
    if (!this.survey) return;
    var options = {
      rowValue: row.value,
      row: row,
      column: <any>null,
      columnName: <any>null,
      cell: <any>null,
      cellQuestion: <any>null,
      value: <any>null,
    };
    for (var i = 0; i < this.columns.length; i++) {
      options.column = this.columns[i];
      options.columnName = options.column.name;
      var cell = row.cells[i];
      options.cell = cell;
      options.cellQuestion = cell.question;
      options.value = cell.value;
      if (!!this.onCellCreatedCallback) {
        this.onCellCreatedCallback(options);
      }
      this.survey.matrixCellCreated(this, options);
    }
  }
  /**
   * Specifies the type of matrix cells. You can override this property for individual columns.
   *
   * Possible values:
   *
   * - [`"dropdown"`](https://surveyjs.io/form-library/documentation/api-reference/dropdown-menu-model)
   * - [`"checkbox"`](https://surveyjs.io/form-library/documentation/api-reference/checkbox-question-model)
   * - [`"radiogroup"`](https://surveyjs.io/form-library/documentation/api-reference/radio-button-question-model)
   * - [`"tagbox"`](https://surveyjs.io/form-library/documentation/api-reference/dropdown-tag-box-model)
   * - [`"text"`](https://surveyjs.io/form-library/documentation/api-reference/text-entry-question-model)
   * - [`"comment"`](https://surveyjs.io/form-library/documentation/api-reference/comment-field-model)
   * - [`"boolean"`](https://surveyjs.io/form-library/documentation/api-reference/boolean-question-model)
   * - [`"expression"`](https://surveyjs.io/form-library/documentation/api-reference/expression-model)
   * - [`"rating"`](https://surveyjs.io/form-library/documentation/api-reference/rating-scale-question-model)
   *
   * Default value: `"dropdown"` (inherited from [`settings.matrix.defaultCellType`](https://surveyjs.io/form-library/documentation/settings#matrixDefaultCellType))
   */
  public get cellType(): string {
    return this.getPropertyValue("cellType", settings.matrix.defaultCellType);
  }
  public set cellType(val: string) {
    val = val.toLowerCase();
    this.setPropertyValue("cellType", val);
  }
  isSelectCellType(): boolean {
    return Serializer.isDescendantOf(this.cellType, "selectbase");
  }
  private updateColumnsCellType() {
    for (var i = 0; i < this.columns.length; i++) {
      this.columns[i].defaultCellTypeChanged();
    }
  }
  private updateColumnsIndexes(cols: Array<MatrixDropdownColumn>) {
    for (var i = 0; i < cols.length; i++) {
      cols[i].setIndex(i);
    }
  }
  /**
   * Specifies the number of columns in Radiogroup and Checkbox cells.
   *
   * Default value: 0 (the number of columns is selected automatically based on the available column width)
   * @see cellType
   */
  public get columnColCount(): number {
    return this.getPropertyValue("columnColCount");
  }
  public set columnColCount(value: number) {
    if (value < 0 || value > 4) return;
    this.setPropertyValue("columnColCount", value);
  }
  public get horizontalScroll(): boolean {
    return this.getPropertyValue("horizontalScroll");
  }
  public set horizontalScroll(val: boolean) {
    this.setPropertyValue("horizontalScroll", val);
  }
  public get allowAdaptiveActions(): boolean {
    return this.getPropertyValue("allowAdaptiveActions");
  }
  public set allowAdaptiveActions(val: boolean) {
    this.setPropertyValue("allowAdaptiveActions", val);
    if (!!this.detailPanel) {
      this.detailPanel.allowAdaptiveActions = val;
    }
  }
  public hasChoices(): boolean {
    return this.choices.length > 0;
  }
  onColumnPropertyChanged(column: MatrixDropdownColumn, name: string, newValue: any): void {
    this.updateHasFooter();
    if (!this.generatedVisibleRows) return;
    for (var i = 0; i < this.generatedVisibleRows.length; i++) {
      this.generatedVisibleRows[i].updateCellQuestionOnColumnChanged(
        column,
        name,
        newValue
      );
    }
    if (!!this.generatedTotalRow) {
      this.generatedTotalRow.updateCellQuestionOnColumnChanged(
        column,
        name,
        newValue
      );
    }
    this.onColumnsChanged();
    if (name == "isRequired") {
      this.resetRenderedTable();
    }
  }
  onColumnItemValuePropertyChanged(column: MatrixDropdownColumn, propertyName: string,
    obj: ItemValue, name: string, newValue: any, oldValue: any): void {
    if (!this.generatedVisibleRows) return;
    for (var i = 0; i < this.generatedVisibleRows.length; i++) {
      this.generatedVisibleRows[i].updateCellQuestionOnColumnItemValueChanged(
        column,
        propertyName,
        obj,
        name,
        newValue,
        oldValue
      );
    }
  }

  onShowInMultipleColumnsChanged(column: MatrixDropdownColumn): void {
    this.resetTableAndRows();
  }
  onColumnVisibilityChanged(column: MatrixDropdownColumn): void {
    this.resetTableAndRows();
  }
  onColumnCellTypeChanged(column: MatrixDropdownColumn): void {
    this.resetTableAndRows();
  }
  private resetTableAndRows(): void {
    this.clearGeneratedRows();
    this.resetRenderedTable();
  }
  public getRowTitleWidth(): string {
    return "";
  }
  public get hasFooter(): boolean {
    return this.getPropertyValue("hasFooter", false);
  }
  public getAddRowLocation(): string {
    return "default";
  }
  public getShowColumnsIfEmpty(): boolean {
    return false;
  }
  protected updateShowTableAndAddRow() {
    if (!!this.renderedTable) {
      this.renderedTable.updateShowTableAndAddRow();
    }
  }
  protected updateHasFooter() {
    this.setPropertyValue("hasFooter", this.hasTotal);
  }
  public get hasTotal(): boolean {
    for (var i = 0; i < this.columns.length; i++) {
      if (this.columns[i].hasTotal) return true;
    }
    return false;
  }
  getCellType(): string {
    return this.cellType;
  }
  getCustomCellType(column: MatrixDropdownColumn, row: MatrixDropdownRowModelBase, cellType: string): string {
    if (!this.survey) return cellType;
    var options = {
      rowValue: row.value,
      row: row,
      column: column,
      columnName: column.name,
      cellType: cellType
    };
    this.survey.matrixCellCreating(this, options);
    return options.cellType;
  }
  public getConditionJson(operator: string = null, path: string = null): any {
    if (!path) return super.getConditionJson(operator);
    let columnName = "";
    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i] == ".") break;
      columnName = path[i] + columnName;
    }
    let question = undefined;
    let column = this.getColumnByName(columnName);
    if (!!column) {
      question = column.createCellQuestion(null);
    } else {
      if(this.detailPanelMode !== "none") {
        question = this.detailPanel.getQuestionByName(columnName);
      }
    }
    return !!question ? question.getConditionJson(operator) : null;
  }
  public clearIncorrectValues(): void {
    if (!Array.isArray(this.visibleRows)) return;
    const rows = this.generatedVisibleRows;
    for (let i = 0; i < rows.length; i++) {
      rows[i].clearIncorrectValues(this.getRowValue(i));
    }
  }
  public clearErrors(): void {
    super.clearErrors();
    this.runFuncForCellQuestions((q: Question) => { q.clearErrors(); });
  }
  public localeChanged(): void {
    super.localeChanged();
    this.runFuncForCellQuestions((q: Question) => { q.localeChanged(); });
  }
  private runFuncForCellQuestions(func: (question: Question) => void): void {
    if (!!this.generatedVisibleRows) {
      for (var i = 0; i < this.generatedVisibleRows.length; i++) {
        var row = this.generatedVisibleRows[i];
        for (var j = 0; j < row.cells.length; j++) {
          func(row.cells[j].question);
        }
      }
    }
  }
  protected runConditionCore(values: HashTable<any>, properties: HashTable<any>): void {
    const oldRowVariables = values[MatrixDropdownRowModelBase.RowVariableName];
    super.runConditionCore(values, properties);
    var counter = 0;
    var prevTotalValue;
    do {
      prevTotalValue = Helpers.getUnbindValue(this.totalValue);
      this.runCellsCondition(values, properties);
      this.runTotalsCondition(values, properties);
      counter++;
    } while (
      !Helpers.isTwoValueEquals(prevTotalValue, this.totalValue) &&
      counter < 3
    );
    this.updateVisibilityBasedOnRows();
    values[MatrixDropdownRowModelBase.RowVariableName] = oldRowVariables;
  }
  public runTriggers(name: string, value: any, keys?: any): void {
    super.runTriggers(name, value, keys);
    this.runFuncForCellQuestions((q: Question) => { q.runTriggers(name, value, keys); });
  }
  public updateElementVisibility(): void {
    super.updateElementVisibility();
    const rows = this.generatedVisibleRows;
    if (!!rows) {
      rows.forEach(row => row.updateElementVisibility());
    }
  }
  protected shouldRunColumnExpression(): boolean {
    return false;
  }
  protected runCellsCondition(values: HashTable<any>, properties: HashTable<any>): void {
    if(this.isDesignMode) return;
    const rows = this.generatedVisibleRows;
    if (!!rows) {
      const newValues = this.getRowConditionValues(values);
      for (var i = 0; i < rows.length; i++) {
        rows[i].runCondition(newValues, properties, this.rowsVisibleIf);
      }
    }
    this.checkColumnsVisibility();
    this.checkColumnsRenderedRequired();
  }
  protected runConditionsForColumns(values: HashTable<any>, properties: HashTable<any>): boolean {
    this.columns.forEach(column => {
      if(!this.columnsVisibleIf) {
        column.isColumnsVisibleIf = true;
      } else {
        const condition = new ConditionRunner(this.columnsVisibleIf);
        values["item"] = column.name;
        column.isColumnsVisibleIf = condition.run(values, properties) === true;
      }
    });
    return false;
  }
  private checkColumnsVisibility(): void {
    if (this.isDesignMode) return;
    var hasChanged = false;
    for (var i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];
      const isCellsVisibilty = !!column.visibleIf || column.isFilteredMultipleColumns;
      if (!isCellsVisibilty && !this.columnsVisibleIf && column.isColumnVisible) continue;
      hasChanged = this.isColumnVisibilityChanged(column, isCellsVisibilty) || hasChanged;
    }
    if (hasChanged) {
      this.resetRenderedTable();
    }
  }
  private checkColumnsRenderedRequired(): void {
    const rows = this.generatedVisibleRows;
    if(!rows) return;
    for (var i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];
      if (!column.requiredIf || !column.isColumnVisible) continue;
      let required = rows.length > 0;
      for (var j = 0; j < rows.length; j++) {
        if (!rows[j].cells[i].question.isRequired) {
          required = false;
          break;
        }
      }
      column.updateIsRenderedRequired(required);
    }
  }
  private isColumnVisibilityChanged(column: MatrixDropdownColumn, checkCellsVisiblity: boolean): boolean {
    const curVis = column.isColumnVisible;
    let hasVisCell = !checkCellsVisiblity;
    const rows = this.generatedVisibleRows;
    const checkRows = checkCellsVisiblity && rows;
    const isMultipleColumnsVisibility = checkRows && column.isFilteredMultipleColumns;
    const curVisibleChoices = isMultipleColumnsVisibility ? column.getVisibleChoicesInCell : [];
    const newVisibleChoices = new Array<any>();
    if(checkRows) {
      for (let i = 0; i < rows.length; i++) {
        const cell = rows[i].cells[column.index];
        const q = cell?.question;
        if (!!q && q.isVisible) {
          hasVisCell = true;
          if (isMultipleColumnsVisibility) {
            this.updateNewVisibleChoices(q, newVisibleChoices);
          } else break;
        }
      }
    }
    column.hasVisibleCell = hasVisCell && column.isColumnsVisibleIf;
    if (isMultipleColumnsVisibility) {
      column.setVisibleChoicesInCell(newVisibleChoices);
      if (!Helpers.isArraysEqual(curVisibleChoices, newVisibleChoices, true, false, false)) return true;
    }
    return curVis !== column.isColumnVisible;
  }
  private updateNewVisibleChoices(q: Question, dest: Array<any>): void {
    const choices = q.visibleChoices;
    if (!Array.isArray(choices)) return;
    for (let i = 0; i < choices.length; i++) {
      const ch = choices[i];
      if (dest.indexOf(ch.value) < 0) dest.push(ch.value);
    }
  }
  protected runTotalsCondition(
    values: HashTable<any>,
    properties: HashTable<any>
  ): void {
    if (!this.generatedTotalRow) return;
    this.generatedTotalRow.runCondition(this.getRowConditionValues(values), properties);
  }
  private getRowConditionValues(values: HashTable<any>): HashTable<any> {
    var newValues = values;
    if (!newValues) newValues = {};
    /*
    var newValues: { [index: string]: any } = {};
    if (values && values instanceof Object) {
      newValues = JSON.parse(JSON.stringify(values));
    }
    */
    var totalRow = {};
    if (!this.isValueEmpty(this.totalValue)) {
      totalRow = JSON.parse(JSON.stringify(this.totalValue));
    }
    newValues["row"] = {};
    newValues["totalRow"] = totalRow;
    return newValues;
  }

  public IsMultiplyColumn(column: MatrixDropdownColumn): boolean {
    return column.isShowInMultipleColumns && !this.isMobile;
  }

  public locStrsChanged() {
    super.locStrsChanged();
    var columns = this.columns;
    for (var i = 0; i < columns.length; i++) {
      columns[i].locStrsChanged();
    }
    var rows = this.generatedVisibleRows;
    if (!rows) return;
    for (var i = 0; i < rows.length; i++) {
      rows[i].locStrsChanged();
    }
    if (!!this.generatedTotalRow) {
      this.generatedTotalRow.locStrsChanged();
    }
  }
  /**
   * Returns a matrix column with a given `name` or `null` if a column with this is not found.
   * @param columnName A column name.
   */
  public getColumnByName(columnName: string): MatrixDropdownColumn {
    for (var i = 0; i < this.columns.length; i++) {
      if (this.columns[i].name == columnName) return this.columns[i];
    }
    return null;
  }
  getColumnName(columnName: string): MatrixDropdownColumn {
    return this.getColumnByName(columnName);
  }
  public getColumnWidth(column: MatrixDropdownColumn): string {
    return column.minWidth ? column.minWidth : this.columnMinWidth ? this.columnMinWidth : (settings.matrix.columnWidthsByType[column.cellType]?.minWidth || "");
  }
  /**
   * Gets or sets choice items for Dropdown, Checkbox, and Radiogroup matrix cells. You can override this property for individual columns.
   *
   * This property accepts an array of objects with the following structure:
   *
   * ```js
   * {
   *   "value": any, // A value to be saved in survey results
   *   "text": String, // A display text. This property supports Markdown. When `text` is undefined, `value` is used.
   *   "customProperty": any // Any property that you find useful.
   * }
   * ```
   *
   * To enable Markdown support for the `text` property, implement Markdown-to-HTML conversion in the [onTextMarkdown](https://surveyjs.io/form-library/documentation/api-reference/survey-data-model#onTextMarkdown) event handler. For an example, refer to the following demo: [Convert Markdown to HTML with markdown-it](https://surveyjs.io/form-library/examples/edit-survey-questions-markdown/).
   *
   * If you add custom properties, refer to the following help topic to learn how to serialize them into JSON: [Add Custom Properties to Property Grid](https://surveyjs.io/survey-creator/documentation/property-grid#add-custom-properties-to-the-property-grid).
   *
   * If you need to specify only the `value` property, you can set the `choices` property to an array of primitive values, for example, `[ "item1", "item2", "item3" ]`. These values are both saved in survey results and used as display text.
   * @see cellType
   */
  public get choices(): Array<any> {
    return this.getPropertyValue("choices");
  }
  public set choices(val: Array<any>) {
    this.setPropertyValue("choices", val);
  }
  /**
   * A placeholder for Dropdown matrix cells.
   * @see cellType
   */
  public get placeholder() {
    return this.getLocalizableStringText("placeholder");
  }
  public set placeholder(val: string) {
    this.setLocalizableStringText("placeholder", val);
  }
  public get locPlaceholder() {
    return this.getLocalizableString("placeholder");
  }
  public get optionsCaption() {
    return this.placeholder;
  }
  public set optionsCaption(val: string) {
    this.placeholder = val;
  }
  /**
   * An error message displayed when users enter a duplicate value into a column that accepts only unique values (`isUnique` is set to `true` or `keyName` is specified).
   *
   * A default value for this property is taken from a [localization dictionary](https://github.com/surveyjs/survey-library/tree/01bd8abd0c574719956d4d579d48c8010cd389d4/packages/survey-core/src/localization). Refer to the following help topic for more information: [Localization & Globalization](https://surveyjs.io/form-library/documentation/localization).
   * @see useCaseSensitiveComparison
   */
  public get keyDuplicationError(): string {
    return this.getLocalizableStringText("keyDuplicationError");
  }
  public set keyDuplicationError(val: string) {
    this.setLocalizableStringText("keyDuplicationError", val);
  }
  get locKeyDuplicationError(): LocalizableString {
    return this.getLocalizableString("keyDuplicationError");
  }
  public get singleInputRowTitle(): string {
    return this.getLocalizableStringText("singleInputRowTitle");
  }
  public set singleInputRowTitle(val: string) {
    this.setLocalizableStringText("singleInputRowTitle", val);
  }
  get locSingleInputRowTitle(): LocalizableString {
    return this.getLocalizableString("singleInputRowTitle");
  }
  protected getSingleQuestionLocTitleCore(): LocalizableString {
    return this.locSingleInputRowTitle;
  }
  protected getSingleInputRowLocalizationTitle(): string { return ""; }
  protected processSingleInputTitle(text: string): string {
    const row = this.getRowByQuestion(this.singleInputQuestion);
    if(row) {
      return row.getTextProcessor().processText(text, true);
    }
    return "";
  }
  protected singleInputMoveToFirstCore(): void {
    const data: any = this.singleInputQuestion?.data;
    this.singleInputEditRow(data);
  }
  protected singleInputEditRow(row: MatrixDropdownRowModelBase): void {
    if(!row) return;
    const qs = row.visibleQuestions;
    if(Array.isArray(qs) && qs.length > 0) {
      this.setSingleInputQuestion(qs[0]);
    }
  }
  public get storeOthersAsComment(): boolean {
    return !!this.survey ? this.survey.storeOthersAsComment : false;
  }
  public addColumn(name: string, title?: string): MatrixDropdownColumn {
    var column = new MatrixDropdownColumn(name, title, this);
    this.columns.push(column);
    return column;
  }
  private visibleRowsArray: Array<MatrixDropdownRowModelBase>;
  protected clearVisibleRows(): void {
    this.visibleRowsArray = null;
  }
  protected isColumnVisible(column: any): boolean {
    return column.isColumnVisible;
  }
  private isGenereatingRows: boolean;
  protected getVisibleRows(): Array<MatrixDropdownRowModelBase> {
    if (this.isUpdateLocked) return null;
    if(this.isGenereatingRows) return [];
    if(!!this.visibleRowsArray) return this.visibleRowsArray;
    this.generateVisibleRowsIfNeeded();
    this.visibleRowsArray = this.getVisibleFromGenerated(this.generatedVisibleRows);
    return this.visibleRowsArray;
  }
  private generateVisibleRowsIfNeeded(): void {
    if (!this.isUpdateLocked && !this.generatedVisibleRows) {
      this.isGenereatingRows = true;
      this.generatedVisibleRows = this.generateRows();
      this.isGenereatingRows = false;
      for(var i = 0; i < this.generatedVisibleRows.length; i++) {
        const row = this.generatedVisibleRows[i];
        row.visibleIndex = i;
        this.onMatrixRowCreated(row);
      }
      if (this.data) {
        this.runCellsCondition(
          this.data.getFilteredValues(),
          this.data.getFilteredProperties()
        );
      }
      if(!!this.generatedVisibleRows) {
        this.updateValueOnRowsGeneration(this.generatedVisibleRows);
        this.updateIsAnswered();
      }
    }
  }
  private getVisibleFromGenerated(rows: Array<MatrixDropdownRowModelBase>): Array<MatrixDropdownRowModelBase> {
    const res: Array<MatrixDropdownRowModelBase> = [];
    if(!rows) return res;
    rows.forEach(row => { if(row.isVisible) res.push(row); });
    return res.length === rows.length ? rows : res;
  }
  private updateValueOnRowsGeneration(rows: Array<MatrixDropdownRowModelBase>) {
    var oldValue = this.createNewValue(true);
    var newValue = this.createNewValue();
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!!row.editingObj) continue;
      var rowValue = this.getRowValue(i);
      var rValue = row.value;
      if (this.isTwoValueEquals(rowValue, rValue)) continue;
      newValue = this.getNewValueOnRowChanged(row, "", rValue, false, newValue)
        .value;
    }
    if (this.isTwoValueEquals(oldValue, newValue)) return;
    this.isRowChanging = true;
    this.setNewValue(newValue);
    this.isRowChanging = false;
  }
  public get totalValue(): any {
    if (!this.hasTotal || !this.visibleTotalRow) return {};
    return this.visibleTotalRow.value;
  }
  protected getVisibleTotalRow(): MatrixDropdownRowModelBase {
    if (this.isUpdateLocked) return null;
    if (this.hasTotal) {
      if (!this.generatedTotalRow) {
        this.generatedTotalRow = this.generateTotalRow();
        if (this.data) {
          var properties = { survey: this.survey };
          this.runTotalsCondition(this.data.getAllValues(), properties);
        }
      }
    } else {
      this.generatedTotalRow = null;
    }
    return this.generatedTotalRow;
  }
  public get visibleTotalRow(): MatrixDropdownRowModelBase {
    return this.getVisibleTotalRow();
  }
  public onSurveyLoad() {
    super.onSurveyLoad();
    this.updateColumnsIndexes(this.columns);
    this.clearGeneratedRows();
    this.generatedTotalRow = null;
    this.updateHasFooter();
  }
  /**
   * Returns an object with row values. If a row has no answers, this method returns an empty object.
   * @param rowIndex A zero-based row index.
   * @see setRowValue
   */
  public getRowValue(rowIndex: number): any {
    if (rowIndex < 0 || !Array.isArray(this.visibleRows)) return null;
    var rows = this.generatedVisibleRows;
    if (rowIndex >= rows.length) return null;
    const val = this.value;
    const rowVal = this.getRowValueCore(rows[rowIndex], val);
    if(this.isValueSurveyElement(val)) return rowVal;
    return Helpers.getUnbindValue(rowVal);
  }
  public checkIfValueInRowDuplicated(
    checkedRow: MatrixDropdownRowModelBase,
    cellQuestion: Question
  ): boolean {
    if (!this.generatedVisibleRows) return false;
    return this.isValueInColumnDuplicated(cellQuestion.name, true, checkedRow);
  }
  /**
   * Assigns values to a row.
   * @param rowIndex A zero-based row index.
   * @param rowValue An object with the following structure: `{ "column_name": columnValue, ... }`
   * @see getRowValue
   */
  public setRowValue(rowIndex: number, rowValue: any): any {
    if (rowIndex < 0) return null;
    var visRows = this.visibleRows;
    if (rowIndex >= visRows.length) return null;
    visRows[rowIndex].value = rowValue;
    this.onRowChanged(visRows[rowIndex], "", rowValue, false);
  }
  protected generateRows(): Array<MatrixDropdownRowModelBase> {
    return null;
  }
  protected generateTotalRow(): MatrixDropdownRowModelBase {
    return new MatrixDropdownTotalRowModel(this);
  }
  protected createNewValue(nullOnEmpty: boolean = false): any {
    var res = !this.value ? {} : this.createValueCopy();
    if (nullOnEmpty && this.isMatrixValueEmpty(res)) return null;
    return res;
  }
  protected getRowValueCore(
    row: MatrixDropdownRowModelBase,
    questionValue: any,
    create: boolean = false
  ): any {
    var result =
      !!questionValue && !!questionValue[row.rowName]
        ? questionValue[row.rowName]
        : null;
    if (!result && create) {
      result = {};
      if (!!questionValue) {
        questionValue[row.rowName] = result;
      }
    }
    return result;
  }
  protected getRowObj(row: MatrixDropdownRowModelBase): any {
    var obj = this.getRowValueCore(row, this.value);
    return !!obj && !!obj.getType ? obj : null;
  }
  protected getRowDisplayValue(
    keysAsText: boolean,
    row: MatrixDropdownRowModelBase,
    rowValue: any
  ): any {
    if (!rowValue) return rowValue;
    if (!!row.editingObj) return rowValue;
    var keys = Object.keys(rowValue);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var question = row.getQuestionByName(key);
      if (!question) {
        question = this.getSharedQuestionByName(key, row);
      }
      if (!!question) {
        var displayvalue = question.getDisplayValue(keysAsText, rowValue[key]);
        if (keysAsText && !!question.title && question.title !== key) {
          rowValue[question.title] = displayvalue;
          delete rowValue[key];
        } else {
          rowValue[key] = displayvalue;
        }
      }
    }
    return rowValue;
  }
  public getPlainData(options: IPlainDataOptions = { includeEmpty: true }): IQuestionPlainData {
    var questionPlainData = super.getPlainData(options);
    if (!!questionPlainData) {
      questionPlainData.isNode = true;
      const prevData = Array.isArray(questionPlainData.data) ? [].concat(questionPlainData.data) : [];
      questionPlainData.data = this.visibleRows.map(
        (row: MatrixDropdownRowModelBase) => {
          var rowDataItem = <any>{
            name: row.dataName,
            title: row.text,
            value: row.value,
            displayValue: this.getRowDisplayValue(false, row, row.value),
            getString: (val: any) =>
              typeof val === "object" ? JSON.stringify(val) : val,
            isNode: true,
            data: row.cells
              .map((cell: MatrixDropdownCell) =>
                cell.question.getPlainData(options)
              )
              .filter((d: any) => !!d),
          };
          (options.calculations || []).forEach((calculation) => {
            rowDataItem[calculation.propertyName] = (<any>row)[
              calculation.propertyName
            ];
          });
          return rowDataItem;
        }
      );
      questionPlainData.data = questionPlainData.data.concat(prevData);
    }
    return questionPlainData;
  }
  public addConditionObjectsByContext(objects: Array<IConditionObject>, context: any): void {
    let rowElements: Array<any> = [].concat(this.columns);
    if(this.detailPanelMode !== "none") {
      rowElements = rowElements.concat(this.detailPanel.questions);
    }
    const hasColumnContext = !!context && rowElements.indexOf(context) > -1;
    const hasContext = context === true || hasColumnContext;
    const rowsIndeces = this.getConditionObjectsRowIndeces();
    if (hasContext) {
      rowsIndeces.push(-1);
    }
    for (var i = 0; i < rowsIndeces.length; i++) {
      const index = rowsIndeces[i];
      const rowName = index > -1 ? this.getConditionObjectRowName(index) : "row";
      if (!rowName) continue;
      const rowText = index > -1 ? this.getConditionObjectRowText(index) : "row";
      const hasQuestionPrefix = index > -1 || context === true;
      const dot = hasQuestionPrefix && index === -1 ? "." : "";
      const prefixName = (hasQuestionPrefix ? this.getValueName() : "") + dot + rowName + ".";
      const prefixTitle = (hasQuestionPrefix ? this.processedTitle : "") + dot + rowText + ".";
      for (var j = 0; j < rowElements.length; j++) {
        const rowElement = rowElements[j];
        if (index === -1 && context === rowElement) continue;
        const obj: IConditionObject = {
          name: prefixName + rowElement.name,
          text: prefixTitle + rowElement.fullTitle,
          question: this
        };

        if (index === -1 && context === true) {
          obj.context = this;
        } else {
          if(hasColumnContext && prefixName.startsWith("row.")) {
            obj.context = context;
          }
        }
        objects.push(obj);
      }
    }
  }
  public onHidingContent(): void {
    super.onHidingContent();
    if(!this.generatedVisibleRows) return;
    const questions: Question[] = [];
    this.collectNestedQuestions(questions, true);
    questions.forEach(q => q.onHidingContent());
  }
  protected getIsReadyNestedQuestions(): Array<Question> {
    if (!this.generatedVisibleRows) return [];
    const res = new Array<Question>();
    this.collectNestedQuestonsInRows(this.generatedVisibleRows, res, false, true);
    if (!!this.generatedTotalRow) {
      this.collectNestedQuestonsInRows([this.generatedTotalRow], res, false, true);
    }
    return res;
  }
  protected collectNestedQuestionsCore(questions: Question[], visibleOnly: boolean, includeNested: boolean): void {
    this.collectNestedQuestonsInRows(this.visibleRows, questions, visibleOnly, includeNested);
  }
  protected collectNestedQuestonsInRows(rows: Array<MatrixDropdownRowModelBase>, questions: Question[], visibleOnly: boolean, includeNested: boolean): void {
    if (!Array.isArray(rows)) return;
    rows.forEach(row => {
      row.questions.forEach(q => q.addNestedQuestion(questions, visibleOnly, includeNested));
    });
  }
  protected getConditionObjectRowName(index: number): string {
    return "";
  }
  protected getConditionObjectRowText(index: number): string {
    return this.getConditionObjectRowName(index);
  }
  protected getConditionObjectsRowIndeces(): Array<number> {
    return [];
  }
  public getProgressInfo(): IProgressInfo {
    if (!!this.generatedVisibleRows)
      return SurveyElement.getProgressInfoByElements(
        this.getCellQuestions(),
        this.isRequired
      );
    const res = Base.createProgressInfo();
    this.updateProgressInfoByValues(res);
    if (res.requiredQuestionCount === 0 && this.isRequired) {
      res.requiredQuestionCount = 1;
      res.requiredAnsweredQuestionCount = !this.isEmpty() ? 1 : 0;
    }
    return res;
  }
  protected updateProgressInfoByValues(res: IProgressInfo): void { }
  protected updateProgressInfoByRow(res: IProgressInfo, rowValue: any): void {
    for (var i = 0; i < this.columns.length; i++) {
      const col = this.columns[i];
      if (!col.templateQuestion.hasInput) continue;
      const hasValue = !Helpers.isValueEmpty(rowValue[col.name]);
      if(!hasValue && !!col.templateQuestion.visibleIf) continue;
      res.questionCount += 1;
      res.requiredQuestionCount += col.isRequired;
      res.answeredQuestionCount += hasValue ? 1 : 0;
      res.requiredAnsweredQuestionCount += hasValue && col.isRequired ? 1 : 0;
    }
  }
  private getCellQuestions(): Array<Question> {
    const res: Array<Question> = [];
    this.runFuncForCellQuestions((q: Question) => { res.push(q); });
    return res;
  }

  protected onBeforeValueChanged(val: any) { }
  private onSetQuestionValue() {
    if (this.isRowChanging) return;
    this.onBeforeValueChanged(this.value);
    if (!this.generatedVisibleRows || this.generatedVisibleRows.length == 0)
      return;
    this.isRowChanging = true;
    var val = this.createNewValue();
    for (var i = 0; i < this.generatedVisibleRows.length; i++) {
      var row = this.generatedVisibleRows[i];
      this.generatedVisibleRows[i].value = this.getRowValueCore(row, val);
    }
    this.isRowChanging = false;
  }
  protected setQuestionValue(newValue: any) {
    super.setQuestionValue(newValue, false);
    this.onSetQuestionValue();
    this.updateIsAnswered();
  }
  supportAutoAdvance(): boolean {
    var rows = this.generatedVisibleRows;
    if (!rows) rows = this.visibleRows;
    if (!rows) return true;
    for (var i = 0; i < rows.length; i++) {
      var cells = this.generatedVisibleRows[i].cells;
      if (!cells) continue;
      for (var colIndex = 0; colIndex < cells.length; colIndex++) {
        var question = cells[colIndex].question;
        if (
          question &&
          (!question.supportAutoAdvance() || !question.value)
        )
          return false;
      }
    }
    return true;
  }
  protected getContainsErrors(): boolean {
    return (
      super.getContainsErrors() ||
      this.checkForAnswersOrErrors(
        (question: Question) => question.containsErrors,
        false
      )
    );
  }
  protected getIsAnswered(): boolean {
    return (
      super.getIsAnswered() &&
      this.checkForAnswersOrErrors(
        (question: Question) => question.isAnswered,
        true
      )
    );
  }
  private checkForAnswersOrErrors(
    predicate: (question: Question) => boolean,
    every: boolean = false
  ) {
    var rows = this.generatedVisibleRows;
    if (!rows) return false;
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].cells;
      if (!cells) continue;
      for (var colIndex = 0; colIndex < cells.length; colIndex++) {
        if (!cells[colIndex]) continue;
        var question = cells[colIndex].question;
        if (question && question.isVisible)
          if (predicate(question)) {
            if (!every) return true;
          } else {
            if (every) return false;
          }
      }
    }
    return every ? true : false;
  }
  public hasErrors(fireCallback: boolean = true, rec: any = null): boolean {
    var errosInRows = this.hasErrorInRows(fireCallback, rec);
    var isDuplicated = this.isValueDuplicated();
    return super.hasErrors(fireCallback, rec) || errosInRows || isDuplicated;
  }
  protected getIsRunningValidators(): boolean {
    if (super.getIsRunningValidators()) return true;
    if (!this.generatedVisibleRows) return false;
    for (var i = 0; i < this.generatedVisibleRows.length; i++) {
      var cells = this.generatedVisibleRows[i].cells;
      if (!cells) continue;
      for (var colIndex = 0; colIndex < cells.length; colIndex++) {
        if (!cells[colIndex]) continue;
        var question = cells[colIndex].question;
        if (!!question && question.isRunningValidators) return true;
      }
    }
    return false;
  }
  public getAllErrors(): Array<SurveyError> {
    var result = super.getAllErrors();
    var rows = this.generatedVisibleRows;

    if (rows === null) return result;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      for (var j = 0; j < row.cells.length; j++) {
        var errors = row.cells[j].question.getAllErrors();
        if (errors && errors.length > 0) {
          result = result.concat(errors);
        }
      }
    }
    return result;
  }
  private hasErrorInRows(fireCallback: boolean, rec: any): boolean {
    let rows = this.generatedVisibleRows;
    if (!this.generatedVisibleRows) {
      rows = this.visibleRows;
    }
    var res = false;
    if (!rec) rec = {};
    if (!rows) return rec;
    rec.validationValues = this.getDataFilteredValues();
    rec.isSingleDetailPanel = this.detailPanelMode === "underRowSingle";
    for (var i = 0; i < rows.length; i++) {
      if(rows[i].isVisible) {
        res = rows[i].hasErrors(fireCallback, rec, () => {
          this.raiseOnCompletedAsyncValidators();
        }) || res;
      }
    }
    return res;
  }
  private isValueDuplicated(): boolean {
    if (!this.generatedVisibleRows) return false;
    var names = this.getUniqueColumnsNames();
    var res = false;
    for (var i = 0; i < names.length; i++) {
      res = this.isValueInColumnDuplicated(names[i], true) || res;
    }
    return res;
  }
  protected getUniqueColumnsNames(): Array<string> {
    var res = new Array<string>();
    for (var i = 0; i < this.columns.length; i++) {
      if (this.columns[i].isUnique) {
        res.push(this.columns[i].name);
      }
    }
    return res;
  }
  private isValueInColumnDuplicated(columnName: string, showErrors: boolean, row?: MatrixDropdownRowModelBase): boolean {
    const rows = this.getDuplicatedRows(columnName);
    if(showErrors) {
      this.showDuplicatedErrorsInRows(rows, columnName);
    }
    this.removeDuplicatedErrorsInRows(rows, columnName);
    return !!row ? rows.indexOf(row) > -1 : rows.length > 0;
  }
  private getDuplicatedRows(columnName: string): Array<MatrixDropdownRowModelBase> {
    const keyValues: HashTable<Array<MatrixDropdownRowModelBase>> = {};
    const res: Array<MatrixDropdownRowModelBase> = [];
    const rows = this.generatedVisibleRows;
    for (var i = 0; i < rows.length; i++) {
      let val = undefined;
      const question = rows[i].getQuestionByName(columnName);
      if(!!question) {
        val = question.value;
      } else {
        const rowVal = this.getRowValue(i);
        val = !!rowVal ? rowVal[columnName] : undefined;
      }
      if(!this.isValueEmpty(val)) {
        if(!this.useCaseSensitiveComparison && typeof val === "string") {
          val = val.toLocaleLowerCase();
        }
        if(!keyValues[val]) {
          keyValues[val] = [];
        }
        keyValues[val].push(rows[i]);
      }
    }
    for(let key in keyValues) {
      if(keyValues[key].length > 1) {
        keyValues[key].forEach(row => res.push(row));
      }
    }
    return res;
  }
  private showDuplicatedErrorsInRows(duplicatedRows: Array<MatrixDropdownRowModelBase>, columnName: string): void {
    duplicatedRows.forEach(row => {
      let question = row.getQuestionByName(columnName);
      const inDetailPanel = this.detailPanel.getQuestionByName(columnName);
      if(!question && inDetailPanel) {
        row.showDetailPanel();
        if(row.detailPanel) {
          question = row.detailPanel.getQuestionByName(columnName);
        }
      }
      if(question) {
        if(inDetailPanel) {
          row.showDetailPanel();
        }
        this.addDuplicationError(question);
      }
    });
  }
  private removeDuplicatedErrorsInRows(duplicatedRows: Array<MatrixDropdownRowModelBase>, columnName: string): void {
    this.generatedVisibleRows.forEach(row => {
      if(duplicatedRows.indexOf(row) < 0) {
        const question = row.getQuestionByName(columnName);
        if(question) {
          this.removeDuplicationError(row, question);
        }
      }
    });
  }
  private getDuplicationError(question: Question): SurveyError {
    const errors = question.errors;
    for(let i = 0; i < errors.length; i ++) {
      if(errors[i].getErrorType() === "keyduplicationerror") return errors[i];
    }
    return null;
  }
  private addDuplicationError(question: Question) {
    if (!this.getDuplicationError(question)) {
      question.addError(new KeyDuplicationError(this.keyDuplicationError, this));
    }
  }
  private removeDuplicationError(row: MatrixDropdownRowModelBase, question: Question) {
    if(question.removeError(this.getDuplicationError(question)) && question.errors.length === 0 && !!row.editingObj) {
      (<any>row.editingObj)[question.getValueName()] = question.value;
    }
  }
  public getFirstQuestionToFocus(withError: boolean): Question {
    return this.getFirstCellQuestion(withError);
  }
  protected getFirstInputElementId(): string {
    var question = this.getFirstCellQuestion(false);
    return question ? question.inputId : super.getFirstInputElementId();
  }
  protected getFirstErrorInputElementId(): string {
    var question = this.getFirstCellQuestion(true);
    return question ? question.inputId : super.getFirstErrorInputElementId();
  }
  protected getFirstCellQuestion(onError: boolean): Question {
    if (!this.generatedVisibleRows) return null;
    for (var i = 0; i < this.generatedVisibleRows.length; i++) {
      var cells = this.generatedVisibleRows[i].cells;
      for (var colIndex = 0; colIndex < cells.length; colIndex++) {
        if (!onError) return cells[colIndex].question;
        if (cells[colIndex].question.currentErrorCount > 0)
          return cells[colIndex].question;
      }
    }
    return null;
  }
  protected onReadOnlyChanged() {
    super.onReadOnlyChanged();
    if (!this.generateRows) return;
    for (var i = 0; i < this.visibleRows.length; i++) {
      this.visibleRows[i].onQuestionReadOnlyChanged();
    }
  }

  //IMatrixDropdownData
  public createQuestion(
    row: MatrixDropdownRowModelBase,
    column: MatrixDropdownColumn
  ): Question {
    return this.createQuestionCore(row, column);
  }
  protected createQuestionCore(
    row: MatrixDropdownRowModelBase,
    column: MatrixDropdownColumn
  ): Question {
    var question = column.createCellQuestion(row);
    question.setSurveyImpl(row);
    question.setParentQuestion(this);
    question.inMatrixMode = true;
    return question;
  }
  protected deleteRowValue(
    newValue: any,
    row: MatrixDropdownRowModelBase
  ): any {
    if (!newValue) return newValue;
    delete newValue[row.rowName];
    return this.isObject(newValue) && Object.keys(newValue).length == 0
      ? null
      : newValue;
  }
  private isDoingonAnyValueChanged = false;
  onAnyValueChanged(name: string, questionName: string): void {
    if (
      this.isUpdateLocked ||
      this.isDoingonAnyValueChanged ||
      !this.generatedVisibleRows
    )
      return;
    this.isDoingonAnyValueChanged = true;
    var rows = this.generatedVisibleRows;
    for (var i = 0; i < rows.length; i++) {
      rows[i].onAnyValueChanged(name, questionName);
    }
    var totalRow = this.visibleTotalRow;
    if (!!totalRow) {
      totalRow.onAnyValueChanged(name, questionName);
    }
    this.isDoingonAnyValueChanged = false;
  }
  protected isObject(value: any) {
    return value !== null && typeof value === "object";
  }
  private getOnCellValueChangedOptions(
    row: MatrixDropdownRowModelBase,
    columnName: string,
    rowValue: any
  ): any {
    const getQuestion = (colName: any) => {
      return row.getQuestionByName(colName);
    };
    return {
      row: row,
      columnName: columnName,
      rowValue: rowValue,
      value: !!rowValue ? rowValue[columnName] : null,
      getCellQuestion: getQuestion,
      cellQuestion: row.getQuestionByName(columnName),
      column: this.getColumnByName(columnName)
    };
  }
  protected onCellValueChanged(row: MatrixDropdownRowModelBase, columnName: string, rowValue: any): void {
    if (!this.survey) return;
    var options = this.getOnCellValueChangedOptions(row, columnName, rowValue);
    if (!!this.onCellValueChangedCallback) {
      this.onCellValueChangedCallback(options);
    }
    this.survey.matrixCellValueChanged(this, options);
  }
  validateCell(row: MatrixDropdownRowModelBase, columnName: string, rowValue: any): SurveyError {
    if (!this.survey) return;
    var options = this.getOnCellValueChangedOptions(row, columnName, rowValue);
    return this.survey.matrixCellValidate(this, options);
  }
  get isValidateOnValueChanging(): boolean {
    return !!this.survey ? this.survey.isValidateOnValueChanging : false;
  }
  protected get hasInvisibleRows(): boolean {
    const rows = this.generatedVisibleRows;
    if(!Array.isArray(rows)) return false;
    for(let i = 0; i < rows.length; i ++) {
      if(!rows[i].isVisible) return true;
    }
    return false;
  }
  getFilteredData(): any {
    if(this.isEmpty() || !this.generatedVisibleRows || !this.hasInvisibleRows) return this.value;
    return this.getFilteredDataCore();
  }
  protected getFilteredDataCore(): any { return this.value; }
  onRowChanging(
    row: MatrixDropdownRowModelBase,
    columnName: string,
    rowValue: any
  ): any {
    if (!this.survey && !this.cellValueChangingCallback) return !!rowValue ? rowValue[columnName] : null;
    var options = this.getOnCellValueChangedOptions(row, columnName, rowValue);
    var oldRowValue = this.getRowValueCore(row, this.createNewValue(), true);
    options.oldValue = !!oldRowValue ? oldRowValue[columnName] : null;
    if (!!this.cellValueChangingCallback) {
      options.value = this.cellValueChangingCallback(row, columnName, options.value, options.oldValue);
    }
    if (!!this.survey) {
      this.survey.matrixCellValueChanging(this, options);
    }
    return options.value;
  }
  onRowChanged(row: MatrixDropdownRowModelBase, columnName: string, newRowValue: any, isDeletingValue: boolean): void {
    var rowObj = !!columnName ? this.getRowObj(row) : null;
    if (!!rowObj) {
      var columnValue = null;
      if (!!newRowValue && !isDeletingValue) {
        columnValue = newRowValue[columnName];
      }
      this.isRowChanging = true;
      Serializer.setObjPropertyValue(rowObj, columnName, columnValue);
      this.isRowChanging = false;
      this.onCellValueChanged(row, columnName, rowObj);
    } else {
      var oldValue = this.createNewValue(true);
      var combine = this.getNewValueOnRowChanged(
        row,
        columnName,
        newRowValue,
        isDeletingValue,
        this.createNewValue()
      );
      if (this.isTwoValueEquals(oldValue, combine.value)) return;
      this.isRowChanging = true;
      this.setNewValue(combine.value);
      this.isRowChanging = false;
      if (columnName) {
        this.onCellValueChanged(row, columnName, combine.rowValue);
      }
    }
    if(this.getUniqueColumnsNames().indexOf(columnName) > -1) {
      this.isValueInColumnDuplicated(columnName, !!rowObj);
    }
  }
  private getNewValueOnRowChanged(row: MatrixDropdownRowModelBase,
    columnName: string, newRowValue: any, isDeletingValue: boolean, newValue: any): any {
    const rowValue = this.getRowValueCore(row, newValue, true);
    if (isDeletingValue) {
      delete rowValue[columnName];
    }
    row.questions.forEach(q => {
      delete rowValue[q.getValueName()];
    });
    if (newRowValue) {
      newRowValue = JSON.parse(JSON.stringify(newRowValue));
      for (var key in newRowValue) {
        if (!this.isValueEmpty(newRowValue[key])) {
          rowValue[key] = newRowValue[key];
        }
      }
    }
    if (this.isObject(rowValue) && Object.keys(rowValue).length === 0) {
      newValue = this.deleteRowValue(newValue, row);
    }
    return { value: newValue, rowValue: rowValue };
  }
  getRowIndex(row: MatrixDropdownRowModelBase): number {
    if (!Array.isArray(this.generatedVisibleRows)) return -1;
    return this.generatedVisibleRows.indexOf(row);
  }
  public getElementsInDesign(includeHidden: boolean = false): Array<IElement> {
    let elements: Array<IElement>;
    if (this.detailPanelMode == "none") {
      elements = super.getElementsInDesign(includeHidden);
    }
    else {
      elements = includeHidden ? [this.detailPanel] : this.detailElements;
    }
    return this.columns.concat(elements);
  }
  hasDetailPanel(row: MatrixDropdownRowModelBase): boolean {
    if (this.detailPanelMode == "none") return false;
    if (this.isDesignMode) return true;
    if (!!this.onHasDetailPanelCallback)
      return this.onHasDetailPanelCallback(row);
    return this.detailElements.length > 0;
  }
  getIsDetailPanelShowing(row: MatrixDropdownRowModelBase): boolean {
    if (this.detailPanelMode == "none") return false;
    if (this.isDesignMode) {
      var res = this.visibleRows.indexOf(row) == 0;
      if (res) {
        if (!row.detailPanel) {
          row.showDetailPanel();
        }
      }
      return res;
    }
    return this.getPropertyValue("isRowShowing" + row.id, false);
  }
  setIsDetailPanelShowing(row: MatrixDropdownRowModelBase, val: boolean): void {
    if (val == this.getIsDetailPanelShowing(row)) return;
    this.setPropertyValue("isRowShowing" + row.id, val);
    this.updateDetailPanelButtonCss(row);
    if (!!this.renderedTable) {
      this.renderedTable.onDetailPanelChangeVisibility(row, val);
    }
    if(this.survey) {
      this.survey.matrixDetailPanelVisibleChanged(this, row.rowIndex - 1, row, val);
    }
    if (val && this.detailPanelMode === "underRowSingle") {
      var rows = this.visibleRows;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].id !== row.id && rows[i].isDetailPanelShowing) {
          rows[i].hideDetailPanel();
        }
      }
    }
  }
  public getDetailPanelButtonCss(row: MatrixDropdownRowModelBase): string {
    const builder = new CssClassBuilder().append(this.getPropertyValue("detailButtonCss" + row.id));
    return builder.append(this.cssClasses.detailButton, builder.toString() === "").toString();
  }
  public getDetailPanelIconCss(row: MatrixDropdownRowModelBase): string {
    const builder = new CssClassBuilder().append(this.getPropertyValue("detailIconCss" + row.id));
    return builder.append(this.cssClasses.detailIcon, builder.toString() === "").toString();
  }
  public getDetailPanelIconId(row: MatrixDropdownRowModelBase): string {
    return this.getIsDetailPanelShowing(row) ? this.cssClasses.detailIconExpandedId : this.cssClasses.detailIconId;
  }
  private updateDetailPanelButtonCss(row: MatrixDropdownRowModelBase) {
    const classes = this.cssClasses;
    const isPanelShowing = this.getIsDetailPanelShowing(row);

    const iconBuilder = new CssClassBuilder().append(classes.detailIcon)
      .append(classes.detailIconExpanded, isPanelShowing);
    this.setPropertyValue("detailIconCss" + row.id, iconBuilder.toString());

    const buttonBuilder = new CssClassBuilder().append(classes.detailButton)
      .append(classes.detailButtonExpanded, isPanelShowing);
    this.setPropertyValue("detailButtonCss" + row.id, buttonBuilder.toString());
  }
  createRowDetailPanel(row: MatrixDropdownRowModelBase): PanelModel {
    if (this.isDesignMode) return this.detailPanel;
    var panel = this.createNewDetailPanel();
    panel.readOnly = this.isReadOnly || !row.isRowEnabled();
    panel.setSurveyImpl(row);
    var json = this.detailPanel.toJSON();
    new JsonObject().toObject(json, panel);
    panel.renderWidth = "100%";
    panel.updateCustomWidgets();
    if (!!this.onCreateDetailPanelCallback) {
      this.onCreateDetailPanelCallback(row, panel);
    }
    panel.questions.forEach(q => q.setParentQuestion(this));
    panel.onSurveyLoad();
    return panel;
  }
  getSharedQuestionByName(
    columnName: string,
    row: MatrixDropdownRowModelBase
  ): Question {
    if (!this.survey || !this.valueName) return null;
    var index = this.getRowIndex(row);
    if (index < 0) return null;
    return <Question>(
      this.survey.getQuestionByValueNameFromArray(
        this.valueName,
        columnName,
        index
      )
    );
  }
  onTotalValueChanged(): any {
    if (
      !!this.data &&
      !!this.visibleTotalRow &&
      !this.isUpdateLocked &&
      !this.isSett
    ) {
      this.data.setValue(
        this.getValueName() + settings.matrix.totalsSuffix,
        this.totalValue,
        false
      );
    }
  }
  getDataFilteredValues(): any {
    return this.data ? this.data.getFilteredValues() : {};
  }
  getParentTextProcessor(): ITextProcessor {
    if (!this.parentQuestion || !this.parent) return null;
    const data = (<any>this.parent).data;
    if (!!data && !!data.getTextProcessor)
      return data.getTextProcessor();
    return null;
  }
  isMatrixReadOnly(): boolean { return this.isReadOnly; }
  onRowVisibilityChanged(row: MatrixDropdownRowModelBase): void {
    this.clearVisibleRows();
    this.resetRenderedTable();
  }
  protected clearValueIfInvisibleCore(reason: string): void {
    super.clearValueIfInvisibleCore(reason);
    this.clearInvisibleValuesInRows();
  }
  protected clearInvisibleValuesInRows(): void {
    if (this.isEmpty() || !this.isRowsFiltered()) return;
    const sharedQuestions = this.survey?.questionsByValueName(this.getValueName()) || [];
    if(sharedQuestions.length < 2) {
      this.value = this.getFilteredData();
    }
  }
  protected isRowsFiltered(): boolean {
    return super.isRowsFiltered() || (this.visibleRows !== this.generatedVisibleRows);
  }
  public getQuestionFromArray(name: string, index: number): IQuestion {
    if (index >= this.visibleRows.length) return null;
    return this.visibleRows[index].getQuestionByName(name);
  }
  private isMatrixValueEmpty(val: any) {
    if (!val) return;
    if (Array.isArray(val)) {
      for (var i = 0; i < val.length; i++) {
        if (this.isObject(val[i]) && Object.keys(val[i]).length > 0)
          return false;
      }
      return true;
    }
    return Object.keys(val).length == 0;
  }

  private get SurveyModel() {
    return this.survey as SurveyModel;
  }
  public getCellTemplateData(cell: QuestionMatrixDropdownRenderedCell) {
    // return cell.cell.column.templateQuestion;
    return this.SurveyModel.getMatrixCellTemplateData(cell);
  }
  public getCellWrapperComponentName(cell: MatrixDropdownCell) {
    return this.SurveyModel.getElementWrapperComponentName(cell, cell.row instanceof MatrixDropdownTotalRowModel ? "row-footer" : "cell");
  }
  public getCellWrapperComponentData(cell: MatrixDropdownCell) {
    return this.SurveyModel.getElementWrapperComponentData(cell, cell.row instanceof MatrixDropdownTotalRowModel ? "row-footer" : "cell");
  }
  public getColumnHeaderWrapperComponentName(cell: MatrixDropdownCell) {
    return this.SurveyModel.getElementWrapperComponentName(
      cell,
      "column-header"
    );
  }
  public getColumnHeaderWrapperComponentData(cell: MatrixDropdownCell) {
    return this.SurveyModel.getElementWrapperComponentData(
      cell,
      "column-header"
    );
  }
  public getRowHeaderWrapperComponentName(cell: MatrixDropdownCell) {
    return this.SurveyModel.getElementWrapperComponentName(cell, "row-header");
  }
  public getRowHeaderWrapperComponentData(cell: MatrixDropdownCell) {
    return this.SurveyModel.getElementWrapperComponentData(cell, "row-header");
  }
  public get showHorizontalScroll(): boolean {
    return !this.isDefaultV2Theme && this.horizontalScroll;
  }
  protected onMobileChanged(): void {
    super.onMobileChanged();
    this.resetRenderedTable();
  }
  public getRootCss(): string {
    return new CssClassBuilder().append(super.getRootCss()).append(this.cssClasses.rootScroll, this.horizontalScroll).toString();
  }
  public afterRenderQuestionElement(el: HTMLElement): void {
    super.afterRenderQuestionElement(el);
    this.setRootElement(el?.parentElement);
  }
  public beforeDestroyQuestionElement(el: HTMLElement): void {
    super.beforeDestroyQuestionElement(el);
    this.setRootElement(undefined);
  }

  private rootElement: HTMLElement;
  public setRootElement(val: HTMLElement): void {
    this.rootElement = val;
  }
  public getRootElement(): HTMLElement {
    return this.rootElement;
  }
}

Serializer.addClass(
  "matrixdropdownbase",
  [
    {
      name: "columns:matrixdropdowncolumns",
      className: "matrixdropdowncolumn", isArray: true
    },
    {
      name: "columnLayout",
      alternativeName: "columnsLocation",
      choices: ["horizontal", "vertical"],
      visible: false, isSerializable: false
    },
    {
      name: "transposeData:boolean", version: "1.9.130", oldName: "columnLayout"
    },
    {
      name: "detailElements",
      baseClassName: "question",
      visible: false,
      isLightSerializable: false,
    },
    {
      name: "detailPanelMode",
      choices: ["none", "underRow", "underRowSingle"],
      default: "none",
    },
    { name: "cellErrorLocation", default: "default", choices: ["default", "top", "bottom"] },
    {
      name: "detailErrorLocation", default: "default", choices: ["default", "top", "bottom"],
      visibleIf: (obj: any) => { return !!obj && obj.detailPanelMode != "none"; }
    },
    { name: "horizontalScroll:boolean", visible: false, },
    {
      name: "choices:itemvalue[]", uniqueProperty: "value", visibleIf: (obj): boolean => obj.isSelectCellType()
    },
    { name: "placeholder", alternativeName: "optionsCaption", serializationProperty: "locPlaceholder" },
    { name: "keyDuplicationError", serializationProperty: "locKeyDuplicationError", },
    {
      name: "singleInputRowTitle", serializationProperty: "locSingleInputRowTitle",
      visibleIf(obj) { return obj.survey?.isSingleVisibleInput; }
    },
    {
      name: "cellType",
      default: "dropdown",
      choices: () => {
        return MatrixDropdownColumn.getColumnTypes();
      },
    },
    { name: "columnColCount", default: 0, choices: [0, 1, 2, 3, 4] },
    "columnMinWidth",
    { name: "allowAdaptiveActions:boolean", default: false, visible: false },
  ],
  function () {
    return new QuestionMatrixDropdownModelBase("");
  },
  "matrixbase"
);
