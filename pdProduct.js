import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import getPicklistValues from '@salesforce/apex/ProductConfigurationWizardCtrl.getPicklistValues';

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

const FIELDS = [
    "Product2.BillDeliveryMethod__c", 
    "Product2.BillingFrequency__c",
    "Product2.UseType__c",
    "Product2.Residence__c",
    "Product2.PowerCapacity__c",
    "Product2.PaymentMethod__c",
    "Product2.TouNumber__c",
    "Product2.Consumption__c",
    "Product2.CustomerAge__c",
    "Product2.Counter2G__c",
    "Product2.DurationWithPreviousSupplier__c",
    "Product2.SourceMarket__c",
    "Product2.ContractDuration__c",
    "Product2.PriceType__c",
    "Product2.PreviousSupplier__c",
    ];

export default class PdProduct extends LightningElement {

    @api commodityType;
    @api productId;
    @api isEdit;

    @api
    populate(state){
        // debugger
        this.retrievePicklistValues(state);
    }

    @api
    invalidInput(){
        // return true;
        let invalid = this.localState.useType.trim().length === 0 ||
        this.consumptionCollection.trim().length === 0 ||
        this.billingFrequencyCollection.trim().length === 0 ||
        this.paymentMethodCollection.trim().length === 0 ||
        this.billDeliveryMethodCollection.trim().length === 0 || 
        this.customerAgeCollection.trim().length === 0 || 
        this.durationWithPreviousSupplierCollection.trim().length === 0 || 
        this.sourceMarketCollection.trim().length === 0 || 
        this.previousSupplierCollection.trim().length === 0 ||
        this.residenceCollection.trim().length === 0 ||
        this.localState.priceType.length === 0 ||
        this.localState.contractDuration.length === 0;
        /* this.localState.residence.trim().length === 0 || */

        if (this.commodityType === "EE"){
            invalid = invalid ||
            this.localState.touNumber.length === 0 ||
            this.counter2GCollection.trim().length === 0 ||
            this.powerCapacityCollection.trim().length === 0;
        }
        return invalid;
    }

    @wire(getRecord, { recordId: "$productId", fields: FIELDS})
    wiredRecord({error, data}){
        if (data) {
            if (this.commodityType === "EE"){
                this.handleInputChange(this.passer(data.fields.TouNumber__c.value, "touNumber"))
                this.handleOnItemSelected(this.mplPasser(data.fields.Counter2G__c.value, "counter2G"))
                this.handleOnItemSelected(this.mplPasser(data.fields.PowerCapacity__c.value, "powerCapacity"))
            }
            // console.log(data.fields);

            this.handleInputChange(this.passer(data.fields.UseType__c.value, "useType"))
            this.handleInputChange(this.passer(data.fields.ContractDuration__c.value, "contractDuration"))
            this.handleInputChange(this.passer(data.fields.PriceType__c.value, "priceType"))        

            this.handleOnItemSelected(this.mplPasser(data.fields.Consumption__c.value, "consumption"))
            this.handleOnItemSelected(this.mplPasser(data.fields.BillDeliveryMethod__c.value, "billDeliveryMethod"))
            this.handleOnItemSelected(this.mplPasser(data.fields.BillingFrequency__c.value, "billingFrequency"))   
            this.handleOnItemSelected(this.mplPasser(data.fields.PaymentMethod__c.value, "paymentMethod"))
            this.handleOnItemSelected(this.mplPasser(data.fields.CustomerAge__c.value, "customerAge"))
            this.handleOnItemSelected(this.mplPasser(data.fields.DurationWithPreviousSupplier__c.value, "durationWithPreviousSupplier"))
            this.handleOnItemSelected(this.mplPasser(data.fields.SourceMarket__c.value, "sourceMarket"))
            this.handleOnItemSelected(this.mplPasser(data.fields.PreviousSupplier__c.value, "previousSupplier")) 
            this.handleOnItemSelected(this.mplPasser(data.fields.Residence__c.value, "residence"))

            this.resetAllMultiPicklists();
        }
    }

    @track localState = {
        touNumber: "",
        billingFrequency: "",
        powerCapacity: "",
        paymentMethod: "",
        billDeliveryMethod: "",
        residence: "",
        useType: "Domestico",
        consumption: "",
        customerAge: "",
        counter2G: "",
        durationWithPreviousSupplier: "",
        sourceMarket: "",
        previousSupplier: "",
        id: "",
        priceType: "",
        contractDuration: ""
    };

    isLoading = false;
    loadComplete = false;

    labels = {
        productSearchBarLabel,
        supplyAttributesLabel,
        touTariffs,
        powerCapacity,
        residence,
        useType,
        billingFrequency,
        paymentMethod,
        billDeliveryMethod,
        consumption,
        customerAge,
        counter2G,
        durationWithPreviousSupplier,
        sourceMarket,
        previousSupplier,
        priceType,
        contractDuration
    }

