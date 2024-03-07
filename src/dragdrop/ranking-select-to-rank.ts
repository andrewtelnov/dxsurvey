import { ItemValue } from "../itemvalue";
import { DragDropRankingChoices } from "./ranking-choices";
import { QuestionRankingModel } from "../question_ranking";

export class DragDropRankingSelectToRank extends DragDropRankingChoices {
  protected findDropTargetNodeByDragOverNode(
    dragOverNode: HTMLElement
  ): HTMLElement {
    if (dragOverNode.dataset.ranking === "from-container" || dragOverNode.dataset.ranking === "to-container") {
      return dragOverNode;
    }

    let toContainer: HTMLElement = dragOverNode.closest("[data-ranking='to-container']");
    let fromContainer: HTMLElement = dragOverNode.closest("[data-ranking='from-container']");

    if (this.parentElement.rankingChoices.length === 0 && !!toContainer) return toContainer;
    if (this.parentElement.unRankingChoices.length === 0 && !!fromContainer) return fromContainer;

    return super.findDropTargetNodeByDragOverNode(dragOverNode);
  }

  protected getDropTargetByDataAttributeValue(dataAttributeValue: string): ItemValue {
    return this.parentElement.rankingChoices[dataAttributeValue] || this.parentElement.unRankingChoices[dataAttributeValue];
  }

  protected getDropTargetByNode(
    dropTargetNode: HTMLElement,
    event: PointerEvent
  ): any {
    if (dropTargetNode.dataset.ranking === "to-container") {
      return "to-container";
    }

    if (dropTargetNode.dataset.ranking === "from-container" || dropTargetNode.closest("[data-ranking='from-container']")) {
      return "from-container";
    }

    return super.getDropTargetByNode(dropTargetNode, event);
  }

  protected isDropTargetValid(
    dropTarget: ItemValue | string,
    dropTargetNode?: HTMLElement
  ): boolean {
    if (dropTarget === "to-container" || dropTarget === "from-container") {
      return true;
    } else {
      return super.isDropTargetValid(<ItemValue>dropTarget, dropTargetNode);
    }
  }

  protected afterDragOver(dropTargetNode: HTMLElement): void {
    const questionModel: any = this.parentElement;
    const rankingChoices = questionModel.rankingChoices;
    const unRankingChoices = questionModel.unRankingChoices;

    this.removeAllAnimationClasses();

    if (this.isDraggedElementUnranked && this.isDropTargetRanked) {
      this.doRankBetween(dropTargetNode, unRankingChoices, rankingChoices, this.selectToRank);
      return;
    }

    if (this.isDraggedElementRanked && this.isDropTargetRanked) {
      this.doRankBetween(dropTargetNode, rankingChoices, rankingChoices, this.reorderRankedItem);
      return;
    }

    if (this.isDraggedElementRanked && !this.isDropTargetRanked) {
      this.doRankBetween(dropTargetNode, rankingChoices, unRankingChoices, this.unselectFromRank);
      return;
    }
  }

  public doRankBetween(
    dropTargetNode: HTMLElement,
    fromChoicesArray: Array<ItemValue>,
    toChoicesArray: Array<ItemValue>,
    rankFunction: Function
  ): void {
    const questionModel: any = this.parentElement;

    let { fromIndex, toIndex } = this.getIndixies(questionModel, fromChoicesArray, toChoicesArray);

    rankFunction(questionModel, fromIndex, toIndex, dropTargetNode);
  }

  public getIndixies(model: any, fromChoicesArray: Array<ItemValue>, toChoicesArray: Array<ItemValue>) {
    let fromIndex = fromChoicesArray.indexOf(this.draggedElement);
    let toIndex = toChoicesArray.indexOf(this.dropTarget);

    if (toIndex === -1) {
      const length = model.value.length;
      toIndex = fromChoicesArray === toChoicesArray ? length - 1 : length;
    }

    return { fromIndex, toIndex };
  }

