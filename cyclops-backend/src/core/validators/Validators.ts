import {CreatePurchaseOrderRequest, CreatePurchaseOrderRequestValidator} from "../../models/payment/CreatePurchaseOrderRequest";

export class Validators {

    validatorsMap = {
        CreatePaymentSessionRequest: (data: any) => {CreatePurchaseOrderRequestValidator.safeParse(data)}
    }

    validate(obj: any) {
        // get the validator by object type
        // throw error if the validator is not found
    }



}