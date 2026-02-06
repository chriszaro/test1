import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getPicklistValues from '@salesforce/apex/ProductConfigurationWizardCtrl.getPicklistValues';

// Import Labels (Keeping your imports)
import productSearchBarLabel from '@salesforce/label/c.ProductSearchBarLabel';
import supplyAttributesLabel from '@salesforce/label/c.SupplyAttributesLabel';
import touTariffs from '@salesforce/label/c.touTariffs';
import powerCapacity from '@salesforce/label/c.PowerCapacity';
import residence from '@salesforce/label/c.Residence';
import useType from '@salesforce/label/c.UseType';
import billingFrequency from '@salesforce/label/c.BillingFrequency';
import paymentMethod from '@salesforce/label/c.PaymentMethod';
import billDeliveryMethod from '@salesforce/label/c.BillDeliveryMethod';
import consumption from '@salesforce/label/c.Consumption';
import customerAge from '@salesforce/label/c.CustomerAge';
import counter2G from '@salesforce/label/c.Counter2G';
import durationWithPreviousSupplier from '@salesforce/label/c.DurationWithPreviousSupplier';
import sourceMarket from '@salesforce/label/c.SourceMarket';
import previousSupplier from '@salesforce/label/c.PreviousSupplier';
import priceType from '@salesforce/label/c.PriceType';
import contractDuration from '@salesforce/label/c.ContractDuration';

// Configuration for Fields to reduce switch/case complexity
const FIELD_MAPPING = {
    // SF Field API Name : Local State Key
    "BillDeliveryMethod__c": "billDeliveryMethod",
    "BillingFrequency__c": "billingFrequency",
    "UseType__c": "useType",
    "Residence__c": "residence",
    "PowerCapacity__c": "powerCapacity",
    "PaymentMethod__c": "paymentMethod",
    "TouNumber__c": "touNumber",
    "Consumption__c": "consumption",
    "CustomerAge__c": "customerAge",
    "Counter2G__c": "counter2G",
    "DurationWithPreviousSupplier__c": "durationWithPreviousSupplier",
    "SourceMarket__c": "sourceMarket",
    "ContractDuration__c": "contractDuration",
    "PriceType__c": "priceType",
    "PreviousSupplier__c": "previousSupplier"
};

const FIELDS = Object.keys(FIELD_MAPPING).map(key => `Product2.${key}`);

const REQUIRED_FIELDS = [
    "useType", "consumption", "billingFrequency", "paymentMethod", 
    "billDeliveryMethod", "customerAge", "durationWithPreviousSupplier", 
    "sourceMarket", "previousSupplier", "residence", "priceType", "contractDuration"
];

const REQUIRED_FIELDS_EE = ["touNumber", "counter2G", "powerCapacity"];

export default class PdProduct extends LightningElement {

    @api commodityType;
    @api productId;
    @api isEdit;

    @track localState = this.getInitialState();
    
    // Consolidate all options into one object
    @track optionsMap = {}; 
    // Store raw API responses to reset easily
    _rawOptions = {};

    isLoading = false;
    loadComplete = false;

    labels = {
        productSearchBarLabel, supplyAttributesLabel, touTariffs, powerCapacity,
        residence, useType, billingFrequency, paymentMethod, billDeliveryMethod,
        consumption, customerAge, counter2G, durationWithPreviousSupplier,
        sourceMarket, previousSupplier, priceType, contractDuration
    };

    connectedCallback() {
        this.dispatchEvent(new CustomEvent('productready', { bubbles: true, composed: true }));
        if (!this.isEdit) {
            this.retrievePicklistValues({ isCreate: true });
        }
    }

    getInitialState() {
        return {
            touNumber: "", billingFrequency: "", powerCapacity: "", paymentMethod: "",
            billDeliveryMethod: "", residence: "", useType: "Domestico", consumption: "",
            customerAge: "", counter2G: "", durationWithPreviousSupplier: "", sourceMarket: "",
            previousSupplier: "", id: "", priceType: "", contractDuration: ""
        };
    }

    // --- API Methods ---

    @api
    populate(state) {
        this.retrievePicklistValues(state);
    }

    @api
    invalidInput() {
        // Validate Generic Fields
        let invalid = REQUIRED_FIELDS.some(field => {
            const val = this.localState[field];
            return !val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim().length === 0);
        });