    billingFrequencyCollection = "";
    powerCapacityCollection = "";
    paymentMethodCollection = "";
    billDeliveryMethodCollection = "";
    customerAgeCollection = "";
    durationWithPreviousSupplierCollection = "";
    sourceMarketCollection = "";
    previousSupplierCollection = "";
    consumptionCollection = "";
    counter2GCollection = "";
    residenceCollection = "";
    
    connectedCallback() {
        this.dispatchEvent(new CustomEvent('productready', { bubbles: true, composed: true }));
        // debugger;
        // console.log('isEdit:',this.isEdit)
        if (!this.isEdit){
            this.retrievePicklistValues({isCreate : true});
        }
    }

    async retrievePicklistValues(state) {
        this.isLoading = true;
        try {
            // Simulate a call to retrieve picklist values
            const res = await getPicklistValues();
            this.consumptionOptions = res.consumptionTypes.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.consumptionOptionsReset = JSON.parse(JSON.stringify(this.consumptionOptions))

            this.counter2GOptions = res.counter2GTypes.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.counter2GOptionsReset = JSON.parse(JSON.stringify(this.counter2GOptions))

            this.billingFrequencyOptions = res.billingFrequencies.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.billingFrequencyOptionsReset = JSON.parse(JSON.stringify(this.billingFrequencyOptions))

            this.powerCapacityOptions = res.powerCapacities.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.powerCapacityOptionsReset = JSON.parse(JSON.stringify(this.powerCapacityOptions))

            this.paymentMethodOptions = res.paymentMethods.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.paymentMethodOptionsReset = JSON.parse(JSON.stringify(this.paymentMethodOptions))

            this.billDeliveryMethodOptions = res.billDeliveryMethods.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.billDeliveryMethodOptionsReset = JSON.parse(JSON.stringify(this.billDeliveryMethodOptions))

            this.customerAgeOptions = res.customerAges.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.customerAgeOptionsReset = JSON.parse(JSON.stringify(this.customerAgeOptions))

            this.durationWithPreviousSupplierOptions = res.durationWithPreviousSuppliers.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.durationWithPreviousSupplierOptionsReset = JSON.parse(JSON.stringify(this.durationWithPreviousSupplierOptions))

            this.sourceMarketOptions = res.sourceMarkets.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.sourceMarketOptionsReset = JSON.parse(JSON.stringify(this.sourceMarketOptions))

            this.residenceOptions = res.residences.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.residenceOptionsReset = JSON.parse(JSON.stringify(this.residenceOptions))

            this.previousSupplierOptions = res.previousSuppliers.map((item, index) => ({ key: index + 1, value: item.value, label: item.label }));
            this.previousSupplierOptionsReset = JSON.parse(JSON.stringify(this.previousSupplierOptions));

            this.touNumberOptions = res.touNumberOptions.map(item => ({ value: item.value, label: item.label }));
            this.useTypeOptions = res.useTypeOptions.map(item => ({ value: item.value, label: item.label }));
            this.contractDurationOptions = res.contractDurations.map(item => ({ label: item.label, value: item.value }));
            this.priceTypeOptions = res.priceTypes.map(item => ({ label: item.label, value: item.value }));

            if(!state.isCreate){
                this.initializeFields(state);
            }
            this.loadComplete = true;
        } catch (error) {
            console.error('Error retrieving picklist values:', JSON.stringify(error));
        } finally {
            this.isLoading = false;
        }
    } 

    initializeFields(state){
        console.log('Initialize products', JSON.stringify(state));
        if (this.commodityType === "EE"){
            this.handleInputChange(this.passer(state.touNumber, "touNumber"))
            this.handleOnItemSelected(this.mplPasser(state.counter2G.join(";"), "counter2G"))
            this.handleOnItemSelected(this.mplPasser(state.powerCapacity.join(";"), "powerCapacity"))
        }
        // console.log(data.fields);

        this.handleOnItemSelected(this.mplPasser(state.consumption.join(";"), "consumption"))
        this.handleInputChange(this.passer(state.useType, "useType"))
        this.handleInputChange(this.passer(state.id, "id"))
        this.handleInputChange(this.passer(state.contractDuration, "contractDuration"))
        this.handleInputChange(this.passer(state.priceType, "priceType"))
        
        this.handleOnItemSelected(this.mplPasser(state.billDeliveryMethod.join(";"), "billDeliveryMethod"))
        this.handleOnItemSelected(this.mplPasser(state.billingFrequency.join(";"), "billingFrequency"))   
        this.handleOnItemSelected(this.mplPasser(state.paymentMethod.join(";"), "paymentMethod"))
        this.handleOnItemSelected(this.mplPasser(state.customerAge.join(";"), "customerAge"))
        this.handleOnItemSelected(this.mplPasser(state.durationWithPreviousSupplier.join(";"), "durationWithPreviousSupplier"))
        this.handleOnItemSelected(this.mplPasser(state.sourceMarket.join(";"), "sourceMarket"))
        this.handleOnItemSelected(this.mplPasser(state.previousSupplier.join(";"), "previousSupplier"))          
        this.handleOnItemSelected(this.mplPasser(state.residence.join(";"), "residence"))
    }

