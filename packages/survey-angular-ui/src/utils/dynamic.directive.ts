import { Directive, ElementRef, Input, OnChanges, SimpleChanges, ViewContainerRef } from "@angular/core";
import { AngularComponentFactory } from "../component-factory";

interface IDynamicComponent {
  name: string;
  data?: any;
  default?: string;
}

@Directive({
  selector: "[component]"
})

export class DynamicComponentDirective implements OnChanges {
  constructor(private containerRef: ViewContainerRef) { }
  @Input() component!: IDynamicComponent;
  private componentInstance: any;
  ngOnChanges(changes: SimpleChanges): void {
    const componentChanges = changes["component"];
    if(componentChanges.currentValue.name !== componentChanges.previousValue?.name) {
      this.createComponent();
    } else {
      this.updateComponentData();
    }
  }
  createComponent(): void {
    this.containerRef.clear();
    if(AngularComponentFactory.Instance.isComponentRegistered(this.component.name)) {
      this.componentInstance = AngularComponentFactory.Instance.create(this.containerRef, this.component.name).instance;
    } else if (this.component.default) {
      this.componentInstance = AngularComponentFactory.Instance.create(this.containerRef, this.component.default).instance;
    }
    this.updateComponentData();
  }
  updateComponentData(): void {
    const data = this.component.data;
    Object.keys(data).forEach((key) => {
      this.componentInstance[key] = data[key];
    });
  }
}