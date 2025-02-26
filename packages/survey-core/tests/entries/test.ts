// common
export * from "../a11y";
export * from "../calculatedvaluestests";
export * from "../helperstests";
export * from "../basetests"; //
export * from "../surveyElementTests";
export * from "../editingObjectTests";
export * from "../bindablePropertiesTests";
export * from "../localizablestringtests";
export * from "../choicesRestfultests"; //
export * from "../jsonobjecttests"; //
export * from "../jsonSchemaTests";
export * from "../surveyLocalizationTests"; //
export * from "../surveyquestiontests"; //
export * from "../question_matrixdynamictests";
export * from "../question_matrixdropdownbasetests";
export * from "../question_paneldynamic_tests";
export * from "../surveyserializationtests"; //
export * from "../surveytests"; //
export * from "../surveyWindowTests"; //
export * from "../surveywidthmodetests"; //
export * from "../surveytriggertests"; //
export * from "../surveyvalidatortests"; //
export * from "../surveyShowPreviewTests";
export * from "../surveyProgressButtonsTest";
export * from "../textPreprocessorTests"; //
export * from "../lowercasetests";
export * from "../elementslayouttests";
export * from "../surveytimertests";
export * from "../question_multipletexttests";
export * from "../question_expressiontests";
export * from "../questionFileTests";
export * from "../dragdropcoretests";
export * from "../dragdrophelpertests";
export * from "../expressions/expressionsTest"; //
export * from "../expressions/expressionParserTest"; //
export * from "../questionDropdownTests";
export * from "../questionImagepicker";
export * from "../questionBooleanTests";
export * from "../question_baseselecttests";
export * from "../question_imagetests";
export * from "../question_imagepickertests";
export * from "../question_ratingtests";
export * from "../question_texttests";
export * from "../question_customtests";
export * from "../question_ranking_tests";
export * from "../question_signaturepadtests";
export * from "../question_matrix_base_tests";
export * from "../question_matrix_tests";
export * from "../question_tagbox_tests";
export * from "../question_comment_tests";
export * from "../cssClassBuilderTests";
export * from "../listModelTests";
export * from "../dropdown_list_model_test";
export * from "../multi_select_list_model_tests";
export * from "../dropdown_multi_select_list_model_test";
export * from "../notifier_tests";
export * from "../surveyTOCTests";
export * from "../paneltests";
export * from "../dragDropMatrixTests";

export * from "../renderFactoryTests";
export * from "../components/popuptests";
export * from "../components/actionbartests";
export * from "../icons/icons";
export * from "../components/liststests";
export * from "../responsivityTests";
export * from "../icons/svgRegistryTests";
export * from "../utilstests";
export * from "../mask/input_mask_tests";
export * from "../mask/mask_pattern_tests";
export * from "../mask/mask_number_tests";
export * from "../mask/mask_currency_tests";
export * from "../mask/lexical_analyzer_tests";
export * from "../mask/syntactic_analyzer_tests";
export * from "../mask/mask_datetime_tests";
export * from "../mask/mask_settings_tests";
export * from "../mask/multipletext_mask_settings_tests";
export * from "../headerTests";
export * from "../layout_tests";
export * from "../inputPerPageTests";
export * from "../surveyServiceRemovingTests";

// localization
import "../../src/localization/russian";
import "../../src/localization/french";
import "../../src/localization/finnish";
import "../../src/localization/german";
import { settings } from "../../src/settings";

settings.animationEnabled = false;
settings.dropdownSearchDelay = 0;
