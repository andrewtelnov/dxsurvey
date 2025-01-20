import {
  QuestionMatrixDropdownModelBase,
  MatrixDropdownRowModelBase,
  IMatrixDropdownData,
} from "./question_matrixdropdownbase";
import { Serializer } from "./jsonobject";
import { ItemValue } from "./itemvalue";
import { QuestionFactory } from "./questionfactory";
import { LocalizableString } from "./localizablestring";
import { IProgressInfo } from "./base-interfaces";
import { Helpers } from "./helpers";
import { Question } from "./question";

export class MatrixDropdownRowModel extends MatrixDropdownRowModelBase {
  private item: ItemValue;
  constructor(
    public name: string,
    item: ItemValue,
    data: IMatrixDropdownData,
    value: any
  ) {
    super(data, value);
    this.item = item;
    this.buildCells(value);
  }
  public get rowName(): string {
    return this.name;
  }
  public get text(): string {
    return this.item.text;
  }
  public get locText(): LocalizableString {
    return this.item.locText;
  }
  protected isItemVisible(): boolean { return this.item.isVisible; }
  public isRowEnabled(): boolean { return this.item.isEnabled; }
  protected isRowHasEnabledCondition(): boolean { return !!this.item.enableIf; }
  protected setRowsVisibleIfValues(values: any): void {
    values["item"] = this.item.value;
    values["choice"] = this.item.value;
  }
}
/**
  * A class that describes the Multi-Select Matrix question type. Multi-Select Matrix allows you to use the [Dropdown](https://surveyjs.io/form-library/documentation/questiondropdownmodel), [Checkbox](https://surveyjs.io/form-library/documentation/questioncheckboxmodel), [Radiogroup](https://surveyjs.io/form-library/documentation/questionradiogroupmodel), [Text](https://surveyjs.io/form-library/documentation/questiontextmodel), and [Comment](https://surveyjs.io/form-library/documentation/questioncommentmodel) question types as cell editors.
 *
 * [View Demo](https://surveyjs.io/form-library/examples/questiontype-matrixdropdown/ (linkStyle))
 */
