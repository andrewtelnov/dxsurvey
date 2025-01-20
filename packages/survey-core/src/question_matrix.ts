import { HashTable, Helpers } from "./helpers";
import { ItemValue } from "./itemvalue";
import { QuestionMatrixBaseModel } from "./martixBase";
import { JsonObject, Serializer } from "./jsonobject";
import { Base } from "./base";
import { SurveyError } from "./survey-error";
import { getLocaleString } from "./surveyStrings";
import { RequiredInAllRowsError, EachRowUniqueError } from "./error";
import { QuestionFactory } from "./questionfactory";
import { LocalizableString, ILocalizableOwner } from "./localizablestring";
import { QuestionDropdownModel } from "./question_dropdown";
import { IConditionObject, IQuestionPlainData } from "./question";
import { settings } from "./settings";
import { SurveyModel } from "./survey";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { IPlainDataOptions } from "./base-interfaces";
import { ConditionRunner } from "./conditions";
import { Question } from "./question";
import { ISurveyData, ISurvey, ITextProcessor, IQuestion } from "./base-interfaces";

export interface IMatrixData {
  onMatrixRowChanged(row: MatrixRowModel): void;
  getCorrectedRowValue(value: any): any;
  cssClasses: any;
  isDisabledStyle: boolean;
  isInputReadOnly: boolean;
  isDisabledAttr: boolean;
  isReadOnlyAttr: boolean;
  hasErrorInRow(row: MatrixRowModel): boolean;
}

export class MatrixRowModel extends Base {
  private data: IMatrixData;
  public cellClick: any;

  constructor(
    public item: ItemValue,
    public fullName: string,
    data: IMatrixData,
    value: any
  ) {
    super();
    this.data = data;
    this.setValueDirectly(value);
    this.cellClick = (column: any) => {
      this.value = column.value;
    };
    this.registerPropertyChangedHandlers(["value"], () => {
      if (this.data) this.data.onMatrixRowChanged(this);
    });
    if (this.data && this.data.hasErrorInRow(this)) {
      this.hasError = true;
    }
  }
  public get name(): string {
    return this.item.value;
  }
  public get text(): string {
    return this.item.text;
  }
  public get locText(): LocalizableString {
    return this.item.locText;
  }
  public get value(): any {
    return this.getPropertyValue("value");
  }
  public set value(val: any) {
    if (!this.isReadOnly) {
      this.setValueDirectly(this.data.getCorrectedRowValue(val));
    }
  }
  public setValueDirectly(val: any): void {
    this.setPropertyValue("value", val);
  }
  public get isReadOnly(): boolean { return !this.item.enabled || this.data.isInputReadOnly; }
  public get isReadOnlyAttr(): boolean { return this.data.isReadOnlyAttr; }
  public get isDisabledAttr(): boolean { return !this.item.enabled || this.data.isDisabledAttr; }
  public get rowTextClasses(): string {
    return new CssClassBuilder().append(this.data.cssClasses.rowTextCell).toString();
  }
  public get hasError(): boolean {
    return this.getPropertyValue("hasError", false);
  }
  public set hasError(val: boolean) {
    this.setPropertyValue("hasError", val);
  }
  public get rowClasses(): string {
    const cssClasses = (<any>this.data).cssClasses;
    return new CssClassBuilder().append(cssClasses.row)
      .append(cssClasses.rowError, this.hasError)
      .append(cssClasses.rowReadOnly, this.isReadOnly)
      .append(cssClasses.rowDisabled, this.data.isDisabledStyle)
      .toString();
  }
}

export interface IMatrixCellsOwner extends ILocalizableOwner {
  getRows(): Array<any>;
  getColumns(): Array<any>;
}

