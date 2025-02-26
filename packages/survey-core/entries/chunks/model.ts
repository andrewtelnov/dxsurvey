// styles
// import "../../src/main.scss";
//import "../../src/modern.scss";

import { DomWindowHelper } from "../../src/global_variables_utils";
import { settings } from "../../src/settings";

export var Version: string;
export var ReleaseDate: string;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
Version = `${process.env.VERSION}`;
settings.version = Version;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
ReleaseDate = `${process.env.RELEASE_DATE}`;

export function checkLibraryVersion(ver: string, libraryName: string): void {
  if (Version != ver) {
    const str = "survey-core has version '" + Version + "' and " + libraryName
      + " has version '" + ver + "'. SurveyJS libraries should have the same versions to work correctly.";
    /* eslint no-console: ["error", { allow: ["error"] }] */
    console.error(str);
  }
}
export function setLicenseKey(key: string): void {
  slk(key);
}
export function slk(key: string): void {
  _slk(key, lic, ReleaseDate);
}
export function hasLicense(index: number): boolean {
  return lic[index.toString()] === true;
}
const lic: any = {};
function _slk(k: any, lh: any, rd: any) {
  if (!k) return;
  const en = (s: string) => {
    var e: any = {}, i, b = 0, c, x, l = 0, a, r = "", w = String.fromCharCode, L = s.length;
    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0; i < 64; i++) { e[A.charAt(i)] = i; }
    for (x = 0; x < L; x++) {
      let c = e[s.charAt(x)]; b = (b << 6) + c; l += 6;
      while (l >= 8) { ((a = (b >>> (l -= 8)) & 0xff) || (x < (L - 2))) && (r += w(a)); }
    }
    return r;
  };
  let v = en(k);
  if (!v) return;
  let index = v.indexOf(";");
  if (index < 0) return;
  if (!checkPrefix(v.substring(0, index))) return;
  v = v.substring(index + 1);
  v.split(",").forEach(s => {
    let i = s.indexOf("=");
    if (i > 0) {
      lh[s.substring(0, i)] = new Date(rd) <= new Date(s.substring(i + 1));
    }
  });
}
function checkPrefix(prefix: string): boolean {
  if (!prefix) return true;
  const s = "domains:";
  const index = prefix.indexOf(s);
  if (index < 0) return true;
  const ds = prefix.substring(index + s.length).toLowerCase().split(",");
  if (!Array.isArray(ds) || ds.length === 0) return true;
  const location = DomWindowHelper.getLocation();
  if (!!location && !!location.hostname) {
    const hn = location.hostname.toLowerCase();
    ds.push("localhost");
    for (let i = 0; i < ds.length; i++) {
      if (hn.indexOf(ds[i]) > -1) return true;
    }
    return false;
  }
  return true;
}