    handleLookupChange(event){
        this.productId = event.detail.id;
    }

    mplPasser(value, field){
        let vals = value.split(";");

        // Workaround to use child functionality from parent
        // We set again the options of the field, but with selected the ones we want
        // Then we refresh so it appears on UI
        // Then we reset to default values and when submit, it will reset the view.

        let retVal = [...this[field+"Options"]]

        const changedElements = [];

        // For the received values, set them selected true
        retVal.forEach((item)=>{
            if (vals.includes(item.value)){
                item.selected = true;
                changedElements.push({...item});
            }
        })

        const multiPickLists = this.template.querySelectorAll('c-multi-pick-list');
        multiPickLists.forEach(item=> item.onRefreshClick());

        // this[field+"Options"] = JSON.parse(JSON.stringify(this[field+"OptionsReset"]))

        return {
                "detail": [...changedElements],
                "target": {
                    "name": field
                }
            }
    }


    passer(value, field){
        return {
                "detail": {
                    "value": value
                },
                "target": {
                    "name": field
                }
            }
    }
    
    updateState(field, value){
        this.localState[field] = value;
        this.updateParent();
    }

    updateParent(){
        this.dispatchEvent(new CustomEvent('changestate', {
                detail: this.localState
            }));
    }

    handleInputChange(event){
        this.updateState(event.target.name, event.detail.value);
    }

    handleOnItemSelected(event) {
        if (event.detail) {
            this[event.target.name + "Collection"] = '';
            let self = this;
            
            event.detail.forEach (function (eachItem) {
                    // console.log (eachItem.value);
                    self[event.target.name + "Collection"] += eachItem.value + ', ';
            });

            this.updateState(event.target.name, this[event.target.name + "Collection"].trim().slice(0, -1).split(",").map(item => item.trim()))

            // Array: JSON.stringify(this.selectedProcesses.trim().slice(0, -1).split(",").map(item => item.trim()))
        }
    }

    clearForm(){
        const multiPickLists = this.template.querySelectorAll('c-multi-pick-list');
        multiPickLists.forEach(item=> item.onRefreshClick());

        this.localState = {
            touNumber: "Monoraria",
            billingFrequency: "",
            powerCapacity: "",
            paymentMethod: "",
            billDeliveryMethod: "",
            residence: "",
            useType: "Domestico",
            consumption: "",
            customerAge: "",
            counter2G: "",
            durationWithPreviousSupplier: "",
            sourceMarket: "",
            previousSupplier: "",
            priceType: "",
            contractDuration: ""  
        };
    }

    resetAllMultiPicklists(){
        // for (let field in Object.keys(this.localState)){
        //     this[field+"Options"] = JSON.parse(JSON.stringify(this[field+"OptionsReset"]))
        // }

        this.billingFrequencyOptions = JSON.parse(JSON.stringify(this.billingFrequencyOptionsReset))
        this.powerCapacityOptions = JSON.parse(JSON.stringify(this.powerCapacityOptionsReset))
        this.paymentMethodOptions = JSON.parse(JSON.stringify(this.paymentMethodOptionsReset))
        this.billDeliveryMethodOptions = JSON.parse(JSON.stringify(this.billDeliveryMethodOptionsReset))
        this.customerAgeOptions = JSON.parse(JSON.stringify(this.customerAgeOptionsReset))
        this.durationWithPreviousSupplierOptions = JSON.parse(JSON.stringify(this.durationWithPreviousSupplierOptionsReset))
        this.sourceMarketOptions = JSON.parse(JSON.stringify(this.sourceMarketOptionsReset))
        this.previousSupplierOptions = JSON.parse(JSON.stringify(this.previousSupplierOptionsReset))
        this.consumptionOptions = JSON.parse(JSON.stringify(this.consumptionOptionsReset))
        this.counter2GOptions = JSON.parse(JSON.stringify(this.counter2GOptionsReset))
        this.residenceOptions = JSON.parse(JSON.stringify(this.residenceOptionsReset))
    }

    get recordTypeFilter() {
        return "RecordType.Name = 'Parent' AND ProductType__c = '" + this.commodityType + "'"; 
    }

    get powerDisable(){
        return this.commodityType === "GAS"
    }
}