export class MatrixCells extends Base {
  private values: { [index: string]: any } = {};
  private locs: { [index: string]: any } = {};
  public constructor(public cellsOwner: IMatrixCellsOwner) {
    super();
  }
  public getType(): string { return "cells"; }
  public get isEmpty(): boolean {
    return Object.keys(this.values).length == 0;
  }
  public onValuesChanged: () => void;
  private locNotification: boolean;
  private valuesChanged(): void {
    if (!this.locNotification && !!this.onValuesChanged) {
      this.onValuesChanged();
    }
  }
  public getDefaultCellLocText(column: any): LocalizableString {
    return this.getCellLocCore(this.defaultRowValue, column);
  }
  public getCellDisplayLocText(row: any, column: any): LocalizableString {
    return this.getCellLocCore(row, column);
  }
  private getCellLocCore(row: any, col: any): LocalizableString {
    row = this.getCellRowColumnValue(row, this.rows);
    col = this.getCellRowColumnValue(col, this.columns);
    if (Helpers.isValueEmpty(row) || Helpers.isValueEmpty(col)) return null;
    if (!this.locs[row]) {
      this.locs[row] = {};
    }
    let res = <LocalizableString>this.locs[row][col];
    if (!res) {
      res = this.createString();
      res.setJson(this.getCellLocData(row, col));
      res.onGetTextCallback = (str: string): string => {
        if (!str) {
          const column = ItemValue.getItemByValue(this.columns, col);
          if (column) {
            return column.locText.getJson() || column.value;
          }
        }
        return str;
      };
      res.onStrChanged = (oldValue: any, newValue: any): void => {
        this.updateValues(row, col, newValue);
      };
      this.locs[row][col] = res;
    }
    return res;
  }
  private get defaultRowValue() { return settings.matrix.defaultRowName; }
  private getCellLocData(row: any, col: any): any {
    let data = this.getCellLocDataFromValue(row, col);
    if (data) return data;
    return this.getCellLocDataFromValue(this.defaultRowValue, col);
  }
  private getCellLocDataFromValue(row: any, column: any): any {
    if (!this.values[row]) return null;
    if (!this.values[row][column]) return null;
    return this.values[row][column];
  }
  public getCellText(row: any, column: any): string {
    var loc = this.getCellLocCore(row, column);
    return loc ? loc.calculatedText : null;
  }
  public setCellText(row: any, column: any, val: string): void {
    const loc = this.getCellLocCore(row, column);
    if (loc) {
      loc.text = val;
    }
  }
  private updateValues(row: any, column: any, val: any): void {
    if (val) {
      if (!this.values[row]) this.values[row] = {};
      this.values[row][column] = val;
      this.valuesChanged();
    } else {
      if (this.values[row] && this.values[row][column]) {
        delete this.values[row][column];
        if (Object.keys(this.values[row]).length == 0) {
          delete this.values[row];
        }
        this.valuesChanged();
      }
    }
  }
  public getDefaultCellText(column: any): string {
    var loc = this.getCellLocCore(this.defaultRowValue, column);
    return loc ? loc.calculatedText : null;
  }
  public setDefaultCellText(column: any, val: string): void {
    this.setCellText(this.defaultRowValue, column, val);
  }
  public getCellDisplayText(row: any, column: any): string {
    var loc = this.getCellDisplayLocText(row, column);
    return loc ? loc.calculatedText : null;
  }
  public get rows(): Array<any> {
    return this.cellsOwner ? this.cellsOwner.getRows() : [];
  }
  public get columns(): Array<any> {
    return this.cellsOwner ? this.cellsOwner.getColumns() : [];
  }
  private getCellRowColumnValue(val: any, values: Array<any>): any {
    if (val === null || val === undefined) return null;
    if (typeof val == "number") {
      if (val < 0 || val >= values.length) return null;
      val = values[val].value;
    }
    if (val.value) return val.value;
    return val;
  }
  public getJson(): any {
    if (this.isEmpty) return null;
    const defaultRow = this.values[this.defaultRowValue];
    const res: { [index: string]: any } = {};
    for (let row in this.values) {
      const resRow: { [index: string]: any } = {};
      const rowValues = this.values[row];
      for (let col in rowValues) {
        if (row === this.defaultRowValue || !defaultRow || defaultRow[col] !== rowValues[col]) {
          resRow[col] = rowValues[col];
        }
      }
      res[row] = resRow;
    }
    return res;
  }
  public setJson(value: any, isLoading?: boolean): void {
    this.values = {};
    if (!!value) {
      for (var row in value) {
        if (row == "pos") continue;
        var rowValues = value[row];
        this.values[row] = {};
        for (var col in rowValues) {
          if (col == "pos") continue;
          this.values[row][col] = rowValues[col];
        }
      }
    }
    this.locNotification = true;
    this.runFuncOnLocs((row: any, col: any, loc: LocalizableString) => loc.setJson(this.getCellLocData(row, col)));
    this.locNotification = false;
    this.valuesChanged();
  }
  public locStrsChanged(): void {
    this.runFuncOnLocs((row: any, col: any, loc: LocalizableString) => loc.strChanged());
  }
  private runFuncOnLocs(func: (row: any, col: any, loc: LocalizableString) => void): void {
    for (let row in this.locs) {
      const rowValues = this.locs[row];
      for (let col in rowValues) {
        func(row, col, rowValues[col]);
      }
    }
  }
  protected createString(): LocalizableString {
    return new LocalizableString(this.cellsOwner, true);
  }
}