  private doUIEffects(dropTargetNode: HTMLElement, fromIndex: number, toIndex: number) {
    const questionModel: any = this.parentElement;
    const isDropToEmptyRankedContainer = this.dropTarget === "to-container" && questionModel.isEmpty();
    const isNeedToShowIndexAtShortcut = !this.isDropTargetUnranked || isDropToEmptyRankedContainer;
    const shortcutIndex = isNeedToShowIndexAtShortcut ? toIndex + 1 : null;

    this.updateDraggedElementShortcut(shortcutIndex);

    if (fromIndex !== toIndex) {
      dropTargetNode.classList.remove("sv-dragdrop-moveup");
      dropTargetNode.classList.remove("sv-dragdrop-movedown");
      questionModel.dropTargetNodeMove = null;
    }

    if (fromIndex > toIndex) {
      questionModel.dropTargetNodeMove = "down";
    }

    if (fromIndex < toIndex) {
      questionModel.dropTargetNodeMove = "up";
    }
  }

  private get isDraggedElementRanked() {
    return this.parentElement.rankingChoices.indexOf(this.draggedElement) !== -1;
  }

  private get isDropTargetRanked() {
    if (this.dropTarget === "to-container") return true;
    return this.parentElement.rankingChoices.indexOf(this.dropTarget) !== -1;
  }

  private get isDraggedElementUnranked() {
    return !this.isDraggedElementRanked;
  }

  private get isDropTargetUnranked() {
    return !this.isDropTargetRanked;
  }

  public selectToRank = (questionModel: QuestionRankingModel, fromIndex: number, toIndex: number, dropTargetNode: HTMLElement): void => {
    const rankingChoices = questionModel.rankingChoices;
    const unRankingChoices = questionModel.unRankingChoices;
    const item = unRankingChoices[fromIndex];

    const animationCallback = ()=> {
      questionModel.isValueSetByUser = true;
      rankingChoices.splice(toIndex, 0, item);
      questionModel.setPropertyValue("rankingChoices", rankingChoices);
    };
    this.animateItemMovingToContainer(questionModel, item, animationCallback);
  }

  public unselectFromRank = (questionModel: QuestionRankingModel, fromIndex: number, toIndex?: number): void => {
    const rankingChoices = questionModel.rankingChoices;
    const item = rankingChoices[fromIndex];

    const animationCallback = ()=> {
      questionModel.isValueSetByUser = true;
      rankingChoices.splice(fromIndex, 1);
      questionModel.setPropertyValue("rankingChoices", rankingChoices);
    };
    this.animateItemMovingToContainer(questionModel, item, animationCallback);
  }

  private animateItemMovingToContainer = (questionModel: QuestionRankingModel, itemToAnimateAdding:ItemValue, callbackOnAnimationEnd:()=>void) => {
    const ghostNode:any = document.querySelectorAll(".sv-ranking-item--ghost")[0];

    if (!ghostNode) {
      callbackOnAnimationEnd();
      return;
    }

    const handleAnimationEnd = (event: any) => {
      if (event.target !== ghostNode) { return; }
      //if (event.propertyName !== "height") { return; }
      if (getComputedStyle(event.target).height !== "0px") { return; }
      ghostNode.removeEventListener("animationend", handleAnimationEnd);
      this.removeAllAnimationClasses();
      questionModel.itemsToAnimateAdding.push(itemToAnimateAdding);
      callbackOnAnimationEnd();
    };

    ghostNode.removeEventListener("animationend", handleAnimationEnd);
    this.removeAllAnimationClasses();
    ghostNode.addEventListener("animationend", handleAnimationEnd);
    ghostNode.classList.add("sv-ranking-item--animate-item-removing");
  }

  public reorderRankedItem = (questionModel: QuestionRankingModel, fromIndex: number, toIndex: number, dropTargetNode: HTMLElement): void => {
    const rankingChoices = questionModel.rankingChoices;
    const item = rankingChoices[fromIndex];

    questionModel.isValueSetByUser = true;
    rankingChoices.splice(fromIndex, 1);
    rankingChoices.splice(toIndex, 0, item);
    questionModel.setPropertyValue("rankingChoices", rankingChoices);

    this.doUIEffects(dropTargetNode, fromIndex, toIndex);
  }

  protected doDrop = (): any => {
    this.removeAllAnimationClasses();
    super.doDrop();
  };

  public clear(): void {
    this.removeAllAnimationClasses();
    super.clear();
  }

  private removeAllAnimationClasses() {
    this.parentElement.itemsToAnimateAdding = [];
    document.querySelectorAll(".sv-ranking-item--animate-item-removing").forEach((node)=>{
      node.classList.remove("sv-ranking-item--animate-item-removing");
    });
    document.querySelectorAll(".sv-ranking-item--animate-item-adding").forEach((node)=>{
      node.classList.remove("sv-ranking-item--animate-item-adding");
    });
  }
}
