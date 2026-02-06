import { LightningElement, api, track } from 'lwc';
import backButton from '@salesforce/label/c.BackButton';
import nextButton from '@salesforce/label/c.NextButton';
import configureProductsLabel from '@salesforce/label/c.ConfigureProductsLabel';
import configurePowerLabel from '@salesforce/label/c.ConfigurePowerLabel';
import configureGasLabel from '@salesforce/label/c.ConfigureGasLabel';

export default class PdProducts extends LightningElement {
    @track localState = {
        EE: {},
        GAS: {},
    };

    _globalContext;
    initialized = false;
    firstChildLoad = true;
    isEdit = false;
    _commodity;

    labels = {
        backButton,
        nextButton,
        configureProductsLabel,
        configurePowerLabel,
        configureGasLabel
    };

    @api
    get globalContext() {
        return this._globalContext;
    }

    set globalContext(value) {
        this._globalContext = value;
        
        if (value) {
            this._commodity = value.commodity; // Set commodity immediately
            
            // Check if we are in edit mode (products exist)
            if (value.products) {
                this.isEdit = true;
                // Merge incoming products into local state
                this.localState = { ...this.localState, ...value.products };
            }
            this.initialized = true;
        }
    }

    @api
    get invalidInput() {
        // Query all child components and check their validity
        const children = Array.from(this.template.querySelectorAll('c-pd-product'));
        // If any child returns true for invalidInput, the whole form is invalid
        return children.some(child => child.invalidInput());
    }

    // --- Event Handlers ---

    handleCpmReady(event) {
        // This handler ensures that when children are rendered, they get populated
        // We only push data down once per load to avoid overwriting user edits
        if (this.firstChildLoad && this.isEdit) {
            this.firstChildLoad = false;
            this.pushStateToChildren();
        }
    }

    handleStateChange(event) {
        const type = event.target.commodityType;
        const newState = event.detail;

        // Update local state and notify parent
        this.localState = {
            ...this.localState,
            [type]: newState
        };

        this.updateParent();
    }

    // --- Helpers ---

    pushStateToChildren() {
        // Dynamically find children and populate them
        const elements = this.template.querySelectorAll("c-pd-product");
        elements.forEach(el => {
            const prodState = this.localState[el.commodityType];
            if (prodState) {
                el.populate({ ...prodState, isCreate: false });
            }
        });
    }

    updateParent() {
        this.dispatchEvent(new CustomEvent('changestate', {
            detail: { products: this.localState }
        }));
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
