import { LightningElement, api, track } from 'lwc';
import backButton from '@salesforce/label/c.BackButton';
import nextButton from '@salesforce/label/c.NextButton';
import configureProductsLabel from '@salesforce/label/c.ConfigureProductsLabel';
import configurePowerLabel from '@salesforce/label/c.ConfigurePowerLabel';
import configureGasLabel from '@salesforce/label/c.ConfigureGasLabel';

export default class PdProducts extends LightningElement {
    @api state;
    @api stateId;

    initialized = false;
    _globalContext;
    @api set globalContext(value) {
        this._globalContext = value;

        if (!this.initialized && value != undefined && value.products) {
            this.localState = this.copyToFrom(this.localState, value);
        }
        if (value != undefined) { 
            this.initialized = true
            if (value.products) this.isEdit = true;
        };
    };
    get globalContext() {
        return this._globalContext;
    }

    @api get invalidInput() {
        let invalid = true;
        const el = this.template.querySelectorAll('c-pd-product');
        if (el.length === 1) {
            invalid = el[0].invalidInput();
        }
        else if (el.length === 2) {
            invalid = el[0].invalidInput() || el[1].invalidInput();
        }
        return invalid;
    }

    @track localState = {
        EE: "",
        GAS: "",
    };
    
    labels = {
        backButton,
        nextButton,
        configureProductsLabel,
        configurePowerLabel,
        configureGasLabel
    }

    _commodity;

    firstChildLoad = true;

    isEdit;

    loadStateRecord(source) {
        console.log("Started loading from", source);
        try {
            const tempState = { ...this.globalContext }
            if (tempState.products) {
                const elements = this.template.querySelectorAll("c-pd-product");
                for (let el of elements) {
                    el.populate({ ...(tempState.products[el.commodityType]), isCreate: false });
                }
            }
            this._commodity = this.globalContext.commodity;
            console.log("Finished loading from", source);
        } catch (error) {
            console.log("Error while loading from", source)
        }
    }

    handleCpmReady() {
        // console.log("Child Handler")
        if (this.firstChildLoad) {
            this.firstChildLoad = false;
            this.loadStateRecord("Child Handler");
        }

        const accordionSections = this.template.querySelectorAll("lightning-accordion-section");
        if (accordionSections.length == 2) {
            const tempState = { ...this.globalContext }
            if (tempState.products) {
                const elements = this.template.querySelectorAll("c-pd-product");
                const el = elements[1];
                el.populate({ ...(tempState.products[el.commodityType]), isCreate: false });
            }
        }
    }

    handleStateChange(event) {
        this.localState[event.target.commodityType] = { ...event.detail }
        this.updateParent();
    }

    updateParent() {
        this.dispatchEvent(new CustomEvent('changestate', {
            detail: { products: this.localState }
        }));
    }

    copyToFrom(localState, source) {
        const picked = Object.fromEntries(
            Object.keys(localState).map(k => [k, source.hasOwnProperty(k) ? source[k] : localState[k]])
        );
        return { ...localState, ...picked };
    }

    get com() {
        return this._commodity === 'DUAL' ? "EE" : this._commodity;
    }

    get wantGas() {
        return this._commodity !== "EE";
    }

    get wantPower() {
        return this._commodity !== "GAS";
    }
}
