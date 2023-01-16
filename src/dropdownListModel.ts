import { Action, IAction } from "./actions/action";
import { Base, ComputedUpdater } from "./base";
import { ItemValue } from "./itemvalue";
import { property } from "./jsonobject";
import { ListModel } from "./list";
import { PopupModel } from "./popup";
import { Question } from "./question";
import { QuestionSelectBase } from "./question_baseselect";
import { IsTouch } from "./utils/devices";
import { doKey2ClickBlur, doKey2ClickUp } from "./utils/utils";

export class DropdownListModel extends Base {
  readonly minPageSize = 25;
  readonly loadingItemHeight = 40;

  private _popupModel: PopupModel;
  private focusFirstInputSelector = ".sv-list__item--selected";
  private itemsSettings: { skip: number, take: number, totalCount: number, items: any[] } = { skip: 0, take: 0, totalCount: 0, items: [] };
  private isRunningLoadQuestionChoices = false;
  protected listModel: ListModel;
  protected popupCssClasses = "sv-single-select-list";

  private resetItemsSettings() {
    this.itemsSettings.skip = 0;
    this.itemsSettings.take = Math.max(this.minPageSize, this.question.choicesLazyLoadPageSize);
    this.itemsSettings.totalCount = 0;
    this.itemsSettings.items = [];
  }

  private updateListItems() {
    this.listModel.setItems(this.getAvailableItems());
  }
  private setItems(items: Array<any>, totalCount: number) {
    this.itemsSettings.items = [].concat(this.itemsSettings.items, items);
    this.question.choices = this.itemsSettings.items;
    this.itemsSettings.totalCount = totalCount;
    this.listModel.isAllDataLoaded = this.question.choicesLazyLoadEnabled && this.question.choices.length == this.itemsSettings.totalCount;
    this.updateListItems();
  }

  private updateQuestionChoices(callbackAfterItemsLoaded?: () => void): void {
    if (this.isRunningLoadQuestionChoices) return;

    const isUpdate = (this.itemsSettings.skip + 1) < this.itemsSettings.totalCount;
    if (!this.itemsSettings.skip || isUpdate) {
      this.isRunningLoadQuestionChoices = true;
      this.question.survey.loadQuestionChoices({
        question: this.question,
        filter: this.filterString,
        skip: this.itemsSettings.skip,
        take: this.itemsSettings.take,
        setItems: (items: Array<any>, totalCount: number) => {
          this.isRunningLoadQuestionChoices = false;
          this.setItems(items || [], totalCount || 0);
          this.popupRecalculatePosition(this.itemsSettings.skip === this.itemsSettings.take);
          if (!!callbackAfterItemsLoaded) {
            callbackAfterItemsLoaded();
          }
        }
      });
      this.itemsSettings.skip += this.itemsSettings.take;
    }
  }

  private updatePopupFocusFirstInputSelector() {
    this._popupModel.focusFirstInputSelector = (!this.listModel.showFilter && !!this.question.value) ? this.focusFirstInputSelector : "";
  }

  private createPopup() {
    this._popupModel = new PopupModel("sv-list", { model: this.listModel }, "bottom", "center", false);
    this._popupModel.displayMode = IsTouch ? "overlay" : "popup";
    this._popupModel.positionMode = "fixed";
    this._popupModel.isFocusedContent = IsTouch;
    this._popupModel.setWidthByTarget = !IsTouch;
    this.updatePopupFocusFirstInputSelector();
    this.listModel.registerPropertyChangedHandlers(["showFilter"], () => {
      this.updatePopupFocusFirstInputSelector();
    });
    this._popupModel.cssClass = this.popupCssClasses;
    this._popupModel.onVisibilityChanged.add((_, option: { isVisible: boolean }) => {
      if (option.isVisible && this.question.choicesLazyLoadEnabled) {
        this.listModel.actions = [];
        this.updateQuestionChoices();
      }

      if (option.isVisible && !!this.question.onOpenedCallBack) {
        this.updatePopupFocusFirstInputSelector();
        this.question.onOpenedCallBack();
      }
      if (!option.isVisible) {
        this.onHidePopup();

        if (this.question.choicesLazyLoadEnabled) {
          this.resetItemsSettings();
        }
      }
    });
  }

  private setFilterStringToListModel(newValue: string): void {
    this.listModel.filterString = newValue;
    if (!this.listModel.focusedItem || !this.listModel.isItemVisible(this.listModel.focusedItem)) {
      this.listModel.focusFirstVisibleItem();
    }
  }

  protected popupRecalculatePosition(isResetHeight: boolean): void {
    setTimeout(() => {
      this.popupModel.recalculatePosition(isResetHeight);
    }, 1);
  }

  protected onHidePopup(): void {
    this.resetFilterString();
    this.listModel.refresh();
  }

