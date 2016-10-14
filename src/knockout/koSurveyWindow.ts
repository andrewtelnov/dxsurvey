﻿import * as ko from "knockout";
import SurveyWindowModel from "../surveyWindow";
import SurveyModel from "../survey";
import SurveyBase from "./kosurvey";
import {html} from './template.window.ko.html'

export default class SurveyWindowBase extends SurveyWindowModel {
    koExpanded: any;
    doExpand: any;
    constructor(jsonObj: any) {
        super(jsonObj);
        this.koExpanded = ko.observable(false);
        var self = this;
        this.doExpand = function () { self.changeExpanded(); }
        this.survey.onComplete.add((sender: SurveyModel) => { self.onComplete(); });
    }
    protected createSurvey(jsonObj: any): SurveyModel {
        return new SurveyBase(jsonObj)
    }
    protected expandcollapse(value: boolean) {
        super.expandcollapse(value);
        this.koExpanded(this.isExpandedValue);
    }
    protected get template(): string { return this.templateValue ? this.templateValue : this.getDefaultTemplate(); }
    protected set template(value: string) { this.templateValue = value; }
    public show() {
        this.windowElement.innerHTML = this.template;
        ko.cleanNode(this.windowElement);
        ko.applyBindings(this, this.windowElement);
        document.body.appendChild(this.windowElement);
        (<SurveyBase>this.survey).render(SurveyWindowBase.surveyElementName);
        this.isShowingValue = true;
    }
    protected getDefaultTemplate(): string { return html }
    public hide() {
        document.body.removeChild(this.windowElement);
        this.windowElement.innerHTML = "";
        this.isShowingValue = false;
    }
    public get css(): any { return this.survey["css"]; }
    private changeExpanded() {
        this.expandcollapse(!this.isExpanded);
    }
    private onComplete() {
        this.hide();
    }
    private getButtonCss() {
        return this.koExpanded() ? this.css.window.header.buttonCollapsed : this.css.window.header.buttonExpanded;
    }
}