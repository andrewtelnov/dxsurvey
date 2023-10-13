import { surveyLocalization } from "survey-core";

export var bulgarianStrings = {
  pagePrevText: "Назад",
  pageNextText: "Напред",
  completeText: "Край",
  previewText: "Визуализация",
  editText: "редактиране",
  startSurveyText: "Начало",
  otherItemText: "Друго (опишете)",
  noneItemText: "Нито един",
  selectAllItemText: "Всички",
  progressText: "стр. {0}, общо стр. {1}",
  indexText: "{0} на {1}",
  panelDynamicProgressText: "Запис {0} от {1}",
  panelDynamicTabTextFormat: "Панел {panelIndex}",
  questionsProgressText: "Отговорени на {0} / {1} въпроса",
  emptySurvey: "Анкетата не съдържа видими страници или въпроси.",
  completingSurvey: "Благодарим ви за участието в анкетата!",
  completingSurveyBefore: "Изглежда, че вие вече сте попълнили анкетата.",
  loadingSurvey: "Зареждане на анкетата...",
  placeholder: "Изберете...",
  ratingOptionsCaption: "Отбран...",
  value: "value",
  requiredError: "Моля, отговорете на следния въпрос.",
  requiredErrorInPanel: "Моля, отговорете поне на един от въпросите.",
  requiredInAllRowsError: "Моля, отговорете на въпросите на всички редове.",
  numericError: "Стойността следва да бъде число.",
  minError: "Стойността не трябва да бъде по-малка от {0}",
  maxError: "Стойността не трябва да бъде по-голяма от {0}",
  textMinLength: "Моля, използвайте поне {0} символа.",
  textMaxLength: "Моля, използвайте не повече от {0} символа.",
  textMinMaxLength: "Моля, използвайте повече от {0} и по-малко от {1} символа.",
  minRowCountError: "Моля, попълнете поне {0} реда.",
  minSelectError: "Моля, изберете поне {0} варианта.",
  maxSelectError: "Моля, изберете не повече от {0} варианта.",
  numericMinMax: "Стойността '{0}' следва да бъде равна или по-голяма от {1} и равна или по-малка от {2}",
  numericMin: "Стойността '{0}' следва да бъде равна или по-голяма от {1}",
  numericMax: "Стойността '{0}' следва да бъде равна или по-малка от {1}",
  invalidEmail: "Моля, въведете валиден адрес на електронна поща.",
  invalidExpression: "Изразът: {0} трябва да дава резултат 'true' (истина).",
  urlRequestError: "Заявката води до грешка '{0}'. {1}",
  urlGetChoicesError: "Заявката не връща данни или частта 'path' (път до търсения ресурс на сървъра) е неправилно зададена",
  exceedMaxSize: "Размерът на файла следва да не превишава {0}.",
  otherRequiredError: "Моля, въведете другата стойност.",
  uploadingFile: "Вашит файл се зарежда на сървъра. Моля, изчакайте няколко секунди и тогава опитвайте отново.",
  loadingFile: "Зареждане...",
  chooseFile: "Изберете файл(ове)...",
  noFileChosen: "Няма избран файл",
  fileDragAreaPlaceholder: "Плъзнете и пуснете файл тук или щракнете върху бутона по-долу и изберете файл за качване.",
  confirmDelete: "Желаете ли да изтриете записа?",
  keyDuplicationError: "Стойността следва да бъде уникална.",
  addColumn: "Добавяне на колона",
  addRow: "Добавяне на ред",
  removeRow: "Премахване на ред",
  emptyRowsText: "Няма редове.",
  addPanel: "Добавяне на панел",
  removePanel: "Премахване на панел",
  choices_Item: "елемент",
  matrix_column: "Колона",
  matrix_row: "Ред",
  multipletext_itemname: "Текст",
  savingData: "Резултатите се запазват на сървъра...",
  savingDataError: "Поради възникнала грешка резултатите не можаха да бъдат запазени.",
  savingDataSuccess: "Резултатите бяха запазени успешно!",
  saveAgainButton: "Нов опит",
  timerMin: "мин",
  timerSec: "сек",
  timerSpentAll: "Вие използвахте {0} на тази страница и общо {1}.",
  timerSpentPage: "Вие използвахте {0} на тази страница.",
  timerSpentSurvey: "Вие използвахте общо {0}.",
  timerLimitAll: "Вие изпозвахте {0} от {1} на тази страница и общо {2} от {3}.",
  timerLimitPage: "Вие използвахте {0} от {1} на тази страница.",
  timerLimitSurvey: "Вие използвахте общо {0} от {1}.",
  clearCaption: "Начално състояние",
  signaturePlaceHolder: "Подпишете тук",
  chooseFileCaption: "Изберете файл",
  takePhotoCaption: "Направете снимка",
  cameraPlaceHolder: "Кликнете върху бутона по-долу, за да направите снимка с помощта на камерата.",
  fileCameraDragAreaPlaceHolder: "Плъзнете и пуснете или изберете файл за качване или правене на снимка с помощта на камерата.",
  replaceFileCaption: "Заместване на файл",
  removeFileCaption: "Премахване на файла",
  booleanCheckedLabel: "Да",
  booleanUncheckedLabel: "Не",
  confirmRemoveFile: "Наистина ли искате да премахнете този файл: {0}?",
  confirmRemoveAllFiles: "Наистина ли искате да премахнете всички файлове?",
  questionTitlePatternText: "Заглавие на въпроса",
  modalCancelButtonText: "Отмени",
  modalApplyButtonText: "Прилагам",
  filterStringPlaceholder: "Въведете за търсене...",
  emptyMessage: "Няма данни за показване",
  noEntriesText: "Все още няма записи.\nЩракнете върху бутона по-долу, за да добавите нов запис.",
  noEntriesReadonlyText: "Няма записи.",
  more: "Още",
  tagboxDoneButtonCaption: "Добре",
  selectToRankEmptyRankedAreaText: "Всички възможности за избор са класирани",
  selectToRankEmptyUnrankedAreaText: "Плъзнете и пуснете опции тук, за да ги класирате"
};