export class QuestionMatrixDropdownModel extends QuestionMatrixDropdownModelBase
  implements IMatrixDropdownData {
  constructor(name: string) {
    super(name);
    this.createLocalizableString("totalText", this, true);
    this.registerPropertyChangedHandlers(["rows"], () => {
      if(!this.generatedVisibleRows) return;
      this.clearGeneratedRows();
      this.resetRenderedTable();
      this.getVisibleRows();
      this.clearIncorrectValues();
    });
    this.registerPropertyChangedHandlers(["hideIfRowsEmpty"], () => {
      this.updateVisibilityBasedOnRows();
    });
  }
  public getType(): string {
    return "matrixdropdown";
  }
  /**
   * A title for the total row. Applies if at least one column displays total values.
   * @see rowTitleWidth
   * @see columns
   */
  public get totalText() {
    return this.getLocalizableStringText("totalText", "");
  }
  public set totalText(val: string) {
    this.setLocalizableStringText("totalText", val);
  }
  public get locTotalText(): LocalizableString {
    return this.getLocalizableString("totalText");
  }
  public getFooterText(): LocalizableString {
    return this.locTotalText;
  }
  public getRowTitleWidth(): string {
    return this.rowTitleWidth;
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
  protected getSingleInputRowLocalizationTitle(): string { return "rowNameTemplateTitle"; }
  protected getDisplayValueCore(keysAsText: boolean, value: any): any {
    if (!value) return value;
    var rows = this.visibleRows;
    var res = {};
    if (!rows) return res;
    for (var i = 0; i < rows.length; i++) {
      var rowName = rows[i].rowName;
      var val = value[rowName];
      if (!val) continue;
      if (keysAsText) {
        var displayRowValue = ItemValue.getTextOrHtmlByValue(
          this.rows,
          rowName
        );
        if (!!displayRowValue) {
          rowName = displayRowValue;
        }
      }
      (<any>res)[rowName] = this.getRowDisplayValue(keysAsText, rows[i], val);
    }
    return res;
  }
  protected getConditionObjectRowName(index: number): string {
    return "." + this.rows[index].value;
  }
  protected getConditionObjectRowText(index: number): string {
    return "." + this.rows[index].calculatedText;
  }
  protected getConditionObjectsRowIndeces() : Array<number> {
    const res = [];
    for (var i = 0; i < this.rows.length; i++) res.push(i);
    return res;
  }
  protected isNewValueCorrect(val: any): boolean {
    return Helpers.isValueObject(val, true);
  }
  public clearIncorrectValues(): void {
    if(!this.isEmpty()) {
      this.getVisibleRows();
      const newVal: any = {};
      const val = this.value;
      for(let key in val) {
        const row = this.getRowByKey(key);
        if(!!row && row.isVisible) {
          newVal[key] = val[key];
        }
      }
      this.value = newVal;
    }
    super.clearIncorrectValues();
  }
  private getRowByKey(val: any): MatrixDropdownRowModelBase {
    const rows = this.generatedVisibleRows;
    if(!rows) return null;
    for(let i = 0; i < rows.length; i ++) {
      if(rows[i].rowName === val) return rows[i];
    }
    return null;
  }
  private defaultValuesInRows: any = {};
  protected clearGeneratedRows(): void {
    if (!this.generatedVisibleRows) return;
    if(!this.isDisposed) {
      this.generatedVisibleRows.forEach(row => {
        this.defaultValuesInRows[row.rowName] = row.getNamesWithDefaultValues();
      });
    }
    super.clearGeneratedRows();
  }
  private getRowValueForCreation(val: any, rowName: any): any {
    const res = val[rowName];
    if(!res) return res;
    const names = this.defaultValuesInRows[rowName];
    if(!Array.isArray(names) || names.length === 0) return res;
    names.forEach(name => {
      delete res[name];
    });
    return res;
  }
  protected generateRows(): Array<MatrixDropdownRowModel> {
    var result = new Array<MatrixDropdownRowModel>();
    var rows = this.rows;
    if (!rows || rows.length === 0) return result;
    var val = this.value;
    if (!val) val = {};
    for (var i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (this.isValueEmpty(row.value)) continue;
      result.push(this.createMatrixRow(row, this.getRowValueForCreation(val, row.value)));
    }
    return result;
  }
  protected createMatrixRow(item: ItemValue, value: any): MatrixDropdownRowModel {
    return new MatrixDropdownRowModel(item.value, item, this, value);
  }
  protected getFilteredDataCore(): any {
    const res: any = {};
    const val = this.createValueCopy();
    this.generatedVisibleRows.forEach(row => {
      const rowVal = val[row.rowName];
      if(row.isVisible && !Helpers.isValueEmpty(rowVal)) {
        res[row.rowName] = rowVal;
      }
    });
    return res;
  }
  protected getSearchableItemValueKeys(keys: Array<string>) {
    keys.push("rows");
  }
  protected updateProgressInfoByValues(res: IProgressInfo): void {
    let val = this.value;
    if(!val) val = {};
    for(var i = 0; i < this.rows.length; i ++) {
      const row = this.rows[i];
      const rowName = val[row.value];
      this.updateProgressInfoByRow(res, !!rowName ? rowName : {});
    }
  }
}

Serializer.addClass(
  "matrixdropdown",
  [
    {
      name: "rows:itemvalue[]", uniqueProperty: "value"
    },
    "rowsVisibleIf:condition",
    "rowTitleWidth",
    { name: "totalText", serializationProperty: "locTotalText" },
    "hideIfRowsEmpty:boolean"
  ],
  function() {
    return new QuestionMatrixDropdownModel("");
  },
  "matrixdropdownbase"
);

QuestionFactory.Instance.registerQuestion("matrixdropdown", (name) => {
  var q = new QuestionMatrixDropdownModel(name);
  q.choices = [1, 2, 3, 4, 5];
  q.rows = QuestionFactory.DefaultRows;
  QuestionMatrixDropdownModelBase.addDefaultColumns(q);
  return q;
});