/**
  * A class that describes the Single-Select Matrix question type.
  *
  * [View Demo](https://surveyjs.io/form-library/examples/single-selection-matrix-table-question/ (linkStyle))
  */
export class QuestionMatrixModel
  extends QuestionMatrixBaseModel<MatrixRowModel, ItemValue>
  implements IMatrixData, IMatrixCellsOwner {
  private isRowChanging = false;
  private cellsValue: MatrixCells;

  constructor(name: string) {
    super(name);
    this.cellsValue = new MatrixCells(this);
    this.cellsValue.onValuesChanged = () => {
      this.updateHasCellText();
      this.propertyValueChanged("cells", this.cells, this.cells);
    };
    this.registerPropertyChangedHandlers(["columns"], () => {
      this.onColumnsChanged();
    });
    this.registerPropertyChangedHandlers(["rows"], () => {
      this.runCondition(this.getDataFilteredValues(), this.getDataFilteredProperties());
      this.onRowsChanged();
    });
    this.registerPropertyChangedHandlers(["hideIfRowsEmpty"], () => {
      this.updateVisibilityBasedOnRows();
    });
  }
  public getType(): string {
    return "matrix";
  }
  /**
   * The name of a component used to render cells.
   */
  public get cellComponent(): string {
    return this.getPropertyValue("cellComponent");
  }
  public set itemComponent(value: string) {
    this.setPropertyValue("cellComponent", value);
  }
  public get hasSingleInput(): boolean {
    return false;
  }
  /**
   * Specifies whether each row requires an answer. If a respondent skips a row, the question displays a validation error.
   * @see isRequired
   * @see eachRowUnique
   * @see validators
   */
  public get eachRowRequired(): boolean {
    return this.getPropertyValue("eachRowRequired");
  }
  public set eachRowRequired(val: boolean) {
    this.setPropertyValue("eachRowRequired", val);
  }
  /**
   * @deprecated Use the [`eachRowRequired`](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-question-model#eachRowRequired) property instead.
   */
  public get isAllRowRequired(): boolean {
    return this.eachRowRequired;
  }
  public set isAllRowRequired(val: boolean) {
    this.eachRowRequired = val;
  }
  /**
   * Specifies whether answers in all rows should be unique. If any answers duplicate, the question displays a validation error.
   * @see eachRowRequired
   * @see validators
   */
  public get eachRowUnique(): boolean {
    return this.getPropertyValue("eachRowUnique");
  }
  public set eachRowUnique(val: boolean) {
    this.setPropertyValue("eachRowUnique", val);
  }
  public get hasRows(): boolean {
    return this.rows.length > 0;
  }
  /**
   * Specifies a sort order for matrix rows.
   *
   * Possible values:
   *
   * - `"initial"` (default) - Preserves the original order of the `rows` array.
   * - `"random"` - Arranges matrix rows in random order each time the question is displayed.
   * @see rows
   */
  public get rowOrder(): string {
    return this.getPropertyValue("rowOrder");
  }
  public set rowOrder(val: string) {
    val = val.toLowerCase();
    if (val == this.rowOrder) return;
    this.setPropertyValue("rowOrder", val);
    this.onRowsChanged();
  }
  /**
   * @deprecated Use the [`rowOrder`](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-question-model#rowOrder) property instead.
   */
  public get rowsOrder(): string {
    return this.rowOrder;
  }
  public set rowsOrder(val: string) {
    this.rowOrder = val;
  }
  /**
   * Specifies whether to hide the question when the matrix has no visible rows.
   * @see rowsVisibleIf
   */
  public get hideIfRowsEmpty(): boolean {
    return this.getPropertyValue("hideIfRowsEmpty");
  }
  public set hideIfRowsEmpty(val: boolean) {
    this.setPropertyValue("hideIfRowsEmpty", val);
  }
  getRows(): Array<any> {
    return this.rows;
  }
  getColumns(): Array<any> {
    return this.visibleColumns;
  }
  public addColumn(value: any, text?: string): ItemValue {
    var col = new ItemValue(value, text);
    this.columns.push(col);
    return col;
  }
  public getItemClass(row: any, column: any): string {
    const isChecked = row.value == column.value;
    const isDisabled = this.isReadOnly;
    const allowHover = !isChecked && !isDisabled;
    const hasCellText = this.hasCellText;
    const css = this.cssClasses;
    return new CssClassBuilder()
      .append(css.cell, hasCellText)
      .append(hasCellText ? css.cellText : css.label)
      .append(css.itemOnError, !hasCellText && (this.eachRowRequired || this.eachRowUnique ? row.hasError : this.hasCssError()))
      .append(hasCellText ? css.cellTextSelected : css.itemChecked, isChecked)
      .append(hasCellText ? css.cellTextDisabled : css.itemDisabled, this.isDisabledStyle)
      .append(hasCellText ? css.cellTextReadOnly : css.itemReadOnly, this.isReadOnlyStyle)
      .append(hasCellText ? css.cellTextPreview : css.itemPreview, this.isPreviewStyle)
      .append(css.itemHover, allowHover && !hasCellText)
      .toString();
  }
  public get itemSvgIcon(): string {
    if (this.isPreviewStyle && this.cssClasses.itemPreviewSvgIconId) {
      return this.cssClasses.itemPreviewSvgIconId;
    }
    return this.cssClasses.itemSvgIconId;
  }
  public locStrsChanged(): void {
    super.locStrsChanged();
    this.cells.locStrsChanged();
  }
  protected getQuizQuestionCount() {
    var res = 0;
    for (var i = 0; i < this.rows.length; i++) {
      if (!this.isValueEmpty(this.correctAnswer[this.rows[i].value])) res++;
    }
    return res;
  }
  protected getCorrectAnswerCount(): number {
    var res = 0;
    var value = this.value;
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i].value;
      if (
        !this.isValueEmpty(value[row]) &&
        this.isTwoValueEquals(this.correctAnswer[row], value[row])
      )
        res++;
    }
    return res;
  }
  protected runConditionCore(values: HashTable<any>, properties: HashTable<any>): void {
    ItemValue.runEnabledConditionsForItems(this.rows, undefined, values, properties);
    super.runConditionCore(values, properties);
  }
  protected createRowsVisibleIfRunner(): ConditionRunner {
    return !!this.rowsVisibleIf ? new ConditionRunner(this.rowsVisibleIf) : null;
  }
  protected onRowsChanged(): void {
    this.clearGeneratedRows();
    super.onRowsChanged();
  }
  protected getVisibleRows(): Array<MatrixRowModel> {
    if (!!this.generatedVisibleRows) return this.generatedVisibleRows;
    const result = new Array<MatrixRowModel>();
    let val = this.value;
    if (!val) val = {};
    const rows = this.filteredRows || this.rows;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (this.isValueEmpty(row.value)) continue;
      const rowId = this.id + "_" + row.value.toString().replace(/\s/g, "_");
      result.push(this.createMatrixRow(row, rowId, val[row.value]));
    }
    this.generatedVisibleRows = result;
    return result;
  }
  private nestedQuestionsValue: Array<Question>;
  private getRowByName(name: string): MatrixRowModel {
    const rows = this.visibleRows;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].name === name) return rows[i];
    }
    return null;
  }
  protected getSingleInputQuestions(): Array<Question> {
    if(!!this.nestedQuestionsValue) return this.nestedQuestionsValue;
    const res: Array<Question> = [];
    this.visibleRows.forEach(row => {
      const question = <Question>Serializer.createClass("radiogroup");
      question.name = row.name;
      question.locTitle.sharedData = row.locText;
      question.choices = this.visibleColumns;
      question.value = row.value;
      question.isRequired = this.isAllRowRequired;
      question.setSurveyImpl(this);
      question.setParentQuestion(this);
      res.push(question);
    });
    this.nestedQuestionsValue = res;
    return res;
  }
  public resetSingleInput(): void {
    super.resetSingleInput();
    if(this.nestedQuestionsValue) {
      this.nestedQuestionsValue.forEach(q => q.dispose());
      this.nestedQuestionsValue = null;
    }
  }
  //#region For simple radiogroup questions setSurveyImpl
  getSurveyData(): ISurveyData { return this; }
  getTextProcessor(): ITextProcessor { return this.surveyImpl?.getTextProcessor(); }
  getValue(name: string): any {
    const row = this.getRowByName(name);
    return !!row ? row.value : undefined;
  }
  setValue(name: string, newValue: any, locNotification: any, allowNotifyValueChanged?: boolean, questionName?: string): any {
    this.getRowByName(name).value = newValue;
  }
  getVariable(name: string): any { return this.data?.getVariable(name); }
  setVariable(name: string, newValue: any): void { this.data?.setVariable(name, newValue); }
  getComment(name: string): string { return this.data?.getComment(name); }
  setComment(name: string, newValue: string, locNotification: any): any { this.data?.setComment(name, newValue, locNotification); }
  getAllValues(): any { return this.data?.getAllValues(); }
  getFilteredValues(): any { return this.data?.getFilteredValues(); }
  getFilteredProperties(): any { return this.data?.getFilteredProperties(); }
  findQuestionByName(name: string): IQuestion { return this.data?.findQuestionByName(name); }
  getEditingSurveyElement(): Base { return this.data?.getEditingSurveyElement(); }
  //#endregion
  protected sortVisibleRows(array: Array<MatrixRowModel>): Array<MatrixRowModel> {
    if (!!this.survey && this.survey.isDesignMode)
      return array;
    var order = this.rowOrder.toLowerCase();
    if (order === "random")
      return Helpers.randomizeArray<MatrixRowModel>(array);
    return array;
  }
  endLoadingFromJson(): void {
    super.endLoadingFromJson();
    this.rows = this.sortVisibleRows(this.rows);
    this.onRowsChanged();
    this.onColumnsChanged();
  }
  protected isNewValueCorrect(val: any): boolean {
    return Helpers.isValueObject(val, true);
  }
  protected processRowsOnSet(newRows: Array<any>) {
    return this.sortVisibleRows(newRows);
  }
  public get visibleRows(): Array<MatrixRowModel> {
    return this.getVisibleRows();
  }
  /**
   * An array of matrix cells. Use this array to get or set cell values.
   *
   * [View Demo](https://surveyjs.io/form-library/examples/questiontype-matrix-rubric/ (linkStyle))
   */
  public get cells(): MatrixCells {
    return this.cellsValue;
  }
  public set cells(value: MatrixCells) {
    this.cells.setJson(value && value.getJson ? value.getJson() : null);
  }
  public get hasCellText(): boolean {
    return this.getPropertyValue("hasCellText", false);
  }
  protected updateHasCellText(): void {
    this.setPropertyValue("hasCellText", !this.cells.isEmpty);
  }
  public setCellText(row: any, column: any, val: string) {
    this.cells.setCellText(row, column, val);
  }
  public getCellText(row: any, column: any): string {
    return this.cells.getCellText(row, column);
  }
  public setDefaultCellText(column: any, val: string) {
    this.cells.setDefaultCellText(column, val);
  }
  public getDefaultCellText(column: any): string {
    return this.cells.getDefaultCellText(column);
  }
  public getCellDisplayText(row: any, column: any): string {
    return this.cells.getCellDisplayText(row, column);
  }
  private emptyLocalizableString = new LocalizableString(this);
  public getCellDisplayLocText(row: any, column: any): LocalizableString {
    var loc = this.cells.getCellDisplayLocText(row, column);
    return loc ? loc : this.emptyLocalizableString;
  }
  supportAutoAdvance(): boolean {
    return this.isMouseDown === true && this.hasValuesInAllRows();
  }
  private errorsInRow: HashTable<boolean>;
  protected onCheckForErrors(errors: Array<SurveyError>, isOnValueChanged: boolean, fireCallback: boolean): void {
    super.onCheckForErrors(errors, isOnValueChanged, fireCallback);
    if (!isOnValueChanged || this.hasCssError()) {
      const rowsErrors = { noValue: false, isNotUnique: false };
      this.checkErrorsAllRows(fireCallback, rowsErrors);
      if (rowsErrors.noValue) {
        errors.push(new RequiredInAllRowsError(null, this));
      }
      if (rowsErrors.isNotUnique) {
        errors.push(new EachRowUniqueError(null, this));
      }
    }
  }
  private hasValuesInAllRows(): boolean {
    const rowsErrors = { noValue: false, isNotUnique: false };
    this.checkErrorsAllRows(false, rowsErrors, true);
    return !rowsErrors.noValue;
  }
  private checkErrorsAllRows(modifyErrors: boolean, res: { noValue: boolean, isNotUnique: boolean }, allRowsRequired?: boolean): void {
    var rows = this.generatedVisibleRows;
    if (!rows) rows = this.visibleRows;
    if (!rows) return;
    const rowsRequired = this.eachRowRequired || allRowsRequired;
    const rowsUnique = this.eachRowUnique;
    res.noValue = false;
    res.isNotUnique = false;
    if (modifyErrors) {
      this.errorsInRow = undefined;
    }
    if (!rowsRequired && !rowsUnique) return;
    const hash: HashTable<any> = {};
    for (var i = 0; i < rows.length; i++) {
      const val = rows[i].value;
      let isEmpty = this.isValueEmpty(val);
      const isNotUnique = rowsUnique && (!isEmpty && hash[val] === true);
      isEmpty = isEmpty && rowsRequired;
      if (modifyErrors && (isEmpty || isNotUnique)) {
        this.addErrorIntoRow(rows[i]);
      }
      if (!isEmpty) {
        hash[val] = true;
      }
      res.noValue = res.noValue || isEmpty;
      res.isNotUnique = res.isNotUnique || isNotUnique;
    }
    if (modifyErrors) {
      rows.forEach(row => {
        row.hasError = this.hasErrorInRow(row);
      });
    }
  }
  private addErrorIntoRow(row: MatrixRowModel): void {
    if (!this.errorsInRow) this.errorsInRow = {};
    this.errorsInRow[row.name] = true;
    row.hasError = true;
  }
  private refreshRowsErrors(): void {
    if (!this.errorsInRow) return;
    this.checkErrorsAllRows(true, { noValue: false, isNotUnique: false });
  }
  protected getIsAnswered(): boolean {
    return super.getIsAnswered() && this.hasValuesInAllRows();
  }
  private createMatrixRow(
    item: ItemValue,
    fullName: string,
    value: any
  ): MatrixRowModel {
    var row = new MatrixRowModel(item, fullName, this, value);
    this.onMatrixRowCreated(row);
    return row;
  }
  protected onMatrixRowCreated(row: MatrixRowModel) { }
  protected setQuestionValue(newValue: any, updateIsAnswered: boolean = true) {
    super.setQuestionValue(newValue, this.isRowChanging || updateIsAnswered);
    if (!this.generatedVisibleRows || this.generatedVisibleRows.length == 0)
      return;
    this.isRowChanging = true;
    var val = this.value;
    if (!val) val = {};
    if (this.rows.length == 0) {
      this.generatedVisibleRows[0].setValueDirectly(val);
    } else {
      for (var i = 0; i < this.generatedVisibleRows.length; i++) {
        var row = this.generatedVisibleRows[i];
        var rowVal = val[row.name];
        if (this.isValueEmpty(rowVal)) rowVal = null;
        this.generatedVisibleRows[i].setValueDirectly(rowVal);
      }
    }
    this.refreshRowsErrors();
    this.updateIsAnswered();
    this.isRowChanging = false;
  }
  protected getDisplayValueCore(keysAsText: boolean, value: any): any {
    var res: { [index: string]: any } = {};
    for (var key in value) {
      var newKey = keysAsText
        ? ItemValue.getTextOrHtmlByValue(this.rows, key)
        : key;
      if (!newKey) newKey = key;
      var newValue = ItemValue.getTextOrHtmlByValue(this.columns, value[key]);
      if (!newValue) newValue = value[key];
      res[newKey] = newValue;
    }
    return res;
  }
  public getPlainData(
    options: IPlainDataOptions = {
      includeEmpty: true,
    }
  ): IQuestionPlainData {
    var questionPlainData = super.getPlainData(options);
    if (!!questionPlainData) {
      var values = this.createValueCopy();
      questionPlainData.isNode = true;
      questionPlainData.data = Object.keys(values || {}).map((rowName) => {
        var row = this.rows.filter(
          (r: MatrixRowModel) => r.value === rowName
        )[0];
        var rowDataItem = <any>{
          name: rowName,
          title: !!row ? row.text : "row",
          value: values[rowName],
          displayValue: ItemValue.getTextOrHtmlByValue(
            this.visibleColumns,
            values[rowName]
          ),
          getString: (val: any) =>
            typeof val === "object" ? JSON.stringify(val) : val,
          isNode: false,
        };
        var item = ItemValue.getItemByValue(
          this.visibleColumns,
          values[rowName]
        );
        if (!!item) {
          (options.calculations || []).forEach((calculation) => {
            rowDataItem[calculation.propertyName] =
              item[calculation.propertyName];
          });
        }
        return rowDataItem;
      });
    }
    return questionPlainData;
  }
  public addConditionObjectsByContext(
    objects: Array<IConditionObject>,
    context: any
  ) {
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];
      if (!!row.value) {
        objects.push({
          name: this.getValueName() + "." + row.value,
          text: this.processedTitle + "." + row.calculatedText,
          question: this,
        });
      }
    }
  }
  public getConditionJson(operator: string = null, path: string = null): any {
    if (!path) return super.getConditionJson(operator);
    var question = new QuestionDropdownModel(path);
    question.choices = this.columns;
    var json = new JsonObject().toJsonObject(question);
    json["type"] = question.getType();
    return json;
  }
  public clearIncorrectValues(): void {
    this.clearInvisibleValuesInRowsAndColumns(true, true, true);
    super.clearIncorrectValues();
  }
  protected clearValueIfInvisibleCore(reason: string): void {
    super.clearValueIfInvisibleCore(reason);
    this.clearInvisibleValuesInRowsAndColumns(true, true, false);
  }
  protected clearInvisibleColumnValues(): void {
    this.clearInvisibleValuesInRowsAndColumns(false, true, false);
  }
  protected clearInvisibleValuesInRows(): void {
    this.clearInvisibleValuesInRowsAndColumns(true, false, false);
  }
  protected clearInvisibleValuesInRowsAndColumns(inRows: boolean, inColumns: boolean, inCorrectRows: boolean): void {
    if (this.isEmpty()) return;
    let updatedData = this.getUnbindValue(this.value);
    const newData: any = {};
    var rows = this.rows;
    for (var i = 0; i < rows.length; i++) {
      var key = rows[i].value;
      if (!!updatedData[key]) {
        if (inRows && !rows[i].isVisible || inColumns && !this.getVisibleColumnByValue(updatedData[key])) {
          delete updatedData[key];
        } else {
          newData[key] = updatedData[key];
        }
      }
    }
    if (inCorrectRows) {
      updatedData = newData;
    }
    if (this.isTwoValueEquals(updatedData, this.value)) return;
    this.value = updatedData;
  }
  private getVisibleColumnByValue(val: any): ItemValue {
    const col = ItemValue.getItemByValue(this.columns, val);
    return !!col && col.isVisible ? col : null;
  }
  protected getFirstInputElementId(): string {
    var rows = this.generatedVisibleRows;
    if (!rows) rows = this.visibleRows;
    if (rows.length > 0 && this.visibleColumns.length > 0) {
      return this.inputId + "_" + rows[0].name + "_" + 0;
    }
    return super.getFirstInputElementId();
  }
  //IMatrixData
  onMatrixRowChanged(row: MatrixRowModel) {
    if (this.isRowChanging) return;
    this.isRowChanging = true;
    if (!this.hasRows) {
      this.setNewValue(row.value);
    } else {
      var newValue = this.value;
      if (!newValue) {
        newValue = {};
      }
      newValue[row.name] = row.value;
      this.setNewValue(newValue);
    }
    this.isRowChanging = false;
  }
  getCorrectedRowValue(value: any): any {
    for (var i = 0; i < this.columns.length; i++) {
      if (value === this.columns[i].value) return value;
    }
    for (var i = 0; i < this.columns.length; i++) {
      if (this.isTwoValueEquals(value, this.columns[i].value))
        return this.columns[i].value;
    }
    return value;
  }
  hasErrorInRow(row: MatrixRowModel): boolean {
    return !!this.errorsInRow && !!this.errorsInRow[row.name];
  }
  protected getSearchableItemValueKeys(keys: Array<string>) {
    keys.push("columns");
    keys.push("rows");
  }

  private get SurveyModel() {
    return this.survey as SurveyModel;
  }
  public getColumnHeaderWrapperComponentName(cell: ItemValue) {
    return this.SurveyModel.getElementWrapperComponentName(
      { column: cell },
      "column-header"
    );
  }
  public getColumnHeaderWrapperComponentData(cell: ItemValue) {
    return this.SurveyModel.getElementWrapperComponentData(
      { column: cell },
      "column-header"
    );
  }
  public getRowHeaderWrapperComponentName(cell: ItemValue) {
    return this.SurveyModel.getElementWrapperComponentName(
      { row: cell },
      "row-header"
    );
  }
  public getRowHeaderWrapperComponentData(cell: ItemValue) {
    return this.SurveyModel.getElementWrapperComponentData(
      { row: cell },
      "row-header"
    );
  }
}

Serializer.addClass(
  "matrix",
  [
    "rowTitleWidth",
    {
      name: "columns:itemvalue[]", uniqueProperty: "value",
      baseValue: function () {
        return getLocaleString("matrix_column");
      },
    },
    {
      name: "rows:itemvalue[]", uniqueProperty: "value",
      baseValue: function () {
        return getLocaleString("matrix_row");
      },
    },
    { name: "cells:cells", serializationProperty: "cells" },
    {
      name: "rowOrder", alternativeName: "rowsOrder",
      default: "initial",
      choices: ["initial", "random"],
    },
    { name: "eachRowRequired:boolean", alternativeName: "isAllRowRequired" },
    { name: "eachRowUnique:boolean", category: "validation" },
    "hideIfRowsEmpty:boolean",
    { name: "cellComponent", visible: false, default: "survey-matrix-cell" }
  ],
  function () {
    return new QuestionMatrixModel("");
  },
  "matrixbase"
);

QuestionFactory.Instance.registerQuestion("matrix", (name) => {
  var q = new QuestionMatrixModel(name);
  q.rows = QuestionFactory.DefaultRows;
  q.columns = QuestionFactory.DefaultColums;
  return q;
});