surveyLocalization.locales["bg"] = bulgarianStrings;
surveyLocalization.localeNames["bg"] = "български";

// The following strings have been translated by a machine translation service
// Remove those strings that you have corrected manually
// indexText: "{0} of {1}" => "{0} на {1}"
// panelDynamicTabTextFormat: "Panel {panelIndex}" => "Панел {panelIndex}"
// ratingOptionsCaption: "Select..." => "Отбран..."
// minError: "The value should not be less than {0}" => "Стойността не трябва да бъде по-малка от {0}"
// maxError: "The value should not be greater than {0}" => "Стойността не трябва да бъде по-голяма от {0}"
// fileDragAreaPlaceholder: "Drag and drop a file here or click the button below and choose a file to upload." => "Плъзнете и пуснете файл тук или щракнете върху бутона по-долу и изберете файл за качване."
// emptyRowsText: "There are no rows." => "Няма редове."
// multipletext_itemname: "text" => "Текст"
// signaturePlaceHolder: "Sign here" => "Подпишете тук"
// modalCancelButtonText: "Cancel" => "Отмени"
// modalApplyButtonText: "Apply" => "Прилагам"
// filterStringPlaceholder: "Type to search..." => "Въведете за търсене..."
// emptyMessage: "No data to display" => "Няма данни за показване"
// noEntriesText: "There are no entries yet.\nClick the button below to add a new entry." => "Все още няма записи.\nЩракнете върху бутона по-долу, за да добавите нов запис."
// noEntriesReadonlyText: "There are no entries." => "Няма записи."
// more: "More" => "Още"
// tagboxDoneButtonCaption: "OK" => "Добре"
// selectToRankEmptyRankedAreaText: "All choices are ranked" => "Всички възможности за избор са класирани"
// selectToRankEmptyUnrankedAreaText: "Drag and drop choices here to rank them" => "Плъзнете и пуснете опции тук, за да ги класирате"// takePhotoCaption: "Take Photo" => "Направете снимка"
// cameraPlaceHolder: "Click the button below to take a photo using the camera." => "Кликнете върху бутона по-долу, за да направите снимка с помощта на камерата."
// fileCameraDragAreaPlaceHolder: "Drag and drop or select a file to upload or take a photo using the camera." => "Плъзнете и пуснете или изберете файл за качване или правене на снимка с помощта на камерата."
// replaceFileCaption: "Replace file" => "Заместване на файл"