export { settings, ISurveyEnvironment } from "../../src/settings";
export { Helpers, HashTable } from "../../src/helpers";
export {
  AnswerCountValidator,
  EmailValidator,
  NumericValidator,
  RegexValidator,
  SurveyValidator,
  TextValidator,
  ValidatorResult,
  ExpressionValidator,
  ValidatorRunner
} from "../../src/validator";
export { ItemValue } from "../../src/itemvalue";
export { Base, Event, EventBase, ArrayChanges, ComputedUpdater } from "../../src/base";
export {
  ISurvey,
  ISurveyElement,
  IElement,
  IQuestion,
  IPage,
  IPanel,
  ISurveyData,
  ITitleOwner,
  ISurveyLayoutElement,
  IPlainDataOptions as IPlainData,
  IShortcutText,
  ILoadFromJSONOptions,
  ISaveToJSONOptions,
  HorizontalAlignment,
  VerticalAlignment
} from "../../src/base-interfaces";
export { SurveyError } from "../../src/survey-error";
export { SurveyElementCore, SurveyElement, DragTypeOverMeEnum } from "../../src/survey-element";
export { CalculatedValue } from "../../src/calculatedValue";
export {
  CustomError,
  AnswerRequiredError,
  OneAnswerRequiredError,
  RequreNumericError,
  ExceedSizeError
} from "../../src/error";
export {
  ILocalizableOwner,
  ILocalizableString,
  LocalizableString,
  LocalizableStrings
} from "../../src/localizablestring";
export { HtmlConditionItem, UrlConditionItem } from "../../src/expressionItems";
export { ChoicesRestful, ChoicesRestfull } from "../../src/choicesRestful";
export { FunctionFactory, registerFunction } from "../../src/functionsfactory";
export { ConditionRunner, ExpressionRunner, IExpresionExecutor, ExpressionExecutor } from "../../src/conditions";
export {
  Operand,
  Const,
  BinaryOperand,
  Variable,
  FunctionOperand,
  ArrayOperand,
  UnaryOperand
} from "../../src/expressions/expressions";
export { ConditionsParser } from "../../src/conditionsParser";
export { ProcessValue } from "../../src/conditionProcessValue";
export {
  JsonError,
  JsonIncorrectTypeError,
  JsonMetadata,
  JsonMetadataClass,
  JsonMissingTypeError,
  JsonMissingTypeErrorBase,
  JsonObject,
  IJsonPropertyInfo,
  JsonObjectProperty,
  JsonRequiredPropertyError,
  JsonUnknownPropertyError,
  Serializer,
  property,
  propertyArray
} from "../../src/jsonobject";
export {
  IMatrixDropdownData,
  MatrixDropdownCell,
  MatrixDropdownRowModelBase,
  QuestionMatrixDropdownModelBase
} from "../../src/question_matrixdropdownbase";
export { MatrixDropdownColumn, matrixDropdownColumnTypes } from "../../src/question_matrixdropdowncolumn";
export { QuestionMatrixDropdownRenderedCell, QuestionMatrixDropdownRenderedRow, QuestionMatrixDropdownRenderedErrorRow, QuestionMatrixDropdownRenderedTable } from "../../src/question_matrixdropdownrendered";
export {
  MatrixDropdownRowModel,
  QuestionMatrixDropdownModel
} from "../../src/question_matrixdropdown";
export {
  MatrixDynamicRowModel,
  QuestionMatrixDynamicModel
} from "../../src/question_matrixdynamic";
export {
  MatrixRowModel,
  MatrixCells,
  QuestionMatrixModel,
  IMatrixData
} from "../../src/question_matrix";
export { QuestionMatrixBaseModel } from "../../src/martixBase";
export {
  MultipleTextItemModel,
  MultipleTextCell,
  MultipleTextErrorCell,
  MutlipleTextErrorRow,
  MutlipleTextRow,
  QuestionMultipleTextModel,
  MultipleTextEditorModel
} from "../../src/question_multipletext";
export { PanelModel, PanelModelBase, QuestionRowModel } from "../../src/panel";
export { FlowPanelModel } from "../../src/flowpanel";
export { PageModel } from "../../src/page";
export * from "../../src/template-renderer";
export { DefaultTitleModel } from "../../src/defaultTitle";
export { Question } from "../../src/question";
export { QuestionSingleInputSummary, QuestionSingleInputSummaryItem } from "../../src/questionSingleInputSummary";
export { QuestionNonValue } from "../../src/questionnonvalue";
export { QuestionEmptyModel } from "../../src/question_empty";
export {
  QuestionCheckboxBase,
  QuestionSelectBase
} from "../../src/question_baseselect";
export { QuestionCheckboxModel } from "../../src/question_checkbox";
export { QuestionTagboxModel } from "../../src/question_tagbox";
export { QuestionRankingModel } from "../../src/question_ranking";
export { QuestionCommentModel } from "../../src/question_comment";
export { QuestionDropdownModel } from "../../src/question_dropdown";
export { QuestionFactory, ElementFactory } from "../../src/questionfactory";
export { QuestionFileModel, QuestionFilePage } from "../../src/question_file";
export { QuestionHtmlModel } from "../../src/question_html";
export { QuestionRadiogroupModel } from "../../src/question_radiogroup";
export { QuestionRatingModel, RenderedRatingItem } from "../../src/question_rating";
export { QuestionExpressionModel } from "../../src/question_expression";
export { QuestionTextBase, CharacterCounter } from "../../src/question_textbase";
export { QuestionTextModel } from "../../src/question_text";
export { QuestionBooleanModel } from "../../src/question_boolean";
export {
  QuestionImagePickerModel,
  ImageItemValue
} from "../../src/question_imagepicker";
export { QuestionImageModel } from "../../src/question_image";
export { QuestionSignaturePadModel } from "../../src/question_signaturepad";
export {
  QuestionPanelDynamicModel,
  QuestionPanelDynamicItem
} from "../../src/question_paneldynamic";
export { SurveyTimer } from "../../src/surveytimer";
export { SurveyTimerModel } from "../../src/surveyTimerModel";
export * from "../../src/surveyToc";
export { SurveyProgressModel } from "../../src/surveyProgress";
export { ProgressButtons, ProgressButtonsResponsivityManager, IProgressButtonsViewModel } from "../../src/progress-buttons";
export * from "../../src/themes";
export { SurveyModel } from "../../src/survey";
export * from "../../src/survey-events-api";
export {
  SurveyTrigger,
  SurveyTriggerComplete,
  SurveyTriggerSetValue,
  SurveyTriggerVisible,
  SurveyTriggerCopyValue,
  SurveyTriggerRunExpression,
  SurveyTriggerSkip,
  Trigger
} from "../../src/trigger";
export { PopupSurveyModel, SurveyWindowModel } from "../../src/popup-survey";
export { TextPreProcessor } from "../../src/textPreProcessor";
export { Notifier } from "../../src/notifier";
export { Cover, CoverCell } from "../../src/header";

