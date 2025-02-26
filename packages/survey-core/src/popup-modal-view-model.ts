import { CssClassBuilder } from "./utils/cssClassBuilder";
import { PopupModel } from "./popup";
import { PopupBaseViewModel } from "./popup-view-model";
import { IAction } from "./actions/action";
import { preventDefaults } from "./utils/utils";

export class PopupModalViewModel extends PopupBaseViewModel {
  protected getStyleClass(): CssClassBuilder {
    const displayMode = this.model.getDisplayMode();
    return super.getStyleClass()
      // .append("sv-popup--modal", !this.isOverlay);
      .append("sv-popup--modal", displayMode === "modal-popup")
      .append("sv-popup--modal-overlay", displayMode === "modal-overlay");
  }
  protected getShowFooter(): boolean {
    return true;
  }
  protected createFooterActionBar(): void {
    super.createFooterActionBar();

    this.footerToolbar.updateCallback = (isResetInitialized: boolean) => {
      this.footerToolbarValue.actions.forEach(action => action.cssClasses = {
        item: "sv-popup__body-footer-item sv-popup__button sv-modal-popup__button sd-btn"
      });
    };

    this.footerToolbar.containerCss = "sv-footer-action-bar";
    let footerActions = [
      <IAction>{
        id: "cancel",
        visibleIndex: 10,
        title: this.cancelButtonText,
        innerCss: "sv-popup__button--cancel",
        action: () => { this.cancel(); }
      },
      <IAction>{
        id: "apply",
        visibleIndex: 20,
        title: this.applyButtonText,
        innerCss: "sv-popup__button--apply sd-btn--action",
        action: () => { this.apply(); }
      }
    ];

    footerActions = this.model.updateFooterActions(footerActions);
    this.footerToolbarValue.setItems(footerActions);
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

  private onScrollOutsideCallback = (event: WheelEvent) => {
    this.preventScrollOuside(event, event.deltaY);
  }

  public updateOnShowing(): void {
    if(this.container) {
      this.container.addEventListener("wheel", this.onScrollOutsideCallback, { passive: false });
    }
    super.updateOnShowing();
  }
  public updateOnHiding(): void {
    if(this.container) {
      this.container.removeEventListener("wheel", this.onScrollOutsideCallback);
    }
    super.updateOnHiding();
  }
}