function FormBuilder(pars) {

    var _this = this;

    this.params = isDefined(pars, {});
    this.formValidator = null;
    this.id = new Date().getTime();

    this.uploader = this.params.form_uploader;

    if (!isDefined(this.params.form_selector)) {

        //console.log("Need to include a form selector parameter - form_selector");

        return false;

    }

    this.form = $(this.params.form_selector);

    if (this.form.length == 0) {

        //console.log("The form selector is returning 0 elements")

        return false;

    }

    if (!isDefined(this.params.submit_selector)) {

        //console.log("Need to include a submit button selector parameter - submit_selector")

        return false;

    }

    this.submitButton = $(this.params.submit_selector, this.form);

    if (this.submitButton.length == 0) {

        //console.log("The submit button selector is returning 0 elements")

        return false;

    }


    this.submitButton.data('form', this.form);

    if (!(this.submitButton.attr('type') == "submit")) {

        this.submitButton.bind('click', function (e) {
            e.preventDefault();
            if (_this.form.valid()) _this.form.submit();
        });

    }

    if (isDefined(this.params.validation)) {

        this.createValidation(this.params.validation);

        if (isDefined(this.params.validation.conditional_required)) {

            this.createConditionalRequired(this.params.validation.conditional_required);

        }

    }

    jQuery.validator.addMethod('selectcheck', function (value) {
        return (value != '0');
    }, "year required");

    jQuery.validator.addMethod('postalcode_pt', function (value) {
        var pattern = /[0-9]{4}\-[0-9]{3}/;
        return ( (pattern.test(value) && value.length == 8) || value == "");
    });

    jQuery.validator.addMethod('breeders_code', function (value) {
        return ( value.length == 4 || value.length == 0 );
    });

    jQuery.validator.addMethod('where_to_buy', function (value) {
        return (value != "");
    });

    jQuery.validator.addMethod('select_required', function (value) {
        return (value != "");
    });

    jQuery.validator.addMethod('added_pets', function (value) {
        if (value != "" ){
            var jData = $.parseJSON(decodeURIComponent(value));
            if ( jData != null && jData.length > 0 ){
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }

    });

};