  protected getAvailableItems(): Array<Action> {
    return this.question.visibleChoices.map((choice: ItemValue) => new Action({
      id: <any>new ComputedUpdater<boolean>(() => choice.value),
      data: choice,
      locTitle: choice.locText,
      component: <any>new ComputedUpdater<string>(() => this.question.itemComponent),
      visible: <any>new ComputedUpdater<boolean>(() => choice.isVisible),
      enabled: <any>new ComputedUpdater<boolean>(() => choice.isEnabled),
    }));
  }
  protected createListModel(): ListModel {
    const visibleItems = this.getAvailableItems();
    let _onSelectionChanged = this.onSelectionChanged;
    if (!_onSelectionChanged) {
      _onSelectionChanged = (item: IAction) => {
        this.question.value = item.id;
        this._popupModel.toggleVisibility();
      };
    }
    return new ListModel(visibleItems, _onSelectionChanged, false);
  }
  protected updateAfterListModelCreated(model: ListModel): void {
    model.isItemSelected = (action: Action) => {
      const question = <QuestionSelectBase>this.question;
      //need to remove this code after use visible choices as actions for list
      const item = ItemValue.getItemByValue(question.visibleChoices, action.id);
      return !!item ? question.isItemSelected(item) : false;
    };
    model.locOwner = this.question;
    model.onPropertyChanged.add((sender: any, options: any) => {
      if (options.name == "hasVerticalScroller") {
        this.hasScroll = options.newValue;
      }
    });
    model.isAllDataLoaded = !this.question.choicesLazyLoadEnabled;
  }
  public updateListCssClasses(listCssClasses: any) {
    this.listModel.cssClasses = listCssClasses;
  }
  protected resetFilterString(): void {
    if (!!this.filterString) {
      this.filterString = undefined;
    }
  }
  protected onSetFilterString(): void {
    if (!!this.filterString && !this.popupModel.isVisible) {
      this.popupModel.isVisible = true;
    }
    this.setInputHasValue(!!this.filterString);

    const updateAfterFilterStringChanged = () => {
      this.setFilterStringToListModel(this.filterString);
      this.popupRecalculatePosition(true);
    };

    if (this.question.choicesLazyLoadEnabled) {
      this.resetItemsSettings();
      this.updateQuestionChoices(updateAfterFilterStringChanged);
    } else {
      updateAfterFilterStringChanged();
    }
  }

  setInputHasValue(newValue: boolean): void {
    this.question.inputHasValue = newValue;
  }

  @property({ defaultValue: true }) searchEnabled: boolean;
  @property({
    defaultValue: "",
    onSet: (_, target: DropdownListModel) => {
      target.onSetFilterString();
    }
  }) filterString: string;
  @property({
    defaultValue: false,
    onSet: (newVal: boolean, target: DropdownListModel) => {
      if (newVal) {
        target.listModel.addScrollEventListener((e: any) => { target.onScroll(e); });
      } else {
        target.listModel.removeScrollEventListener();
      }
    }
  }) hasScroll: boolean;

  constructor(protected question: Question, protected onSelectionChanged?: (item: IAction, ...params: any[]) => void) {
    super();
    this.listModel = this.createListModel();
    this.updateAfterListModelCreated(this.listModel);
    this.setSearchEnabled(this.question.searchEnabled);
    this.createPopup();
    this.resetItemsSettings();
  }

  get popupModel(): PopupModel {
    return this._popupModel;
  }
  public get inputReadOnly(): boolean {
    return this.question.isInputReadOnly || this.searchEnabled;
  }
  public get filterStringEnabled(): boolean {
    return !this.question.isInputReadOnly && this.searchEnabled;
  }

  public setSearchEnabled(newValue: boolean) {
    this.listModel.searchEnabled = IsTouch;
    this.searchEnabled = newValue;
  }
  public updateItems(): void {
    this.updateListItems();
  }

  public onClick(event: any): void {
    this._popupModel.toggleVisibility();
    this.listModel.focusNextVisibleItem();

    if (this.searchEnabled && !!event && !!event.target) {
      const input = event.target.querySelector("input");
      if (!!input) {
        input.focus();
      }
    }
  }

  public onClear(event: any): void {
    this.question.clearValue();
    this.resetFilterString();
    event.preventDefault();
    event.stopPropagation();
  }

  public getSelectedAction(): Action {
    if (!!this.question.selectedItem) {
      return this.listModel.actions.filter(action => (this.question.selectedItem.value === action.id))[0];
    } else {
      return null;
    }
  }

  keyHandler(event: any): void {
    const char: number = event.which || event.keyCode;
    if (this.popupModel.isVisible && event.keyCode === 38) {
      this.listModel.focusPrevVisibleItem();
      this.scrollToFocusedItem();
      event.preventDefault();
      event.stopPropagation();
    } else if (event.keyCode === 40) {
      if (!this.popupModel.isVisible) {
        this.popupModel.toggleVisibility();
      }
      this.listModel.focusNextVisibleItem();
      this.scrollToFocusedItem();
      event.preventDefault();
      event.stopPropagation();
    } else if (this.popupModel.isVisible && (event.keyCode === 13 || event.keyCode === 32)) {
      this.listModel.selectFocusedItem();
      event.preventDefault();
      event.stopPropagation();
    } else if (char === 46) {
      this.onClear(event);
    } else if (event.keyCode === 27) {
      this.popupModel.isVisible = false;
    } else {
      if (event.keyCode === 38 || event.keyCode === 40 || event.keyCode === 32) {
        event.preventDefault();
        event.stopPropagation();
      }
      doKey2ClickUp(event, { processEsc: false, disableTabStop: this.question.isInputReadOnly });
    }
  }
  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if ((target.scrollHeight - (target.scrollTop + target.offsetHeight)) <= this.loadingItemHeight) {
      this.updateQuestionChoices();
    }
  }
  onBlur(event: any): void {
    if (this.popupModel.isVisible && IsTouch) {
      this._popupModel.isVisible = true;
      return;
    }
    if (this.popupModel.isVisible && !!this.filterString) {
      this.listModel.selectFocusedItem();
    }
    this.resetFilterString();
    this._popupModel.isVisible = false;
    this.setInputHasValue(false);
    doKey2ClickBlur(event);
  }
  scrollToFocusedItem(): void {
    this.listModel.scrollToFocusedItem();
  }
}