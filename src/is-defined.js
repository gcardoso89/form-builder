function isDefined(objectToValidate, defaultValue) {

    if (typeof(objectToValidate) === "undefined") {

        if (typeof(defaultValue) === "undefined") {

            return false;

        }

        else {

            return defaultValue;

        }

    }

    else {

        if (typeof(defaultValue) === "undefined") {

            return true;

        }

        else {

            return objectToValidate;

        }

    }


}