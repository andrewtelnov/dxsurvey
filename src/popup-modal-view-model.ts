import { CssClassBuilder } from "./utils/cssClassBuilder";
import { PopupModel } from "./popup";
import { PopupBaseViewModel } from "./popup-view-model";
import { IAction } from "./actions/action";
export class PopupModalViewModel extends PopupBaseViewModel {

  protected getStyleClass(): CssClassBuilder {
    return super.getStyleClass()
      .append("sv-popup--modal", !this.isOverlay);
  }
  protected getShowFooter(): boolean {
    return true;
  }
  protected createFooterActionBar(): void {
    super.createFooterActionBar();

    this.footerToolbarValue.addAction(<IAction>{
      id: "apply",
      visibleIndex: 20,
      title: this.applyButtonText,
      innerCss: "sv-popup__body-footer-item sv-popup__button sv-popup__button--apply sd-btn sd-btn--action",
      action: () => { this.apply(); }
    });
  }

  constructor(model: PopupModel) {
    super(model);
  }

  public get applyButtonText(): string {
    return this.getLocalizationString("modalApplyButtonText");
  }
  public apply(): void {
    if (!!this.model.onApply && !this.model.onApply()) return;
    this.hidePopup();
  }

  public clickOutside(): void {
    return;
  }
  public onKeyDown(event: any): void {
    if(event.key === "Escape" || event.keyCode === 27) {
      this.model.onCancel();
    }
    super.onKeyDown(event);
  }
}