export { englishStrings } from "../../src/localization/english";
export { surveyLocalization, surveyStrings, getLocaleString, getLocaleStrings, setupLocale } from "../../src/surveyStrings";
// export { cultureInfo } from "../../src/cultureInfo";
export {
  QuestionCustomWidget,
  CustomWidgetCollection,
} from "../../src/questionCustomWidgets";
export {
  QuestionCustomModel,
  QuestionCompositeModel,
  ComponentQuestionJSON,
  ComponentCollection,
  ICustomQuestionTypeConfiguration
} from "../../src/question_custom";

export { ListModel } from "../../src/list";
export { MultiSelectListModel } from "../../src/multiSelectListModel";
export { PopupModel, IDialogOptions } from "../../src/popup";
export { PopupBaseViewModel } from "../../src/popup-view-model";
export { PopupDropdownViewModel } from "../../src/popup-dropdown-view-model";
export { PopupModalViewModel } from "../../src/popup-modal-view-model";
export { createPopupViewModel, createPopupModalViewModel } from "../../src/popup-utils";
export { DropdownListModel } from "../../src/dropdownListModel";
export { DropdownMultiSelectListModel } from "../../src/dropdownMultiSelectListModel";
export {
  QuestionButtonGroupModel,
  ButtonGroupItemModel,
  ButtonGroupItemValue
} from "../../src/question_buttongroup";
export { IsMobile, IsTouch, _setIsTouch } from "../../src/utils/devices";
export {
  confirmAction,
  confirmActionAsync,
  detectIEOrEdge,
  doKey2ClickUp,
  doKey2ClickDown,
  doKey2ClickBlur,
  loadFileFromBase64,
  increaseHeightByContent,
  createSvg,
  chooseFiles,
  sanitizeEditableContent,
  prepareElementForVerticalAnimation,
  cleanHtmlElementAfterAnimation,
  classesToSelector,
  IAttachKey2clickOptions,
  renamedIcons,
  getIconNameFromProxy
} from "../../src/utils/utils";
export { InputMaskBase } from "../../src/mask/mask_base";
export { InputMaskPattern } from "../../src/mask/mask_pattern";
export { InputMaskNumeric } from "../../src/mask/mask_numeric";
export { InputMaskDateTime } from "../../src/mask/mask_datetime";
export { InputMaskCurrency } from "../../src/mask/mask_currency";
export * from "../../src/utils/cssClassBuilder";
export * from "../../src/utils/text-area";

export { surveyCss, defaultCss, defaultThemeName } from "../../src/defaultCss/defaultCss";

//Uncomment to include the "date" question type.
//export {default as QuestionDateModel} from "../../src/plugins/question_date";

export { DragDropCore } from "../../src/dragdrop/core";
export { DragDropChoices } from "../../src/dragdrop/choices";
export { DragDropRankingSelectToRank } from "../../src/dragdrop/ranking-select-to-rank";