        // Validate EE Specific Fields
        if (this.commodityType === "EE") {
            const invalidEE = REQUIRED_FIELDS_EE.some(field => {
                const val = this.localState[field];
                return !val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && val.trim().length === 0);
            });
            invalid = invalid || invalidEE;
        }

        return invalid;
    }

    // --- Data Loading ---

    @wire(getRecord, { recordId: "$productId", fields: FIELDS })
    wiredRecord({ error, data }) {
        if (data) {
            const newState = {};
            // Map Salesforce fields to Local State using the config map
            Object.keys(FIELD_MAPPING).forEach(sfField => {
                if (data.fields[sfField] && data.fields[sfField].value != null) {
                    const localKey = FIELD_MAPPING[sfField];
                    let val = data.fields[sfField].value;
                    
                    // If it's a multi-picklist (contains semicolon), split it
                    if (typeof val === 'string' && val.includes(';')) {
                         val = val.split(';');
                    } else if (typeof val === 'string') {
                        // Keep simple strings as is
                    }
                    
                    newState[localKey] = val;
                }
            });
            
            // Merge into local state
            this.localState = { ...this.localState, ...newState };
            
            // Refresh the UI selections
            this.syncOptionsWithState();
            this.updateParent();
        }
    }

    async retrievePicklistValues(state = {}) {
        this.isLoading = true;
        try {
            const res = await getPicklistValues();
            
            // Transform APEX response to standard Option format {label, value, key}
            const transform = (arr) => arr ? arr.map((item, index) => ({ key: index + 1, value: item.value, label: item.label, selected: false })) : [];
            const transformSimple = (arr) => arr ? arr.map(item => ({ label: item.label, value: item.value })) : [];

            // Store raw options for resetting later
            this._rawOptions = {
                consumption: transform(res.consumptionTypes),
                counter2G: transform(res.counter2GTypes),
                billingFrequency: transform(res.billingFrequencies),
                powerCapacity: transform(res.powerCapacities),
                paymentMethod: transform(res.paymentMethods),
                billDeliveryMethod: transform(res.billDeliveryMethods),
                customerAge: transform(res.customerAges),
                durationWithPreviousSupplier: transform(res.durationWithPreviousSuppliers),
                sourceMarket: transform(res.sourceMarkets),
                residence: transform(res.residences),
                previousSupplier: transform(res.previousSuppliers),
                // Simple Combobox options
                touNumber: transformSimple(res.touNumberOptions),
                useType: transformSimple(res.useTypeOptions),
                contractDuration: transformSimple(res.contractDurations),
                priceType: transformSimple(res.priceTypes)
            };

            // Initialize active options map
            this.optionsMap = JSON.parse(JSON.stringify(this._rawOptions));

            if (!state.isCreate) {
                // Merge incoming state
                this.localState = { ...this.localState, ...state };
                this.syncOptionsWithState();
            }
            
            this.loadComplete = true;
        } catch (error) {
            console.error('Error retrieving picklist values:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // --- State Synchronization ---

    /**
     * Iterates over current localState and marks the corresponding options as selected
     * in the optionsMap for the Multi-Pick-List components.
     */
    syncOptionsWithState() {
        Object.keys(this.optionsMap).forEach(key => {
            // Only process if it's a multi-select list (has 'key' property in items)
            if (this.optionsMap[key].length > 0 && this.optionsMap[key][0].hasOwnProperty('key')) {
                
                const currentStateVal = this.localState[key];
                // Ensure current value is an array for comparison
                const selectedValues = Array.isArray(currentStateVal) ? currentStateVal : (currentStateVal ? [currentStateVal] : []);

                // Map over options and set 'selected'
                this.optionsMap[key] = this._rawOptions[key].map(opt => ({
                    ...opt,
                    selected: selectedValues.includes(opt.value)
                }));
            }
        });

        // Trigger refresh on child components if they require imperative method call
        // setTimeout ensures DOM is rendered if this is called during load
        setTimeout(() => {
            const multiPickLists = this.template.querySelectorAll('c-multi-pick-list');
            multiPickLists.forEach(item => item.onRefreshClick());
        }, 0);
    }

    // --- Event Handlers ---

    handleLookupChange(event) {
        this.productId = event.detail.id; // Triggers @wire
    }

    handleInputChange(event) {
        const field = event.target.name;
        const value = event.detail.value;
        this.updateState(field, value);
    }

    handleOnItemSelected(event) {
        if (event.detail) {
            const field = event.target.name;
            // Extract values from the detail array objects
            const values = event.detail.map(item => item.value);
            this.updateState(field, values);
        }
    }

    updateState(field, value) {
        this.localState = { ...this.localState, [field]: value };
        this.updateParent();
    }

    updateParent() {
        this.dispatchEvent(new CustomEvent('changestate', {
            detail: this.localState
        }));
    }

    clearForm() {
        this.localState = this.getInitialState();
        this.optionsMap = JSON.parse(JSON.stringify(this._rawOptions)); // Reset options
        
        // Refresh children
        setTimeout(() => {
            const multiPickLists = this.template.querySelectorAll('c-multi-pick-list');
            multiPickLists.forEach(item => item.onRefreshClick());
        }, 0);
    }

    // --- Getters ---

    get recordTypeFilter() {
        return `RecordType.Name = 'Parent' AND ProductType__c = '${this.commodityType}'`;
    }

    get powerDisable() {
        return this.commodityType === "GAS";
    }
}
